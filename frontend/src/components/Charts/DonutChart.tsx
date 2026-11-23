import React from 'react';

export interface DonutChartProps { percent: number; size?: number; strokeWidth?: number; color?: string; label?: string; }

export const DonutChart: React.FC<DonutChartProps> = ({ percent, size = 120, strokeWidth = 12, color = '#4520B8', label = 'Adherence' }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="#EAE4FF" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.5s ease' }}
        />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="20" fontWeight="800" fill="#17143A">
          {percent}%
        </text>
      </svg>
      <span style={{ fontSize: '12px', fontWeight: 700, color: '#667085', marginTop: '6px' }}>{label}</span>
    </div>
  );
};
