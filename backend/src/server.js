const express = require('express');
const cors = require('cors');
const config = require('./config');
const db = require('./database/db');
const runSeed = require('./database/seed');

// Import Route Handlers
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const activityRoutes = require('./routes/activityRoutes');
const alertRoutes = require('./routes/alertRoutes');
const incidentRoutes = require('./routes/incidentRoutes');
const baselineRoutes = require('./routes/baselineRoutes');
const ruleRoutes = require('./routes/ruleRoutes');
const auditRoutes = require('./routes/auditRoutes');
const researchRoutes = require('./routes/researchRoutes');
const simulationRoutes = require('./routes/simulationRoutes');
const reportRoutes = require('./routes/reportRoutes');
const virtualComputerRoutes = require('./routes/virtualComputerRoutes');
const mailRoutes = require('./routes/mailRoutes');
const fileRoutes = require('./routes/fileRoutes');
const taskRoutes = require('./routes/taskRoutes');
const documentRoutes = require('./routes/documentRoutes');
const chatRoutes = require('./routes/chatRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const sharedDriveRoutes = require('./routes/sharedDriveRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow local frontend during development
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check API
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    project: 'Explainable Hybrid Framework for Insider Threat Detection',
    database_mode: db.isPostgres ? 'PostgreSQL / Supabase' : 'Embedded Zero-Config Local Engine',
    ml_mode: config.mlEngineMode,
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/baselines', baselineRoutes);
app.use('/api/rules', ruleRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/simulation', simulationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/virtual-computers', virtualComputerRoutes);
app.use('/api/mail', mailRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/shared-drive', sharedDriveRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// Server Initialization
async function startServer() {
  try {
    // Seed initial database state if needed
    await runSeed();

    app.listen(config.port, () => {
      console.log(`================================================================`);
      console.log(`🚀 UBA SENTINEL BACKEND API RUNNING ON PORT ${config.port}`);
      console.log(`📡 Health Check: http://localhost:${config.port}/api/health`);
      console.log(`🔒 ML Engine Mode: ${config.mlEngineMode}`);
      console.log(`💾 Database: ${db.isPostgres ? 'PostgreSQL / Supabase' : 'Local Persistent Engine'}`);
      console.log(`================================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();

module.exports = app;
