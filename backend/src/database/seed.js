const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./db');
const AuditChainService = require('../services/auditChainService');
const seedVirtualDesktopData = require('./seedVirtualDesktop');

const GENESIS_HASH = crypto.createHash('sha256').update('GENESIS_BLOCK_UBA_SENTINEL_ROOT').digest('hex');

async function runSeed() {
  console.log('🌱 Seeding UBA Sentinel Database...');

  // 1. Password hashing
  const salt = await bcrypt.genSalt(10);
  const adminHash = await bcrypt.hash('Admin@12345', salt);
  const managerHash = await bcrypt.hash('Manager@12345', salt);
  const employeeHash = await bcrypt.hash('Employee@12345', salt);

  // Check if already seeded
  const existingProfiles = await db.find('profiles');
  if (existingProfiles && existingProfiles.length > 0) {
    console.log(`Database already contains ${existingProfiles.length} profiles. Skipping base profile re-seeding.`);
    await seedVirtualDesktopData();
    return;
  }

  // 2. Insert Core Role Accounts
  const usersToSeed = [
    {
      id: 'a1000000-0000-0000-0000-000000000001',
      email: 'admin@sentinel.local',
      password_hash: adminHash,
      full_name: 'Dr. Evelyn Cross (Chief Information Security Officer)',
      role: 'Administrator',
      department: 'Cybersecurity SOC',
      employee_code: 'SEC-001',
      job_title: 'Lead SOC Architect',
      is_active: true
    },
    {
      id: 'a1000000-0000-0000-0000-000000000002',
      email: 'manager@sentinel.local',
      password_hash: managerHash,
      full_name: 'Marcus Vance (SecOps Manager)',
      role: 'Manager',
      department: 'Engineering Operations',
      employee_code: 'ENG-002',
      job_title: 'Engineering Director',
      is_active: true
    },
    {
      id: 'a1000000-0000-0000-0000-000000000003',
      email: 'employee@sentinel.local',
      password_hash: employeeHash,
      full_name: 'Jordan Hayes (Staff Developer)',
      role: 'Employee',
      department: 'Engineering',
      employee_code: 'DEV-003',
      job_title: 'Full Stack Engineer',
      is_active: true
    },
    {
      id: 'a1000000-0000-0000-0000-000000000004',
      email: 'sarah.chen@sentinel.local',
      password_hash: employeeHash,
      full_name: 'Sarah Chen (Senior Analyst)',
      role: 'Employee',
      department: 'Finance',
      employee_code: 'FIN-104',
      job_title: 'Senior Financial Analyst',
      is_active: true
    },
    {
      id: 'a1000000-0000-0000-0000-000000000005',
      email: 'alex.rivera@sentinel.local',
      password_hash: employeeHash,
      full_name: 'Alex Rivera (DevOps Lead)',
      role: 'Employee',
      department: 'Infrastructure',
      employee_code: 'OPS-105',
      job_title: 'Cloud Systems Administrator',
      is_active: true
    },
    {
      id: 'a1000000-0000-0000-0000-000000000006',
      email: 'david.miller@sentinel.local',
      password_hash: employeeHash,
      full_name: 'David Miller (Research Scientist)',
      role: 'Employee',
      department: 'R&D',
      employee_code: 'RND-106',
      job_title: 'Data Research Scientist',
      is_active: true
    },
    {
      id: 'a1000000-0000-0000-0000-000000000007',
      email: 'emma.watson@sentinel.local',
      password_hash: employeeHash,
      full_name: 'Emma Watson (HR Operations)',
      role: 'Employee',
      department: 'Human Resources',
      employee_code: 'HR-107',
      job_title: 'HR Operations Lead',
      is_active: true
    }
  ];

  for (const u of usersToSeed) {
    await db.insert('profiles', {
      id: u.id,
      email: u.email,
      password_hash: u.password_hash,
      full_name: u.full_name,
      role: u.role,
      department: u.department,
      is_active: u.is_active,
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    await db.insert('monitored_users', {
      user_id: u.id,
      employee_code: u.employee_code,
      full_name: u.full_name,
      department: u.department,
      job_title: u.job_title,
      risk_level: u.employee_code === 'FIN-104' ? 'High' : (u.employee_code === 'OPS-105' ? 'Medium' : 'Low'),
      current_risk_score: u.employee_code === 'FIN-104' ? 78.5 : (u.employee_code === 'OPS-105' ? 42.0 : 8.5),
      baseline_status: u.employee_code === 'FIN-104' ? 'Anomalous' : 'Established',
      account_status: 'Active',
      last_active_at: new Date().toISOString()
    });

    await db.insert('user_baselines', {
      user_id: u.id,
      work_hours_start: 9,
      work_hours_end: 18,
      avg_daily_downloads: u.department === 'Finance' ? 4.2 : 7.5,
      std_daily_downloads: 1.8,
      avg_daily_modifications: u.department === 'Infrastructure' ? 25.0 : 8.0,
      std_daily_modifications: 3.5,
      avg_unique_resources_accessed: 9.0,
      std_unique_resources_accessed: 2.2,
      typical_ips: ['192.168.1.100', '10.0.4.45'],
      sample_period_days: 30,
      is_baseline_locked: false,
      last_calculated_at: new Date().toISOString()
    });
  }

  // 3. Insert Configurable Detection Rules
  const rules = [
    {
      id: 'd1000000-0000-0000-0000-000000000001',
      rule_name: 'Brute Force Authentication Attempt',
      rule_code: 'RULE_FAILED_LOGINS',
      description: 'Flags when consecutive failed login attempts exceed the threshold within the configured rolling window',
      threshold: 5,
      time_window_minutes: 10,
      severity: 'High',
      risk_weight: 35,
      is_enabled: true
    },
    {
      id: 'd1000000-0000-0000-0000-000000000002',
      rule_name: 'Mass File Exfiltration / Excessive Downloads',
      rule_code: 'RULE_EXCESSIVE_DOWNLOADS',
      description: 'Identifies file download volume that significantly exceeds the threshold within a rolling time window',
      threshold: 20,
      time_window_minutes: 15,
      severity: 'Critical',
      risk_weight: 45,
      is_enabled: true
    },
    {
      id: 'd1000000-0000-0000-0000-000000000003',
      rule_name: 'Repeated Access Denied Probing',
      rule_code: 'RULE_UNAUTHORIZED_ACCESS',
      description: 'Detects repeated HTTP 401/403 unauthorized access requests against sensitive corporate resources',
      threshold: 4,
      time_window_minutes: 10,
      severity: 'Medium',
      risk_weight: 25,
      is_enabled: true
    },
    {
      id: 'd1000000-0000-0000-0000-000000000004',
      rule_name: 'Off-Hours Sensitive Access Anomaly',
      rule_code: 'RULE_OFF_HOURS_ACTIVITY',
      description: 'Detects sensitive system access outside employee established business working hours (e.g. 23:00 - 05:00)',
      threshold: 2,
      time_window_minutes: 60,
      severity: 'Medium',
      risk_weight: 20,
      is_enabled: true
    },
    {
      id: 'd1000000-0000-0000-0000-000000000005',
      rule_name: 'High Frequency Record Modification Burst',
      rule_code: 'RULE_RECORD_MODIFICATION_SPIKE',
      description: 'Flags suspicious high-volume bulk modifications or deletions of critical database records',
      threshold: 25,
      time_window_minutes: 15,
      severity: 'Critical',
      risk_weight: 40,
      is_enabled: true
    },
    {
      id: 'd1000000-0000-0000-0000-000000000006',
      rule_name: 'Confidential Resource Enumeration Reconnaissance',
      rule_code: 'RULE_SENSITIVE_RESOURCE_BURST',
      description: 'Flags fast browsing across high counts of distinct confidential resources within a short burst',
      threshold: 8,
      time_window_minutes: 5,
      severity: 'High',
      risk_weight: 30,
      is_enabled: true
    },
    {
      id: 'd1000000-0000-0000-0000-000000000007',
      rule_name: 'DLP Screen Capture & Exfiltration Attempt',
      rule_code: 'RULE_DLP_SCREENSHOT_ATTEMPT',
      description: 'Detects unauthorized print screen actions, clipping tool execution, or window capture while viewing restricted classified files',
      threshold: 1,
      time_window_minutes: 10,
      severity: 'High',
      risk_weight: 35,
      is_enabled: true
    },
    {
      id: 'd1000000-0000-0000-0000-000000000008',
      rule_name: 'Unauthorized External File Sharing Exfiltration',
      rule_code: 'RULE_EXTERNAL_FILE_SHARE',
      description: 'Identifies file transmission or sharing requests dispatched to unverified external or personal email domains',
      threshold: 1,
      time_window_minutes: 15,
      severity: 'Critical',
      risk_weight: 45,
      is_enabled: true
    }
  ];

  for (const r of rules) {
    await db.insert('detection_rules', r);
  }

  // 4. Initial Genesis Block for Tamper-Evident Audit Chain
  const firstEventPayload = {
    action: 'SYSTEM_INITIALIZATION',
    initiated_by: 'admin@sentinel.local',
    timestamp: new Date().toISOString()
  };
  const firstHash = AuditChainService.computeHash(GENESIS_HASH, firstEventPayload);

  await db.insert('audit_chain_records', {
    sequence_number: 1,
    event_id: '00000000-0000-0000-0000-000000000001',
    event_payload: firstEventPayload,
    previous_hash: GENESIS_HASH,
    current_hash: firstHash,
    signature: 'SYSTEM_ROOT_INTEGRITY_VALIDATED'
  });

  // 5. Seed Initial Activity and Sample Alerts/Incidents for Sarah Chen
  const sarahUser = usersToSeed.find(u => u.employee_code === 'FIN-104');
  
  const pastTime = new Date(Date.now() - 4 * 60 * 60 * 1000);
  await db.insert('activity_events', {
    user_id: sarahUser.id,
    user_email: sarahUser.email,
    event_type: 'LOGIN',
    timestamp: pastTime.toISOString(),
    resource_id: '/portal/login',
    action: 'AUTH',
    status: 'SUCCESS',
    ip_address: '192.168.1.100',
    session_id: 'sess_' + crypto.randomBytes(8).toString('hex'),
    metadata: { browser: 'Chrome 122', os: 'Windows 11' },
    risk_score: 5.0,
    is_suspicious: false
  });

  const alertTime = new Date(Date.now() - 45 * 60 * 1000);
  const triggerEvent = await db.insert('activity_events', {
    user_id: sarahUser.id,
    user_email: sarahUser.email,
    event_type: 'FILE_DOWNLOAD',
    timestamp: alertTime.toISOString(),
    resource_id: '/financials/q3_merger_confidential.xlsx',
    action: 'DOWNLOAD',
    status: 'SUCCESS',
    ip_address: '10.0.4.199',
    session_id: 'sess_' + crypto.randomBytes(8).toString('hex'),
    metadata: { file_size_mb: 85.4, file_count_15m: 64, typical_rate: 4 },
    risk_score: 88.5,
    is_suspicious: true,
    detection_explanation: {
      primary_trigger: 'RULE_EXCESSIVE_DOWNLOADS',
      anomaly_score: 0.89,
      factors: [
        'Downloaded 64 confidential files in 15 mins (Baseline avg: 4.2)',
        'Unrecognized subnet IP address (10.0.4.199)',
        'Off-peak access pattern'
      ]
    }
  });

  const sampleAlert = await db.insert('security_alerts', {
    user_id: sarahUser.id,
    user_name: sarahUser.full_name,
    department: sarahUser.department,
    title: 'Mass Confidential Financial File Exfiltration Detected',
    explanation: 'Sarah Chen triggered an anomalous spike of 64 file downloads within 15 minutes, exceeding the baseline standard deviation by +5.2σ, originating from an atypical internal IP (10.0.4.199).',
    affected_resources: ['/financials/q3_merger_confidential.xlsx', '/financials/executive_compensation_2026.pdf', '/financials/ledger_export_oct.csv'],
    detection_method: 'HYBRID',
    severity: 'High',
    risk_score: 88.5,
    status: 'Investigating',
    trigger_event_id: triggerEvent.id,
    contributing_factors: [
      { factor: 'Excessive Download Velocity', weight: 45, value: '64 files / 15m' },
      { factor: 'Isolation Forest Anomaly', weight: 25, value: 'Anomaly Score 0.89' },
      { factor: 'Atypical Network Location', weight: 18.5, value: 'IP 10.0.4.199' }
    ],
    mitigation_action: 'User activity flagged for SecOps review. Access to merger assets restricted.'
  });

  const sampleIncident = await db.insert('incidents', {
    incident_number: 'INC-2026-0041',
    user_id: sarahUser.id,
    user_name: sarahUser.full_name,
    title: 'Potential Intellectual Property Exfiltration - Sarah Chen',
    description: 'Anomalous volume spike involving merger and acquisition documents. User downloaded 15x normal daily baseline during non-standard operational window.',
    severity: 'High',
    status: 'Investigating',
    lead_investigator: 'Marcus Vance (SecOps Manager)',
    root_cause: 'Pending inquiry with departmental manager to confirm business justification.',
    containment_action: 'Monitored with enhanced telemetry; temporary session re-authentication required.'
  });

  await db.insert('investigation_notes', {
    incident_id: sampleIncident.id,
    author_id: 'a1000000-0000-0000-0000-000000000002',
    author_name: 'Marcus Vance',
    note_text: 'Reviewed file hashes and destination endpoints. The files originated from the M&A staging repository. Contacting Finance team VP to verify authorized project status.'
  });

  // Chain block 2 using AuditChainService.computeHash
  const nextPayload = {
    action: 'CRITICAL_SECURITY_ALERT_GENERATED',
    alert_id: sampleAlert.id,
    user: sarahUser.email,
    risk_score: 88.5
  };
  const nextHash = AuditChainService.computeHash(firstHash, nextPayload);

  await db.insert('audit_chain_records', {
    sequence_number: 2,
    event_id: triggerEvent.id,
    event_payload: nextPayload,
    previous_hash: firstHash,
    current_hash: nextHash,
    signature: 'SEC_SYSTEM_AUTOMATION_SIGNED'
  });

  console.log('✅ UBA Sentinel Database Seeded Successfully!');
}

if (require.main === module) {
  runSeed().catch(err => console.error('Seed error:', err));
}

module.exports = runSeed;
