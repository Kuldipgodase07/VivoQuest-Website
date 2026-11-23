import React from 'react';

export interface ToastProps {
  message: string;
  bad?: boolean;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, bad, onClose }) => {
  return (
    <div className={`vq-toast ${bad ? 'vq-toast--bad' : ''}`} role="status">
      <span>{message}</span>
      {onClose && (
        <button onClick={onClose} style={{ color: '#fff', marginLeft: '10px', cursor: 'pointer' }}>
          ✕
        </button>
      )}
    </div>
  );
};
