var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var UaSchema = new Schema({
	description: {type: String, required: true},
	deleted: {type: String, required: true},
	private: {type: String, required: true},
	owner: {type: Schema.Types.ObjectId, ref: 'User'},
	location: {
		type: {
			type: String,
			defaut: 'Point'
		},
		coordinates: [Number]
	}
},
{
    timestamps: true
});
UaSchema.index({location: '2dsphere'});
mongoose.model('Ua', UaSchema);

module.exports = UaSchema;
