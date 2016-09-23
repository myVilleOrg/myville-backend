var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var UaSchema = new Schema({
	place: String,
	description: String,
	deleted: Boolean,
	owner: {type: Schema.Types.ObjectId, ref: 'User'}
},
{
    timestamps: true
});

mongoose.model('Ua', UaSchema);

module.exports = UaSchema;
