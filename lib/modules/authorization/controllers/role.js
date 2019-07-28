/**
 * API Role Controller
 * @module
 */

const RoleService = require('modules/authorization/services/role');

/**
 * Lists roles
 * @async
 * @param {Request} request the request object
 * @param {Toolkit} h the response toolkit
 * @returns {Response} the response object containing the list of roles
 */
exports.list = async function(request, h) {
    const [totalCount, results] = await Promise.all([
        RoleService.count(request.query),
        RoleService.list(request.query)
    ]);

    return h.paginate(results, totalCount);
};

/**
 * Gets a role
 * @async
 * @param {Request} request the request object
 * @returns {Response} the response object containing the role
 */
exports.get = function(request) {
    // path params are passed as strings
    const id = Number.parseInt(request.params.id);

    return RoleService.findById(id);
};

/**
 * Create a new role
 * @async
 * @param {Request} request the request object
 * @param {Toolkit} h the response toolkit
 * @returns {Response} the response object containing the created role
 */
exports.create = async function(request, h) {
    const data = await RoleService.add(request.payload);

    return h.response(data).created('/role/' + data.id);
};

/**
 * Delete a role
 * @async
 * @param {Request} request the request object
 * @param {Toolkit} h the response toolkit
 * @returns {Response} the response object
 */
exports.delete = async function(request, h) {
    await RoleService.delete(request.params.id);

    return h.response().code(204);
};

/**
 * Update a role
 * @async
 * @param {Request} request the request object
 * @returns {Response} the response object containing the updated user
 */
exports.update = function(request) {
    // path params are passed as strings
    const [id, payload] = [Number.parseInt(request.params.id), request.payload];

    return RoleService.update(id, payload);
};

/**
 * Adds one or more users to a role
 * @async
 * @param {Request} request the request object
 * @returns {Response} the response object containing the new role/user mappings
 */
exports.addUsers = function(request) {
    // path params are passed as strings
    const [id, userIds] = [Number.parseInt(request.params.id), request.payload.id];

    return RoleService.addUsers(id, userIds);
};

/**
 * Removes one or more users from a role
 * @async
 * @param {Request} request the request object
 * @param {Toolkit} h the response toolkit
 * @returns {Response} the response object
 */
exports.removeUsers = async function(request, h) {
    // path params are passed as strings
    const [id, userIds] = [Number.parseInt(request.params.id), request.payload.id];
    await RoleService.removeUsers(id, userIds);

    return h.response().code(204);
};

/**
 * Lists permissions
 * @returns {Reponse} the response object containing the list of permissions
 */
exports.listPermissions = function() {
    return RoleService.listPermissions();
};

/**
 * Adds a permission to a role
 * @async
 * @param {Request} request the request object
 * @returns {Response} the response object containing the new mappings
 */
exports.addPermission = function(request) {
    // path params are passed as strings
    const [id, action, resource, description] = [
        Number.parseInt(request.params.id),
        request.payload.action,
        request.payload.resource,
        request.payload.description
    ];

    return RoleService.addPermission(id, action, resource, description);
};

/**
 * Updates role permissions
 * @async
 * @param {Request} request the request object
 * @param {Toolkit} h the response toolkit
 * @returns {Response} the response object
 */
exports.updatePermissions = async function(request, h) {
    // path params are passed as strings
    const [id, permIds] = [Number.parseInt(request.params.id), request.payload.id];
    await RoleService.updatePermissions(id, permIds);

    return h.response().code(204);
};
