var path = require('path'),
		rootPath = path.normalize(__dirname + '/..'),
		env = process.env.NODE_ENV || 'development';

var config = {
	development: {
		root: rootPath,
		app: {
			name: 'backend'
		},
		port: process.env.PORT || 3000,
		db: 'mongodb://localhost/backend-development',
		tokenSalt: 'zbeb',
		nosecurePath: ['/user/reset', '/user/create', '/user/login', '/', '/user/login/facebook', '/user/login/google', '/ua/get/geo', '/user/forgetPassword'],
		facebook: {
			appId: '',
			appSecret: ''
		},
		google: {
			appId: '',
			appSecret: ''
		},
		email: {
			host: 'smtp.gmail.com',
			port: 587,
			auth: {
				user: '',
				pass: ''
			}
		}
	},

	test: {
		root: rootPath,
		app: {
			name: 'backend'
		},
		port: process.env.PORT || 3000,
		db: 'mongodb://localhost/backend-test',
		tokenSalt: 'zbeb'
	},

	production: {
		root: rootPath,
		app: {
			name: 'backend'
		},
		port: process.env.PORT || 3000,
		db: 'mongodb://localhost/backend-production',
		tokenSalt: 'zbeb'
	},
};

module.exports = config[env];
