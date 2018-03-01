var mongoose 	= require('mongoose'),
	Schema 		= mongoose.Schema;

var MessageSchema = new Schema({
  de : {type: String, ref: 'User',required:true},
  a : [{type: Schema.Types.ObjectId, ref: 'User',required:true}],
  positionCourante :  {type: String, required: true},
	groupNom : {type: String, ref: 'Group',required:true},
  demande :  {type: String, enum : ['DemandeAdmin','DemandeEcrivain','InviteAdmin','InviteEcrivain','InviteLecteur','DemandeAccepte','DemandeRejecte'],required: true},
  message : {type: String},
  vu : {type: Boolean,default: false, required: true}
},
{
  timestamps: true
});

mongoose.model('Message', MessageSchema);

module.exports = MessageSchema;
