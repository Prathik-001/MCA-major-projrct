const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authenticateToken = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const AuditChainService = require('../services/auditChainService');

// Get all detection rules
router.get('/', authenticateToken, requireRole(['Administrator', 'Manager']), async (req, res) => {
  try {
    const rules = await db.find('detection_rules');
    return res.json({ rules });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Update detection rule thresholds & weights (Administrator only)
router.patch('/:ruleId', authenticateToken, requireRole(['Administrator']), async (req, res) => {
  try {
    const { ruleId } = req.params;
    const { threshold, timeWindowMinutes, severity, riskWeight, isEnabled } = req.body;

    const existingRule = await db.findOne('detection_rules', r => r.id === ruleId);
    if (!existingRule) return res.status(404).json({ error: 'Rule not found.' });

    const updates = {};
    if (threshold !== undefined) updates.threshold = parseFloat(threshold);
    if (timeWindowMinutes !== undefined) updates.time_window_minutes = parseInt(timeWindowMinutes, 10);
    if (severity !== undefined) updates.severity = severity;
    if (riskWeight !== undefined) updates.risk_weight = parseInt(riskWeight, 10);
    if (isEnabled !== undefined) updates.is_enabled = Boolean(isEnabled);

    await db.update('detection_rules', r => r.id === ruleId, updates);

    // Audit configuration change
    await AuditChainService.appendRecord(ruleId, {
      action: 'DETECTION_RULE_CONFIG_MODIFIED',
      rule_id: ruleId,
      rule_code: existingRule.rule_code,
      updates,
      performed_by: req.user.email,
      timestamp: new Date().toISOString()
    });

    const updatedRule = await db.findOne('detection_rules', r => r.id === ruleId);
    return res.json({ message: 'Detection rule updated successfully.', rule: updatedRule });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
