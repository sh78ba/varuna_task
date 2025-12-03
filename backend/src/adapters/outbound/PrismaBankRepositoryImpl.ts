import { PrismaClient } from '@prisma/client';
import { BankRepository } from '../../core/ports/BankRepository';
import { BankEntry } from '../../core/domain/models/BankEntry';

export class PrismaBankRepository implements BankRepository {
  constructor(private prisma: PrismaClient) {}

  async findByShip(shipId: string): Promise<BankEntry[]> {
    const entries = await this.prisma.bankEntry.findMany({
      where: { shipId },
      orderBy: { createdAt: 'desc' },
    });
    return entries as BankEntry[];
  }

  async findByShipAndYear(shipId: string, year: number): Promise<BankEntry[]> {
    const entries = await this.prisma.bankEntry.findMany({
      where: { shipId, year },
      orderBy: { createdAt: 'desc' },
    });
    return entries as BankEntry[];
  }

  async findAvailableBalance(shipId: string): Promise<number> {
    const entries = await this.prisma.bankEntry.findMany({
      where: { shipId, isApplied: false },
    });

    const balance = entries.reduce((sum, entry) => sum + entry.amountGco2eq, 0);
    return balance;
  }

  async create(data: Omit<BankEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<BankEntry> {
    const entry = await this.prisma.bankEntry.create({ data });
    return entry as BankEntry;
  }

  async markAsApplied(id: string): Promise<BankEntry> {
    const entry = await this.prisma.bankEntry.update({
      where: { id },
      data: { isApplied: true },
    });
    return entry as BankEntry;
  }
}
