const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authenticateToken = require('../middleware/auth');
const ActivityService = require('../services/activityService');

// Get activity events with filters & pagination
router.get('/', authenticateToken, async (req, res) => {
  try {
    const {
      userId,
      eventType,
      isSuspicious,
      status,
      limit = 50,
      offset = 0,
      search
    } = req.query;

    let events = await db.find('activity_events');

    // 1. RBAC Enforcements
    if (req.user.role === 'Employee') {
      // Employees strictly limited to own events
      events = events.filter(e => e.user_id === req.user.id);
    } else if (req.user.role === 'Manager') {
      // Managers limited to their department members or self
      const deptProfiles = await db.find('profiles', p => p.department === req.user.department);
      const allowedIds = new Set(deptProfiles.map(p => p.id));
      events = events.filter(e => allowedIds.has(e.user_id));
    }

    // 2. Query Filters
    if (userId) {
      events = events.filter(e => e.user_id === userId);
    }
    if (eventType) {
      events = events.filter(e => e.event_type === eventType);
    }
    if (isSuspicious !== undefined) {
      const suspiciousBool = isSuspicious === 'true';
      events = events.filter(e => e.is_suspicious === suspiciousBool);
    }
    if (status) {
      events = events.filter(e => e.status === status.toUpperCase());
    }
    if (search) {
      const q = search.toLowerCase();
      events = events.filter(e => 
        (e.user_email && e.user_email.toLowerCase().includes(q)) ||
        (e.resource_id && e.resource_id.toLowerCase().includes(q)) ||
        (e.event_type && e.event_type.toLowerCase().includes(q))
      );
    }

    // Sort newest first
    events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = events.length;
    const paginated = events.slice(parseInt(offset, 10), parseInt(offset, 10) + parseInt(limit, 10));

    return res.json({
      total,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      events: paginated
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Explicit endpoint to ingest activity (used by test applications / simulations)
router.post('/record', authenticateToken, async (req, res) => {
  try {
    const {
      userId,
      eventType,
      resourceId,
      action,
      status,
      ipAddress,
      metadata
    } = req.body;

    // Enforce that employees cannot record events on behalf of other users
    const effectiveUserId = req.user.role === 'Employee' ? req.user.id : (userId || req.user.id);
    const targetUser = await db.findOne('profiles', p => p.id === effectiveUserId);
    const resolvedEmail = targetUser ? targetUser.email : req.user.email;

    const recordResult = await ActivityService.recordEvent({
      userId: effectiveUserId,
      userEmail: resolvedEmail,
      eventType: eventType || 'PAGE_ACCESS',
      resourceId: resourceId || '/portal/general',
      action: action || 'READ',
      status: status || 'SUCCESS',
      ipAddress: ipAddress || req.ip || '127.0.0.1',
      metadata: metadata || {}
    });

    return res.status(201).json(recordResult);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;
