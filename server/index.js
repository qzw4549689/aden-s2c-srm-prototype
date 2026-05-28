const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { seed } = require('./seed');

const app = express();
app.use(cors());
app.use(express.json());

// Seed database on startup
seed();

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/rfqs', require('./routes/rfqs'));
app.use('/api/contracts', require('./routes/contracts'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/settlements', require('./routes/settlements'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/history', require('./routes/history'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Static files
app.use(express.static(path.join(__dirname, '../public')));

// SPA fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Aden S2C SRM Server running on port ${PORT}`);
});

module.exports = app;
