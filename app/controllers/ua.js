
var express 		= require('express'),
	mongoose 		= require('mongoose'),
	UaModel 		= mongoose.model('Ua'),
	UserModel 		= mongoose.model('User'),
	VoteModel		= mongoose.model('Vote'),
	GeoJSON 		= require('mongodb-geojson-normalize');

var Tools = {
	deleteVote: function(req, res, next){
		return new Promise(function(resolve, reject){
			VoteModel.findOneAndRemove({ua: req.params.id, user: req.user._id}).then(function(vote){
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
				return parseInt(ua.score) >= 0;
			});
			resolve(UabyScore);
		});
	},
	formulaScore: function(countVote, creationTime){
		return (5 * countVote[0] + 3 * countVote[1] + 4 * countVote[2] + (-1) * countVote[3] + (-5) * countVote[4]) * Math.exp(- (Date.now() - creationTime)/(1000*3600));
	}
};
var Ua = {
	create: function(req, res, next){
		req.body.geojson = JSON.parse(req.body.geojson);
		var fields = ['description', 'geojson', 'title'];
		for(var i = 0; i < fields.length; i++) {
			if(!req.body[fields[i]]) return res.error({message: fields[i], error: 'Missing'});
		}
		var geometries = [];
		for(var i = 0; i < req.body.geojson.features.length; i++){
			geometries.push({type: req.body.geojson.features[i].geometry.type, coordinates: req.body.geojson.features[i].geometry.coordinates });
		}
		var geojson = {
			type: 'GeometryCollection',
			geometries: geometries
		};
		UaModel.create({title: req.body.title, description: req.body.description, deleted: false, owner: req.user._id, private: true, location: geojson}).then(function(ua){
			UserModel.findOneAndUpdate({_id: req.user._id}, {$push: {uas: ua}}, {safe: true, new: true}).then(function(user){
				return res.ok(ua);
			}).catch(function(err){
				return res.error({message: err});
			});
		}).catch(function(err){
			return res.error({message: err});
		});
	},
	favor: function(req, res, next){
		UaModel.findOne({_id: req.body.ua}).then(function(ua){
			UserModel.findOne({_id: req.user._id}).then(function(user){
				if(!ua ||(ua.private && String(ua.owner) !== req.user._id))	return res.error({message: "ua not found"});

				var pos = user.favoris.indexOf(ua._id);
				var tmpFavoris = user.favoris;
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

		UaModel.find({
			'location': {
				$geoIntersects: {
					/*$box: [
						[mapBorder[0][0], mapBorder[0][1]],
						[mapBorder[1][0], mapBorder[1][1]]
					],*/
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
					/*$box: [
						[mapBorder[0][0], mapBorder[0][1]],
						[mapBorder[1][0], mapBorder[1][1]]
					],*/
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
			Tools.computeScore(parsedUas).then(function(scoredUa){
				var uaGeoJSON = GeoJSON.parse(scoredUa, {path: 'location'});
				return res.ok(uaGeoJSON);
			});

		}).catch(function(err){
			return res.error({message: err});
		});
	},
	mine: function(req, res, next){
		UaModel.find({owner: req.user._id, deleted: false}).populate({path: 'owner'}).then(function(uas){
			var uaGeoJSON = GeoJSON.parse(uas, {path: 'location'});
			return res.ok(uaGeoJSON);
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
	favorite: function(req, res, next){
		UserModel.findOne({_id: req.user._id, deleted: false}).select('_id avatar deleted favoris username facebook_id').populate({path: 'favoris'}).then(function(user){

			var promises = [];
			for(var i = 0; i < user.favoris.length; i++){
				promises.push(UserModel.findOne({_id: user.favoris[i].owner}).select('_id avatar deleted username facebook_id'));
			}
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
	delete: function(req, res, next){
		UaModel.findOne({_id: req.params.id}).then(function(ua){
			if(!ua || ua.owner != req.user._id) return res.error({message: 'Ua does not exist / Ua is not yours', error: 'Not found / Not yours'});
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
	app.post('/ua/create', 		Ua.create);
	app.get('/ua/get/geo', 		Ua.getGeo);
	app.get('/ua/get/popular', 	Ua.getPopular);
	app.get('/ua/get/mine',	    Ua.mine);
	app.get('/ua/get/favorite', Ua.favorite);
	app.put('/ua/:id',			Ua.update);
	app.get('/ua/:id',	    	Ua.get);
	app.post('/ua/favor',		Ua.favor);
	app.delete('/ua/:id',		Ua.delete);
	app.post('/ua/vote/:id',	Ua.vote);
};
