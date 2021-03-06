var express			= require('express'),
	mongoose		= require('mongoose'),
	UserModel		= mongoose.model('User'),
	jwt				= require('jsonwebtoken'),
	secretConfig	= require('../../config/config'),
	bcrypt			= require('bcryptjs'),
	FB				= require('fb'),
	shortid			= require('shortid'),
	request			= require('request-promise'),
	multer			= require('multer'),
	slug			= require('slug'),
	nodemailer		= require('nodemailer'),
	smtpTransport	= require('nodemailer-smtp-transport'),
	path 			= require('path');

var transporter = nodemailer.createTransport(smtpTransport(secretConfig.email));
/*Name of uploaded file*/
var storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, 'app/upload/')
	},
	filename: function (req, file, cb) {
		cb(null, (Math.random().toString(36)+'00000000000000000').slice(2, 10) + Date.now() + path.extname(file.originalname));
	}
});

var upload = multer({storage: storage});
var salt = bcrypt.genSaltSync(10);
var Tools = {
	createAccount: function(req, res, next, objUser){
		return new Promise(function(resolve, reject){
			bcrypt.genSalt(10, function (err, salt) {
				if(err) return res.error({message: err.message, error: err});
				var password = objUser.password ? objUser.password : shortid.generate(); // no password, we generate one
				bcrypt.hash(password, salt, function (err, hash) {
					if(err) return res.error({message: err.message, error: err});
					var slugify = slug(objUser.name); // if we get space we slugify username
					var mail = objUser.email ? objUser.email : slugify + '@myVille.com'; // case for facebook
					var avat = objUser.avatar ? objUser.avatar : '';
					var fuser = {username: slugify, password: hash, email: mail, phonenumber: req.body.phonenumber, avatar: avat, deleted: false, uas: []};
					fuser.facebook_id = objUser.facebook_id ? objUser.facebook_id : '';
					fuser.google_id = objUser.google_id ? objUser.google_id : '';
					UserModel.create(fuser).then(function(user){
						user.password = undefined; // remove password from return
						var token = jwt.sign(user, secretConfig.tokenSalt, {
							expiresIn: '1440m'
						});// we log the account
						Tools.sendMail(mail, 'Inscription sur myVille', 'Bonjour, \n Vous êtes bien inscrit sur myVille !').then();						Tools.sendMail(mail, 'Inscription sur myVille', 'Bonjour, \n Vous êtes bien inscrit sur myVille !').then();						Tools.sendMail(mail, 'Inscription sur myVille', 'Bonjour, \n Vous êtes bien inscrit sur myVille !').then();						resolve({token: token, user: user});
					}).catch(function(err){
						reject(err);
					});
				});
			});
		});
	},
	sendMail: function(to , subject, text){
		return new Promise(function(resolve, reject){
			transporter.sendMail({
				from: 'MyVille',
				to: to,
				subject: subject,
				text: text
			}, function(error, response) {
				var data = {error, response};
				resolve(data);
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
			Tools.createAccount(req, res, next, {name: req.body.username, email: req.body.email, password: req.body.password}).then(function(user){
				return res.ok(user);
			});
		});
	},
	login: function(req, res, next){
		if(!req.body.email) return res.status(404).json({message: 'Username', error: 'Missing'});
		if(!req.body.password) return res.status(404).json({message: 'Password', error: 'Missing'});

		UserModel.findOne({email: req.body.email}).then(function(user){
			if(!bcrypt.compareSync(req.body.password, user.password)) return res.json({message : 'Login failed', error: 'Error'});

			// if user is deleted we reactivate account
			if(user.deleted === true) { // we reactivate user visibility
				UserModel.update({_id: user._id}, {deleted: false}).then();
			}
			// generate a jsonwebtoken
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

		FB.setAccessToken(req.body.accessToken); // set accesstoken for using Facebook api

		FB.api('/me', {fields: 'email, name'}, function(fbUser){ // we fetch the facebook's email, name
			if(!fbUser || fbUser.error){
				var error = !fbUser ? 'error occurred' : fbUser.error;
				return res.error({message: error});
			}

			UserModel.findOne({facebook_id: fbUser.id}).then(function(user){
				if(user) { // we log user with our token because already existing in our db
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
						} else { //log if we have an account with the same facebooks's email
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

		request.get({uri: 'https://www.googleapis.com/plus/v1/people/me', headers: {'Authorization': "Bearer "+req.body.accessToken }}).then(function(gUser){ //access to google api
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
						} else { //log if we have an account with the same facebooks's email
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
		UserModel.findOne({_id: req.params.userId, deleted: false}).select('username _id createdAt avatar messages').populate({path:'messages'}).then(function(user){
			if(!user) return res.error({message: 'User not found', error: 'Not found'});
			return res.status(200).json(user);
		}).catch(function(err){
			return res.error({message: 'User not found', error: 'Not found'});
		});
	},
	update: function(req, res, next){
		UserModel.findOne({_id: req.user._id}).then(function(user){
			if(req.body.username && !req.body.password){
				if(user.username != req.body.username){ // same username in db and asked by user
					UserModel.update({_id: user._id}, {username: req.body.username}).then(function(user){
						return res.ok({message: 'OK'});
					}).catch(function(err){
						return res.error({message: err.message, error: err});
					});
				}
			}
			if(req.body.password && req.body.oldPassword && !req.body.username){ // update the password
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
					return res.error({message: 'Ancien mot de passe non valide.'});
				}
			}
			if(req.body.username && req.body.password && req.body.oldPassword){
				if(bcrypt.compareSync(req.body.oldPassword, user.password)) {
					bcrypt.hash(req.body.password, salt, function (err, hash) {
						if(err) return res.error({message: err.message, error: err});
						UserModel.update({_id: user._id}, {username: req.body.username, password: hash}).then(function(user){
							return res.ok({message: 'OK'});
						}).catch(function(err){
							return res.error({message: err.message, error: err});
						});
					});
				} else {
					return res.error({message: 'Ancien mot de passe non valide.'});
				}
			}
		}).catch(function(err){
			return res.error({message: err.message, error: err});
		});
	},
	updateAvatar: function(req, res, next){
		var extension = ['.jpg', '.jpeg', '.png', '.gif'];
		// check extension
		if(!extension.indexOf(path.extname(req.files[0].filename).toLowerCase())==-1) return res.error({message: 'It\'s not a image ! '});
		//check mimetype
		if(req.files[0].mimetype.split('/')[0] != 'image')  return res.error({message: 'It\'s not a image ! '});

		UserModel.findOneAndUpdate({_id: req.user._id}, {avatar: req.files[0].filename}, {new: true}).then(function(user){
			return res.ok(user);
		}).catch(function(err){
			return res.error({message: 'user not found'});
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
	},
	reset: function(req, res, next){
		if(!req.body.password) return res.error({message: 'password missing.'});
		if(!req.body.tokenReset) return res.error({message: 'Token reset missing.'});
		//check if user has a token to reset and not expired
		UserModel.findOne({resetPasswordToken: req.body.tokenReset, resetPasswordExpires: {$gt: Date.now()}}).then(function(user){
			if(!user) return res.error({message: 'Bad token or expires'});
			bcrypt.hash(req.body.password, salt, function (err, hash) {
				user.password = hash;
				user.resetPasswordToken = '';
				user.resetPasswordExpires = null;
				//we remove the token and expiration
				user.save(function(err){
					if(err) return res.error({message: err});
					return res.ok({message: 'OK'});
				});
			});
		}).catch(function(err){
			return res.error({message: err.message, error: err});
		});
	},
	forgetPassword: function(req, res, next){
		if(!req.body.email) return res.error({message:'Email missing.'});
		UserModel.findOne({email: req.body.email}).then(function(user){
			user.resetPasswordToken = shortid.generate(); // generate a tkn
        	user.resetPasswordExpires = Date.now() + 3600000; // Store expiration date 24h
        	user.save(function(){
				Tools.sendMail(req.body.email, 'Mot de passe oublié sur myVille', 'Vous recevez ce mail car vous avez demandé une demande de réinitialisation de votre mot de passe.\n\n' +
			      'Merci de cliquez sur le lien pour commencer la procédure :\n\n' +
			      'http://' + req.headers.host + '/#/reset/' + user.resetPasswordToken + '\n\n' +
			      'Si vous n\'avez pas demandé cette réinitialisation, ignorer ce mail.\n').then();
				return res.ok({message: 'OK'});
        	});
		}, function(err){
			return res.error({message: err.message, error: err});
		});
	},
};

module.exports = function (app) {
	app.post('/user/create',			User.create);
	app.post('/user/login',				User.login);
	app.post('/user/login/facebook',	User.loginFacebook);
	app.post('/user/login/google',		User.loginGoogle);
	app.put('/user/update',				User.update);
	app.post('/user/forgetPassword',	User.forgetPassword);
	app.post('/user/reset',				User.reset);
	app.post('/user/update/avatar', 	upload.any(),		User.updateAvatar);
	app.delete('/user/:id',				User.delete);
	app.get('/user/:userId',			User.get);
};
