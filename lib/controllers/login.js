'use strict';

var Boom = require('boom');
var Url = require('url');
var UserService = require('../services/user');
var Auth = require('../plugins/auth');
var Config = require('../config');

var internals = {};
internals.adminUrl = {
    protocol: 'https',
    slashes: true,
    hostname: Config.connections.webTls.host,
    port: Config.connections.webTls.port
};

internals.cookieOptions = {
    ttl: 365 * 24 * 60 * 60 * 1000, // expires a year from today
    encoding: 'none', // we already used JWT to encode
    isSecure: true, // warm & fuzzy feelings
    isHttpOnly: true, // prevent client alteration
    clearInvalid: false, // remove invalid cookies
    strictHeader: true // don't allow violations of RFC 6265
};

exports.login = function(request, reply) {

    var user = UserService.getByEmail(request.payload.email, request.payload.password);

    if (!user) {
        return reply(Boom.unauthorized('Invalid email address'));
    }

    if (user.password !== request.payload.password) {
        return reply(Boom.unauthorized('Bad password'));
    }

    var token = Auth.getToken(user.id);

    return reply.redirect(Url.format(internals.adminUrl) + Config.prefixes.admin)
        .header('Authorization', token)
        .state('token', token, internals.cookieOptions); // store token in cookie
};