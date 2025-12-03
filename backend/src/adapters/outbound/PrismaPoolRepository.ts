import { PrismaClient } from '@prisma/client';
import { PoolRepository } from '../../core/ports/PoolRepository';
import { Pool, CreatePoolRequest } from '../../core/domain/models/Pool';

export class PrismaPoolRepository implements PoolRepository {
  constructor(private prisma: PrismaClient) {}

  async findById(id: string): Promise<Pool | null> {
    const pool = await this.prisma.pool.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!pool) return null;

    return pool as Pool;
  }

  async findByYear(year: number): Promise<Pool[]> {
    const pools = await this.prisma.pool.findMany({
      where: { year },
      include: { members: true },
    });

    return pools as Pool[];
  }

  async create(data: CreatePoolRequest): Promise<Pool> {
    const pool = await this.prisma.pool.create({
      data: {
        year: data.year,
        members: {
          create: data.members.map(member => ({
            shipId: member.shipId,
            cbBefore: member.cbBefore,
            cbAfter: 'cbAfter' in member ? member.cbAfter : member.cbBefore,
          })),
        },
      },
      include: { members: true },
    });

    return pool as Pool;
  }
}
