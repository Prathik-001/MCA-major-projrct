const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../database/db');
const ActivityService = require('../services/activityService');
const authenticateToken = require('../middleware/auth');

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await db.findOne('profiles', p => p.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      // Record failed authentication telemetry
      await ActivityService.recordEvent({
        userId: '00000000-0000-0000-0000-000000000000',
        userEmail: email,
        eventType: 'FAILED_LOGIN',
        resourceId: '/api/auth/login',
        action: 'AUTH',
        status: 'FAILURE',
        ipAddress: req.ip || '127.0.0.1',
        metadata: { reason: 'User not found' }
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account has been temporarily suspended by security administration.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      // Record failed authentication telemetry
      await ActivityService.recordEvent({
        userId: user.id,
        userEmail: user.email,
        eventType: 'FAILED_LOGIN',
        resourceId: '/api/auth/login',
        action: 'AUTH',
        status: 'FAILURE',
        ipAddress: req.ip || '127.0.0.1',
        metadata: { reason: 'Incorrect password hash match' }
      });
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Success authentication
    await db.update('profiles', p => p.id === user.id, { last_login_at: new Date().toISOString() });

    await ActivityService.recordEvent({
      userId: user.id,
      userEmail: user.email,
      eventType: 'LOGIN',
      resourceId: '/portal/dashboard',
      action: 'AUTH',
      status: 'SUCCESS',
      ipAddress: req.ip || '127.0.0.1',
      metadata: { user_agent: req.headers['user-agent'] }
    });

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        department: user.department
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        department: user.department
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

// Register new employee & provision virtual computer
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, role = 'Employee', department = 'Engineering', jobTitle = 'Associate Engineer' } = req.body;
    
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'Full name is required.' });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = await db.findOne('profiles', p => p.email.toLowerCase() === cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email address already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = require('crypto').randomUUID();
    const deptPrefix = (department.substring(0, 3) || 'EMP').toUpperCase();
    const randomNum = Math.floor(100 + Math.random() * 900);
    const employeeCode = `${deptPrefix}-${randomNum}`;

    // 1. Create Profile
    const profile = await db.insert('profiles', {
      id: userId,
      email: cleanEmail,
      password_hash: passwordHash,
      full_name: fullName.trim(),
      role: role === 'Administrator' ? 'Administrator' : 'Employee',
      department: department.trim(),
      employee_code: employeeCode,
      job_title: jobTitle.trim(),
      is_active: true
    });

    // 2. Create Monitored User Record
    await db.insert('monitored_users', {
      user_id: userId,
      employee_code: employeeCode,
      full_name: fullName.trim(),
      email: cleanEmail,
      department: department.trim(),
      job_title: jobTitle.trim(),
      risk_score: 12,
      risk_level: 'LOW',
      account_status: 'Active',
      recent_suspicious_count: 0
    });

    // 3. Create Baseline
    await db.insert('user_baselines', {
      user_id: userId,
      mean_daily_events: 20,
      std_daily_events: 3.5,
      mean_downloads: 2,
      std_downloads: 1.0,
      mean_failed_logins: 0.1,
      std_failed_logins: 0.3,
      typical_start_hour: 9,
      typical_end_hour: 18,
      is_baseline_locked: false
    });

    // 4. Provision Virtual Computer
    await db.insert('virtual_computers', {
      employee_id: userId,
      computer_name: `${fullName.trim().split(' ')[0]}'s Virtual Desktop`,
      os_version: 'macOS 15.1 Sonoma Virtual Edition',
      status: 'Online',
      current_application: 'Finder',
      last_activity_at: new Date().toISOString()
    });

    // 5. Provision Desktop Preferences
    await db.insert('desktop_preferences', {
      employee_id: userId,
      wallpaper: 'sonoma-dark',
      dock_position: 'bottom',
      dock_size: 'medium',
      theme: 'dark',
      accent_color: 'blue',
      notifications_enabled: true
    });

    // 6. Provision Sample Welcome File
    await db.insert('employee_files', {
      employee_id: userId,
      name: 'Welcome_Employee_Onboarding.pdf',
      file_type: 'PDF',
      file_size_bytes: 524288,
      storage_path: `/storage/employees/${userId}/Welcome_Employee_Onboarding.pdf`,
      content_preview: `CONFIDENTIAL - EMPLOYEE ONBOARDING GUIDE\nWelcome to Sentinel Organization, ${fullName.trim()}!\nYour independent virtual computer environment is configured.`,
      classification: 'INTERNAL',
      is_shared: false,
      is_deleted: false
    });

    // 7. Provision Welcome Email
    const adminUser = await db.findOne('profiles', p => p.role === 'Administrator') || {
      id: 'a1000000-0000-0000-0000-000000000001',
      email: 'admin@sentinel.local',
      full_name: 'Security Operations Center'
    };

    const welcomeEmail = await db.insert('employee_emails', {
      sender_id: adminUser.id,
      sender_email: adminUser.email,
      sender_name: adminUser.full_name,
      subject: `Welcome to your Isolated Virtual Workstation, ${fullName.trim()}`,
      body: `Hello ${fullName.trim()},\n\nYour independent macOS-inspired virtual computer environment has been initialized. You have personal isolated mailboxes, confidential documents storage, team chat channels, and calendar schedules.\n\nAll actions within this corporate virtual computer are logged for security auditing under Sentinel UBA Policy SEC-101.`,
      is_draft: false,
      is_starred: true,
      is_deleted: false,
      has_attachments: false,
      sent_at: new Date().toISOString()
    });

    await db.insert('email_recipients', {
      email_id: welcomeEmail.id,
      recipient_id: userId,
      recipient_email: cleanEmail,
      recipient_name: fullName.trim(),
      folder: 'inbox',
      is_read: false,
      is_starred: true,
      is_deleted: false,
      received_at: new Date().toISOString()
    });

    // 8. Add to #general-company chat
    const generalChat = await db.findOne('chat_conversations', c => c.name === '#general-company');
    if (generalChat) {
      await db.insert('conversation_members', {
        conversation_id: generalChat.id,
        employee_id: userId
      });
    }

    // 9. Telemetry
    await ActivityService.recordEvent({
      userId,
      userEmail: cleanEmail,
      eventType: 'USER_REGISTER',
      resourceId: `/profiles/${userId}`,
      action: 'CREATE',
      status: 'SUCCESS',
      ipAddress: req.ip || '127.0.0.1',
      metadata: { department, jobTitle, employeeCode }
    });

    return res.status(201).json({
      success: true,
      message: 'Account and virtual computer provisioned successfully.',
      user: {
        id: userId,
        email: cleanEmail,
        full_name: fullName.trim(),
        role: profile.role,
        department: profile.department
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed to complete registration.' });
  }
});

// Current user profile
router.get('/me', authenticateToken, async (req, res) => {
  return res.json({ user: req.user });
});

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  await ActivityService.recordEvent({
    userId: req.user.id,
    userEmail: req.user.email,
    eventType: 'LOGOUT',
    resourceId: '/portal/logout',
    action: 'TERMINATE',
    status: 'SUCCESS',
    ipAddress: req.ip || '127.0.0.1'
  });
  return res.json({ message: 'Session terminated successfully.' });
});

module.exports = router;
