var mongoose 	= require('mongoose'),
	Schema 		= mongoose.Schema;
	//UASchema	= require('./ua');
  //Userchema	= require('./user');

var GroupSchema = new Schema({
	name: {type: String, required: true},
	description: {type: String, required: true},
  admins: [{type: Schema.Types.ObjectId, ref: 'User'}],
	ecrivains: [{type: Schema.Types.ObjectId, ref: 'User'}],
	lecteurs: [{type: Schema.Types.ObjectId, ref: 'User'}],
	uas: [{type: Schema.Types.ObjectId, ref: 'Ua'}],
  private: {type: Boolean, required: true}
},
{
	timestamps: true
});

mongoose.model('Group', GroupSchema);

module.exports = GroupSchema;
