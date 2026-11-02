import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ApiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import SeverityBadge from '../components/SeverityBadge';
import {
  ShieldAlert,
  MessageSquare,
  Clock,
  User,
  CheckCircle,
  FileText,
  AlertTriangle,
  Send,
  Lock,
  Plus
} from 'lucide-react';

export default function IncidentDetailPage() {
  const { incidentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [incidents, setIncidents] = useState([]);
  const [activeIncidentId, setActiveIncidentId] = useState(incidentId || '');
  const [incidentData, setIncidentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [status, setStatus] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [containment, setContainment] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [savingStatus, setSavingStatus] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Load incidents list
  useEffect(() => {
    async function fetchList() {
      try {
        const res = await ApiClient.getIncidents();
        setIncidents(res.incidents || []);
        if (!activeIncidentId && res.incidents && res.incidents.length > 0) {
          setActiveIncidentId(res.incidents[0].id);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchList();
  }, []);

  // 2. Load active incident details
  useEffect(() => {
    async function loadIncident() {
      if (!activeIncidentId) return;
      try {
        const data = await ApiClient.getIncident(activeIncidentId);
        setIncidentData(data);
        setStatus(data.incident.status);
        setRootCause(data.incident.root_cause || '');
        setContainment(data.incident.containment_action || '');
      } catch (err) {
        console.error(err);
      }
    }
    loadIncident();
  }, [activeIncidentId]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSubmittingNote(true);
    try {
      const res = await ApiClient.addIncidentNote(activeIncidentId, newNote);
      setIncidentData(prev => ({
        ...prev,
        notes: [...(prev?.notes || []), res.note]
      }));
      setNewNote('');
      setMessage('Investigation note committed to case file.');
    } catch (err) {
      alert(`Failed to add note: ${err.message}`);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleUpdateIncident = async (e) => {
    e.preventDefault();
    setSavingStatus(true);
    try {
      await ApiClient.updateIncidentStatus(activeIncidentId, {
        status,
        rootCause,
        containmentAction: containment,
        leadInvestigator: user?.full_name
      });
      setMessage('Incident status and containment settings updated.');
      const updated = await ApiClient.getIncident(activeIncidentId);
      setIncidentData(updated);
    } catch (err) {
      alert(`Update failed: ${err.message}`);
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400 font-mono text-sm">Loading SOC Incidents...</div>;
  }

  const currentInc = incidentData?.incident;
  const notes = incidentData?.notes || [];
  const evidence = incidentData?.evidenceEvents || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-white flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <span>INCIDENT INVESTIGATION & FORENSIC CASE FILE</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Formal incident triage, investigator evidence locker, root cause analysis, and containment actions
          </p>
        </div>

        {incidents.length > 0 && (
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-mono">Select Incident:</span>
            <select
              value={activeIncidentId}
              onChange={(e) => setActiveIncidentId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-md py-1.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-semibold"
            >
              {incidents.map(inc => (
                <option key={inc.id} value={inc.id}>
                  {inc.incident_number}: {inc.title.slice(0, 40)}...
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {message && (
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs text-cyan-400 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {currentInc ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Case File Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Incident Summary Card */}
            <div className="soc-card p-6 border-slate-700 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <span className="font-mono text-cyan-400 font-bold text-sm bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/20">
                    {currentInc.incident_number}
                  </span>
                  <SeverityBadge severity={currentInc.severity} />
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    currentInc.status === 'New' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                    currentInc.status === 'Investigating' ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' :
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  }`}>
                    {currentInc.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Opened: {new Date(currentInc.created_at).toLocaleString()}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-bold text-white">{currentInc.title}</h2>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{currentInc.description}</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Subject</span>
                  <span className="text-white font-medium">{currentInc.user_name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Lead Investigator</span>
                  <span className="text-cyan-400 font-medium">{currentInc.lead_investigator || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Containment Status</span>
                  <span className="text-amber-400 font-medium">{currentInc.containment_action || 'None'}</span>
                </div>
              </div>
            </div>

            {/* Evidence Locker Timeline */}
            <div className="soc-card p-5 space-y-3">
              <h3 className="text-sm font-semibold font-mono text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>FORENSIC EVIDENCE LOCKER (ASSOCIATED USER TELEMETRY)</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2 px-3">Timestamp</th>
                      <th className="py-2 px-3">Action</th>
                      <th className="py-2 px-3">Resource Target</th>
                      <th className="py-2 px-3">Status</th>
                      <th className="py-2 px-3">Risk Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-sans">
                    {evidence.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-4 text-center text-slate-500">No telemetry evidence attached.</td>
                      </tr>
                    ) : (
                      evidence.map(evt => (
                        <tr key={evt.id} className="hover:bg-slate-900/40">
                          <td className="py-2 px-3 font-mono text-slate-400">{new Date(evt.timestamp).toLocaleTimeString()}</td>
                          <td className="py-2 px-3 font-mono text-cyan-400">{evt.event_type}</td>
                          <td className="py-2 px-3 font-mono text-slate-300 max-w-xs truncate">{evt.resource_id}</td>
                          <td className="py-2 px-3">
                            <span className={evt.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}>{evt.status}</span>
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-white">{evt.risk_score || 0}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Investigation Notes & Timeline */}
            <div className="soc-card p-5 space-y-4">
              <h3 className="text-sm font-semibold font-mono text-white flex items-center space-x-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>INVESTIGATOR CASE NOTES & TIMELINE</span>
              </h3>

              <div className="space-y-3">
                {notes.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No notes logged yet. Add initial assessment below.</p>
                ) : (
                  notes.map((noteItem, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-400 text-[11px]">
                        <span className="font-semibold text-cyan-400">{noteItem.author_name}</span>
                        <span className="font-mono">{new Date(noteItem.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-slate-200 leading-relaxed">{noteItem.note_text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} className="space-y-2 pt-2 border-t border-slate-800">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record investigation findings, interview outcomes, or forensic analysis..."
                  rows="2"
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={submittingNote || !newNote.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold text-xs flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingNote ? 'Saving...' : 'Add Case Note'}</span>
                </button>
              </form>
            </div>
          </div>

          {/* Incident Management Side Controls */}
          <div className="soc-card p-5 space-y-5 h-fit">
            <h3 className="text-sm font-semibold font-mono text-white">CASE DISPOSITION CONTROLS</h3>

            <form onSubmit={handleUpdateIncident} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Incident Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="New">New (Pending Assignment)</option>
                  <option value="Investigating">Investigating (Active Inquiry)</option>
                  <option value="Resolved">Resolved (Mitigated / Cleared)</option>
                  <option value="False Positive">False Positive (Benign Workload)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Containment Action</label>
                <select
                  value={containment}
                  onChange={(e) => setContainment(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="None">None (Observation Mode)</option>
                  <option value="Enhanced Telemetry">Enhanced Telemetry Monitoring</option>
                  <option value="Session Revoked">Active Session Revoked</option>
                  <option value="Account Suspended">Account Temporarily Suspended</option>
                  <option value="Access Restricted to Critical Vaults">Access Restricted to Critical Vaults</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Root Cause & Summary Findings</label>
                <textarea
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                  placeholder="Summarize root cause: intentional exfiltration, policy misunderstanding, account compromise, or false alarm..."
                  rows="4"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingStatus}
                className="w-full py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg text-xs transition-colors shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {savingStatus ? 'Saving Changes...' : 'Update Incident Disposition'}
              </button>
            </form>

            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
              <div className="font-semibold text-slate-300 font-mono">Response Protocol:</div>
              <p>Every status adjustment or containment decision is cryptographically recorded into the immutable append-only audit chain with operator identity.</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="soc-card p-12 text-center text-slate-500 text-xs">
          No security incidents active. All security alerts are currently in non-escalated status.
        </div>
      )}
    </div>
  );
}
