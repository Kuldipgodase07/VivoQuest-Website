import React, { useState } from 'react';
import { WorkspaceFrame } from '../../components/WorkspaceFrame';
import { MaharashtraLiveTrackingMap } from '../../components/MaharashtraLiveTrackingMap';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface LiveAlert {
  id: string;
  patientName: string;
  location: string;
  vitalsIssue: string;
  assignedStaff: string;
  eta: string;
  priority: 'CRITICAL' | 'WARNING' | 'STABLE';
}

const SAMPLE_ALERTS: LiveAlert[] = [
  {
    id: 'ALT-MH-1021',
    patientName: 'Pooja Nair',
    location: 'Baner, Pune (Western Maharashtra)',
    vitalsIssue: 'SpO2 89% for 48 hrs · Requires In-person Auscultation',
    assignedStaff: 'Nurse Vandana Rao, RN (MH-12-RN-402)',
    eta: '8 min',
    priority: 'CRITICAL'
  },
  {
    id: 'ALT-MH-1022',
    patientName: 'Kamal Deshmukh',
    location: 'Kothrud, Pune (Western Maharashtra)',
    vitalsIssue: 'Cardiac Telemetry Arrhythmia Alert',
    assignedStaff: 'ICU Ambulance #12 (MH-14-AMB-108)',
    eta: '5 min',
    priority: 'CRITICAL'
  },
  {
    id: 'ALT-MH-1023',
    patientName: 'Sunita Patil',
    location: 'Panchavati, Nashik (North Maharashtra)',
    vitalsIssue: 'Cold-Chain Vaccine Lot #304 Delivery Verification',
    assignedStaff: 'Cold-Chain Van (MH-15-VC-09)',
    eta: '18 min',
    priority: 'WARNING'
  },
  {
    id: 'ALT-MH-1024',
    patientName: 'Suresh Patil',
    location: 'Wardha Elder Wing, Nagpur (Vidarbha)',
    vitalsIssue: 'Post-op BP 162/98 mmHg · Physician Follow-up',
    assignedStaff: 'Dr. Arvind Swaminathan (MH-31-CL-03)',
    eta: '11 min',
    priority: 'WARNING'
  },
  {
    id: 'ALT-MH-1025',
    patientName: 'Lata Kulkarni',
    location: 'Rajarampuri, Kolhapur (Western Maharashtra)',
    vitalsIssue: 'Scheduled Blood Draw & INR Lab Sample Collection',
    assignedStaff: 'Phlebotomist Anita Deshmukh (MH-09-RN-205)',
    eta: '3 min',
    priority: 'STABLE'
  }
];

export const RemoteDeskWorkspace: React.FC = () => {
  const [viewMode, setViewMode] = useState<'map' | 'console'>('map');
  const [activeAlerts, setActiveAlerts] = useState<LiveAlert[]>(SAMPLE_ALERTS);
  const [toast, setToast] = useState<string | null>(null);
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDispatch = (alertId: string) => {
    showToast(`Dispatched nearest field unit for alert #${alertId}`);
  };

  const handleCall = (patientName: string) => {
    showToast(`Initiating encrypted WebRTC telehealth call with ${patientName}...`);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F5FF',
      fontFamily: "'Manrope', 'Poppins', system-ui, sans-serif",
      color: '#17143A',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#17143A',
          color: '#FFFFFF',
          padding: '12px 24px',
          borderRadius: '14px',
          fontWeight: 700,
          fontSize: '14px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          zIndex: 9999
        }}>
          {toast}
        </div>
      )}

      {/* Top Navigation Bar */}
      <header style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E6E2F0',
        padding: '14px 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            onClick={() => navigate('/')}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#4520B8',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(69,32,184,0.3)'
            }}
          >
            <svg style={{ width: '24px', height: '24px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.5 11 12 3.5 20.5 11V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z" />
              <path d="M12 17.2c-2.4-1.6-3.6-2.8-3.6-4.2a1.9 1.9 0 0 1 3.6-.8 1.9 1.9 0 0 1 3.6.8c0 1.4-1.2 2.6-3.6 4.2z" fill="#fff" stroke="none" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#17143A' }}>
              VivoQuest
            </div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#667085' }}>
              Remote Care Desk · Live Operations & Field Telemetry
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div style={{
          display: 'flex',
          background: '#EAE4FF',
          padding: '4px',
          borderRadius: '12px',
          gap: '4px'
        }}>
          <button
            onClick={() => setViewMode('map')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'map' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'map' ? '#4520B8' : '#667085',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: viewMode === 'map' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon><line x1="8" y1="2" x2="8" y2="18"></line><line x1="16" y1="6" x2="16" y2="22"></line></svg>
            Maharashtra Live Map & Tracking
          </button>
          <button
            onClick={() => setViewMode('console')}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              background: viewMode === 'console' ? '#FFFFFF' : 'transparent',
              color: viewMode === 'console' ? '#4520B8' : '#667085',
              fontWeight: 800,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: viewMode === 'console' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>
            Triage Console View
          </button>
        </div>

        {/* User Pill & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: '#F7F5FF',
            padding: '6px 14px',
            borderRadius: '999px',
            border: '1px solid #ECE7FB',
            fontSize: '13px',
            fontWeight: 700,
            color: '#4520B8',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981' }}></span>
            <span>{session?.name || 'Anita Deshmukh'}</span>
            <span style={{ color: '#667085', fontSize: '11px' }}>({session?.role || 'remote-desk'})</span>
          </div>

          <button
            onClick={() => {
              logout();
              navigate('/signin');
            }}
            style={{
              background: '#FFFFFF',
              border: '1.5px solid #E6E2F0',
              padding: '6px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              color: '#374151'
            }}
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {viewMode === 'map' ? (
        <main style={{ flex: 1, padding: '28px 32px', maxWidth: '1440px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Top Operational Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px'
          }}>
            <div style={{
              background: '#FFFFFF',
              borderRadius: '18px',
              padding: '18px 22px',
              border: '1px solid #E6E2F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#667085', letterSpacing: '0.05em' }}>
                ACTIVE MONITORED PATIENTS
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#17143A', marginTop: '4px' }}>
                412
              </div>
              <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 700, marginTop: '2px' }}>
                ● Continuous 48-hr Vitals Telemetry
              </div>
            </div>

            <div style={{
              background: '#FFFFFF',
              borderRadius: '18px',
              padding: '18px 22px',
              border: '1px solid #E6E2F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#667085', letterSpacing: '0.05em' }}>
                FIELD UNITS IN TRANSIT
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#4520B8', marginTop: '4px' }}>
                14 Units
              </div>
              <div style={{ fontSize: '12px', color: '#6D42E8', fontWeight: 700, marginTop: '2px' }}>
                Nurses, Ambulances & Cold-Chain Vans
              </div>
            </div>

            <div style={{
              background: '#FFFFFF',
              borderRadius: '18px',
              padding: '18px 22px',
              border: '1px solid #E6E2F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#667085', letterSpacing: '0.05em' }}>
                ON-TIME REGIONAL DISPATCH
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#17143A', marginTop: '4px' }}>
                97.0%
              </div>
              <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 700, marginTop: '2px' }}>
                +1.8% vs last month average
              </div>
            </div>

            <div style={{
              background: '#FFFFFF',
              borderRadius: '18px',
              padding: '18px 22px',
              border: '1px solid #E6E2F0',
              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
            }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#667085', letterSpacing: '0.05em' }}>
                AVERAGE DISPATCH RESPONSE
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#17143A', marginTop: '4px' }}>
                3.6 min
              </div>
              <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 700, marginTop: '2px' }}>
                Target: Under 5.0 minutes
              </div>
            </div>
          </div>

          {/* Central Feature: The Maharashtra Live Tracking Map (Per user requirement and image) */}
          <MaharashtraLiveTrackingMap />

          {/* Real-Time Exceptions & Dispatch Queue Table */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '24px',
            border: '1px solid #E6E2F0',
            boxShadow: '0 1px 2px rgba(23,20,58,.05), 0 10px 28px rgba(69,32,184,.07)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: 800, color: '#17143A' }}>
                  Live Field Dispatch & Emergency Queue
                </h3>
                <div style={{ fontSize: '13px', color: '#667085', fontWeight: 500 }}>
                  Active field workers and triage events currently simulated across Maharashtra districts.
                </div>
              </div>
              <button
                onClick={() => showToast('Refreshed active telemetry queue from MongoDB and Redis.')}
                style={{
                  background: '#EAE4FF',
                  color: '#4520B8',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 14px',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>
                  Refresh Stream
                </span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #F3F4F6', color: '#667085', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase' }}>
                    <th style={{ padding: '12px 14px' }}>Alert ID</th>
                    <th style={{ padding: '12px 14px' }}>Patient & Location</th>
                    <th style={{ padding: '12px 14px' }}>Vitals Trigger</th>
                    <th style={{ padding: '12px 14px' }}>Assigned Field Unit</th>
                    <th style={{ padding: '12px 14px' }}>ETA</th>
                    <th style={{ padding: '12px 14px' }}>Priority</th>
                    <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeAlerts.map(a => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      <td style={{ padding: '14px', fontWeight: 700, color: '#4520B8' }}>{a.id}</td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ fontWeight: 800, color: '#17143A' }}>{a.patientName}</div>
                        <div style={{ fontSize: '12px', color: '#667085' }}>{a.location}</div>
                      </td>
                      <td style={{ padding: '14px', color: '#374151', fontWeight: 600 }}>{a.vitalsIssue}</td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#F3F4F6',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontWeight: 700,
                          fontSize: '12px',
                          color: '#1F2937'
                        }}>
                          {a.assignedStaff}
                        </span>
                      </td>
                      <td style={{ padding: '14px', fontWeight: 800, color: '#10B981' }}>{a.eta}</td>
                      <td style={{ padding: '14px' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: a.priority === 'CRITICAL' ? '#FEE2E2' : a.priority === 'WARNING' ? '#FEF3C7' : '#DDF3EA',
                          color: a.priority === 'CRITICAL' ? '#DC2626' : a.priority === 'WARNING' ? '#D97706' : '#18845B'
                        }}>
                          {a.priority}
                        </span>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleCall(a.patientName)}
                            style={{
                              background: '#EAE4FF',
                              color: '#4520B8',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Call
                          </button>
                          <button
                            onClick={() => handleDispatch(a.id)}
                            style={{
                              background: '#4520B8',
                              color: '#FFFFFF',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '8px',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Dispatch
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      ) : (
        /* Full Console IFrame View */
        <div style={{ flex: 1, height: 'calc(100vh - 72px)' }}>
          <WorkspaceFrame screen="remote-desk" title="VivoQuest Remote care desk" />
        </div>
      )}
    </div>
  );
};
