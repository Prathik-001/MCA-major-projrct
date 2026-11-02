import React, { useState, useEffect } from 'react';
import ApiClient from '../api/client';
import {
  Flame,
  Play,
  FileSpreadsheet,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Database,
  Cpu,
  Shield,
  Layers,
  Terminal
} from 'lucide-react';

export default function SettingsSimulationPage() {
  const [users, setUsers] = useState([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [simulating, setSimulating] = useState(false);
  const [simulationLog, setSimulationLog] = useState([]);
  const [certImporting, setCertImporting] = useState(false);

  useEffect(() => {
    async function loadUsers() {
      try {
        const res = await ApiClient.getUsers();
        setUsers(res.users || []);
        if (res.users && res.users.length > 0) {
          // Sarah Chen or first user
          const sarah = res.users.find(u => u.employee_code === 'FIN-104') || res.users[0];
          setTargetUserId(sarah.user_id);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadUsers();
  }, []);

  const handleTriggerScenario = async (scenarioKey, label) => {
    setSimulating(true);
    try {
      const res = await ApiClient.triggerScenario(scenarioKey, targetUserId);
      setSimulationLog(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          scenario: label,
          events: res.generatedEventsCount,
          alerts: res.alertsTriggered,
          incidents: res.incidentsCreated,
          user: res.targetUser?.name || 'Subject'
        },
        ...prev
      ]);
    } catch (err) {
      alert(`Simulation failed: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const handleCertImport = async () => {
    setCertImporting(true);
    try {
      const res = await ApiClient.importCertData(targetUserId);
      setSimulationLog(prev => [
        {
          timestamp: new Date().toLocaleTimeString(),
          scenario: 'CERT r4.2 Benchmark Ingestion',
          events: res.recordsCount,
          alerts: res.alertsTriggered,
          incidents: res.incidentsCreated,
          user: 'CERT Test Subject (ACM2278)'
        },
        ...prev
      ]);
    } catch (err) {
      alert(`CERT import failed: ${err.message}`);
    } finally {
      setCertImporting(false);
    }
  };

  const attackScenarios = [
    {
      key: 'SCENARIO_BRUTE_FORCE',
      title: 'Brute-Force Authentication Burst',
      desc: 'Simulates 6 consecutive rapid failed logins from an untrusted IP address to test brute-force rule and rate limiting.',
      severity: 'High',
      tag: 'T1078'
    },
    {
      key: 'SCENARIO_DATA_EXFILTRATION',
      title: 'Mass Confidential Data Exfiltration',
      desc: 'Simulates bulk download of 25 sensitive documents (M&A financials, employee salaries, client PII) in 2 minutes.',
      severity: 'Critical',
      tag: 'T1048'
    },
    {
      key: 'SCENARIO_UNAUTHORIZED_PROBING',
      title: 'Systematic Unauthorized Resource Probing',
      desc: 'Simulates 6 sequential 403 Access Denied rejections against restricted admin secrets, HSM keys, and payroll endpoints.',
      severity: 'Medium',
      tag: 'T1083'
    },
    {
      key: 'SCENARIO_OFF_HOURS_SURGE',
      title: 'Off-Hours High Privilege Modification',
      desc: 'Simulates employee operational requests at 02:45 AM local time, outside normal shift windows (09:00 - 18:00).',
      severity: 'Medium',
      tag: 'T1078'
    },
    {
      key: 'SCENARIO_MASS_RECORD_MODIFICATION',
      title: 'High-Volume Database Record Sabotage',
      desc: 'Simulates 30 rapid database customer record deletions/modifications indicative of an angry or departing insider.',
      severity: 'Critical',
      tag: 'T1565'
    },
    {
      key: 'SCENARIO_NORMAL_ACTIVITY',
      title: 'Routine Benign Employee Operations',
      desc: 'Generates ordinary daily workflow activities (routine login, reading task board, standard documentation download).',
      severity: 'Low',
      tag: 'Benign'
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold font-mono text-white flex items-center space-x-2">
          <Flame className="w-5 h-5 text-amber-400" />
          <span>THREAT LAB: ATTACK SIMULATIONS & CERT DATASET PIPELINE</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Execute controlled research scenarios against the local testbed to observe real-time hybrid detection & alert creation
        </p>
      </div>

      {/* Target User Selector */}
      <div className="soc-card p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 font-mono">Target Simulation Subject:</span>
          <select
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-md py-1.5 px-3 text-xs text-white focus:outline-none focus:border-cyan-500 font-semibold"
          >
            {users.map(u => (
              <option key={u.user_id} value={u.user_id}>
                {u.full_name} ({u.employee_code} - {u.department})
              </option>
            ))}
          </select>
        </div>

        <div className="text-[11px] font-mono text-slate-400">
          Target Environment: <span className="text-emerald-400 font-bold">Local Controlled Testbed</span>
        </div>
      </div>

      {/* Mode A: Attack Scenarios Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold font-mono text-white flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>MODE A: CONTROLLED INSIDER ATTACK SCENARIOS</span>
          </h2>
          <span className="text-xs text-slate-500 font-mono">Generates labelled test telemetry</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {attackScenarios.map(sc => (
            <div key={sc.key} className="soc-card p-5 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-400">
                    MITRE {sc.tag}
                  </span>
                  <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${
                    sc.severity === 'Critical' ? 'bg-red-500/20 text-red-400' :
                    sc.severity === 'High' ? 'bg-orange-500/20 text-orange-400' :
                    sc.severity === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {sc.severity}
                  </span>
                </div>
                <h3 className="font-bold text-xs text-white leading-tight">{sc.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{sc.desc}</p>
              </div>

              <button
                onClick={() => handleTriggerScenario(sc.key, sc.title)}
                disabled={simulating}
                className="w-full py-2 bg-slate-800 hover:bg-cyan-500 hover:text-black text-slate-200 font-semibold rounded-lg text-xs transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate Attack Vector</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Mode B: CERT Dataset Ingestion Card */}
      <div className="soc-card p-5 border-cyan-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <FileSpreadsheet className="w-5 h-5 text-cyan-400" />
              <h2 className="text-sm font-bold font-mono text-white">
                MODE B: CERT INSIDER THREAT TEST DATASET r4.2 INGESTION
              </h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Processes standardized benchmark records from Carnegie Mellon University SEI CERT r4.2.
              Inspects schema columns, normalizes timestamp, user, activity, and device fields into the common schema,
              and feeds the stream to the hybrid detection engine.
            </p>
          </div>

          <button
            onClick={handleCertImport}
            disabled={certImporting}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg text-xs transition-all flex items-center space-x-2 shrink-0 shadow-lg shadow-cyan-500/20 disabled:opacity-50"
          >
            <Database className="w-4 h-4" />
            <span>{certImporting ? 'Ingesting CERT Records...' : 'Import CERT r4.2 Slice'}</span>
          </button>
        </div>
      </div>

      {/* Real-time Simulation History Log */}
      <div className="soc-card p-5 space-y-3">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold font-mono text-white uppercase">
            SIMULATION EXECUTION DISPATCH HISTORY
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Scenario Dispatched</th>
                <th className="py-2 px-3">Subject</th>
                <th className="py-2 px-3">Events Generated</th>
                <th className="py-2 px-3">Alerts Raised</th>
                <th className="py-2 px-3">Incidents Created</th>
                <th className="py-2 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-[11px]">
              {simulationLog.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-4 text-center text-slate-500 font-sans text-xs">
                    No simulations executed during this session. Click any scenario button above to trigger.
                  </td>
                </tr>
              ) : (
                simulationLog.map((log, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50">
                    <td className="py-2 px-3 text-slate-400">{log.timestamp}</td>
                    <td className="py-2 px-3 text-cyan-300 font-bold">{log.scenario}</td>
                    <td className="py-2 px-3 text-white">{log.user}</td>
                    <td className="py-2 px-3 text-white font-bold">+{log.events}</td>
                    <td className="py-2 px-3 text-amber-400 font-bold">+{log.alerts}</td>
                    <td className="py-2 px-3 text-red-400 font-bold">+{log.incidents}</td>
                    <td className="py-2 px-3 text-emerald-400 font-sans">
                      <span className="inline-flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Complete
                      </span>
                    </td>
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
