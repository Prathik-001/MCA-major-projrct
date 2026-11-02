const crypto = require('crypto');
const db = require('../database/db');
const ActivityService = require('./activityService');

class SimulationService {
  /**
   * Triggers a controlled attack scenario against the test environment
   */
  static async runScenario(scenarioKey, targetUserId) {
    // Default to Sarah Chen or employee if not provided
    let user = targetUserId ? await db.findOne('profiles', p => p.id === targetUserId) : null;
    if (!user) {
      user = await db.findOne('profiles', p => p.employee_code === 'FIN-104') ||
             await db.findOne('profiles', p => p.role === 'Employee');
    }

    const results = [];
    const now = new Date();

    switch (scenarioKey) {
      case 'SCENARIO_BRUTE_FORCE': {
        // 6 rapid failed logins in 2 minutes
        for (let i = 0; i < 6; i++) {
          const timestamp = new Date(now.getTime() - (6 - i) * 15 * 1000).toISOString();
          const res = await ActivityService.recordEvent({
            userId: user.id,
            userEmail: user.email,
            eventType: 'FAILED_LOGIN',
            resourceId: '/api/auth/login',
            action: 'AUTHENTICATE',
            status: 'FAILURE',
            ipAddress: '198.51.100.42',
            metadata: { attempt: i + 1, reason: 'Invalid password hash', synthetic_scenario: 'Brute Force' },
            timestamp
          });
          results.push(res);
        }
        break;
      }

      case 'SCENARIO_DATA_EXFILTRATION': {
        // 25 mass file downloads in 5 minutes
        const files = [
          'q4_merger_financials.xlsx', 'customer_credit_cards.csv', 'executive_bonus_plan.pdf',
          'source_code_archive.zip', 'internal_salaries_2026.xlsx', 'client_pii_vault.db',
          'patent_application_draft.docx', 'vendor_contracts_master.pdf'
        ];
        for (let i = 0; i < 25; i++) {
          const file = files[i % files.length];
          const timestamp = new Date(now.getTime() - (25 - i) * 10 * 1000).toISOString();
          const res = await ActivityService.recordEvent({
            userId: user.id,
            userEmail: user.email,
            eventType: 'FILE_DOWNLOAD',
            resourceId: `/confidential/${file}`,
            action: 'DOWNLOAD',
            status: 'SUCCESS',
            ipAddress: '10.0.99.14',
            metadata: { file_name: file, size_kb: 4500 + i * 200, synthetic_scenario: 'Exfiltration' },
            timestamp
          });
          results.push(res);
        }
        break;
      }

      case 'SCENARIO_UNAUTHORIZED_PROBING': {
        // 6 access denied responses against forbidden endpoints
        const forbiddenUrls = [
          '/admin/super-secret-keys', '/security/hsm-export', '/api/v1/root-audit-purge',
          '/finance/board-confidential', '/hr/disciplinary-records', '/admin/system-terminal'
        ];
        for (let i = 0; i < forbiddenUrls.length; i++) {
          const timestamp = new Date(now.getTime() - (6 - i) * 20 * 1000).toISOString();
          const res = await ActivityService.recordEvent({
            userId: user.id,
            userEmail: user.email,
            eventType: 'ACCESS_DENIED',
            resourceId: forbiddenUrls[i],
            action: 'READ',
            status: 'FAILURE',
            ipAddress: '192.168.1.185',
            metadata: { http_status: 403, reason: 'Insufficient RBAC permissions', synthetic_scenario: 'Reconnaissance' },
            timestamp
          });
          results.push(res);
        }
        break;
      }

      case 'SCENARIO_OFF_HOURS_SURGE': {
        // Simulate event at 02:45 AM local time
        const offHoursTime = new Date();
        offHoursTime.setHours(2, 45, 0, 0);
        for (let i = 0; i < 4; i++) {
          const timestamp = new Date(offHoursTime.getTime() + i * 30 * 1000).toISOString();
          const res = await ActivityService.recordEvent({
            userId: user.id,
            userEmail: user.email,
            eventType: 'RECORD_MODIFY',
            resourceId: '/payroll/employee_bank_details',
            action: 'UPDATE',
            status: 'SUCCESS',
            ipAddress: '172.16.0.88',
            metadata: { target_record_id: `REC-${1000 + i}`, synthetic_scenario: 'Off Hours Surge' },
            timestamp
          });
          results.push(res);
        }
        break;
      }

      case 'SCENARIO_MASS_RECORD_MODIFICATION': {
        // 30 rapid record updates within 3 minutes
        for (let i = 0; i < 30; i++) {
          const timestamp = new Date(now.getTime() - (30 - i) * 6 * 1000).toISOString();
          const res = await ActivityService.recordEvent({
            userId: user.id,
            userEmail: user.email,
            eventType: 'RECORD_MODIFY',
            resourceId: `/database/customer_records/${1000 + i}`,
            action: 'DELETE',
            status: 'SUCCESS',
            ipAddress: '192.168.1.100',
            metadata: { table: 'customers', record_id: 1000 + i, synthetic_scenario: 'Mass Modification' },
            timestamp
          });
          results.push(res);
        }
        break;
      }

      case 'SCENARIO_NORMAL_ACTIVITY':
      default: {
        // 3 benign routine actions
        const normalEvents = [
          { type: 'LOGIN', res: '/portal/dashboard', action: 'AUTH', status: 'SUCCESS' },
          { type: 'PAGE_ACCESS', res: '/projects/task_board', action: 'READ', status: 'SUCCESS' },
          { type: 'FILE_DOWNLOAD', res: '/documentation/api_guide.pdf', action: 'DOWNLOAD', status: 'SUCCESS' }
        ];
        for (let i = 0; i < normalEvents.length; i++) {
          const item = normalEvents[i];
          const timestamp = new Date(now.getTime() - (3 - i) * 60 * 1000).toISOString();
          const res = await ActivityService.recordEvent({
            userId: user.id,
            userEmail: user.email,
            eventType: item.type,
            resourceId: item.res,
            action: item.action,
            status: item.status,
            ipAddress: '192.168.1.100',
            metadata: { synthetic_scenario: 'Routine Normal' },
            timestamp
          });
          results.push(res);
        }
        break;
      }
    }

    return {
      scenarioKey,
      targetUser: { id: user.id, email: user.email, name: user.full_name },
      generatedEventsCount: results.length,
      alertsTriggered: results.filter(r => r.alert !== null).length,
      incidentsCreated: results.filter(r => r.incident !== null).length,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generates a balanced synthetic research dataset with ground truth labels
   * for experimental evaluation of Rule-Based vs Anomaly vs Hybrid models
   */
  static generateSyntheticResearchDataset(sampleCount = 1000) {
    const dataset = [];
    const normalCount = Math.floor(sampleCount * 0.88); // 88% normal
    const maliciousCount = sampleCount - normalCount;   // 12% malicious insider

    // Normal samples
    for (let i = 0; i < normalCount; i++) {
      const logins = Math.random() < 0.8 ? 1 : 2;
      const downloads = Math.floor(Math.random() * 6);
      const denied = Math.random() < 0.95 ? 0 : 1;
      const resources = Math.floor(Math.random() * 8) + 1;
      const hour = 9 + Math.floor(Math.random() * 8); // 9am - 5pm
      const modifications = Math.floor(Math.random() * 10);
      const baselineAvg = 5.0;

      dataset.push({
        id: `synth_norm_${i}`,
        ground_truth: 'NORMAL',
        features: {
          logins_1h: logins,
          downloads_15m: downloads,
          denied_15m: denied,
          unique_resources: resources,
          hour_of_day: hour,
          modifications_15m: modifications,
          download_ratio: downloads / baselineAvg
        }
      });
    }

    // Malicious Insider Threat samples across 4 vectors
    const attackVectors = ['DATA_EXFILTRATION', 'BRUTE_FORCE', 'PRIVILEGE_ABUSE', 'SABOTAGE_MODIFICATION'];
    for (let i = 0; i < maliciousCount; i++) {
      const vector = attackVectors[i % attackVectors.length];
      let sample = {};

      if (vector === 'DATA_EXFILTRATION') {
        sample = {
          logins_1h: 1,
          downloads_15m: 22 + Math.floor(Math.random() * 40),
          denied_15m: 0,
          unique_resources: 12 + Math.floor(Math.random() * 15),
          hour_of_day: Math.random() < 0.5 ? 2 : 14,
          modifications_15m: 2,
          download_ratio: 6.5 + Math.random() * 8
        };
      } else if (vector === 'BRUTE_FORCE') {
        sample = {
          logins_1h: 6 + Math.floor(Math.random() * 10),
          downloads_15m: 0,
          denied_15m: 4 + Math.floor(Math.random() * 5),
          unique_resources: 1,
          hour_of_day: 1 + Math.floor(Math.random() * 4),
          modifications_15m: 0,
          download_ratio: 0.1
        };
      } else if (vector === 'PRIVILEGE_ABUSE') {
        sample = {
          logins_1h: 1,
          downloads_15m: 4,
          denied_15m: 5 + Math.floor(Math.random() * 4),
          unique_resources: 14 + Math.floor(Math.random() * 10),
          hour_of_day: 23,
          modifications_15m: 5,
          download_ratio: 1.2
        };
      } else { // SABOTAGE_MODIFICATION
        sample = {
          logins_1h: 1,
          downloads_15m: 1,
          denied_15m: 0,
          unique_resources: 6,
          hour_of_day: 3,
          modifications_15m: 30 + Math.floor(Math.random() * 25),
          download_ratio: 0.5
        };
      }

      dataset.push({
        id: `synth_mal_${i}`,
        ground_truth: 'INSIDER_THREAT',
        attack_vector: vector,
        features: sample
      });
    }

    // Shuffle dataset
    for (let i = dataset.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [dataset[i], dataset[j]] = [dataset[j], dataset[i]];
    }

    return dataset;
  }
}

module.exports = SimulationService;
