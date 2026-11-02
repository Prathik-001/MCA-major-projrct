import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLayout } from '../context/LayoutContext';
import {
  Shield,
  Menu,
  Radio,
  LogOut,
  CheckCircle2,
  AlertOctagon,
  Wrench,
  Search,
  Bell,
  Monitor,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  User,
  ShieldAlert,
  ChevronDown,
  Layers
} from 'lucide-react';
import ApiClient from '../api/client';
import SystemMaintenanceModal from './SystemMaintenanceModal';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, quickSwitch } = useAuth();
  const { toggleMobileSidebar } = useLayout();

  const [chainValid, setChainValid] = useState(true);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [alertsDropdownOpen, setAlertsDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const searchRef = useRef(null);
  const alertsRef = useRef(null);
  const profileRef = useRef(null);
  const searchInputRef = useRef(null);

  // Global Ctrl+K / Cmd+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 50);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Poll audit ledger and alerts
  useEffect(() => {
    async function checkChainAndAlerts() {
      try {
        if (user && (user.role === 'Administrator' || user.role === 'Manager')) {
          const res = await ApiClient.verifyAuditChain();
          setChainValid(res.isValid);
          const alertsRes = await ApiClient.getAlerts({ status: 'Open' });
          const items = alertsRes.alerts || [];
          setAlertCount(items.length);
          setRecentAlerts(items.slice(0, 4));
        }
      } catch {
        // Silently handle
      }
    }
    checkChainAndAlerts();
    const interval = setInterval(checkChainAndAlerts, 10000);
    return () => clearInterval(interval);
  }, [user]);

  // Handle outside click for dropdowns
  useEffect(() => {
    const handleClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
      if (alertsRef.current && !alertsRef.current.contains(e.target)) {
        setAlertsDropdownOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Friendly Breadcrumb Mapping
  const getBreadcrumb = () => {
    const p = location.pathname;
    if (p.includes('/security/dashboard')) return { section: 'Threat Operations', page: 'SOC Overview' };
    if (p.includes('/security/employees') || p.includes('/users')) return { section: 'Identity & Access', page: 'User Directory' };
    if (p.includes('/security/virtual-computers')) return { section: 'Virtual Fleet', page: 'Virtual Computers' };
    if (p.includes('/security/threat-alerts') || p.includes('/alerts')) return { section: 'Threat Operations', page: 'Threat Alerts' };
    if (p.includes('/security/incidents') || p.includes('/incidents')) return { section: 'Threat Operations', page: 'Incidents & Triage' };
    if (p.includes('/security/activity-logs') || p.includes('/activity')) return { section: 'Threat Operations', page: 'Live Activity Stream' };
    if (p.includes('/security/risk-analysis') || p.includes('/risk-profile')) return { section: 'Identity & Access', page: 'Risk Dossiers' };
    if (p.includes('/baselines')) return { section: 'Identity & Access', page: 'Behavioral Baselines' };
    if (p.includes('/security/settings') || p.includes('/rules')) return { section: 'Governance', page: 'Detection Rules' };
    if (p.includes('/security/audit-logs') || p.includes('/audit')) return { section: 'Governance', page: 'Audit Ledger' };
    if (p.includes('/security/reports') || p.includes('/reports')) return { section: 'Governance', page: 'MITRE Reports' };
    if (p.includes('/simulation')) return { section: 'Diagnostics', page: 'Threat Simulations' };
    if (p.includes('/research')) return { section: 'Diagnostics', page: 'Research & ML Lab' };
    return { section: 'Admin Portal', page: 'Dashboard' };
  };

  const breadcrumb = getBreadcrumb();

  const searchCommands = [
    { title: 'User & Team Directory', path: '/security/employees', category: 'Identity & Access' },
    { title: 'Virtual Workstations Fleet', path: '/security/virtual-computers', category: 'Virtual Fleet' },
    { title: 'Employee macOS Desktop', path: '/employee/desktop', category: 'Virtual Fleet' },
    { title: 'SOC Overview Dashboard', path: '/security/dashboard', category: 'Threat Operations' },
    { title: 'Security Threat Alerts', path: '/security/threat-alerts', category: 'Threat Operations' },
    { title: 'Incidents & Containment', path: '/security/incidents', category: 'Threat Operations' },
    { title: 'Live Activity Feed', path: '/security/activity-logs', category: 'Threat Operations' },
    { title: 'User Risk Dossiers', path: '/security/risk-analysis', category: 'Identity & Access' },
    { title: 'Behavioral Baselines & Z-Scores', path: '/baselines', category: 'Identity & Access' },
    { title: 'Detection Rule Lab', path: '/security/settings', category: 'Admin Tools' },
    { title: 'Cryptographic Audit Ledger', path: '/security/audit-logs', category: 'Admin Tools' },
    { title: 'MITRE ATT&CK Reports', path: '/security/reports', category: 'Admin Tools' },
    { title: 'Threat Simulation Suite', path: '/simulation', category: 'Admin Tools' },
    { title: 'Research & ML Evaluation', path: '/research', category: 'Admin Tools' }
  ];

  const filteredCommands = searchQuery
    ? searchCommands.filter(c =>
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchCommands.slice(0, 6);

  return (
    <>
      <header className="h-16 border-b border-slate-800 bg-[#090d16]/95 backdrop-blur-md sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between select-none font-sans">
        {/* Left Side: Mobile Menu + Brand + Breadcrumbs */}
        <div className="flex items-center space-x-3">
          {/* Mobile Drawer Hamburger */}
          <button
            onClick={toggleMobileSidebar}
            className="p-2 md:hidden text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 focus:outline-none"
            aria-label="Toggle Mobile Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo & Platform Name */}
          <div
            onClick={() => navigate('/security/dashboard')}
            className="flex items-center space-x-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm tracking-wider text-white font-mono">UBA SENTINEL</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono border border-cyan-500/30">
                  Admin
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">Insider Threat Detection</p>
            </div>
          </div>

          {/* Breadcrumb Navigation Indicator */}
          <div className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-400 pl-4 border-l border-slate-800">
            <span className="text-slate-500">{breadcrumb.section}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-white font-medium">{breadcrumb.page}</span>
          </div>
        </div>

        {/* Center: Global Command Search Bar (Ctrl+K) */}
        <div ref={searchRef} className="relative hidden md:block w-64 lg:w-96">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search admin panel... (e.g. users, alerts, logs)"
              value={searchQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              className="w-full pl-9 pr-14 py-1.5 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all shadow-inner"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-500 hover:text-white text-xs px-1"
                >
                  ✕
                </button>
              ) : (
                <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded shadow-sm">
                  Ctrl K
                </kbd>
              )}
            </div>
          </div>

          {searchOpen && (
            <div className="absolute top-10 left-0 w-full bg-[#121624] border border-slate-700 rounded-xl shadow-2xl py-2 z-50 text-xs text-slate-200 animate-fadeIn">
              <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-500 font-mono flex items-center justify-between">
                <span>{searchQuery ? 'Search Results' : 'Quick Jump'}</span>
                <span className="text-[9px] text-slate-600">Esc to close</span>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-0.5 px-1 mt-1">
                {filteredCommands.length === 0 ? (
                  <div className="p-3 text-center text-slate-500 text-xs">
                    No results found for "{searchQuery}"
                  </div>
                ) : (
                  filteredCommands.map((cmd, idx) => (
                    <button
                      key={idx}
                      onClick={() => { navigate(cmd.path); setSearchOpen(false); setSearchQuery(''); }}
                      className="w-full text-left px-3 py-2 rounded-lg hover:bg-cyan-500/15 hover:text-cyan-300 flex items-center justify-between transition-colors group"
                    >
                      <span className="font-medium text-slate-200 group-hover:text-cyan-300">{cmd.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono group-hover:text-cyan-400/70">{cmd.category}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Action Controls */}
        <div className="flex items-center space-x-2.5">
          {/* Real-time Status Badge */}
          <div className="hidden xl:flex items-center space-x-2">
            <div
              title="Real-time SOC telemetry streaming is active"
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span className="text-[10px]">SOC: ACTIVE</span>
            </div>

            <button
              onClick={() => setMaintenanceOpen(true)}
              title={chainValid ? 'Cryptographic audit ledger is intact' : 'Audit ledger hash mismatch! Click to inspect'}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-mono border transition-all ${
                chainValid
                  ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20'
                  : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20 animate-pulse'
              }`}
            >
              {chainValid ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px]">SHA-256: VALID</span>
                </>
              ) : (
                <>
                  <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-[10px]">LEDGER: ALERT</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Workstation Launch Button */}
          <button
            onClick={() => navigate('/employee/desktop')}
            className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all"
            title="Launch Employee Virtual Desktop"
          >
            <Monitor className="w-3.5 h-3.5 text-cyan-400" />
            <span>Virtual Mac</span>
          </button>

          {/* Alert Notifications Bell with Dropdown */}
          <div ref={alertsRef} className="relative">
            <button
              onClick={() => setAlertsDropdownOpen(!alertsDropdownOpen)}
              className="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Threat Alerts Notification"
            >
              <Bell className="w-4 h-4" />
              {alertCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-red-500 text-white font-bold text-[9px] flex items-center justify-center animate-pulse">
                  {alertCount > 9 ? '9+' : alertCount}
                </span>
              )}
            </button>

            {alertsDropdownOpen && (
              <div className="absolute right-0 top-11 w-80 bg-[#121624] border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 text-xs animate-fadeIn">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-white">Active Alerts ({alertCount})</span>
                  </div>
                  <button
                    onClick={() => { navigate('/security/threat-alerts'); setAlertsDropdownOpen(false); }}
                    className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>View all</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>

                <div className="divide-y divide-slate-800/80 my-2 max-h-60 overflow-y-auto">
                  {recentAlerts.length === 0 ? (
                    <div className="py-4 text-center text-slate-500 text-xs">
                      No active threat alerts! System is within normal baselines.
                    </div>
                  ) : (
                    recentAlerts.map(alt => (
                      <div
                        key={alt.id}
                        onClick={() => { navigate('/security/threat-alerts'); setAlertsDropdownOpen(false); }}
                        className="py-2 px-1 hover:bg-slate-800/50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-white truncate max-w-[170px]">{alt.title}</span>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold ${
                            alt.severity === 'Critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            alt.severity === 'High' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                            'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          }`}>
                            {alt.severity}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 flex items-center justify-between">
                          <span>{alt.user_name || 'Subject'}</span>
                          <span className="font-mono text-cyan-400">Score {alt.risk_score}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => { navigate('/security/threat-alerts'); setAlertsDropdownOpen(false); }}
                  className="w-full py-1.5 bg-slate-800 hover:bg-cyan-600 hover:text-white rounded-xl text-center text-xs font-semibold text-slate-300 transition-colors"
                >
                  Open Alerts Triage Center
                </button>
              </div>
            )}
          </div>

          {/* User Profile Pill & Dropdown */}
          {user && (
            <div ref={profileRef} className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center space-x-2 pl-2 pr-1 py-1 rounded-xl hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-800"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                  {(user.full_name || 'U').slice(0, 1).toUpperCase()}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
                    {user.full_name}
                  </p>
                  <p className="text-[10px] text-cyan-400 font-mono">{user.role}</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 top-12 w-64 bg-[#121624] border border-slate-700 rounded-2xl shadow-2xl p-3 z-50 text-xs animate-fadeIn space-y-3">
                  <div className="pb-2 border-b border-slate-800">
                    <p className="font-bold text-white text-sm">{user.full_name}</p>
                    <p className="text-slate-400 text-xs truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px]">
                      <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-medium border border-cyan-500/30">
                        {user.role}
                      </span>
                      <span className="text-slate-400">{user.department}</span>
                    </div>
                  </div>

                  {/* Demo Quick Role Switcher */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">
                      Switch Role (Demo Mode)
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {['Administrator', 'Manager', 'Employee'].map(r => (
                        <button
                          key={r}
                          onClick={async () => {
                            await quickSwitch(r);
                            setProfileDropdownOpen(false);
                          }}
                          className={`py-1 text-[10px] rounded-lg font-semibold transition-all ${
                            user.role === r
                              ? 'bg-cyan-500 text-black shadow font-bold'
                              : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
                          }`}
                        >
                          {r === 'Administrator' ? 'Admin' : r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <button
                      onClick={() => { setMaintenanceOpen(true); setProfileDropdownOpen(false); }}
                      className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1.5"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Maintenance</span>
                    </button>

                    <button
                      onClick={logout}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* System Maintenance Modal */}
      <SystemMaintenanceModal
        isOpen={maintenanceOpen}
        onClose={() => setMaintenanceOpen(false)}
      />
    </>
  );
}
