import React, { useState, useEffect } from 'react';
import ApiClient from '../api/client';
import SeverityBadge from '../components/SeverityBadge';
import RiskGauge from '../components/RiskGauge';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileQuestion,
  ExternalLink,
  MessageSquare
} from 'lucide-react';

export default function AlertsCenterPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState('Investigating');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const loadAlerts = async () => {
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (severityFilter) params.severity = severityFilter;
      const res = await ApiClient.getAlerts(params);
      setAlerts(res.alerts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [statusFilter, severityFilter]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedAlert) return;
    setUpdating(true);
    try {
      await ApiClient.updateAlertStatus(selectedAlert.id, {
        status: statusUpdate,
        investigatorNote: note
      });
      setSelectedAlert(null);
      setNote('');
      loadAlerts();
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-white flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span>SUSPICIOUS THREAT ALERTS & TRIAGE CENTER</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Automated alerts prioritized by dynamic risk engine with transparent factor breakdown
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-3 text-xs">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-md py-1.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-md py-1.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Investigating">Investigating</option>
            <option value="Resolved">Resolved</option>
            <option value="False Positive">False Positive</option>
          </select>
        </div>
      </div>

      {/* Alerts Grid */}
      <div className="grid grid-cols-1 gap-4">
        {alerts.length === 0 ? (
          <div className="soc-card p-12 text-center text-slate-500 text-xs">
            No alerts found matching selected criteria. The system is operating securely within baseline thresholds.
          </div>
        ) : (
          alerts.map(alert => (
            <div
              key={alert.id}
              className={`soc-card p-5 border-l-4 transition-all ${
                alert.severity === 'Critical' ? 'border-l-red-500' :
                alert.severity === 'High' ? 'border-l-orange-500' :
                alert.severity === 'Medium' ? 'border-l-amber-500' : 'border-l-blue-500'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={alert.severity} />
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      {alert.detection_method}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      alert.status === 'New' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                      alert.status === 'Investigating' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                      alert.status === 'False Positive' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                      'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}>
                      {alert.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(alert.created_at).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white tracking-wide">{alert.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">{alert.explanation}</p>

                  {/* Affected resources */}
                  {alert.affected_resources && alert.affected_resources.length > 0 && (
                    <div className="flex items-center space-x-2 pt-1 text-xs">
                      <span className="text-slate-400">Target Resources:</span>
                      {alert.affected_resources.map((res, i) => (
                        <span key={i} className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                          {res}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Transparent Contributing Factors */}
                  {alert.contributing_factors && alert.contributing_factors.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[11px] font-mono font-semibold text-slate-400 mb-1">
                        Explainable Factor Breakdown:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {alert.contributing_factors.map((f, i) => (
                          <div key={i} className="text-[11px] bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded text-slate-300 flex items-center space-x-1.5">
                            <span className="text-amber-400 font-bold">+{f.weight || 20}</span>
                            <span>{f.factor || f.name}</span>
                            {f.value && <span className="text-slate-500 font-mono">({f.value})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Score & Triage CTA */}
                <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0 pt-2 md:pt-0">
                  <RiskGauge score={alert.risk_score} />
                  <button
                    onClick={() => {
                      setSelectedAlert(alert);
                      setStatusUpdate(alert.status);
                    }}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-cyan-500 hover:text-black text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Triage Alert</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Triage & Resolution Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full soc-card p-6 border-cyan-500/40">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold font-mono text-sm text-white">
                TRIAGE & RESOLUTION: {selectedAlert.title}
              </h3>
              <button onClick={() => setSelectedAlert(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleUpdateStatus} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Investigation Disposition Status</label>
                <select
                  value={statusUpdate}
                  onChange={(e) => setStatusUpdate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Investigating">Investigating (Under Active Analyst Review)</option>
                  <option value="Resolved">Resolved (Mitigated / Confirmed Authorized)</option>
                  <option value="False Positive">False Positive (Benign Behavioral Deviation)</option>
                  <option value="New">Revert to New</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Analyst Investigation Note</label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Record evidence findings, department manager consultation, or containment decisions..."
                  rows="3"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedAlert(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold transition-colors disabled:opacity-50"
                >
                  {updating ? 'Saving...' : 'Commit Status Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
