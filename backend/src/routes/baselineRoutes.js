const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authenticateToken = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const BaselineEngine = require('../services/baselineEngine');
const AuditChainService = require('../services/auditChainService');

// Get all baselines overview (Admins & Managers)
router.get('/', authenticateToken, requireRole(['Administrator', 'Manager']), async (req, res) => {
  try {
    const baselines = await db.find('user_baselines');
    const profiles = await db.find('profiles');
    const monitored = await db.find('monitored_users');

    const result = baselines.map(b => {
      const p = profiles.find(prof => prof.id === b.user_id);
      const m = monitored.find(mon => mon.user_id === b.user_id);
      return {
        ...b,
        user_name: p ? p.full_name : 'Unknown User',
        user_email: p ? p.email : 'Unknown Email',
        department: p ? p.department : 'General',
        current_risk_score: m ? m.current_risk_score : 0,
        baseline_status: m ? m.baseline_status : 'Established'
      };
    });

    return res.json({ baselines: result });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get user baseline with dynamic comparison against recent 24h activity
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.user.role === 'Employee' && req.user.id !== userId) {
      return res.status(403).json({ error: 'Access denied. You cannot inspect other user baselines.' });
    }

    const baseline = await BaselineEngine.getBaseline(userId);
    const userProfile = await db.findOne('profiles', p => p.id === userId);

    // Fetch user recent 24h events
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const recentEvents = await db.find('activity_events', e => 
      e.user_id === userId && e.timestamp >= oneDayAgo
    );

    const comparison = await BaselineEngine.evaluateBaselineDeviation(userId, recentEvents);

    return res.json({
      user: { id: userProfile ? userProfile.id : userId, name: userProfile ? userProfile.full_name : 'User' },
      baseline,
      comparison,
      recentEventsSample: recentEvents.slice(0, 15)
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Recalculate baseline from trusted activity
router.post('/:userId/recalculate', authenticateToken, requireRole(['Administrator']), async (req, res) => {
  try {
    const { userId } = req.params;
    const updateResult = await BaselineEngine.recalculateBaseline(userId);

    await AuditChainService.appendRecord(userId, {
      action: 'ADMIN_RECALCULATE_USER_BASELINE',
      target_user_id: userId,
      performed_by: req.user.email,
      timestamp: new Date().toISOString()
    });

    return res.json(updateResult);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Lock or unlock baseline
router.patch('/:userId/lock', authenticateToken, requireRole(['Administrator']), async (req, res) => {
  try {
    const { userId } = req.params;
    const { isLocked } = req.body;

    await db.update('user_baselines', b => b.user_id === userId, { is_baseline_locked: Boolean(isLocked) });

    return res.json({ message: `Baseline lock state set to ${Boolean(isLocked)}.`, userId, isLocked: Boolean(isLocked) });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
