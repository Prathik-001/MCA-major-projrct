const crypto = require('crypto');
const db = require('../database/db');
const HybridRiskEngine = require('./hybridRiskEngine');
const AuditChainService = require('./auditChainService');

class ActivityService {
  /**
   * Securely records an activity event from trusted backend logic
   * Evaluates threat indicators, records tamper-evident hash, updates user risk profile
   */
  static async recordEvent(eventData) {
    const {
      userId,
      userEmail,
      eventType,
      resourceId,
      action,
      status = 'SUCCESS',
      ipAddress = '127.0.0.1',
      sessionId = 'sess_' + crypto.randomBytes(6).toString('hex'),
      metadata = {},
      timestamp = new Date().toISOString()
    } = eventData;

    if (!userId || !eventType || !resourceId || !action) {
      throw new Error('Missing mandatory activity event telemetry fields.');
    }

    // Retrieve user profile to ensure user exists
    const user = await db.findOne('profiles', p => p.id === userId);
    const resolvedEmail = userEmail || (user ? user.email : 'system@sentinel.local');
    const resolvedName = user ? user.full_name : 'Unknown User';
    const department = user ? user.department : 'General';

    // Preliminary event skeleton
    const rawEvent = {
      id: crypto.randomUUID(),
      user_id: userId,
      user_email: resolvedEmail,
      event_type: eventType,
      timestamp,
      resource_id: resourceId,
      action,
      status: status.toUpperCase(),
      ip_address: ipAddress,
      session_id: sessionId,
      metadata
    };

    // 1. Run through Explainable Hybrid Risk Engine
    const hybridResult = await HybridRiskEngine.evaluateEvent(rawEvent);

    // 2. Decorate event with risk score and explanations
    const enrichedEvent = {
      ...rawEvent,
      risk_score: hybridResult.compositeRiskScore,
      is_suspicious: hybridResult.shouldAlert,
      detection_explanation: {
        method: hybridResult.detectionMethod,
        factors: hybridResult.contributingFactors,
        rule_score: hybridResult.ruleRiskScore,
        anomaly_score: hybridResult.anomalyRiskScore,
        baseline_score: hybridResult.baselineScore
      }
    };

    // 3. Persist Event to database
    const savedEvent = await db.insert('activity_events', enrichedEvent);

    // 4. Update Monitored User Risk Status
    await db.update(
      'monitored_users',
      u => u.user_id === userId,
      {
        current_risk_score: hybridResult.compositeRiskScore,
        risk_level: hybridResult.severity,
        last_active_at: timestamp,
        baseline_status: hybridResult.baselineResult.isAnomalous ? 'Anomalous' : 'Established'
      }
    );

    let createdAlert = null;
    let createdIncident = null;

    // 5. Handle Alert Triggering
    if (hybridResult.shouldAlert) {
      const alertTitle = hybridResult.ruleResult.triggeredRules.length > 0
        ? `Alert: ${hybridResult.ruleResult.triggeredRules[0].ruleName}`
        : `Behavioral Anomaly: Unusual activity pattern for ${resolvedName}`;

      const primaryExplanation = hybridResult.contributingFactors.map(f => f.explanation).join(' | ');

      createdAlert = await db.insert('security_alerts', {
        user_id: userId,
        user_name: resolvedName,
        department,
        title: alertTitle,
        explanation: primaryExplanation || 'Composite risk threshold exceeded baseline tolerance.',
        affected_resources: [resourceId],
        detection_method: hybridResult.detectionMethod,
        severity: hybridResult.severity,
        risk_score: hybridResult.compositeRiskScore,
        status: 'New',
        trigger_event_id: savedEvent.id,
        contributing_factors: hybridResult.contributingFactors,
        mitigation_action: hybridResult.severity === 'Critical' 
          ? 'Recommended containment: Temporary session freeze and identity verification.' 
          : 'Recommended review: Monitor subsequent file access and lateral movement telemetry.'
      });

      // For High or Critical severity alerts, escalate automatically into Incidents queue
      if (hybridResult.severity === 'High' || hybridResult.severity === 'Critical') {
        const incidentCount = await db.count('incidents');
        const incidentNumber = `INC-2026-${String(incidentCount + 1).padStart(4, '0')}`;

        createdIncident = await db.insert('incidents', {
          incident_number: incidentNumber,
          user_id: userId,
          user_name: resolvedName,
          title: `Escalated Incident: ${alertTitle}`,
          description: primaryExplanation,
          severity: hybridResult.severity,
          status: 'New',
          lead_investigator: 'Unassigned (Triage)',
          root_cause: 'Under active automated behavioral triage',
          containment_action: 'None'
        });
      }
    }

    // 5.b. AUTOMATED THREAT CONTAINMENT AUTO-LOCK
    // If suspicious activity, unauthorized access attempts, or high risk scores are detected:
    // Immediately AUTO-LOCK the user's virtual workstation! Only an Administrator can unlock it once locked.
    const isSuspiciousActivity =
      hybridResult.shouldAlert ||
      eventType === 'UNAUTHORIZED_ACCESS_ATTEMPT' ||
      status === 'FAILURE' ||
      hybridResult.compositeRiskScore >= 50 ||
      hybridResult.severity === 'High' ||
      hybridResult.severity === 'Critical' ||
      (metadata && (metadata.anomaly_flag || metadata.is_suspicious || metadata.threat_type));

    if (isSuspiciousActivity) {
      try {
        const vm = await db.findOne('virtual_computers', v => v.employee_id === userId);
        if (vm && vm.status !== 'Locked') {
          const detailMsg = (hybridResult.contributingFactors && hybridResult.contributingFactors.length > 0)
            ? hybridResult.contributingFactors[0].explanation
            : (metadata?.violation || metadata?.details || metadata?.reason || `Suspicious event ${eventType} (Risk: ${hybridResult.compositeRiskScore}/100)`);

          const containmentLockReason = `Automated Security Containment: Suspicious insider activity detected [${detailMsg}]. Workstation locked by Sentinel SOC. Only an Administrator can authorize unlock.`;

          await db.update('virtual_computers', v => v.id === vm.id, {
            status: 'Locked',
            lock_reason: containmentLockReason,
            locked_at: new Date().toISOString(),
            locked_by: 'SENTINEL_AUTOMATED_SOC_CONTAINMENT'
          });

          console.log(`🔒 [AUTO-LOCK ENGAGED] Workstation for user ${resolvedEmail} automatically locked due to suspicious activity: ${detailMsg}`);
        }
      } catch (lockErr) {
        console.error('Failed to auto-lock virtual computer (non-blocking):', lockErr.message);
      }
    }

    // 6. Cryptographically Chain into Tamper-Evident Audit Log
    try {
      await AuditChainService.appendRecord(savedEvent.id, {
        action: enrichedEvent.action,
        event_type: enrichedEvent.event_type,
        resource: enrichedEvent.resource_id,
        user: enrichedEvent.user_email,
        risk_score: enrichedEvent.risk_score,
        is_suspicious: enrichedEvent.is_suspicious,
        timestamp: enrichedEvent.timestamp
      });
    } catch (auditErr) {
      console.error('Audit chain recording failure (non-blocking):', auditErr.message);
    }

    return {
      event: savedEvent,
      hybridResult,
      alert: createdAlert,
      incident: createdIncident
    };
  }
}

module.exports = ActivityService;
