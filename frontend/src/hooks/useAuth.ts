import { useState, useEffect } from 'react';
import { store } from '../store';
import { UserSession, Role } from '../types';
import { authService } from '../services/authService';

export function useAuth() {
  const [session, setSession] = useState<UserSession | null>(store.session);

  useEffect(() => {
    const unsub = store.subscribe(() => {
      setSession(store.session);
    });
    return () => { unsub(); };
  }, []);

  const login = async (phone: string, otp: string, role: Role) => {
    const s = await authService.verifyOtp(phone, otp, role);
    store.setSession(s);
    return s;
  };

  const logout = () => {
    authService.logout();
    store.setSession(null);
  };

  const switchRole = (role: Role) => {
    store.setRole(role);
  };

  return {
    session,
    isAuthenticated: !!session?.isAuthenticated,
    role: session?.role,
    login,
    logout,
    switchRole
  };
}
