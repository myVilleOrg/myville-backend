var  express 		= require('express'),
 mongoose = require('mongoose'),
 Schema = mongoose.Schema;




var CriteriaSchema = new Schema({
	name : {type: String, required: true} //required: true
},{
	timestamps: true
});

mongoose.model('Criteria', CriteriaSchema);
module.exports = CriteriaSchema;

// var esthetique = new CriteriaModel({name:'esthetique'}) ;
//
// esthetique.save(function (err) {
//   if (err) { throw err; }
//   console.log('Critère ajouté avec succès !');
//   mongoose.connection.close();
// });
