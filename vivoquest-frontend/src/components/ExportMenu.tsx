import React, { useState, useRef, useEffect } from 'react';
import { VQApp } from '../app/vqapp';
import { useAppToast } from '../app/providers';

export interface ExportMenuProps {
  reportType?: string;
  title: string;
  head?: string[];
  data?: any[][];
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  reportType,
  title,
  head = [],
  data = []
}) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useAppToast();

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleExport = (fmt: 'PDF' | 'XLSX' | 'CSV') => {
    setOpen(false);
    toast(`Generating ${fmt} export...`);

    if (reportType) {
      const lowerFmt = fmt.toLowerCase() as 'pdf' | 'xlsx';
      VQApp.run(
        msg => toast(msg),
        reportType,
        lowerFmt
      );
    } else {
      VQApp.tblRun(
        msg => toast(msg),
        fmt,
        title,
        head,
        data,
        { kpiRows: true }
      );
    }
  };

  return (
    <div className="export-menu" ref={menuRef}>
      <button className="btn g sm" onClick={() => setOpen(!open)}>
        <svg className="ic" viewBox="0 0 24 24" style={{ width: '16px', height: '16px' }}>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
        <span>Export</span>
      </button>

      {open && (
        <div className="export-dropdown">
          <button onClick={() => handleExport('PDF')}>Export as PDF Document</button>
          <button onClick={() => handleExport('XLSX')}>Export as Excel (.xlsx)</button>
          <button onClick={() => handleExport('CSV')}>Export as CSV Data</button>
        </div>
      )}
    </div>
  );
};
