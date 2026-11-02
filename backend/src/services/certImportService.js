const fs = require('fs');
const path = require('path');
const db = require('../database/db');
const ActivityService = require('./activityService');

class CertImportService {
  /**
   * Introspects and maps CERT dataset records to the common activity schema
   */
  static mapCertRecordToSchema(rawRecord, options = {}) {
    // Detect column aliases across CERT r4.2 / r5.2 versions
    const timestampRaw = rawRecord.date || rawRecord.timestamp || rawRecord.Date || rawRecord.time;
    const userRaw = rawRecord.user || rawRecord.User || rawRecord.user_id || rawRecord.username || 'CERT_USER';
    const pcRaw = rawRecord.pc || rawRecord.PC || rawRecord.workstation || rawRecord.ip || '192.168.10.15';
    const activityRaw = (rawRecord.activity || rawRecord.action || rawRecord.Activity || '').toUpperCase();
    const resourceRaw = rawRecord.filename || rawRecord.url || rawRecord.resource || rawRecord.file || '/cert/resource';

    let eventType = 'PAGE_ACCESS';
    let action = 'READ';
    let status = 'SUCCESS';

    if (activityRaw.includes('LOGON') || activityRaw.includes('LOGIN')) {
      eventType = 'LOGIN';
      action = 'AUTH';
    } else if (activityRaw.includes('LOGOFF') || activityRaw.includes('LOGOUT')) {
      eventType = 'LOGOUT';
      action = 'TERMINATE';
    } else if (activityRaw.includes('CONNECT') || activityRaw.includes('USB') || activityRaw.includes('DEVICE')) {
      eventType = 'FILE_DOWNLOAD';
      action = 'DEVICE_TRANSFER';
    } else if (activityRaw.includes('COPY') || activityRaw.includes('DOWNLOAD') || activityRaw.includes('FILE')) {
      eventType = 'FILE_DOWNLOAD';
      action = 'DOWNLOAD';
    } else if (activityRaw.includes('DENIED') || activityRaw.includes('FAIL')) {
      eventType = 'ACCESS_DENIED';
      action = 'READ';
      status = 'FAILURE';
    }

    // Convert date format (e.g. "01/02/2010 07:15:00" to ISO)
    let parsedTimestamp;
    try {
      parsedTimestamp = new Date(timestampRaw).toISOString();
    } catch {
      parsedTimestamp = new Date().toISOString();
    }

    return {
      userId: options.targetUserId || 'a1000000-0000-0000-0000-000000000004',
      userEmail: `${userRaw.toLowerCase()}@cert-test.local`,
      eventType,
      resourceId: resourceRaw,
      action,
      status,
      ipAddress: pcRaw.startsWith('PC-') ? `10.0.${Math.abs(pcRaw.hashCode ? pcRaw.hashCode() % 254 : 45)}.12` : pcRaw,
      metadata: {
        source_dataset: 'CERT Insider Threat Test Dataset r4.2',
        original_pc: pcRaw,
        original_activity: activityRaw,
        original_id: rawRecord.id || rawRecord._id
      },
      timestamp: parsedTimestamp
    };
  }

  /**
   * Imports a prepackaged representative CERT r4.2 slice containing known insider exfiltration
   */
  static async importSampleSlice(targetUserId) {
    const samplePath = path.join(__dirname, '../../data/cert_r4.2_slice.json');
    let records = [];

    if (fs.existsSync(samplePath)) {
      records = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
    } else {
      // Representative CERT r4.2 insider sequence (Scenario 1: exfiltration via removable drive after hours)
      records = [
        { id: "{C1-01}", date: "2026-10-20T08:14:00Z", user: "ACM2278", pc: "PC-5832", activity: "Logon", filename: "" },
        { id: "{C1-02}", date: "2026-10-20T08:35:10Z", user: "ACM2278", pc: "PC-5832", activity: "File Open", filename: "internal_org_chart.pdf" },
        { id: "{C1-03}", date: "2026-10-20T17:02:00Z", user: "ACM2278", pc: "PC-5832", activity: "Logoff", filename: "" },
        // Malicious phase: Logon outside working hours at 23:45
        { id: "{C1-04}", date: "2026-10-20T23:45:12Z", user: "ACM2278", pc: "PC-5832", activity: "Logon", filename: "" },
        { id: "{C1-05}", date: "2026-10-20T23:47:05Z", user: "ACM2278", pc: "PC-5832", activity: "Connect", filename: "SanDisk_Cruzer_USB" },
        { id: "{C1-06}", date: "2026-10-20T23:50:20Z", user: "ACM2278", pc: "PC-5832", activity: "File Copy", filename: "confidential_client_roster.xlsx" },
        { id: "{C1-07}", date: "2026-10-20T23:51:15Z", user: "ACM2278", pc: "PC-5832", activity: "File Copy", filename: "q3_financial_audit.docx" },
        { id: "{C1-08}", date: "2026-10-20T23:52:45Z", user: "ACM2278", pc: "PC-5832", activity: "File Copy", filename: "executive_compensation.pdf" },
        { id: "{C1-09}", date: "2026-10-20T23:55:00Z", user: "ACM2278", pc: "PC-5832", activity: "Disconnect", filename: "SanDisk_Cruzer_USB" },
        { id: "{C1-10}", date: "2026-10-20T23:56:30Z", user: "ACM2278", pc: "PC-5832", activity: "Logoff", filename: "" }
      ];
      // Save sample slice for future use
      const dataDir = path.dirname(samplePath);
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(samplePath, JSON.stringify(records, null, 2), 'utf8');
    }

    const importedResults = [];
    for (const rec of records) {
      const mapped = this.mapCertRecordToSchema(rec, { targetUserId });
      const res = await ActivityService.recordEvent(mapped);
      importedResults.push(res);
    }

    return {
      message: `Successfully processed and ingested ${importedResults.length} CERT r4.2 telemetry records.`,
      recordsCount: importedResults.length,
      alertsTriggered: importedResults.filter(r => r.alert !== null).length,
      incidentsCreated: importedResults.filter(r => r.incident !== null).length
    };
  }
}

module.exports = CertImportService;
