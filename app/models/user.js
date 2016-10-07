var mongoose 	= require('mongoose'),
	Schema 		= mongoose.Schema,
	UASchema	= require('./ua');

var UserSchema = new Schema({
	username: {type: String, required: true},
	password: {type: String, required: true},
	avatar: {type: String, required: false},
	email: {type: String, required: true},
	phoneNumber: Number,
	deleted: {type: Boolean, required: true},
	uas: [UASchema],
	facebook_id: {type: String, required: false},
},
{
	timestamps: true
});

mongoose.model('User', UserSchema);

module.exports = UserSchema;
