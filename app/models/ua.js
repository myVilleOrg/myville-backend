var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var UaSchema = new Schema({
	description: {type: String, required: true},
	deleted: {type: Boolean, required: true},
	private: {type: Boolean, required: true},
	owner: {type: Schema.Types.ObjectId, ref: 'User'},
	location: {
		type: {
			type: String,
			default: 'GeometryCollection'
		},
		geometries: [Schema.Types.Mixed]
	},
	title: {type: String, required: true}
},{
    timestamps: true
});
UaSchema.index({"location": '2dsphere'});
mongoose.model('Ua', UaSchema);

module.exports = UaSchema;
