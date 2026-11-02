const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authenticateToken = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const AuditChainService = require('../services/auditChainService');

// List all monitored users (Administrator & Manager)
router.get('/', authenticateToken, requireRole(['Administrator', 'Manager']), async (req, res) => {
  try {
    let users = await db.find('monitored_users');

    // Managers only see their department
    if (req.user.role === 'Manager') {
      users = users.filter(u => u.department === req.user.department);
    }

    return res.json({ users });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Create new user (Public Registration or Admin User Provisioning)
router.post('/', async (req, res, next) => {
  // Delegate to authRoutes registration logic via direct fetch or internal handler
  const authRoutes = require('./authRoutes');
  // Re-route directly
  req.url = '/register';
  return authRoutes(req, res, next);
});

// Get user profile by ID
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Enforce Employee can only view their own profile
    if (req.user.role === 'Employee' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied. You cannot inspect other employees.' });
    }

    const profile = await db.findOne('profiles', p => p.id === userId);
    const monitored = await db.findOne('monitored_users', m => m.user_id === userId);
    const baseline = await db.findOne('user_baselines', b => b.user_id === userId);

    if (!profile) return res.status(404).json({ error: 'User not found.' });

    // Recent 10 events
    const allEvents = await db.find('activity_events', e => e.user_id === userId);
    allEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentEvents = allEvents.slice(0, 10);

    return res.json({
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        role: profile.role,
        department: profile.department,
        is_active: profile.is_active,
        created_at: profile.created_at,
        last_login_at: profile.last_login_at
      },
      monitored,
      baseline,
      recentEvents
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin Action: Temporarily Suspend Account
router.post('/:userId/suspend', authenticateToken, requireRole(['Administrator']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = 'Precautionary suspension due to high risk behavioral anomalies.' } = req.body;

    await db.update('profiles', p => p.id === userId, { is_active: false });
    await db.update('monitored_users', m => m.user_id === userId, { account_status: 'Suspended' });

    // Audit log
    await AuditChainService.appendRecord(userId, {
      action: 'ADMIN_SUSPEND_USER',
      target_user_id: userId,
      performed_by: req.user.email,
      reason,
      timestamp: new Date().toISOString()
    });

    return res.json({ message: 'User account has been suspended and active tokens revoked.', userId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin Action: Revoke Active Sessions
router.post('/:userId/revoke-sessions', authenticateToken, requireRole(['Administrator']), async (req, res) => {
  try {
    const { userId } = req.params;

    await AuditChainService.appendRecord(userId, {
      action: 'ADMIN_REVOKE_SESSIONS',
      target_user_id: userId,
      performed_by: req.user.email,
      timestamp: new Date().toISOString()
    });

    return res.json({ message: 'Active session tokens for user revoked successfully.', userId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Admin Action: Reinstate Account
router.post('/:userId/reinstate', authenticateToken, requireRole(['Administrator']), async (req, res) => {
  try {
    const { userId } = req.params;

    await db.update('profiles', p => p.id === userId, { is_active: true });
    await db.update('monitored_users', m => m.user_id === userId, { account_status: 'Active' });

    await AuditChainService.appendRecord(userId, {
      action: 'ADMIN_REINSTATE_USER',
      target_user_id: userId,
      performed_by: req.user.email,
      timestamp: new Date().toISOString()
    });

    return res.json({ message: 'User account has been reinstated to Active status.', userId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
