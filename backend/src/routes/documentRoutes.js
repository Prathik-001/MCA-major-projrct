const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const db = require('../database/db');
const authenticateToken = require('../middleware/auth');
const ActivityService = require('../services/activityService');

/**
 * GET /api/documents
 * List documents for authenticated employee (+ shared)
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const docs = await db.find('documents', d => {
      if (d.is_deleted) return false;
      if (req.user.role === 'Administrator') return true;
      return d.employee_id === req.user.id || d.is_shared;
    });

    docs.sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at));
    return res.json(docs);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/documents/:id
 * Get single document with version history
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const doc = await db.findOne('documents', d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found.' });

    if (doc.employee_id !== req.user.id && !doc.is_shared && req.user.role !== 'Administrator') {
      await ActivityService.recordEvent({
        userId: req.user.id,
        userEmail: req.user.email,
        eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        resourceId: `/documents/${doc.id}`,
        action: 'READ',
        status: 'FAILURE',
        metadata: { attempted_doc: doc.title, owner_id: doc.employee_id }
      });
      return res.status(403).json({ error: 'Access denied: You do not have clearance to view this document.' });
    }

    const versions = await db.find('document_versions', v => v.document_id === doc.id);
    versions.sort((a, b) => b.version_num - a.version_num);

    return res.json({ document: doc, versions });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/documents
 * Create document
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, content = '', classification = 'INTERNAL', is_shared = false } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ error: 'Document title is required.' });

    const doc = await db.insert('documents', {
      employee_id: req.user.id,
      title: title.trim(),
      content,
      version_count: 1,
      classification,
      is_shared,
      is_deleted: false
    });

    const hash = crypto.createHash('sha256').update(content).digest('hex');
    await db.insert('document_versions', {
      document_id: doc.id,
      version_num: 1,
      title: title.trim(),
      content,
      saved_by: req.user.id,
      sha256_hash: hash
    });

    await ActivityService.recordEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      eventType: 'DOC_CREATE',
      resourceId: `/documents/${doc.id}`,
      action: 'WRITE',
      status: 'SUCCESS',
      metadata: { title: title.trim(), classification, sha256_hash: hash }
    });

    return res.json({ success: true, document: doc });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/documents/:id
 * Save/Autosave document (creates new version, computes SHA-256 hash)
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { title, content, classification } = req.body;
    const doc = await db.findOne('documents', d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found.' });

    if (doc.employee_id !== req.user.id && !doc.is_shared && req.user.role !== 'Administrator') {
      return res.status(403).json({ error: 'Access denied: Cannot edit another employee’s document.' });
    }

    const newVersionNum = (doc.version_count || 1) + 1;
    const resolvedTitle = title ? title.trim() : doc.title;
    const resolvedContent = content !== undefined ? content : doc.content;
    const hash = crypto.createHash('sha256').update(resolvedContent).digest('hex');

    await db.update('documents', d => d.id === doc.id, {
      title: resolvedTitle,
      content: resolvedContent,
      classification: classification || doc.classification,
      version_count: newVersionNum
    });

    await db.insert('document_versions', {
      document_id: doc.id,
      version_num: newVersionNum,
      title: resolvedTitle,
      content: resolvedContent,
      saved_by: req.user.id,
      sha256_hash: hash
    });

    await ActivityService.recordEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      eventType: 'DOC_SAVE',
      resourceId: `/documents/${doc.id}`,
      action: 'MODIFY',
      status: 'SUCCESS',
      metadata: {
        title: resolvedTitle,
        version: newVersionNum,
        sha256_hash: hash,
        bytes: Buffer.byteLength(resolvedContent, 'utf8')
      }
    });

    return res.json({
      success: true,
      message: 'Document saved and versioned successfully.',
      version: newVersionNum,
      sha256_hash: hash
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/documents/:id/revert
 * Revert to a specific version
 */
router.post('/:id/revert', authenticateToken, async (req, res) => {
  try {
    const { version_num } = req.body;
    const doc = await db.findOne('documents', d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found.' });

    const targetVersion = await db.findOne('document_versions', v => v.document_id === doc.id && v.version_num === parseInt(version_num, 10));
    if (!targetVersion) return res.status(404).json({ error: 'Version not found.' });

    await db.update('documents', d => d.id === doc.id, {
      title: targetVersion.title,
      content: targetVersion.content
    });

    await ActivityService.recordEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      eventType: 'DOC_REVERT',
      resourceId: `/documents/${doc.id}`,
      action: 'MODIFY',
      status: 'SUCCESS',
      metadata: { reverted_to_version: version_num }
    });

    return res.json({ success: true, message: `Reverted to version ${version_num}.` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/documents/:id
 * Delete document
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const doc = await db.findOne('documents', d => d.id === req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found.' });

    if (doc.employee_id !== req.user.id && req.user.role !== 'Administrator') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    await db.update('documents', d => d.id === doc.id, { is_deleted: true });

    await ActivityService.recordEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      eventType: 'DOC_DELETE',
      resourceId: `/documents/${doc.id}`,
      action: 'DELETE',
      status: 'SUCCESS',
      metadata: { title: doc.title }
    });

    return res.json({ success: true, message: 'Document moved to trash.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
