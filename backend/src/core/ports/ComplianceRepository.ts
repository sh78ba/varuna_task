import { ComplianceBalance } from '../domain/models/ComplianceBalance';

export interface ComplianceRepository {
  findByShipAndYear(shipId: string, year: number): Promise<ComplianceBalance | null>;
  create(data: Omit<ComplianceBalance, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComplianceBalance>;
  update(id: string, data: Partial<ComplianceBalance>): Promise<ComplianceBalance>;
  upsert(data: Omit<ComplianceBalance, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComplianceBalance>;
}
