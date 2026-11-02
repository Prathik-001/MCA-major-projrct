import React, { useState, useEffect } from 'react';
import ApiClient from '../api/client';
import {
  FileText,
  Shield,
  Download,
  Building,
  Clock,
  CheckCircle,
  ExternalLink,
  Target
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function ReportsAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await ApiClient.getAnalyticsReport();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return <div className="p-8 text-center text-slate-400 font-mono text-sm">Compiling Security Reports & Analytics...</div>;
  }

  const { departmentRisk = [], mitreMapping = [], incidentResolutionStats = {} } = data;

  const exportReportJson = () => {
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `UBA_Sentinel_Executive_Report_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-white flex items-center space-x-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            <span>EXECUTIVE REPORTS & MITRE ATT&CK INSIDER MATRIX</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Departmental risk indices, industry threat mappings, and incident resolution efficiency
          </p>
        </div>

        <button
          onClick={exportReportJson}
          className="px-3.5 py-1.5 bg-slate-900 border border-slate-700 hover:border-cyan-500 text-cyan-400 hover:text-white rounded-lg text-xs font-semibold flex items-center space-x-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export Executive Report (JSON)</span>
        </button>
      </div>

      {/* Resolution Efficiency Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="soc-card p-4">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Total Resolved Incidents</span>
          <div className="text-2xl font-mono font-bold text-white mt-1">
            {incidentResolutionStats.totalResolved || 0}
          </div>
          <span className="text-[10px] text-emerald-400">Cases cleared or contained</span>
        </div>
        <div className="soc-card p-4">
          <span className="text-[11px] font-mono text-slate-400 uppercase">False Positive Closed</span>
          <div className="text-2xl font-mono font-bold text-amber-400 mt-1">
            {incidentResolutionStats.falsePositiveCount || 0}
          </div>
          <span className="text-[10px] text-slate-400">Classified as benign deviations</span>
        </div>
        <div className="soc-card p-4">
          <span className="text-[11px] font-mono text-slate-400 uppercase">Mean Time to Resolve (MTTR)</span>
          <div className="text-2xl font-mono font-bold text-cyan-400 mt-1">
            {incidentResolutionStats.avgResolutionHours || 4.8} hrs
          </div>
          <span className="text-[10px] text-slate-400">Average triage-to-containment duration</span>
        </div>
      </div>

      {/* Departmental Risk Chart */}
      <div className="soc-card p-5">
        <h3 className="text-sm font-semibold font-mono text-white mb-1">
          ORGANIZATIONAL DEPARTMENTAL RISK PROFILES
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Composite average risk scores across enterprise business units
        </p>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={departmentRisk} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="department" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }} />
              <Bar dataKey="avgRisk" fill="#06b6d4" radius={[4, 4, 0, 0]} name="Average Risk Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MITRE ATT&CK for Insider Threats Mapping */}
      <div className="soc-card p-5 space-y-4">
        <div className="flex items-center space-x-2">
          <Target className="w-5 h-5 text-red-400" />
          <h3 className="text-sm font-semibold font-mono text-white">
            MITRE ATT&CK® FOR ENTERPRISE: INSIDER THREAT TACTICS MAPPING
          </h3>
        </div>
        <p className="text-xs text-slate-400">
          Standardized alignment of observed threat patterns with published adversary tactics and mitigations
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mitreMapping.map(t => (
            <div key={t.techniqueId} className="p-4 bg-slate-900/70 border border-slate-800 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                  {t.techniqueId}
                </span>
                <span className="text-[11px] font-mono text-slate-400">{t.tactic}</span>
              </div>
              <h4 className="font-bold text-white text-xs">{t.name}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                <span className="text-slate-500">Defensive Mitigation: </span>{t.mitigation}
              </p>
              <div className="text-[10px] text-cyan-400 font-mono pt-1">
                Triggered detections in environment: {t.detectionsCount} events
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
