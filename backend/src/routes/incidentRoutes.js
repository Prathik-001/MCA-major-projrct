const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authenticateToken = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const AuditChainService = require('../services/auditChainService');

// List incidents (Admins & Managers)
router.get('/', authenticateToken, requireRole(['Administrator', 'Manager']), async (req, res) => {
  try {
    const { status, severity } = req.query;
    let incidents = await db.find('incidents');

    if (status) incidents = incidents.filter(i => i.status.toLowerCase() === status.toLowerCase());
    if (severity) incidents = incidents.filter(i => i.severity.toLowerCase() === severity.toLowerCase());

    incidents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return res.json({ incidents, total: incidents.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Get incident details with notes and timeline
router.get('/:incidentId', authenticateToken, requireRole(['Administrator', 'Manager']), async (req, res) => {
  try {
    const incident = await db.findOne('incidents', i => i.id === req.params.incidentId);
    if (!incident) return res.status(404).json({ error: 'Incident not found.' });

    const notes = await db.find('investigation_notes', n => n.incident_id === req.params.incidentId);
    notes.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    // Fetch user recent events as incident evidence
    const userEvents = await db.find('activity_events', e => e.user_id === incident.user_id);
    userEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    return res.json({
      incident,
      notes,
      evidenceEvents: userEvents.slice(0, 15)
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Add investigation note
router.post('/:incidentId/notes', authenticateToken, requireRole(['Administrator', 'Manager']), async (req, res) => {
  try {
    const { noteText } = req.body;
    if (!noteText || !noteText.trim()) {
      return res.status(400).json({ error: 'Investigation note text is required.' });
    }

    const note = await db.insert('investigation_notes', {
      incident_id: req.params.incidentId,
      author_id: req.user.id,
      author_name: req.user.full_name,
      note_text: noteText.trim()
    });

    return res.status(201).json({ note });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Update incident status / resolution
router.patch('/:incidentId/status', authenticateToken, requireRole(['Administrator', 'Manager']), async (req, res) => {
  try {
    const { status, rootCause, containmentAction, leadInvestigator } = req.body;
    const updates = {};

    if (status) {
      updates.status = status;
      if (['Resolved', 'False Positive'].includes(status)) {
        updates.resolved_at = new Date().toISOString();
      }
    }
    if (rootCause) updates.root_cause = rootCause;
    if (containmentAction) updates.containment_action = containmentAction;
    if (leadInvestigator) updates.lead_investigator = leadInvestigator;

    await db.update('incidents', i => i.id === req.params.incidentId, updates);

    await AuditChainService.appendRecord(req.params.incidentId, {
      action: 'INCIDENT_UPDATE',
      incident_id: req.params.incidentId,
      updates,
      performed_by: req.user.email,
      timestamp: new Date().toISOString()
    });

    return res.json({ message: 'Incident updated successfully.', incidentId: req.params.incidentId, updates });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
