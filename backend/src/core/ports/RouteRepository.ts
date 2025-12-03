import { Route, RouteFilters } from '../domain/models/Route';

export interface RouteRepository {
  findAll(filters?: RouteFilters): Promise<Route[]>;
  findById(id: string): Promise<Route | null>;
  findByRouteId(routeId: string): Promise<Route | null>;
  findBaseline(): Promise<Route | null>;
  create(route: Omit<Route, 'id' | 'createdAt' | 'updatedAt'>): Promise<Route>;
  update(id: string, data: Partial<Route>): Promise<Route>;
  setBaseline(routeId: string): Promise<Route>;
}
