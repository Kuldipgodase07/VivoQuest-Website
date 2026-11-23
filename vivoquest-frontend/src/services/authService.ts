import { Role, UserSession } from '../types';

export const ALL_ROLES: Role[] = [
  'admin',
  'patient',
  'caregiver',
  'nurse',
  'clinician',
  'remote-desk',
  'discharge-planner',
  'health-plan',
  'vaccination',
  'marketplace'
];

export const authService = {
  async sendOtp(phone: string): Promise<{ success: boolean; message: string }> {
    const clean = phone.replace(/\D/g, '').slice(-10) || '9820000000';
    return {
      success: true,
      message: `Verification code sent to +91 ${clean}. Demo OTP: 123456`
    };
  },

  async verifyOtp(phone: string, otp: string, requestedRole?: Role): Promise<UserSession> {
    const cleanOtp = otp.trim();
    if (cleanOtp !== '123456' && cleanOtp !== '000000' && cleanOtp.length < 4) {
      throw new Error('Invalid verification code. Please enter demo OTP: 123456');
    }

    const clean = phone.replace(/\D/g, '');
    const digits10 = clean.slice(-10) || '9820000000';

    // Demo Mode: Single unified login for all users with full access across all dashboards
    const session: UserSession = {
      id: `usr_demo_${digits10.slice(-4)}`,
      name: 'Demo Administrator & Healthcare Specialist',
      phone: digits10,
      role: requestedRole || 'admin',
      roles: ALL_ROLES,
      isAuthenticated: true,
      token: `mock_jwt_token_demo_${Date.now()}`
    };

    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('vq_session', JSON.stringify(session));
      sessionStorage.setItem('vq_token', session.token || '');
      localStorage.setItem('vq_session', JSON.stringify(session));
      localStorage.setItem('vq_token', session.token || '');
    }

    return session;
  },

  getCurrentSession(): UserSession | null {
    if (typeof sessionStorage === 'undefined') return null;
    const raw = sessionStorage.getItem('vq_session') || localStorage.getItem('vq_session');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  logout(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('vq_session');
      sessionStorage.removeItem('vq_token');
      localStorage.removeItem('vq_session');
      localStorage.removeItem('vq_token');
    }
  }
};
