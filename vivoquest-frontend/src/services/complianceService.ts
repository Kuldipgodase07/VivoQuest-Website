import { mockAuditLogs } from './mock/complianceMock';

export const complianceService = {
  async getAuditLogs() {
    return mockAuditLogs;
  }
};
