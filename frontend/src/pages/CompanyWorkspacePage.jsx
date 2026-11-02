import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import SeverityBadge from '../components/SeverityBadge';
import RiskGauge from '../components/RiskGauge';
import {
  Building2,
  FolderLock,
  FileText,
  Download,
  Share2,
  AlertTriangle,
  ShieldAlert,
  Database,
  Lock,
  ExternalLink,
  Flame,
  CheckCircle2,
  XCircle,
  Save,
  Camera,
  Eye,
  EyeOff,
  User,
  Clock,
  Send,
  Zap,
  Server,
  AlertOctagon,
  Copy,
  Info,
  Upload,
  Trash2,
  Plus,
  FileUp,
  ClipboardCheck,
  RefreshCw,
  FileCheck2,
  X
} from 'lucide-react';

const INITIAL_DOCUMENTS = [
  {
    id: 'doc-01',
    name: 'Confidential M&A Merger Term Sheet ($240M).xlsx',
    path: '/confidential/m&a_term_sheet_240m.xlsx',
    classification: 'RESTRICTED',
    size: '18.5',
    updated: 'Today at 09:15 AM',
    type: 'spreadsheet',
    content: `# CONFIDENTIAL M&A MERGER & ACQUISITION TERM SHEET
PROJECT CODENAME: TITAN HORIZON
ACQUISITION VALUATION: $240,000,000 USD
CLOSING TARGET: Q4-2026

[ACQUISITION BREAKDOWN]
1. Primary Equity Purchase: $180,000,000 (75.0%)
2. Retained Management Earn-Out: $40,000,000 (16.6%)
3. Escrow Intellectual Property Holdback: $20,000,000 (8.4%)

[TARGET INTELLECTUAL PROPERTY PATENTS]
- US-PAT-90821: Distributed Low-Latency Consensus Engine
- US-PAT-90822: Cryptographic Zero-Knowledge Rollup Architecture
- US-PAT-90825: Autonomous Threat Neutralization System

NOTE: STRICTLY CONFIDENTIAL. UNAUTHORIZED TRANSMISSION OR SCREEN CAPTURE IS A CRIMINAL OFFENSE UNDER SEC RULE 10b-5.`
  },
  {
    id: 'doc-02',
    name: 'Executive Compensation & Board Bonus Matrix 2026.pdf',
    path: '/confidential/executive_compensation_master.pdf',
    classification: 'TOP SECRET',
    size: '12.2',
    updated: 'Yesterday at 16:40 PM',
    type: 'document',
    content: `# APEX GLOBAL ENTERPRISES: EXECUTIVE COMPENSATION MATRIX
BOARD OF DIRECTORS COMMITTEE APPROVAL: OCT 2026

1. Chief Executive Officer (CEO):
   - Base Annual: $1,450,000 USD
   - Performance Equity Grants: $4,200,000 USD
   - Restricted Stock Units (RSU): 120,000 Shares

2. Chief Information Security Officer (CISO):
   - Base Annual: $680,000 USD
   - Performance Incentive: $450,000 USD
   - Cybersecurity Retention Grant: 45,000 Shares

3. VP of Financial Operations:
   - Base Annual: $580,000 USD
   - Discretionary Bonus: $280,000 USD

RESTRICTION: LEVEL-5 CLEARANCE REQUIRED. RECORD ACCESSED BY AUDIT CONTROLLER.`
  },
  {
    id: 'doc-03',
    name: 'Customer Banking Escrow Balances Q3.csv',
    path: '/financials/customer_ledger_q3.csv',
    classification: 'RESTRICTED',
    size: '64.8',
    updated: 'Today at 08:30 AM',
    type: 'spreadsheet',
    content: `ACCOUNT_ID,CORPORATE_ENTITY,ESCROW_BALANCE_USD,SWIFT_BIC,STATUS
CUST-8021,Acme International Conglomerate,4250000.00,BOFAUS3N,Active
CUST-8022,Global Logistics Partners,1840500.00,CHASUS33,Active
CUST-8023,Starlight Bio-Pharmaceuticals,9300200.00,CITIUS33,Audited
CUST-8024,Nexus Distributed Networks,2150000.00,BARCGB22,Active
CUST-8025,Apex Capital Escrow Holding,15400000.00,WELLUS44,Restricted`
  },
  {
    id: 'doc-04',
    name: 'Core Production Cryptographic Keys & HSM Manifest.pem',
    path: '/vault/prod_hsm_master_key.pem',
    classification: 'TOP SECRET',
    size: '0.8',
    updated: '3 days ago',
    type: 'code',
    content: `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0w9e1zFqK... [CLASSIFIED PRODUCTION ROOT CERTIFICATE]
HSM_SLOT: 0x01
CLUSTER_ENCLAVE: AWS-US-EAST-1-HSM-VAULT-PRIMARY
ROOT_FINGERPRINT: SHA256:7b219e4a8b091f28b4d...
RESTRICTION: TOP SECRET - DUAL KEYHOLDER AUTHORIZATION MANDATED
-----END RSA PRIVATE KEY-----`
  },
  {
    id: 'doc-05',
    name: 'Apex Employee Ethics & Security Policy SEC-402.pdf',
    path: '/public/policy_2026.pdf',
    classification: 'PUBLIC',
    size: '1.4',
    updated: '1 month ago',
    type: 'document',
    content: `# APEX GLOBAL ENTERPRISES: INFORMATION SECURITY POLICY SEC-402

1. Purpose: To govern the acceptable use of corporate assets, intellectual property, and confidential client data.
2. Data Loss Prevention:
   - Screen capturing, clipping tool usage, or third-party camera recording of classified files is strictly prohibited.
   - Forwarding company documents to external personal email providers (Gmail, Yahoo, etc.) constitutes an immediate security violation.
3. Behavioral Telemetry: All workstation activities are continuously audited by automated User Behaviour Analytics (UBA).`
  }
];

const INITIAL_ESCROW = [
  { id: 'CUST-8021', name: 'Acme International Conglomerate', balance: '$4,250,000.00', swift: 'BOFAUS3N' },
  { id: 'CUST-8022', name: 'Global Logistics Partners', balance: '$1,840,500.00', swift: 'CHASUS33' },
  { id: 'CUST-8023', name: 'Starlight Bio-Pharmaceuticals', balance: '$9,300,200.00', swift: 'CITIUS33' },
  { id: 'CUST-8024', name: 'Nexus Distributed Networks', balance: '$2,150,000.00', swift: 'BARCGB22' }
];

export default function CompanyWorkspacePage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
  const fileInputRef = useRef(null);

  // Load persistent documents or initialize defaults
  const [documents, setDocuments] = useState(() => {
    try {
      const saved = localStorage.getItem('apex_corporate_docs');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_DOCUMENTS;
  });

  // Load persistent shared ledger
  const [sharedLedger, setSharedLedger] = useState(() => {
    try {
      const saved = localStorage.getItem('apex_shared_ledger');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [
      {
        id: 'share-01',
        docName: 'Customer Banking Escrow Balances Q3.csv',
        recipient: 'alex.rivera@sentinel.local',
        permission: 'View Only',
        timestamp: 'Today at 09:40 AM',
        status: 'ACTIVE'
      }
    ];
  });

  // Load persistent escrow accounts
  const [escrowLedger, setEscrowLedger] = useState(() => {
    try {
      const saved = localStorage.getItem('apex_escrow_ledger');
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_ESCROW;
  });

  // Save documents & shared ledger when updated
  useEffect(() => {
    try {
      localStorage.setItem('apex_corporate_docs', JSON.stringify(documents));
    } catch {
      // ignore
    }
  }, [documents]);

  useEffect(() => {
    try {
      localStorage.setItem('apex_shared_ledger', JSON.stringify(sharedLedger));
    } catch {
      // ignore
    }
  }, [sharedLedger]);

  useEffect(() => {
    try {
      localStorage.setItem('apex_escrow_ledger', JSON.stringify(escrowLedger));
    } catch {
      // ignore
    }
  }, [escrowLedger]);

  // Tab State
  const [activeTab, setActiveTab] = useState('drive'); // 'drive' | 'editor' | 'share' | 'ledger' | 'vault'
  const [selectedDoc, setSelectedDoc] = useState(documents[0] || INITIAL_DOCUMENTS[0]);
  const [fileContent, setFileContent] = useState(documents[0]?.content || INITIAL_DOCUMENTS[0].content);
  const [isClassifiedBlurred, setIsClassifiedBlurred] = useState(false);

  // Security HUD
  const [currentScore, setCurrentScore] = useState(12.0);
  const [riskSeverity, setRiskSeverity] = useState('Low');
  const [lastTelemetry, setLastTelemetry] = useState(null);
  const [complianceWarning, setComplianceWarning] = useState(null);
  const [actionProgress, setActionProgress] = useState(null);

  // Interactive Pop-ups
  const [downloadModalDoc, setDownloadModalDoc] = useState(null); // Pre-flight download approval modal
  const [deleteModalDoc, setDeleteModalDoc] = useState(null); // Deletion confirmation modal
  const [uploadNoticeModal, setUploadNoticeModal] = useState(null); // Upload scan modal
  const [dlpWarning, setDlpWarning] = useState(null); // DLP screenshot violation modal
  const [modalNotice, setModalNotice] = useState(null); // General interactive modal
  const [accessDeniedModal, setAccessDeniedModal] = useState(null); // 403 Forbidden modal
  const [toastNotification, setToastNotification] = useState(null); // Quick toast notice

  // Sharing form state
  const [shareDocName, setShareDocName] = useState(documents[0]?.name || INITIAL_DOCUMENTS[0].name);
  const [recipientEmail, setRecipientEmail] = useState('external.competitor@gmail.com');
  const [sharePermission, setSharePermission] = useState('View Only');
  const [sharingInProgress, setSharingInProgress] = useState(false);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastNotification) return;
    const t = setTimeout(() => setToastNotification(null), 4500);
    return () => clearTimeout(t);
  }, [toastNotification]);

  const showToast = (title, message, type = 'info') => {
    setToastNotification({ title, message, type });
  };

  // REAL DATA LOSS PREVENTION (DLP) SHORTCUT INTERCEPTOR
  useEffect(() => {
    const handleKeyDown = (e) => {
      // 1. Detect PrintScreen
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        triggerDlpScreenshotAlert('PrintScreen Key Pressed');
        e.preventDefault();
      }

      // 2. Detect Ctrl+P (Print document)
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        triggerDlpScreenshotAlert('Ctrl+P Print Shortcut Attempt');
      }

      // 3. Detect Windows Snipping Tool (Win + Shift + S) or Mac (Cmd + Shift + 4/3)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        triggerDlpScreenshotAlert('Snipping Tool Shortcut Intercepted');
      }
    };

    const handleKeyUp = (e) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44) {
        triggerDlpScreenshotAlert('PrintScreen Key Released');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [selectedDoc]);

  // Telemetry Dispatch Helper
  const dispatchTelemetry = async (eventData) => {
    try {
      const res = await ApiClient.recordActivity({
        userId: authUser?.id || 'a1000000-0000-0000-0000-000000000004',
        userEmail: authUser?.email || 'sarah.chen@sentinel.local',
        ...eventData
      });

      if (res?.event) {
        setLastTelemetry({
          event_type: res.event.event_type,
          resource: res.event.resource_id,
          risk_score: res.event.risk_score,
          is_suspicious: res.event.is_suspicious,
          timestamp: new Date().toLocaleTimeString()
        });
        setCurrentScore(res.event.risk_score || 0);

        let sev = 'Low';
        if (res.event.risk_score >= 80) sev = 'Critical';
        else if (res.event.risk_score >= 60) sev = 'High';
        else if (res.event.risk_score >= 30) sev = 'Medium';
        setRiskSeverity(sev);

        if (res.event.is_suspicious || res.event.risk_score >= 45) {
          setComplianceWarning({
            score: res.event.risk_score,
            message: `Elevated behavioral risk detected (Score: ${res.event.risk_score}/100). Activity logged to SOC audit chain.`
          });
        }
      }

      return res;
    } catch (err) {
      console.error('Telemetry dispatch error:', err);
      return null;
    }
  };

  // Trigger DLP Screenshot Alert
  const triggerDlpScreenshotAlert = async (triggerType) => {
    setIsClassifiedBlurred(true);

    await dispatchTelemetry({
      eventType: 'SCREENSHOT_ATTEMPT',
      resourceId: selectedDoc ? selectedDoc.path : '/confidential/workspace-screen',
      action: 'SCREEN_CAPTURE',
      status: 'FAILURE',
      metadata: {
        trigger: triggerType,
        document_classification: selectedDoc?.classification || 'RESTRICTED',
        workstation_id: 'WS-CORP-FIN-0842'
      }
    });

    setDlpWarning({
      trigger: triggerType,
      docName: selectedDoc?.name || 'Classified Workspace',
      timestamp: new Date().toLocaleTimeString()
    });
  };

  // 1. UPLOAD REAL DOCUMENT FROM COMPUTER
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result || '';
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      const isSensitive = file.name.toLowerCase().includes('confidential') ||
                          file.name.toLowerCase().includes('secret') ||
                          file.name.toLowerCase().includes('key') ||
                          file.name.toLowerCase().includes('finance');

      const classification = isSensitive ? 'RESTRICTED' : 'INTERNAL';

      const newDoc = {
        id: `upload-${Date.now()}`,
        name: file.name,
        path: `/workstation/uploads/${file.name}`,
        classification,
        size: sizeMb === '0.00' ? (file.size / 1024).toFixed(1) + ' KB' : sizeMb,
        updated: 'Just now',
        type: file.name.endsWith('.csv') || file.name.endsWith('.xlsx') ? 'spreadsheet' : 'document',
        content: typeof content === 'string' ? content : `[Binary File Content: ${file.name} - Size: ${file.size} bytes]`
      };

      // Add to state
      setDocuments(prev => [newDoc, ...prev]);

      // Telemetry
      await dispatchTelemetry({
        eventType: 'RECORD_MODIFY',
        resourceId: newDoc.path,
        action: 'CREATE',
        status: 'SUCCESS',
        metadata: {
          file_name: newDoc.name,
          classification: newDoc.classification,
          size_bytes: file.size,
          mime_type: file.type || 'application/octet-stream'
        }
      });

      // Show Ingestion Security Scan Modal
      setUploadNoticeModal({
        fileName: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        classification,
        timestamp: new Date().toLocaleTimeString()
      });

      showToast('Document Ingested', `File '${file.name}' scanned clean and added to your cloud repository.`, 'success');
    };

    if (file.name.match(/\.(txt|md|csv|json|js|html|py|sql|xml|log)$/i)) {
      reader.readAsText(file);
    } else {
      reader.readAsDataURL(file);
    }

    // Reset input
    e.target.value = '';
  };

  // 2. OPEN DOCUMENT IN EDITOR
  const handleOpenDoc = (doc) => {
    setSelectedDoc(doc);
    setFileContent(doc.content);
    setIsClassifiedBlurred(false);
    setActiveTab('editor');

    dispatchTelemetry({
      eventType: 'RECORD_VIEW',
      resourceId: doc.path,
      action: 'OPEN',
      status: 'SUCCESS',
      metadata: { classification: doc.classification }
    });

    showToast('Document Loaded', `Opened '${doc.name}' in secure in-browser editor.`, 'info');
  };

  // 3. SAVE DOCUMENT CHANGES
  const handleSaveDoc = async () => {
    if (!selectedDoc) return;

    // Persist changes in documents state
    const updatedDocs = documents.map(d => {
      if (d.id === selectedDoc.id) {
        return {
          ...d,
          content: fileContent,
          updated: 'Just now'
        };
      }
      return d;
    });
    setDocuments(updatedDocs);
    setSelectedDoc({ ...selectedDoc, content: fileContent, updated: 'Just now' });

    // Telemetry
    await dispatchTelemetry({
      eventType: 'RECORD_MODIFY',
      resourceId: selectedDoc.path,
      action: 'UPDATE',
      status: 'SUCCESS',
      metadata: {
        file_name: selectedDoc.name,
        classification: selectedDoc.classification,
        bytes_modified: fileContent.length
      }
    });

    setModalNotice({
      title: 'CHANGES SAVED & CRYPTOGRAPHICALLY SEALED',
      message: `Document '${selectedDoc.name}' updated successfully in the corporate repository. Version revision timestamped and sealed in SHA-256 audit log.`,
      type: 'success'
    });

    showToast('Changes Committed', `File '${selectedDoc.name}' revision saved to cloud drive.`, 'success');
  };

  // 4. COPY TEXT WITH DLP MONITORING
  const handleCopyText = async () => {
    if (!fileContent) return;

    try {
      await navigator.clipboard.writeText(fileContent);
    } catch {
      // fallback
    }

    await dispatchTelemetry({
      eventType: 'RECORD_VIEW',
      resourceId: selectedDoc ? selectedDoc.path : '/confidential/clipboard',
      action: 'COPY_TEXT',
      status: 'SUCCESS',
      metadata: {
        chars_copied: fileContent.length,
        classification: selectedDoc?.classification || 'RESTRICTED'
      }
    });

    showToast('DLP Clipboard Monitor', `${fileContent.length} characters copied to workstation clipboard. Monitored under Policy DLP-108.`, 'warning');
  };

  // 5. DOWNLOAD DOCUMENT FLOW (PRE-FLIGHT CONTROL -> REAL DOWNLOAD)
  const handleInitiateDownload = (doc) => {
    setDownloadModalDoc(doc);
  };

  const handleConfirmDownload = async () => {
    if (!downloadModalDoc) return;
    const doc = downloadModalDoc;
    setDownloadModalDoc(null);

    // Dispatch Telemetry
    await dispatchTelemetry({
      eventType: 'FILE_DOWNLOAD',
      resourceId: doc.path,
      action: 'DOWNLOAD',
      status: 'SUCCESS',
      metadata: { file_name: doc.name, size_mb: doc.size, classification: doc.classification }
    });

    // Real Browser Download Trigger
    const blob = new Blob([doc.content || 'Corporate Confidential File Content'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setModalNotice({
      title: 'FILE EXPORT APPROVED & DOWNLOADED',
      message: `Document '${doc.name}' (${doc.classification}) has been exported to your local computer disk. Transaction logged to SOC audit trail.`,
      type: 'success'
    });

    showToast('Download Completed', `Exported '${doc.name}' to workstation storage.`, 'success');
  };

  // 6. DELETE DOCUMENT FLOW (CONFIRMATION -> PERMANENT REMOVAL)
  const handleInitiateDelete = (doc) => {
    setDeleteModalDoc(doc);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalDoc) return;
    const doc = deleteModalDoc;
    setDeleteModalDoc(null);

    // Remove from state
    const remaining = documents.filter(d => d.id !== doc.id);
    setDocuments(remaining);

    if (selectedDoc?.id === doc.id) {
      setSelectedDoc(remaining[0] || null);
      setFileContent(remaining[0]?.content || '');
    }

    // Telemetry: FILE_DELETE / RECORD_MODIFY
    await dispatchTelemetry({
      eventType: 'RECORD_MODIFY',
      resourceId: doc.path,
      action: 'DELETE',
      status: 'SUCCESS',
      metadata: { file_name: doc.name, classification: doc.classification, reason: 'Employee manual archival' }
    });

    setModalNotice({
      title: 'CORPORATE ASSET PURGED',
      message: `File '${doc.name}' was permanently removed from the repository. Deletion transaction stamped in the immutable SOC audit log.`,
      type: 'denied'
    });

    showToast('Asset Purged', `Document '${doc.name}' deleted from repository.`, 'warning');
  };

  // 7. FILE SHARING SUBMISSION (INTERNAL COLLABORATION VS EXTERNAL EXFILTRATION)
  const handleShareSubmit = async (e) => {
    e.preventDefault();
    setSharingInProgress(true);

    const isExternal = recipientEmail.includes('@gmail.com') ||
                       recipientEmail.includes('@yahoo.com') ||
                       recipientEmail.includes('@competitor.com') ||
                       !recipientEmail.includes('@sentinel.local');

    if (isExternal) {
      // Blocked external transmission
      await dispatchTelemetry({
        eventType: 'FILE_SHARE_EXTERNAL',
        resourceId: `/sharing/${shareDocName}`,
        action: 'EXTERNAL_SHARE',
        status: 'FAILURE',
        metadata: {
          recipient: recipientEmail,
          permission: sharePermission,
          is_external: true,
          reason: 'Policy SEC-402 violation'
        }
      });

      // Add to shared ledger with BLOCKED status
      const blockedRecord = {
        id: `share-${Date.now()}`,
        docName: shareDocName,
        recipient: recipientEmail,
        permission: sharePermission,
        timestamp: 'Just now',
        status: 'BLOCKED (POLICY VIOLATION)'
      };
      setSharedLedger(prev => [blockedRecord, ...prev]);

      setModalNotice({
        title: '⚠️ SECURITY VIOLATION: EXTERNAL TRANSMISSION BLOCKED',
        message: `Transmission of classified asset '${shareDocName}' to unapproved external recipient (${recipientEmail}) was blocked by the boundary DLP filter under Policy SEC-402. Workstation threat score escalated and incident reported to SOC.`,
        type: 'denied'
      });

      showToast('Transmission Blocked', `Outbound sharing to '${recipientEmail}' denied under Policy SEC-402.`, 'error');
    } else {
      // Safe internal share
      await dispatchTelemetry({
        eventType: 'FILE_SHARE',
        resourceId: `/sharing/${shareDocName}`,
        action: 'INTERNAL_SHARE',
        status: 'SUCCESS',
        metadata: { recipient: recipientEmail, is_external: false, permission: sharePermission }
      });

      // Add to shared ledger with ACTIVE status
      const activeRecord = {
        id: `share-${Date.now()}`,
        docName: shareDocName,
        recipient: recipientEmail,
        permission: sharePermission,
        timestamp: 'Just now',
        status: 'ACTIVE'
      };
      setSharedLedger(prev => [activeRecord, ...prev]);

      setModalNotice({
        title: 'DOCUMENT SHARED INTERNALLY',
        message: `Internal access link generated and granted to colleague ${recipientEmail} with '${sharePermission}' privileges. Cryptographic token registered in IAM ledger.`,
        type: 'success'
      });

      showToast('Internal Share Granted', `Access token generated for ${recipientEmail}.`, 'success');
    }

    setSharingInProgress(false);
  };

  // Revoke Share Link
  const handleRevokeShare = async (shareId) => {
    setSharedLedger(prev => prev.filter(s => s.id !== shareId));
    showToast('Access Revoked', 'Collaboration link invalidated and permissions revoked.', 'info');
  };

  // 8. BULK RAPID EXFILTRATION SIMULATION (BURST 12 FILES)
  const handleBulkExfiltrate = async () => {
    setActionProgress({ message: 'Initiating Rapid Document Transfer...', percent: 5 });

    for (let i = 0; i < 12; i++) {
      const doc = documents[i % documents.length];
      await dispatchTelemetry({
        eventType: 'FILE_DOWNLOAD',
        resourceId: doc.path,
        action: 'DOWNLOAD',
        status: 'SUCCESS',
        metadata: { exfiltration_index: i + 1, burst: true }
      });

      setActionProgress({
        message: `Exporting Classified File [${i + 1}/12]: ${doc.name.slice(0, 28)}...`,
        percent: Math.round(((i + 1) / 12) * 100)
      });
      await new Promise(r => setTimeout(r, 180));
    }

    setActionProgress(null);
    setModalNotice({
      title: 'BULK TRANSFER COMPLETED (12 FILES EXPORTED)',
      message: '12 confidential documents exported in rapid succession. This burst pattern exceeds baseline velocity and triggers the Excessive Downloads detection rule in the SOC.',
      type: 'success'
    });

    showToast('Bulk Export Complete', '12 files exported in burst velocity. Threat score updated.', 'warning');
  };

  // 9. ESCROW LEDGER ACTIONS (UPDATE BALANCE & PURGE RECORD)
  const handleUpdateEscrowBalance = async (cust) => {
    const currentNum = parseInt(cust.balance.replace(/[^0-9]/g, ''), 10) || 1000000;
    const newBalance = `$${((currentNum + 250000) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    setEscrowLedger(prev => prev.map(c => c.id === cust.id ? { ...c, balance: newBalance } : c));

    await dispatchTelemetry({
      eventType: 'RECORD_MODIFY',
      resourceId: `/database/customer_accounts/${cust.id}`,
      action: 'UPDATE',
      status: 'SUCCESS',
      metadata: { record_id: cust.id, balance: newBalance }
    });

    setModalNotice({
      title: 'ESCROW LEDGER RECORD COMMITTED',
      message: `Balance for ${cust.name} (${cust.id}) updated to ${newBalance}. Transaction sealed in cryptographic audit log.`,
      type: 'success'
    });

    showToast('Ledger Updated', `Account ${cust.id} balance modified.`, 'info');
  };

  const handlePurgeEscrowRecord = async (cust) => {
    setEscrowLedger(prev => prev.filter(c => c.id !== cust.id));

    await dispatchTelemetry({
      eventType: 'RECORD_MODIFY',
      resourceId: `/database/customer_accounts/${cust.id}`,
      action: 'DELETE',
      status: 'SUCCESS',
      metadata: { record_id: cust.id, reason: 'Unauthorized manual purge' }
    });

    setModalNotice({
      title: 'LEDGER RECORD PURGED FROM DATABASE',
      message: `Record ${cust.id} (${cust.name}) deleted from the active banking ledger. Evaluated by Sabotage & Record Modification Spike detection rule.`,
      type: 'denied'
    });

    showToast('Record Purged', `Account ${cust.id} purged from banking database.`, 'warning');
  };

  // 10. RESTRICTED VAULTS (403 ACCESS DENIED LAB)
  const handleProbeVault = async (vault) => {
    await dispatchTelemetry({
      eventType: 'ACCESS_DENIED',
      resourceId: vault.uri,
      action: 'READ',
      status: 'FAILURE',
      metadata: { attempted_resource: vault.name, required_level: vault.level }
    });

    setAccessDeniedModal({
      vaultName: vault.name,
      uri: vault.uri,
      level: vault.level,
      timestamp: new Date().toLocaleTimeString()
    });

    showToast('Access Denied', `403 Forbidden: Insufficient clearance for '${vault.name}'.`, 'error');
  };

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col font-sans select-none">
      {/* Hidden File Input for Real PC Document Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        accept=".txt,.pdf,.csv,.xlsx,.doc,.docx,.json,.md,.pem,.sql"
      />

      {/* Top Corporate Enterprise Header */}
      <header className="h-16 border-b border-slate-800 bg-[#0c1222] px-6 flex items-center justify-between sticky top-0 z-40 shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm tracking-wide text-white font-mono">APEX GLOBAL ENTERPRISES</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
                EMPLOYEE INTRANET
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Workstation ID: <span className="font-mono text-cyan-400">WS-CORP-FIN-0842</span> • Subnet: <span className="font-mono text-slate-300">192.168.1.100</span>
            </p>
          </div>
        </div>

        {/* User Badge, Quick Jump to SOC, & Logout */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500 hover:text-black text-xs font-semibold font-mono transition-all"
            title="Inspect in Security Operations Center"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Open SOC Dashboard</span>
          </button>

          <div className="flex items-center space-x-3 pl-3 border-l border-slate-800">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow">
              {authUser?.full_name ? authUser.full_name.slice(0, 2).toUpperCase() : 'SC'}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-white leading-tight">{authUser?.full_name || 'Sarah Chen'}</p>
              <p className="text-[10px] text-slate-400 font-mono">{authUser?.department || 'Finance & Accounting'}</p>
            </div>
            <button
              onClick={() => navigate('/company/login')}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-mono transition-colors"
            >
              Switch User
            </button>
          </div>
        </div>
      </header>

      {/* Compliance / Suspicious Activity Warning Banner */}
      {complianceWarning && (
        <div className="bg-red-950/80 border-b border-red-500/40 px-6 py-2.5 text-xs text-red-300 flex items-center justify-between animate-pulse">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span className="font-bold font-mono">SECURITY WARNING:</span>
            <span>{complianceWarning.message}</span>
          </div>
          <button
            onClick={() => setComplianceWarning(null)}
            className="text-slate-400 hover:text-white font-mono text-[11px]"
          >
            ✕ Dismiss Warning
          </button>
        </div>
      )}

      {/* Live Threat Telemetry Floating Dock */}
      <div className="bg-slate-900/95 border-b border-slate-800 px-6 py-2 flex flex-wrap items-center justify-between text-xs gap-3">
        <div className="flex items-center space-x-4">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Live Session Risk:</span>
          <RiskGauge score={currentScore} size="sm" />
          <SeverityBadge severity={riskSeverity} />
        </div>

        <div className="flex items-center space-x-3 text-[11px] font-mono">
          <span className="text-slate-400">DLP Protection:</span>
          <span className="text-emerald-400 font-semibold flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Anti-Screen Capture Active</span>
          </span>
          {lastTelemetry && (
            <span className="hidden lg:inline text-slate-500 border-l border-slate-800 pl-3">
              Last Telemetry: <span className="text-cyan-400">{lastTelemetry.event_type}</span> ({lastTelemetry.timestamp})
            </span>
          )}
        </div>
      </div>

      {/* Main Workspace Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sub-Navigation Sidebar */}
        <aside className="w-64 border-r border-slate-800 bg-[#0a0f1d] p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2 font-mono">
              Workstation Navigation
            </p>

            <button
              onClick={() => setActiveTab('drive')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'drive'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FolderLock className="w-4 h-4 shrink-0" />
              <span>Document Repository ({documents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('editor')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'editor'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0" />
              <span>Document Editor & Workbench</span>
            </button>

            <button
              onClick={() => setActiveTab('share')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'share'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span>File Sharing & Transfers ({sharedLedger.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'ledger'
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Database className="w-4 h-4 shrink-0" />
              <span>Core Banking Escrow Ledgers</span>
            </button>

            <button
              onClick={() => setActiveTab('vault')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'vault'
                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Lock className="w-4 h-4 shrink-0" />
              <span>Restricted Clearance Vaults</span>
            </button>
          </div>

          {/* Anti-Screen Capture DLP Helper Card */}
          <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-[11px] space-y-2">
            <div className="flex items-center space-x-1.5 text-blue-400 font-bold font-mono">
              <Camera className="w-4 h-4" />
              <span>DLP Screen Shield:</span>
            </div>
            <p className="text-slate-400 text-[10px] leading-relaxed">
              Screen captures are restricted. Press <span className="font-mono text-cyan-400 font-bold">PrintScreen</span>, <span className="font-mono text-cyan-400 font-bold">Ctrl+P</span>, or use the button below to test interception.
            </p>
            <button
              onClick={() => triggerDlpScreenshotAlert('Manual Test Button Click')}
              className="w-full py-1 bg-red-600/20 hover:bg-red-600 hover:text-white border border-red-500/30 text-red-300 rounded font-semibold text-[10px] transition-colors"
            >
              📸 Simulate Taking Screenshot
            </button>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Progress Bar for Bulk Exfiltration */}
          {actionProgress && (
            <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-2 animate-pulse">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-cyan-400 font-bold flex items-center space-x-2">
                  <Zap className="w-4 h-4 animate-bounce text-cyan-400" />
                  <span>{actionProgress.message}</span>
                </span>
                <span className="text-white font-bold">{actionProgress.percent}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-amber-500 to-red-500 transition-all duration-200"
                  style={{ width: `${actionProgress.percent}%` }}
                />
              </div>
            </div>
          )}

          {/* TAB 1: Document Repository */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-base font-bold font-mono text-white flex items-center space-x-2">
                    <FolderLock className="w-5 h-5 text-blue-400" />
                    <span>CORPORATE CLOUD DOCUMENT REPOSITORY</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Select any file to inspect, edit in-browser, download, or share. Upload your own real files from your PC.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition-all flex items-center space-x-1.5 shadow-lg shadow-blue-600/20"
                    title="Upload real document from your computer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Local File</span>
                  </button>

                  <button
                    onClick={handleBulkExfiltrate}
                    className="px-3.5 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-bold rounded-lg text-xs transition-all flex items-center space-x-1.5 shadow-lg shadow-red-600/30"
                  >
                    <Flame className="w-3.5 h-3.5 animate-pulse" />
                    <span>Simulate Rapid Bulk Exfiltration (12 Files)</span>
                  </button>
                </div>
              </div>

              <div className="soc-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-3 px-4">Document Title</th>
                        <th className="py-3 px-4">Classification</th>
                        <th className="py-3 px-4">Size</th>
                        <th className="py-3 px-4">Last Modified</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80 font-sans">
                      {documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-slate-900/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white flex items-center space-x-1.5">
                              <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span>{doc.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-mono ml-5">{doc.path}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                              doc.classification === 'TOP SECRET' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                              doc.classification === 'RESTRICTED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                              doc.classification === 'INTERNAL' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40' :
                              'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}>
                              {doc.classification}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">{doc.size} MB</td>
                          <td className="py-3 px-4 text-slate-400">{doc.updated}</td>
                          <td className="py-3 px-4 text-right space-x-1.5">
                            <button
                              onClick={() => handleOpenDoc(doc)}
                              className="px-2.5 py-1 bg-blue-600/20 hover:bg-blue-600 hover:text-white border border-blue-500/40 text-blue-300 rounded text-[11px] font-semibold transition-colors"
                            >
                              Open & Edit
                            </button>
                            <button
                              onClick={() => handleInitiateDownload(doc)}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-500 hover:text-black rounded text-[11px] font-semibold text-slate-300 transition-colors"
                            >
                              Download
                            </button>
                            <button
                              onClick={() => {
                                setShareDocName(doc.name);
                                setActiveTab('share');
                              }}
                              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-[11px] transition-colors"
                            >
                              Share
                            </button>
                            <button
                              onClick={() => handleInitiateDelete(doc)}
                              className="px-2 py-1 bg-red-950/30 hover:bg-red-600 hover:text-white text-red-400 rounded text-[11px] transition-colors"
                              title="Delete Document (Monitored for Sabotage)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Live In-Browser Document Editor (With Real DLP Screen Shield) */}
          {activeTab === 'editor' && selectedDoc && (
            <div className="soc-card p-6 border-slate-800 space-y-4 relative">
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  <div>
                    <h2 className="text-base font-bold text-white font-mono">{selectedDoc.name}</h2>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono text-cyan-400">{selectedDoc.path}</span>
                      <span>•</span>
                      <span className="font-mono font-bold text-amber-400">{selectedDoc.classification}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleCopyText}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                    title="Copy text to clipboard with DLP tracking"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Text</span>
                  </button>

                  <button
                    onClick={() => setIsClassifiedBlurred(!isClassifiedBlurred)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  >
                    {isClassifiedBlurred ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>{isClassifiedBlurred ? 'Unblur Preview' : 'Privacy Blur'}</span>
                  </button>

                  <button
                    onClick={() => handleInitiateDownload(selectedDoc)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>

                  <button
                    onClick={handleSaveDoc}
                    className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs flex items-center space-x-1.5 transition-colors shadow-lg shadow-cyan-500/25"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save & Commit Changes</span>
                  </button>
                </div>
              </div>

              {/* Editor Workspace Container with Dynamic Watermarking */}
              <div className="relative rounded-xl border border-slate-800 overflow-hidden bg-slate-950">
                {/* Forensic Dynamic Watermark Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-10 rotate-[-25deg] select-none z-10 text-center font-mono">
                  <div className="text-2xl sm:text-3xl font-extrabold text-red-500 tracking-widest leading-loose">
                    CONFIDENTIAL • APEX ENTERPRISE<br />
                    USER: {authUser?.email || 'SARAH.CHEN@SENTINEL.LOCAL'} [FIN-104]<br />
                    IP: 192.168.1.100 • WS-FIN-0842 • UNAUTHORIZED CAPTURE FORBIDDEN
                  </div>
                </div>

                {/* Privacy Blur Overlay if triggered */}
                {isClassifiedBlurred && (
                  <div className="absolute inset-0 bg-black/85 backdrop-blur-2xl z-20 flex flex-col items-center justify-center p-6 text-center">
                    <ShieldAlert className="w-12 h-12 text-red-400 mb-2 animate-pulse" />
                    <h3 className="font-mono font-bold text-base text-white">CLASSIFIED DOCUMENT VIEW BLURRED</h3>
                    <p className="text-xs text-slate-400 max-w-md mt-1">
                      Data Loss Prevention (DLP) safeguard activated. Document obscured to prevent unauthorized visual inspection or screenshot capture.
                    </p>
                    <button
                      onClick={() => setIsClassifiedBlurred(false)}
                      className="mt-4 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
                    >
                      Authenticate to View Clear Document
                    </button>
                  </div>
                )}

                {/* In-Browser Editable Textarea */}
                <textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  rows="14"
                  className="w-full p-4 bg-transparent text-xs text-cyan-200 font-mono focus:outline-none focus:ring-0 leading-relaxed resize-y relative z-0"
                  placeholder="Edit corporate document contents here..."
                />
              </div>

              <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Modifying this file and clicking 'Save Changes' triggers real-time RECORD_MODIFY telemetry.</span>
                <span>Encoding: UTF-8 • Characters: {fileContent.length}</span>
              </div>
            </div>
          )}

          {/* TAB 3: File Sharing & Live Shared Documents Ledger */}
          {activeTab === 'share' && (
            <div className="space-y-6">
              <div className="max-w-2xl mx-auto soc-card p-6 border-slate-800 space-y-5">
                <div className="pb-3 border-b border-slate-800">
                  <h2 className="text-base font-bold font-mono text-white flex items-center space-x-2">
                    <Share2 className="w-5 h-5 text-blue-400" />
                    <span>SECURE FILE TRANSMISSION & COLLABORATION</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Distribute internal files to colleagues. Transmissions to non-corporate domains are audited.
                  </p>
                </div>

                <form onSubmit={handleShareSubmit} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Select Document to Share</label>
                    <select
                      value={shareDocName}
                      onChange={(e) => setShareDocName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500 font-mono"
                    >
                      {documents.map(d => (
                        <option key={d.id} value={d.name}>
                          {d.name} [{d.classification}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">
                      Recipient Email Address (Test internal @sentinel.local vs external @gmail.com)
                    </label>
                    <input
                      type="email"
                      required
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="colleague@sentinel.local or external@gmail.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                    <div className="mt-1 flex items-center space-x-2 text-[10px]">
                      <span className="text-slate-500">Quick Test Domains:</span>
                      <button
                        type="button"
                        onClick={() => setRecipientEmail('external.leak@gmail.com')}
                        className="text-red-400 hover:underline font-mono"
                      >
                        [External: @gmail.com]
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientEmail('competitor.intel@competitor.com')}
                        className="text-red-400 hover:underline font-mono"
                      >
                        [Competitor: @competitor.com]
                      </button>
                      <button
                        type="button"
                        onClick={() => setRecipientEmail('alex.rivera@sentinel.local')}
                        className="text-emerald-400 hover:underline font-mono"
                      >
                        [Internal: @sentinel.local]
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Access Permissions</label>
                    <select
                      value={sharePermission}
                      onChange={(e) => setSharePermission(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="View Only">View Only (Restricted Download)</option>
                      <option value="Full Edit">Full Edit (Read & Modify)</option>
                      <option value="Executive Review">Executive Review (Audit Tracked)</option>
                    </select>
                  </div>

                  <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-[11px] text-slate-400">
                    <span className="font-bold text-amber-400 font-mono block mb-1">⚠️ Policy Enforcement Note:</span>
                    Transmitting RESTRICTED or TOP SECRET files to unapproved email domains violates RULE_EXTERNAL_FILE_SHARE and dispatches a Critical security alert.
                  </div>

                  <button
                    type="submit"
                    disabled={sharingInProgress}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center justify-center space-x-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>{sharingInProgress ? 'Transmitting...' : 'Dispatch Document Transmission'}</span>
                  </button>
                </form>
              </div>

              {/* Active Shared Documents Ledger */}
              <div className="soc-card p-5 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <h3 className="text-xs font-bold font-mono text-white flex items-center space-x-2">
                    <Share2 className="w-4 h-4 text-cyan-400" />
                    <span>ACTIVE SHARED DOCUMENTS & TRANSMISSIONS LEDGER</span>
                  </h3>
                  <span className="text-[11px] text-slate-400 font-mono">{sharedLedger.length} Records</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                      <tr>
                        <th className="py-2 px-3">Document</th>
                        <th className="py-2 px-3">Recipient Email</th>
                        <th className="py-2 px-3">Privilege</th>
                        <th className="py-2 px-3">Timestamp</th>
                        <th className="py-2 px-3">Status</th>
                        <th className="py-2 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-sans">
                      {sharedLedger.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-900/50">
                          <td className="py-2.5 px-3 font-semibold text-white">{s.docName}</td>
                          <td className="py-2.5 px-3 font-mono text-cyan-300">{s.recipient}</td>
                          <td className="py-2.5 px-3 text-slate-400">{s.permission}</td>
                          <td className="py-2.5 px-3 text-slate-500">{s.timestamp}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                              s.status.includes('BLOCKED')
                                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            }`}>
                              {s.status}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            {s.status === 'ACTIVE' && (
                              <button
                                onClick={() => handleRevokeShare(s.id)}
                                className="px-2 py-1 bg-slate-800 hover:bg-red-600 hover:text-white rounded text-[10px] text-slate-400 transition-colors"
                              >
                                Revoke
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Banking Ledgers & Customer Records (Sabotage Simulation) */}
          {activeTab === 'ledger' && (
            <div className="soc-card p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
                <div>
                  <h2 className="text-sm font-bold font-mono text-white flex items-center space-x-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>CORE ESCROW BANKING BALANCES & CUSTOMER DATABASE</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Live transactional ledger records. Modify or test mass record deletion sabotage.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Account ID</th>
                      <th className="py-2.5 px-3">Corporate Client</th>
                      <th className="py-2.5 px-3">Escrow Balance</th>
                      <th className="py-2.5 px-3">SWIFT Route</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-sans">
                    {escrowLedger.map((cust) => (
                      <tr key={cust.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-cyan-400 font-bold">{cust.id}</td>
                        <td className="py-2.5 px-3 font-semibold text-white">{cust.name}</td>
                        <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">{cust.balance}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">{cust.swift}</td>
                        <td className="py-2.5 px-3 text-right space-x-2">
                          <button
                            onClick={() => handleUpdateEscrowBalance(cust)}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] transition-colors"
                          >
                            Update Balance
                          </button>
                          <button
                            onClick={() => handlePurgeEscrowRecord(cust)}
                            className="px-2.5 py-1 bg-red-950/40 hover:bg-red-600 hover:text-white border border-red-500/30 text-red-300 rounded text-[11px] transition-colors"
                          >
                            Purge Record
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: Restricted Clearance Vaults (403 Probe Lab) */}
          {activeTab === 'vault' && (
            <div className="soc-card p-6 border-red-500/30 space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h2 className="text-base font-bold font-mono text-white flex items-center space-x-2">
                  <Lock className="w-5 h-5 text-red-400" />
                  <span>RESTRICTED CLEARANCE VAULTS (403 ACCESS DENIED LAB)</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  High-security corporate endpoints requiring Level-5 clearance. Attempting access generates real-time reconnaissance alerts.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'HSM Cryptographic Root Keys', uri: '/admin/hsm-master-keys', level: 'Clearance L-5 Mandated' },
                  { name: 'Executive Payroll & Board Bonuses', uri: '/payroll/executive-bonuses', level: 'Board Members Only' },
                  { name: 'System Root Audit Purge Terminal', uri: '/root/system-audit-purge', level: 'Superadmin Clearance' },
                  { name: 'Biometric Hash Database Staging', uri: '/vault/biometric-hashes', level: 'SecOps Clearance' }
                ].map((vault, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-red-500/50 transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-2">
                        <Lock className="w-3.5 h-3.5 text-red-400" />
                        <span>{vault.name}</span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{vault.uri}</div>
                      <span className="text-[10px] text-amber-400 font-mono block mt-1">{vault.level}</span>
                    </div>

                    <button
                      onClick={() => handleProbeVault(vault)}
                      className="px-3 py-1.5 bg-red-950/40 hover:bg-red-600 hover:text-white border border-red-500/30 text-red-300 rounded text-xs font-semibold transition-colors"
                    >
                      Probe
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* MODAL 1: PRE-FLIGHT EXPORT APPROVAL MODAL (Before Download) */}
      {downloadModalDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full soc-card p-6 border-blue-500/50 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800">
              <Download className="w-6 h-6 text-blue-400" />
              <div>
                <h3 className="font-bold font-mono text-sm text-white">CORPORATE DATA EXPORT CONTROL (DLP-204)</h3>
                <span className="text-[10px] text-slate-400 font-mono">Workstation Download Authorization</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are preparing to export the following asset to workstation disk <span className="text-cyan-400 font-mono">WS-CORP-FIN-0842</span>:
            </p>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono space-y-1">
              <div>• File Name: <span className="text-white font-semibold">{downloadModalDoc.name}</span></div>
              <div>• Classification: <span className="text-amber-400 font-bold">{downloadModalDoc.classification}</span></div>
              <div>• Size: <span className="text-slate-400">{downloadModalDoc.size} MB</span></div>
              <div>• Subject: <span className="text-cyan-400">{authUser?.email || 'sarah.chen@sentinel.local'}</span></div>
            </div>

            <p className="text-[11px] text-slate-400 italic">
              Notice: Exporting classified assets triggers an immutable FILE_DOWNLOAD event chained into the SHA-256 audit ledger.
            </p>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDownloadModalDoc(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Cancel Export
              </button>
              <button
                onClick={handleConfirmDownload}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-600/30 flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Approve & Download Now</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM PERMANENT ASSET DELETION MODAL */}
      {deleteModalDoc && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full soc-card p-6 border-red-500/50 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800 text-red-400">
              <Trash2 className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="font-bold font-mono text-sm text-white">CONFIRM PERMANENT ASSET DELETION</h3>
                <span className="text-[10px] text-red-400 font-mono">Monitored for Insider Sabotage</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete <span className="font-mono text-white font-bold">'{deleteModalDoc.name}'</span>?
            </p>

            <div className="p-3 bg-red-950/40 rounded-lg border border-red-500/30 text-xs font-mono space-y-1 text-slate-300">
              <div>• Target: {deleteModalDoc.path}</div>
              <div>• Classification: {deleteModalDoc.classification}</div>
              <div>• Auditor: SOC Detection Rule 'RULE_RECORD_MODIFICATION_SPIKE'</div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDeleteModalDoc(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center space-x-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm & Delete Asset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: FILE UPLOAD SCAN & INGESTION MODAL */}
      {uploadNoticeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full soc-card p-6 border-emerald-500/50 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-800 text-emerald-400">
              <FileCheck2 className="w-6 h-6 text-emerald-400" />
              <div>
                <h3 className="font-bold font-mono text-sm text-white">FILE INGESTION & ANTIVIRUS SCAN PASSED</h3>
                <span className="text-[10px] text-emerald-400 font-mono">Policy SEC-109 Corporate Ingestion</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Your local file has been sanitized, indexed, and ingested into the corporate cloud document repository:
            </p>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
              <div>• File Name: <span className="text-white font-semibold">{uploadNoticeModal.fileName}</span></div>
              <div>• Size: <span className="text-slate-400">{uploadNoticeModal.size}</span></div>
              <div>• Assigned Classification: <span className="text-blue-400 font-bold">{uploadNoticeModal.classification}</span></div>
              <div>• Antivirus Status: <span className="text-emerald-400 font-bold">100% CLEAN (0 Threats)</span></div>
              <div>• Timestamp: {uploadNoticeModal.timestamp}</div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setUploadNoticeModal(null)}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Acknowledge & Access File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: 403 ACCESS DENIED MODAL */}
      {accessDeniedModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full soc-card p-6 border-red-500 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-red-500/30 text-red-400">
              <Lock className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="font-bold font-mono text-sm text-white">403 FORBIDDEN: INSUFFICIENT CLEARANCE</h3>
                <span className="text-[10px] text-red-400 font-mono">Restricted Endpoint Probing Intercept</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Access to <span className="text-white font-mono font-bold">'{accessDeniedModal.vaultName}'</span> (<span className="text-cyan-400 font-mono">{accessDeniedModal.uri}</span>) was rejected.
            </p>

            <div className="p-3 bg-red-950/40 rounded-lg border border-red-500/30 text-xs font-mono space-y-1 text-slate-300">
              <div>• Required Clearance: <span className="text-amber-400 font-bold">{accessDeniedModal.level}</span></div>
              <div>• Your Workstation Clearance: <span className="text-red-400 font-bold">Level-2 (Standard Analyst)</span></div>
              <div>• Result: ACCESS_DENIED telemetry dispatched to SOC</div>
              <div>• Timestamp: {accessDeniedModal.timestamp}</div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => setAccessDeniedModal(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Dismiss Notice
              </button>
              <button
                onClick={() => {
                  setAccessDeniedModal(null);
                  navigate('/');
                }}
                className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs"
              >
                Inspect in SOC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DLP VIOLATION POPUP (When screenshot is attempted) */}
      {dlpWarning && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full soc-card p-6 border-red-500 shadow-2xl shadow-red-500/30 animate-bounce-once">
            <div className="flex items-center space-x-3 text-red-400 mb-3 pb-3 border-b border-red-500/30">
              <AlertOctagon className="w-8 h-8 shrink-0 animate-pulse text-red-500" />
              <div>
                <h3 className="font-bold font-mono text-sm text-white">DATA LOSS PREVENTION (DLP) VIOLATION</h3>
                <span className="text-[10px] text-red-400 font-mono">Policy SEC-402 Screen Capture Intercept</span>
              </div>
            </div>

            <p className="text-xs text-slate-200 leading-relaxed">
              An unauthorized screen capture attempt (<span className="font-mono text-amber-400 font-bold">{dlpWarning.trigger}</span>) was detected on confidential asset <span className="font-mono text-white">'{dlpWarning.docName}'</span>.
            </p>

            <div className="mt-4 p-3 bg-red-950/40 border border-red-500/20 rounded-lg text-[11px] font-mono text-slate-300 space-y-1">
              <div>• Timestamp: {dlpWarning.timestamp}</div>
              <div>• Workstation: WS-CORP-FIN-0842 (192.168.1.100)</div>
              <div>• Subject: {authUser?.email || 'sarah.chen@sentinel.local'}</div>
              <div>• Action: Telemetry chained into immutable audit log</div>
            </div>

            <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-800">
              <button
                onClick={() => setDlpWarning(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
              >
                Acknowledge Violation
              </button>
              <button
                onClick={() => {
                  setDlpWarning(null);
                  navigate('/');
                }}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30"
              >
                Inspect Alert in SOC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: GENERAL INTERACTION MODAL */}
      {modalNotice && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`max-w-md w-full soc-card p-6 border-l-4 ${
            modalNotice.type === 'denied' ? 'border-l-red-500 border-red-500/40' : 'border-l-emerald-500 border-emerald-500/40'
          }`}>
            <div className="flex items-center space-x-3 mb-2">
              {modalNotice.type === 'denied' ? (
                <XCircle className="w-6 h-6 text-red-400 shrink-0" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              )}
              <h3 className="font-bold font-mono text-sm text-white">{modalNotice.title}</h3>
            </div>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">{modalNotice.message}</p>

            <div className="mt-5 flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-[10px] text-slate-500 font-mono">SOC Telemetry Chained</span>
              <div className="space-x-2">
                <button
                  onClick={() => setModalNotice(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => {
                    setModalNotice(null);
                    navigate('/');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs transition-colors"
                >
                  Inspect in SOC
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FLOATING TOAST NOTIFICATION STACK */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-slide-up">
          <div className={`p-4 rounded-xl border shadow-2xl flex items-start space-x-3 ${
            toastNotification.type === 'error'
              ? 'bg-red-950/90 border-red-500/50 text-red-200'
              : toastNotification.type === 'warning'
              ? 'bg-amber-950/90 border-amber-500/50 text-amber-200'
              : toastNotification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
              : 'bg-slate-900/90 border-blue-500/50 text-slate-200'
          }`}>
            {toastNotification.type === 'error' ? (
              <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            ) : toastNotification.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            ) : toastNotification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="font-bold font-mono text-xs text-white">{toastNotification.title}</h4>
              <p className="text-[11px] mt-0.5 leading-relaxed">{toastNotification.message}</p>
            </div>
            <button
              onClick={() => setToastNotification(null)}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
