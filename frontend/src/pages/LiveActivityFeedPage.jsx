import React, { useState, useEffect } from 'react';
import ApiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import SeverityBadge from '../components/SeverityBadge';
import {
  Activity,
  Filter,
  Search,
  RefreshCw,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Terminal
} from 'lucide-react';

export default function LiveActivityFeedPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [search, setSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [suspiciousOnly, setSuspiciousOnly] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const loadEvents = async () => {
    try {
      const params = {};
      if (eventTypeFilter) params.eventType = eventTypeFilter;
      if (suspiciousOnly) params.isSuspicious = 'true';
      if (search) params.search = search;
      params.limit = 60;

      const res = await ApiClient.getActivity(params);
      setEvents(res.events || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
    let interval = null;
    if (autoRefresh) {
      interval = setInterval(loadEvents, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, eventTypeFilter, suspiciousOnly, search]);

  return (
    <div className="p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>LIVE ACTIVITY EVENT TELEMETRY STREAM</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable server-intercepted event logging with continuous hybrid risk scoring
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono border flex items-center space-x-2 transition-all ${
              autoRefresh
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-slate-900 border-slate-700 text-slate-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>Stream: {autoRefresh ? '4s LIVE' : 'PAUSED'}</span>
          </button>

          <button
            onClick={loadEvents}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-cyan-400"
            title="Refresh Now"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="soc-card p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-56">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user, resource, IP..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-md text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-md py-1.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="">All Event Types</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="FAILED_LOGIN">FAILED_LOGIN</option>
            <option value="FILE_DOWNLOAD">FILE_DOWNLOAD</option>
            <option value="PAGE_ACCESS">PAGE_ACCESS</option>
            <option value="RECORD_MODIFY">RECORD_MODIFY</option>
            <option value="ACCESS_DENIED">ACCESS_DENIED</option>
          </select>

          <label className="flex items-center space-x-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={suspiciousOnly}
              onChange={(e) => setSuspiciousOnly(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0"
            />
            <span className="font-semibold text-amber-400">Suspicious Anomalies Only</span>
          </label>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Loaded <span className="text-white font-bold">{events.length}</span> events
        </div>
      </div>

      {/* Events Table */}
      <div className="soc-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp (UTC)</th>
                <th className="py-2.5 px-3">User</th>
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">Target Resource</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Source IP</th>
                <th className="py-2.5 px-3">Threat Flag</th>
                <th className="py-2.5 px-3">Score</th>
                <th className="py-2.5 px-3 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {events.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-8 text-center text-slate-500">
                    No activity telemetry events found matching current criteria.
                  </td>
                </tr>
              ) : (
                events.map(evt => {
                  const isAnom = evt.is_suspicious || (evt.risk_score && evt.risk_score >= 45);
                  return (
                    <tr
                      key={evt.id}
                      className={`hover:bg-slate-900/50 transition-colors ${isAnom ? 'bg-red-500/5' : ''}`}
                    >
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-medium text-slate-200">{evt.user_email}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono border ${
                          evt.event_type === 'FILE_DOWNLOAD' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                          evt.event_type === 'ACCESS_DENIED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                          evt.event_type === 'FAILED_LOGIN' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                          evt.event_type === 'RECORD_MODIFY' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {evt.event_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] max-w-xs truncate text-slate-300">
                        {evt.resource_id}
                      </td>
                      <td className="py-2.5 px-3">
                        {evt.status === 'SUCCESS' ? (
                          <span className="inline-flex items-center text-emerald-400 text-[11px]">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-red-400 text-[11px]">
                            <XCircle className="w-3 h-3 mr-1" /> FAIL
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                        {evt.ip_address}
                      </td>
                      <td className="py-2.5 px-3">
                        {evt.is_suspicious ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] bg-red-500/15 text-red-400 border border-red-500/30 font-semibold animate-pulse">
                            SUSPICIOUS
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Benign</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-white">
                        <span className={evt.risk_score >= 60 ? 'text-red-400' : (evt.risk_score >= 30 ? 'text-amber-400' : 'text-slate-400')}>
                          {evt.risk_score || 0}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedEvent(evt)}
                          className="p-1 rounded bg-slate-800 hover:bg-cyan-500 hover:text-black text-slate-300 transition-colors"
                          title="Inspect Telemetry Payload"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw Event & Anomaly Inspection Drawer */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full soc-card p-6 border-cyan-500/40 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold font-mono text-sm text-white">
                  TELEMETRY EVENT INSPECTOR [{selectedEvent.id.slice(0, 8)}]
                </h3>
              </div>
              <button onClick={() => setSelectedEvent(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-900 rounded-lg">
                <span className="text-slate-500 block text-[10px] uppercase font-mono">User Email</span>
                <span className="text-white font-medium">{selectedEvent.user_email}</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg">
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Event Type / Action</span>
                <span className="text-cyan-400 font-mono font-semibold">{selectedEvent.event_type} / {selectedEvent.action}</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg">
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Resource URI</span>
                <span className="text-white font-mono">{selectedEvent.resource_id}</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-lg">
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Composite Risk Score</span>
                <span className="text-amber-400 font-mono font-bold text-sm">{selectedEvent.risk_score} / 100</span>
              </div>
            </div>

            {/* Explanation Factors if Flagged */}
            {selectedEvent.detection_explanation && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs">
                <p className="font-bold text-red-400 font-mono mb-1.5 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                  <span>Threat Engine Contributing Factors</span>
                </p>
                <div className="space-y-1.5 text-slate-300">
                  {Array.isArray(selectedEvent.detection_explanation.factors) ? (
                    selectedEvent.detection_explanation.factors.map((f, i) => (
                      <div key={i} className="flex items-start space-x-2">
                        <span className="text-red-400">•</span>
                        <span>{f.explanation || f.name}</span>
                      </div>
                    ))
                  ) : (
                    <pre className="text-[11px] text-slate-300 whitespace-pre-wrap">
                      {JSON.stringify(selectedEvent.detection_explanation, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            )}

            {/* Full JSON Metadata */}
            <div className="mt-4">
              <span className="text-slate-400 block text-[11px] font-mono mb-1">Full Telemetry Payload (JSON)</span>
              <pre className="p-3 bg-slate-950 rounded-lg text-[11px] text-cyan-300 font-mono overflow-x-auto border border-slate-800">
                {JSON.stringify(selectedEvent, null, 2)}
              </pre>
            </div>

            <div className="mt-5 text-right">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
