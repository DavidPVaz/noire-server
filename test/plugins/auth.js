const Lab = require('@hapi/lab');
const Hapi = require('@hapi/hapi');
const Sinon = require('sinon');
const JWT = require('jsonwebtoken');
const Bcrypt = require('bcrypt');
const HapiAuthJWT = require('hapi-auth-jwt2');
const NSError = require('errors/nserror');
const Auth = require('plugins/auth');
const UserService = require('modules/authorization/services/user');
const Logger = require('test/fixtures/logger-plugin');

const { before, describe, expect, it } = (exports.lab = Lab.script());

describe('Plugin: auth', () => {
    // created using node -e "console.log(require('crypto').randomBytes(256).toString('base64'));"
    const secret =
        'qhjM26DEqH1Bid2OPrQpV65FT+8E6pHfpdfDbbh4Dr1UH8LPoNy5UiE9fzGtyZnG8sxDdBWjNI6cpLdtBSCTC481PLExsKeSA+TgkyHGIl3r7BQVyqyybhLgTuEO5zKE2gcF3CaA00LQ7i2ibiBjlOct+eckMZ9wjf77gxP66bhpmgfIvITqBtWZ4Fu0wk9SkNoK1a2ZO2IkbHeftI9+tzbYmvHDc8gS0jkaYDNbfYfLABjo9QqPgL+YdzToynXIfEbX3VEiXC/bKQvmCMtBH18iWvFGKEkT7s36FT1DY7wi73sQI8wzeS6ueNdtEg/BoYkObiu+0gYRb08pGej3kA==';

    const tokenOptions = {
        audience: Auth.token.AUTH
    };

    before(() => {
        process.env.JWT_SECRET = secret;
    });

    it('handles hapi-auth-jwt2 plugin registration failure', async flags => {
        // cleanup
        let hapiAuthJWTRegister = HapiAuthJWT.plugin.register;
        flags.onCleanup = function() {
            HapiAuthJWT.plugin.register = hapiAuthJWTRegister;
        };

        // setup
        const server = Hapi.server();
        server.register(Logger);
        const PLUGIN_ERROR = 'plugin error';
        HapiAuthJWT.plugin.register = async function() {
            throw new Error(PLUGIN_ERROR);
        };

        // exercise and validate
        await expect(server.register(Auth)).to.reject(PLUGIN_ERROR);
    });

    it('handles registration without secret ', async flags => {
        // cleanup
        flags.onCleanup = function() {
            process.env.JWT_SECRET = secret;
        };

        // setup
        const PLUGIN_ERROR = 'JWT_SECRET environment variable is empty';
        const server = Hapi.server();
        server.register(Logger);
        process.env.JWT_SECRET = '';

        // exercise
        await expect(server.register(Auth)).to.reject(PLUGIN_ERROR);
    });

    it('hashes passwords', async () => {
        // setup
        const password = 'password';

        // exercise
        const hash = await Auth.crypt(password);

        // validate
        expect(Bcrypt.compareSync(password, hash)).to.be.true();
    });

    it('handles password encryption errors', async flags => {
        // cleanup
        flags.onCleanup = function() {
            Bcrypt.hash.restore();
        };

        // setup
        Sinon.stub(Bcrypt, 'hash').throws();

        // exercise and validate
        await expect(Auth.crypt('password')).to.reject(Error, NSError.AUTH_CRYPT_ERROR().message);
    });

    it('compares password against hash', async () => {
        // setup
        const password = 'password';
        const hash = Bcrypt.hashSync(password, 10);

        // exercise
        const result = await Auth.compare(password, hash);

        // validate
        expect(result).to.be.true();
    });

    it('handles password compare errors', async () => {
        // exercise and validate
        await expect(Auth.compare()).to.reject(Error, NSError.AUTH_CRYPT_ERROR().message);
    });

    it('gets token and validate with correct secret', async () => {
        // setup
        const fakeId = 9999;

        // exercise
        const jwt = await Auth.getToken({ id: fakeId });

        // validate
        JWT.verify(
            jwt,
            Buffer.from(process.env.JWT_SECRET, 'base64'),
            tokenOptions,
            (err, decoded) => {
                expect(err).not.to.exist();
                expect(decoded.id).to.equals(fakeId);
                expect(decoded.exp).to.exist();
                expect(decoded.aud).to.equals([tokenOptions.audience]);
            }
        );
    });

    it('gets token without expiration date', async () => {
        // setup
        const fakeId = 9999;

        // exercise
        const jwt = await Auth.getToken({ id: fakeId }, false);

        // validate
        JWT.verify(jwt, Buffer.from(process.env.JWT_SECRET, 'base64'), (err, decoded) => {
            expect(err).not.to.exist();
            expect(decoded.id).to.equals(fakeId);
            expect(decoded.exp).to.not.exist();
        });
    });

    it('gets token and validate with incorrect secret', async () => {
        // setup
        const fakeId = 9999;

        // exercise
        const jwt = await Auth.getToken({ id: fakeId });
        JWT.verify(jwt, 'invalid secret', (err, decoded) => {
            expect(err).to.exist();
            expect(err.name).to.equals('JsonWebTokenError');
            expect(err.message).to.equals('invalid signature');
            expect(decoded).to.not.exist();
        });
    });

    it('adds a loggedInAt claim', async () => {
        // setup
        const fakeId = 9999;
        const secret = Buffer.from(process.env.JWT_SECRET, 'base64');

        // exercise
        const jwt = await Auth.getToken({ id: fakeId });
        JWT.verify(jwt, secret, (error, decoded) => {
            expect(error).to.not.exist();
            expect(decoded.id).to.equal(fakeId);
            expect(decoded.iat).to.be.number();
            expect(decoded.loggedInAt).to.be.number();
            expect(decoded.loggedInAt).to.equal(decoded.iat);
        });
    });

    it('does not add a loggedInAt claim if already present', async () => {
        // setup
        const fakeId = 9999;
        const loggedInAt = 1000;
        const secret = Buffer.from(process.env.JWT_SECRET, 'base64');

        // exercise
        const jwt = await Auth.getToken({ id: fakeId, loggedInAt });
        JWT.verify(jwt, secret, (error, decoded) => {
            expect(error).to.not.exist();
            expect(decoded.id).to.equal(fakeId);
            expect(decoded.iat).to.be.number();
            expect(decoded.loggedInAt).to.be.number();
            expect(decoded.loggedInAt).to.equal(loggedInAt);
        });
    });

    it('does not add a loggedInAt claim if token type is not auth', async () => {
        // setup
        const fakeId = 9999;
        const secret = Buffer.from(process.env.JWT_SECRET, 'base64');

        // exercise
        const jwt = await Auth.getToken({ id: fakeId }, undefined, 'not auth');
        JWT.verify(jwt, secret, (error, decoded) => {
            expect(error).to.not.exist();
            expect(decoded.id).to.equal(fakeId);
            expect(decoded.iat).to.be.number();
            expect(decoded.loggedInAt).to.not.exist();
        });
    });

    it('does not authenticate if token not present', async () => {
        // setup
        const server = Hapi.server();
        const fakeRoute = { path: '/', method: 'GET', handler: () => {} };
        server.register(Logger);
        await server.register(Auth);
        server.route(fakeRoute);

        // exercise
        const response = await server.inject(fakeRoute.path);
        expect(response.statusCode, 'Status code').to.equal(401);
        expect(response.result.error).to.equals('Unauthorized');
        expect(response.result.message).to.equals('Missing authentication');
    });

    it('does not authenticate if invalid token', async () => {
        // setup
        const invalidJwt =
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MTkxMjM0MTIzNCwiaWF0IjoxNDczNzA2NzYzLCJleHAiOjE0NzM3MzU1NjN9.xjivOc1Smbf9M8uQHNTBTbcDBavXMjL-0oNxV-yxog0';
        const fakeRoute = { path: '/', method: 'GET', handler: () => {} };
        const server = Hapi.server();
        server.register(Logger);
        await server.register(Auth);
        server.route(fakeRoute);

        // exercise
        const response = await server.inject({
            method: 'GET',
            url: fakeRoute.path,
            headers: { authorization: invalidJwt }
        });

        expect(response.statusCode, 'Status code').to.equal(401);
        expect(response.result.error).to.equals('Unauthorized');
        expect(response.result.message).to.equals('Invalid token');
    });

    it('does not authenticate if token expired', async () => {
        // setup
        const expiredToken = JWT.sign(
            {
                id: 0,
                exp: Math.floor(Date.now() / 1000),
                iat: Date.now() / 1000 - 1
            },
            Buffer.from(process.env.JWT_SECRET, 'base64')
        );

        const fakeRoute = { path: '/', method: 'GET', handler: () => {} };
        const server = Hapi.server();
        server.register(Logger);
        await server.register(Auth);
        server.route(fakeRoute);

        // exercise
        const response = await server.inject({
            method: 'GET',
            url: fakeRoute.path,
            headers: { authorization: expiredToken }
        });

        expect(response.statusCode, 'Status code').to.equal(401);
        expect(response.result.error).to.equals('Unauthorized');
        expect(response.result.message).to.equals('Expired token');
    });

    it('does not authenticate if invalid audience', async () => {
        // setup
        const invalidToken = JWT.sign({ id: 0 }, Buffer.from(process.env.JWT_SECRET, 'base64'), {
            audience: 'invalid'
        });

        const fakeRoute = { path: '/', method: 'GET', handler: () => {} };
        const server = Hapi.server();
        server.register(Logger);
        await server.register(Auth);
        server.route(fakeRoute);

        // exercise
        const response = await server.inject({
            method: 'GET',
            url: fakeRoute.path,
            headers: { authorization: invalidToken }
        });

        expect(response.statusCode, 'Status code').to.equal(401);
        expect(response.result.error).to.equals('Unauthorized');
        expect(response.result.message).to.equals('Invalid token');
    });

    it('does not authenticate if invalid user id in token', async flags => {
        // cleanup
        flags.onCleanup = function() {
            UserService.findById.restore();
        };

        // setup
        const fakeRoute = { path: '/', method: 'GET', handler: () => {} };
        const server = Hapi.server();
        server.register(Logger);
        await server.register(Auth);
        Sinon.stub(UserService, 'findById').rejects(NSError.RESOURCE_NOT_FOUND());
        server.route(fakeRoute);

        // exercise
        const response = await server.inject({
            method: 'GET',
            url: fakeRoute.path,
            headers: {
                authorization: await Auth.getToken({ id: 9999 })
            }
        });

        // validate
        expect(UserService.findById.calledOnce).to.be.true();
        expect(response.statusCode, 'Status code').to.equal(401);
        expect(response.result.error).to.equals('Unauthorized');
        expect(response.result.message).to.equals('Invalid credentials');
    });

    it('does not authenticate if invalid scope', async flags => {
        // cleanup
        flags.onCleanup = function() {
            UserService.findById.restore();
        };

        // setup
        const fakeRoute = {
            path: '/',
            method: 'GET',
            config: { auth: { scope: 'admin' } },
            handler: () => {}
        };
        const fakeUser = { id: 9999, roles: [{ name: 'user' }] };
        const server = Hapi.server();
        server.register(Logger);
        await server.register(Auth);
        server.route(fakeRoute);
        Sinon.stub(UserService, 'findById')
            .withArgs(fakeUser.id)
            .resolves(fakeUser);

        // exercise
        const response = await server.inject({
            method: 'GET',
            url: fakeRoute.path,
            headers: {
                authorization: await Auth.getToken({ id: fakeUser.id })
            }
        });

        // validate
        expect(UserService.findById.calledOnce).to.be.true();
        expect(response.statusCode, 'Status code').to.equal(403);
        expect(response.result.error).to.equals('Forbidden');
        expect(response.result.message).to.equals('Insufficient scope');
    });

    it('does not authenticate with an invalid token version', async flags => {
        // cleanup
        flags.onCleanup = function() {
            UserService.findById.restore();
        };

        // setup
        const fakeRoute = { path: '/', method: 'GET', handler: () => {} };
        const fakeUser = { id: 9999, roles: [{ name: 'user' }] };
        const fakeTokenVersion = 8888;
        const server = Hapi.server();

        server.register(Logger);
        await server.register(Auth);
        server.route(fakeRoute);

        Sinon.stub(UserService, 'findById')
            .withArgs(fakeUser.id)
            .resolves(fakeUser);

        // exercise
        const response = await server.inject({
            method: 'GET',
            url: fakeRoute.path,
            headers: {
                authorization: await Auth.getToken({ id: fakeUser.id, version: fakeTokenVersion })
            }
        });

        // validate
        expect(UserService.findById.calledOnce).to.be.true();
        expect(response.statusCode).to.equal(401);
        expect(response.result.error).to.equals('Unauthorized');
        expect(response.result.message).to.equals('Invalid credentials');
    });

    it('authenticates on valid credentials', async flags => {
        // cleanup
        flags.onCleanup = function() {
            UserService.findById.restore();
        };

        // setup
        const payload = 'payload';
        const fakeUser = {
            id: 9999,
            username: 'test',
            email: 'test@test',
            roles: [{ name: 'admin' }]
        };
        const fakeRoute = {
            path: '/',
            method: 'GET',
            config: { auth: { scope: 'admin' } },
            handler: () => payload
        };
        const server = Hapi.server();
        server.register(Logger);
        await server.register(Auth);
        server.route(fakeRoute);
        Sinon.stub(UserService, 'findById')
            .withArgs(fakeUser.id)
            .resolves(fakeUser);

        // exercise
        const response = await server.inject({
            method: 'GET',
            url: fakeRoute.path,
            headers: {
                authorization: await Auth.getToken({ id: fakeUser.id })
            }
        });

        // validate
        expect(UserService.findById.calledOnce).to.be.true();
        expect(response.statusCode, 'Status code').to.equal(200);
        expect(response.request.auth.isAuthenticated).to.be.true();
        expect(response.request.auth.credentials.id).to.equal(fakeUser.id);
        expect(response.request.auth.credentials.username).to.equal(fakeUser.username);
        expect(response.request.auth.credentials.email).to.equal(fakeUser.email);
        expect(response.request.auth.credentials.scope[0]).to.equal(fakeUser.roles[0].name);
        expect(response.result).to.equals(payload);
    });

    it('decodes a valid token', async () => {
        // setup
        const payload = { id: 10 };
        const secret = Buffer.from(process.env.JWT_SECRET, 'base64');
        const token = JWT.sign(payload, secret, {
            audience: Auth.token.SIGNUP
        });

        // exercise
        const decoded = await Auth.decodeToken(token, Auth.token.SIGNUP);
        expect(decoded.id).to.equal(payload.id);
    });

    it('does not decode an invalid token', async () => {
        // setup
        const token = JWT.sign({}, 'invalid');

        // exercise and verify
        await expect(Auth.decodeToken(token)).to.reject('invalid signature');
    });

    it('does not decode an expired token', async () => {
        // setup
        const secret = Buffer.from(process.env.JWT_SECRET, 'base64');
        const token = JWT.sign({ exp: Math.floor(Date.now() / 1000) - 30 }, secret, {
            audience: Auth.token.AUTH
        });

        // exercise and verify
        await expect(Auth.decodeToken(token)).to.reject('jwt expired');
    });

    it('does not decode a token with an invalid audience', async () => {
        // setup
        const secret = Buffer.from(process.env.JWT_SECRET, 'base64');
        const token = JWT.sign({}, secret, { audience: 'invalid' });

        // exercise and verify
        await expect(Auth.decodeToken(token)).to.reject(
            `jwt audience invalid. expected: ${Auth.token.AUTH}`
        );
    });

    it('handles renewing a token', async () => {
        // setup
        const now = Math.floor(Date.now() / 1000);
        const payload = { id: 1, loggedInAt: now };
        const secret = Buffer.from(process.env.JWT_SECRET, 'base64');
        const token = JWT.sign(payload, secret, {
            audience: Auth.token.AUTH
        });

        // exercise and verify
        const jwt = await Auth.renewToken(token);

        // verify
        JWT.verify(jwt, secret, (error, decoded) => {
            expect(error).to.not.exist();
            expect(decoded.id).to.equal(payload.id);
            expect(decoded.iat).to.be.number();
            expect(decoded.exp).to.be.number();
            expect(decoded.loggedInAt).to.exist();
            expect(decoded.loggedInAt).to.be.number();
            expect(decoded.loggedInAt).to.equal(payload.loggedInAt);
        });
    });

    it('handles renewing an invalid token', async () => {
        // setup
        const payload = { id: 1, loggedInAt: 20 };
        const secret = Buffer.from(process.env.JWT_SECRET, 'base64');
        const token = JWT.sign(payload, secret, {
            audience: Auth.token.AUTH
        });

        // exercise and verify
        await expect(Auth.renewToken(token)).to.reject(Error, 'non renewable token');
    });
});
