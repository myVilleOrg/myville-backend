var express 		= require('express'),
	mongoose 		  = require('mongoose'),
	UserModel 		= mongoose.model('User'),
	jwt 			    = require('jsonwebtoken'),
	secretConfig	= require('../../config/config'),
	bcrypt			  = require('bcrypt');

var salt = bcrypt.genSaltSync(10);
var User = {
	create: function(req, res, next){
		var fields = ['username', 'password', 'email', 'phonenumber'];
		for(var i = 0; i < fields.length; i++) {
			if(!req.body[fields[i]]) return res.error({message: fields[i], error: 'Missing'})
		}
		bcrypt.genSalt(10, function (err, salt) {
			if(err) return res.error({message: err.message, error: err});

			bcrypt.hash(req.body.password, salt, function (err, hash) {
				if(err) return res.error({message: err.message, error: err});

				UserModel.create({nickname: req.body.username, password: hash, email: req.body.email, phoneNumber: req.body.phonenumber}).then(function(user){
					return res.ok(user);
				});
			});
		});

	},
	login: function(req, res, next){
		if(!req.body.username) return res.status(404).json({message: 'Username', error: 'Missing'});
		if(!req.body.password) return res.status(404).json({message: 'Password', error: 'Missing'});

		UserModel.findOne({nickname: req.body.username}).then(function(user){
			if(!bcrypt.compareSync(req.body.password, user.password)) return res.json({message : 'Login failed', error: 'Error'});

			var token = jwt.sign(user, secretConfig.tokenSalt, {
				expiresIn: '1440m'
			});
			user.password = undefined; // remove password for return object

			return res.ok({token: token, user: user});
		}).catch(function(err){
			return res.error({message : 'Login failed', error: 'Error'});
		});
	},
	get:  function(req, res, next){
		UserModel.findOne({_id: req.params.id}).select('nickname _id createdAt').then(function(user){
			return res.status(200).json(user);
		}).catch(function(err){
			return res.error({message: 'User not found', error: 'Not found'});
		});
	},
	update: function(req, res, next){
		var fields = ['oldusername', 'newusername', 'password', 'email', 'phonenumber'];

		for(var i = 0; i < fields.length; i++) {
			if(!req.body[fields[i]]) return res.error({message: fields[i], error: 'Missing'})
		}

			bcrypt.genSalt(10, function (err, salt) {
				if(err) return res.error({message: err.message, error: err});

				bcrypt.hash(req.body.password, salt, function (err, hash) {
						if(err) return res.error({message: err.message, error: err});

					UserModel.findOneAndUpdate({nickname: req.body.oldusername}, {nickname: req.body.newusername, password: hash, email: req.body.email, phoneNumber: req.body.phonenumber}, {new: true}).then(function(user){
								return res.ok(user);
					}).catch(function(err){
						return res.error({message: err.message, error: err});
					});
				});
			});

	},
};

module.exports = function (app) {
	app.post('/user/create', 	User.create);
	app.post('/user/login',		User.login);
	app.get('/user/:id',	    User.get);
	app.update('/user/update',	User.update);

};
