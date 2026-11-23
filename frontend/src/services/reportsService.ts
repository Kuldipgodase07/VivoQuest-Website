import { reportMockData } from './mock/reportsMock';
import { dl, run, tblRun } from '../app/vqapp';

export const reportsService = {
  getData(type: string) {
    return reportMockData[type] || null;
  },
  downloadReport: dl,
  runReport: run,
  runTableReport: tblRun
};
