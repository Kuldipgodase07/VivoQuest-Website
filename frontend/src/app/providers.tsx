import React, { createContext, useContext, useState } from 'react';

interface ToastContextType {
  toast: (msg: string, isError?: boolean) => void;
}

const ToastContext = createContext<ToastContextType>({ toast: () => {} });

export const useAppToast = () => useContext(ToastContext);

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Array<{ id: number; text: string; bad?: boolean }>>([]);

  const toast = (text: string, isError?: boolean) => {
    const id = Date.now();
    setMessages(prev => [...prev, { id, text, bad: isError }]);
    setTimeout(() => {
      setMessages(prev => prev.filter(m => m.id !== id));
    }, 3200);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="vq-toast-container">
        {messages.map(m => (
          <div key={m.id} className={`vq-toast ${m.bad ? 'vq-toast--bad' : ''}`}>
            {m.text}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
