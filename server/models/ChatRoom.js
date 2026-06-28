const mongoose = require('mongoose');
const chatRoomSchema = new mongoose.Schema({
  company:      { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
  name:         { type: String },
  type:         { type: String, enum: ['direct','group'], default: 'direct' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admin:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastMessage:  { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastActivity: { type: Date, default: Date.now },
  avatar:       { type: String },
  isActive:     { type: Boolean, default: true }
}, { timestamps: true });
chatRoomSchema.index({ company: 1, participants: 1 });
module.exports = mongoose.model('ChatRoom', chatRoomSchema);
