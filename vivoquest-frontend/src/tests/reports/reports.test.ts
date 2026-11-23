// @ts-nocheck
import { VQEngine } from '../../reports/engine/vq-engine';
import { reportMockData } from '../../services/mock/reportsMock';

describe('Reports & XLSX / PDF Golden Tests', () => {
  test('VQEngine exports all 8 report generator functions', () => {
    const requiredFns = ['payX', 'outX', 'care', 'dis', 'out', 'inv', 'tblX', 'tblP'];
    requiredFns.forEach(fn => {
      expect(typeof (VQEngine as any)[fn]).toBe('function');
    });
  });
});
