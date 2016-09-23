var express 		= require('express'),
	mongoose 		= require('mongoose'),
	UaModel 		= mongoose.model('Ua');

var Ua = {
	create: function(req, res, next){
		var fields = ['place', 'description', 'user'];
		for(var i = 0; i < fields.length; i++) {
			if(!req.body[fields[i]]) return res.error({message: fields[i], error: 'Missing'})
		}
		UaModel.create({place: req.body.place, description: req.body.description, user: req.body.user, deleted: false}).then(function(ua){
			return res.ok(ua);
		});
	},

	get: function(req, res, next){
		UaModel.findOne({_id: req.params.id}).then(function(ua){
			if(!ua || ua.deleted) return res.error({message: 'Ua does not exist', error: 'Not found'})
			return res.status(200).json(ua);
		}).catch(function(err){
			return res.error({message: 'Ua not found', error: 'Not found'});
		});
	},

	delete: function(req, res, next){
		UaModel.findOne({_id: req.params.id}).then(function(ua){
			if(!ua) return res.error({message: 'Ua does not exist', error: 'Not found'})
			if(ua.deleted) return res.error({message: 'Already done'});
			UaModel.update({_id: ua.id}, {deleted: true}).then(function(data){
				return res.ok({message: 'OK'});
			}).catch(function(err){
				return res.error({message: err.message, error: err});
			});
		});
	}
};

module.exports = function (app) {
	app.post('/ua/create', 	Ua.create);
	app.get('/ua/:id',	    Ua.get);
	app.delete('/ua/:id',	Ua.delete);
};