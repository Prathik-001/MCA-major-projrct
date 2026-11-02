const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authenticateToken = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const ActivityService = require('../services/activityService');
const AuditChainService = require('../services/auditChainService');

/**
 * GET /api/virtual-computers
 * List all virtual computers with employee details and risk scores (Admin/Manager only)
 */
router.get('/', authenticateToken, requireRole(['Administrator', 'Manager']), async (req, res) => {
  try {
    const vms = await db.find('virtual_computers');
    const profiles = await db.find('profiles');
    const monitored = await db.find('monitored_users');
    const sessions = await db.find('employee_sessions');
    const appPerms = await db.find('employee_application_permissions');

    const result = vms.map(vm => {
      const profile = profiles.find(p => p.id === vm.employee_id) || {};
      const mon = monitored.find(m => m.user_id === vm.employee_id) || {};
      const activeSession = sessions.find(s => s.employee_id === vm.employee_id && s.status === 'ACTIVE');
      const perms = appPerms.filter(ap => ap.employee_id === vm.employee_id);

      return {
        ...vm,
        employee_name: profile.full_name || 'Unknown Employee',
        employee_email: profile.email || '',
        department: profile.department || '',
        employee_code: mon.employee_code || 'EMP-000',
        job_title: mon.job_title || profile.role || '',
        risk_score: mon.current_risk_score || 0,
        risk_level: mon.risk_level || 'Low',
        active_session: activeSession ? activeSession.session_id : null,
        active_ip: activeSession ? activeSession.ip_address : '127.0.0.1',
        disabled_apps: perms.filter(p => !p.is_allowed).map(p => p.app_key)
      };
    });

    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/virtual-computers/bulk-action
 * Execute bulk maintenance actions: unlock_all, lock_high_risk, refresh_all
 */
router.post('/bulk-action', authenticateToken, requireRole(['Administrator']), async (req, res) => {
  try {
    const { action, reason = 'Administrative Fleet Maintenance' } = req.body;
    const vms = await db.find('virtual_computers');
    const monitored = await db.find('monitored_users');

    let count = 0;
    if (action === 'unlock_all') {
      for (const vm of vms) {
        if (vm.status === 'Locked') {
          await db.update('virtual_computers', v => v.id === vm.id, { status: 'Online', lock_reason: null });
          await recordAdminAudit(req.user, vm.employee_id, 'BULK_UNLOCK', reason);
          count++;
        }
      }
      return res.json({ success: true, message: `Successfully unlocked ${count} virtual computers across all departments.`, count });
    } else if (action === 'lock_high_risk') {
      for (const vm of vms) {
        const mon = monitored.find(m => m.user_id === vm.employee_id);
        if (mon && mon.current_risk_score >= 60 && vm.status !== 'Locked') {
          await db.update('virtual_computers', v => v.id === vm.id, {
            status: 'Locked',
            lock_reason: `Emergency Threat Isolation: High risk score (${mon.current_risk_score}/100)`
          });
          await recordAdminAudit(req.user, vm.employee_id, 'EMERGENCY_LOCK_HIGH_RISK', reason);
          count++;
        }
      }
      return res.json({ success: true, message: `Emergency containment engaged: locked ${count} high-risk virtual computers.`, count });
    }

    return res.status(400).json({ error: 'Unknown bulk action specified.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/virtual-computers/my
 * Get current employee's own virtual computer, preferences, and permissions
 */
router.get('/my', authenticateToken, async (req, res) => {
  try {
    let vm = await db.findOne('virtual_computers', v => v.employee_id === req.user.id);
    let prefs = await db.findOne('desktop_preferences', dp => dp.employee_id === req.user.id);
    const perms = await db.find('employee_application_permissions', ap => ap.employee_id === req.user.id);

    // Auto-create if first login
    if (!vm) {
      vm = await db.insert('virtual_computers', {
        employee_id: req.user.id,
        computer_name: `${req.user.full_name}'s Virtual Mac`,
        os_version: 'macOS 15.1 Sonoma Virtual Workstation',
        status: 'Online',
        current_session_id: 'sess_' + require('crypto').randomBytes(6).toString('hex'),
        current_application: 'Finder',
        last_activity_at: new Date().toISOString()
      });
    }

    if (!prefs) {
      prefs = await db.insert('desktop_preferences', {
        employee_id: req.user.id,
        wallpaper: 'sonoma-dark',
        dock_position: 'bottom',
        dock_size: 'medium',
        theme: 'dark',
        accent_color: 'blue',
        notifications_enabled: true
      });
    }

    // Check if employee account is suspended
    const userProfile = await db.findOne('profiles', p => p.id === req.user.id);
    if (userProfile && !userProfile.is_active) {
      vm.status = 'Suspended';
    }

    return res.json({
      virtual_computer: vm,
      preferences: prefs,
      disabled_apps: perms.filter(p => !p.is_allowed).map(p => p.app_key),
      is_locked: vm.status === 'Locked',
      is_suspended: vm.status === 'Suspended',
      lock_reason: vm.lock_reason
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/virtual-computers/my/preferences
 * Update desktop wallpaper, theme, dock position
 */
router.put('/my/preferences', authenticateToken, async (req, res) => {
  try {
    const { wallpaper, dock_position, dock_size, theme, notifications_enabled } = req.body;
    const updates = {};
    if (wallpaper) updates.wallpaper = wallpaper;
    if (dock_position) updates.dock_position = dock_position;
    if (dock_size) updates.dock_size = dock_size;
    if (theme) updates.theme = theme;
    if (notifications_enabled !== undefined) updates.notifications_enabled = notifications_enabled;

    await db.update('desktop_preferences', dp => dp.employee_id === req.user.id, updates);
    const updated = await db.findOne('desktop_preferences', dp => dp.employee_id === req.user.id);

    return res.json({ success: true, preferences: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/virtual-computers/heartbeat
 * Periodic heartbeat from employee virtual desktop
 */
router.post('/heartbeat', authenticateToken, async (req, res) => {
  try {
    const { current_app } = req.body;
    const updates = { last_activity_at: new Date().toISOString() };
    if (current_app) updates.current_application = current_app;

    await db.update('virtual_computers', v => v.employee_id === req.user.id, updates);
    return res.json({ status: 'OK' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Helper to record tamper-evident admin audit log block
 */
async function recordAdminAudit(adminUser, targetId, action, reason, details = {}) {
  const targetProfile = await db.findOne('profiles', p => p.id === targetId);
  const targetEmail = targetProfile ? targetProfile.email : targetId;

  const payload = {
    action,
    initiated_by: adminUser.email,
    initiated_by_name: adminUser.full_name,
    target_employee_id: targetId,
    target_employee_email: targetEmail,
    reason: reason || 'Administrative Security Protocol Enforcement',
    timestamp: new Date().toISOString(),
    details
  };

  // Get last block hash
  const chain = await db.find('audit_chain_records');
  chain.sort((a, b) => a.sequence_number - b.sequence_number);
  const lastBlock = chain.length > 0 ? chain[chain.length - 1] : null;
  const previousHash = lastBlock ? lastBlock.current_hash : AuditChainService.computeHash('ROOT', { init: true });
  const currentHash = AuditChainService.computeHash(previousHash, payload);

  await db.insert('audit_chain_records', {
    sequence_number: lastBlock ? lastBlock.sequence_number + 1 : 1,
    event_id: require('crypto').randomUUID(),
    event_payload: payload,
    previous_hash: previousHash,
    current_hash: currentHash,
    signature: 'ADMIN_EXECUTIVE_SECURITY_ACTION_SIGNED'
  });

  // Also log activity telemetry
  await ActivityService.recordEvent({
    userId: adminUser.id,
    userEmail: adminUser.email,
    eventType: 'ADMIN_CONTROL_ACTION',
    resourceId: `/virtual-computers/${targetId}`,
    action,
    status: 'SUCCESS',
    metadata: { target_email: targetEmail, reason, details }
  });
}

/**
 * POST /api/virtual-computers/:id/lock
 * Lock employee's virtual desktop (Admin only)
 */
router.post('/:id/lock', authenticateToken, requireRole(['Administrator']), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A valid security reason is required to lock an employee virtual computer.' });
    }

    const vm = await db.findOne('virtual_computers', v => v.id === req.params.id || v.employee_id === req.params.id);
    if (!vm) return res.status(404).json({ error: 'Virtual computer not found.' });

    await db.update('virtual_computers', v => v.id === vm.id, {
      status: 'Locked',
      lock_reason: reason,
      locked_by: req.user.id,
      locked_at: new Date().toISOString()
    });

    await recordAdminAudit(req.user, vm.employee_id, 'LOCK_VIRTUAL_DESKTOP', reason);

    return res.json({ success: true, message: `Virtual desktop locked for employee.`, status: 'Locked' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/virtual-computers/:id/unlock
 * Unlock employee's virtual desktop (Admin only)
 */
router.post('/:id/unlock', authenticateToken, requireRole(['Administrator']), async (req, res) => {
  try {
    const { reason } = req.body;
    const vm = await db.findOne('virtual_computers', v => v.id === req.params.id || v.employee_id === req.params.id);
    if (!vm) return res.status(404).json({ error: 'Virtual computer not found.' });

    await db.update('virtual_computers', v => v.id === vm.id, {
      status: 'Online',
      lock_reason: null,
      locked_by: null,
      locked_at: null
    });

    await recordAdminAudit(req.user, vm.employee_id, 'UNLOCK_VIRTUAL_DESKTOP', reason || 'Access restored after security investigation');

    return res.json({ success: true, message: 'Virtual desktop unlocked successfully.', status: 'Online' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/virtual-computers/admin-unlock
 * In-Person Administrator Unlock from Lock Screen
 * Strictly validates that the unlocking account has the 'Administrator' role.
 */
router.post('/admin-unlock', async (req, res) => {
  try {
    const { admin_email, admin_password, employee_id, computer_id, reason } = req.body;

    if (!admin_email || !admin_password) {
      return res.status(400).json({ error: 'Administrator email and password are required.' });
    }

    const bcrypt = require('bcryptjs');
    const adminUser = await db.findOne('profiles', p => p.email.toLowerCase() === admin_email.trim().toLowerCase());

    if (!adminUser || !adminUser.is_active) {
      return res.status(401).json({ error: 'Access Denied: Administrator account not found or inactive.' });
    }

    // STRICT CHECK: ONLY ADMINISTRATOR ROLE CAN UNLOCK!
    if (adminUser.role !== 'Administrator') {
      await ActivityService.recordEvent({
        userId: adminUser.id,
        userEmail: adminUser.email,
        eventType: 'UNAUTHORIZED_UNLOCK_ATTEMPT',
        resourceId: '/virtual-computers/admin-unlock',
        action: 'UNLOCK',
        status: 'FAILURE',
        metadata: {
          attempted_by: admin_email,
          role: adminUser.role,
          reason: `Access Denied: User role '${adminUser.role}' is not authorized to unlock a contained system. Only Administrator credentials are valid.`
        }
      });
      return res.status(403).json({
        error: `Access Denied: The account '${admin_email}' has the role '${adminUser.role}'. Only authorized Administrators can unlock once the system is locked.`
      });
    }

    // Check Password
    const isPasswordValid = await bcrypt.compare(admin_password, adminUser.password_hash);
    if (!isPasswordValid) {
      await ActivityService.recordEvent({
        userId: adminUser.id,
        userEmail: adminUser.email,
        eventType: 'UNAUTHORIZED_UNLOCK_ATTEMPT',
        resourceId: '/virtual-computers/admin-unlock',
        action: 'UNLOCK',
        status: 'FAILURE',
        metadata: {
          attempted_by: admin_email,
          reason: 'Invalid administrator password supplied on lock screen'
        }
      });
      return res.status(401).json({ error: 'Invalid Administrator password.' });
    }

    // Find the virtual computer
    let vm = null;
    if (computer_id) {
      vm = await db.findOne('virtual_computers', v => v.id === computer_id);
    }
    if (!vm && employee_id) {
      vm = await db.findOne('virtual_computers', v => v.employee_id === employee_id);
    }
    if (!vm) {
      vm = await db.findOne('virtual_computers', v => v.status === 'Locked');
    }

    if (!vm) {
      return res.status(404).json({ error: 'No locked virtual computer found.' });
    }

    // Unlock
    await db.update('virtual_computers', v => v.id === vm.id, {
      status: 'Online',
      lock_reason: null,
      locked_by: null,
      locked_at: null
    });

    // Record tamper-evident audit log
    await recordAdminAudit(
      adminUser,
      vm.employee_id,
      'ADMIN_IN_PERSON_UNLOCK',
      reason || 'Administrator authenticated on lock screen and disengaged containment.'
    );

    return res.json({
      success: true,
      message: `Workstation unlocked by Administrator ${adminUser.full_name}.`,
      unlocked_by: adminUser.full_name,
      status: 'Online'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/virtual-computers/simulate-suspicious
 * Triggers a realistic suspicious activity telemetry event
 * which immediately engages the automated threat containment auto-lock!
 */
router.post('/simulate-suspicious', authenticateToken, async (req, res) => {
  try {
    const { scenario = 'UNAUTHORIZED_ACCESS_PROBE', details = '' } = req.body;

    const eventResult = await ActivityService.recordEvent({
      userId: req.user.id,
      userEmail: req.user.email,
      eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
      resourceId: '/restricted/vault/Q4_Executive_Compensation_Ledger.xlsx',
      action: 'EXFILTRATE',
      status: 'FAILURE',
      metadata: {
        threat_type: scenario,
        violation: 'Attempted unauthorized mass extraction of restricted compensation ledger',
        anomaly_flag: true,
        details: details || 'Anomalous off-hours access probe from unverified endpoint'
      }
    });

    return res.json({
      success: true,
      message: 'Suspicious activity recorded. Automated SOC containment engaged.',
      event: eventResult.event,
      is_locked: true,
      lock_reason: 'Automated Security Containment: Suspicious access violation detected.'
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/virtual-computers/:id/terminate-session
 * Terminate active session for employee (Admin only)
 */
router.post('/:id/terminate-session', authenticateToken, requireRole(['Administrator']), async (req, res) => {
  try {
    const { reason } = req.body;
    const vm = await db.findOne('virtual_computers', v => v.id === req.params.id || v.employee_id === req.params.id);
    if (!vm) return res.status(404).json({ error: 'Virtual computer not found.' });

    await db.update('employee_sessions', s => s.employee_id === vm.employee_id && s.status === 'ACTIVE', {
      status: 'TERMINATED',
      terminated_at: new Date().toISOString(),
      terminated_by: req.user.email
    });

    await db.update('virtual_computers', v => v.id === vm.id, {
      status: 'Offline',
      current_session_id: null
    });

    await recordAdminAudit(req.user, vm.employee_id, 'TERMINATE_ACTIVE_SESSION', reason || 'Session terminated by security administration');

    return res.json({ success: true, message: 'Active session forcefully terminated.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/virtual-computers/:id/suspend
 * Suspend employee account access (Admin only)
 */
router.post('/:id/suspend', authenticateToken, requireRole(['Administrator']), async (req, res) => {
  try {
    const { reason } = req.body;
    const vm = await db.findOne('virtual_computers', v => v.id === req.params.id || v.employee_id === req.params.id);
    if (!vm) return res.status(404).json({ error: 'Virtual computer not found.' });

    await db.update('profiles', p => p.id === vm.employee_id, { is_active: false });
    await db.update('monitored_users', m => m.user_id === vm.employee_id, { account_status: 'Suspended' });
    await db.update('virtual_computers', v => v.id === vm.id, { status: 'Suspended', lock_reason: reason });

    await recordAdminAudit(req.user, vm.employee_id, 'SUSPEND_EMPLOYEE_ACCESS', reason || 'Account suspended due to critical risk evaluation');

    return res.json({ success: true, message: 'Employee access suspended successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/virtual-computers/:id/restore
 * Restore employee access (Admin only)
 */
router.post('/:id/restore', authenticateToken, requireRole(['Administrator']), async (req, res) => {
  try {
    const { reason } = req.body;
    const vm = await db.findOne('virtual_computers', v => v.id === req.params.id || v.employee_id === req.params.id);
    if (!vm) return res.status(404).json({ error: 'Virtual computer not found.' });

    await db.update('profiles', p => p.id === vm.employee_id, { is_active: true });
    await db.update('monitored_users', m => m.user_id === vm.employee_id, { account_status: 'Active' });
    await db.update('virtual_computers', v => v.id === vm.id, { status: 'Online', lock_reason: null });

    await recordAdminAudit(req.user, vm.employee_id, 'RESTORE_EMPLOYEE_ACCESS', reason || 'Employee account restored');

    return res.json({ success: true, message: 'Employee access restored successfully.' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/virtual-computers/:id/app-toggle
 * Enable or disable specific application for employee (Admin only)
 */
router.post('/:id/app-toggle', authenticateToken, requireRole(['Administrator']), async (req, res) => {
  try {
    const { app_key, is_allowed, reason } = req.body;
    const vm = await db.findOne('virtual_computers', v => v.id === req.params.id || v.employee_id === req.params.id);
    if (!vm) return res.status(404).json({ error: 'Virtual computer not found.' });

    const existing = await db.findOne('employee_application_permissions', ap => ap.employee_id === vm.employee_id && ap.app_key === app_key);
    if (existing) {
      await db.update('employee_application_permissions', ap => ap.id === existing.id, {
        is_allowed,
        updated_by: req.user.id,
        updated_at: new Date().toISOString()
      });
    } else {
      await db.insert('employee_application_permissions', {
        employee_id: vm.employee_id,
        app_key,
        is_allowed,
        updated_by: req.user.id,
        updated_at: new Date().toISOString()
      });
    }

    await recordAdminAudit(req.user, vm.employee_id, is_allowed ? 'ENABLE_APPLICATION' : 'DISABLE_APPLICATION', reason || `Toggled ${app_key} to ${is_allowed}`, { app_key, is_allowed });

    return res.json({ success: true, message: `Application ${app_key} ${is_allowed ? 'enabled' : 'disabled'} for employee.` });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
