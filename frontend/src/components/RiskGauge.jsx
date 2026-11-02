import React from 'react';

export default function RiskGauge({ score = 0, size = 'md' }) {
  const numScore = Math.min(100, Math.max(0, parseFloat(score) || 0));

  let color = '#3b82f6'; // Low
  let label = 'Low Risk';
  if (numScore >= 80) {
    color = '#ef4444'; // Critical
    label = 'Critical Risk';
  } else if (numScore >= 60) {
    color = '#f97316'; // High
    label = 'High Risk';
  } else if (numScore >= 30) {
    color = '#f59e0b'; // Medium
    label = 'Medium Risk';
  }

  const radius = size === 'sm' ? 24 : 36;
  const stroke = size === 'sm' ? 4 : 6;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (numScore / 100) * circumference;

  return (
    <div className="flex items-center space-x-3">
      <div className="relative inline-flex items-center justify-center">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke="#1e293b"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute text-center">
          <span className={`font-mono font-bold ${size === 'sm' ? 'text-xs' : 'text-sm'} text-white`}>
            {Math.round(numScore)}
          </span>
        </div>
      </div>
      <div>
        <div className="text-xs font-semibold" style={{ color }}>{label}</div>
        <div className="text-[10px] text-slate-400">Score: {numScore.toFixed(1)} / 100</div>
      </div>
    </div>
  );
}
