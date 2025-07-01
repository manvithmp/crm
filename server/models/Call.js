const mongoose = require('mongoose');

const callSchema = new mongoose.Schema({
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  contactName: String,
  contact: String,
  callType: { type: String, enum: ['referral', 'cold', 'other'], default: 'other' },
  date: Date,
  status: { type: String, enum: ['scheduled', 'done'], default: 'scheduled' }
});

module.exports = mongoose.model('Call', callSchema);