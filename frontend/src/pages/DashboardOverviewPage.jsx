import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ApiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import SeverityBadge from '../components/SeverityBadge';
import RiskGauge from '../components/RiskGauge';
import {
  Users,
  Activity,
  AlertTriangle,
  ShieldAlert,
  Flame,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Laptop,
  Sliders,
  ChevronRight,
  Shield
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar
} from 'recharts';

export default function DashboardOverviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const summary = await ApiClient.getDashboardSummary();
      setData(summary);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    let interval = null;
    if (autoRefresh) {
      interval = setInterval(loadData, 5000); // 5s periodic refresh
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  if (loading && !data) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex items-center space-x-3 text-cyan-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="font-mono text-sm">Synchronizing SOC Security Telemetry...</span>
        </div>
      </div>
    );
  }

  const {
    metrics = {},
    severityDistribution = [],
    detectionMethodDistribution = [],
    activityTimeline = [],
    recentAlerts = [],
    topRiskyUsers = []
  } = data || {};

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Welcome & Security Posture Header */}
      <div className="bg-gradient-to-r from-[#0f1422] to-[#13192c] border border-slate-800 p-5 rounded-2xl shadow-xl shadow-cyan-950/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest font-mono">
              Security Operations Command Center
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          </div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Welcome, {user?.full_name || 'Administrator'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time User Behaviour Analytics (UBA) & Explainable Hybrid Threat Engine
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono border flex items-center space-x-2 transition-all ${
              autoRefresh
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>Telemetry: {autoRefresh ? 'Live (5s)' : 'Paused'}</span>
          </button>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-500/40 transition-all"
            title="Force Telemetry Sync"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Action Navigation Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => navigate('/security/employees')}
          className="p-3 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-left transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white group-hover:text-cyan-300 transition-colors">Team Directory</div>
              <div className="text-[10px] text-slate-500">Manage Users & Access</div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition-colors" />
        </button>

        <button
          onClick={() => navigate('/security/virtual-computers')}
          className="p-3 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 rounded-xl text-left transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Laptop className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white group-hover:text-blue-300 transition-colors">Fleet Workstations</div>
              <div className="text-[10px] text-slate-500">Remote Mac Desktops</div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition-colors" />
        </button>

        <button
          onClick={() => navigate('/security/threat-alerts')}
          className="p-3 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/40 rounded-xl text-left transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white group-hover:text-amber-300 transition-colors">Threat Alerts</div>
              <div className="text-[10px] text-slate-500">Triage & Investigation</div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition-colors" />
        </button>

        <button
          onClick={() => navigate('/security/settings')}
          className="p-3 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/40 rounded-xl text-left transition-all group flex items-center justify-between"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold text-white group-hover:text-purple-300 transition-colors">Detection Rules</div>
              <div className="text-[10px] text-slate-500">Threshold Lab & Tuning</div>
            </div>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-white transition-colors" />
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-400">
          Telemetry Error: {error}
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Monitored Accounts"
          value={metrics.totalUsers || 0}
          subtitle="Authorized Test Subjects"
          icon={Users}
          color="cyan"
        />
        <StatCard
          title="Total Ingested Events"
          value={metrics.totalEvents || 0}
          subtitle="Cryptographically Chained"
          icon={Activity}
          color="purple"
        />
        <StatCard
          title="Suspicious Events"
          value={metrics.suspiciousEvents || 0}
          subtitle="Flagged by Hybrid Engine"
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Open Incidents"
          value={metrics.openIncidents || 0}
          subtitle="Active SOC Investigations"
          icon={ShieldAlert}
          color="red"
        />
        <StatCard
          title="High Risk Accounts"
          value={metrics.highRiskAccounts || 0}
          subtitle="Score >= 60.0"
          icon={Flame}
          color="red"
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Timeline Chart */}
        <div className="lg:col-span-2 soc-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white font-mono">ACTIVITY VOLUME & ANOMALY FLAGGING TIMELINE</h2>
              <p className="text-xs text-slate-400">Hourly aggregated event flow (Benign vs Flagged Anomalies)</p>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono">
              <span className="flex items-center text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 mr-1.5"></span> Normal Events
              </span>
              <span className="flex items-center text-red-400">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5"></span> Flagged Suspicious
              </span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="normalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="suspiciousGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="normalEvents" stroke="#06b6d4" fillOpacity={1} fill="url(#normalGrad)" />
                <Area type="monotone" dataKey="suspiciousEvents" stroke="#ef4444" fillOpacity={1} fill="url(#suspiciousGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity & Method Breakdown */}
        <div className="soc-card p-5 space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-white font-mono">ALERT SEVERITY DISTRIBUTION</h2>
            <p className="text-xs text-slate-400">Classification of active threat detections</p>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {severityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs">
            {severityDistribution.map(item => (
              <div key={item.name} className="flex items-center justify-between p-1.5 rounded bg-slate-900/60">
                <span className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300">{item.name}</span>
                </span>
                <span className="font-mono font-bold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Alerts & High-Risk Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Alerts Feed */}
        <div className="lg:col-span-2 soc-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white font-mono">RECENT SECURITY ALERTS</h2>
              <p className="text-xs text-slate-400">Triaged alerts generated by hybrid detection</p>
            </div>
            <button
              onClick={() => navigate('/security/threat-alerts')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-mono"
            >
              <span>View All Alerts</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/70 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Subject</th>
                  <th className="py-2.5 px-3">Alert Trigger</th>
                  <th className="py-2.5 px-3">Method</th>
                  <th className="py-2.5 px-3">Risk Score</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {recentAlerts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-6 text-center text-slate-500">
                      No security alerts recorded. System operating within baseline thresholds.
                    </td>
                  </tr>
                ) : (
                  recentAlerts.map(alert => (
                    <tr key={alert.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 px-3">
                        <SeverityBadge severity={alert.severity} />
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white">{alert.user_name}</div>
                        <div className="text-[10px] text-slate-400">{alert.department}</div>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate text-slate-300">
                        {alert.title}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[11px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                          {alert.detection_method}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-white">
                        {alert.risk_score}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => navigate('/security/threat-alerts')}
                          className="px-2 py-1 bg-slate-800 hover:bg-cyan-500 hover:text-black rounded text-[11px] text-slate-300 font-medium transition-colors"
                        >
                          Investigate
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* High Risk Accounts Leaderboard */}
        <div className="soc-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-white font-mono">TOP AT-RISK ACCOUNTS</h2>
              <p className="text-xs text-slate-400">Prioritized by composite dynamic score</p>
            </div>
            <button
              onClick={() => navigate('/security/employees')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-mono"
            >
              <span>Directory</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {topRiskyUsers.map((u, idx) => (
              <div
                key={u.id || idx}
                onClick={() => navigate(`/security/risk-analysis/${u.user_id}`)}
                className="p-3 rounded-lg bg-slate-900/50 border border-slate-800 hover:border-slate-700 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-white group-hover:text-cyan-400 transition-colors">
                      {u.full_name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">[{u.employee_code}]</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {u.department} • {u.job_title}
                  </div>
                  <div className="mt-1 flex items-center space-x-1.5 text-[10px]">
                    <span className="text-slate-500">Baseline Status:</span>
                    <span className={u.baseline_status === 'Anomalous' ? 'text-amber-400 font-semibold' : 'text-emerald-400'}>
                      {u.baseline_status}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <RiskGauge score={u.current_risk_score} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
