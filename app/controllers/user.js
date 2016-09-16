var express = require('express'),
	mongoose = require('mongoose'),
	UserModel = mongoose.model('User');

var User = {
	create: function(req, res, next){
		var fields = ['nickname', 'password', 'email', 'phonenumber'];
		for(var i = 0; i < fields.length; i++) {
			if(!req.body[fields[i]]) return res.status(404).json({message: fields[i], error: 'Missing'})
		}
		UserModel.create({nickname: req.body.nickname, password: req.body.password, email: req.body.email, phonenumber: req.body.phonenumber}).then(function(user){
			return res.status(200).json(user);
		});
	},
	login: function(req, res, next){
		if(!req.body.username) return res.status(404).json({message: 'Username', error: 'Missing'});
		if(!req.body.password) return res.status(404).json({message: 'Password', error: 'Missing'});

	}
};

module.exports = function (app) {
	app.post('/user/create', 	User.create);
	app.post('/user/login',		User.login);

};
