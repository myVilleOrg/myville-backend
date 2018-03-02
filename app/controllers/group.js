
var express 		= require('express'),
	mongoose 		= require('mongoose'),
	UaModel 		= mongoose.model('Ua'),
	UserModel 		= mongoose.model('User'),
  GroupModel  = mongoose.model('Group'),
	VoteModel		= mongoose.model('Vote'),
	MessageModel = mongoose.model('Message'),
	GeoJSON 		= require('mongodb-geojson-normalize');

const util = require('util');
var fs = require("fs");


var Group = {
	//create a group
	create: function(req, res, next){
		var fields = ['description', 'name'];
		for(var i = 0; i < fields.length; i++) {
			if(!req.body[fields[i]]) return res.error({message: fields[i], error: 'Missing'});
		}
    adminDefault=[req.user._id];
    userDefault=[req.user._id];
    uasDefault=new Array();
		// add group and update user to add group in his possession
		GroupModel.create({name: req.body.name, description: req.body.description, admins: adminDefault, uas: uasDefault, private: true}).then(function(group){
			UserModel.findOneAndUpdate({_id: req.user._id}, {$push: {groupes: group}}, {safe: true, new: true}).then(function(user){
				return res.ok(group);
			}).catch(function(err){
				return res.error({message: err});
			});
		}).catch(function(err){
			return res.error({message: err});
		});
	},
	//return the list of groups
	getGroups: function(req, res, next){
		UserModel.findOne({_id: req.user._id},{groupes:1}).populate({path:'groupes'}).then(function(groupes){
			var transfer=groupes.toJSON();
			return res.ok(transfer);
		}).catch(function(err){
			return  res.error({message: err.message, error: err});
		});
	},
	//quit from a group
	quit: function(req, res, next){
		GroupModel.findOne({_id: req.params.id}).then(function(group){
			if (group.admins.indexOf(req.user._id)!=-1){
				GroupModel.update({_id:group.id},{$pull:{admins:req.user._id}}).then(function(data){}).catch(function(err){
					return  res.error({message: err.message, error: err});
				});
			}
			else if(group.ecrivains.indexOf(req.user._id)!=-1){
				//message2 = group.ecrivains.indexOf(req.user._id);
				GroupModel.update({_id:group.id},{$pull:{ecrivains:req.user._id}}).then(function(data){}).catch(function(err){
					return  res.error({message: err.message, error: err});
				});
			}
			else if(group.lecteurs.indexOf(req.user._id)!=-1){
				//message3 = group.lecteurs.indexOf(req.user._id);
				GroupModel.update({_id:group.id},{$pull:{lecteurs:req.user._id}}).then(function(data){}).catch(function(err){
					return  res.error({message: err.message, error: err});
				});
			}
			else{
				return res.error({message: "L'utilisateur n'est pas dans le groupe", error:"error"});
			}
			GroupModel.findOne({_id: req.params.id}).populate({path:'uas'}).then(function(group){
				UserModel.update({_id: req.user._id},{$pull:{groupes:group.id}}).then(function(data){
					if(group.admins.length===0&&group.ecrivains.length===0&&group.lecteurs.length===0){
						GroupModel.remove({_id:req.params.id}).then(function(data){
							var trace=new Array();
							for(var i=0;i<group.uas.length;i++){
								if(group.uas[i].admins.indexOf(group.id)!=-1){
									UaModel.update({_id:group.uas[i]._id},{$pull:{admins:group.id}}).then(function(data){
										trace.append("dans admin:"+group.uas[i]._id);
									});
								}
								else if(group.uas[i].access.indexOf(group.id)!=-1){
									UaModel.update({_id:group.uas[i]._id},{$pull:{access:group.id}}).then(function(data){
										trace.append("dans access:"+group.uas[i]._id);
									});
								}
							}
							res.ok({message:"supprimez avec réussi et le groupe n'existe plus",traces:trace});
						}).catch(function(err){
						 	return res.error({message: err.message, error: err});
						});
					}
					else res.ok({message:"supprimez avec réussi"});
				}).catch(function(err){
				 	return res.error({message: err.message, error: err});
				});
			}).catch(function(err){
			 	return res.error({message: err.message, error: err});
			});
		}).catch(function(err){
			return res.error({message: err.message, error: err});
		});
	},
	searchGroup: function(req, res, next){
		GroupModel.find({$or:[{name:{$regex:req.body.search}}, {description:{$regex:req.body.search}}]}).populate({path:'groupes'}).then(function(groupes){
							console.log(groupes);
							return res.ok(groupes);
						}).catch(function(err){
							return  res.error({message: err.message, error: err});
						});
	},
	//recherche les projets dans un projet
	groupInfo: function(req, res, next){
		GroupModel.findOne({name:req.body.name}).populate({path:'admins ecrivains lecteurs uas'}).then(function(group){
			res.ok(group);
		}).catch(function(err){
			return  res.error({message: err.message, error: err});
		});
	},
	//ajouter un projet dans un groupe
	addProject: function(req, res, next){
		GroupModel.findOne({_id:req.params.id}).then(function(group){
			if(group.uas.indexOf(req.body._id)===-1){
				GroupModel.update({_id:group.id},{$push:{uas:req.body}}).then(function(data){
					UaModel.update({_id:req.body._id},{$push:{access:group}}).then(function(data){
						res.ok({message:"Vous avez ajouter le projet dans votre groupe"});
					}).catch(function(err){
						return res.error({message: err.message, error: err});
					});
				}).catch(function(err){
					return res.error({message: err.message, error: err});
				});
			}
			else{
				res.ok({message:"Ce projet est déja existé dans votre groupe"});
			}
		}).catch(function(err){
			return res.error({message: err.message, error: err});
		});
	},
	//un utilisateur participe dans un groupe
	getInGroup: function(req, res, next){
		GroupModel.findOne({_id:req.params.id}).then(function(group){
			GroupModel.update({_id:req.params.id},{$push:{lecteurs:req.user._id}}).then(function(data){
				UserModel.update({_id:req.user._id},{$push:{groupes:req.params.id}}).then(function(data){
					res.ok({message:"Vous avez rejoint le groupe"});
				}).catch(function(err){
					return res.error({message: err.message, error: err});
				});
			}).catch(function(err){
				return res.error({message: err.message, error: err});
			});
		}).catch(function(err){
			return res.error({message: err.message, error: err});
		});
	},
	demandeDroit: function(req, res, next){
		if(req.body.roleAsk === "admin"){
			var demandeType = "DemandeAdmin";
		}
		else if(req.body.roleAsk === "ecrivain"){
			var demandeType = "DemandeEcrivain";
		}
		else{
			res.error({message: "Le role demandé n'existe pas", error: err});
		}
		GroupModel.findOne({_id:req.body.group._id},{admins:1,name:1}).then(function(group){
			MessageModel.create({de: req.user.username, a: group.admins, positionCourante: req.body.roleNow, groupNom: group.name, demande: demandeType}).then(function(message){
				for(var i=0;i<message.a.length;i++){
					UserModel.update({_id:message.a[i]},{$push:{messages:message._id}}).then(function(){
					}).catch(function(err){
						return res.error({message: err.message, error: err});
					});
				}
				res.ok({message:"success"});
			}).catch(function(err){
				return res.error({message: err.message, error: err});
			});
		}).catch(function(err){
			return res.error({message: err.message, error: err});
		});
	},

	donnerDroit: function(req, res, next){
		var roleCourrent=req.body.message.positionCourante;
		if(req.body.message.demande='DemandeAdmin'){
			var roleGroup="admins";
		}
		else if(req.body.message.demande='DemandeEcrivain'){
			var roleGroup="ecrivains";
		}
		else{
			return res.error({message: err.message, error: err});
		}
		if(req.body.decision==="accepter"){
		UserModel.findOne({username:req.body.message.de},{_id:1}).then(function(userId){
			GroupModel.update({name:req.body.message.groupNom},{$push:{roleGroup:userId},$pull:{roleCourrent:userId}}).then(function(){
				res.ok({message:"success"});
			}).catch(function(err){
				return res.error({message: err.message, error: err});
			});
		}).catch(function(err){
			return res.error({message: err.message, error: err});
		});
		}
		else{
			res.ok({message:req.body.decision});
		}
	}



};

module.exports = function (app) {
	app.post('/group/create', 		Group.create);
	app.get('/group/get',		Group.getGroups);
  app.delete('/group/:id',		Group.quit);
	app.post('/group/search', Group.searchGroup);
	app.post('/group/addProjet:id', Group.addProject);
	app.post('/group/info', Group.groupInfo);
	app.post('/group/getIn:id', Group.getInGroup);
	app.post('/group/demandeDroit',Group.demandeDroit);
	app.post('/group/donnerDroit',Group.donnerDroit);
};
