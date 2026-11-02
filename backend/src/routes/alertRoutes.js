const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authenticateToken = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const AuditChainService = require('../services/auditChainService');

// List security alerts (Admins & Managers)
router.get('/', authenticateToken, requireRole(['Administrator', 'Manager']), async (req, res) => {
  try {
    const { severity, status, userId } = req.query;
    let alerts = await db.find('security_alerts');

    if (req.user.role === 'Manager') {
      alerts = alerts.filter(a => a.department === req.user.department);
    }

    if (severity) alerts = alerts.filter(a => a.severity.toLowerCase() === severity.toLowerCase());
    if (status) alerts = alerts.filter(a => a.status.toLowerCase() === status.toLowerCase());
    if (userId) alerts = alerts.filter(a => a.user_id === userId);

    alerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return res.json({ alerts, total: alerts.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get alert details
router.get('/:alertId', authenticateToken, requireRole(['Administrator', 'Manager']), async (req, res) => {
  try {
    const alert = await db.findOne('security_alerts', a => a.id === req.params.alertId);
    if (!alert) return res.status(404).json({ error: 'Alert not found.' });

    let triggerEvent = null;
    if (alert.trigger_event_id) {
      triggerEvent = await db.findOne('activity_events', e => e.id === alert.trigger_event_id);
    }

    return res.json({ alert, triggerEvent });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Update alert status & resolution (Admins & Managers)
router.patch('/:alertId/status', authenticateToken, requireRole(['Administrator', 'Manager']), async (req, res) => {
  try {
    const { status, mitigationAction, investigatorNote } = req.body;
    const validStatuses = ['New', 'Investigating', 'Resolved', 'False Positive'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const updates = {
      status,
      resolved_at: ['Resolved', 'False Positive'].includes(status) ? new Date().toISOString() : null,
      resolved_by: req.user.full_name
    };

    if (mitigationAction) updates.mitigation_action = mitigationAction;

    await db.update('security_alerts', a => a.id === req.params.alertId, updates);

    // Audit trail
    await AuditChainService.appendRecord(req.params.alertId, {
      action: 'SECURITY_ALERT_STATUS_UPDATE',
      alert_id: req.params.alertId,
      new_status: status,
      investigator: req.user.email,
      note: investigatorNote || '',
      timestamp: new Date().toISOString()
    });

    return res.json({ message: `Alert status updated to ${status}.`, alertId: req.params.alertId, status });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
