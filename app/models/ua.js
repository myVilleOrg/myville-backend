var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var UaSchema = new Schema({
	place: {type: String, required: true},
	description: {type: String, required: true},
	deleted: {type: Boolean, required: true},
	private: {type: Boolean, required: true},
	owner: {type: Schema.Types.ObjectId, ref: 'User'}
},
{
    timestamps: true
});

mongoose.model('Ua', UaSchema);

module.exports = UaSchema;
