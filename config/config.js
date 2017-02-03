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
		nosecurePath: ['/user/reset', '/user/create', '/user/login', '/', '/user/login/facebook', '/user/login/google', '/ua/get/geo', '/ua/get/popular', '/user/forgetPassword'],
		facebook: {
			appId: '269509866781876',
			appSecret: ''
		},
		google: {
			appId: '49433176261-hjeueecpafioh56r67fik9nqkum5np0g.apps.googleusercontent.com',
			appSecret: 'vzZQjNfMPWvKw59dTkh9J8Pt'
		},
		email: {
			host: 'smtp.gmail.com',
			port: 587,
			auth: {
				user: 'smtpdelamortsylvestre@gmail.com',
				pass: 'uselesspassword'
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
