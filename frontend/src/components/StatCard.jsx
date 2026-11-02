import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'cyan', change }) {
  const colorMap = {
    cyan: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    red: 'text-red-400 bg-red-500/10 border-red-500/30',
    amber: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    emerald: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    purple: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
  };

  const badgeStyle = colorMap[color] || colorMap.cyan;

  return (
    <div className="soc-card p-5 relative overflow-hidden group hover:border-slate-600 transition-all">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl font-bold font-mono text-white mt-1.5">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl border ${badgeStyle}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      {change && (
        <div className="mt-3 flex items-center text-xs">
          <span className="text-emerald-400 font-medium">{change}</span>
          <span className="text-slate-500 ml-1.5">vs last 24h baseline</span>
        </div>
      )}
    </div>
  );
}
