const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authenticateToken = require('../middleware/auth');
const ActivityService = require('../services/activityService');

/**
 * GET /api/calendar/events
 * Get calendar events for authenticated employee (+ company shared meetings)
 */
router.get('/events', authenticateToken, async (req, res) => {
  try {
    const events = await db.find('calendar_events', e => {
      if (req.user.role === 'Administrator') return true;
      return e.employee_id === req.user.id || e.is_shared;
    });

    events.sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
    return res.json(events);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/calendar/events
 * Create calendar event
 */
router.post('/events', authenticateToken, async (req, res) => {
  try {
    const { title, description = '', start_time, end_time, location = 'Virtual Room', is_shared = false, attendees = [], color = 'blue' } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Event title is required.' });
    if (!start_time || !end_time) return res.status(400).json({ error: 'Start and end time are required.' });

    const newEvent = await db.insert('calendar_events', {
      employee_id: req.user.id,
      title: title.trim(),
      description: description.trim(),
      start_time,
      end_time,
      location,
      is_shared,
      attendees,
      color
    });

    await ActivityService.recordEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      eventType: 'CALENDAR_EVENT_CREATE',
      resourceId: `/calendar/events/${newEvent.id}`,
      action: 'CREATE',
      status: 'SUCCESS',
      metadata: { title: title.trim(), is_shared, start_time }
    });

    return res.json({ success: true, event: newEvent });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/calendar/events/:id
 * Delete calendar event
 */
router.delete('/events/:id', authenticateToken, async (req, res) => {
  try {
    const event = await db.findOne('calendar_events', e => e.id === req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found.' });

    if (event.employee_id !== req.user.id && req.user.role !== 'Administrator') {
      return res.status(403).json({ error: 'Access denied: Cannot delete another user’s calendar event.' });
    }

    await db.delete('calendar_events', e => e.id === event.id);
    return res.json({ success: true, message: 'Event deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
