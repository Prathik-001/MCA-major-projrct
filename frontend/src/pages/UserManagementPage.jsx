import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import SeverityBadge from '../components/SeverityBadge';
import RiskGauge from '../components/RiskGauge';
import {
  Users,
  Search,
  ShieldAlert,
  Ban,
  RotateCcw,
  AlertTriangle,
  ExternalLink,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  X,
  Filter,
  Download,
  LayoutGrid,
  List,
  Eye,
  ShieldCheck,
  Mail,
  Briefcase,
  Lock,
  Unlock,
  KeyRound,
  Laptop,
  Sparkles,
  Clock,
  UserCheck
} from 'lucide-react';

export default function UserManagementPage() {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [riskFilter, setRiskFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'

  // Modals & Drawers
  const [inspectUser, setInspectUser] = useState(null); // Detailed Drawer
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectProfile, setInspectProfile] = useState(null);

  const [actionModal, setActionModal] = useState(null); // { type: 'suspend' | 'revoke', user }
  const [suspendReason, setSuspendReason] = useState('Anomalous activity detected. Precautionary account freeze.');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Add Employee Modal
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDept, setNewDept] = useState('Finance');
  const [newJobTitle, setNewJobTitle] = useState('Financial Operations Analyst');
  const [newPassword, setNewPassword] = useState('Employee@12345');
  const [showPassword, setShowPassword] = useState(false);
  const [newRole, setNewRole] = useState('Employee');
  const [submittingUser, setSubmittingUser] = useState(false);

  // Department Preset job titles
  const deptJobTitles = {
    Finance: ['Financial Operations Analyst', 'Treasury Accountant', 'Senior Financial Controller', 'Auditor'],
    Engineering: ['Software Engineer', 'Senior DevOps Specialist', 'Site Reliability Engineer', 'Cloud Architect'],
    'Human Resources': ['HR Operations Specialist', 'People Partner', 'Talent Acquisition Lead', 'HR Coordinator'],
    Sales: ['Account Executive', 'Enterprise Relationship Lead', 'Sales Engineer', 'Commercial Strategist'],
    Legal: ['Compliance Counsel', 'Legal Operations Specialist', 'Risk & Regulatory Associate']
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await ApiClient.getUsers();
      setUsers(res.users || []);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load user directory: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // When opening detailed inspect drawer, fetch full user profile & baselines
  const handleOpenInspect = async (targetUser) => {
    setInspectUser(targetUser);
    setInspectLoading(true);
    try {
      const res = await ApiClient.getUserProfile(targetUser.user_id);
      setInspectProfile(res);
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setInspectLoading(false);
    }
  };

  // Auto-generate company email when full name changes
  const handleNameChange = (name) => {
    setNewFullName(name);
    if (!name.trim()) {
      setNewEmail('');
      return;
    }
    const cleanName = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '.');
    setNewEmail(`${cleanName}@sentinel.local`);
  };

  // Department change updates suggested job title
  const handleDeptChange = (dept) => {
    setNewDept(dept);
    const suggestions = deptJobTitles[dept];
    if (suggestions && suggestions.length > 0) {
      setNewJobTitle(suggestions[0]);
    }
  };

  // Generate a random secure password
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
    let pwd = '';
    for (let i = 0; i < 14; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim()) {
      setErrorMsg('Full name and company email are required.');
      return;
    }

    setSubmittingUser(true);
    setErrorMsg('');
    try {
      await ApiClient.createUser({
        full_name: newFullName.trim(),
        email: newEmail.trim().toLowerCase(),
        department: newDept,
        job_title: newJobTitle.trim(),
        password: newPassword,
        role: newRole
      });

      setMessage(`Employee ${newFullName} successfully onboarded! Virtual workstation and baseline profile provisioned.`);
      setIsAddingUser(false);
      setNewFullName('');
      setNewEmail('');
      loadUsers();
      setTimeout(() => setMessage(''), 5000);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleSuspend = async () => {
    if (!actionModal?.user) return;
    try {
      await ApiClient.suspendUser(actionModal.user.user_id, suspendReason);
      setMessage(`Account for ${actionModal.user.full_name} has been suspended.`);
      setActionModal(null);
      if (inspectUser?.user_id === actionModal.user.user_id) {
        setInspectUser({ ...inspectUser, account_status: 'Suspended' });
      }
      loadUsers();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setErrorMsg(`Action failed: ${err.message}`);
    }
  };

  const handleReinstate = async (targetUser) => {
    try {
      await ApiClient.reinstateUser(targetUser.user_id);
      setMessage(`Account for ${targetUser.full_name} has been reinstated to active status.`);
      if (inspectUser?.user_id === targetUser.user_id) {
        setInspectUser({ ...inspectUser, account_status: 'Active' });
      }
      loadUsers();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setErrorMsg(`Action failed: ${err.message}`);
    }
  };

  const handleRevokeSessions = async (targetUser) => {
    try {
      await ApiClient.revokeUserSessions(targetUser.user_id);
      setMessage(`All active authenticated tokens for ${targetUser.full_name} have been revoked.`);
      loadUsers();
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      setErrorMsg(`Action failed: ${err.message}`);
    }
  };

  // Export filtered users to CSV
  const handleExportCSV = () => {
    if (filteredUsers.length === 0) return;
    const headers = ['Full Name', 'Employee Code', 'Email', 'Department', 'Job Title', 'Role', 'Account Status', 'Risk Score', 'Risk Level', 'Baseline Status'];
    const rows = filteredUsers.map(u => [
      `"${u.full_name || ''}"`,
      `"${u.employee_code || ''}"`,
      `"${u.email || ''}"`,
      `"${u.department || ''}"`,
      `"${u.job_title || ''}"`,
      `"${u.role || 'Employee'}"`,
      `"${u.account_status || 'Active'}"`,
      u.current_risk_score || 0,
      `"${u.risk_level || 'Low'}"`,
      `"${u.baseline_status || 'Established'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `monitored_personnel_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const departments = ['All', 'Finance', 'Engineering', 'Human Resources', 'Sales', 'Legal'];

  // Filtered Users List
  const filteredUsers = users.filter(u => {
    if (deptFilter !== 'All' && u.department !== deptFilter) return false;
    if (statusFilter !== 'All' && u.account_status !== statusFilter) return false;
    if (roleFilter !== 'All' && (u.role || 'Employee') !== roleFilter) return false;

    if (riskFilter !== 'All') {
      const score = u.current_risk_score || 0;
      if (riskFilter === 'Low' && score >= 30) return false;
      if (riskFilter === 'Medium' && (score < 30 || score >= 60)) return false;
      if (riskFilter === 'High' && score < 60) return false;
    }

    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q)) ||
      (u.job_title && u.job_title.toLowerCase().includes(q)) ||
      (u.employee_code && u.employee_code.toLowerCase().includes(q))
    );
  });

  const hasActiveFilters = search || deptFilter !== 'All' || statusFilter !== 'All' || roleFilter !== 'All' || riskFilter !== 'All';

  const resetFilters = () => {
    setSearch('');
    setDeptFilter('All');
    setStatusFilter('All');
    setRoleFilter('All');
    setRiskFilter('All');
  };

  // KPIs
  const totalUsers = users.length;
  const activeCount = users.filter(u => u.account_status === 'Active').length;
  const suspendedCount = users.filter(u => u.account_status === 'Suspended').length;
  const highRiskCount = users.filter(u => (u.current_risk_score || 0) >= 60).length;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Friendly Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#0f1422] to-[#121829] p-5 rounded-2xl border border-slate-800 shadow-xl shadow-cyan-950/20">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/40 flex items-center justify-center shadow-inner">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">
                Identity & Access Management
              </span>
              <h1 className="text-xl font-bold text-white leading-tight">Team Directory & Access Controls</h1>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage monitored employee accounts, baseline health, risk levels, and virtual workstation access.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {currentUser?.role === 'Administrator' && (
            <button
              onClick={() => setIsAddingUser(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-cyan-950/40 transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Onboard Employee</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            title="Export filtered directory to CSV"
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={loadUsers}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-slate-300 hover:text-white transition-colors"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Overview Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/80 rounded-2xl transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Total Monitored</span>
            <Users className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{totalUsers}</div>
          <div className="text-[11px] text-slate-400 mt-1">Personnel registered</div>
        </div>

        <div className="p-4 bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/80 rounded-2xl transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Active Personnel</span>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono">{activeCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Operational accounts</div>
        </div>

        <div className="p-4 bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/80 rounded-2xl transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Suspended Access</span>
            <Ban className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{suspendedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Containment freezes</div>
        </div>

        <div className="p-4 bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/80 rounded-2xl transition-all">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-medium">Elevated Risk</span>
            <ShieldAlert className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-400 font-mono">{highRiskCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Score &gt;= 60.0</div>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{message}</span>
          </div>
          <button onClick={() => setMessage('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}
      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl flex items-center justify-between shadow-sm animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Modern Filter Toolbar */}
      <div className="bg-[#101422] p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code, email, title..."
              className="w-full pl-9 pr-8 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all shadow-inner"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Switcher & Result Count */}
          <div className="flex items-center justify-between lg:justify-end gap-3">
            <span className="text-xs text-slate-400">
              Showing <strong className="text-white font-mono">{filteredUsers.length}</strong> of {totalUsers}
            </span>

            {/* View Mode Toggle: Table vs Cards */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
              <button
                onClick={() => setViewMode('table')}
                title="Table View"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('cards')}
                title="Grid / Cards View"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'cards' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Dropdowns and Pills */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-800/80 text-xs">
          {/* Status Pills */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
            {['All', 'Active', 'Suspended'].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  statusFilter === s ? 'bg-cyan-500 text-black font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
            <span className="text-slate-500 text-[11px]">Dept:</span>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              {departments.map(d => (
                <option key={d} value={d} className="bg-slate-900 text-white">
                  {d === 'All' ? 'All Departments' : d}
                </option>
              ))}
            </select>
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
            <span className="text-slate-500 text-[11px]">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900 text-white">All Roles</option>
              <option value="Employee" className="bg-slate-900 text-white">Employee</option>
              <option value="Manager" className="bg-slate-900 text-white">Manager</option>
              <option value="Administrator" className="bg-slate-900 text-white">Administrator</option>
            </select>
          </div>

          {/* Risk Level Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1">
            <span className="text-slate-500 text-[11px]">Risk:</span>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-slate-900 text-white">All Tiers</option>
              <option value="Low" className="bg-slate-900 text-white">Low (&lt;30)</option>
              <option value="Medium" className="bg-slate-900 text-white">Medium (30-59)</option>
              <option value="High" className="bg-slate-900 text-white">High (60+)</option>
            </select>
          </div>

          {/* Clear Filters Reset */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-2.5 py-1 text-xs text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 font-medium ml-auto"
            >
              <span>Reset Filters</span>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Directory Content: Table View vs Card View */}
      {filteredUsers.length === 0 ? (
        <div className="bg-[#101422] border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center mx-auto">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No Monitored Personnel Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No employees match the current search keywords or filter settings.
          </p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 rounded-xl text-xs font-semibold hover:bg-cyan-600/30 transition-all inline-block mt-2"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="bg-[#101422] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Subject Personnel</th>
                  <th className="py-3 px-4">Department & Role</th>
                  <th className="py-3 px-4">Risk Severity</th>
                  <th className="py-3 px-4">Dynamic Score</th>
                  <th className="py-3 px-4">Baseline Health</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-sans">
                {filteredUsers.map(u => (
                  <tr
                    key={u.id || u.user_id}
                    className="hover:bg-slate-900/60 transition-colors group cursor-pointer"
                    onClick={() => handleOpenInspect(u)}
                  >
                    {/* Subject */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-700 flex items-center justify-center font-bold text-xs text-cyan-400 font-mono shadow-sm group-hover:border-cyan-500/50 transition-colors">
                          {u.full_name?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                            <span>{u.full_name}</span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                            <span>{u.employee_code}</span>
                            <span>•</span>
                            <span className="truncate max-w-[140px]">{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Department & Role */}
                    <td className="py-3 px-4">
                      <div className="text-slate-200 font-medium">{u.job_title}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-slate-800 border border-slate-700 font-mono">
                          {u.department}
                        </span>
                        <span className="text-slate-500">{u.role || 'Employee'}</span>
                      </div>
                    </td>

                    {/* Severity */}
                    <td className="py-3 px-4">
                      <SeverityBadge severity={u.risk_level || 'Low'} />
                    </td>

                    {/* Risk Score */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-white text-xs">
                          {Math.round(u.current_risk_score || 0)}
                        </span>
                        <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              u.current_risk_score >= 80 ? 'bg-rose-500' :
                              u.current_risk_score >= 60 ? 'bg-orange-500' :
                              u.current_risk_score >= 30 ? 'bg-amber-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${Math.min(100, u.current_risk_score || 0)}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Baseline */}
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                        u.baseline_status === 'Established'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {u.baseline_status || 'Established'}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                        u.account_status === 'Active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${u.account_status === 'Active' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                        {u.account_status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => handleOpenInspect(u)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs transition-colors"
                          title="Inspect Subject Dossier & Activity"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => navigate(`/security/risk-analysis/${u.user_id}`)}
                          className="px-2 py-1 bg-slate-800 hover:bg-cyan-600 hover:text-white text-slate-300 rounded-lg text-[11px] font-medium transition-colors"
                          title="Open Full Behavioral Risk Dossier"
                        >
                          Dossier
                        </button>

                        {currentUser?.role === 'Administrator' && (
                          <>
                            {u.account_status === 'Active' ? (
                              <button
                                onClick={() => setActionModal({ type: 'suspend', user: u })}
                                className="px-2 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-medium transition-colors"
                                title="Freeze account access"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button
                                onClick={() => handleReinstate(u)}
                                className="px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-medium transition-colors"
                                title="Reinstate operational access"
                              >
                                Reinstate
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARD GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map(u => (
            <div
              key={u.id || u.user_id}
              onClick={() => handleOpenInspect(u)}
              className="bg-[#101422] hover:bg-[#13182a] border border-slate-800 hover:border-slate-700 rounded-2xl p-5 shadow-lg transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Top Card Strip */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600/30 to-blue-600/30 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold text-sm font-mono shadow-sm">
                      {u.full_name?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-white group-hover:text-cyan-300 transition-colors leading-tight">
                        {u.full_name}
                      </h3>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        {u.employee_code} • {u.department}
                      </div>
                    </div>
                  </div>

                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                    u.account_status === 'Active'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}>
                    {u.account_status}
                  </span>
                </div>

                <div className="text-xs text-slate-300 font-medium mb-3 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                  <span>{u.job_title}</span>
                </div>

                {/* Risk Score & Gauge Box */}
                <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-xl mb-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Dynamic Threat Score</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-lg font-bold font-mono text-white">
                        {Math.round(u.current_risk_score || 0)}
                      </span>
                      <span className="text-xs text-slate-500">/ 100</span>
                      <SeverityBadge severity={u.risk_level || 'Low'} />
                    </div>
                  </div>
                  <RiskGauge score={u.current_risk_score || 0} size="sm" />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleOpenInspect(u)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors flex-1 justify-center"
                >
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Inspect</span>
                </button>

                <button
                  onClick={() => navigate(`/security/risk-analysis/${u.user_id}`)}
                  className="px-3 py-1.5 bg-cyan-600/15 hover:bg-cyan-600 hover:text-white text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all"
                  title="View Deep Risk Dossier"
                >
                  <span>Dossier</span>
                  <ExternalLink className="w-3 h-3" />
                </button>

                {currentUser?.role === 'Administrator' && (
                  u.account_status === 'Active' ? (
                    <button
                      onClick={() => setActionModal({ type: 'suspend', user: u })}
                      className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-medium transition-colors"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReinstate(u)}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-medium transition-colors"
                    >
                      Reinstate
                    </button>
                  )
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =================================================================== */}
      {/* USER DETAIL QUICK INSPECTION SHEET / MODAL                          */}
      {/* =================================================================== */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#121626] border border-slate-700 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Sheet Header */}
            <div className="p-5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-md font-mono">
                  {inspectUser.full_name?.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white">{inspectUser.full_name}</h2>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                      inspectUser.account_status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {inspectUser.account_status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    {inspectUser.employee_code} • {inspectUser.email}
                  </p>
                </div>
              </div>

              <button
                onClick={() => { setInspectUser(null); setInspectProfile(null); }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sheet Body Content */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/50 p-3.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Department</span>
                  <span className="font-semibold text-white">{inspectUser.department}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Job Title</span>
                  <span className="font-semibold text-white truncate block">{inspectUser.job_title}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">System Role</span>
                  <span className="font-semibold text-cyan-400">{inspectUser.role || 'Employee'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-mono uppercase block">Baseline State</span>
                  <span className="font-semibold text-emerald-400">{inspectUser.baseline_status || 'Established'}</span>
                </div>
              </div>

              {/* Threat Risk Evaluation */}
              <div className="bg-[#161b2e] border border-slate-700/80 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-cyan-400" />
                    <span className="font-bold text-white text-sm">Behavioral Risk Assessment</span>
                  </div>
                  <p className="text-xs text-slate-400 max-w-sm">
                    Calculated by the hybrid UBA engine combining Isolation Forest, baseline Z-scores, and rule violations.
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <SeverityBadge severity={inspectUser.risk_level || 'Low'} />
                    <span className="text-slate-400 text-xs">Composite Score: <strong className="text-white font-mono">{Math.round(inspectUser.current_risk_score || 0)}/100</strong></span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center justify-center">
                  <RiskGauge score={inspectUser.current_risk_score || 0} size="md" />
                </div>
              </div>

              {/* Recent Activity Snapshot */}
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Recent Security Events Telemetry</span>
                </h4>

                {inspectLoading ? (
                  <div className="py-6 text-center text-cyan-400 flex items-center justify-center gap-2 font-mono">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Loading recent telemetry logs...</span>
                  </div>
                ) : inspectProfile?.recentEvents?.length > 0 ? (
                  <div className="space-y-1.5">
                    {inspectProfile.recentEvents.slice(0, 4).map((evt, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-white text-xs">{evt.action || evt.event_type}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{evt.details || evt.resource_accessed || 'System operation'}</div>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-900/50 p-3 rounded-lg border border-slate-800/80">
                    No recent anomalous activity recorded. Workstation running within normal parameters.
                  </p>
                )}
              </div>

              {/* Action Controls */}
              <div className="pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setInspectUser(null);
                      navigate(`/security/risk-analysis/${inspectUser.user_id}`);
                    }}
                    className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-cyan-950/40 transition-all"
                  >
                    <span>Full Risk Dossier</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      setInspectUser(null);
                      navigate('/employee/desktop');
                    }}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Laptop className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Open Workstation</span>
                  </button>
                </div>

                {currentUser?.role === 'Administrator' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRevokeSessions(inspectUser)}
                      className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-medium transition-colors"
                      title="Invalidate all active session JWT tokens"
                    >
                      Revoke Tokens
                    </button>

                    {inspectUser.account_status === 'Active' ? (
                      <button
                        onClick={() => {
                          setActionModal({ type: 'suspend', user: inspectUser });
                        }}
                        className="px-3 py-2 bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/40 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Suspend User
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReinstate(inspectUser)}
                        className="px-3 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/40 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Reinstate User
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* SUSPEND REASON CONFIRMATION MODAL                                   */}
      {/* =================================================================== */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#181c28] border border-amber-500/40 w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <span>Suspend Account Access</span>
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              Suspending account for <strong className="text-white">{actionModal.user.full_name}</strong> will revoke all authenticated sessions and lock virtual computer operations.
            </p>

            <label className="text-[11px] font-semibold text-slate-400 block mb-1">
              Select or Enter Incident Justification:
            </label>

            {/* Quick Reason Chips */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {[
                'Anomalous off-hours data transfer',
                'High risk behavioral anomaly',
                'Precautionary account freeze',
                'Security incident investigation'
              ].map(preset => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSuspendReason(preset)}
                  className={`text-[10px] px-2 py-1 rounded-lg border transition-colors ${
                    suspendReason === preset
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={suspendReason}
              onChange={(e) => setSuspendReason(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-amber-500 mb-4"
              placeholder="Provide justification note for audit ledger..."
            />

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setActionModal(null)}
                className="px-3.5 py-2 text-xs text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-amber-950/50 transition-all"
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* ONBOARD EMPLOYEE & PROVISION WORKSTATION MODAL                      */}
      {/* =================================================================== */}
      {isAddingUser && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#141829] border border-cyan-500/40 w-full max-w-xl rounded-2xl shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-cyan-600/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Onboard New Enterprise Personnel</h3>
                  <p className="text-[11px] text-slate-400">Instantly sets up macOS virtual desktop, baseline, and mailbox</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddingUser(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateEmployee} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Full Legal Name */}
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">Full Legal Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Elena Rostova"
                    value={newFullName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Company Email */}
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">Company Email *</label>
                  <input
                    type="email"
                    placeholder="elena.rostova@sentinel.local"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Department */}
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">Department</label>
                  <select
                    value={newDept}
                    onChange={(e) => handleDeptChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Finance">Finance</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Human Resources">Human Resources</option>
                    <option value="Sales">Sales</option>
                    <option value="Legal">Legal</option>
                  </select>
                </div>

                {/* Job Title */}
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">Job Title *</label>
                  <input
                    type="text"
                    placeholder="Financial Analyst"
                    value={newJobTitle}
                    onChange={(e) => setNewJobTitle(e.target.value)}
                    required
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Assigned Role */}
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">System Role</label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
                  >
                    <option value="Employee">Employee (Virtual Desktop Access)</option>
                    <option value="Manager">Manager (Department Oversight)</option>
                    <option value="Administrator">Administrator (Full SOC Access)</option>
                  </select>
                </div>

                {/* Initial Password */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs text-slate-300 font-medium">Initial Password *</label>
                    <button
                      type="button"
                      onClick={generatePassword}
                      className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Generate</span>
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 pr-10 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Informative Help Box */}
              <div className="p-3 bg-cyan-950/20 border border-cyan-800/40 rounded-xl text-[11px] text-cyan-300 flex items-start gap-2">
                <Laptop className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  Onboarding this employee will automatically provision their virtual computer, seed baseline behavioral stats, and create a company email account.
                </span>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddingUser(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="px-5 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-950/50 transition-all"
                >
                  {submittingUser ? 'Provisioning...' : 'Provision Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
