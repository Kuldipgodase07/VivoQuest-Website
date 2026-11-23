export function bytesSave(bytes: Uint8Array | string, name: string, mime: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([bytes as any], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 4000);
}

export function downloadFile(bytes: Uint8Array | string, name: string, fmt: 'pdf' | 'xlsx' | 'csv'): void {
  const mimeMap = {
    pdf: 'application/pdf',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv;charset=utf-8'
  };
  bytesSave(bytes, name, mimeMap[fmt] || 'application/octet-stream');
}
