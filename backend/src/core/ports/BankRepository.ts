import { BankEntry } from '../domain/models/BankEntry';

export interface BankRepository {
  findByShip(shipId: string): Promise<BankEntry[]>;
  findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]>;
  findAvailableBalance(shipId: string): Promise<number>;
  create(data: Omit<BankEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<BankEntry>;
  markAsApplied(id: string): Promise<BankEntry>;
}
