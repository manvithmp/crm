const mongoose = require('mongoose');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');
const User = require('../models/User');
const csv = require('csvtojson');
const path = require('path');
const fs = require('fs');


exports.uploadCsv = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileName = req.file.originalname || 'CSVUpload';
    const csvPath = path.resolve(req.file.path);

    let employeeIds = [];
    if (req.body.employeeIds) {
      try {
        employeeIds = JSON.parse(req.body.employeeIds);
      } catch (e) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Malformed employeeIds' });
      }
    }
    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'No employees for assignment' });
    }

    for (const id of employeeIds) {
      if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
        fs.unlinkSync(req.file.path);
        return res.status(400).json({ error: 'Invalid employeeId: ' + id });
      }
    }

    const employees = await User.find({ _id: { $in: employeeIds } }, { name: 1 });
    if (employees.length !== employeeIds.length) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'One or more employeeIds not found.' });
    }
    const empMap = {};
    employees.forEach(e => empMap[String(e._id)] = e.name);

    let leadsArr;
    try {
      leadsArr = await csv().fromFile(csvPath);
    } catch (parseErr) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: 'CSV parsing failed', details: parseErr.toString() });
    }
    fs.unlinkSync(req.file.path);

    if (!Array.isArray(leadsArr) || leadsArr.length === 0) {
      return res.status(400).json({ error: 'No leads found in CSV file' });
    }

    const leadsCount = leadsArr.length;
    const empCount = employeeIds.length;
    const perEmp = Math.floor(leadsCount / empCount);

    let assignedLeads = [];
    let unassignedLeads = [];
    let leadIndex = 0;

    for (let i = 0; i < empCount; i++) {
      for (let j = 0; j < perEmp; j++) {
        if (leadIndex >= leadsCount) break;
        const l = leadsArr[leadIndex++];
        if (!l.name || !l.email || !l.phone) continue;
        const assignedToId = employeeIds[i];
        const assignedToName = empMap[assignedToId] || "";
        const lead = new Lead({
          name: l.name,
          email: l.email,
          phone: l.phone,
          leadType: l.leadType || 'warm',
          location: l.location,
          language: l.language,
          status: 'ongoing',
          fileName: fileName,
          assignedTo: new mongoose.Types.ObjectId(assignedToId), 
          assignedToName: assignedToName,
        });
        await lead.save();
        assignedLeads.push(lead);
      }
    }
    while (leadIndex < leadsCount) {
      const l = leadsArr[leadIndex++];
      if (!l.name || !l.email || !l.phone) continue;
      const lead = new Lead({
        name: l.name,
        email: l.email,
        phone: l.phone,
        leadType: l.leadType || 'warm',
        location: l.location,
        language: l.language,
        status: 'ongoing',
        fileName: fileName,
        assignedTo: null,
        assignedToName: "",
      });
      await lead.save();
      unassignedLeads.push(lead);
    }

    await new Activity({ message: `CSV uploaded: ${assignedLeads.length} assigned, ${unassignedLeads.length} unassigned from ${fileName}`, user: req.user?._id }).save();

    res.json({
      message: `${assignedLeads.length} assigned, ${unassignedLeads.length} unassigned`,
      assigned: assignedLeads,
      unassigned: unassignedLeads
    });

  } catch (err) {
    console.error("Critical error in uploadCsv:", err);
    if (req.file && req.file.path) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: 'Internal Server Error', details: err.toString() });
  }
};


exports.getLeads = async (req, res) => {
  let query = {};
  try {
    if (req.query.employeeEmail) {
      const user = await User.findOne({ email: req.query.employeeEmail, role: "employee" });
      if (!user) return res.json([]);
      query = { assignedTo: user._id };
    }
    else if (req.user && req.user.role === 'admin') {
      query = {}; 
    } else {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (req.query.search) {
      query.fileName = { $regex: req.query.search, $options: 'i' };
    }
    const leads = await Lead.find(query)
      .populate('assignedTo', 'name email')
      .populate('scheduledCalls');
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
};


exports.downloadSampleCsv = (req, res) => {
  res.attachment('sample_leads.csv');
  res.send('name,email,phone,leadType,location,language\nJohn Doe,johndoe@example.com,1234567890,hot,Delhi,English');
};


exports.addLead = async (req, res) => {
  const { name, email, phone, leadType, location, language, fileName, assignedTo } = req.body;

  let assignedToName = "";
  if (assignedTo) {
    const user = await User.findById(assignedTo).select('name');
    if (user) assignedToName = user.name;
  }

  const lead = new Lead({
    name,
    email,
    phone,
    leadType: leadType || 'warm',
    location,
    language,
    fileName,
    status: 'ongoing',
    assignedTo: assignedTo ? new mongoose.Types.ObjectId(assignedTo) : null,
    assignedToName
  });
  await lead.save();
  await new Activity({ message: `Lead ${name} added`, user: req.user?._id }).save();
  res.json({ message: 'Lead added', lead });
};


exports.getLead = async (req, res) => {
  const lead = await Lead.findById(req.params.id).populate('assignedTo', 'name email');
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (req.user && req.user.role === 'employee' && String(lead.assignedTo) !== String(req.user._id))
    return res.status(403).json({ error: 'Forbidden' });
  res.json(lead);
};


exports.updateLead = async (req, res) => {
  const lead = await Lead.findById(req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  if (req.body.employeeEmail) {
    const user = await User.findOne({ email: req.body.employeeEmail, role: "employee" });
    if (!user || String(lead.assignedTo) !== String(user._id)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
  }

  if (req.body.assignedTo && req.body.assignedTo !== lead.assignedTo?.toString()) {
    const user = await User.findById(req.body.assignedTo).select('name');
    lead.assignedToName = user ? user.name : "";
    lead.assignedTo = new mongoose.Types.ObjectId(req.body.assignedTo);
  }
  Object.assign(lead, req.body);
  await lead.save();
  await new Activity({ message: `Lead ${lead.name} updated`, user: req.user?._id }).save();
  res.json({ message: 'Lead updated', lead });
};

exports.assignLeads = async (req, res) => {
  const { leadIds, employeeId } = req.body;
  if (!leadIds || !employeeId) return res.status(400).json({ error: 'Missing leadIds or employeeId' });


  const user = await User.findById(employeeId).select('name');
  const assignedToName = user ? user.name : "";
  await Lead.updateMany(
    { _id: { $in: leadIds } },
    { assignedTo: new mongoose.Types.ObjectId(employeeId), assignedToName, status: 'ongoing' }
  );
  await new Activity({ message: `Leads assigned to employee`, user: req.user?._id }).save();
  res.json({ message: 'Leads assigned' });
};

exports.deleteLeadsByBatch = async (req, res) => {
  try {
    const fileName = req.params.batchName;
    if (!fileName) {
      return res.status(400).json({ error: 'Batch name is required' });
    }
    const result = await Lead.deleteMany({ fileName });
    await new Activity({ message: `Deleted all leads in batch: ${fileName}`, user: req.user?._id }).save();
    res.json({ message: `Deleted ${result.deletedCount} leads in batch "${fileName}"` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete leads by batch' });
  }
};