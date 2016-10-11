'use strict';

var Joi = require('joi');
var Config = require('../config');
var LoginCtrl = require('../controllers/login');
var Package = require('../../package.json');

exports.register = function(server, options, next) {

    server.route({
        path: Config.paths.login,
        method: 'POST',
        config: {
            auth: false,
            validate: {
                payload: {
                    email: Joi.string().email().required(),
                    password: Joi.string().min(3).max(200).required()
                }
            },
            handler: LoginCtrl.login
        }
    });

    server.route({
        path: '/logout',
        method: 'GET',
        handler: LoginCtrl.logout
    });

    return next();

};

exports.register.attributes = {
    name: 'login',
    pkg: Package
};