import { mockCatalog } from './mock/marketplaceMock';
import { ProductItem } from '../types';

export const marketplaceService = {
  async getCatalog(): Promise<ProductItem[]> {
    return mockCatalog;
  }
};
