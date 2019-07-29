/**
 * Database plugin
 * @module
 */
const Hoek = require('@hapi/hoek');
const Package = require('package.json');
const Config = require('config');
const KnexConfig = require('knexfile');

setDebug(); // Need to setup environment variables before loading knex

const Objection = require('objection');
const Knex = require('knex');

const internals = {};
internals.initialize = async function() {
    internals.config = KnexConfig[Config.environment];

    // database connection is required
    Hoek.assert(internals.config.connection, 'no connection configured');

    // database name is required for all but sqlite
    Hoek.assert(
        internals.config.client.indexOf('sqlite') !== -1 || internals.config.connection.database,
        'no database configured'
    );

    internals.knex = Knex(internals.config);

    return internals.knex.raw('select 1+1 as result').then(data => {
        // sqlite and postgres behave differently on raw queries
        const result = data.rows ? data.rows[0].result : data[0].result;
        Hoek.assert(result === 2, 'database connection test returned wrong result');
    });
};

/**
 * Plugin registration function
 * @async
 * @param {Hapi.Server} server the hapi server
 */
const register = async function(server) {
    try {
        await internals.initialize();
    } catch (err) {
        // make sure we log error before exiting
        server.logger().error({ plugin: exports.plugin.name }, err.message);
        throw err;
    }

    internals.Model = Objection.Model;
    internals.Model.knex(internals.knex);

    // not really needed, but just in case we want to test
    // some db stuff directly from a controller..
    server.decorate('server', 'db', {
        query: internals.knex,
        model: internals.Model
    });

    server.ext('onPreStop', server => {
        server
            .logger()
            .child({ plugin: exports.plugin.name })
            .debug('stopped');
    });

    server.ext('onPostStop', () => {
        internals.knex.destroy();
    });

    server
        .logger()
        .child({ plugin: exports.plugin.name })
        .debug('plugin');
};

exports.plugin = {
    name: 'db',
    pkg: Package,
    register
};

function setDebug() {
    const knexConfig = KnexConfig[Config.environment];
    Hoek.assert(typeof knexConfig === 'object', 'knex config is invalid');

    if (!knexConfig.debug) {
        return;
    }

    if (!Config.debug) {
        delete knexConfig.debug;
        return;
    }

    const debugTypes = Object.keys(knexConfig.debug);
    const debug = debugTypes.reduce(function(acc, current, index) {
        if (!knexConfig.debug[current]) {
            return acc;
        }

        if (index > 0) {
            acc += ',';
        }

        return acc + 'knex:' + current;
    }, '');
    process.env.DEBUG = debug;
    delete knexConfig.debug; // not needed, using DEBUG env instead.
}
