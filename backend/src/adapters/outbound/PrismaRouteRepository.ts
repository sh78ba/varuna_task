import { PrismaClient } from '@prisma/client';
import { RouteRepository } from '../../core/ports/RouteRepository';
import { Route, RouteFilters } from '../../core/domain/models/Route';

export class PrismaRouteRepository implements RouteRepository {
  constructor(private prisma: PrismaClient) {}

  async findAll(filters?: RouteFilters): Promise<Route[]> {
    const where: any = {};

    if (filters?.vesselType) {
      where.vesselType = filters.vesselType;
    }

    if (filters?.fuelType) {
      where.fuelType = filters.fuelType;
    }

    if (filters?.year) {
      where.year = filters.year;
    }

    const routes = await this.prisma.route.findMany({ where });
    return routes as Route[];
  }

  async findById(id: string): Promise<Route | null> {
    const route = await this.prisma.route.findUnique({ where: { id } });
    return route as Route | null;
  }

  async findByRouteId(routeId: string): Promise<Route | null> {
    const route = await this.prisma.route.findUnique({ where: { routeId } });
    return route as Route | null;
  }

  async findBaseline(): Promise<Route | null> {
    const route = await this.prisma.route.findFirst({
      where: { isBaseline: true },
    });
    return route as Route | null;
  }

  async create(data: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>): Promise<Route> {
    const route = await this.prisma.route.create({ data });
    return route as Route;
  }

  async update(id: string, data: Partial<Route>): Promise<Route> {
    const route = await this.prisma.route.update({
      where: { id },
      data,
    });
    return route as Route;
  }

  async setBaseline(routeId: string): Promise<Route> {
    // First, unset any existing baseline
    await this.prisma.route.updateMany({
      where: { isBaseline: true },
      data: { isBaseline: false },
    });

    // Then set the new baseline
    const route = await this.prisma.route.update({
      where: { routeId },
      data: { isBaseline: true },
    });

    return route as Route;
  }
}
