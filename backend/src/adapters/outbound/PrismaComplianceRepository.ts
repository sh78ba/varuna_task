import { PrismaClient } from '@prisma/client';
import { ComplianceRepository } from '../../core/ports/ComplianceRepository';
import { ComplianceBalance } from '../../core/domain/models/ComplianceBalance';

export class PrismaComplianceRepository implements ComplianceRepository {
  constructor(private prisma: PrismaClient) {}

  async findByShipAndYear(shipId: string, year: number): Promise<ComplianceBalance | null> {
    const compliance = await this.prisma.shipCompliance.findUnique({
      where: {
        shipId_year: {
          shipId,
          year,
        },
      },
    });
    return compliance as ComplianceBalance | null;
  }

  async create(
    data: Omit<ComplianceBalance, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ComplianceBalance> {
    const compliance = await this.prisma.shipCompliance.create({ data });
    return compliance as ComplianceBalance;
  }

  async update(id: string, data: Partial<ComplianceBalance>): Promise<ComplianceBalance> {
    const compliance = await this.prisma.shipCompliance.update({
      where: { id },
      data,
    });
    return compliance as ComplianceBalance;
  }

  async upsert(
    data: Omit<ComplianceBalance, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ComplianceBalance> {
    const compliance = await this.prisma.shipCompliance.upsert({
      where: {
        shipId_year: {
          shipId: data.shipId,
          year: data.year,
        },
      },
      update: {
        cbGco2eq: data.cbGco2eq,
      },
      create: data,
    });
    return compliance as ComplianceBalance;
  }
}
