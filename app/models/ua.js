var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var UaSchema = new Schema({
	description: {type: String, required: true},
	deleted: {type: Boolean, required: true},
	private: {type: Boolean, required: true},
	owner: {type: Schema.Types.ObjectId, ref: 'User'},
	admins:[{type: Schema.Types.ObjectId, ref: 'Group'}],
	access:[{type: Schema.Types.ObjectId, ref: 'Group'}],
	location: {
		type: {
			type: String,
			default: 'GeometryCollection'
		},
		geometries: [Schema.Types.Mixed]
	},
	vote : [{type: Schema.Types.ObjectId, ref: 'Vote'}],
	title: {type: String, required: true}
},{
    timestamps: true
});
UaSchema.index({"location": '2dsphere'});
mongoose.model('Ua', UaSchema);

module.exports = UaSchema;
