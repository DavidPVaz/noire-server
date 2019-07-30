/**
 * User Model
 * @module
 */
const BaseModel = require('models/base');

/**
 * User model class
 * @class User
 * @extends BaseModel
 */
class User extends BaseModel {
    /**
     * Gets the database table name
     * @readonly
     * @static
     * @memberof User
     * @returns {string} the database table name
     */
    static get tableName() {
        return 'users';
    }

    /**
     * Get the model properties to perform search on
     * @readonly
     * @static
     * @memberof User
     * @returns {Array.<string>} the model properties
     */
    static get searchFields() {
        return ['name', 'username', 'email'];
    }

    /**
     * Get the json schema for model validation
     * @readonly
     * @static
     * @memberof User
     * @returns {Object} the json schema
     */
    static get jsonSchema() {
        return {
            type: 'object',
            required: ['active', 'username', 'password'],
            properties: {
                id: {
                    type: 'integer'
                },
                active: {
                    type: 'boolean'
                },
                name: {
                    type: 'string',
                    minLength: User.NAME_MIN_LENGTH,
                    maxLength: User.NAME_MAX_LENGTH
                },
                username: {
                    type: 'string',
                    minLength: User.USERNAME_MIN_LENGTH,
                    maxLength: User.USERNAME_MAX_LENGTH
                },
                email: {
                    type: 'string',
                    format: 'email'
                },
                password: {
                    type: 'string',
                    minLength: User.PASSWORD_MIN_LENGTH,
                    maxLength: User.PASSWORD_MAX_LENGTH
                },
                avatar: {
                    type: 'string',
                    format: 'uri-reference'
                }
            }
        };
    }

    /**
     * Gets the model relations
     * @readonly
     * @static
     * @memberof User
     * @returns {Object} the model relations
     */
    static get relationMappings() {
        return {
            roles: {
                relation: BaseModel.ManyToManyRelation,
                modelClass: 'authorization/role',
                join: {
                    from: 'users.id',
                    through: {
                        from: 'users_roles.userId',
                        to: 'users_roles.roleId'
                    },
                    to: 'roles.id'
                }
            }
        };
    }
}

module.exports = User;

/**
 * @type {number}
 */
User.NAME_MIN_LENGTH = 6;

/**
 * @type {number}
 */
User.NAME_MAX_LENGTH = 64;

/**
 * @type {number}
 */
User.USERNAME_MIN_LENGTH = 3;

/**
 * @type {number}
 */
User.USERNAME_MAX_LENGTH = 32;

/**
 * @type {number}
 */
User.PASSWORD_MIN_LENGTH = 3;

/**
 * @type {number}
 */
User.PASSWORD_MAX_LENGTH = 60;

/**
 * Default limit for number of rows returned
 * @type {number}
 */
User.LIMIT_DEFAULT = 10;
