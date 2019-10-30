const User = require('models/authorization/user');

exports.up = function(knex) {
    return Promise.all([
        knex.schema.createTable('user', function(table) {
            table.increments().primary();
            table.string('username');
            table.unique('username');
            table.string('email');
            table.unique('email');
            table.string('password');
            table.timestamps();
        }),
        knex.schema.createTable('role', function(table) {
            table.increments().primary();
            table.string('name');
            table.unique('name');
            table.timestamps();
        }),
        knex.schema.createTable('user_role', function(table) {
            table
                .integer('user_id')
                .unsigned()
                .references('id')
                .inTable('user');
            table
                .integer('role_id')
                .unsigned()
                .references('id')
                .inTable('role');
            table.unique(['user_id', 'role_id']);
            table.timestamps();
        })
    ]);
};

exports.down = async function(knex) {
    await knex.schema.dropTableIfExists('user_role');

    return Promise.all([
        knex.schema.dropTableIfExists('user'),
        knex.schema.dropTableIfExists('role')
    ]);
};
