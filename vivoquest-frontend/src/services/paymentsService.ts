import { mockPayments } from './mock/paymentsMock';

export const paymentsService = {
  async getTransactions() {
    return mockPayments;
  }
};
