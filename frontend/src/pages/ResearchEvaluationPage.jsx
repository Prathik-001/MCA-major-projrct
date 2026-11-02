import React, { useState, useEffect } from 'react';
import ApiClient from '../api/client';
import {
  BrainCircuit,
  BookOpen,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  Layers,
  HelpCircle
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

export default function ResearchEvaluationPage() {
  const [literature, setLiterature] = useState([]);
  const [researchHypothesis, setResearchHypothesis] = useState('');
  const [evalResult, setEvalResult] = useState(null);
  const [sampleSize, setSampleSize] = useState(1000);
  const [testSplitRatio, setTestSplitRatio] = useState(0.3);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('comparison'); // 'comparison' | 'literature' | 'metrics'

  useEffect(() => {
    async function loadInitial() {
      try {
        const litRes = await ApiClient.getLiterature();
        setLiterature(litRes.papers || []);
        setResearchHypothesis(litRes.researchHypothesis || '');

        // Run default evaluation experiment
        const initialEval = await ApiClient.runEvaluation({ sampleSize: 1000, testSplitRatio: 0.3 });
        setEvalResult(initialEval);
      } catch (err) {
        console.error(err);
      }
    }
    loadInitial();
  }, []);

  const handleRunExperiment = async (e) => {
    e.preventDefault();
    setRunning(true);
    try {
      const res = await ApiClient.runEvaluation({ sampleSize, testSplitRatio });
      setEvalResult(res);
    } catch (err) {
      alert(`Evaluation error: ${err.message}`);
    } finally {
      setRunning(false);
    }
  };

  const models = evalResult?.models || {};
  const ruleModel = models.rule_based || {};
  const anomalyModel = models.anomaly_based || {};
  const hybridModel = models.hybrid_framework || {};

  // Comparative metrics chart data
  const comparisonChartData = [
    {
      metric: 'Precision',
      'Rule-Based': parseFloat(((ruleModel.precision || 0) * 100).toFixed(1)),
      'Isolation Forest': parseFloat(((anomalyModel.precision || 0) * 100).toFixed(1)),
      'Proposed Hybrid': parseFloat(((hybridModel.precision || 0) * 100).toFixed(1))
    },
    {
      metric: 'Recall',
      'Rule-Based': parseFloat(((ruleModel.recall || 0) * 100).toFixed(1)),
      'Isolation Forest': parseFloat(((anomalyModel.recall || 0) * 100).toFixed(1)),
      'Proposed Hybrid': parseFloat(((hybridModel.recall || 0) * 100).toFixed(1))
    },
    {
      metric: 'F1-Score',
      'Rule-Based': parseFloat(((ruleModel.f1_score || 0) * 100).toFixed(1)),
      'Isolation Forest': parseFloat(((anomalyModel.f1_score || 0) * 100).toFixed(1)),
      'Proposed Hybrid': parseFloat(((hybridModel.f1_score || 0) * 100).toFixed(1))
    },
    {
      metric: 'False Pos. Rate',
      'Rule-Based': parseFloat(((ruleModel.false_positive_rate || 0) * 100).toFixed(1)),
      'Isolation Forest': parseFloat(((anomalyModel.false_positive_rate || 0) * 100).toFixed(1)),
      'Proposed Hybrid': parseFloat(((hybridModel.false_positive_rate || 0) * 100).toFixed(1))
    }
  ];

  const renderConfusionMatrix = (title, m, methodColor) => {
    const cm = m.confusion_matrix || { tn: 0, fp: 0, fn: 0, tp: 0 };
    return (
      <div className="soc-card p-4 space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <span className="font-bold font-mono text-xs text-white">{title}</span>
          <span className="text-[10px] text-slate-400 font-mono">Delay: {m.avg_detection_delay_ms || 0} ms</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono pt-1">
          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase">True Negatives (TN)</span>
            <span className="text-base font-bold text-emerald-400">{cm.tn}</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Benign correctly ignored</span>
          </div>
          <div className="p-3 bg-red-950/20 rounded-lg border border-red-500/20">
            <span className="text-[10px] text-slate-500 block uppercase">False Positives (FP)</span>
            <span className="text-base font-bold text-red-400">{cm.fp}</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">False alerts raised</span>
          </div>
          <div className="p-3 bg-amber-950/20 rounded-lg border border-amber-500/20">
            <span className="text-[10px] text-slate-500 block uppercase">False Negatives (FN)</span>
            <span className="text-base font-bold text-amber-400">{cm.fn}</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Missed insider threats</span>
          </div>
          <div className="p-3 bg-cyan-950/20 rounded-lg border border-cyan-500/20">
            <span className="text-[10px] text-slate-500 block uppercase">True Positives (TP)</span>
            <span className="text-base font-bold text-cyan-400">{cm.tp}</span>
            <span className="text-[9px] text-slate-500 block mt-0.5">Threats detected</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-800 text-[11px] font-mono text-center">
          <div><span className="text-slate-500">Prec: </span><span className="text-white font-bold">{m.precision}</span></div>
          <div><span className="text-slate-500">Rec: </span><span className="text-white font-bold">{m.recall}</span></div>
          <div><span className="text-slate-500">F1: </span><span className="text-cyan-400 font-bold">{m.f1_score}</span></div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold font-mono text-white flex items-center space-x-2">
            <BrainCircuit className="w-5 h-5 text-cyan-400" />
            <span>RESEARCH EVALUATION & COMPARATIVE EXPERIMENTATION MODULE</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirical benchmark comparing Rule-Based, Isolation Forest Anomaly, and Proposed Hybrid Framework
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('comparison')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'comparison' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Comparative Evaluation
          </button>
          <button
            onClick={() => setActiveTab('literature')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'literature' ? 'bg-cyan-500 text-black shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Literature Review & Gap
          </button>
        </div>
      </div>

      {activeTab === 'comparison' && (
        <>
          {/* Experiment Control Bar */}
          <form onSubmit={handleRunExperiment} className="soc-card p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400 font-mono">Sample Size:</span>
                <select
                  value={sampleSize}
                  onChange={(e) => setSampleSize(parseInt(e.target.value, 10))}
                  className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value={500}>500 Samples (Fast)</option>
                  <option value={1000}>1,000 Samples (Standard)</option>
                  <option value={2000}>2,000 Samples (Deep)</option>
                  <option value={3000}>3,000 Samples (Rigorous)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-slate-400 font-mono">Train/Test Split:</span>
                <select
                  value={testSplitRatio}
                  onChange={(e) => setTestSplitRatio(parseFloat(e.target.value))}
                  className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value={0.2}>80% Train / 20% Test</option>
                  <option value={0.3}>70% Train / 30% Test</option>
                  <option value={0.4}>60% Train / 40% Test</option>
                </select>
              </div>

              <span className="text-[11px] text-slate-500 font-mono">
                Experiment ID: {evalResult?.experimentId} • Duration: {evalResult?.durationMs}ms
              </span>
            </div>

            <button
              type="submit"
              disabled={running}
              className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-lg flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-current ${running ? 'animate-spin' : ''}`} />
              <span>{running ? 'Re-Evaluating Models...' : 'Execute Comparative Experiment'}</span>
            </button>
          </form>

          {/* Research Hypothesis Callout */}
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-xs space-y-1.5">
            <div className="flex items-center space-x-2 text-cyan-400 font-mono font-bold">
              <Info className="w-4 h-4" />
              <span>Research Gap & Central Hypothesis Under Investigation</span>
            </div>
            <p className="text-slate-300 leading-relaxed italic">
              "{researchHypothesis}"
            </p>
          </div>

          {/* Comparative Metrics Bar Chart */}
          <div className="soc-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-white font-mono">
                  BENCHMARK PERFORMANCE COMPARISON (% METRIC VALUE)
                </h2>
                <p className="text-xs text-slate-400">
                  Precision, Recall, F1-Score, and False-Positive Rate evaluated on unseen test partition
                </p>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonChartData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="metric" stroke="#64748b" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748b" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="Rule-Based" fill="#ec4899" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Isolation Forest" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Proposed Hybrid" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Confusion Matrices Grid (3 Models) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderConfusionMatrix('1. Rule-Based Threat Detection', ruleModel, 'pink')}
            {renderConfusionMatrix('2. Isolation Forest (Anomaly Only)', anomalyModel, 'purple')}
            {renderConfusionMatrix('3. Proposed Explainable Hybrid Framework', hybridModel, 'cyan')}
          </div>

          {/* Key Findings & Threats to Validity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="soc-card p-5 space-y-2 text-xs">
              <h3 className="font-bold font-mono text-cyan-400 uppercase">Empirical Key Takeaways</h3>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                {(evalResult?.keyTakeaways || []).map((t, i) => (
                  <li key={i} className="leading-relaxed">{t}</li>
                ))}
              </ul>
            </div>

            <div className="soc-card p-5 space-y-2 text-xs">
              <h3 className="font-bold font-mono text-amber-400 uppercase">Threats to Validity & Limitations</h3>
              <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                <li className="leading-relaxed">Synthetic and simulated activity logs may underrepresent subtle human social engineering tactics.</li>
                <li className="leading-relaxed">Concept drift: Employee legitimate job promotions can alter normal baseline behavior over long temporal horizons.</li>
                <li className="leading-relaxed">High computational overhead if scikit-learn models are continuously retrained in real-time rather than batch intervals.</li>
              </ul>
            </div>
          </div>
        </>
      )}

      {activeTab === 'literature' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-300 space-y-1">
            <h3 className="font-bold font-mono text-cyan-400 text-sm">PEER-REVIEWED LITERATURE REVIEW MATRIX</h3>
            <p className="text-slate-400">
              Verified citations from ACM, IEEE, and SEI addressing user behavior analytics and insider threat detection.
            </p>
          </div>

          <div className="space-y-4">
            {literature.map(paper => (
              <div key={paper.id} className="soc-card p-5 space-y-2 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <span className="font-mono text-cyan-400 font-bold">{paper.id} • {paper.year}</span>
                  <span className="text-slate-400 font-mono text-[11px]">{paper.venue}</span>
                </div>

                <h3 className="text-sm font-bold text-white">{paper.title}</h3>
                <p className="text-slate-400"><span className="text-slate-500">Authors:</span> {paper.authors}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-[11px]">
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                    <span className="text-cyan-400 font-mono font-semibold block mb-0.5">Methodology & Dataset:</span>
                    <span className="text-slate-300">{paper.method} (Dataset: {paper.dataset})</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded border border-slate-800">
                    <span className="text-amber-400 font-mono font-semibold block mb-0.5">Reported Limitations & Gaps:</span>
                    <span className="text-slate-300">{paper.limitations}</span>
                  </div>
                </div>

                <div className="pt-2 text-slate-300 leading-relaxed text-[11px]">
                  <span className="font-semibold text-emerald-400">Key Finding: </span>{paper.findings}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
