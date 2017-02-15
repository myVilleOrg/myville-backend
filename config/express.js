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

var Tools = {
	generateToken(token, config, req, res, next){
		return new Promise(function(resolve, reject){
			jwt.verify(token, config.tokenSalt, function(err, decoded) {
				if(err) reject({message: err.message, error: err});
				if(decoded.exp - Math.round(new Date()/1000) < 43200) {
					var newToken = jwt.sign(decoded._doc, config.tokenSalt, {
						expiresIn: '1440m'
					});
					res.setHeader('x-access-token', newToken);
				}
				req.user = decoded._doc;
				resolve();
			});
		});
	}
};

module.exports = function(app, config) {
	var env = process.env.NODE_ENV || 'development';
	app.locals.ENV = env;
	app.locals.ENV_DEVELOPMENT = env == 'development';

	app.use(logger('dev'));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({
		extended: true
	}));

	app.use(cookieParser());
	app.use(compress());
	// Delivers upload files static
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

	// Setup CORS
	app.use(cors());

	//Setup when we need Token or not
	app.all('*', function(req, res, next){
		var regexID = /^[a-f\d]{24}$/i;
		var token = req.body.token || req.headers['x-access-token'];

		var canIpass = false;
		if(req.path.slice(0, 6) === '/user/' && regexID.test(req.path.slice(6))){ // GET /user/:id
			canIpass = true;
		}

		if(req.path.slice(0, 4) === '/ua/' && regexID.test(req.path.slice(4))){ // GET /ua/:id
			canIpass = true;
		}

		if(req.path.slice(0, 8) === '/static/'){ // GET /static/
			canIpass = true;
		}

		for(var i = 0; i < config.nosecurePath.length; i++) {
			if(req.path === config.nosecurePath[i]){
				canIpass = true;
			}
		}
		if(canIpass){
			if(token) {
				return Tools.generateToken(token, config, req, res, next).then(function(){
					return next();
				}, function(err){
					return res.status(401).json(err);
				});
			} else {
				return next();
			}
		}

		if(!token) {
			return res.status(500).json({message: 'Where is your token ?', error: 'Token Missing'});
		} else {
			return Tools.generateToken(token, config, req, res, next).then(function(){
				return next();
			}, function(err){
				return res.status(401).json(err);
			});
		}

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
