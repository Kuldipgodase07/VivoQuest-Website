import React from 'react';
import { StatusChip } from './StatusChip';

export interface KpiTileProps {
  label: string;
  value: string | number;
  change?: string;
  tone?: 'ok' | 'warn' | 'bad' | 'info' | 'subtle';
  icon?: React.ReactNode;
}

export const KpiTile: React.FC<KpiTileProps> = ({ label, value, change, tone, icon }) => {
  return (
    <div className="kpi-tile">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span className="kpi-lbl">{label}</span>
        {icon && <div style={{ color: '#6D42E8' }}>{icon}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span className="kpi-val">{value}</span>
        {change && <StatusChip label={change} tone={tone || 'ok'} />}
      </div>
    </div>
  );
};
