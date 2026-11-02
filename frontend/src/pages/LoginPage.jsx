import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, CheckCircle } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@sentinel.local');
  const [password, setPassword] = useState('Admin@12345');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setPreset = (presetEmail, presetPass) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-md w-full soc-card p-8 relative z-10 border border-slate-800 shadow-2xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-500/30">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold font-mono text-white tracking-wide">UBA SENTINEL</h1>
          <p className="text-xs text-slate-400 mt-1">
            Explainable Insider Threat Detection & Dynamic Risk Scoring Platform
          </p>
          <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
            MCA Major Cybersecurity Project Defense Edition
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Employee ID / Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@sentinel.local"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Security Passcode</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg text-sm transition-all flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/25 disabled:opacity-50"
          >
            <span>{loading ? 'Authenticating & Verifying...' : 'Authenticate to SOC'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Preset accounts for examiner review */}
        <div className="mt-6 pt-5 border-t border-slate-800">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 text-center">
            Examiner Quick Test Profiles
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPreset('admin@sentinel.local', 'Admin@12345')}
              className="px-2 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-[11px] text-cyan-400 text-center transition-all"
            >
              <div className="font-semibold">Administrator</div>
              <div className="text-[9px] text-slate-500">Full Oversight</div>
            </button>
            <button
              type="button"
              onClick={() => setPreset('manager@sentinel.local', 'Manager@12345')}
              className="px-2 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-[11px] text-amber-400 text-center transition-all"
            >
              <div className="font-semibold">Manager</div>
              <div className="text-[9px] text-slate-500">Team Triage</div>
            </button>
            <button
              type="button"
              onClick={() => setPreset('employee@sentinel.local', 'Employee@12345')}
              className="px-2 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-[11px] text-emerald-400 text-center transition-all"
            >
              <div className="font-semibold">Employee</div>
              <div className="text-[9px] text-slate-500">Self Activity</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
