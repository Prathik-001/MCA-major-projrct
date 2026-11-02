const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authenticateToken = require('../middleware/auth');
const ActivityService = require('../services/activityService');

/**
 * GET /api/files
 * Get current employee's files and folders (isolated)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { folder_id, view = 'all' } = req.query;

    let files = await db.find('employee_files', f => {
      if (f.is_deleted) return false;
      if (view === 'shared') return f.is_shared || (f.employee_id !== req.user.id && !f.is_deleted);
      if (view === 'personal') return f.employee_id === req.user.id;
      if (req.user.role === 'Administrator') return true;
      return f.employee_id === req.user.id || f.is_shared;
    });

    let folders = await db.find('folders', f => {
      if (f.is_deleted) return false;
      if (view === 'shared') return f.is_shared;
      if (view === 'personal') return f.employee_id === req.user.id;
      if (req.user.role === 'Administrator') return true;
      return f.employee_id === req.user.id || f.is_shared;
    });

    if (folder_id && folder_id !== 'root') {
      files = files.filter(f => f.folder_id === folder_id);
      folders = folders.filter(f => f.parent_id === folder_id);
    } else if (folder_id === 'root') {
      files = files.filter(f => !f.folder_id);
      folders = folders.filter(f => !f.parent_id);
    }

    return res.json({ folders, files });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/files/trash
 * List trash files
 */
router.get('/trash', authenticateToken, async (req, res) => {
  try {
    const files = await db.find('employee_files', f => f.employee_id === req.user.id && f.is_deleted);
    return res.json({ files });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/files/folder
 * Create new folder
 */
router.post('/folder', authenticateToken, async (req, res) => {
  try {
    const { name, parent_id } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Folder name is required.' });

    const folder = await db.insert('folders', {
      employee_id: req.user.id,
      name: name.trim(),
      parent_id: parent_id || null,
      is_shared: false,
      is_deleted: false
    });

    await ActivityService.recordEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      eventType: 'FOLDER_CREATE',
      resourceId: `/folders/${folder.id}`,
      action: 'CREATE',
      status: 'SUCCESS',
      metadata: { folder_name: name.trim() }
    });

    return res.json({ success: true, folder });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/files/upload
 * Real file upload with telemetry
 */
router.post('/upload', authenticateToken, async (req, res) => {
  try {
    const { name, file_type = 'document', file_size_bytes = 1024, folder_id, content_preview, classification = 'INTERNAL' } = req.body;

    if (!name || !name.trim()) return res.status(400).json({ error: 'File name is required.' });

    const file = await db.insert('employee_files', {
      employee_id: req.user.id,
      folder_id: folder_id || null,
      name: name.trim(),
      file_type,
      file_size_bytes: parseInt(file_size_bytes, 10) || 1024,
      classification,
      content_preview: content_preview || 'Uploaded workstation file content.',
      is_shared: false,
      is_deleted: false
    });

    await ActivityService.recordEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      eventType: 'FILE_UPLOAD',
      resourceId: `/files/${file.id}`,
      action: 'WRITE',
      status: 'SUCCESS',
      metadata: {
        file_name: name.trim(),
        file_size_bytes: file.file_size_bytes,
        classification
      }
    });

    return res.json({ success: true, file });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/files/:id/download
 * Download file content & dispatch telemetry (checks volume for anomaly alerts)
 */
router.get('/:id/download', authenticateToken, async (req, res) => {
  try {
    const file = await db.findOne('employee_files', f => f.id === req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found.' });

    // Isolation check: must be owner, or shared, or admin
    if (file.employee_id !== req.user.id && !file.is_shared && req.user.role !== 'Administrator') {
      await ActivityService.recordEvent({
        userId: req.user.id,
        userEmail: req.user.email,
        eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        resourceId: `/files/${file.id}`,
        action: 'READ',
        status: 'FAILURE',
        metadata: { attempted_file: file.name, owner_id: file.employee_id, reason: 'Access Denied 403' }
      });
      return res.status(403).json({ error: 'Access Denied: You do not have clearance to download this private asset.' });
    }

    // Record legitimate download telemetry
    await ActivityService.recordEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      eventType: 'FILE_DOWNLOAD',
      resourceId: `/files/${file.id}`,
      action: 'READ',
      status: 'SUCCESS',
      metadata: {
        file_name: file.name,
        file_size_bytes: file.file_size_bytes,
        classification: file.classification
      }
    });

    return res.json({
      success: true,
      file_name: file.name,
      file_size_bytes: file.file_size_bytes,
      content: file.content_preview,
      classification: file.classification
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/files/:id/rename
 * Rename file
 */
router.put('/:id/rename', authenticateToken, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'New name is required.' });

    const file = await db.findOne('employee_files', f => f.id === req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found.' });

    if (file.employee_id !== req.user.id && req.user.role !== 'Administrator') {
      return res.status(403).json({ error: 'Access denied: Cannot rename another employee’s file.' });
    }

    await db.update('employee_files', f => f.id === file.id, { name: name.trim() });

    await ActivityService.recordEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      eventType: 'FILE_RENAME',
      resourceId: `/files/${file.id}`,
      action: 'MODIFY',
      status: 'SUCCESS',
      metadata: { old_name: file.name, new_name: name.trim() }
    });

    return res.json({ success: true, message: 'File renamed successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/files/:id
 * Delete file (move to trash)
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const file = await db.findOne('employee_files', f => f.id === req.params.id);
    if (!file) return res.status(404).json({ error: 'File not found.' });

    if (file.employee_id !== req.user.id && req.user.role !== 'Administrator') {
      return res.status(403).json({ error: 'Access denied: Cannot delete another employee’s file.' });
    }

    if (file.is_deleted) {
      // Permanent delete
      await db.delete('employee_files', f => f.id === file.id);
    } else {
      // Move to trash
      await db.update('employee_files', f => f.id === file.id, { is_deleted: true });
      await ActivityService.recordEvent({
        userId: req.user.id,
        userEmail: req.user.email,
        eventType: 'FILE_DELETE',
        resourceId: `/files/${file.id}`,
        action: 'DELETE',
        status: 'SUCCESS',
        metadata: { file_name: file.name, classification: file.classification }
      });
    }

    return res.json({ success: true, message: 'File moved to trash.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/files/:id/restore
 * Restore file from trash
 */
router.post('/:id/restore', authenticateToken, async (req, res) => {
  try {
    const file = await db.findOne('employee_files', f => f.id === req.params.id && f.employee_id === req.user.id);
    if (!file) return res.status(404).json({ error: 'File not found in trash.' });

    await db.update('employee_files', f => f.id === file.id, { is_deleted: false });

    await ActivityService.recordEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      eventType: 'FILE_RESTORE',
      resourceId: `/files/${file.id}`,
      action: 'MODIFY',
      status: 'SUCCESS',
      metadata: { file_name: file.name }
    });

    return res.json({ success: true, message: 'File restored successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/files/trash/empty
 * Permanently empty trash
 */
router.post('/trash/empty', authenticateToken, async (req, res) => {
  try {
    await db.delete('employee_files', f => f.employee_id === req.user.id && f.is_deleted);
    return res.json({ success: true, message: 'Trash emptied successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
