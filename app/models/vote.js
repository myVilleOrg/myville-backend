var mongoose = require('mongoose'),
	Schema = mongoose.Schema;

var VoteSchema = new Schema({
	ua : {type: Schema.Types.ObjectId, ref: 'Ua'},
	user : {type: Schema.Types.ObjectId, ref: 'User'},
	vote : {type: Array}
},{
    timestamps: true
});
mongoose.model('Vote', VoteSchema);

module.exports = VoteSchema;
