const Call = require('../models/Call');
const Lead = require('../models/Lead');
const User = require('../models/User');
const Activity = require('../models/Activity');


exports.addCall = async (req, res) => {
  const { leadId, contactName, contact, callType, date, employeeEmail } = req.body;
  const lead = await Lead.findById(leadId);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  let employee = null;
  if (employeeEmail) {
    employee = await User.findOne({ email: employeeEmail, role: "employee" });
    if (!employee || String(lead.assignedTo) !== String(employee._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }
  const call = new Call({
    lead: leadId,
    employee: employee ? employee._id : null,
    contactName,
    contact,
    callType,
    date
  });
  await call.save();
  if (!lead.scheduledCalls) lead.scheduledCalls = [];
  lead.scheduledCalls.push(call._id);
  await lead.save();
  
  res.json({ message: 'Call scheduled', call });
};

exports.getCalls = async (req, res) => {
  try {
    const { employeeEmail } = req.query;
    if (!employeeEmail) return res.status(400).json({ error: "employeeEmail required" });

    const employee = await User.findOne({ email: employeeEmail, role: "employee" });
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const calls = await Call.find({ employee: employee._id, status: "scheduled" })
      .populate("lead")
      .populate("employee", "name avatarUrl");
    res.json(calls);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};