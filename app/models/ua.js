var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var UaSchema = new Schema({
	place: String,
	description: String,
	user: String,
	deleted: Boolean,
},
{
    timestamps: true
});

mongoose.model('Ua', UaSchema);
