var express 		= require('express'),
	mongoose 		= require('mongoose'),
	VoteModel		= mongoose.model('Vote');

var Vote = {
	getVoteByUa: function(req, res, next){
		VoteModel.findOne({user: req.user._id, ua: req.params.uaId}).then(function(vote){
			if(!vote) return res.error({message: 'Not voted'});
			return res.ok({vote:vote.vote});
		}).catch(function(err){
			return res.error(err);
		});
	}
	/*Count the numbers of a type of vote
  countVoteByUa: function(req, res, next){
		VoteModel.findOne({user: req.user._id, ua: req.params.cUaId}).then(function(vote){
			if(!vote) return res.error({message: 'Not voted'});
			return res.ok({message : 'finally ok'});
		}).catch(function(err){
			return res.error(err);
		});
	}*/
};

module.exports = function (app) {
	app.get('/vote/:uaId',	Vote.getVoteByUa);
	//app.get('/vote/:cUaId',	Vote.countVoteByUa);
};
