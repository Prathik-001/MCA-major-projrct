const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authenticateToken = require('../middleware/auth');
const ActivityService = require('../services/activityService');

/**
 * GET /api/mail/contacts
 * Returns list of registered employees for email autocomplete
 */
router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    const profiles = await db.find('profiles', p => p.is_active);
    const contacts = profiles.map(p => ({
      id: p.id,
      email: p.email,
      name: p.full_name,
      department: p.department,
      role: p.role
    }));
    return res.json(contacts);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/mail/inbox
 * Received emails for authenticated employee
 */
router.get('/inbox', authenticateToken, async (req, res) => {
  try {
    const recips = await db.find('email_recipients', r => r.recipient_id === req.user.id && r.folder === 'inbox' && !r.is_deleted);
    const allEmails = await db.find('employee_emails');
    const attachments = await db.find('email_attachments');

    const result = recips.map(r => {
      const email = allEmails.find(e => e.id === r.email_id) || {};
      const atts = attachments.filter(a => a.email_id === r.email_id);
      return {
        id: r.id,
        email_id: email.id,
        sender_id: email.sender_id,
        sender_name: email.sender_name,
        sender_email: email.sender_email,
        subject: email.subject,
        body: email.body,
        sent_at: email.sent_at || email.created_at,
        is_read: r.is_read,
        is_starred: r.is_starred,
        has_attachments: atts.length > 0,
        attachments: atts
      };
    });

    result.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/mail/sent
 * Sent emails by authenticated employee
 */
router.get('/sent', authenticateToken, async (req, res) => {
  try {
    const sentEmails = await db.find('employee_emails', e => e.sender_id === req.user.id && !e.is_draft && !e.is_deleted);
    const recips = await db.find('email_recipients');
    const attachments = await db.find('email_attachments');

    const result = sentEmails.map(e => {
      const recipList = recips.filter(r => r.email_id === e.id && r.folder === 'inbox');
      const atts = attachments.filter(a => a.email_id === e.id);
      return {
        id: e.id,
        email_id: e.id,
        sender_id: e.sender_id,
        sender_name: e.sender_name,
        sender_email: e.sender_email,
        recipients: recipList.map(r => ({ email: r.recipient_email, name: r.recipient_name })),
        subject: e.subject,
        body: e.body,
        sent_at: e.sent_at || e.created_at,
        is_read: true,
        is_starred: e.is_starred,
        has_attachments: atts.length > 0,
        attachments: atts
      };
    });

    result.sort((a, b) => new Date(b.sent_at) - new Date(a.sent_at));
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/mail/drafts
 * Draft emails saved by authenticated employee
 */
router.get('/drafts', authenticateToken, async (req, res) => {
  try {
    const drafts = await db.find('employee_emails', e => e.sender_id === req.user.id && e.is_draft && !e.is_deleted);
    drafts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return res.json(drafts);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/mail/starred
 * Starred emails
 */
router.get('/starred', authenticateToken, async (req, res) => {
  try {
    const recips = await db.find('email_recipients', r => r.recipient_id === req.user.id && r.is_starred && !r.is_deleted);
    const allEmails = await db.find('employee_emails');
    const attachments = await db.find('email_attachments');

    const result = recips.map(r => {
      const email = allEmails.find(e => e.id === r.email_id) || {};
      const atts = attachments.filter(a => a.email_id === r.email_id);
      return {
        id: r.id,
        email_id: email.id,
        sender_id: email.sender_id,
        sender_name: email.sender_name,
        sender_email: email.sender_email,
        subject: email.subject,
        body: email.body,
        sent_at: email.sent_at || email.created_at,
        is_read: r.is_read,
        is_starred: true,
        has_attachments: atts.length > 0,
        attachments: atts
      };
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/mail/trash
 * Deleted emails
 */
router.get('/trash', authenticateToken, async (req, res) => {
  try {
    const recips = await db.find('email_recipients', r => r.recipient_id === req.user.id && r.is_deleted);
    const allEmails = await db.find('employee_emails');

    const result = recips.map(r => {
      const email = allEmails.find(e => e.id === r.email_id) || {};
      return {
        id: r.id,
        email_id: email.id,
        sender_name: email.sender_name,
        sender_email: email.sender_email,
        subject: email.subject,
        body: email.body,
        sent_at: email.sent_at || email.created_at,
        is_read: r.is_read
      };
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/mail/send
 * Send email from authenticated employee to recipient
 * Real delivery: appears in recipient's inbox and sender's sent folder!
 */
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { to, subject, body, attachments = [] } = req.body;

    if (!to || !to.trim()) {
      return res.status(400).json({ error: 'Recipient email is required.' });
    }
    if (!subject || !subject.trim()) {
      return res.status(400).json({ error: 'Email subject is required.' });
    }

    // Verify recipient exists
    const recipientUser = await db.findOne('profiles', p => p.email.toLowerCase() === to.trim().toLowerCase());
    if (!recipientUser) {
      return res.status(404).json({ error: `Recipient '${to}' is not a registered employee in the company directory.` });
    }

    // 1. Create main email record
    const emailRecord = await db.insert('employee_emails', {
      sender_id: req.user.id,
      sender_email: req.user.email,
      sender_name: req.user.full_name,
      subject: subject.trim(),
      body: body || '',
      is_draft: false,
      is_starred: false,
      is_deleted: false,
      has_attachments: attachments.length > 0,
      sent_at: new Date().toISOString()
    });

    // 2. Deliver to Recipient Inbox
    await db.insert('email_recipients', {
      email_id: emailRecord.id,
      recipient_id: recipientUser.id,
      recipient_email: recipientUser.email,
      recipient_name: recipientUser.full_name,
      folder: 'inbox',
      is_read: false,
      is_starred: false,
      is_deleted: false,
      received_at: new Date().toISOString()
    });

    // 3. Place in Sender Sent folder
    await db.insert('email_recipients', {
      email_id: emailRecord.id,
      recipient_id: req.user.id,
      recipient_email: req.user.email,
      recipient_name: req.user.full_name,
      folder: 'sent',
      is_read: true,
      is_starred: false,
      is_deleted: false,
      received_at: new Date().toISOString()
    });

    // 4. Save attachments
    for (const att of attachments) {
      await db.insert('email_attachments', {
        email_id: emailRecord.id,
        file_name: att.name || 'attachment',
        file_size_bytes: att.size || 1024,
        mime_type: att.type || 'application/octet-stream',
        storage_path: att.path || `/attachments/${att.name}`
      });
    }

    // 5. Centralized Telemetry Dispatch
    await ActivityService.recordEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      eventType: 'EMAIL_SEND',
      resourceId: `/mail/to/${recipientUser.email}`,
      action: 'TRANSMIT',
      status: 'SUCCESS',
      ipAddress: req.ip || '127.0.0.1',
      metadata: {
        recipient_email: recipientUser.email,
        subject: subject.trim(),
        has_attachments: attachments.length > 0,
        attachments_count: attachments.length
      }
    });

    return res.json({
      success: true,
      message: `Email dispatched successfully to ${recipientUser.full_name} (${recipientUser.email}).`,
      email: emailRecord
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/mail/draft
 * Save draft
 */
router.post('/draft', authenticateToken, async (req, res) => {
  try {
    const { to, subject, body } = req.body;
    const draft = await db.insert('employee_emails', {
      sender_id: req.user.id,
      sender_email: req.user.email,
      sender_name: req.user.full_name,
      recipient_email: to || '',
      subject: subject || 'Untitled Draft',
      body: body || '',
      is_draft: true,
      is_starred: false,
      is_deleted: false,
      has_attachments: false,
      sent_at: null
    });
    return res.json({ success: true, draft });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/mail/:id/read
 * Toggle read status
 */
router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { is_read = true } = req.body;
    await db.update('email_recipients', r => r.id === req.params.id && r.recipient_id === req.user.id, { is_read });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/mail/:id/star
 * Toggle star status
 */
router.put('/:id/star', authenticateToken, async (req, res) => {
  try {
    const recip = await db.findOne('email_recipients', r => r.id === req.params.id && r.recipient_id === req.user.id);
    if (!recip) return res.status(404).json({ error: 'Email record not found.' });

    const newStar = !recip.is_starred;
    await db.update('email_recipients', r => r.id === recip.id, { is_starred: newStar });
    return res.json({ success: true, is_starred: newStar });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/mail/:id
 * Move to trash or permanent delete (supports inbox, sent, and drafts)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const recip = await db.findOne('email_recipients', r => (r.id === req.params.id || r.email_id === req.params.id) && r.recipient_id === req.user.id);
    if (!recip) {
      // Check if it's a draft or sent email in employee_emails
      const email = await db.findOne('employee_emails', e => e.id === req.params.id && e.sender_id === req.user.id);
      if (email) {
        if (email.is_draft || email.is_deleted) {
          await db.delete('employee_emails', e => e.id === email.id);
        } else {
          await db.update('employee_emails', e => e.id === email.id, { is_deleted: true });
        }
        return res.json({ success: true, message: 'Draft or email removed.' });
      }
      return res.status(404).json({ error: 'Email record not found.' });
    }

    if (recip.is_deleted) {
      // Permanent delete
      await db.delete('email_recipients', r => r.id === recip.id);
    } else {
      // Move to trash
      await db.update('email_recipients', r => r.id === recip.id, { is_deleted: true, folder: 'trash' });
      await ActivityService.recordEvent({
        userId: req.user.id,
        userEmail: req.user.email,
        eventType: 'EMAIL_DELETE',
        resourceId: `/mail/${recip.email_id}`,
        action: 'DELETE',
        status: 'SUCCESS',
        metadata: { folder: 'trash' }
      });
    }

    return res.json({ success: true, message: 'Email moved to trash.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/mail/:id/restore
 * Restore email from trash
 */
router.post('/:id/restore', authenticateToken, async (req, res) => {
  try {
    const recip = await db.findOne('email_recipients', r => (r.id === req.params.id || r.email_id === req.params.id) && r.recipient_id === req.user.id);
    if (!recip) {
      const email = await db.findOne('employee_emails', e => e.id === req.params.id && e.sender_id === req.user.id);
      if (email) {
        await db.update('employee_emails', e => e.id === email.id, { is_deleted: false });
        return res.json({ success: true, message: 'Email restored.' });
      }
      return res.status(404).json({ error: 'Email record not found.' });
    }

    await db.update('email_recipients', r => r.id === recip.id, { is_deleted: false, folder: 'inbox' });
    return res.json({ success: true, message: 'Email restored to inbox.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
