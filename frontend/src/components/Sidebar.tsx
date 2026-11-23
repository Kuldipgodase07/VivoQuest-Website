import React from 'react';
import { NavLink } from 'react-router-dom';
import { Logo } from './Logo';
import { useAuth } from '../hooks/useAuth';
import { Role } from '../types';

export const Sidebar: React.FC = () => {
  const { session, switchRole, logout } = useAuth();

  const roleWorkspaces: { role: Role; path: string; label: string; iconPath: string }[] = [
    { role: 'patient', path: '/patient', label: 'Patient and Family', iconPath: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z' },
    { role: 'caregiver', path: '/caregiver', label: 'Caregiver', iconPath: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6 6 0 0 1 4 6' },
    { role: 'nurse', path: '/nurse', label: 'Nurse Field Visit', iconPath: 'M3 12h4l3-8 4 16 3-8h4' },
    { role: 'clinician', path: '/clinician', label: 'Clinician / Physician', iconPath: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z' },
    { role: 'remote-desk', path: '/remote-desk', label: 'Remote Care Desk', iconPath: 'M2 4h20v13H2zM8 21h8M12 17v4' },
    { role: 'discharge-planner', path: '/discharge', label: 'Discharge Planner', iconPath: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M8 2h8v4H8z' },
    { role: 'health-plan', path: '/health-plan', label: 'Health Plan / ACO', iconPath: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z' },
    { role: 'vaccination', path: '/vaccination', label: 'Adult Vaccination', iconPath: 'M14.5 4.5l5 5M18 8l2-2a2.121 2.121 0 0 0-3-3l-2 2M13 13L4 22M9 9l6 6' },
    { role: 'marketplace', path: '/marketplace', label: 'Marketplace', iconPath: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0' },
    { role: 'admin', path: '/admin', label: 'Administrator Console', iconPath: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z' }
  ];

  return (
    <aside
      className="sidebar"
      style={{
        width: '260px',
        flex: 'none',
        background: '#FFFFFF',
        borderRight: '1.5px solid #E6E2F0',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 14px',
        position: 'relative'
      }}
    >
      {/* Brand Logo */}
      <div style={{
        marginBottom: '20px',
        paddingLeft: '8px',
        display: 'flex',
        justifyContent: 'flex-start'
      }}>
        <NavLink to="/" title="VivoQuest Home">
          <Logo size={28} />
        </NavLink>
      </div>

      <div style={{
        fontSize: '11px',
        fontWeight: 800,
        color: '#667085',
        textTransform: 'uppercase',
        letterSpacing: '.06em',
        padding: '0 8px 8px'
      }}>
        Workspaces
      </div>

      {/* Workspace Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
        {roleWorkspaces.map(w => {
          const isActive = session?.role === w.role;
          return (
            <NavLink
              key={w.role}
              to={w.path}
              title={w.label}
              onClick={() => switchRole(w.role)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '12px',
                padding: '10px 14px',
                borderRadius: '12px',
                fontWeight: 700,
                fontSize: '14px',
                color: isActive ? '#4520B8' : '#4B5565',
                background: isActive ? '#EAE4FF' : 'transparent',
                transition: 'background .15s, color .15s',
                textDecoration: 'none'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d={w.iconPath} />
              </svg>
              <span style={{
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {w.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Sign out */}
      <div style={{ paddingTop: '16px', borderTop: '1px solid #E6E2F0' }}>
        <button
          onClick={logout}
          title="Sign out of VivoQuest"
          type="button"
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '10px',
            color: '#B42332',
            background: 'transparent',
            border: 'none',
            fontWeight: 700,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};
