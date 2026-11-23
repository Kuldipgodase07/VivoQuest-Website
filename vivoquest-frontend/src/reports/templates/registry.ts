import { VQEngine } from '../engine/vq-engine';

export interface ReportTemplate {
  slug: string;
  periodic?: boolean;
  formats: {
    pdf?: (data: any) => Uint8Array;
    xlsx?: (data: any) => Uint8Array;
  };
}

export const REGISTRY: Record<string, ReportTemplate> = {
  'patient-care': {
    slug: 'Care-Summary',
    periodic: true,
    formats: {
      pdf: (d) => VQEngine.care(d)
    }
  },
  'discharge': {
    slug: 'Discharge-Summary',
    periodic: false,
    formats: {
      pdf: (d) => VQEngine.dis(d)
    }
  },
  'invoice': {
    slug: 'Invoice',
    periodic: false,
    formats: {
      pdf: (d) => VQEngine.inv(d)
    }
  },
  'outcomes': {
    slug: 'Outcomes-Report',
    periodic: true,
    formats: {
      pdf: (d) => VQEngine.out(d),
      xlsx: (d) => VQEngine.outX(d)
    }
  },
  'payments': {
    slug: 'Payments',
    periodic: true,
    formats: {
      xlsx: (d) => VQEngine.payX(d)
    }
  }
};
