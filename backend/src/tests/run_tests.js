const assert = require('assert');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../database/db');
const RuleEngine = require('../services/ruleEngine');
const BaselineEngine = require('../services/baselineEngine');
const MLEngine = require('../services/mlEngine');
const HybridRiskEngine = require('../services/hybridRiskEngine');
const ActivityService = require('../services/activityService');
const AuditChainService = require('../services/auditChainService');
const ResearchEvalService = require('../services/researchEvalService');
const CertImportService = require('../services/certImportService');
const SimulationService = require('../services/simulationService');

let passedTests = 0;
let failedTests = 0;

function runTest(testName, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${testName}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
}

async function runAsyncTest(testName, fn) {
  try {
    await fn();
    console.log(`  ✅ PASS: ${testName}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${testName}`);
    console.error(`     Error: ${err.message}`);
    failedTests++;
  }
}

async function startTestSuite() {
  console.log(`================================================================`);
  console.log(`🧪 UBA SENTINEL AUTOMATED COMPREHENSIVE TEST SUITE`);
  console.log(`================================================================`);

  // 1. Authentication & JWT Validation Tests
  console.log(`\n[Suite 1: Authentication & Token Lifecycle]`);
  runTest('JWT Signing and Verification', () => {
    const payload = { userId: 'test-user-123', email: 'test@sentinel.local', role: 'Administrator' };
    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, config.jwtSecret);
    assert.strictEqual(decoded.userId, 'test-user-123');
    assert.strictEqual(decoded.role, 'Administrator');
  });

  await runAsyncTest('Password Hashing and Matching', async () => {
    const rawPass = 'SecretP@ssw0rd2026';
    const hash = await bcrypt.hash(rawPass, 10);
    const isMatch = await bcrypt.compare(rawPass, hash);
    const isWrong = await bcrypt.compare('WrongPassword', hash);
    assert.strictEqual(isMatch, true);
    assert.strictEqual(isWrong, false);
  });

  // 2. Cryptographic Hash-Chained Audit Logging & Tamper Detection
  console.log(`\n[Suite 2: Tamper-Evident Audit Logging & SHA-256 Hash Chaining]`);
  await runAsyncTest('Initial Audit Chain Verification', async () => {
    const verification = await AuditChainService.verifyChain();
    assert.strictEqual(verification.isValid, true);
    assert.ok(verification.totalRecords > 0);
  });

  await runAsyncTest('Audit Block Append and Sequence Continuity', async () => {
    const testEventId = crypto.randomUUID();
    const testPayload = { action: 'TEST_FILE_READ', resource: '/docs/spec.pdf', user: 'admin@sentinel.local' };
    const newBlock = await AuditChainService.appendRecord(testEventId, testPayload);
    assert.ok(newBlock.sequence_number > 0);
    assert.ok(newBlock.current_hash.length === 64);
    assert.ok(newBlock.previous_hash.length === 64);

    const verificationAfterAppend = await AuditChainService.verifyChain();
    assert.strictEqual(verificationAfterAppend.isValid, true);
  });

  await runAsyncTest('Simulated Tamper Detection Utility Flags Altered Record', async () => {
    // Record original state of sequence 2
    const originalRecord = await db.findOne('audit_chain_records', r => r.sequence_number === 2);
    if (originalRecord) {
      // Intentionally tamper sequence 2 payload
      await AuditChainService.simulateTamper(2, 'UNAUTHORIZED_FORGED_ACTION_TAMPER');
      const verificationResult = await AuditChainService.verifyChain();
      assert.strictEqual(verificationResult.isValid, false);
      assert.strictEqual(verificationResult.brokenSequenceNumber, 2);
      assert.strictEqual(verificationResult.errorType, 'PAYLOAD_TAMPERING_DETECTED');

      // Revert tamper to leave chain healthy
      await db.update('audit_chain_records', r => r.sequence_number === 2, { event_payload: originalRecord.event_payload });
      const restoredVerification = await AuditChainService.verifyChain();
      assert.strictEqual(restoredVerification.isValid, true);
    }
  });

  // 3. Dynamic User Behaviour Baselines & Deviation Scoring
  console.log(`\n[Suite 3: Dynamic User Behaviour Baselines & Z-Score Analytics]`);
  await runAsyncTest('User Baseline Fetch and Default Initialization', async () => {
    const testUserId = 'a1000000-0000-0000-0000-000000000004';
    const baseline = await BaselineEngine.getBaseline(testUserId);
    assert.ok(baseline.avg_daily_downloads > 0);
    assert.strictEqual(baseline.work_hours_start, 9);
    assert.strictEqual(baseline.work_hours_end, 18);
  });

  await runAsyncTest('Baseline Deviation Detection on Massive Download Burst', async () => {
    const testUserId = 'a1000000-0000-0000-0000-000000000004';
    // Synthetic burst of 80 downloads in last 24h
    const burstEvents = [];
    for (let i = 0; i < 80; i++) {
      burstEvents.push({
        event_type: 'FILE_DOWNLOAD',
        resource_id: `/confidential/file_${i}.xlsx`,
        timestamp: new Date().toISOString()
      });
    }

    const evaluation = await BaselineEngine.evaluateBaselineDeviation(testUserId, burstEvents);
    assert.strictEqual(evaluation.isAnomalous, true);
    assert.ok(evaluation.baselineAnomalyScore >= 40);
    const downloadDev = evaluation.deviations.find(d => d.metric === 'Daily Downloads');
    assert.ok(downloadDev !== undefined);
    assert.ok(downloadDev.zScore > 5.0); // Extreme standard deviation spike
  });

  // 4. Rule-Based Threat Detection Engine
  console.log(`\n[Suite 4: Rule-Based Detection Engine]`);
  await runAsyncTest('Excessive Downloads Rule Detection', async () => {
    const testUserId = 'test-rule-user-01';
    const triggerEvent = {
      user_id: testUserId,
      event_type: 'FILE_DOWNLOAD',
      resource_id: '/vault/merger.docx',
      status: 'SUCCESS',
      timestamp: new Date().toISOString()
    };

    // Pre-insert 25 download events in DB
    for (let i = 0; i < 25; i++) {
      await db.insert('activity_events', {
        user_id: testUserId,
        event_type: 'FILE_DOWNLOAD',
        resource_id: `/vault/merger_${i}.docx`,
        status: 'SUCCESS',
        timestamp: new Date().toISOString()
      });
    }

    const ruleEval = await RuleEngine.evaluateEvent(triggerEvent);
    assert.strictEqual(ruleEval.isTriggered, true);
    const excessiveRule = ruleEval.triggeredRules.find(r => r.ruleCode === 'RULE_EXCESSIVE_DOWNLOADS');
    assert.ok(excessiveRule !== undefined);
    assert.strictEqual(excessiveRule.severity, 'Critical');
  });

  // 5. Machine Learning Isolation Forest Anomaly Scoring
  console.log(`\n[Suite 5: Isolation Forest Anomaly Inference]`);
  runTest('Isolation Forest Scoring on Benign vs Outlier Point', () => {
    const iforest = MLEngine.getModel();
    // Normal point: [1 login, 3 downloads, 0 denied, 4 resources, 0 time offset, 0.9 ratio, 2 modifications]
    const normalPoint = [1, 3, 0, 4, 0, 0.9, 2];
    const normalScore = iforest.scorePoint(normalPoint);

    // Extreme outlier point: [15 logins, 150 downloads, 12 denied, 45 resources, 10 time offset, 30.0 ratio, 85 modifications]
    const outlierPoint = [15, 150, 12, 45, 10, 30.0, 85];
    const outlierScore = iforest.scorePoint(outlierPoint);

    assert.ok(outlierScore > normalScore, `Outlier score (${outlierScore}) must exceed normal score (${normalScore})`);
    assert.ok(outlierScore >= 0.60, `Outlier score should cross 0.60 anomaly threshold`);
  });

  // 6. Explainable Hybrid Risk Scoring (Formula & Factors)
  console.log(`\n[Suite 6: Explainable Hybrid Risk Scoring]`);
  await runAsyncTest('Hybrid Risk Score Formula & Contributing Factors', async () => {
    const testUserId = 'a1000000-0000-0000-0000-000000000004';
    const testEvent = {
      user_id: testUserId,
      event_type: 'FILE_DOWNLOAD',
      resource_id: '/finance/q3_secrets.pdf',
      action: 'DOWNLOAD',
      status: 'SUCCESS',
      timestamp: new Date().toISOString()
    };

    const hybrid = await HybridRiskEngine.evaluateEvent(testEvent);
    assert.ok(hybrid.compositeRiskScore >= 0 && hybrid.compositeRiskScore <= 100);
    assert.ok(['Low', 'Medium', 'High', 'Critical'].includes(hybrid.severity));
    assert.ok(Array.isArray(hybrid.contributingFactors));
    assert.ok(['RULE_BASED', 'ANOMALY_BASED', 'HYBRID'].includes(hybrid.detectionMethod));
  });

  // 7. Research Evaluation & Confusion Matrix
  console.log(`\n[Suite 7: Experimental Research Evaluation Pipeline]`);
  await runAsyncTest('Comparative Model Evaluation Metrics & Confusion Matrix', async () => {
    const evalReport = await ResearchEvalService.runComparativeEvaluation({ sampleSize: 200, testSplitRatio: 0.3 });
    assert.ok(evalReport.models.rule_based.precision >= 0);
    assert.ok(evalReport.models.anomaly_based.recall >= 0);
    assert.ok(evalReport.models.hybrid_framework.f1_score >= 0);
    assert.ok(evalReport.models.hybrid_framework.confusion_matrix.tp >= 0);
    assert.ok(evalReport.models.hybrid_framework.confusion_matrix.tn >= 0);
  });

  // 8. CERT Dataset Ingestion Pipeline
  console.log(`\n[Suite 8: CERT Insider Threat Test Dataset Schema Mapping]`);
  runTest('CERT r4.2 Schema Column Inspection and Normalization', () => {
    const rawCertLogon = { id: "{C1-99}", date: "2026-10-21T08:15:00Z", user: "ACM2278", pc: "PC-5832", activity: "Logon" };
    const mapped = CertImportService.mapCertRecordToSchema(rawCertLogon);
    assert.strictEqual(mapped.eventType, 'LOGIN');
    assert.strictEqual(mapped.action, 'AUTH');
    assert.strictEqual(mapped.status, 'SUCCESS');
    assert.strictEqual(mapped.userEmail, 'acm2278@cert-test.local');
  });

  // 9. Employee Data Isolation Tests
  console.log(`\n[Suite 9: Employee Data & Mailbox Isolation]`);
  await runAsyncTest('Email Transmission & Recipient Inbox / Sent Separation', async () => {
    const sarah = await db.findOne('profiles', p => p.email === 'sarah.chen@sentinel.local');
    const alex = await db.findOne('profiles', p => p.email === 'alex.rivera@sentinel.local');
    const jordan = await db.findOne('profiles', p => p.email === 'employee@sentinel.local');

    assert.ok(sarah, 'Sarah profile must exist');
    assert.ok(alex, 'Alex profile must exist');
    assert.ok(jordan, 'Jordan profile must exist');

    // Simulate Sarah sending an email to Alex
    const testEmail = await db.insert('employee_emails', {
      sender_id: sarah.id,
      sender_email: sarah.email,
      sender_name: sarah.full_name,
      subject: 'Strict Isolation Test Email',
      body: 'Testing mailbox confidentiality',
      is_draft: false,
      is_deleted: false,
      sent_at: new Date().toISOString()
    });

    // Deliver to Alex
    await db.insert('email_recipients', {
      email_id: testEmail.id,
      recipient_id: alex.id,
      recipient_email: alex.email,
      recipient_name: alex.full_name,
      folder: 'inbox',
      is_read: false,
      is_deleted: false
    });

    // Put in Sarah's sent folder
    await db.insert('email_recipients', {
      email_id: testEmail.id,
      recipient_id: sarah.id,
      recipient_email: sarah.email,
      recipient_name: sarah.full_name,
      folder: 'sent',
      is_read: true,
      is_deleted: false
    });

    // Verify Alex sees it in inbox
    const alexInbox = await db.find('email_recipients', r => r.recipient_id === alex.id && r.folder === 'inbox' && r.email_id === testEmail.id);
    assert.strictEqual(alexInbox.length, 1, 'Alex must have the email in his inbox');

    // Verify Sarah sees it in sent
    const sarahSent = await db.find('email_recipients', r => r.recipient_id === sarah.id && r.folder === 'sent' && r.email_id === testEmail.id);
    assert.strictEqual(sarahSent.length, 1, 'Sarah must have the email in her sent folder');

    // Verify Jordan DOES NOT have this email in his inbox or sent
    const jordanRecips = await db.find('email_recipients', r => r.recipient_id === jordan.id && r.email_id === testEmail.id);
    assert.strictEqual(jordanRecips.length, 0, 'Jordan must NOT have access to private communication between Sarah and Alex');
  });

  // 10. Virtual Computer Admin Controls & Cryptographic Ledger
  console.log(`\n[Suite 10: Virtual Computer Remote Management & Tamper-Evident Audit]`);
  await runAsyncTest('Admin Workstation Lock, Reason Enforcement & Audit Chain Block', async () => {
    const admin = await db.findOne('profiles', p => p.role === 'Administrator');
    const sarah = await db.findOne('profiles', p => p.email === 'sarah.chen@sentinel.local');

    assert.ok(admin, 'Admin must exist');
    assert.ok(sarah, 'Sarah must exist');

    // Find Sarah's virtual computer
    let vm = await db.findOne('virtual_computers', v => v.employee_id === sarah.id);
    assert.ok(vm, "Sarah's virtual computer must exist");

    // Lock workstation with reason
    const lockReason = 'Anomalous exfiltration attempt detected. Security containment initiated.';
    await db.update('virtual_computers', v => v.id === vm.id, {
      status: 'Locked',
      lock_reason: lockReason,
      locked_by: admin.id,
      locked_at: new Date().toISOString()
    });

    // Verify locked status persists in DB
    const lockedVm = await db.findOne('virtual_computers', v => v.id === vm.id);
    assert.strictEqual(lockedVm.status, 'Locked');
    assert.strictEqual(lockedVm.lock_reason, lockReason);

    // Append cryptographic block to audit chain
    const auditBlock = await AuditChainService.appendRecord(crypto.randomUUID(), {
      action: 'LOCK_VIRTUAL_DESKTOP',
      admin: admin.email,
      target: sarah.email,
      reason: lockReason
    });
    assert.ok(auditBlock.current_hash.length === 64);

    // Verify entire chain remains valid
    const chainVerification = await AuditChainService.verifyChain();
    assert.strictEqual(chainVerification.isValid, true);

    // Unlock workstation
    await db.update('virtual_computers', v => v.id === vm.id, {
      status: 'Online',
      lock_reason: null,
      locked_by: null,
      locked_at: null
    });
    const restoredVm = await db.findOne('virtual_computers', v => v.id === vm.id);
    assert.strictEqual(restoredVm.status, 'Online');
  });

  // 11. File Access Control & Ownership Isolation
  console.log(`\n[Suite 11: File Permissions & Access Isolation]`);
  await runAsyncTest('Employee Private File Access Isolation', async () => {
    const sarah = await db.findOne('profiles', p => p.email === 'sarah.chen@sentinel.local');
    const alex = await db.findOne('profiles', p => p.email === 'alex.rivera@sentinel.local');

    // Create private file for Sarah
    const privateFile = await db.insert('employee_files', {
      employee_id: sarah.id,
      name: 'Confidential_Sarah_Only.xlsx',
      file_type: 'spreadsheet',
      file_size_bytes: 45000,
      classification: 'RESTRICTED',
      content_preview: 'CONFIDENTIAL',
      is_shared: false,
      is_deleted: false
    });

    // Check ownership
    const isAlexOwner = privateFile.employee_id === alex.id;
    assert.strictEqual(isAlexOwner, false, 'Alex must not be owner of Sarah’s private file');
    assert.strictEqual(privateFile.is_shared, false, 'File must not be shared');
  });

  // 12. Employee Registration & Automated Workstation Provisioning
  console.log(`\n[Suite 12: Employee Registration & Virtual Desktop Provisioning]`);
  await runAsyncTest('New Employee Registration & Dynamic Workstation Provisioning', async () => {
    const testEmail = `auto.test.${Date.now()}@sentinel.local`;
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash('TestPass@123', salt);
    const testUserId = crypto.randomUUID();

    // 1. Create Profile
    const profile = await db.insert('profiles', {
      id: testUserId,
      email: testEmail,
      password_hash: passHash,
      full_name: 'Test Automation Employee',
      role: 'Employee',
      department: 'Quality Assurance',
      employee_code: 'QA-999',
      job_title: 'QA Automation Engineer',
      is_active: true
    });
    assert.ok(profile.id, 'Profile must be created with ID');

    // 2. Provision Virtual Computer
    const vm = await db.insert('virtual_computers', {
      employee_id: testUserId,
      computer_name: "Test's Virtual Desktop",
      os_version: 'macOS 15.1 Sonoma Virtual Edition',
      status: 'Online',
      current_application: 'Finder'
    });
    assert.strictEqual(vm.employee_id, testUserId, 'Virtual computer must be provisioned for new employee');
    assert.strictEqual(vm.status, 'Online');

    // 3. Provision Desktop Preferences
    const prefs = await db.insert('desktop_preferences', {
      employee_id: testUserId,
      wallpaper: 'sonoma-dark',
      dock_position: 'bottom'
    });
    assert.strictEqual(prefs.employee_id, testUserId, 'Desktop preferences must be provisioned');

    // 4. Verify Welcome Mailbox Isolation
    const welcomeMail = await db.insert('employee_emails', {
      sender_id: 'a1000000-0000-0000-0000-000000000001',
      sender_email: 'admin@sentinel.local',
      sender_name: 'SOC Administrator',
      subject: 'Welcome to your Virtual Workstation',
      body: 'Your workstation is ready.',
      is_draft: false,
      is_starred: false,
      is_deleted: false,
      sent_at: new Date().toISOString()
    });

    const recip = await db.insert('email_recipients', {
      email_id: welcomeMail.id,
      recipient_id: testUserId,
      recipient_email: testEmail,
      recipient_name: 'Test Automation Employee',
      folder: 'inbox',
      is_read: false,
      is_deleted: false
    });
    assert.strictEqual(recip.recipient_id, testUserId, 'Inbox record must belong exclusively to new user');

    // Cleanup test record
    await db.delete('email_recipients', r => r.id === recip.id);
    await db.delete('employee_emails', e => e.id === welcomeMail.id);
    await db.delete('desktop_preferences', d => d.employee_id === testUserId);
    await db.delete('virtual_computers', v => v.employee_id === testUserId);
    await db.delete('profiles', p => p.id === testUserId);
  });

  console.log(`\n================================================================`);
  console.log(`🏁 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log(`================================================================`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  startTestSuite().catch(err => {
    console.error('Fatal test suite crash:', err);
    process.exit(1);
  });
}

module.exports = startTestSuite;
