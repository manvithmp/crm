require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const seedAdminAndEmployees = require('./utils/seedpass');

const app = express();
const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>console.log('MongoDB Connected'))
  .catch((err)=>console.error('MongoDB Error:', err));

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/leads', require('./routes/lead'));
app.use('/api/employees', require('./routes/employee'));
app.use('/api/calls', require('./routes/call'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/activity', require('./routes/activity')); 
app.use('/api/users', require('./routes/user'));



app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});