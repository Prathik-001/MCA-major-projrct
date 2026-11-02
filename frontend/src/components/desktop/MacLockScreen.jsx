import React, { useState, useEffect } from 'react';
import ApiClient from '../../api/client';
import {
  Lock,
  ShieldAlert,
  ShieldCheck,
  LogOut,
  Mail,
  AlertTriangle,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  RefreshCw,
  HelpCircle
} from 'lucide-react';

export default function MacLockScreen({
  currentUser,
  lockReason,
  onLogout,
  onUnlockSuccess
}) {
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Remote Unlock Poller: If an administrator unlocks the workstation remotely from the Admin Portal,
  // automatically detect it and unlock the screen without user intervention!
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const res = await ApiClient.getMyVirtualComputer();
        if (res && res.is_locked === false) {
          setSuccessMsg('Workstation unlocked remotely by SOC Administrator. Resuming session...');
          setTimeout(() => {
            if (onUnlockSuccess) onUnlockSuccess();
          }, 1200);
        }
      } catch (err) {
        // ignore background poll errors
      }
    }, 2500);

    return () => clearInterval(pollInterval);
  }, [onUnlockSuccess]);

  // Handle in-person Administrator unlock
  const handleAdminUnlock = async (e) => {
    e.preventDefault();
    if (!adminEmail.trim() || !adminPassword) {
      setErrorMsg('Please enter both Administrator email and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await ApiClient.adminUnlockLockScreen(
        adminEmail.trim(),
        adminPassword,
        currentUser?.id,
        'Administrator in-person unlock authorization from workstation lock screen'
      );

      setSuccessMsg(res.message || 'Administrator verified. Workstation unlocked.');
      setTimeout(() => {
        if (onUnlockSuccess) onUnlockSuccess();
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || 'Access Denied: Only authorized Administrators can unlock this workstation.');
    } finally {
      setLoading(false);
    }
  };

  // Helper to auto-fill default Administrator credentials for quick testing
  const handleFillAdminDemo = () => {
    setAdminEmail('admin@sentinel.local');
    setAdminPassword('Admin@12345');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-3xl bg-[#070a12]/95 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-100 select-none animate-fadeIn font-sans">
      <div className="w-full max-w-lg bg-[#121624]/95 border border-rose-600/50 rounded-3xl p-6 sm:p-8 shadow-[0_25px_80px_rgba(225,29,72,0.3)] text-center flex flex-col items-center ring-1 ring-rose-500/30">
        {/* Pulsing Lock Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mb-4 shadow-lg shadow-rose-950/60">
          <Lock className="w-8 h-8 animate-pulse" />
        </div>

        {/* User Identity */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-sm text-white shadow-md">
            {(currentUser?.full_name || 'U').slice(0, 2).toUpperCase()}
          </div>
          <div className="text-left">
            <h2 className="text-sm font-bold text-white leading-tight">{currentUser?.full_name}</h2>
            <p className="text-[11px] text-slate-400 font-mono">{currentUser?.email}</p>
          </div>
        </div>

        {/* Auto-Lock Containment Alert Box */}
        <div className="w-full bg-rose-950/40 border border-rose-600/50 rounded-2xl p-4 text-left mb-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wide">
              <ShieldAlert className="w-4 h-4 shrink-0 animate-bounce" />
              <span>Suspicious Activity Auto-Lock Engaged</span>
            </div>
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-rose-500/20 font-bold text-rose-300 border border-rose-500/30">
              SEC-SOC-402
            </span>
          </div>

          <p className="text-xs text-rose-200/90 leading-relaxed font-sans">
            {lockReason || 'Automated Threat Containment: Suspicious insider activity or anomalous baseline deviation detected. Workstation access has been immediately locked.'}
          </p>

          <div className="pt-2 border-t border-rose-900/50 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1 text-amber-300">
              <AlertTriangle className="w-3 h-3 text-amber-400" />
              <span>Only an Administrator can unlock once locked.</span>
            </span>
            <span>Immutable Telemetry Signed</span>
          </div>
        </div>

        {/* =================================================================== */}
        {/* Administrator Clearance Unlock Form                                 */}
        {/* =================================================================== */}
        <div className="w-full bg-[#181d2c]/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 text-left mb-4 shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-white tracking-wide">Administrator Clearance Unlock</span>
            </div>
            <button
              type="button"
              onClick={handleFillAdminDemo}
              className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              title="Auto-fill Administrator (CISO) credentials"
            >
              <HelpCircle className="w-3 h-3" />
              <span>Fill Admin Credentials</span>
            </button>
          </div>

          <form onSubmit={handleAdminUnlock} className="space-y-3">
            {/* Admin Email */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Administrator Email:
              </label>
              <input
                type="email"
                placeholder="admin@sentinel.local"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                required
                className="w-full bg-[#0e121d] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 transition-colors"
              />
            </div>

            {/* Admin Password */}
            <div>
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Administrator Password:
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                  className="w-full bg-[#0e121d] border border-slate-700/80 rounded-xl pl-3 pr-9 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/80 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-2.5 bg-rose-950/80 border border-rose-600/60 rounded-xl text-[11px] text-rose-300 flex items-start gap-2 animate-fadeIn">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span className="leading-snug">{errorMsg}</span>
              </div>
            )}

            {/* Success Message */}
            {successMsg && (
              <div className="p-2.5 bg-emerald-950/80 border border-emerald-600/60 rounded-xl text-[11px] text-emerald-300 flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit Unlock Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-700 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-cyan-900/40 hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Administrator Identity...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify Administrator & Unlock</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Logout / Exit Session Button */}
        <div className="w-full flex items-center justify-between gap-3">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Mail className="w-3 h-3 text-cyan-400" />
            <span>SOC: <strong>soc@sentinel.local</strong></span>
          </div>

          <button
            onClick={onLogout}
            className="px-4 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
