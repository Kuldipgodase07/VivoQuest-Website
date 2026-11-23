// @ts-nocheck
import { VQEngine } from '../reports/engine/vq-engine';
import { bytesSave } from '../reports/download';
import { REGISTRY } from '../reports/templates/registry';
import { reportMockData } from '../services/mock/reportsMock';

export interface ReportSpecOptions {
  title?: string;
  subtitle?: string;
  module?: string;
  kpis?: Array<{ l: string; v: string; txt?: number; d?: string }>;
  noKpi?: boolean;
  kv?: any;
  kpiRows?: boolean;
  patch?: (data: any) => void;
  periodSlug?: string;
  filename?: string;
}

export function modFor(n: string): string {
  const s = String(n).toLowerCase();
  if (/transaction|settle|refund|reconcil|invoice|finance|gst|receivable|payment|collection/.test(s)) return 'Payments';
  if (/compliance|audit|control|filing|statutory|auditor|approval/.test(s)) return 'Compliance';
  if (/user|member|access|engagement/.test(s)) return 'Users';
  if (/product|order|vendor|marketplace/.test(s)) return 'Marketplace';
  if (/privacy|security/.test(s)) return 'Security';
  return 'Admin';
}

const PER = /\s(Last \d+ days|Today|This week|This month|Last quarter|FY [\d–-]+)$/;

export function cap(x: string): string {
  const s = String(x).trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function today(): string {
  const D = new Date();
  const M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${D.getDate()} ${M[D.getMonth()]} ${D.getFullYear()}`;
}

export function spec(name: string, head: string[], data: any[][], title?: string, o: ReportSpecOptions = {}): any {
  const raw = String(title || name).replace(/^VivoQuest\s+/i, '');
  const parts = raw.split(/\s[|·]\s/);
  let main = parts[0];
  let sub = parts.slice(1).join(' · ');
  const m = PER.exec(main);
  if (m && !sub) {
    sub = m[1];
    main = main.replace(PER, '');
  }
  return {
    title: o.title || cap(main),
    subtitle: o.subtitle || sub,
    module: o.module || modFor(name + ' ' + raw),
    head,
    rows: data,
    kpis: o.kpis,
    by: 'Administrator console',
    noKpi: o.noKpi,
    kv: o.kv
  };
}

export function tbl(fmt: 'PDF' | 'XLSX', name: string, head: string[], data: any[][], title?: string, o: ReportSpecOptions = {}): string {
  const sp = spec(name, head, data, title, o);
  if (fmt === 'PDF') {
    const bytes = VQEngine.tblP ? VQEngine.tblP(sp) : new Uint8Array();
    bytesSave(bytes, `${name}.pdf`, 'application/pdf');
    return `${name}.pdf`;
  }
  const bytes = VQEngine.tblX ? VQEngine.tblX(sp) : new Uint8Array();
  bytesSave(bytes, `${name}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  return `${name}.xlsx`;
}

export function csv(name: string, head: string[], data: any[][]): string {
  const esc = (v: any) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const content = '\uFEFF' + [head].concat(data).map(r => r.map(esc).join(',')).join('\r\n');
  bytesSave(content, `${name}.csv`, 'text/csv;charset=utf-8');
  return `${name}.csv`;
}

export function tblRun(
  say: ((msg: string) => void) | undefined,
  fmt: 'PDF' | 'XLSX' | 'CSV',
  title: string,
  head: string[],
  data: any[][],
  o: ReportSpecOptions = {}
): void {
  try {
    if (o.kpiRows && data.length > 0) {
      o.kpis = data.slice(0, 4).map(r => ({
        l: String(r[0]).toUpperCase(),
        v: String(r[1]),
        txt: 1,
        d: String(r[2] || '')
      }));
    }
    let nm = `VivoQuest ${title.charAt(0).toLowerCase()}${title.slice(1)}${o.subtitle ? ' ' + o.subtitle : ''}`;
    nm = nm.replace(/[\\/:*?"<>|]+/g, '-');
    const fn = fmt === 'CSV'
      ? csv(nm, head, data)
      : tbl(fmt, nm, head, data, title + (o.subtitle ? ' | ' + o.subtitle : ''), o);
    say?.(`${fn} downloaded · ${data.length} rows`);
  } catch (e: any) {
    say?.(`Could not create the report: ${e?.message || e}`);
  }
}

export function dl(type: string, fmt: 'pdf' | 'xlsx', o: ReportSpecOptions = {}): Promise<{ filename: string; size: number }> {
  return new Promise((resolve, reject) => {
    try {
      const template = REGISTRY[type];
      const dataSrc = JSON.parse(JSON.stringify(reportMockData[type] || {}));
      if (o.patch) o.patch(dataSrc);

      const fn = template?.formats?.[fmt];
      if (!fn) {
        throw new Error(`Format ${fmt} not supported for template ${type}`);
      }
      const bytes = fn(dataSrc);
      const name = o.filename || `VivoQuest_${template.slug || type}_${fmt.toUpperCase()}.${fmt}`;
      const mime = fmt === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      bytesSave(bytes, name, mime);
      resolve({ filename: name, size: bytes.length });
    } catch (err) {
      reject(err);
    }
  });
}

export function run(
  say: ((msg: string) => void) | undefined,
  type: string,
  fmt: 'pdf' | 'xlsx',
  o: ReportSpecOptions = {}
): Promise<any> {
  say?.(`Preparing your ${fmt === 'xlsx' ? 'Excel' : 'PDF'} report…`);
  return dl(type, fmt, o).then(
    r => {
      say?.(`${r.filename} downloaded`);
      return r;
    },
    e => {
      say?.(`Could not create the report: ${e?.message || e}`);
      throw e;
    }
  );
}

export function inv(say: ((msg: string) => void) | undefined, x: any): Promise<any> {
  x.date = today();
  return run(say, 'invoice', 'pdf', {
    patch: (d: any) => {
      Object.keys(x).forEach(k => {
        d[k] = x[k];
      });
    }
  });
}

export const VQApp = { today, spec, tbl, csv, tblRun, dl, run, inv };
if (typeof window !== 'undefined') {
  (window as any).VQApp = VQApp;
}
export default VQApp;
