var express			= require('express'),
	mongoose		= require('mongoose'),
	UserModel		= mongoose.model('User'),
	jwt				= require('jsonwebtoken'),
	secretConfig	= require('../../config/config'),
	bcrypt			= require('bcrypt'),
	FB				= require('fb'),
	shortid			= require('shortid'),
	request			= require('request-promise'),
	slug			= require('slug');

var salt = bcrypt.genSaltSync(10);
var Tools = {
	createAccount: function(req, res, next, objUser){
		return new Promise(function(resolve, reject){
			bcrypt.genSalt(10, function (err, salt) {
				if(err) return res.error({message: err.message, error: err});
				var password = shortid.generate();
				bcrypt.hash(password, salt, function (err, hash) {
					if(err) return res.error({message: err.message, error: err});
					var slugify = slug(objUser.name);
					var mail = objUser.email ? objUser.email : slugify + '@myVille.com';
					var avat = objUser.avatar ? objUser.avatar : '';
					var fuser = {username: slugify, password: hash, email: mail, phonenumber: req.body.phonenumber, avatar: avat, deleted: false, uas: []};
					fuser.facebook_id = objUser.facebook_id ? objUser.facebook_id : '';
					fuser.google_id = objUser.google_id ? objUser.google_id : '';
					UserModel.create(fuser).then(function(user){
						user.password = undefined; // remove password from return
						var token = jwt.sign(user, secretConfig.tokenSalt, {
							expiresIn: '1440m'
						});
						resolve({token: token, user: user});
					}).catch(function(err){
						reject(err);
					});
				});
			});
		});
	}
};
var User = {
	create: function(req, res, next){
		var fields = ['username', 'email', 'password', 'phonenumber'];
		for(var i = 0; i < fields.length; i++) {
			if(!req.body[fields[i]]) return res.error({message: fields[i], error: 'Missing'})
		}
		UserModel.findOne({email: req.body.email}, function(email, err){
			if(email) return res.error({message: 'Email used', error: 'Already'});
			bcrypt.genSalt(10, function (err, salt) {
				if(err) return res.error({message: err.message, error: err});

				bcrypt.hash(req.body.password, salt, function (err, hash) {
					if(err) return res.error({message: err.message, error: err});

					UserModel.create({username: req.body.username, password: hash, email: req.body.email, phonenumber: req.body.phonenumber, avatar: '', deleted: false, uas: []}).then(function(user){
						user.password = undefined; // remove password from return
						var token = jwt.sign(user, secretConfig.tokenSalt, {
							expiresIn: '1440m'
						});
						return res.ok({token: token, user: user});
					}).catch(function(error){console.log(error);});
				});
			});
		});
	},
	login: function(req, res, next){
		if(!req.body.email) return res.status(404).json({message: 'Username', error: 'Missing'});
		if(!req.body.password) return res.status(404).json({message: 'Password', error: 'Missing'});

		UserModel.findOne({email: req.body.email}).then(function(user){
			if(!bcrypt.compareSync(req.body.password, user.password)) return res.json({message : 'Login failed', error: 'Error'});

			if(user.deleted === true) { // we reactivate user visibility
				UserModel.update({_id: user._id}, {deleted: false}).then();
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
	loginFacebook: function(req, res, next) {
		if(!req.body.accessToken) return res.status(404).json({message: 'Access Token', error: 'Missing'});

		FB.setAccessToken(req.body.accessToken);

		FB.api('/me', {fields: 'email, name'}, function(fbUser){
			if(!fbUser || fbUser.error){
				var error = !fbUser ? 'error occurred' : fbUser.error;
				return res.error({message: error});
			}
			//TODO link fb account if same email
			UserModel.findOne({facebook_id: fbUser.id}).then(function(user){
				if(user) { // we log user with our token
					if(user.deleted === true) { // we reactivate user visibility
						UserModel.update({_id: user._id}, {deleted: false}).then();
					}
					var token = jwt.sign(user, secretConfig.tokenSalt, {
						expiresIn: '1440m'
					});
					user.password = undefined; // remove password for return object
					return res.ok({token: token, user: user});
				} else { //create user with fb id
					var objUser = {
						email: fbUser.email,
						facebook_id: fbUser.id,
						name: fbUser.name,
					};
					UserModel.findOneAndUpdate({email: fbUser.email}, {facebook_id: fbUser.id}).then(function(user){
						if(!user) {
							Tools.createAccount(req, res, next, objUser).then(function(data){
								return res.ok(data);
							});
						} else {
							var token = jwt.sign(user, secretConfig.tokenSalt, {
								expiresIn: '1440m'
							});
							return res.ok({token: token, user: user});
						}

					}).catch(function(){
						Tools.createAccount(req, res, next, objUser).then(function(data){
							return res.ok(data);
						});
					});
				}
			});
		});
	},
	loginGoogle: function(req, res, next){
		if(!req.body.accessToken) return res.status(404).json({message: 'Access Token', error: 'Missing'});

		request.get({uri: 'https://www.googleapis.com/plus/v1/people/me', headers: {'Authorization': "Bearer "+req.body.accessToken }}).then(function(gUser){
			gUser = JSON.parse(gUser);
			UserModel.findOne({google_id: gUser.id}).then(function(user){
				if(user) { // we log user with our token
					if(user.deleted === true) { // we reactivate user visibility
						UserModel.update({_id: user._id}, {deleted: false}).then();
					}
					var token = jwt.sign(user, secretConfig.tokenSalt, {
						expiresIn: '1440m'
					});
					user.password = undefined; // remove password for return object
					return res.ok({token: token, user: user});
				} else { //create user with fb id
					var objUser = {
						email: gUser.emails[0].value,
						google_id: gUser.id,
						name: gUser.displayName,
						avatar: gUser.image.url,
					};
					UserModel.findOneAndUpdate({email: gUser.emails[0].value}, {google_id: gUser.id}).then(function(user){
						if(!user) {
							Tools.createAccount(req, res, next, objUser).then(function(data){
								return res.ok(data);
							});
						} else {
							var token = jwt.sign(user, secretConfig.tokenSalt, {
								expiresIn: '1440m'
							});
							return res.ok({token: token, user: user});
						}
					}).catch(function(){
						Tools.createAccount(req, res, next, objUser).then(function(data){
							return res.ok(data);
						});
					});
				}
			});
		});
	},
	get: function(req, res, next){
		UserModel.findOne({_id: req.params.id, deleted: false}).select('username _id createdAt avatar').then(function(user){
			if(!user) return res.error({message: 'User not found', error: 'Not found'});

			return res.status(200).json(user);
		}).catch(function(err){
			return res.error({message: 'User not found', error: 'Not found'});
		});
	},
	update: function(req, res, next){
		UserModel.findOne({_id: req.user._id}).then(function(user){
			if(req.body.username && !req.body.password){
				if(user.username != req.body.username){
					UserModel.update({_id: user._id}, {username: req.body.username}).then(function(user){
						return res.ok({message: 'OK'});
					}).catch(function(err){
						return res.error({message: err.message, error: err});
					});
				} else return res.error({message: 'Same username'});
			}
			if(req.body.password && req.body.oldPassword && !req.body.username){
				if(bcrypt.compareSync(req.body.oldPassword, user.password)){
					bcrypt.hash(req.body.password, salt, function (err, hash) {
						if(err) return res.error({message: err.message, error: err});
						UserModel.update({_id: user._id}, {password: hash}).then(function(user){
							return res.ok({message: 'OK'});
						}).catch(function(err){
							return res.error({message: err.message, error: err});
						});
					});
				} else {
					return res.error({message: 'Bad old password'});
				}
			}
			if(req.body.username && req.body.password && req.body.oldPassword){
				if(bcrypt.compareSync(req.body.password, user.password)) {
					bcrypt.hash(req.body.password, salt, function (err, hash) {
						if(err) return res.error({message: err.message, error: err});
						UserModel.update({_id: user._id}, {username: req.body.username, password: hash}).then(function(user){
							return res.ok({message: 'OK'});
						}).catch(function(err){
							return res.error({message: err.message, error: err});
						});
					});
				} else {
					return res.error({message: 'Bad old password'});
				}
			}
		}).catch(function(err){
			return res.error({message: err.message, error: err});
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
	app.post('/user/create',			User.create);
	app.post('/user/login',				User.login);
	app.post('/user/login/facebook',	User.loginFacebook);
	app.post('/user/login/google',		User.loginGoogle);
	app.put('/user/update',				User.update);
	app.delete('/user/:id',				User.delete);
	app.get('/user/:id',				User.get);
};
