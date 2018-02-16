
var express 		= require('express'),
	mongoose 		= require('mongoose'),
	UaModel 		= mongoose.model('Ua'),
	UserModel 		= mongoose.model('User'),
  GroupModel  = mongoose.model('Group'),
	VoteModel		= mongoose.model('Vote'),
	GeoJSON 		= require('mongodb-geojson-normalize');

const util = require('util');
var fs = require("fs");

/*var Tools = {
	/*Permits to delete vote
	deleteVote: function(req, res, next){
		return new Promise(function(resolve, reject){
			VoteModel.findOneAndRemove({ua: req.params.id, user: req.user._id}, {deleted: true}).then(function(vote){
				UaModel.findOne({_id: req.params.id}).then(function(ua){
					var votes = ua.vote;
					var pos = votes.indexOf(vote._id);
					if(pos !== -1){
						votes.splice(pos,1);
					}
					UaModel.findOneAndUpdate({_id: req.params.id}, {vote: votes}, {new: true}).then(function(ua){
						resolve({obj: ua, message: "vote deleted"});
					}).catch(function(err){
						reject(err);
					});
				}).catch(function(err){
					reject(err);
				});
			}).catch(function(err){
				reject(err);
			});
		});
	},
	/*Permits to insert vote
	vote: function(req, res, next){
		return new Promise(function(resolve, reject){
			var fvote = {
				ua: req.params.id,
				user: req.user._id,
				vote: req.body.vote
			};

			VoteModel.create(fvote).then(function(foundVote){
				UaModel.findOne({_id: req.params.id}).then(function(ua){
					if(!ua ||(ua.private && ua.owner != req.user._id))	return res.error({message: "ua not found"});
					UaModel.findOneAndUpdate({_id: req.params.id}, {$push: {vote: foundVote._id}}, {safe: true, new: true}).then(function(ua){
						resolve(ua);
					}).catch(function(err){
						VoteModel.findOneAndRemove({ua: req.params.id, user: req.user._id}).then(function(){
							reject(err);
						}).catch(function(err){
							reject(err);
						});
					});
				}).catch(function(err){
					reject(err);
				});
			}).catch(function(err){
				reject(err);
			});
		});
	},

	/*Compute a score for a uas' list
	computeScore: function(uas){
		return new Promise(function(resolve, reject){
			for(var i = 0; i < uas.length; i++){
				var currentScore = 0;
				var countVote = [0, 0, 0, 0, 0];
				if(uas[i].vote.length > 0) {
					for(var j = 0; j < uas[i].vote.length; j++){
						var idx = uas[i].vote[j].vote[0]
						countVote[idx]++;
					}
				}
				currentScore = Tools.formulaScore(countVote, uas[i].createdAt);
				uas[i]['score'] = currentScore;
			}
			// sorted by score
			var UabyScore = uas.slice(0);
			UabyScore.sort(function(a,b) {
				return b.score - a.score;
			});
			UabyScore = UabyScore.filter(function(ua){
				return parseInt(ua.score) >= 0; // we fetch only score > 0
			});
			resolve(UabyScore);
		});
	},
	/*Formula to get a score Ae^(-t)
	formulaScore: function(countVote, creationTime){
		return (5 * countVote[0] + 3 * countVote[1] + 4 * countVote[2] + (-1) * countVote[3] + (-5) * countVote[4]) * Math.exp(- (Date.now() - creationTime)/(1000*3600));
	}

};*/
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
					if(group.admins.length==0&&group.ecrivains.length==0&&group.lecteurs.length==0){
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
			// GroupModel.update({_id:group.id},{$pull:{users:req.user._id}}).then(function(data){
			// 	rep=GroupModel.findOne({_id:group.id,admins: req.user._id});
			// 	if(rep!=null){
			// 		GroupModel.update({_id:group.id,admins: req.user._id},{$pull:{admins:req.user._id}});
			// 	}
			// 	UserModel.update({_id: req.user._id},{$pull:{groupes:group.id}}).then(function(data){
			// 		//il faut rajouter un quit d'admin
			// 		res.ok({message:"réussi"});
			// 	}).catch(function(err){
			// 		return res.error({message: err.message, error: err});
			// 	});
			// }).catch(function(err){
			// 	return res.error({message: err.message, error: err});
			// });
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
			if(group.uas.indexOf(req.body._id)==-1){
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
	}
	// function(req, res, next){
	 	// UaModel.find({owner: req.user._id, deleted: false}).populate({path: 'owner'}).then(function(uas){
		 //	var uaGeoJSON = GeoJSON.parse(uas, {path: 'location'});
		 	//return res.ok(uaGeoJSON);
	// });


	/*
	favor: function(req, res, next){
		GroupModel.findOne({_id: req.body.ua}).then(function(ua){
			UserModel.findOne({_id: req.user._id}).then(function(user){
				if(!ua ||(ua.private && String(ua.owner) !== req.user._id))	return res.error({message: "ua not found"});

				var pos = user.favoris.indexOf(ua._id);
				var tmpFavoris = user.favoris;
				// already favor ? Exists => Delete | Not exists => Add
				if(pos == -1) tmpFavoris.push(ua);
				else tmpFavoris.splice(pos,1);

				UserModel.findOneAndUpdate({_id: req.user._id}, {favoris: tmpFavoris}, {new: true}).then(function(user){
					return res.ok(user);
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
	get: function(req, res, next){
		UaModel.findOne({_id: req.params.id, deleted: false}).then(function(ua){
			if(!ua ||(ua.private && ua.owner != req.user._id)) return res.error({message: 'Ua does not exist', error: 'Not found'});
			return res.ok(ua);
		}).catch(function(err){
			return res.error({message: 'Ua not found', error: 'Not found'});
		});
	},

	getGeo: function(req, res, next){
		var mapBorder = JSON.parse(req.query.map);
		for(var i = 0; i < mapBorder.length; i++){
			if(mapBorder[i][0] > 180) mapBorder[i][0] = 179;
			if(mapBorder[i][0] < -180) mapBorder[i][0] = -179;
			if(mapBorder[i][1] > 90) mapBorder[i][1] = 90;
			if(mapBorder[i][1] > -90) mapBorder[i][1] = -90;
		}
		/*Intersection with big polygon which has the size of user's map visualization and our data, we fetch the ua in the view
		UaModel.find({
			'location': {
				$geoIntersects: {
					$geometry: {
						type: 'Polygon',
						coordinates: [
							[
								[mapBorder[0][0], mapBorder[0][1]],
								[mapBorder[1][0], mapBorder[1][1]],
								[-mapBorder[0][0], mapBorder[1][1]],
								[mapBorder[0][0], -mapBorder[1][1]],
								[mapBorder[0][0], mapBorder[0][1]],
							]
						],
						crs: {
							type: "name",
							properties: { name: "urn:x-mongodb:crs:strictwinding:EPSG:4326" }
						}
					}
				}
			}
		, deleted: false}).populate({
			path: 'owner',
			select: '_id avatar deleted username facebook_id'
		}).then(function(uas){
			var parsedUas = [];
			// Cleanup the ua
			for(var i = 0; i < uas.length; i++){
				if(!uas[i].deleted){
					if(req.user && uas[i].owner._id == req.user._id) {
						parsedUas.push(uas[i]);
					}
					if(!uas[i].private){
						parsedUas.push(uas[i]);
					}
				}
			}
			//convert to geoJSON
			var uaGeoJSON = GeoJSON.parse(parsedUas, {path: 'location'});
			return res.ok(uaGeoJSON);
		}).catch(function(err){
			return res.error({message: err});
		});
	},
	getPopular: function(req, res, next){
		var mapBorder = JSON.parse(req.query.map);
		for(var i = 0; i < mapBorder.length; i++){
			if(mapBorder[i][0] > 180) mapBorder[i][0] = 179;
			if(mapBorder[i][0] < -180) mapBorder[i][0] = -179;
			if(mapBorder[i][1] > 90) mapBorder[i][1] = 90;
			if(mapBorder[i][1] > -90) mapBorder[i][1] = -90;
		}

		UaModel.find({
			'location': {
				$geoIntersects: {
					$geometry: {
						type: 'Polygon',
						coordinates: [
							[
								[mapBorder[0][0], mapBorder[0][1]],
								[mapBorder[1][0], mapBorder[1][1]],
								[-mapBorder[0][0], mapBorder[1][1]],
								[mapBorder[0][0], -mapBorder[1][1]],
								[mapBorder[0][0], mapBorder[0][1]],
							]
						],
						crs: {
							type: "name",
							properties: { name: "urn:x-mongodb:crs:strictwinding:EPSG:4326" }
						}
					}
				}
			}
		, deleted: false}).populate({
			path: 'owner',
			select: '_id avatar deleted username facebook_id'
		}).populate({
			path: 'vote'
		}).then(function(uas){
			var parsedUas = [];
			for(var i = 0; i < uas.length; i++){
				if(!uas[i].deleted){
					if(req.user && uas[i].owner._id == req.user._id) {
						parsedUas.push(uas[i]);
					}
					if(!uas[i].private){
						parsedUas.push(uas[i]);
					}
				}
			}
			//compute the score
			Tools.computeScore(parsedUas).then(function(scoredUa){
				var uaGeoJSON = GeoJSON.parse(scoredUa, {path: 'location'});
				return res.ok(uaGeoJSON);
			});

		}).catch(function(err){
			return res.error({message: err});
		});
	},

	vote: function(req, res, next){
		VoteModel.findOne({ua: req.params.id, user: req.user._id}).then(function(vote){
			if(vote){
				Tools.deleteVote(req, res, next).then(function(){
					Tools.vote(req, res, next).then(function(ua){
						if(ua){
							return res.ok({message: 'Voted !'});
						}else{
							return res.error({message: 'ua not found'});
						}
					}).catch(function(err){
						return res.error(err);
					});
				}).catch(function(err){
					return res.error(err);
				});
			} else {
				Tools.vote(req, res, next).then(function(ua){
					return res.ok(ua);
				}).catch(function(err){
					return res.error(err);
				});
			}
		});
	},
	deleteVote: function(req, res, next){
		VoteModel.findOne({ua: req.params.id, user: req.user._id}).then(function(vote){
			if(vote){
				console.log(req);
				Tools.deleteVote(req, res, next).then(function(){
					return res.ok();
				}).catch(function(err){
					return res.error(err);
				});
			}
		});
	},

	favorite: function(req, res, next){
		UserModel.findOne({_id: req.user._id, deleted: false}).select('_id avatar deleted favoris username facebook_id').populate({path: 'favoris'}).then(function(user){

			var promises = [];
			for(var i = 0; i < user.favoris.length; i++){
				promises.push(UserModel.findOne({_id: user.favoris[i].owner}).select('_id avatar deleted username facebook_id'));
			}
			// Populate owner
			Promise.all(promises).then(function(users){
				var parsedUa = []
				for(var i = 0; i < users.length; i++){
					user.favoris[i].owner = users[i];
					if(!user.favoris[i].deleted){
						parsedUa.push(user.favoris[i]);
					}
				}
				var uaGeoJSON = GeoJSON.parse(parsedUa, {path: 'location'});
				return res.ok(uaGeoJSON);
			});
		}).catch(function(err){
			return res.error(err);
		});
	},
	update: function(req, res, next){
		var fields = ['description', 'title', 'publish'];
		for(var i = 0; i < fields.length; i++) {
			if(!req.body[fields[i]]) return res.error({message: fields[i], error: 'Missing'});
		}
		req.body.publish = (req.body.publish === 'true'); // conversion booleene
		UaModel.findOneAndUpdate({_id: req.params.id, deleted: false}, {description: req.body.description, title: req.body.title, private: req.body.publish}, {new: true}).then(function(ua){
			if(!ua || ua.owner != req.user._id) return res.error({message: 'Ua does not exist / Ua is not yours', error: 'Not found / Not yours'});
			return res.json(ua);
		}).catch(function(err){
			return res.error({message: 'Ua does not exist / Ua is not yours', error: 'Not found / Not yours'});
		});
	},

	search: function(req, res, next) {
		fs.writeFileSync("search",util.inspect(req.body, false, null),"UTF-8");

		var mapBorder = JSON.parse(req.body.map);
		for(var i = 0; i < mapBorder.length; i++){
			if(mapBorder[i][0] > 180) mapBorder[i][0] = 179;
			if(mapBorder[i][0] < -180) mapBorder[i][0] = -179;
			if(mapBorder[i][1] > 90) mapBorder[i][1] = 90;
			if(mapBorder[i][1] > -90) mapBorder[i][1] = -90;
		}
		UaModel.find({$or:[{description:{$regex:req.body.search}},{title:{$regex:req.body.search}}],
			'location': {
				$geoIntersects: {
					$geometry: {
						type: 'Polygon',
						coordinates: [
							[
								[mapBorder[0][0], mapBorder[0][1]],
								[mapBorder[1][0], mapBorder[1][1]],
								[-mapBorder[0][0], mapBorder[1][1]],
								[mapBorder[0][0], -mapBorder[1][1]],
								[mapBorder[0][0], mapBorder[0][1]],
							]
						],
						crs: {
							type: "name",
							properties: { name: "urn:x-mongodb:crs:strictwinding:EPSG:4326" }
						}
					}
				}
			}
		, deleted: false}).populate({
			path: 'owner',
			select: '_id avatar deleted username facebook_id'
		}).then(function(uas){
			var parsedUas = [];
			// Cleanup the ua
			for(var i = 0; i < uas.length; i++){
				if(!uas[i].deleted){
					if(req.user && uas[i].owner._id == req.user._id) {
						parsedUas.push(uas[i]);
					}
					if(!uas[i].private){
						parsedUas.push(uas[i]);
					}
				}
			}
			//convert to geoJSON
			var uaGeoJSON = GeoJSON.parse(parsedUas, {path: 'location'});
			return res.ok(uaGeoJSON);
		}).catch(function(err){
			return res.error({message: err});
		});
	}*/
};

module.exports = function (app) {
	app.post('/group/create', 		Group.create);
	app.get('/group/get',		Group.getGroups);
  app.delete('/group/:id',		Group.quit);
	app.post('/group/search', Group.searchGroup);
	app.post('/group/addProjet:id', Group.addProject);
	app.post('/group/info', Group.groupInfo);
	app.post('/group/getIn:id', Group.getInGroup);
	/*app.get('/ua/get/geo', 		Ua.getGeo);
	app.get('/ua/get/popular', 	Ua.getPopular);
	app.get('/ua/get/mine',	    Ua.mine);
	app.post('/ua/search',	   	Ua.search);
	app.get('/ua/get/favorite', Ua.favorite);
	app.put('/ua/:id',			Ua.update);
	app.get('/ua/:id',	    	Ua.get);

	app.post('/ua/vote/:id',	Ua.vote);
	app.delete('/ua/vote/:id',	Ua.deleteVote);*/
};
