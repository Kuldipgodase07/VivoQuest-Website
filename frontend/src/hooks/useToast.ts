import { useState, useCallback } from 'react';

export interface ToastState {
  id: number;
  message: string;
  tone?: 'ok' | 'bad' | 'info';
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const show = useCallback((message: string, tone: 'ok' | 'bad' | 'info' = 'ok') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, tone }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  }, []);

  return { toasts, show };
}
