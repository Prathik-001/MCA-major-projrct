import React, { useState, useEffect } from 'react';
import ApiClient from '../api/client';
import SeverityBadge from '../components/SeverityBadge';
import { Sliders, CheckCircle2, Save, RotateCcw, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function RuleConfigurationPage() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingRule, setEditingRule] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const loadRules = async () => {
    try {
      const res = await ApiClient.getRules();
      setRules(res.rules || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleSaveRule = async (e) => {
    e.preventDefault();
    if (!editingRule) return;
    setSaving(true);
    setMessage('');
    try {
      await ApiClient.updateRule(editingRule.id, {
        threshold: editingRule.threshold,
        timeWindowMinutes: editingRule.time_window_minutes,
        severity: editingRule.severity,
        riskWeight: editingRule.risk_weight,
        isEnabled: editingRule.is_enabled
      });
      setMessage(`Rule '${editingRule.rule_name}' thresholds updated and audit-logged.`);
      setEditingRule(null);
      loadRules();
    } catch (err) {
      alert(`Save error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEnable = async (rule) => {
    try {
      await ApiClient.updateRule(rule.id, { isEnabled: !rule.is_enabled });
      loadRules();
    } catch (err) {
      alert(`Toggle failed: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-white flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <span>DETECTION RULE CONFIGURATION & THRESHOLD LAB</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Dynamic policy calibration for deterministic threat rules (experimental settings)
          </p>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
          Active Policies: <span className="text-cyan-400 font-bold">{rules.filter(r => r.is_enabled).length}</span> / {rules.length}
        </div>
      </div>

      {message && (
        <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg text-xs text-cyan-400 flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rules.map(rule => (
          <div
            key={rule.id}
            className={`soc-card p-5 border-l-4 transition-all ${
              !rule.is_enabled ? 'opacity-60 border-l-slate-600' :
              rule.severity === 'Critical' ? 'border-l-red-500' :
              rule.severity === 'High' ? 'border-l-orange-500' : 'border-l-amber-500'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-mono text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                    {rule.rule_code}
                  </span>
                  <SeverityBadge severity={rule.severity} />
                </div>
                <h3 className="font-bold text-sm text-white">{rule.rule_name}</h3>
              </div>

              {/* On/Off Toggle */}
              <button
                onClick={() => handleToggleEnable(rule)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${rule.is_enabled ? 'bg-cyan-500' : 'bg-slate-700'}`}
                title={rule.is_enabled ? 'Disable Rule' : 'Enable Rule'}
              >
                <div className={`w-4 h-4 rounded-full bg-black transition-transform ${rule.is_enabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed min-h-[36px]">{rule.description}</p>

            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800 text-xs font-mono">
              <div className="p-2 bg-slate-900 rounded">
                <span className="text-[10px] text-slate-500 block uppercase">Threshold</span>
                <span className="text-white font-bold">{rule.threshold}</span>
              </div>
              <div className="p-2 bg-slate-900 rounded">
                <span className="text-[10px] text-slate-500 block uppercase">Window</span>
                <span className="text-cyan-400 font-bold">{rule.time_window_minutes} mins</span>
              </div>
              <div className="p-2 bg-slate-900 rounded">
                <span className="text-[10px] text-slate-500 block uppercase">Risk Weight</span>
                <span className="text-amber-400 font-bold">+{rule.risk_weight}</span>
              </div>
            </div>

            <div className="mt-4 pt-2 flex items-center justify-end">
              <button
                onClick={() => setEditingRule({ ...rule })}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                Configure Thresholds
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Threshold Editing Modal */}
      {editingRule && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-lg w-full soc-card p-6 border-cyan-500/40">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold font-mono text-sm text-white">
                CALIBRATE: {editingRule.rule_name}
              </h3>
              <button onClick={() => setEditingRule(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveRule} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Trigger Event Threshold Count: <span className="text-cyan-400 font-mono font-bold">{editingRule.threshold}</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={editingRule.threshold}
                  onChange={(e) => setEditingRule({ ...editingRule, threshold: parseFloat(e.target.value) })}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Rolling Time Window: <span className="text-cyan-400 font-mono font-bold">{editingRule.time_window_minutes} minutes</span>
                </label>
                <input
                  type="range"
                  min="1"
                  max="120"
                  value={editingRule.time_window_minutes}
                  onChange={(e) => setEditingRule({ ...editingRule, time_window_minutes: parseInt(e.target.value, 10) })}
                  className="w-full accent-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Severity Rating</label>
                  <select
                    value={editingRule.severity}
                    onChange={(e) => setEditingRule({ ...editingRule, severity: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Risk Score Weight (1-50): <span className="text-amber-400 font-mono font-bold">+{editingRule.risk_weight}</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={editingRule.risk_weight}
                    onChange={(e) => setEditingRule({ ...editingRule, risk_weight: parseInt(e.target.value, 10) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Updating Policy...' : 'Save Rule Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
