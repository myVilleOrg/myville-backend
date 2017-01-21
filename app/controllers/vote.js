var express 		= require('express'),
	mongoose 		= require('mongoose'),
	UaModel 		= mongoose.model('Ua'),
	UserModel 		= mongoose.model('User'),
	VoteModel		= mongoose.model('Vote');

var Vote = {
	getVoteByUa: function(req, res, next){
		VoteModel.findOne({user: req.user._id, ua: req.params.uaId}).then(function(vote){
			if(!vote) return res.error({message: "vote not found"});

			return res.ok(vote);
		}).catch(function(err){
			return res.error(err);
		});
	}

};
module.exports = function (app) {
	app.get('/vote/:uaId',	Vote.getVoteByUa);
};
