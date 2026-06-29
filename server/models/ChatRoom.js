const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  // company is optional - null means cross-company room
  company:      { type: mongoose.Schema.Types.ObjectId, ref: 'Company', default: null, index: true },
  name:         { type: String },
  type:         { type: String, enum: ['direct', 'group', 'cross_company'], default: 'direct' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  admin:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastMessage:  { type: mongoose.Schema.Types.ObjectId, ref: 'Message' },
  lastActivity: { type: Date, default: Date.now },
  avatar:       { type: String },
  isActive:     { type: Boolean, default: true }
}, { timestamps: true });

chatRoomSchema.index({ participants: 1 });
chatRoomSchema.index({ company: 1, participants: 1 });

module.exports = mongoose.model('ChatRoom', chatRoomSchema);
