[![last commit](https://img.shields.io/github/last-commit/academia-de-codigo/noire-server.svg)]()
[![Build Status](https://api.travis-ci.org/academia-de-codigo/noire-server.svg?branch=master)](https://travis-ci.org/academia-de-codigo/noire-server)
[![Coverage](https://codecov.io/gh/academia-de-codigo/noire-server/branch/master/graph/badge.svg)](https://codecov.io/gh/academia-de-codigo/noire-server)

[![Dependencies Status](https://david-dm.org/academia-de-codigo/noire-server/status.svg)](https://david-dm.org/academia-de-codigo/noire-server)
[![DevDependencies Status](https://david-dm.org/academia-de-codigo/noire-server/dev-status.svg)](https://david-dm.org/academia-de-codigo/noire-server?type=dev)

Maintainer: [Rui Ferrão](https://github.com/ferrao)

# Noire Server

Extremely opinionated [Hapi](http://hapijs.com) boilerplate using a layered architecture for proper separation of concerns

**WARNING: Noire is currently under active development and might not be ready for heavy production use**

### Controllers

*   Map routes
*   Extract route parameters
*   Kick off some work
*   Send the result back to the client

### Service Layer

*   Perform work for the Controller
*   Return the result for the Controller

### Data Access Layer

*   Repository pattern for data entities
*   Thin models
*   ORM with transactional capabilities

## Features

*   HTTP and HTTPS support
*   Automated API documentation generation
*   Stateless JWT auth for API endpoints
*   RBAC authorization
*   Email sending using handlebars templates
*   Fast and flexible logging (Pino)
*   Testing, code coverage and Travis CI integration
*   Graceful server shutdown
*   Database ORM (Objection) with migrations (Knex) support
*   Usage of native Promises and async/await

## Get it Running

### Clone the repo

`git clone git@github.com:academia-de-codigo/noire-server.git`

### Install the required Dependencies

`npm install`

### Adjust the configuration files to suit your environment

Edit all `lib/config*` files

### Setup environment variables

*   `NODE_ENV` should be set to either `development`, `staging` or `production`. If not set at all, defaults to `development`
*   `JWT_SECRET` should contain a secret which will be used to sign authentication tokens. A safe randomly generated secret can be obtained by running `npm run secret`.
*   SMTP credentials should be configured using the `SMTP_USER` and `SMTP_PASS` environment variables
*   Staging and Production environment need the `DB_HOSTT`, `DB_NAME`, `DB_USER` and `DB_PASS` environment variables for
    configuration the database connection
*   All environment variables can be setup inside a `.env` file which should not be commited and is sourced when the server starts. A sample `example.env` file is provided.

### Reset the database to it's original state

`npm run reset`

### Run the unit tests

`npm test`

### Launch the server in production mode

*   Make sure `NODE_ENV=production`
*   Start the server with `npm start`

### Development

*   Set `NODE_ENV=development`
*   Start the server in watch mode with `npm run watch`

#### Development Environment

Noire is developed using Vim and/or Visual Studio Code. With VSCode the following plugins are used:

*   Babel ES6/ES7
*   Document This
*   DotENV
*   EditorConfig for VS Code
*   ESLint
*   HTMLHint
*   Node.js Modules Intellisense
*   npm
*   Path Autocomplete
*   Prettier

For proper code formatting and module intellisense under VSCode, the following settings are recommended:

```json
"settings": {
		"editor.formatOnSave": true,
		"node-module-intellisense.scanBuiltinModules": true,
		"node-module-intellisense.scanDevDependencies": true,
		"node-module-intellisense.scanFileModules": true,
		"node-module-intellisense.modulePaths": [
			"lib"
		],
		"node-module-intellisense.autoStripExtensions": [
			".js"
		]
	}
```
