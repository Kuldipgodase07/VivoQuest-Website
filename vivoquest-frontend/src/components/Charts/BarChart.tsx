import React from 'react';

export interface BarChartItem { label: string; value: number; }
export interface BarChartProps { data: BarChartItem[]; height?: number; color?: string; unit?: string; }

export const BarChart: React.FC<BarChartProps> = ({ data, height = 180, color = '#4520B8', unit = '' }) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ width: '100%', height: `${height}px`, display: 'flex', alignItems: 'flex-end', gap: '14px', paddingTop: '20px' }}>
      {data.map((item, idx) => {
        const pct = (item.value / maxVal) * 100;
        return (
          <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
            <div style={{ flex: 1, width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
              <div
                style={{
                  width: '60%', maxWidth: '40px', height: `${pct}%`, background: color,
                  borderRadius: '6px 6px 0 0', transition: 'height 0.4s ease'
                }}
                title={`${item.label}: ${item.value}${unit}`}
              />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#667085', marginTop: '8px' }}>
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
