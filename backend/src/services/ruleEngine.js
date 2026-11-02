const db = require('../database/db');

class RuleEngine {
  /**
   * Evaluates an incoming event against all active detection rules
   */
  static async evaluateEvent(currentEvent) {
    const rules = await db.find('detection_rules', r => r.is_enabled);
    const triggeredRules = [];
    let totalRiskWeight = 0;

    const now = new Date(currentEvent.timestamp || Date.now()).getTime();

    // Fetch recent events for the user in the past 60 minutes
    const oneHourAgo = new Date(now - 60 * 60 * 1000).toISOString();
    const recentEvents = await db.find('activity_events', e => 
      e.user_id === currentEvent.user_id && e.timestamp >= oneHourAgo
    );
    // Include current event in evaluation set
    const evaluationSet = [...recentEvents, currentEvent];

    for (const rule of rules) {
      const windowMs = rule.time_window_minutes * 60 * 1000;
      const windowStart = now - windowMs;
      const windowEvents = evaluationSet.filter(e => new Date(e.timestamp).getTime() >= windowStart);

      let isTriggered = false;
      let observedMetric = 0;
      let triggerDetail = '';

      switch (rule.rule_code) {
        case 'RULE_FAILED_LOGINS': {
          const failedCount = windowEvents.filter(e => 
            e.event_type === 'FAILED_LOGIN' || (e.event_type === 'LOGIN' && e.status === 'FAILURE')
          ).length;
          observedMetric = failedCount;
          if (failedCount >= rule.threshold) {
            isTriggered = true;
            triggerDetail = `${failedCount} consecutive failed authentications detected in ${rule.time_window_minutes}m (Threshold: ${rule.threshold})`;
          }
          break;
        }

        case 'RULE_EXCESSIVE_DOWNLOADS': {
          const downloadCount = windowEvents.filter(e => 
            e.event_type === 'FILE_DOWNLOAD' && e.status === 'SUCCESS'
          ).length;
          observedMetric = downloadCount;
          if (downloadCount >= rule.threshold) {
            isTriggered = true;
            triggerDetail = `${downloadCount} file downloads executed within ${rule.time_window_minutes}m (Threshold: ${rule.threshold})`;
          }
          break;
        }

        case 'RULE_UNAUTHORIZED_ACCESS': {
          const deniedCount = windowEvents.filter(e => 
            e.event_type === 'ACCESS_DENIED' || e.status === 'FAILURE'
          ).length;
          observedMetric = deniedCount;
          if (deniedCount >= rule.threshold) {
            isTriggered = true;
            triggerDetail = `${deniedCount} unauthorized resource rejections recorded in ${rule.time_window_minutes}m (Threshold: ${rule.threshold})`;
          }
          break;
        }

        case 'RULE_OFF_HOURS_ACTIVITY': {
          const eventHour = new Date(currentEvent.timestamp).getHours();
          const isOffHour = eventHour < 6 || eventHour >= 20;
          if (isOffHour) {
            const offHourActions = windowEvents.filter(e => {
              const h = new Date(e.timestamp).getHours();
              return h < 6 || h >= 20;
            }).length;
            observedMetric = offHourActions;
            if (offHourActions >= rule.threshold) {
              isTriggered = true;
              triggerDetail = `High-privilege system request executed during non-standard hours (${eventHour}:00 UTC/Local)`;
            }
          }
          break;
        }

        case 'RULE_RECORD_MODIFICATION_SPIKE': {
          const modCount = windowEvents.filter(e => 
            (e.event_type === 'RECORD_MODIFY' || e.event_type === 'FILE_DELETE') && e.status === 'SUCCESS'
          ).length;
          observedMetric = modCount;
          if (modCount >= rule.threshold) {
            isTriggered = true;
            triggerDetail = `Spike of ${modCount} record modifications/deletions within ${rule.time_window_minutes}m window (Threshold: ${rule.threshold})`;
          }
          break;
        }

        case 'RULE_SENSITIVE_RESOURCE_BURST': {
          const uniqueResources = new Set(
            windowEvents
              .filter(e => e.resource_id && (e.resource_id.includes('confidential') || e.resource_id.includes('admin') || e.resource_id.includes('secret') || e.resource_id.includes('merger')))
              .map(e => e.resource_id)
          );
          observedMetric = uniqueResources.size;
          if (uniqueResources.size >= rule.threshold) {
            isTriggered = true;
            triggerDetail = `Reconnaissance scan across ${uniqueResources.size} distinct confidential endpoints in ${rule.time_window_minutes}m (Threshold: ${rule.threshold})`;
          }
          break;
        }

        case 'RULE_DLP_SCREENSHOT_ATTEMPT': {
          const dlpAttempts = windowEvents.filter(e => 
            e.event_type === 'SCREENSHOT_ATTEMPT' || e.event_type === 'DLP_VIOLATION'
          ).length;
          observedMetric = dlpAttempts;
          if (dlpAttempts >= rule.threshold) {
            isTriggered = true;
            triggerDetail = `Unauthorized screen capture / clipping tool attempt detected while viewing confidential asset`;
          }
          break;
        }

        case 'RULE_EXTERNAL_FILE_SHARE': {
          const shareAttempts = windowEvents.filter(e => 
            e.event_type === 'FILE_SHARE_EXTERNAL' || (e.event_type === 'FILE_SHARE' && e.metadata?.is_external)
          ).length;
          observedMetric = shareAttempts;
          if (shareAttempts >= rule.threshold) {
            isTriggered = true;
            triggerDetail = `Document exfiltration attempt via unauthorized external email file sharing`;
          }
          break;
        }

        default:
          break;
      }

      if (isTriggered) {
        triggeredRules.push({
          ruleId: rule.id,
          ruleCode: rule.rule_code,
          ruleName: rule.rule_name,
          severity: rule.severity,
          riskWeight: rule.risk_weight,
          observedMetric,
          threshold: rule.threshold,
          timeWindowMinutes: rule.time_window_minutes,
          detail: triggerDetail
        });
        totalRiskWeight += rule.risk_weight;
      }
    }

    // Determine max severity
    const severityHierarchy = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    let maxSeverity = 'Low';
    for (const tr of triggeredRules) {
      if ((severityHierarchy[tr.severity] || 0) > (severityHierarchy[maxSeverity] || 0)) {
        maxSeverity = tr.severity;
      }
    }

    return {
      isTriggered: triggeredRules.length > 0,
      triggeredRules,
      ruleRiskScore: Math.min(100, totalRiskWeight),
      maxSeverity
    };
  }
}

module.exports = RuleEngine;
