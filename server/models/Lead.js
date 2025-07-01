const mongoose = require('mongoose');
const LeadSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  leadType: { type: String, default: 'warm' },
  location: String,
  language: String,
  status: { type: String, default: 'ongoing' },
  fileName: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  assignedToName: { type: String, default: "" },
  assignedDate: { type: Date, default: Date.now },
  scheduledCalls: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Call' }],
});
module.exports = mongoose.model('Lead', LeadSchema);