var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var UaSchema = new Schema({
	place: {type: String, required: true},
	description: {type: String, required: true},
	deleted: {type: String, required: true},
	private: {type: String, required: true},
	owner: {type: Schema.Types.ObjectId, ref: 'User'}
},
{
    timestamps: true
});

mongoose.model('Ua', UaSchema);

module.exports = UaSchema;
