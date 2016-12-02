var express				= require('express');
var glob				= require('glob');
var favicon				= require('serve-favicon');
var logger				= require('morgan');
var cookieParser		= require('cookie-parser');
var bodyParser			= require('body-parser');
var compress			= require('compression');
var methodOverride		= require('method-override');
var jwt					= require('jsonwebtoken');
var cors				= require('cors');

module.exports = function(app, config) {
	var env = process.env.NODE_ENV || 'development';
	app.locals.ENV = env;
	app.locals.ENV_DEVELOPMENT = env == 'development';

	// Setup CORS
	app.use(logger('dev'));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
		extended: true
	}));

	app.use(cookieParser());
	app.use(compress());
	app.use('/static', express.static(config.root + '/app/upload'));
	app.use(methodOverride());
	app.use(function(req, res, next){
		res.error = function(data){
			return res.status(500).json(data);
		};
		res.ok = function(data){
			return res.status(200).json(data);
		};
		next();
	});
	app.use(cors());
	app.all('*', function(req, res, next){
		var regexID = /^[a-f\d]{24}$/i;

		if(req.path.slice(0, 6) === '/user/' && regexID.test(req.path.slice(6))){ // GET /user/:id
			return next();
		}

		if(req.path.slice(0, 8) === '/static/'){ // GET /static/
			return next();
		}

		for(var i = 0; i < config.nosecurePath.length; i++) {
			if(req.path === config.nosecurePath[i]) return next();
		}
		var token = req.body.token || req.headers['x-access-token'];
		if(token){
			jwt.verify(token, config.tokenSalt, function(err, decoded) {
				if(err) return res.status(401).json({message: err.message, error: err});
				if(decoded.exp - Math.round(new Date()/1000) < 43200) {
					var newToken = jwt.sign(decoded._doc, config.tokenSalt, {
						expiresIn: '1440m'
					});
					res.setHeader('x-access-token', newToken);
				}
				req.user = decoded._doc;
				next();
			});
		} else return res.status(500).json({message: 'Where is your token ?', error: 'Token Missing'});
	});

	// Load controllers
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
