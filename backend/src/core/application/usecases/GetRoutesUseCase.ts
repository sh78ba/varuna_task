import { RouteRepository } from '../../ports/RouteRepository';
import { Route, RouteFilters } from '../../domain/models/Route';

export class GetRoutesUseCase {
  constructor(private routeRepository: RouteRepository) {}

  async execute(filters?: RouteFilters): Promise<Route[]> {
    return this.routeRepository.findAll(filters);
  }
}
