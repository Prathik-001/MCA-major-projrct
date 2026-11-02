const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authenticateToken = require('../middleware/auth');
const ActivityService = require('../services/activityService');

/**
 * GET /api/chat/conversations
 * Get all conversations the current employee participates in
 */
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const memberships = await db.find('conversation_members', m => m.employee_id === req.user.id);
    const convIds = new Set(memberships.map(m => m.conversation_id));

    const conversations = await db.find('chat_conversations', c => convIds.has(c.id));
    const allMembers = await db.find('conversation_members');
    const allProfiles = await db.find('profiles');
    const allMessages = await db.find('chat_messages');

    const result = conversations.map(c => {
      const members = allMembers
        .filter(m => m.conversation_id === c.id)
        .map(m => {
          const prof = allProfiles.find(p => p.id === m.employee_id) || {};
          return { id: prof.id, name: prof.full_name, email: prof.email, role: prof.role };
        });

      const convMessages = allMessages.filter(m => m.conversation_id === c.id);
      convMessages.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const lastMessage = convMessages.length > 0 ? convMessages[0] : null;

      // Display name for 1-on-1
      let displayName = c.name;
      if (!c.is_group) {
        const otherMember = members.find(m => m.id !== req.user.id);
        displayName = otherMember ? otherMember.name : (members[0] ? members[0].name : 'Direct Chat');
      }

      return {
        id: c.id,
        name: displayName,
        raw_name: c.name,
        is_group: c.is_group,
        members,
        last_message: lastMessage ? {
          sender_name: lastMessage.sender_name,
          message: lastMessage.message,
          created_at: lastMessage.created_at
        } : null
      };
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/chat/conversations/:id/messages
 * Get message history for conversation
 */
router.get('/conversations/:id/messages', authenticateToken, async (req, res) => {
  try {
    // Verify participation
    const membership = await db.findOne('conversation_members', m => m.conversation_id === req.params.id && m.employee_id === req.user.id);
    if (!membership && req.user.role !== 'Administrator') {
      return res.status(403).json({ error: 'Access denied: You are not a participant in this conversation.' });
    }

    const messages = await db.find('chat_messages', m => m.conversation_id === req.params.id);
    messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return res.json(messages);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/chat/send
 * Send message
 */
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const { conversation_id, message, attachments = [] } = req.body;
    if (!conversation_id) return res.status(400).json({ error: 'Conversation ID is required.' });
    if (!message || !message.trim()) return res.status(400).json({ error: 'Message cannot be empty.' });

    // Verify participation
    const membership = await db.findOne('conversation_members', m => m.conversation_id === conversation_id && m.employee_id === req.user.id);
    if (!membership && req.user.role !== 'Administrator') {
      return res.status(403).json({ error: 'Access denied: You are not a participant in this conversation.' });
    }

    const msg = await db.insert('chat_messages', {
      conversation_id,
      sender_id: req.user.id,
      sender_name: req.user.full_name,
      message: message.trim(),
      attachments,
      is_read: false
    });

    await ActivityService.recordEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      eventType: 'CHAT_MESSAGE_SEND',
      resourceId: `/chat/conversations/${conversation_id}`,
      action: 'TRANSMIT',
      status: 'SUCCESS',
      metadata: {
        conversation_id,
        message_length: message.trim().length,
        has_attachments: attachments.length > 0
      }
    });

    return res.json({ success: true, message: msg });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/chat/direct
 * Start or retrieve direct conversation with an employee
 */
router.post('/direct', authenticateToken, async (req, res) => {
  try {
    const { employee_id } = req.body;
    if (!employee_id) return res.status(400).json({ error: 'Employee ID is required.' });

    const targetUser = await db.findOne('profiles', p => p.id === employee_id);
    if (!targetUser) return res.status(404).json({ error: 'Employee not found.' });

    // Find existing direct conversation between the two
    const myMemberships = await db.find('conversation_members', m => m.employee_id === req.user.id);
    const targetMemberships = await db.find('conversation_members', m => m.employee_id === employee_id);

    const myConvIds = new Set(myMemberships.map(m => m.conversation_id));
    const commonConvId = targetMemberships.map(m => m.conversation_id).find(id => myConvIds.has(id));

    if (commonConvId) {
      const conv = await db.findOne('chat_conversations', c => c.id === commonConvId && !c.is_group);
      if (conv) return res.json({ success: true, conversation: conv });
    }

    // Otherwise create new direct chat
    const newConv = await db.insert('chat_conversations', {
      name: `${req.user.full_name} & ${targetUser.full_name}`,
      is_group: false,
      created_by: req.user.id
    });

    await db.insert('conversation_members', { conversation_id: newConv.id, employee_id: req.user.id });
    await db.insert('conversation_members', { conversation_id: newConv.id, employee_id: targetUser.id });

    return res.json({ success: true, conversation: newConv });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
