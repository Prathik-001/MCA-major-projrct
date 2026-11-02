import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Laptop,
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Building2,
  Users,
  Shield
} from 'lucide-react';

export default function EmployeeLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('sarah.chen@sentinel.local');
  const [password, setPassword] = useState('Employee@12345');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const testEmployees = [
    {
      name: 'Sarah Chen',
      email: 'sarah.chen@sentinel.local',
      role: 'Senior Financial Analyst',
      dept: 'Finance & Treasury',
      code: 'FIN-104',
      model: 'Mac Studio (Finance-M3)'
    },
    {
      name: 'Alex Rivera',
      email: 'alex.rivera@sentinel.local',
      role: 'DevOps & Cloud Lead',
      dept: 'Infrastructure & SRE',
      code: 'OPS-105',
      model: 'MacBook Pro (DevOps-M3)'
    },
    {
      name: 'Jordan Hayes',
      email: 'employee@sentinel.local',
      role: 'Staff Software Engineer',
      dept: 'Engineering',
      code: 'DEV-003',
      model: 'Mac Pro (StaffDev-M2)'
    },
    {
      name: 'David Miller',
      email: 'david.miller@sentinel.local',
      role: 'Data Research Scientist',
      dept: 'R&D Algorithms',
      code: 'RND-106',
      model: 'iMac (DataResearch-M3)'
    },
    {
      name: 'Emma Watson',
      email: 'emma.watson@sentinel.local',
      role: 'HR Operations Lead',
      dept: 'Human Resources',
      code: 'HR-107',
      model: 'MacBook Air (HR-M2)'
    }
  ];

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/employee/desktop');
    } catch (err) {
      setError(err.message || 'Invalid credentials or account suspended.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmployee = (emp) => {
    setEmail(emp.email);
    setPassword('Employee@12345');
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 flex flex-col justify-between font-sans relative overflow-hidden select-none">
      {/* Dynamic Background Gradients */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="p-5 flex items-center justify-between max-w-7xl w-full mx-auto z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-900/30">
            <Laptop className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white">Sentinel Workstation</h1>
            <p className="text-[10px] text-slate-400 font-mono">macOS Virtual Computer Portal</p>
          </div>
        </div>

        <Link
          to="/security/login"
          className="px-3.5 py-1.5 bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-all"
        >
          <Shield className="w-3.5 h-3.5 text-cyan-400" />
          <span>Security Admin Portal</span>
        </Link>
      </header>

      {/* Main Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 z-10">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 bg-[#101422]/90 border border-slate-800/80 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
          {/* Left Form (7 Cols) */}
          <div className="md:col-span-7 p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-blue-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Single Sign-On (SSO) Workstation Authentication</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Access Your Virtual Desktop</h2>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Enter your company credentials to mount your dedicated macOS virtual environment with isolated files, private mailbox, documents, and chat.
              </p>

              {error && (
                <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Company Email:</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="employee@sentinel.local"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5">Password:</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 transition-all active:scale-[0.99] mt-2"
                >
                  <span>{loading ? 'Mounting Virtual Workstation...' : 'Launch Virtual Computer'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="pt-6 border-t border-slate-800/80 mt-6 flex items-center justify-between text-[11px] text-slate-500">
              <span>Security Agent: Sentinel UBA Active</span>
              <Link to="/employee/register" className="text-blue-400 hover:text-blue-300 font-semibold">
                New Employee Register
              </Link>
            </div>
          </div>

          {/* Right Fast Switcher Profiles (5 Cols) */}
          <div className="md:col-span-5 bg-[#0b0e17] p-6 border-t md:border-t-0 md:border-l border-slate-800/80 flex flex-col justify-between">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-cyan-400" />
                <span>Test Employee Profiles</span>
              </div>
              <p className="text-[11px] text-slate-500 mb-4 leading-tight">
                Click any profile to test independent virtual computer isolation:
              </p>

              <div className="space-y-2">
                {testEmployees.map(emp => {
                  const isSelected = email === emp.email;
                  return (
                    <button
                      key={emp.email}
                      type="button"
                      onClick={() => handleSelectEmployee(emp)}
                      className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex items-center justify-between ${
                        isSelected
                          ? 'border-blue-500/80 bg-blue-600/15 text-white ring-1 ring-blue-500/40'
                          : 'border-slate-800/80 bg-slate-900/40 hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{emp.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({emp.code})</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{emp.role}</div>
                        <div className="text-[9px] text-cyan-400 font-mono mt-0.5">{emp.model}</div>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                        {isSelected ? 'Selected' : 'Select'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 text-[10px] text-slate-500 text-center font-mono">
              Password for all test employees: <strong className="text-slate-300">Employee@12345</strong>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-[11px] text-slate-600 border-t border-slate-900">
        Explainable Hybrid Framework for Insider Threat Detection & Dynamic Risk Scoring – MCA Major Project
      </footer>
    </div>
  );
}
