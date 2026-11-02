import React, { useState, useEffect } from 'react';
import ApiClient from '../api/client';
import {
  FileLock2,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  ShieldAlert,
  Flame,
  Terminal,
  ArrowRight,
  Info
} from 'lucide-react';

export default function AuditLogVerificationPage() {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [simulateBlockSeq, setSimulateBlockSeq] = useState(2);
  const [actionMessage, setActionMessage] = useState('');

  const loadAuditRecords = async () => {
    try {
      const res = await ApiClient.getAuditRecords({ limit: 50 });
      setRecords(res.records || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditRecords();
    runVerification();
  }, []);

  const runVerification = async () => {
    setVerifying(true);
    try {
      const report = await ApiClient.verifyAuditChain();
      setVerificationResult(report);
    } catch (err) {
      setVerificationResult({ isValid: false, errorDetails: err.message });
    } finally {
      setVerifying(false);
    }
  };

  const handleSimulateTamper = async () => {
    setActionMessage('');
    try {
      const res = await ApiClient.simulateTamper(simulateBlockSeq, 'MALICIOUS_LOG_ALTERATION_BY_ATTACKER');
      setActionMessage(res.message);
      await loadAuditRecords();
      await runVerification();
    } catch (err) {
      setActionMessage(`Simulation error: ${err.message}`);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-white flex items-center space-x-2">
            <FileLock2 className="w-5 h-5 text-cyan-400" />
            <span>TAMPER-EVIDENT AUDIT CHAIN & CRYPTOGRAPHIC VERIFICATION</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Append-only SHA-256 cryptographic hash-chaining (H_n = SHA256(H_prev || Payload))
          </p>
        </div>

        <button
          onClick={runVerification}
          disabled={verifying}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg text-xs flex items-center space-x-2 transition-all shadow-lg shadow-cyan-500/25 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${verifying ? 'animate-spin' : ''}`} />
          <span>{verifying ? 'Verifying Hashes...' : 'Verify Cryptographic Integrity'}</span>
        </button>
      </div>

      {actionMessage && (
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-400 flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage('')} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Verification Status Banner */}
      {verificationResult && (
        <div className={`soc-card p-5 border-l-4 ${
          verificationResult.isValid ? 'border-l-emerald-500 bg-emerald-500/5' : 'border-l-red-500 bg-red-500/10'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              {verificationResult.isValid ? (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 animate-pulse">
                  <AlertOctagon className="w-6 h-6" />
                </div>
              )}

              <div>
                <div className="flex items-center space-x-2">
                  <h3 className={`text-base font-bold font-mono ${verificationResult.isValid ? 'text-emerald-400' : 'text-red-400'}`}>
                    {verificationResult.isValid ? 'CRYPTOGRAPHIC AUDIT CHAIN VERIFIED INTACT' : 'INTEGRITY VIOLATION DETECTED!'}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 font-mono text-slate-300">
                    Checked {verificationResult.totalRecords || records.length} Blocks
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {verificationResult.message || verificationResult.errorDetails}
                </p>
                {verificationResult.brokenSequenceNumber && (
                  <p className="text-xs text-red-400 font-mono font-bold mt-1">
                    Compromised Sequence: Block #{verificationResult.brokenSequenceNumber} • Error: {verificationResult.errorType}
                  </p>
                )}
              </div>
            </div>

            <div className="text-right shrink-0 text-xs font-mono text-slate-400">
              Verified at: {new Date(verificationResult.verifiedAt || Date.now()).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Demonstration / Examiner Simulation Panel */}
      <div className="soc-card p-5 border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold font-mono text-white uppercase tracking-wider">
              EXAMINER DEMO: SIMULATE DIRECT DATABASE LOG TAMPERING
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">Test Proof of Tamper-Evidence</span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Simulate a malicious privileged insider or adversary modifying a previously stored audit record directly in the database.
          Because of the SHA-256 hash chaining, any altered bit will immediately invalidate subsequent block linkages.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-slate-400 font-mono">Target Block Sequence:</span>
            <input
              type="number"
              min="1"
              max={records.length || 10}
              value={simulateBlockSeq}
              onChange={(e) => setSimulateBlockSeq(parseInt(e.target.value, 10))}
              className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-center text-white font-mono text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={handleSimulateTamper}
            className="px-3.5 py-1.5 bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600 hover:text-white rounded-lg text-xs font-semibold transition-colors flex items-center space-x-1.5"
          >
            <AlertOctagon className="w-3.5 h-3.5" />
            <span>Simulate Unauthorized Modification on Block #{simulateBlockSeq}</span>
          </button>
        </div>
      </div>

      {/* Limitations Documentation Alert */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-xs space-y-2">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono font-semibold">
          <Info className="w-4 h-4" />
          <span>Research Note: Theoretical Limitations of Application Hash-Chaining</span>
        </div>
        <p className="text-slate-400 leading-relaxed">
          Hash chaining provides tamper-evidence against uncoordinated modifications and unauthorized record alteration. However, as noted in cryptographic literature, hash chaining alone cannot prevent a rogue adversary with raw database write privileges from rewriting the entire chain from the compromised block onward unless verification checkpoints are anchored in external write-once storage (WORM) or verifiable external timestamp authorities.
        </p>
      </div>

      {/* Audit Blocks Table */}
      <div className="soc-card overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="font-mono text-xs font-bold text-white uppercase">
            IMMUTABLE AUDIT CHAIN BLOCKS ({records.length} OF {total} DISPLAYED)
          </h3>
          <span className="text-[11px] font-mono text-slate-400">Order: Newest First</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Seq #</th>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Action Payload</th>
                <th className="py-2.5 px-3">Previous Hash (H_prev)</th>
                <th className="py-2.5 px-3">Current Hash (H_curr)</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
              {records.map(block => (
                <tr key={block.id} className="hover:bg-slate-900/50">
                  <td className="py-2.5 px-3 text-cyan-400 font-bold">
                    #{block.sequence_number}
                  </td>
                  <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                    {new Date(block.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-2.5 px-3 font-sans text-xs max-w-xs truncate text-slate-300">
                    <span className="font-semibold text-white">
                      {block.event_payload?.action || 'EVENT'}
                    </span>
                    {block.event_payload?.user && (
                      <span className="text-slate-400 ml-1">({block.event_payload.user})</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-mono">
                    <span title={block.previous_hash}>{block.previous_hash.slice(0, 16)}...</span>
                  </td>
                  <td className="py-2.5 px-3 text-emerald-400 font-mono">
                    <span title={block.current_hash}>{block.current_hash.slice(0, 16)}...</span>
                  </td>
                  <td className="py-2.5 px-3 font-sans">
                    <span className="inline-flex items-center text-emerald-400 text-[11px]">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Chained
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
