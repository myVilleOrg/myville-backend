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

				UserModel.create({nickname: req.body.username, password: hash, email: req.body.email, phonenumber: req.body.phonenumber, avatar: '', deleted: false}).then(function(user){
					user.password = undefined; // remove password from return
					var token = jwt.sign(user, secretConfig.tokenSalt, {
						expiresIn: '1440m'
					});
					return res.ok({token: token, user: user});
				});
			});
		});
	},
	login: function(req, res, next){
		if(!req.body.username) return res.status(404).json({message: 'Username', error: 'Missing'});
		if(!req.body.password) return res.status(404).json({message: 'Password', error: 'Missing'});

		UserModel.findOne({nickname: req.body.username}).then(function(user){
			if(!bcrypt.compareSync(req.body.password, user.password)) return res.json({message : 'Login failed', error: 'Error'});

			if(user.deleted === true) { // we reactivate user visibility
				UserModel.update({_id: user._id}, {deleted: true}).then();
			}

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
		UserModel.findOne({_id: req.params.id, deleted: false}).select('nickname _id createdAt avatar').then(function(user){
			if(!user) return res.error({message: 'User not found', error: 'Not found'});

			return res.status(200).json(user);
		}).catch(function(err){
			return res.error({message: 'User not found', error: 'Not found'});
		});
	},
	delete: function(req, res, next){
		UserModel.findOne({_id: req.user._id}).then(function(user){
			if(req.params.id != req.user._id) return res.error({message: 'Forbidden action', err: 'Deny'});
			if(user.deleted) return res.error({message: 'Already done'});

			UserModel.update({_id: user._id}, {deleted: true}).then(function(data){
				return res.ok({message: 'OK'});
			}).catch(function(err){
				return res.error({message: err.message, error: err});
			});
		});
	}
};

module.exports = function (app) {
	app.post('/user/create', 	User.create);
	app.post('/user/login',		User.login);
	app.delete('/user/:id',		User.delete);
	app.get('/user/:id',	 		User.get);

};
