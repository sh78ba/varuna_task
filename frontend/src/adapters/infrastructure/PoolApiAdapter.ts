import apiClient from './apiClient';
import { Pool, CreatePoolRequest } from '../../core/domain/models/Pool';

export class PoolApiAdapter {
  async createPool(request: CreatePoolRequest): Promise<Pool> {
    const response = await apiClient.post('/pools', request);
    return response.data;
  }

  async getPoolsByYear(year: number): Promise<Pool[]> {
    const response = await apiClient.get(`/pools?year=${year}`);
    return response.data;
  }

  async getPoolById(id: string): Promise<Pool> {
    const response = await apiClient.get(`/pools/${id}`);
    return response.data;
  }
}
