import React from 'react';
import { TableColumn } from '../types';

export interface DataTableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  keyField?: string;
  emptyMessage?: string;
}

export function DataTable<T = any>({
  columns,
  data,
  keyField = 'id',
  emptyMessage = 'No records found'
}: DataTableProps<T>) {
  return (
    <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '16px', border: '1.5px solid #E6E2F0' }}>
      <table className="dt-tbl">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th key={idx}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '32px', color: '#667085' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row: any, rIdx) => (
              <tr key={row[keyField] || rIdx}>
                {columns.map((col, cIdx) => (
                  <td key={cIdx}>
                    {col.render ? col.render(row) : (row[col.key] != null ? String(row[col.key]) : '—')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
