import React, { useState, useEffect } from 'react';
import ApiClient from '../../../api/client';
import {
  Activity,
  Shield,
  Clock,
  Filter,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function ActivityMonitorApp({ currentUser }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [simulating, setSimulating] = useState(false);

  const handleTriggerSuspicious = async () => {
    if (!window.confirm('Simulate suspicious insider activity? This will immediately trigger the Threat Defense engine and auto-lock the workstation.')) return;
    setSimulating(true);
    try {
      await ApiClient.simulateSuspiciousActivity();
      loadMyActivity();
    } catch (err) {
      console.error('Simulation error:', err);
    } finally {
      setSimulating(false);
    }
  };

  const loadMyActivity = async () => {
    setLoading(true);
    try {
      // Backend enforces that employees only receive their own activity events
      const res = await ApiClient.getActivity({ limit: 100 });
      setActivities(res.events || []);
    } catch (err) {
      console.error('Failed to load activity:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMyActivity();
  }, []);

  const filtered = activities.filter(ev => {
    if (filterType !== 'ALL' && ev.event_type !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        (ev.event_type && ev.event_type.toLowerCase().includes(q)) ||
        (ev.resource_id && ev.resource_id.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full w-full bg-[#141721] text-slate-200 select-none overflow-hidden font-sans">
      {/* Header */}
      <div className="p-3 bg-[#111420] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold text-white">Workstation Activity Telemetry Monitor</span>
          <span className="text-[10px] text-slate-500 font-mono">({activities.length} Recorded Events)</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">All Event Types</option>
            <option value="LOGIN">Logins</option>
            <option value="FILE_DOWNLOAD">File Downloads</option>
            <option value="FILE_UPLOAD">File Uploads</option>
            <option value="EMAIL_SEND">Sent Emails</option>
            <option value="DOC_SAVE">Document Saves</option>
            <option value="CHAT_MESSAGE_SEND">Chat Messages</option>
            <option value="UNAUTHORIZED_ACCESS_ATTEMPT">Security Flags</option>
          </select>

          <button
            onClick={handleTriggerSuspicious}
            disabled={simulating}
            className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            title="Simulate a security anomaly to trigger auto-lock"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>{simulating ? 'Simulating...' : 'Simulate Threat'}</span>
          </button>

          <button
            onClick={loadMyActivity}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Transparency Banner */}
      <div className="p-3 bg-blue-950/30 border-b border-blue-900/30 flex items-center gap-3 text-xs text-blue-300">
        <Info className="w-4 h-4 text-blue-400 shrink-0" />
        <span>
          <strong>Privacy Disclosure:</strong> In accordance with corporate cybersecurity policies, activity inside this virtual workstation is recorded for anomaly detection and compliance auditing.
        </span>
      </div>

      {/* Activity Table */}
      <div className="flex-1 p-4 overflow-y-auto bg-[#0d1017]">
        <div className="w-full border border-slate-800/80 rounded-xl overflow-hidden bg-[#131724]">
          <div className="grid grid-cols-12 py-2.5 px-4 bg-slate-900/60 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            <span className="col-span-3">Timestamp</span>
            <span className="col-span-3">Event Type</span>
            <span className="col-span-4">Resource Target</span>
            <span className="col-span-2 text-right">Status</span>
          </div>

          <div className="divide-y divide-slate-800/60">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                {loading ? 'Retrieving telemetry...' : 'No activity records found.'}
              </div>
            ) : (
              filtered.map(ev => {
                const isFlagged = ev.is_suspicious;
                return (
                  <div
                    key={ev.id}
                    className={`grid grid-cols-12 py-2.5 px-4 text-xs items-center transition-colors ${
                      isFlagged ? 'bg-rose-950/20 hover:bg-rose-950/40' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <span className="col-span-3 text-slate-400 font-mono text-[11px]">
                      {new Date(ev.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                    </span>

                    <span className="col-span-3 font-semibold text-slate-200 flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isFlagged ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                      <span>{ev.event_type}</span>
                    </span>

                    <span className="col-span-4 text-slate-400 font-mono text-[11px] truncate" title={ev.resource_id}>
                      {ev.resource_id}
                    </span>

                    <span className="col-span-2 text-right">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        ev.status === 'SUCCESS' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {ev.status}
                      </span>
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
