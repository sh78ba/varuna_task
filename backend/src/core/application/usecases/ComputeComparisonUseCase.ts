import { RouteRepository } from '../../ports/RouteRepository';
import { RouteComparison, RouteFilters } from '../../domain/models/Route';
import { calculatePercentDiff, getTargetIntensity, isCompliant } from '../../domain/services/ComplianceCalculator';

export class ComputeComparisonUseCase {
  constructor(private routeRepository: RouteRepository) {}

  async execute(filters?: RouteFilters): Promise<RouteComparison[]> {
    const baseline = await this.routeRepository.findBaseline();
    
    if (!baseline) {
      throw new Error('No baseline route set. Please set a baseline first.');
    }

    const allRoutes = await this.routeRepository.findAll(filters);
    const comparisonRoutes = allRoutes.filter(r => r.routeId !== baseline.routeId);

    const comparisons: RouteComparison[] = comparisonRoutes.map(comparison => {
      const percentDiff = calculatePercentDiff(comparison.ghgIntensity, baseline.ghgIntensity);
      const targetIntensity = getTargetIntensity(comparison.year);
      const isRouteCompliant = isCompliant(comparison.ghgIntensity, targetIntensity);

      return {
        baseline,
        comparison,
        percentDiff,
        compliant: isRouteCompliant,
      };
    });

    return comparisons;
  }
}
