import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
  badge: string;
}

const WORKSPACE_OPTIONS: RoleOption[] = [
  { k: 'admin', title: 'Administrator Console', desc: 'Operations, telemetry & settings', badge: 'Admin' },
  { k: 'patient', title: 'Patient & Family', desc: 'Visits, medicines & care updates', badge: 'Patient' },
  { k: 'nurse', title: 'Field Care Nurse', desc: 'Route navigation & visit documentation', badge: 'Nurse' },
  { k: 'clinician', title: 'Clinician / Doctor', desc: 'Prescriptions & clinical reviews', badge: 'Doctor' },
  { k: 'caregiver', title: 'Caregiver Portal', desc: 'Daily vitals & scheduled concerns', badge: 'Care' },
  { k: 'remote-desk', title: 'Remote Care Desk', desc: 'Live patient monitoring & telemetry', badge: 'Desk' },
  { k: 'discharge-planner', title: 'Discharge Planner', desc: 'Transition care & readmissions', badge: 'Planner' },
  { k: 'health-plan', title: 'Health Plan / ACO', desc: 'Value-based care & quality metrics', badge: 'Payer' },
  { k: 'vaccination', title: 'Adult Vaccination', desc: 'Cold-chain & dose certificates', badge: 'Vaccine' },
  { k: 'marketplace', title: 'Healthcare Marketplace', desc: 'Consumables & medical devices', badge: 'Store' }
];

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { toast } = useAppToast();

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('9820000000');
  const [phoneErr, setPhoneErr] = useState(false);
  const [otp, setOtp] = useState('123456');
  const [otpErr, setOtpErr] = useState(false);
  const [targetWorkspace, setTargetWorkspace] = useState<Role>('admin');
  const [loading, setLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname;

  const getCleanPhone = () => phone.replace(/\D/g, '').slice(-10) || '9820000000';

  const routeForRole = (role: Role) => {
    return role === 'discharge-planner' ? '/discharge' : `/${role}`;
  };

  const completeLogin = async (roleToUse: Role) => {
    setLoading(true);
    try {
      const clean = getCleanPhone();
      const session = await login(clean, otp || '123456', roleToUse);
      toast(`Signed in successfully as ${session.name}`);

      if (from && from !== '/' && from !== '/signin') {
        navigate(from, { replace: true });
      } else {
        navigate(routeForRole(roleToUse), { replace: true });
      }
    } catch (err: any) {
      toast(err?.message || 'Authentication error');
    } finally {
      setLoading(false);
    }
  };

  const handleInstantDemoLogin = () => {
    completeLogin(targetWorkspace);
  };

  const handleSendCode = () => {
    const clean = getCleanPhone();
    if (clean.length !== 10) {
      setPhoneErr(true);
      return;
    }
    setPhoneErr(false);
    setOtp('123456');
    setStep('otp');
    toast(`Verification code sent to +91 ${clean}. Demo OTP: 123456`);
  };

  const handleVerify = () => {
    const cleanOtp = otp.trim();
    if (cleanOtp.length < 4) {
      setOtpErr(true);
      return;
    }
    setOtpErr(false);
    completeLogin(targetWorkspace);
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
          <div style={{ fontSize: '46px', lineHeight: 1.1, fontWeight: 800, letterSpacing: '-.03em', marginBottom: '16px' }}>
            Care, Closer to Home
          </div>
          <div style={{ fontSize: '17px', lineHeight: 1.6, color: '#E2D9FF', fontWeight: 500, maxWidth: '440px', marginBottom: '28px' }}>
            Integrated home healthcare delivery, clinical monitoring, and field operations across Maharashtra.
          </div>

          {/* Key Value Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '460px' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.12)', borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                📍
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '14px' }}>Maharashtra Live Field Tracking</div>
                <div style={{ fontSize: '12px', color: '#E2D9FF', fontWeight: 500 }}>Live nurse telemetry & regional dispatch across all 6 administrative divisions</div>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.12)', borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                🏥
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '14px' }}>Comprehensive Clinical Care</div>
                <div style={{ fontSize: '12px', color: '#E2D9FF', fontWeight: 500 }}>Integrated transition care connecting patients, nurses, doctors and health plans</div>
              </div>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.12)', borderRadius: '14px', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: '14px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255, 255, 255, 0.18)' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                🛡️
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '14px' }}>Secure Role-Based Workspaces</div>
                <div style={{ fontSize: '12px', color: '#E2D9FF', fontWeight: 500 }}>Authenticated access required to view any operational or clinical dashboard</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255, 255, 255, 0.15)', padding: '10px 16px', borderRadius: '30px', alignSelf: 'flex-start' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ADE80' }} />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>
            Demo Environment Active • All Workspaces Unlocked
          </span>
        </div>
      </div>

      {/* Right Column: Clean Unified Sign In Form */}
      <div style={{ flex: '1 1 480px', minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 28px', background: '#F7F5FF' }}>
        <div style={{ width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Form Header */}
          <div>
            <h2 style={{ margin: '0 0 8px', fontSize: '32px', fontWeight: 800, letterSpacing: '-.02em', color: '#17143A' }}>
              Sign In to VivoQuest
            </h2>
            <div style={{ fontSize: '15px', color: '#667085', fontWeight: 500, lineHeight: 1.5 }}>
              Authentication is required to access dashboards. One demo login gives full access to all workspaces.
            </div>
          </div>

          {/* Instant 1-Click Demo Login Hero Card */}
          <div style={{
            background: '#FFFFFF',
            border: '2px solid #6D42E8',
            borderRadius: '16px',
            padding: '20px',
            boxShadow: '0 10px 25px -5px rgba(109, 66, 232, 0.12), 0 8px 10px -6px rgba(109, 66, 232, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>⚡</span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#17143A' }}>Instant Demo Login</span>
              </div>
              <span style={{ fontSize: '11px', background: '#EAE4FF', color: '#4520B8', padding: '3px 8px', borderRadius: '20px', fontWeight: 800 }}>
                FULL ACCESS
              </span>
            </div>

            <div style={{ fontSize: '13px', color: '#667085', lineHeight: 1.4 }}>
              Click below to sign in immediately with universal administrator permissions and access all 10 workspaces.
            </div>

            {/* Target Workspace Selector */}
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475467', display: 'block', marginBottom: '6px' }}>
                Select initial workspace to open:
              </label>
              <select
                value={targetWorkspace}
                onChange={e => setTargetWorkspace(e.target.value as Role)}
                style={{
                  width: '100%',
                  height: '44px',
                  borderRadius: '10px',
                  border: '1px solid #D0D5DD',
                  background: '#F9FAFB',
                  padding: '0 12px',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1E1B4B',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                {WORKSPACE_OPTIONS.map(opt => (
                  <option key={opt.k} value={opt.k}>
                    {opt.title} ({opt.desc})
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn p w"
              onClick={handleInstantDemoLogin}
              disabled={loading}
              style={{
                height: '50px',
                fontSize: '16px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #4520B8 0%, #6D42E8 100%)',
                boxShadow: '0 4px 14px rgba(69, 32, 184, 0.3)',
                cursor: 'pointer'
              }}
            >
              {loading ? 'Signing in...' : '⚡ Enter VivoQuest Platform'}
            </button>
          </div>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ flex: 1, height: '1px', background: '#E4E7EC' }} />
            <span style={{ fontSize: '12px', color: '#98A2B3', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Or sign in with mobile number
            </span>
            <div style={{ flex: 1, height: '1px', background: '#E4E7EC' }} />
          </div>

          {/* STEP 1: PHONE INPUT */}
          {step === 'phone' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label htmlFor="ph" style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', display: 'block', color: '#17143A' }}>
                  Mobile number
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ height: '52px', borderRadius: '12px', background: '#EAE4FF', color: '#4520B8', fontWeight: 800, display: 'flex', alignItems: 'center', padding: '0 16px' }}>
                    +91
                  </div>
                  <input
                    id="ph"
                    className={`input ${phoneErr ? 'err' : ''}`}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="98200 00000"
                    value={phone}
                    onChange={e => {
                      setPhone(e.target.value.replace(/\D/g, ''));
                      setPhoneErr(false);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSendCode();
                    }}
                    style={{ height: '52px' }}
                  />
                </div>
                {phoneErr && <div className="err-t">Enter a 10 digit mobile number.</div>}
              </div>

              <button
                className="btn g w"
                onClick={handleSendCode}
                style={{ height: '48px', fontWeight: 700 }}
              >
                Send Verification Code
              </button>
            </div>
          )}

          {/* STEP 2: OTP INPUT */}
          {step === 'otp' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label htmlFor="otp" style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px', display: 'block', color: '#17143A' }}>
                  6-digit verification code sent to +91 {getCleanPhone()}
                </label>
                <input
                  id="otp"
                  className={`input ${otpErr ? 'err' : ''}`}
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  style={{ letterSpacing: '.4em', textAlign: 'center', fontSize: '24px', fontWeight: 800, height: '56px' }}
                  value={otp}
                  onChange={e => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    setOtpErr(false);
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleVerify();
                  }}
                  autoFocus
                />
                {otpErr && <div className="err-t">Enter code 123456 to verify.</div>}
                <div style={{ fontSize: '12px', color: '#667085', fontWeight: 600, marginTop: '8px' }}>
                  Demo Mode: Enter OTP <strong>123456</strong>.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="btn p w"
                  onClick={handleVerify}
                  disabled={loading}
                  style={{ height: '48px', fontWeight: 800 }}
                >
                  {loading ? 'Verifying...' : 'Verify & Continue'}
                </button>
                <button
                  className="btn g"
                  onClick={() => setStep('phone')}
                  style={{ height: '48px', padding: '0 16px', fontWeight: 700 }}
                >
                  Change
                </button>
              </div>
            </div>
          )}

          {/* Back to Home Link */}
          <button
            style={{ fontWeight: 700, color: '#667085', fontSize: '14px', alignSelf: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 16px' }}
            onClick={() => navigate('/')}
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};