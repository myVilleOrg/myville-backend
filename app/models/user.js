var mongoose 	= require('mongoose'),
	Schema 		= mongoose.Schema,
	UASchema	= require('./ua');

var UserSchema = new Schema({
	nickname: String,
	password: String,
	avatar: String,
	email: String,
	phoneNumber: Number,
	deleted: Boolean,
	uas: [UASchema]
},
{
	timestamps: true
});

mongoose.model('User', UserSchema);

module.exports = UserSchema;
