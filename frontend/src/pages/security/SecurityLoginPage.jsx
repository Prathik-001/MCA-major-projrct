import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  ShieldAlert,
  AlertCircle,
  KeyRound,
  Laptop
} from 'lucide-react';

export default function SecurityLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@sentinel.local');
  const [password, setPassword] = useState('Admin@12345');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const adminRoles = [
    {
      name: 'Dr. Evelyn Cross',
      email: 'admin@sentinel.local',
      role: 'Chief Information Security Officer (CISO)',
      pass: 'Admin@12345',
      badge: 'SEC-001'
    },
    {
      name: 'Marcus Vance',
      email: 'manager@sentinel.local',
      role: 'SecOps Director / Lead Investigator',
      pass: 'Manager@12345',
      badge: 'ENG-002'
    }
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      if (res.user.role !== 'Administrator' && res.user.role !== 'Manager') {
        throw new Error('Access Denied: You must possess Administrator or Manager credentials to access the SOC Portal.');
      }
      navigate('/security/dashboard');
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col justify-between font-sans relative overflow-hidden select-none">
      <div className="absolute top-0 -right-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="p-5 flex items-center justify-between max-w-5xl w-full mx-auto z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-900/40">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white">Sentinel SOC Platform</h1>
            <p className="text-[10px] text-slate-400 font-mono">Security Operations Center Authentication</p>
          </div>
        </div>

        <Link
          to="/employee/login"
          className="px-3.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-all"
        >
          <Laptop className="w-3.5 h-3.5 text-blue-400" />
          <span>Employee Virtual Computer Portal</span>
        </Link>
      </header>

      {/* Main Login */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-12 bg-[#0d111d]/90 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-2xl">
          {/* Left: Login Form (7 cols) */}
          <div className="md:col-span-7 p-8">
            <div className="flex items-center gap-2 mb-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
              <KeyRound className="w-4 h-4" />
              <span>Privileged SOC Authentication</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Security Administration Access</h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Authenticate to monitor live employee activities, analyse threat telemetry, adjust risk scoring, and enforce workstation lock controls.
            </p>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Administrator Email:</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="admin@sentinel.local"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">Master Password:</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40 transition-all active:scale-[0.99] mt-2"
              >
                <span>{loading ? 'Authenticating Security Role...' : 'Enter Security Dashboard'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right: Quick Switcher (5 cols) */}
          <div className="md:col-span-5 bg-[#090c15] p-6 border-t md:border-t-0 md:border-l border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Authorized SOC Roles
              </div>
              <p className="text-[11px] text-slate-500 mb-4 leading-tight">
                Click a role to prefill credentials:
              </p>

              <div className="space-y-2.5">
                {adminRoles.map(adm => {
                  const isSelected = email === adm.email;
                  return (
                    <button
                      key={adm.email}
                      type="button"
                      onClick={() => { setEmail(adm.email); setPassword(adm.pass); }}
                      className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                        isSelected
                          ? 'border-cyan-500 bg-cyan-600/15 text-white ring-1 ring-cyan-500/40'
                          : 'border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div className="font-bold flex items-center justify-between">
                        <span>{adm.name}</span>
                        <span className="text-[10px] text-cyan-400 font-mono">[{adm.badge}]</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{adm.role}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 text-[10px] text-slate-500 font-mono text-center">
              Tamper-Evident SHA-256 Ledger Active
            </div>
          </div>
        </div>
      </main>

      <footer className="p-4 text-center text-[11px] text-slate-600 border-t border-slate-900">
        Sentinel SOC & User Behaviour Analytics – Master MCA Dissertation
      </footer>
    </div>
  );
}
