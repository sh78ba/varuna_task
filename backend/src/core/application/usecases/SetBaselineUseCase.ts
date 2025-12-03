import { RouteRepository } from '../ports/RouteRepository';
import { Route } from '../domain/models/Route';

export class SetBaselineUseCase {
  constructor(private routeRepository: RouteRepository) {}

  async execute(routeId: string): Promise<Route> {
    const route = await this.routeRepository.findByRouteId(routeId);
    
    if (!route) {
      throw new Error(`Route ${routeId} not found`);
    }

    return this.routeRepository.setBaseline(routeId);
  }
}
