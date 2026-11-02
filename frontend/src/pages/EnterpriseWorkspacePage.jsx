import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import SeverityBadge from '../components/SeverityBadge';
import RiskGauge from '../components/RiskGauge';
import {
  Building2,
  FileText,
  Download,
  AlertTriangle,
  ShieldAlert,
  Database,
  Lock,
  ExternalLink,
  Flame,
  CheckCircle2,
  XCircle,
  Terminal,
  ArrowRight,
  Eye,
  RefreshCw,
  FolderLock,
  UserCheck,
  Zap,
  Server
} from 'lucide-react';

export default function EnterpriseWorkspacePage() {
  const navigate = useNavigate();
  const { user: authUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [activeSubject, setActiveSubject] = useState(null);
  const [currentScore, setCurrentScore] = useState(12.0);
  const [riskSeverity, setRiskSeverity] = useState('Low');
  const [lastTelemetry, setLastTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionProgress, setActionProgress] = useState(null); // { message, percent }
  const [modalNotice, setModalNotice] = useState(null); // { title, message, type: 'denied' | 'success' }

  // Initial load
  useEffect(() => {
    async function loadDirectory() {
      try {
        const res = await ApiClient.getUsers();
        const list = res.users || [];
        setUsers(list);
        if (list.length > 0) {
          // Default to Sarah Chen (Finance) for high impact demo, or first user
          const defaultUser = list.find(u => u.employee_code === 'FIN-104') || list[0];
          setActiveSubject(defaultUser);
          setCurrentScore(defaultUser.current_risk_score || 8.5);
          setRiskSeverity(defaultUser.risk_level || 'Low');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDirectory();
  }, []);

  const handleSubjectChange = (userId) => {
    const selected = users.find(u => u.user_id === userId);
    if (selected) {
      setActiveSubject(selected);
      setCurrentScore(selected.current_risk_score || 10.0);
      setRiskSeverity(selected.risk_level || 'Low');
    }
  };

  // Generic Telemetry Event Trigger
  const recordEnterpriseEvent = async (eventData) => {
    if (!activeSubject) return null;
    try {
      const res = await ApiClient.recordActivity({
        userId: activeSubject.user_id,
        userEmail: activeSubject.email,
        ...eventData
      });

      // Update HUD in real time
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
      }

      return res;
    } catch (err) {
      console.error('Telemetry dispatch error:', err);
      return null;
    }
  };

  // 1. Download Single File
  const handleDownloadFile = async (doc) => {
    const res = await recordEnterpriseEvent({
      eventType: 'FILE_DOWNLOAD',
      resourceId: doc.path,
      action: 'DOWNLOAD',
      status: 'SUCCESS',
      metadata: { file_name: doc.name, classification: doc.classification, size_mb: doc.size }
    });

    setModalNotice({
      title: 'FILE DOWNLOAD COMPLETED',
      message: `Successfully transferred '${doc.name}' (${doc.size} MB) to local workstation storage.`,
      type: 'success'
    });
  };

  // 2. Simulate Rapid Exfiltration Burst (15 downloads in fast succession)
  const handleExfiltrationBurst = async () => {
    const secretFiles = [
      '/confidential/q4_merger_financials.xlsx',
      '/confidential/executive_compensation_2026.pdf',
      '/confidential/customer_credit_cards_pii.csv',
      '/confidential/source_code_master_key.zip',
      '/confidential/client_acquisitions_q3.docx',
      '/confidential/bank_swift_wire_credentials.json',
      '/confidential/internal_whistleblower_audit.pdf',
      '/confidential/patent_defense_strategy.docx'
    ];

    setActionProgress({ message: 'Initiating Rapid High-Volume Exfiltration...', percent: 10 });

    for (let i = 0; i < 12; i++) {
      const file = secretFiles[i % secretFiles.length];
      await recordEnterpriseEvent({
        eventType: 'FILE_DOWNLOAD',
        resourceId: file,
        action: 'DOWNLOAD',
        status: 'SUCCESS',
        metadata: { exfiltration_index: i + 1, burst: true }
      });
      setActionProgress({
        message: `Exfiltrating Document [${i + 1}/12]: ${file}`,
        percent: Math.round(((i + 1) / 12) * 100)
      });
      // Small pause for dramatic visual presentation
      await new Promise(r => setTimeout(r, 200));
    }

    setActionProgress(null);
    setModalNotice({
      title: 'BULK FILE TRANSFER COMPLETED',
      message: '12 confidential documents exported to local staging directory. Dynamic Risk Engine has evaluated telemetry.',
      type: 'success'
    });
  };

  // 3. Probing Restricted Endpoint (403 ACCESS DENIED)
  const handleAccessRestricted = async (endpointName, endpointUri) => {
    await recordEnterpriseEvent({
      eventType: 'ACCESS_DENIED',
      resourceId: endpointUri,
      action: 'READ',
      status: 'FAILURE',
      metadata: { attempted_resource: endpointName, required_clearance: 'LEVEL-5 TOP SECRET' }
    });

    setModalNotice({
      title: '403 ACCESS DENIED: RESTRICTED RESOURCE',
      message: `Access to '${endpointName}' (${endpointUri}) was blocked by Corporate Boundary Controller. Security clearance insufficient. Telemetry dispatched to SOC audit ledger.`,
      type: 'denied'
    });
  };

  // 4. Mass Database Modification Burst
  const handleMassModifyBurst = async () => {
    setActionProgress({ message: 'Executing Database Transaction Burst...', percent: 15 });

    for (let i = 0; i < 15; i++) {
      await recordEnterpriseEvent({
        eventType: 'RECORD_MODIFY',
        resourceId: `/database/customer_accounts/${8000 + i}`,
        action: 'DELETE',
        status: 'SUCCESS',
        metadata: { record_id: 8000 + i, table: 'customer_balances', operation: 'PURGE' }
      });
      setActionProgress({
        message: `Purging / Altering Database Record ID #${8000 + i}`,
        percent: Math.round(((i + 1) / 15) * 100)
      });
      await new Promise(r => setTimeout(r, 150));
    }

    setActionProgress(null);
    setModalNotice({
      title: 'DATABASE MASS MODIFICATION EXECUTED',
      message: '15 database ledger records altered or deleted. Sabotage detection rule triggered.',
      type: 'success'
    });
  };

  const corporateDocuments = [
    { name: 'Apex Company Policy & Ethics 2026.pdf', path: '/public/policy_2026.pdf', classification: 'PUBLIC', size: '1.4' },
    { name: 'Enterprise Cloud Architecture Standards.docx', path: '/internal/cloud_standards.docx', classification: 'INTERNAL', size: '4.8' },
    { name: 'Confidential M&A Merger Term Sheet ($240M).xlsx', path: '/confidential/m&a_term_sheet_240m.xlsx', classification: 'RESTRICTED', size: '18.5' },
    { name: 'Executive Compensation & Bonus Matrix.pdf', path: '/confidential/executive_compensation_master.pdf', classification: 'TOP SECRET', size: '12.2' },
    { name: 'Core Customer Financial Ledgers Q3.csv', path: '/financials/customer_ledger_q3.csv', classification: 'RESTRICTED', size: '64.8' },
    { name: 'Production Vault HSM Cryptographic Keys.pem', path: '/vault/prod_hsm_master_key.pem', classification: 'TOP SECRET', size: '0.8' }
  ];

  const customerRecords = [
    { id: 'CUST-8021', name: 'Acme International Conglomerate', balance: '$4,250,000.00', status: 'Active' },
    { id: 'CUST-8022', name: 'Global Logistics Partners', balance: '$1,840,500.00', status: 'Active' },
    { id: 'CUST-8023', name: 'Starlight Bio-Pharmaceuticals', balance: '$9,300,200.00', status: 'Audited' },
    { id: 'CUST-8024', name: 'Nexus Distributed Networks', balance: '$2,150,000.00', status: 'Active' }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Presentation Mode Top Switcher Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/80 via-indigo-950/80 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm text-white font-mono uppercase tracking-wide">
                APEX GLOBAL ENTERPRISES • EMPLOYEE INTRANET PORTAL
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">
                LIVE DEMO WORKSPACE
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Simulate legitimate and malicious employee activity here. The UBA Sentinel SOC detects threats in real time.
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-lg text-xs flex items-center space-x-2 transition-all shadow-lg shadow-cyan-500/25 shrink-0"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Switch to Security Operations Center (SOC)</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Workstation & Subject Configuration Bar */}
      <div className="soc-card p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-3">
          <Server className="w-4 h-4 text-cyan-400" />
          <div className="font-mono text-slate-300">
            <span className="text-slate-500">Workstation ID: </span>
            <span className="text-white font-bold">WS-CORP-FIN-0842</span>
            <span className="text-slate-500 ml-3">Subnet IP: </span>
            <span className="text-cyan-400 font-bold">192.168.1.100 (Internal Corporate)</span>
          </div>
        </div>

        {/* Test Subject Selector */}
        {users.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-slate-400 font-mono font-medium">Logged-in Employee Subject:</span>
            <select
              value={activeSubject?.user_id || ''}
              onChange={(e) => handleSubjectChange(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-md py-1.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-semibold"
            >
              {users.map(u => (
                <option key={u.user_id} value={u.user_id}>
                  {u.full_name} ({u.employee_code} • {u.department})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Progress Bar for Rapid Bursts */}
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
              className="h-full bg-gradient-to-r from-cyan-500 to-red-500 transition-all duration-200"
              style={{ width: `${actionProgress.percent}%` }}
            />
          </div>
        </div>
      )}

      {/* Live Threat Telemetry HUD */}
      <div className="soc-card p-4 border-cyan-500/30 bg-slate-950/70 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <RiskGauge score={currentScore} size="md" />
          <div className="text-xs space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-slate-400 font-mono">Current Subject Risk:</span>
              <SeverityBadge severity={riskSeverity} />
              <span className="text-white font-mono font-bold">{currentScore.toFixed(1)} / 100</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Evaluated by Explainable Hybrid Threat Engine: Rules (45%) + Isolation Forest ML (30%) + Baselines (25%)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4 font-mono text-xs">
          {lastTelemetry && (
            <div className="text-right hidden sm:block">
              <span className="text-slate-500 block text-[10px] uppercase">Last Intercepted Event</span>
              <span className="text-cyan-400 font-bold">{lastTelemetry.event_type}</span>
              <span className="text-slate-400 ml-1">({lastTelemetry.timestamp})</span>
            </div>
          )}

          <button
            onClick={() => navigate('/activity')}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Raw Log Stream</span>
          </button>
        </div>
      </div>

      {/* Main 3 Enterprise Modules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Module 1: Corporate Document Management & Exfiltration Lab */}
        <div className="lg:col-span-2 soc-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-bold font-mono text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>MODULE 1: ENTERPRISE DOCUMENT REPOSITORY</span>
              </h2>
              <p className="text-xs text-slate-400">Download routine files or test high-velocity confidential data exfiltration</p>
            </div>

            <button
              onClick={handleExfiltrationBurst}
              className="px-3 py-1.5 rounded-lg bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600 hover:text-white text-xs font-bold transition-all flex items-center space-x-1.5 shadow-lg shadow-red-600/20"
            >
              <Flame className="w-3.5 h-3.5 animate-pulse" />
              <span>Simulate Rapid Bulk Exfiltration (12 Files)</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Document Title</th>
                  <th className="py-2.5 px-3">Classification</th>
                  <th className="py-2.5 px-3">Size</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-sans">
                {corporateDocuments.map((doc, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white">{doc.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{doc.path}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        doc.classification === 'TOP SECRET' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        doc.classification === 'RESTRICTED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        doc.classification === 'INTERNAL' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {doc.classification}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{doc.size} MB</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => handleDownloadFile(doc)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-500 hover:text-black rounded text-[11px] font-semibold text-slate-300 transition-colors flex items-center space-x-1 ml-auto"
                      >
                        <Download className="w-3 h-3" />
                        <span>Download</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Module 3: Restricted Vault (403 Probing Lab) */}
        <div className="soc-card p-5 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold font-mono text-white flex items-center space-x-2">
              <FolderLock className="w-4 h-4 text-red-400" />
              <span>MODULE 3: RESTRICTED VAULTS (403 PROBE)</span>
            </h2>
            <p className="text-xs text-slate-400">Attempt unauthorized access to test reconnaissance detection</p>
          </div>

          <div className="space-y-3">
            {[
              { name: 'HSM Cryptographic Root Keys', uri: '/admin/hsm-master-keys', level: 'Clearance L-5' },
              { name: 'Executive Payroll & Board Bonuses', uri: '/payroll/executive-bonuses', level: 'Finance Director Only' },
              { name: 'System Root Audit Purge Terminal', uri: '/root/system-audit-purge', level: 'Superadmin Clearance' },
              { name: 'Biometric Hash Database Staging', uri: '/vault/biometric-hashes', level: 'SecOps Clearance' }
            ].map((vault, i) => (
              <div
                key={i}
                className="p-3 rounded-lg bg-slate-900 border border-slate-800 hover:border-red-500/40 transition-all flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <Lock className="w-3.5 h-3.5 text-red-400" />
                    <span>{vault.name}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">{vault.uri}</div>
                  <span className="text-[9px] text-amber-400 font-mono block mt-1">{vault.level}</span>
                </div>

                <button
                  onClick={() => handleAccessRestricted(vault.name, vault.uri)}
                  className="px-2.5 py-1 bg-red-950/40 hover:bg-red-600 hover:text-white border border-red-500/30 text-red-300 rounded text-[11px] font-semibold transition-colors"
                >
                  Probe
                </button>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-500 italic">
            Note: Probing restricted endpoints tests RULE_UNAUTHORIZED_ACCESS (Repeated 401/403 detections).
          </p>
        </div>
      </div>

      {/* Module 2: Core Database & Customer Records (Modification Burst Lab) */}
      <div className="soc-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-sm font-bold font-mono text-white flex items-center space-x-2">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>MODULE 2: CORE ENTERPRISE CUSTOMER ACCOUNTS & LEDGER DATABASE</span>
            </h2>
            <p className="text-xs text-slate-400">Direct transactional table. Test sabotage or mass modification bursts.</p>
          </div>

          <button
            onClick={handleMassModifyBurst}
            className="px-3 py-1.5 rounded-lg bg-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-600 hover:text-black text-xs font-bold transition-all flex items-center space-x-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Simulate Mass Record Modification Burst (15 Records)</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Account ID</th>
                <th className="py-2.5 px-3">Corporate Client</th>
                <th className="py-2.5 px-3">Escrow Balance</th>
                <th className="py-2.5 px-3">Audit State</th>
                <th className="py-2.5 px-3 text-right">Operations</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-sans">
              {customerRecords.map((cust) => (
                <tr key={cust.id} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-cyan-400 font-bold">{cust.id}</td>
                  <td className="py-2.5 px-3 font-semibold text-white">{cust.name}</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">{cust.balance}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                      {cust.status}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right space-x-2">
                    <button
                      onClick={() => recordEnterpriseEvent({
                        eventType: 'RECORD_MODIFY',
                        resourceId: `/database/customer_accounts/${cust.id}`,
                        action: 'UPDATE',
                        status: 'SUCCESS',
                        metadata: { record_id: cust.id, balance: cust.balance }
                      }).then(() => setModalNotice({
                        title: 'LEDGER RECORD UPDATED',
                        message: `Routine record update committed for ${cust.name}. Telemetry logged.`,
                        type: 'success'
                      }))}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium transition-colors"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => recordEnterpriseEvent({
                        eventType: 'RECORD_MODIFY',
                        resourceId: `/database/customer_accounts/${cust.id}`,
                        action: 'DELETE',
                        status: 'SUCCESS',
                        metadata: { record_id: cust.id, reason: 'Manual purge' }
                      }).then(() => setModalNotice({
                        title: 'LEDGER RECORD DELETED',
                        message: `Critical record ${cust.id} purged. Evaluated by Sabotage Rule.`,
                        type: 'denied'
                      }))}
                      className="px-2.5 py-1 bg-red-950/40 hover:bg-red-600 hover:text-white border border-red-500/30 text-red-300 rounded text-[11px] font-medium transition-colors"
                    >
                      Purge
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Interactive Modal Notice */}
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
                  Inspect in SOC Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
