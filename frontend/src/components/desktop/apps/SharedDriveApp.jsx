import React, { useState, useEffect } from 'react';
import ApiClient from '../../../api/client';
import {
  HardDrive,
  Lock,
  Unlock,
  ShieldAlert,
  FolderLock,
  KeyRound,
  FileCheck2,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Send,
  Users
} from 'lucide-react';

export default function SharedDriveApp({ currentUser }) {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 403 Access Denied Alert Modal
  const [deniedModal, setDeniedModal] = useState(null);

  // Request Clearance Modal
  const [requestModal, setRequestModal] = useState(null);
  const [requestReason, setRequestReason] = useState('');

  const loadResources = async () => {
    setLoading(true);
    try {
      const data = await ApiClient.getSharedResources();
      setResources(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResources();
  }, []);

  // Handle Vault Probe
  const handleProbeVault = async (resItem) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await ApiClient.probeSharedVault(resItem.id);
      setSuccessMsg(`Access verified: ${res.message}`);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      // 403 Forbidden Triggered
      setDeniedModal({
        resource: resItem,
        error: err.message
      });
    }
  };

  // Handle Request Access
  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    if (!requestReason.trim() || !requestModal) return;

    try {
      await ApiClient.requestSharedAccess(requestModal.id, requestReason.trim());
      setSuccessMsg(`Clearance request submitted for ${requestModal.name}.`);
      setRequestModal(null);
      setRequestReason('');
      loadResources();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#141721] text-slate-200 select-none overflow-hidden font-sans">
      {/* Header */}
      <div className="p-3 bg-[#111420] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-bold text-white">Corporate Shared Drives & Vaults</span>
          <span className="text-[10px] text-slate-500 font-mono">({currentUser?.department} Clearance)</span>
        </div>

        <div className="flex items-center gap-2">
          {successMsg && (
            <span className="text-[11px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{successMsg}</span>
            </span>
          )}
          <button
            onClick={loadResources}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 p-6 overflow-y-auto bg-[#0d1017]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map(resItem => {
            const isRestricted = resItem.access_level === 'RESTRICTED';
            const hasAccess = resItem.has_access;

            return (
              <div
                key={resItem.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  hasAccess
                    ? 'bg-[#151a28] border-slate-700/60 hover:border-blue-500/60'
                    : 'bg-[#18151f] border-rose-900/30 hover:border-rose-700/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                        hasAccess ? 'bg-blue-500/20 text-blue-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {hasAccess ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{resItem.name}</h4>
                        <span className="text-[10px] text-slate-500">Dept: {resItem.department}</span>
                      </div>
                    </div>

                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      resItem.access_level === 'RESTRICTED'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : resItem.access_level === 'DEPARTMENT'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {resItem.access_level}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    {resItem.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-500 font-mono">
                    {resItem.file_count || 12} Classified Assets
                  </span>

                  <div className="flex items-center gap-2">
                    {!hasAccess && resItem.request_status !== 'PENDING' && (
                      <button
                        onClick={() => { setRequestModal(resItem); setRequestReason(''); }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                      >
                        Request Clearance
                      </button>
                    )}

                    {resItem.request_status === 'PENDING' && (
                      <span className="text-[11px] text-amber-400 font-semibold px-2 py-0.5 bg-amber-500/10 rounded">
                        Clearance Pending Review
                      </span>
                    )}

                    <button
                      onClick={() => handleProbeVault(resItem)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm ${
                        hasAccess
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-rose-950/60 hover:bg-rose-900 border border-rose-800/60 text-rose-300'
                      }`}
                    >
                      {hasAccess ? 'Open Vault' : 'Probe Vault Access'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 403 Access Denied Alert Modal */}
      {deniedModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#1b1522] border-2 border-rose-600/80 w-full max-w-md rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h3 className="text-base font-bold text-white mb-2">HTTP 403: SECURITY ACCESS DENIED</h3>
            <p className="text-xs text-rose-300 mb-3 leading-relaxed">
              You do not possess the required Level-5 security clearance to access <strong>{deniedModal.resource?.name}</strong>.
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-rose-900/40 text-[11px] font-mono text-slate-400 text-left mb-5 space-y-1">
              <div>Incident: <span className="text-rose-400 font-bold">UNAUTHORIZED_ACCESS_ATTEMPT</span></div>
              <div>User: {currentUser?.email}</div>
              <div>Department: {currentUser?.department}</div>
              <div>Action: Telemetry dispatched to Sentinel SOC</div>
            </div>

            <button
              onClick={() => setDeniedModal(null)}
              className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-rose-900/50 transition-all"
            >
              Acknowledge Warning
            </button>
          </div>
        </div>
      )}

      {/* Request Clearance Modal */}
      {requestModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181c28] border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-blue-400" />
              <span>Request Vault Access Clearance</span>
            </h3>
            <p className="text-xs text-slate-400 mb-3">"{requestModal.name}"</p>
            <form onSubmit={handleSubmitRequest}>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Business Justification / Project Reference:</label>
              <textarea
                rows={3}
                placeholder="State why your departmental work requires access to this classified resource..."
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500 mb-4"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRequestModal(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
