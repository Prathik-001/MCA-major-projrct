import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Building2,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Briefcase,
  Users,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';

export default function CompanyLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('sarah.chen@sentinel.local');
  const [password, setPassword] = useState('Employee@12345');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const employees = [
    {
      name: 'Sarah Chen',
      email: 'sarah.chen@sentinel.local',
      role: 'Senior Financial Analyst',
      dept: 'Finance & Accounting',
      badge: 'FIN-104',
      avatar: 'SC',
      color: 'from-amber-600 to-orange-500'
    },
    {
      name: 'Alex Rivera',
      email: 'alex.rivera@sentinel.local',
      role: 'DevOps & Cloud Lead',
      dept: 'Infrastructure & SRE',
      badge: 'OPS-105',
      avatar: 'AR',
      color: 'from-blue-600 to-cyan-500'
    },
    {
      name: 'David Miller',
      email: 'david.miller@sentinel.local',
      role: 'Data Research Scientist',
      dept: 'R&D / Core Algorithms',
      badge: 'RND-106',
      avatar: 'DM',
      color: 'from-purple-600 to-indigo-500'
    },
    {
      name: 'Emma Watson',
      email: 'emma.watson@sentinel.local',
      role: 'HR Operations Lead',
      dept: 'Human Resources & Payroll',
      badge: 'HR-107',
      avatar: 'EW',
      color: 'from-rose-600 to-pink-500'
    },
    {
      name: 'Jordan Hayes',
      email: 'jordan.hayes@sentinel.local',
      role: 'Staff Software Engineer',
      dept: 'Engineering & Products',
      badge: 'DEV-003',
      avatar: 'JH',
      color: 'from-emerald-600 to-teal-500'
    }
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/company/workspace');
    } catch (err) {
      setError(err.message || 'Authentication rejected. Verify corporate credentials.');
    } finally {
      setLoading(false);
    }
  };

  const selectEmployee = (emp) => {
    setEmail(emp.email);
    setPassword('Employee@12345');
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between p-6 relative overflow-hidden font-sans">
      {/* Background Lighting */}
      <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Header */}
      <header className="flex items-center justify-between z-10 max-w-6xl mx-auto w-full">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-wide text-white font-mono">APEX GLOBAL ENTERPRISES</h2>
            <p className="text-[11px] text-slate-400">Secure Employee Intranet & Cloud Collaboration Portal</p>
          </div>
        </div>

        <button
          onClick={() => navigate('/')}
          className="text-xs text-slate-400 hover:text-cyan-400 flex items-center space-x-1.5 font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-colors"
        >
          <span>Return to UBA Sentinel SOC</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Main Login Body */}
      <main className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 my-auto z-10 py-6">
        {/* Left Column: Form */}
        <div className="lg:col-span-5 soc-card p-8 border-slate-800 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="mb-6">
              <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-mono font-semibold uppercase tracking-wider">
                Single Sign-On (SSO) Portal
              </span>
              <h1 className="text-2xl font-bold text-white mt-3">Employee Sign-In</h1>
              <p className="text-xs text-slate-400 mt-1">
                Access internal corporate drives, ERP databases, financial ledgers, and document repositories.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/15 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                  Corporate Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="user@sentinel.local"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono">
                  Security Passcode
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded bg-slate-900 border-slate-700 text-blue-500" />
                  <span>Remember workstation session</span>
                </label>
                <span className="text-blue-400 hover:underline cursor-pointer">Helpdesk</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-lg text-xs transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>{loading ? 'Validating Credentials...' : 'Sign In to Workspace'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          <div className="pt-6 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>TLS 1.3 End-to-End Encrypted</span>
            </span>
            <span>Policy SEC-402 Enforced</span>
          </div>
        </div>

        {/* Right Column: Interactive Employee Selectors for Presentation Demo */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="soc-card p-6 border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold font-mono text-white flex items-center space-x-2">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>SELECT EMPLOYEE PROFILE FOR PRESENTATION DEMO</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any department user to instantly load their credentials and workspace
                </p>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                5 Test Personas
              </span>
            </div>

            <div className="space-y-2.5">
              {employees.map((emp) => {
                const isSelected = email === emp.email;
                return (
                  <div
                    key={emp.badge}
                    onClick={() => selectEmployee(emp)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 ring-1 ring-blue-500/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${emp.color} flex items-center justify-center text-white font-bold text-xs shadow`}>
                        {emp.avatar}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white">{emp.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">[{emp.badge}]</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {emp.role} • <span className="text-cyan-400">{emp.dept}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {isSelected ? (
                        <span className="text-xs font-semibold text-blue-400 flex items-center space-x-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Selected</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 hover:text-slate-300">Click to Select</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Compliance & Security Notice */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs space-y-2">
            <span className="font-mono text-blue-400 font-semibold block text-[11px]">
              🔒 Corporate Acceptable Use & Data Loss Prevention (DLP) Notice:
            </span>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              All activities within this corporate intranet are monitored by automated behavioral analytics. Unauthorized file transfers, mass downloads, external file sharing, and screen captures of restricted corporate data are strictly prohibited and immediately dispatched to the enterprise Security Operations Center (SOC).
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-600 font-mono z-10">
        Apex Global Enterprises © 2026 • Confidential Intranet Workstation • Session ID: WS-CORP-{Math.floor(1000 + Math.random() * 9000)}
      </footer>
    </div>
  );
}
