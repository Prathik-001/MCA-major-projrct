import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import SeverityBadge from '../components/SeverityBadge';
import RiskGauge from '../components/RiskGauge';
import {
  User,
  ShieldAlert,
  Clock,
  HardDrive,
  Network,
  Activity,
  Calendar,
  AlertTriangle,
  FileCheck2,
  Lock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

export default function UserRiskProfilePage() {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [allUsers, setAllUsers] = useState([]);
  const [targetId, setTargetId] = useState(userId || '');

  useEffect(() => {
    async function initUsers() {
      try {
        const uList = await ApiClient.getUsers();
        setAllUsers(uList.users || []);
        if (!targetId && uList.users && uList.users.length > 0) {
          // Default to Sarah Chen (high risk) or first user
          const highRisk = uList.users.find(u => u.employee_code === 'FIN-104') || uList.users[0];
          setTargetId(highRisk.user_id);
        }
      } catch {
        // Fallback to current user if employee
        if (currentUser) setTargetId(currentUser.id);
      }
    }
    initUsers();
  }, []);

  useEffect(() => {
    async function loadProfile() {
      if (!targetId) return;
      setLoading(true);
      try {
        const data = await ApiClient.getUserProfile(targetId);
        setProfileData(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [targetId]);

  if (loading || !profileData) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono text-sm">
        Compiling User Behavioral Threat Dossier...
      </div>
    );
  }

  const { user, monitored, baseline, recentEvents = [] } = profileData;

  // Radar feature dimensions
  const radarData = [
    { subject: 'Download Vol.', A: Math.min(100, (baseline?.avg_daily_downloads || 5) * 8), fullMark: 100 },
    { subject: 'Off-Hours', A: monitored?.risk_level === 'High' ? 85 : 20, fullMark: 100 },
    { subject: 'Access Denied', A: monitored?.risk_level === 'High' ? 65 : 10, fullMark: 100 },
    { subject: 'Modifications', A: Math.min(100, (baseline?.avg_daily_modifications || 8) * 4), fullMark: 100 },
    { subject: 'Resource Entropy', A: Math.min(100, (baseline?.avg_unique_resources_accessed || 7) * 9), fullMark: 100 },
    { subject: 'Anomaly Score', A: monitored?.current_risk_score || 10, fullMark: 100 }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Top Header & Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-white flex items-center space-x-2">
            <User className="w-5 h-5 text-cyan-400" />
            <span>USER BEHAVIORAL THREAT DOSSIER</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Deep-dive multi-dimensional telemetry, established baselines, and risk trajectory
          </p>
        </div>

        {currentUser?.role !== 'Employee' && allUsers.length > 0 && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-mono">Select Monitored User:</span>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-md py-1.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-semibold"
            >
              {allUsers.map(u => (
                <option key={u.user_id} value={u.user_id}>
                  {u.full_name} ({u.employee_code} - {u.department})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* User Header Profile Card */}
      <div className="soc-card p-6 border-slate-700 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-cyan-500/20">
            {user.full_name ? user.full_name.charAt(0) : 'U'}
          </div>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-bold text-white">{user.full_name}</h2>
              <SeverityBadge severity={monitored?.risk_level || 'Low'} />
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono border ${
                monitored?.account_status === 'Suspended' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
              }`}>
                {monitored?.account_status || 'Active'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              <span className="text-cyan-400 font-mono">{monitored?.employee_code}</span> • {monitored?.job_title} • Department: <span className="text-white font-medium">{user.department}</span>
            </p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
              Email: {user.email} • Last Active: {new Date(monitored?.last_active_at || Date.now()).toLocaleString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-6 border-t lg:border-t-0 lg:border-l border-slate-800 pt-4 lg:pt-0 lg:pl-6">
          <RiskGauge score={monitored?.current_risk_score} size="lg" />
          <div className="text-xs space-y-1">
            <div className="text-slate-400">Baseline Health:</div>
            <div className={`font-mono font-semibold ${monitored?.baseline_status === 'Anomalous' ? 'text-amber-400' : 'text-emerald-400'}`}>
              {monitored?.baseline_status || 'Established'}
            </div>
            <button
              onClick={() => navigate('/baselines')}
              className="text-[11px] text-cyan-400 hover:underline flex items-center space-x-1"
            >
              <span>Inspect Baselines</span>
            </button>
          </div>
        </div>
      </div>

      {/* Analytics & Radar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Multi-Dimensional Threat Radar */}
        <div className="soc-card p-5">
          <h3 className="text-sm font-semibold font-mono text-white mb-1">
            MULTI-DIMENSIONAL BEHAVIORAL VECTORS
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Comparison across key threat feature axes (0-100 severity scaling)
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis stroke="#475569" angle={30} domain={[0, 100]} />
                <Radar name="Threat Vector" dataKey="A" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.4} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Established Baseline Metrics */}
        <div className="soc-card p-5 space-y-4">
          <h3 className="text-sm font-semibold font-mono text-white">
            ESTABLISHED STATISTICAL BASELINE PARAMETERS
          </h3>
          <p className="text-xs text-slate-400">
            Computed over historical eligible operations (excludes flagged insider actions)
          </p>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Normal Daily Downloads (μ ± σ)</span>
              <span className="font-mono text-base font-bold text-white mt-1 block">
                {baseline?.avg_daily_downloads} <span className="text-xs text-slate-400">± {baseline?.std_daily_downloads}</span>
              </span>
              <span className="text-[10px] text-slate-500">Threshold: &gt; 20 in 15m</span>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Daily Record Modifications</span>
              <span className="font-mono text-base font-bold text-white mt-1 block">
                {baseline?.avg_daily_modifications} <span className="text-xs text-slate-400">± {baseline?.std_daily_modifications}</span>
              </span>
              <span className="text-[10px] text-slate-500">Sabotage Threshold: &gt; 25/15m</span>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Operating Business Hours</span>
              <span className="font-mono text-base font-bold text-cyan-400 mt-1 block">
                {String(baseline?.work_hours_start || 9).padStart(2, '0')}:00 - {String(baseline?.work_hours_end || 18).padStart(2, '0')}:00
              </span>
              <span className="text-[10px] text-slate-500">Off-hours triggers challenge</span>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Unique Resources / Day</span>
              <span className="font-mono text-base font-bold text-white mt-1 block">
                {baseline?.avg_unique_resources_accessed} <span className="text-xs text-slate-400">± {baseline?.std_unique_resources_accessed}</span>
              </span>
              <span className="text-[10px] text-slate-500">Reconnaissance detection</span>
            </div>
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 block text-[11px] mb-1 font-mono">Recognized Network Locations (IPs)</span>
            <div className="flex flex-wrap gap-2">
              {(baseline?.typical_ips || []).map((ip, i) => (
                <span key={i} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-[11px] text-emerald-400">
                  {ip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* User's Recent Activity History */}
      <div className="soc-card p-5">
        <h3 className="text-sm font-semibold font-mono text-white mb-3">
          RECENT EVENT TELEMETRY FOR {user.full_name}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Type</th>
                <th className="py-2.5 px-3">Resource</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Source IP</th>
                <th className="py-2.5 px-3">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-sans">
              {recentEvents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-slate-500">
                    No recent activities recorded for this user.
                  </td>
                </tr>
              ) : (
                recentEvents.map(evt => (
                  <tr key={evt.id} className="hover:bg-slate-900/40">
                    <td className="py-2 px-3 font-mono text-slate-400">{new Date(evt.timestamp).toLocaleString()}</td>
                    <td className="py-2 px-3 font-mono text-cyan-400">{evt.event_type}</td>
                    <td className="py-2 px-3 font-mono text-slate-300 max-w-xs truncate">{evt.resource_id}</td>
                    <td className="py-2 px-3">
                      <span className={evt.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}>{evt.status}</span>
                    </td>
                    <td className="py-2 px-3 font-mono text-slate-400">{evt.ip_address}</td>
                    <td className="py-2 px-3 font-mono font-bold text-white">{evt.risk_score || 0}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
