import { Pool, CreatePoolRequest } from '../domain/models/Pool';

export interface PoolRepository {
  findById(id: string): Promise<Pool | null>;
  findByYear(year: number): Promise<Pool[]>;
  create(data: CreatePoolRequest): Promise<Pool>;
}
