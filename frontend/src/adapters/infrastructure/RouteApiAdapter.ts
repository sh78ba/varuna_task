import apiClient from './apiClient';
import { Route, RouteComparison, RouteFilters } from '../../core/domain/models/Route';

export class RouteApiAdapter {
  async getRoutes(filters?: RouteFilters): Promise<Route[]> {
    const params = new URLSearchParams();
    if (filters?.vesselType) params.append('vesselType', filters.vesselType);
    if (filters?.fuelType) params.append('fuelType', filters.fuelType);
    if (filters?.year) params.append('year', filters.year.toString());

    const response = await apiClient.get(`/routes?${params.toString()}`);
    return response.data;
  }

  async setBaseline(routeId: string): Promise<Route> {
    const response = await apiClient.post(`/routes/${routeId}/baseline`);
    return response.data;
  }

  async getComparisons(filters?: RouteFilters): Promise<RouteComparison[]> {
    const params = new URLSearchParams();
    if (filters?.vesselType) params.append('vesselType', filters.vesselType);
    if (filters?.fuelType) params.append('fuelType', filters.fuelType);
    if (filters?.year) params.append('year', filters.year.toString());

    const response = await apiClient.get(`/routes/comparison?${params.toString()}`);
    return response.data;
  }
}
