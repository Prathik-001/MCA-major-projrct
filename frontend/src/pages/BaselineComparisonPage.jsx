import React, { useState, useEffect } from 'react';
import ApiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  BarChart3,
  RefreshCw,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Activity,
  ArrowRight
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function BaselineComparisonPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [comparisonData, setComparisonData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const uRes = await ApiClient.getUsers();
        const list = uRes.users || [];
        setUsers(list);
        if (list.length > 0) {
          // Sarah Chen or first user
          const defaultUser = list.find(u => u.employee_code === 'FIN-104') || list[0];
          setSelectedUserId(defaultUser.user_id);
        }
      } catch {
        if (currentUser) setSelectedUserId(currentUser.id);
      }
    }
    init();
  }, []);

  const loadComparison = async (uid) => {
    if (!uid) return;
    setLoading(true);
    try {
      const data = await ApiClient.getUserBaseline(uid);
      setComparisonData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUserId) {
      loadComparison(selectedUserId);
    }
  }, [selectedUserId]);

  const handleRecalculate = async () => {
    if (!selectedUserId) return;
    setRecalculating(true);
    setActionMessage('');
    try {
      const res = await ApiClient.recalculateBaseline(selectedUserId);
      setActionMessage(res.updated ? 'Baseline successfully recalculated using eligible trusted activity.' : `Notice: ${res.reason}`);
      loadComparison(selectedUserId);
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    } finally {
      setRecalculating(false);
    }
  };

  const handleToggleLock = async () => {
    if (!comparisonData?.baseline) return;
    const currentLock = comparisonData.baseline.is_baseline_locked;
    try {
      await ApiClient.lockBaseline(selectedUserId, !currentLock);
      setActionMessage(`Baseline lock status toggled to ${!currentLock ? 'LOCKED' : 'UNLOCKED'}.`);
      loadComparison(selectedUserId);
    } catch (err) {
      setActionMessage(`Error: ${err.message}`);
    }
  };

  const baseline = comparisonData?.baseline;
  const comp = comparisonData?.comparison;

  // Chart data comparing Baseline Mean vs Recent Observed
  const barChartData = [
    {
      metric: 'Daily Downloads',
      Baseline: baseline?.avg_daily_downloads || 0,
      Observed: comp?.recentDownloads || 0
    },
    {
      metric: 'Modifications',
      Baseline: baseline?.avg_daily_modifications || 0,
      Observed: comp?.recentModifications || 0
    },
    {
      metric: 'Unique Resources',
      Baseline: baseline?.avg_unique_resources_accessed || 0,
      Observed: comp?.uniqueResourcesCount || 0
    },
    {
      metric: 'Off-Hours Actions',
      Baseline: 0,
      Observed: comp?.offHoursCount || 0
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-white flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <span>DYNAMIC USER BEHAVIOURAL BASELINE COMPARISON</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical deviation analytics (Z-Score) contrasting recent 24h activity with trusted historical norms
          </p>
        </div>

        {currentUser?.role !== 'Employee' && users.length > 0 && (
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-400 font-mono">Monitored Subject:</span>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-md py-1.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-semibold"
            >
              {users.map(u => (
                <option key={u.user_id} value={u.user_id}>
                  {u.full_name} ({u.employee_code} - {u.department})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {actionMessage && (
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs text-cyan-400 flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Baseline Action Bar */}
      {currentUser?.role === 'Administrator' && baseline && (
        <div className="soc-card p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="font-mono text-slate-400">Baseline State:</span>
            <span className={`px-2 py-0.5 rounded font-mono font-semibold border ${
              baseline.is_baseline_locked
                ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}>
              {baseline.is_baseline_locked ? 'LOCKED (Drift Protected)' : 'DYNAMIC (Auto-Learning)'}
            </span>
            <span className="text-slate-500 text-[11px] ml-2">
              Sample Period: {baseline.sample_period_days} days • Last Calculated: {new Date(baseline.last_calculated_at).toLocaleDateString()}
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleToggleLock}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-300 flex items-center space-x-1.5 transition-colors"
            >
              {baseline.is_baseline_locked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>{baseline.is_baseline_locked ? 'Unlock Baseline' : 'Lock Baseline'}</span>
            </button>

            <button
              onClick={handleRecalculate}
              disabled={recalculating || baseline.is_baseline_locked}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
              <span>{recalculating ? 'Recalculating...' : 'Recalculate Clean Baseline'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Comparison Chart */}
      <div className="soc-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white font-mono">
              OBSERVED 24-HOUR VOLUME VS ESTABLISHED HISTORICAL BASELINE
            </h2>
            <p className="text-xs text-slate-400">
              Quantitative comparison revealing anomalous surge behaviors
            </p>
          </div>
          <div className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded border border-cyan-500/20">
            Anomaly Impact Score: {comp?.baselineAnomalyScore || 0} / 100
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="metric" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="Baseline" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Observed" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Statistical Deviations Explanation Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold font-mono text-white">
          STATISTICAL DEVIATION BREAKDOWN & EXPLANATION
        </h3>

        {!comp?.deviations || comp.deviations.length === 0 ? (
          <div className="soc-card p-6 text-center text-slate-500 text-xs flex items-center justify-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>No abnormal statistical deviations detected. Observed operational telemetry is strictly within ±2.0σ of user baseline.</span>
          </div>
        ) : (
          comp.deviations.map((dev, i) => (
            <div
              key={i}
              className={`soc-card p-4 border-l-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                dev.severity === 'CRITICAL' ? 'border-l-red-500' :
                dev.severity === 'HIGH' ? 'border-l-orange-500' : 'border-l-amber-500'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-white text-xs">{dev.metric}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    dev.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                    dev.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                    'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {dev.severity} ({dev.zScore > 0 ? `+${dev.zScore}σ` : `${dev.zScore}σ`})
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">{dev.explanation}</p>
              </div>

              <div className="flex items-center space-x-4 shrink-0 text-xs font-mono bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Baseline Avg</span>
                  <span className="text-cyan-400 font-bold">{dev.baselineAvg}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-slate-600" />
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase">Observed</span>
                  <span className="text-red-400 font-bold">{dev.observedValue}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
