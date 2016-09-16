var express = require('express');
var glob = require('glob');

var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compress = require('compression');
var methodOverride = require('method-override');

module.exports = function(app, config) {
	var env = process.env.NODE_ENV || 'development';
	app.locals.ENV = env;
	app.locals.ENV_DEVELOPMENT = env == 'development';

	// Setup CORS
		app.use(function(req, res, next) {
			res.setHeader('Access-Control-Allow-Origin', 	'*');
			res.setHeader('Access-Control-Allow-Methods', 	'GET, POST');
			res.setHeader('Access-Control-Allow-Headers', 	'X-Requested-With,content-type, Authorization');
			next();
		});

	app.use(logger('dev'));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
		extended: true
	}));
	app.use(cookieParser());
	app.use(compress());
	app.use(express.static(config.root + '/public'));
	app.use(methodOverride());

	var controllers = glob.sync(config.root + '/app/controllers/*.js');
	controllers.forEach(function (controller) {
		require(controller)(app);
	});

	app.use(function (req, res, next) {
		var err = new Error('Not Found');
		err.status = 404;
		next(err);
	});
	
	if(app.get('env') === 'development'){
		app.use(function (err, req, res, next) {
			res.status(500).json({
				message: err.message,
				error: err
			});
		});
	}

	app.use(function (err, req, res, next) {
		res.status(500).json({
				message: '',
				error: err
		});
	});

};
