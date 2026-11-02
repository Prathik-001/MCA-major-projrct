const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authenticateToken = require('../middleware/auth');
const ActivityService = require('../services/activityService');

/**
 * GET /api/shared-drive/resources
 * List all shared corporate drives and vaults with employee access status
 */
router.get('/resources', authenticateToken, async (req, res) => {
  try {
    const resources = await db.find('shared_resources');
    const requests = await db.find('access_requests', r => r.employee_id === req.user.id);

    const result = resources.map(resItem => {
      // Access clearance logic:
      // 1. PUBLIC: accessible to all
      // 2. DEPARTMENT: accessible if req.user.department matches
      // 3. RESTRICTED: accessible if approved request exists or Administrator
      let hasAccess = false;
      if (req.user.role === 'Administrator') {
        hasAccess = true;
      } else if (resItem.access_level === 'PUBLIC') {
        hasAccess = true;
      } else if (resItem.access_level === 'DEPARTMENT' && req.user.department.toLowerCase().includes(resItem.department.toLowerCase())) {
        hasAccess = true;
      } else {
        const approvedReq = requests.find(r => r.resource_id === resItem.id && r.status === 'APPROVED');
        if (approvedReq) hasAccess = true;
      }

      const pendingReq = requests.find(r => r.resource_id === resItem.id && r.status === 'PENDING');

      return {
        ...resItem,
        has_access: hasAccess,
        request_status: pendingReq ? 'PENDING' : (hasAccess ? 'APPROVED' : 'NONE')
      };
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/shared-drive/probe-vault
 * Probe vault access - generates telemetry event (legitimate access or 403 access denial probe)
 */
router.post('/probe-vault', authenticateToken, async (req, res) => {
  try {
    const { resource_id } = req.body;
    const resource = await db.findOne('shared_resources', r => r.id === resource_id);
    if (!resource) return res.status(404).json({ error: 'Resource not found.' });

    let hasAccess = false;
    if (req.user.role === 'Administrator') {
      hasAccess = true;
    } else if (resource.access_level === 'PUBLIC') {
      hasAccess = true;
    } else if (resource.access_level === 'DEPARTMENT' && req.user.department.toLowerCase().includes(resource.department.toLowerCase())) {
      hasAccess = true;
    } else {
      const approvedReq = await db.findOne('access_requests', r => r.resource_id === resource.id && r.employee_id === req.user.id && r.status === 'APPROVED');
      if (approvedReq) hasAccess = true;
    }

    if (!hasAccess) {
      await ActivityService.recordEvent({
        userId: req.user.id,
        userEmail: req.user.email,
        eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        resourceId: `/vaults/${resource.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        action: 'READ',
        status: 'FAILURE',
        metadata: {
          resource_name: resource.name,
          access_level: resource.access_level,
          user_department: req.user.department,
          required_department: resource.department,
          reason: 'Access clearance insufficient (HTTP 403 Restricted Vault)'
        }
      });

      return res.status(403).json({
        error: `ACCESS DENIED: Insufficient Security Clearance for ${resource.name}. Unauthorized access attempt dispatched to Security Operations Center.`,
        status: 403
      });
    }

    // Access granted telemetry
    await ActivityService.recordEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      eventType: 'RESOURCE_ACCESS',
      resourceId: `/vaults/${resource.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      action: 'READ',
      status: 'SUCCESS',
      metadata: { resource_name: resource.name, access_level: resource.access_level }
    });

    return res.json({ success: true, message: `Access granted to ${resource.name}.`, resource });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/shared-drive/request-access
 * Submit clearance access request
 */
router.post('/request-access', authenticateToken, async (req, res) => {
  try {
    const { resource_id, reason } = req.body;
    if (!resource_id || !reason || !reason.trim()) {
      return res.status(400).json({ error: 'Resource ID and justification reason are required.' });
    }

    const resource = await db.findOne('shared_resources', r => r.id === resource_id);
    if (!resource) return res.status(404).json({ error: 'Resource not found.' });

    const existing = await db.findOne('access_requests', r => r.resource_id === resource_id && r.employee_id === req.user.id && r.status === 'PENDING');
    if (existing) {
      return res.status(400).json({ error: 'A clearance request is already pending review for this vault.' });
    }

    const request = await db.insert('access_requests', {
      resource_id: resource.id,
      employee_id: req.user.id,
      employee_name: req.user.full_name,
      employee_email: req.user.email,
      department: req.user.department,
      reason: reason.trim(),
      status: 'PENDING'
    });

    await ActivityService.recordEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      eventType: 'CLEARANCE_REQUEST',
      resourceId: `/vaults/${resource.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      action: 'REQUEST',
      status: 'SUCCESS',
      metadata: { resource_name: resource.name, reason: reason.trim() }
    });

    return res.json({ success: true, message: 'Access clearance request submitted for administrative review.', request });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
