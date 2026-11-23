import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useAppToast } from '../../app/providers';
import { Role } from '../../types';
import '../../styles/tokens.css';
import '../../styles/base.css';
import '../../styles/landing.css';

interface RoleOption {
  k: Role;
  title: string;
  desc: string;
  icon: string;
}

const ROLES_LIST: RoleOption[] = [
  {
    k: 'patient',
    title: 'Patient or Family',
    desc: 'See visits, medicines and care updates',
    icon: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z'
  },
  {
    k: 'nurse',
    title: 'Nurse',
    desc: 'Manage visits and document care in the field',
    icon: 'M3 12h4l3-8 4 16 3-8h4'
  },
  {
    k: 'caregiver',
    title: 'Caregiver',
    desc: 'Follow daily tasks and share concerns',
    icon: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6 6 0 0 1 4 6'
  },
  {
    k: 'clinician',
    title: 'Clinician',
    desc: 'Review care plans and manage escalations',
    icon: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'
  },
  {
    k: 'admin',
    title: 'Administrator',
    desc: 'Oversee users, operations and platform settings',
    icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z'
  },
  {
    k: 'remote-desk',
    title: 'Remote Care Desk',
    desc: 'Live patient monitoring, telemetry and alert triage',
    icon: 'M3 12h4l3-8 4 16 3-8h4'
  },
  {
    k: 'discharge-planner',
    title: 'Discharge Planner',
    desc: 'Transition care coordination and hospital readmission prevention',
    icon: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2 20a7 7 0 0 1 14 0'
  },
  {
    k: 'health-plan',
    title: 'Health Plan / ACO',
    desc: 'Utilization management, value-based care and clinical quality',
    icon: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'
  },
  {
    k: 'vaccination',
    title: 'Adult Vaccination',
    desc: 'Cold-chain verification, dose scheduling and certificates',
    icon: 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z'
  },
  {
    k: 'marketplace',
    title: 'Marketplace',
    desc: 'Prescriptions, clinical consumables and verified home care devices',
    icon: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z'
  }
];

export const RolePickerPage: React.FC = () => {
  const navigate = useNavigate();
  const { session, switchRole } = useAuth();
  const { toast } = useAppToast();
  const [selectedRole, setSelectedRole] = useState<Role>(session?.role || 'admin');

  useEffect(() => {
    if (!session) {
      navigate('/signin', { replace: true });
    }
  }, [session, navigate]);

  const isSuperAdmin = session?.role === 'admin' || (session?.roles?.includes('admin') ?? false);

  const handleContinue = () => {
    const isPermitted = isSuperAdmin || (session?.roles?.includes(selectedRole) ?? false);
    if (!isPermitted) {
      toast(`Access Restricted: Your account does not have permission for the ${selectedRole} workspace.`);
      return;
    }

    switchRole(selectedRole);
    toast(`Switched to ${selectedRole} workspace`);
    const route = selectedRole === 'discharge-planner' ? '/discharge' : `/${selectedRole}`;
    navigate(route);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexWrap: 'wrap', background: '#F7F5FF', fontFamily: "'Manrope', 'Poppins', system-ui, sans-serif" }}>
      {/* Left Column: Brand Gradient Banner */}
      <div style={{ flex: '1 1 420px', minWidth: 0, background: 'linear-gradient(160deg, #4520B8 0%, #6D42E8 100%)', color: '#fff', padding: '48px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '32px' }}>
        <button
          style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#fff', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: 0 }}
          onClick={() => navigate('/')}
        >
          <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(255,255,255,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg className="ic" viewBox="0 0 24 24" style={{ width: '28px', height: '28px' }} aria-hidden="true">
              <path d="M3.5 11 12 3.5 20.5 11V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 17.2c-2.4-1.6-3.6-2.8-3.6-4.2a1.9 1.9 0 0 1 3.6-.8 1.9 1.9 0 0 1 3.6.8c0 1.4-1.2 2.6-3.6 4.2z" fill="#fff" stroke="none" />
            </svg>
          </div>
          <span style={{ fontSize: '24px', fontWeight: 800 }}>VivoQuest</span>
        </button>

        <div>
          <div style={{ fontSize: '48px', lineHeight: 1.05, fontWeight: 800, letterSpacing: '-.03em', marginBottom: '16px' }}>
            Role Workspace Switcher
          </div>
          <div style={{ fontSize: '18px', lineHeight: 1.6, color: '#E2D9FF', fontWeight: 500, maxWidth: '440px' }}>
            You can only switch to workspaces authorized for your account credentials. Unauthorized roles remain securely locked.
          </div>
        </div>

        <div style={{ fontSize: '13px', color: '#D6C9FF', fontWeight: 600 }}>
          {session ? `Signed in: ${session.name} (+91 ${session.phone})` : 'Not signed in'}
        </div>
      </div>

      {/* Right Column: Role Picker */}
      <div style={{ flex: '1 1 460px', minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', background: '#F7F5FF' }}>
        <div style={{ width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: 800, letterSpacing: '-.02em', color: '#17143A' }}>
              Select Active Workspace
            </h2>
            <div style={{ fontSize: '15px', color: '#667085', fontWeight: 500, lineHeight: 1.5 }}>
              Choose which role workspace you wish to operate in.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '52vh', overflowY: 'auto', paddingRight: '4px' }}>
            {ROLES_LIST.map(r => {
              const isPermitted = isSuperAdmin || (session?.roles?.includes(r.k) ?? false);
              const isOn = selectedRole === r.k;

              return (
                <button
                  key={r.k}
                  className={`opt ${isOn ? 'on' : ''}`}
                  disabled={!isPermitted}
                  onClick={() => {
                    if (isPermitted) {
                      setSelectedRole(r.k);
                    } else {
                      toast(`Restricted: Your account does not have access to ${r.title}.`);
                    }
                  }}
                  style={{
                    cursor: isPermitted ? 'pointer' : 'not-allowed',
                    textAlign: 'left',
                    border: 'none',
                    opacity: isPermitted ? 1 : 0.45
                  }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: isPermitted ? '#EAE4FF' : '#E5E7EB', color: isPermitted ? '#4520B8' : '#9CA3AF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg className="ic" viewBox="0 0 24 24" style={{ width: '24px', height: '24px' }}>
                      <path d={r.icon} fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '17px', color: '#17143A' }}>
                      {r.title}
                      {!isPermitted && (
                        <span style={{ marginLeft: '8px', fontSize: '11px', background: '#FEE2E2', color: '#DC2626', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                          RESTRICTED
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '14px', color: '#667085', fontWeight: 500, marginTop: '2px', lineHeight: 1.3 }}>{r.desc}</div>
                  </div>
                  {isOn && isPermitted && (
                    <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '8px' }}>
                      <svg className="ic" viewBox="0 0 24 24" style={{ width: '22px', height: '22px', color: '#4520B8' }}>
                        <path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <button className="btn p w" onClick={handleContinue}>
            Switch to Selected Workspace
          </button>

          <button
            style={{ fontWeight: 700, color: '#667085', fontSize: '14px', alignSelf: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px' }}
            onClick={() => navigate(-1)}
          >
            Cancel and Return
          </button>
        </div>
      </div>
    </div>
  );
};
