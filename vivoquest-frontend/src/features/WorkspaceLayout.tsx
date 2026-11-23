import React from 'react';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/shell.css';
import '../styles/components.css';

export interface WorkspaceLayoutProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  title,
  subtitle,
  action,
  children
}) => {
  return (
    <div className="shell">
      <Sidebar />
      <div className="workspace">
        <Topbar title={title} subtitle={subtitle} action={action} />
        <main className="workspace-content">
          {children}
        </main>
      </div>
    </div>
  );
};
