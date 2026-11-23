import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface WorkspaceFrameProps {
  screen: string;
  title: string;
}

export const WorkspaceFrame: React.FC<WorkspaceFrameProps> = ({ screen, title }) => {
  const navigate = useNavigate();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data) return;
      if (e.data.type === 'NAVIGATE' && e.data.path) {
        navigate(e.data.path);
      }
      if (e.data.type === 'NAVIGATE_BACK') {
        if (window.history.length > 1) {
          navigate(-1);
        } else {
          navigate('/');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigate]);

  return (
    <iframe
      ref={iframeRef}
      src={`/screens/${screen}.html`}
      title={title}
      style={{
        width: '100%',
        height: '100vh',
        border: 'none',
        display: 'block',
        margin: 0,
        padding: 0
      }}
    />
  );
};
