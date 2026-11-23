import React from 'react';
import { useAuth } from '../hooks/useAuth';

export interface TopbarProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export const Topbar: React.FC<TopbarProps> = ({ title, subtitle, action }) => {
  const { session } = useAuth();

  return (
    <header className="topbar">
      <div>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: '#17143A' }}>
          {title || 'VivoQuest Clinical Workspace'}
        </h1>
        {subtitle && (
          <span style={{ fontSize: '13px', color: '#667085', fontWeight: 600 }}>
            {subtitle}
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {action}

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid #E6E2F0', paddingLeft: '16px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#4520B8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
            {session?.name ? session.name.charAt(0) : 'U'}
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#17143A' }}>
              {session?.name || 'Authorized User'}
            </div>
            <div style={{ fontSize: '11px', color: '#667085', textTransform: 'capitalize' }}>
              {session?.role || 'Guest'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
