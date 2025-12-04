import { ComputeComparisonUseCase } from '../core/application/usecases/ComputeComparisonUseCase';
import { RouteRepository } from '../core/ports/RouteRepository';
import type { Route } from '../core/domain/models/Route';

describe('ComputeComparisonUseCase', () => {
  let useCase: ComputeComparisonUseCase;
  let mockRouteRepository: jest.Mocked<RouteRepository>;

  beforeEach(() => {
    mockRouteRepository = {
      findBaseline: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findByRouteId: jest.fn(),
      setBaseline: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as jest.Mocked<RouteRepository>;

    useCase = new ComputeComparisonUseCase(mockRouteRepository);
  });

  const createMockRoute = (overrides: Partial<Route> = {}): Route => ({
    id: '1',
    routeId: 'R001',
    vesselType: 'Container',
    fuelType: 'HFO',
    year: 2024,
    ghgIntensity: 91.0,
    distance: 5000,
    fuelConsumption: 12000,
    totalEmissions: 450000,
    isBaseline: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  describe('execute', () => {
    it('should compute comparisons successfully when baseline exists', async () => {
      const baseline = createMockRoute({ 
        routeId: 'R001', 
        ghgIntensity: 91.0, 
        isBaseline: true,
        year: 2025
      });
      const route2 = createMockRoute({ 
        routeId: 'R002', 
        ghgIntensity: 85.0,
        year: 2025
      });
      const route3 = createMockRoute({ 
        routeId: 'R003', 
        ghgIntensity: 95.0,
        year: 2025
      });

      mockRouteRepository.findBaseline.mockResolvedValue(baseline);
      mockRouteRepository.findAll.mockResolvedValue([baseline, route2, route3]);

      const result = await useCase.execute();

      expect(result).toHaveLength(2);
      expect(result[0].baseline).toEqual(baseline);
      expect(result[0].comparison).toEqual(route2);
      expect(result[0].percentDiff).toBeCloseTo(-6.59, 1);
      expect(result[0].compliant).toBe(true);

      expect(result[1].comparison).toEqual(route3);
      expect(result[1].percentDiff).toBeCloseTo(4.40, 1);
      expect(result[1].compliant).toBe(false);
    });

    it('should throw error when no baseline is set', async () => {
      mockRouteRepository.findBaseline.mockResolvedValue(null);

      await expect(useCase.execute()).rejects.toThrow('No baseline route set');
    });

    it('should exclude baseline route from comparisons', async () => {
      const baseline = createMockRoute({ 
        routeId: 'R001', 
        isBaseline: true 
      });
      const route2 = createMockRoute({ routeId: 'R002' });

      mockRouteRepository.findBaseline.mockResolvedValue(baseline);
      mockRouteRepository.findAll.mockResolvedValue([baseline, route2]);

      const result = await useCase.execute();

      expect(result).toHaveLength(1);
      expect(result[0].comparison.routeId).toBe('R002');
      expect(result.every(r => r.baseline.routeId === 'R001')).toBe(true);
    });

    it('should apply filters correctly', async () => {
      const baseline = createMockRoute({ 
        routeId: 'R001', 
        vesselType: 'Container',
        isBaseline: true 
      });
      const route2 = createMockRoute({ 
        routeId: 'R002',
        vesselType: 'Container'
      });

      mockRouteRepository.findBaseline.mockResolvedValue(baseline);
      mockRouteRepository.findAll.mockResolvedValue([baseline, route2]);

      const filters = { vesselType: 'Container', year: 2024 };
      await useCase.execute(filters);

      expect(mockRouteRepository.findAll).toHaveBeenCalledWith(filters);
    });

    it('should return empty array when only baseline exists', async () => {
      const baseline = createMockRoute({ isBaseline: true });

      mockRouteRepository.findBaseline.mockResolvedValue(baseline);
      mockRouteRepository.findAll.mockResolvedValue([baseline]);

      const result = await useCase.execute();

      expect(result).toHaveLength(0);
    });

    it('should mark routes as compliant based on target intensity', async () => {
      const baseline = createMockRoute({ 
        routeId: 'R001',
        ghgIntensity: 90.0,
        isBaseline: true,
        year: 2025
      });
      const compliantRoute = createMockRoute({ 
        routeId: 'R002',
        ghgIntensity: 88.0, // Below 2025 target (89.3368)
        year: 2025
      });
      const nonCompliantRoute = createMockRoute({ 
        routeId: 'R003',
        ghgIntensity: 92.0, // Above 2025 target
        year: 2025
      });

      mockRouteRepository.findBaseline.mockResolvedValue(baseline);
      mockRouteRepository.findAll.mockResolvedValue([baseline, compliantRoute, nonCompliantRoute]);

      const result = await useCase.execute();

      expect(result[0].compliant).toBe(true);
      expect(result[1].compliant).toBe(false);
    });

    it('should calculate correct percentage differences', async () => {
      const baseline = createMockRoute({ 
        routeId: 'R001',
        ghgIntensity: 100.0,
        isBaseline: true
      });
      const improvedRoute = createMockRoute({ 
        routeId: 'R002',
        ghgIntensity: 90.0
      });
      const worseRoute = createMockRoute({ 
        routeId: 'R003',
        ghgIntensity: 110.0
      });

      mockRouteRepository.findBaseline.mockResolvedValue(baseline);
      mockRouteRepository.findAll.mockResolvedValue([baseline, improvedRoute, worseRoute]);

      const result = await useCase.execute();

      expect(result[0].percentDiff).toBeCloseTo(-10.0, 1);
      expect(result[1].percentDiff).toBeCloseTo(10.0, 1);
    });
  });
});
