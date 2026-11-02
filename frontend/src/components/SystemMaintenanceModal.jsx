import React, { useState, useEffect } from 'react';
import ApiClient from '../api/client';
import {
  Wrench,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Unlock,
  Flame,
  BarChart3,
  RefreshCw,
  CheckCircle2,
  X,
  FileLock2,
  Play,
  Cpu,
  Layers,
  Database
} from 'lucide-react';

export default function SystemMaintenanceModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('health');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Integrity State
  const [auditStatus, setAuditStatus] = useState(null);
  const [verifyingChain, setVerifyingChain] = useState(false);

  // Simulation State
  const [targetUser, setTargetUser] = useState('');
  const [users, setUsers] = useState([]);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadInitialState();
    }
  }, [isOpen]);

  const loadInitialState = async () => {
    try {
      const res = await ApiClient.verifyAuditChain();
      setAuditStatus(res);
      const userRes = await ApiClient.getUsers();
      setUsers(userRes.users || []);
      if (userRes.users?.length > 0) {
        setTargetUser(userRes.users[0].user_id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyChain = async () => {
    setVerifyingChain(true);
    setStatusMsg('');
    setErrorMsg('');
    try {
      const res = await ApiClient.verifyAuditChain();
      setAuditStatus(res);
      setStatusMsg(res.isValid ? 'SHA-256 Audit Chain verified: All blocks cryptographically intact.' : 'Warning: Audit chain hash mismatch detected!');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setVerifyingChain(false);
    }
  };

  const handleSimulateTamper = async () => {
    setStatusMsg('');
    setErrorMsg('');
    try {
      const res = await ApiClient.simulateTamper();
      setStatusMsg(`Tamper simulated on record #${res.tamperedRecordId}. Alert dispatched to SOC.`);
      const updated = await ApiClient.verifyAuditChain();
      setAuditStatus(updated);
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleRepairLedger = async () => {
    setStatusMsg('');
    setErrorMsg('');
    try {
      // Re-running verify or reset state
      const res = await ApiClient.verifyAuditChain();
      setAuditStatus(res);
      setStatusMsg('Ledger re-scanned and synchronized.');
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleBulkAction = async (actionType) => {
    setLoading(true);
    setStatusMsg('');
    setErrorMsg('');
    try {
      const res = await ApiClient.executeBulkVirtualComputerAction(actionType, 'Triggered from System Maintenance Console');
      setStatusMsg(res.message);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRunScenario = async (scenarioKey, label) => {
    setSimulating(true);
    setStatusMsg('');
    setErrorMsg('');
    try {
      const res = await ApiClient.triggerScenario(scenarioKey, targetUser);
      setStatusMsg(`Scenario '${label}' triggered: ${res.generatedEventsCount} events, ${res.alertsTriggered} alert(s) generated.`);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSimulating(false);
    }
  };

  const handleRecalculateBaselines = async () => {
    setLoading(true);
    setStatusMsg('');
    setErrorMsg('');
    try {
      let count = 0;
      for (const u of users) {
        await ApiClient.recalculateBaseline(u.user_id);
        count++;
      }
      setStatusMsg(`Successfully recalculated dynamic Z-score baselines for ${count} employees.`);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#101422] border border-cyan-500/40 w-full max-w-2xl rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
                <span>SYSTEM MAINTENANCE & SOC HEALTH HUB</span>
                <span className="text-[10px] px-2 py-0.2 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  ADMIN ONLY
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">One-click fleet controls, audit ledger diagnostics, and ML calibration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Banners */}
        {statusMsg && (
          <div className="p-3 bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border-b border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-[#0d101b] px-4 pt-2 gap-2 text-xs font-semibold">
          {[
            { id: 'health', label: 'Audit & Health', icon: ShieldCheck },
            { id: 'fleet', label: 'Fleet Maintenance', icon: Lock },
            { id: 'scenarios', label: 'Threat Scenarios', icon: Flame },
            { id: 'baselines', label: 'ML & Baselines', icon: BarChart3 }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-t-xl transition-all border-b-2 ${
                  isActive
                    ? 'border-cyan-400 text-cyan-400 bg-slate-900/60 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1 font-sans text-xs text-slate-300">
          {/* TAB 1: Audit & Health */}
          {activeTab === 'health' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-white text-xs">SHA-256 Tamper-Evident Ledger</h3>
                    <p className="text-[11px] text-slate-400">Continuous cryptographic hash chain verifying immutable SOC logs.</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold font-mono ${
                    auditStatus?.isValid
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                  }`}>
                    {auditStatus?.isValid ? 'LEDGER INTACT' : 'CHAIN COMPROMISED'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                  <div>Verified Blocks: <strong className="text-white">{auditStatus?.totalRecords || 0}</strong></div>
                  <div>Hashing Algorithm: <strong className="text-cyan-400">SHA-256</strong></div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleVerifyChain}
                    disabled={verifyingChain}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${verifyingChain ? 'animate-spin' : ''}`} />
                    <span>Verify Ledger Integrity</span>
                  </button>
                  <button
                    onClick={handleSimulateTamper}
                    className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 text-rose-400 hover:text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Simulate Database Tamper</span>
                  </button>
                </div>
              </div>

              {/* Engine Status Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Detection Engine</div>
                  <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>Deterministic (5 Rules)</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Machine Learning</div>
                  <div className="text-xs font-bold text-cyan-400 mt-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                    <span>Isolation Forest (Online)</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">User Baselines</div>
                  <div className="text-xs font-bold text-blue-400 mt-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                    <span>Dynamic Z-Score</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Fleet Maintenance */}
          {activeTab === 'fleet' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">Execute rapid administrative protocol actions across all provisioned employee workstations.</p>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-xs">Bulk Desktop Unlock</h4>
                    <p className="text-[11px] text-slate-400">Unlocks all currently locked employee workstations in a single step.</p>
                  </div>
                  <button
                    onClick={() => handleBulkAction('unlock_all')}
                    disabled={loading}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unlock All Workstations</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 border border-rose-900/30 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-rose-300 text-xs">Emergency Threat Isolation</h4>
                    <p className="text-[11px] text-slate-400">Instantly locks all workstations with risk scores exceeding 60 / 100.</p>
                  </div>
                  <button
                    onClick={() => handleBulkAction('lock_high_risk')}
                    disabled={loading}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Lock High-Risk Fleet</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Threat Scenarios */}
          {activeTab === 'scenarios' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">1-Click Threat Simulation Generator</h4>
                  <p className="text-[11px] text-slate-400">Inject realistic attack vectors into telemetry pipeline to test SOC response.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Target Subject:</span>
                  <select
                    value={targetUser}
                    onChange={(e) => setTargetUser(e.target.value)}
                    className="bg-slate-900 border border-slate-700 text-xs text-white rounded px-2 py-1"
                  >
                    {users.map(u => (
                      <option key={u.user_id} value={u.user_id}>
                        {u.full_name} ({u.department})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'SCENARIO_DATA_EXFILTRATION', label: 'Mass Data Exfiltration', desc: 'Bulk downloads 25 confidential assets in 2 minutes', tag: 'T1048' },
                  { key: 'SCENARIO_BRUTE_FORCE', label: 'Brute-Force Auth Burst', desc: '6 rapid failed logins from untrusted IP', tag: 'T1078' },
                  { key: 'SCENARIO_UNAUTHORIZED_PROBING', label: 'Systematic 403 Probing', desc: 'Sequential access denials to restricted vaults', tag: 'T1083' },
                  { key: 'SCENARIO_OFF_HOURS_SURGE', label: 'Off-Hours Surge (2:45 AM)', desc: 'Privileged modification during graveyard hours', tag: 'T1078' }
                ].map(s => (
                  <div key={s.key} className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-white text-xs">{s.label}</span>
                        <span className="text-[9px] px-1 py-0.2 rounded bg-rose-500/20 text-rose-400 font-mono font-bold">{s.tag}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-tight mb-3">{s.desc}</p>
                    </div>
                    <button
                      onClick={() => handleRunScenario(s.key, s.label)}
                      disabled={simulating}
                      className="w-full py-1.5 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      <span>Trigger Scenario</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ML & Baselines */}
          {activeTab === 'baselines' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">Recalculate dynamic behavioral baselines (mean $\mu$, std $\sigma$) across all employee telemetry events.</p>

              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs">Synchronize Dynamic Baselines</h4>
                  <p className="text-[11px] text-slate-400">Updates individual Z-scores for downloads, off-hours, emails, and USB traffic.</p>
                </div>
                <button
                  onClick={handleRecalculateBaselines}
                  disabled={loading}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-950/50 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Recalculate All Baselines</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Sentinel UBA Engine v2.4 Hybrid Architecture</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
          >
            Close Maintenance Console
          </button>
        </div>
      </div>
    </div>
  );
}
