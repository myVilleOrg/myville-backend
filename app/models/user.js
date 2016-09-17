var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var UserSchema = new Schema({
	nickname: String,
	password: String,
	avatar: String,
	email: String,
	phoneNumber: Number,

},
{
    timestamps: true
});

mongoose.model('User', UserSchema);
