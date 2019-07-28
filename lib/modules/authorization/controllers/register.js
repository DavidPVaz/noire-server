/**
 * Register Controller
 * @module
 */
const Hoek = require('@hapi/hoek');
const Auth = require('plugins/auth');
const NSError = require('errors/nserror');
const ContactService = require('modules/authorization/services/contacts');

const internals = {};
internals.registerResponse = {
    success: true,
    message: 'registered'
};

/**
 * Validates the signup token and shows the registration form
 * @param {Request} request the request object
 * @param {Toolkit h the response toolkit
 * @returns {Response} the response object
 */
exports.showRegister = async function(request, h) {
    try {
        // make sure we got a valid token before rendering registration form
        await Auth.decodeToken(request.query.token, Auth.token.SIGNUP);
    } catch (error) {
        request.logger.debug({ message: error.message }, 'registration failure');
        throw NSError.AUTH_UNAUTHORIZED('Authentication failure');
    }

    return h.view('pages/register');
};

/**
 * Registers a user
 * @param {Request} request the request object
 * @param {Toolkit} h the response toolkit
 * @returns {Response} the response object
 */
exports.register = async function(request, h) {
    let id;

    try {
        id = (await Auth.decodeToken(request.query.token, Auth.token.SIGNUP)).id;
    } catch (error) {
        request.logger.debug({ message: error.message }, 'registration failure');
        throw NSError.AUTH_UNAUTHORIZED('Authentication Failure');
    }

    const user = await ContactService.register(id, request.payload);
    request.logger.info({ user: user }, 'user registration');

    return h.response(Hoek.merge(internals.registerResponse, { id: user.id }));
};
