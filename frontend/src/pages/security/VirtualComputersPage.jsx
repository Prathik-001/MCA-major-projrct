import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiClient from '../../api/client';
import RiskGauge from '../../components/RiskGauge';
import SeverityBadge from '../../components/SeverityBadge';
import {
  Laptop,
  Lock,
  Unlock,
  Power,
  UserX,
  UserCheck,
  ShieldAlert,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  Activity,
  Sliders,
  Check,
  X,
  HardDrive,
  Mail,
  Folder,
  FileText,
  Clock,
  Terminal,
  Filter,
  Flame,
  ArrowRight,
  ExternalLink,
  Shield
} from 'lucide-react';

export default function VirtualComputersPage() {
  const navigate = useNavigate();
  const [computers, setComputers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Modals
  const [actionModal, setActionModal] = useState(null); // { type: 'lock'|'unlock'|'terminate'|'suspend'|'restore', vm: {} }
  const [reasonInput, setReasonInput] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // App Permissions Modal
  const [appModalVm, setAppModalVm] = useState(null);

  const loadVirtualComputers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ApiClient.getVirtualComputers();
      setComputers(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVirtualComputers();
    const interval = setInterval(loadVirtualComputers, 8000);
    return () => clearInterval(interval);
  }, []);

  // Quick 1-Click Action Execution
  const handleQuickAction = async (type, vm, defaultReason) => {
    setError('');
    setSuccessMsg('');
    try {
      if (type === 'unlock') {
        await ApiClient.unlockVirtualComputer(vm.id, defaultReason || 'Unlocked from Quick Admin Actions');
        setSuccessMsg(`Workstation for ${vm.employee_name} unlocked.`);
      } else if (type === 'lock') {
        await ApiClient.lockVirtualComputer(vm.id, defaultReason || 'Immediate containment initiated by Administrator');
        setSuccessMsg(`Workstation for ${vm.employee_name} locked.`);
      }
      await loadVirtualComputers();
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Control Action Execution (with Reasoned Modal)
  const handleExecuteAction = async (e) => {
    e.preventDefault();
    if (!actionModal) return;
    if (actionModal.type === 'lock' && !reasonInput.trim()) {
      setError('Please provide an audit reason for locking the virtual computer.');
      return;
    }

    setSubmittingAction(true);
    setError('');
    try {
      const { type, vm } = actionModal;
      if (type === 'lock') {
        await ApiClient.lockVirtualComputer(vm.id, reasonInput.trim());
        setSuccessMsg(`Locked ${vm.employee_name}'s virtual computer.`);
      } else if (type === 'unlock') {
        await ApiClient.unlockVirtualComputer(vm.id, reasonInput.trim() || 'Unlocked by Administrator');
        setSuccessMsg(`Unlocked ${vm.employee_name}'s virtual computer.`);
      } else if (type === 'terminate') {
        await ApiClient.terminateSession(vm.id, reasonInput.trim() || 'Session killed by Administrator');
        setSuccessMsg(`Terminated active session for ${vm.employee_name}.`);
      } else if (type === 'suspend') {
        await ApiClient.suspendEmployee(vm.id, reasonInput.trim() || 'Account suspended by SOC policy');
        setSuccessMsg(`Suspended employee account access for ${vm.employee_name}.`);
      } else if (type === 'restore') {
        await ApiClient.restoreEmployee(vm.id, reasonInput.trim() || 'Access restored by SOC policy');
        setSuccessMsg(`Restored employee access for ${vm.employee_name}.`);
      }

      setActionModal(null);
      setReasonInput('');
      await loadVirtualComputers();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle Bulk Fleet Actions
  const handleBulkAction = async (actionType) => {
    setLoading(true);
    setError('');
    try {
      const res = await ApiClient.executeBulkVirtualComputerAction(actionType, 'Triggered from Fleet Control Dashboard');
      setSuccessMsg(res.message);
      await loadVirtualComputers();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle App Toggle
  const handleToggleApp = async (appKey) => {
    if (!appModalVm) return;
    const isCurrentlyDisabled = appModalVm.disabled_apps?.includes(appKey);
    const newAllowed = isCurrentlyDisabled; // if disabled, we allow it

    try {
      await ApiClient.toggleApplicationAccess(appModalVm.id, appKey, newAllowed, `Toggled from Admin Console`);
      setSuccessMsg(`Updated ${appKey} access for ${appModalVm.employee_name}.`);
      await loadVirtualComputers();
      setAppModalVm(prev => ({
        ...prev,
        disabled_apps: newAllowed
          ? (prev.disabled_apps || []).filter(k => k !== appKey)
          : [...(prev.disabled_apps || []), appKey]
      }));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Online':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Online</span>
          </span>
        );
      case 'Locked':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            <span>Locked</span>
          </span>
        );
      case 'Suspended':
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
            <UserX className="w-3 h-3" />
            <span>Suspended</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            <span>Offline</span>
          </span>
        );
    }
  };

  // KPIs
  const totalCount = computers.length;
  const onlineCount = computers.filter(c => c.status === 'Online').length;
  const lockedCount = computers.filter(c => c.status === 'Locked').length;
  const suspendedCount = computers.filter(c => c.status === 'Suspended').length;
  const highRiskCount = computers.filter(c => c.risk_score >= 60).length;

  // Filtered List
  const filteredComputers = computers.filter(c => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (departmentFilter !== 'All' && c.department !== departmentFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.employee_name?.toLowerCase().includes(q) ||
      c.employee_email?.toLowerCase().includes(q) ||
      c.department?.toLowerCase().includes(q) ||
      c.employee_code?.toLowerCase().includes(q) ||
      c.computer_name?.toLowerCase().includes(q)
    );
  });

  const departments = ['All', 'Finance', 'Engineering', 'Human Resources', 'Sales', 'Legal'];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Top Banner & Maintenance Hub Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#111422] p-5 rounded-2xl border border-slate-800 shadow-xl shadow-cyan-950/20">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center">
              <Laptop className="w-4 h-4" />
            </div>
            <h1 className="text-xl font-bold text-white font-mono">VIRTUAL COMPUTERS FLEET CONTROL</h1>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-mono border border-cyan-500/30">
              UBA ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Real-time management hub for employee macOS virtual computers. Lock workstations, revoke sessions, and restrict applications with tamper-evident audit ledger tracking.
          </p>
        </div>

        {/* Quick Fleet Maintenance Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => handleBulkAction('unlock_all')}
            disabled={loading || lockedCount === 0}
            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600 disabled:opacity-40 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Unlock all currently locked workstations"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Unlock All</span>
          </button>

          <button
            onClick={() => handleBulkAction('lock_high_risk')}
            disabled={loading || highRiskCount === 0}
            className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600 disabled:opacity-40 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            title="Emergency lock all workstations with risk score >= 60"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Emergency Lock (Risk &ge; 60)</span>
          </button>

          <button
            onClick={loadVirtualComputers}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"
            title="Refresh Fleet Telemetry"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Fleet Overview KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-slate-500 uppercase font-semibold font-mono">Total Workstations</span>
          <div className="text-lg font-bold text-white mt-0.5">{totalCount}</div>
        </div>
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-slate-500 uppercase font-semibold font-mono">Active Sessions</span>
          <div className="text-lg font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{onlineCount}</span>
          </div>
        </div>
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-slate-500 uppercase font-semibold font-mono">Administratively Locked</span>
          <div className="text-lg font-bold text-rose-400 mt-0.5">{lockedCount}</div>
        </div>
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-slate-500 uppercase font-semibold font-mono">Suspended Access</span>
          <div className="text-lg font-bold text-amber-400 mt-0.5">{suspendedCount}</div>
        </div>
        <div className="p-3.5 bg-slate-900/60 border border-slate-800 rounded-xl">
          <span className="text-[10px] text-slate-500 uppercase font-semibold font-mono">High Risk Fleet</span>
          <div className="text-lg font-bold text-red-400 mt-0.5">{highRiskCount}</div>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-slate-500 hover:text-white">✕</button>
        </div>
      )}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError('')} className="text-slate-500 hover:text-white">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-2xl border border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            {['All', 'Online', 'Locked', 'Suspended'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === s ? 'bg-cyan-500 text-black shadow font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Department Select */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-2">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1 focus:outline-none"
            >
              {departments.map(d => (
                <option key={d} value={d}>{d === 'All' ? 'All Departments' : d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search employee, email, code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Virtual Computers Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredComputers.length === 0 ? (
          <div className="col-span-full p-12 text-center text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800 text-xs">
            No virtual computers matched the selected status or department filter.
          </div>
        ) : (
          filteredComputers.map(vm => {
            const isLocked = vm.status === 'Locked';
            const isSuspended = vm.status === 'Suspended';
            const isOnline = vm.status === 'Online';

            return (
              <div
                key={vm.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isLocked
                    ? 'bg-[#1a131c] border-rose-600/40'
                    : isSuspended
                    ? 'bg-[#1a1714] border-amber-600/40'
                    : 'bg-[#111524] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-white text-sm shadow-md">
                        {(vm.employee_name || 'U').slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white leading-tight">{vm.employee_name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-cyan-400 font-mono">{vm.employee_code}</span>
                          <span className="text-[10px] text-slate-500">•</span>
                          <span className="text-[10px] text-slate-400">{vm.department}</span>
                        </div>
                      </div>
                    </div>

                    {getStatusBadge(vm.status)}
                  </div>

                  {/* Specs Box */}
                  <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2 mb-3 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Workstation:</span>
                      <span className="text-slate-200 truncate max-w-[170px]">{vm.computer_name}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Active Application:</span>
                      <span className="text-cyan-400 font-semibold">{vm.current_application || 'Finder'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Network IP:</span>
                      <span className="text-slate-300">{vm.active_ip || '127.0.0.1'}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 items-center pt-1 border-t border-slate-800">
                      <span>Insider Risk Score:</span>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className={vm.risk_score >= 60 ? 'text-rose-400 font-bold' : vm.risk_score >= 30 ? 'text-amber-400' : 'text-emerald-400'}>
                          {vm.risk_score} / 100 ({vm.risk_level})
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Lock Reason Banner */}
                  {isLocked && vm.lock_reason && (
                    <div className="mb-3 p-2 bg-rose-950/40 border border-rose-800/50 rounded-xl text-[11px] text-rose-300 flex items-start gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                      <span>{vm.lock_reason}</span>
                    </div>
                  )}

                  {/* Disabled apps warning */}
                  {vm.disabled_apps && vm.disabled_apps.length > 0 && (
                    <div className="mb-3 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[10px] text-amber-300 font-mono">
                      Restricted Apps: {vm.disabled_apps.join(', ')}
                    </div>
                  )}
                </div>

                {/* Action Buttons Toolbar */}
                <div className="pt-3 border-t border-slate-800/80 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Quick Lock / Unlock Button */}
                    {isLocked ? (
                      <button
                        onClick={() => handleQuickAction('unlock', vm)}
                        className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Quick Unlock</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleQuickAction('lock', vm, 'Precautionary lock initiated by Security Administrator')}
                        className="py-1.5 px-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Quick Lock</span>
                      </button>
                    )}

                    {/* Terminate Session */}
                    <button
                      onClick={() => { setActionModal({ type: 'terminate', vm }); setReasonInput('Administrative session revocation'); }}
                      disabled={!isOnline}
                      className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Power className="w-3.5 h-3.5 text-amber-400" />
                      <span>Kill Session</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* App Permissions Toggle */}
                    <button
                      onClick={() => setAppModalVm(vm)}
                      className="py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Sliders className="w-3.5 h-3.5 text-blue-400" />
                      <span>Restrict Apps</span>
                    </button>

                    {/* Suspend / Restore Account Access */}
                    {isSuspended ? (
                      <button
                        onClick={() => { setActionModal({ type: 'restore', vm }); setReasonInput('Employee clearance reinstated'); }}
                        className="py-1.5 px-3 bg-emerald-950/60 hover:bg-emerald-800 text-emerald-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Restore User</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => { setActionModal({ type: 'suspend', vm }); setReasonInput('Account suspended pending high-risk threat review'); }}
                        className="py-1.5 px-3 bg-amber-950/40 hover:bg-amber-900 text-amber-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>Suspend User</span>
                      </button>
                    )}
                  </div>

                  {/* Deep Investigation Shortcuts */}
                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400">
                    <button
                      onClick={() => navigate('/security/risk-analysis')}
                      className="hover:text-cyan-400 flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Risk Dossier</span>
                    </button>
                    <button
                      onClick={() => navigate('/security/activity-logs')}
                      className="hover:text-blue-400 flex items-center gap-1 transition-colors"
                    >
                      <Activity className="w-3 h-3" />
                      <span>Activity Logs</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Control Action Modal (with Reason) */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181c28] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <span className="capitalize">{actionModal.type} Virtual Computer</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Target Employee: <strong className="text-slate-200">{actionModal.vm?.employee_name}</strong> ({actionModal.vm?.employee_code})
            </p>

            <form onSubmit={handleExecuteAction} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Audit Ledger Reason / Incident Notes:</label>
                <textarea
                  rows={3}
                  value={reasonInput}
                  onChange={(e) => setReasonInput(e.target.value)}
                  placeholder="State the justification for this administrative control protocol..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-950/40"
                >
                  {submittingAction ? 'Executing...' : 'Confirm Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Application Access Permissions Modal */}
      {appModalVm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181c28] border border-slate-700 w-full max-w-lg rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <span>Application Access Controls</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Workstation for {appModalVm.employee_name} ({appModalVm.employee_code})
                </p>
              </div>
              <button
                onClick={() => setAppModalVm(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Toggle which company applications are permitted to run on this employee's virtual desktop. Disabled applications will immediately alert the employee and block launch.
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {[
                { key: 'finder', name: 'Finder (Local File Browser)', icon: Folder },
                { key: 'tasks', name: 'Task Manager (Workflows)', icon: Check },
                { key: 'mail', name: 'Company Mail Client', icon: Mail },
                { key: 'documents', name: 'Document Editor', icon: FileText },
                { key: 'chat', name: 'Team Chat Channel', icon: Activity },
                { key: 'calendar', name: 'Calendar Application', icon: Clock },
                { key: 'shared-drive', name: 'Corporate Shared Vaults', icon: HardDrive }
              ].map(app => {
                const isRestricted = appModalVm.disabled_apps?.includes(app.key);
                const AppIcon = app.icon;

                return (
                  <div
                    key={app.key}
                    className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
                        <AppIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{app.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{app.key}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleApp(app.key)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                        isRestricted
                          ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40 hover:bg-rose-600 hover:text-white'
                          : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600 hover:text-white'
                      }`}
                    >
                      {isRestricted ? 'Disabled (Click to Allow)' : 'Permitted (Click to Block)'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setAppModalVm(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
