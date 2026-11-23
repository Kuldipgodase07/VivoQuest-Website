import React from 'react';

export interface StatusChipProps {
  label: string;
  tone?: 'ok' | 'warn' | 'bad' | 'info' | 'subtle';
  className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ label, tone = 'ok', className = '' }) => {
  return (
    <span className={`chip ${tone} ${className}`}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', opacity: 0.8 }} />
      {label}
    </span>
  );
};
