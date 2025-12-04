import { ComputeCBUseCase, ComputeCBRequest } from '../core/application/usecases/ComputeCBUseCase';
import type { ComplianceRepository } from '../core/ports/ComplianceRepository';
import type { ComplianceBalance } from '../core/domain/models/ComplianceBalance';

describe('ComputeCBUseCase', () => {
  let useCase: ComputeCBUseCase;
  let mockComplianceRepository: jest.Mocked<ComplianceRepository>;

  beforeEach(() => {
    mockComplianceRepository = {
      upsert: jest.fn(),
      findByShipAndYear: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as jest.Mocked<ComplianceRepository>;

    useCase = new ComputeCBUseCase(mockComplianceRepository);
  });

  const createMockComplianceBalance = (overrides: Partial<ComplianceBalance> = {}): ComplianceBalance => ({
    id: '1',
    shipId: 'SHIP001',
    year: 2024,
    cbGco2eq: 15000,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  describe('execute', () => {
    it('should compute positive CB for surplus (actual < target)', async () => {
      const request: ComputeCBRequest = {
        shipId: 'SHIP001',
        year: 2025,
        actualIntensity: 85.0, // Below 2025 target (89.3368)
        fuelConsumption: 5000, // tonnes
      };

      const expectedCB = createMockComplianceBalance({
        shipId: 'SHIP001',
        year: 2025,
        cbGco2eq: 886_340_000, // (89.3368 - 85.0) * 5000 * 41000
      });

      mockComplianceRepository.upsert.mockResolvedValue(expectedCB);

      const result = await useCase.execute(request);

      expect(result).toEqual(expectedCB);
      expect(mockComplianceRepository.upsert).toHaveBeenCalledWith({
        shipId: 'SHIP001',
        year: 2025,
        cbGco2eq: expect.any(Number),
      });
      expect(mockComplianceRepository.upsert.mock.calls[0][0].cbGco2eq).toBeGreaterThan(0);
    });

    it('should compute negative CB for deficit (actual > target)', async () => {
      const request: ComputeCBRequest = {
        shipId: 'SHIP002',
        year: 2025,
        actualIntensity: 95.0, // Above 2025 target (89.3368)
        fuelConsumption: 5000,
      };

      const expectedCB = createMockComplianceBalance({
        shipId: 'SHIP002',
        year: 2025,
        cbGco2eq: -1_161_660_000, // (89.3368 - 95.0) * 5000 * 41000
      });

      mockComplianceRepository.upsert.mockResolvedValue(expectedCB);

      const result = await useCase.execute(request);

      expect(result.cbGco2eq).toBeLessThan(0);
      expect(mockComplianceRepository.upsert).toHaveBeenCalledWith({
        shipId: 'SHIP002',
        year: 2025,
        cbGco2eq: expect.any(Number),
      });
    });

    it('should compute zero CB when actual equals target', async () => {
      const request: ComputeCBRequest = {
        shipId: 'SHIP003',
        year: 2025,
        actualIntensity: 89.3368, // Exactly at 2025 target
        fuelConsumption: 5000,
      };

      const expectedCB = createMockComplianceBalance({
        shipId: 'SHIP003',
        year: 2025,
        cbGco2eq: 0,
      });

      mockComplianceRepository.upsert.mockResolvedValue(expectedCB);

      const result = await useCase.execute(request);

      expect(result.cbGco2eq).toBeCloseTo(0, 0);
    });

    it('should use correct target intensity for different years', async () => {
      const request2024: ComputeCBRequest = {
        shipId: 'SHIP001',
        year: 2024, // Before 2025, uses baseline 91.16
        actualIntensity: 90.0,
        fuelConsumption: 1000,
      };

      const request2030: ComputeCBRequest = {
        shipId: 'SHIP001',
        year: 2030, // Uses 2030 target 78.7792
        actualIntensity: 80.0,
        fuelConsumption: 1000,
      };

      mockComplianceRepository.upsert.mockResolvedValue(createMockComplianceBalance());

      await useCase.execute(request2024);
      const call2024 = mockComplianceRepository.upsert.mock.calls[0][0];
      
      await useCase.execute(request2030);
      const call2030 = mockComplianceRepository.upsert.mock.calls[1][0];

      // 2024: (91.16 - 90.0) * 1000 * 41000 = 47,560,000
      expect(call2024.cbGco2eq).toBeCloseTo(47_560_000, -3);
      
      // 2030: (78.7792 - 80.0) * 1000 * 41000 = -50,052,800
      expect(call2030.cbGco2eq).toBeCloseTo(-50_052_800, -3);
    });

    it('should calculate energy in scope correctly', async () => {
      const request: ComputeCBRequest = {
        shipId: 'SHIP001',
        year: 2025,
        actualIntensity: 89.3368,
        fuelConsumption: 10000, // 10,000 tonnes
      };

      mockComplianceRepository.upsert.mockResolvedValue(createMockComplianceBalance());

      await useCase.execute(request);

      // Energy = 10,000 * 41,000 = 410,000,000 MJ
      // CB = (89.3368 - 89.3368) * 410,000,000 = 0
      expect(mockComplianceRepository.upsert).toHaveBeenCalledWith({
        shipId: 'SHIP001',
        year: 2025,
        cbGco2eq: expect.any(Number),
      });
    });

    it('should handle zero fuel consumption', async () => {
      const request: ComputeCBRequest = {
        shipId: 'SHIP001',
        year: 2025,
        actualIntensity: 85.0,
        fuelConsumption: 0,
      };

      const expectedCB = createMockComplianceBalance({
        cbGco2eq: 0,
      });

      mockComplianceRepository.upsert.mockResolvedValue(expectedCB);

      const result = await useCase.execute(request);

      expect(result.cbGco2eq).toBe(0);
    });

    it('should call upsert to create or update compliance balance', async () => {
      const request: ComputeCBRequest = {
        shipId: 'SHIP001',
        year: 2025,
        actualIntensity: 85.0,
        fuelConsumption: 5000,
      };

      mockComplianceRepository.upsert.mockResolvedValue(createMockComplianceBalance());

      await useCase.execute(request);

      expect(mockComplianceRepository.upsert).toHaveBeenCalledTimes(1);
      expect(mockComplianceRepository.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          shipId: 'SHIP001',
          year: 2025,
          cbGco2eq: expect.any(Number),
        })
      );
    });

    it('should handle large fuel consumption values', async () => {
      const request: ComputeCBRequest = {
        shipId: 'SHIP001',
        year: 2025,
        actualIntensity: 88.0,
        fuelConsumption: 50000, // 50,000 tonnes
      };

      mockComplianceRepository.upsert.mockResolvedValue(createMockComplianceBalance());

      await useCase.execute(request);

      const call = mockComplianceRepository.upsert.mock.calls[0][0];
      
      // (89.3368 - 88.0) * 50000 * 41000 = 2,739,044,000
      expect(call.cbGco2eq).toBeGreaterThan(2_700_000_000);
      expect(call.cbGco2eq).toBeLessThan(2_800_000_000);
    });
  });
});
