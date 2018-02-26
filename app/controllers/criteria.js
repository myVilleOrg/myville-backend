var  express 		= require('express'),
	mongoose 		= require('mongoose'),
	CriteriaModel		= mongoose.model('Criteria');

var Criteria = {

	create_criteria: function(critere){
		CriteriaModel.create("critere").catch(function(err){
			reject(err);
			});
		},




		delete_criteria: function(criteria){
			CriteriaModel.findOneAndRemove(criteria).catch(function(err){
				reject(err);
			});
		},

		update_criteria: function(oldCriteria,newCriteria){
			CriteriaModel.findOneAndUpdate(cri).catch(function(err){
				reject(err);
			});
		},

		get_criteria: function(req,res,next){  //fonction utilisée par le front pour récupérer les critere et les id

		}
};

/*
		var Group = {

			//return the list of groups
			getGroups: function(req, res, next){
				UserModel.findOne({_id: req.user._id},{groupes:1}).populate({path:'groupes'}).then(function(groupes){
					console.log(groupes);
					var transfer=groupes.toJSON();
					return res.ok(transfer);
				}).catch(function(err){
					return  res.error({message: err.message, error: err});
				});
			},

};
Criteria.create_criteria;
*/
module.exports = function (app) {
	app.get('/criteria/get',	Criteria.get_criteria);
};
