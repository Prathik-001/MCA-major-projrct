const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authenticateToken = require('../middleware/auth');
const ActivityService = require('../services/activityService');

/**
 * GET /api/tasks
 * Get tasks assigned to current employee or created by them (or all for managers/admins)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const tasks = await db.find('tasks', t => {
      if (t.is_deleted) return false;
      if (req.user.role === 'Administrator' || req.user.role === 'Manager') return true;
      return t.assigned_to === req.user.id || t.created_by === req.user.id;
    });

    const profiles = await db.find('profiles');
    const comments = await db.find('task_comments');

    const result = tasks.map(t => {
      const assignee = profiles.find(p => p.id === t.assigned_to) || {};
      const creator = profiles.find(p => p.id === t.created_by) || {};
      const taskComments = comments.filter(c => c.task_id === t.id);

      return {
        ...t,
        assignee_name: assignee.full_name || 'Unassigned',
        assignee_email: assignee.email || '',
        creator_name: creator.full_name || 'System',
        comments: taskComments
      };
    });

    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/tasks
 * Create task
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, description, priority = 'Medium', assigned_to, due_date } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Task title is required.' });

    const targetAssignee = assigned_to || req.user.id;

    const task = await db.insert('tasks', {
      assigned_to: targetAssignee,
      created_by: req.user.id,
      title: title.trim(),
      description: description || '',
      priority,
      status: 'Pending',
      due_date: due_date || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      is_deleted: false
    });

    await ActivityService.recordEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      eventType: 'TASK_CREATE',
      resourceId: `/tasks/${task.id}`,
      action: 'CREATE',
      status: 'SUCCESS',
      metadata: { task_title: title.trim(), priority, assigned_to: targetAssignee }
    });

    return res.json({ success: true, task });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/tasks/:id/status
 * Update task status (Pending, In Progress, Completed)
 */
router.put('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status, completion_notes } = req.body;
    const task = await db.findOne('tasks', t => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    // Isolation check: must be assigned_to, or creator, or manager/admin
    if (task.assigned_to !== req.user.id && task.created_by !== req.user.id && req.user.role === 'Employee') {
      return res.status(403).json({ error: 'Access denied: Cannot update a task not assigned to you.' });
    }

    const updates = { status };
    if (status === 'Completed') {
      updates.completed_at = new Date().toISOString();
      if (completion_notes) updates.completion_notes = completion_notes;
    }

    await db.update('tasks', t => t.id === task.id, updates);

    await ActivityService.recordEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      eventType: status === 'Completed' ? 'TASK_COMPLETE' : 'TASK_UPDATE',
      resourceId: `/tasks/${task.id}`,
      action: 'MODIFY',
      status: 'SUCCESS',
      metadata: { status, task_title: task.title }
    });

    return res.json({ success: true, message: `Task status updated to ${status}.` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/tasks/:id/comments
 * Add comment to task
 */
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { comment } = req.body;
    if (!comment || !comment.trim()) return res.status(400).json({ error: 'Comment text is required.' });

    const task = await db.findOne('tasks', t => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    const newComment = await db.insert('task_comments', {
      task_id: task.id,
      author_id: req.user.id,
      author_name: req.user.full_name,
      comment: comment.trim()
    });

    return res.json({ success: true, comment: newComment });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete task (move to trash)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const task = await db.findOne('tasks', t => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    if (task.assigned_to !== req.user.id && task.created_by !== req.user.id && req.user.role === 'Employee') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    await db.update('tasks', t => t.id === task.id, { is_deleted: true });
    return res.json({ success: true, message: 'Task removed.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
