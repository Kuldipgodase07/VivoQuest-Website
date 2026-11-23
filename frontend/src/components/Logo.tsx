import React from 'react';

export interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ size = 32, showText = true, className = '' }) => {
  return (
    <div className={`brand-logo ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <svg
        className="ic"
        viewBox="0 0 24 24"
        style={{ width: `${size}px`, height: `${size}px`, flexShrink: 0 }}
        aria-hidden="true"
      >
        <path
          d="M3.5 11 12 3.5 20.5 11V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z"
          stroke="#4520B8"
          strokeWidth="1.9"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <path
          d="M12 17.2c-2.4-1.6-3.6-2.8-3.6-4.2a1.9 1.9 0 0 1 3.6-.8 1.9 1.9 0 0 1 3.6.8c0 1.4-1.2 2.6-3.6 4.2z"
          fill="#4520B8"
          stroke="none"
        />
      </svg>
      {showText && (
        <span style={{ fontSize: '20px', fontWeight: 800, color: '#17143A', letterSpacing: '-0.02em' }}>
          Vivo<span style={{ color: '#4520B8' }}>Quest</span>
        </span>
      )}
    </div>
  );
};
