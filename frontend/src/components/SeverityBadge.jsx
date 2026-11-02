import React from 'react';

export default function SeverityBadge({ severity }) {
  const sev = (severity || 'Low').toLowerCase();

  const styles = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/40 ring-red-500/20',
    high: 'bg-orange-500/15 text-orange-400 border-orange-500/40 ring-orange-500/20',
    medium: 'bg-amber-500/15 text-amber-400 border-amber-500/40 ring-amber-500/20',
    low: 'bg-blue-500/15 text-blue-400 border-blue-500/40 ring-blue-500/20',
    info: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 ring-emerald-500/20'
  };

  const currentStyle = styles[sev] || styles.low;

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ring-1 ${currentStyle}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        sev === 'critical' ? 'bg-red-400 animate-pulse' :
        sev === 'high' ? 'bg-orange-400' :
        sev === 'medium' ? 'bg-amber-400' :
        sev === 'info' ? 'bg-emerald-400' : 'bg-blue-400'
      }`}></span>
      {severity}
    </span>
  );
}
