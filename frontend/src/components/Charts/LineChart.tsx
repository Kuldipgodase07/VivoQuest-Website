import React from 'react';

export interface LineChartProps { values: number[]; labels: string[]; height?: number; color?: string; }

export const LineChart: React.FC<LineChartProps> = ({ values, labels, height = 140, color = '#4520B8' }) => {
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const width = 500;
  const h = height - 30;

  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * (width - 40) + 20;
    const y = h - ((v - min) / range) * (h - 20) + 10;
    return { x, y, v };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: `${height}px` }}>
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, idx) => (
          <circle key={idx} cx={p.x} cy={p.y} r="4" fill="#fff" stroke={color} strokeWidth="2" />
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 10px' }}>
        {labels.map((lbl, idx) => (
          <span key={idx} style={{ fontSize: '11px', color: '#667085' }}>{lbl}</span>
        ))}
      </div>
    </div>
  );
};
