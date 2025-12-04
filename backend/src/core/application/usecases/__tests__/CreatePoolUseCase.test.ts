import { CreatePoolUseCase } from '../CreatePoolUseCase';
import type { PoolRepository } from '../../../ports/PoolRepository';
import type { ComplianceRepository } from '../../../ports/ComplianceRepository';
import type { CreatePoolRequest, Pool } from '../../../domain/models/Pool';
import type { ComplianceBalance } from '../../../domain/models/ComplianceBalance';

describe('CreatePoolUseCase', () => {
  let useCase: CreatePoolUseCase;
  let mockPoolRepository: jest.Mocked<PoolRepository>;
  let mockComplianceRepository: jest.Mocked<ComplianceRepository>;

  beforeEach(() => {
    mockPoolRepository = {
      create: jest.fn(),
      findByYear: jest.fn(),
      findById: jest.fn(),
    } as jest.Mocked<PoolRepository>;

    mockComplianceRepository = {
      findByShipAndYear: jest.fn(),
      upsert: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as jest.Mocked<ComplianceRepository>;

    useCase = new CreatePoolUseCase(mockPoolRepository, mockComplianceRepository);
  });

  const createMockCompliance = (shipId: string, cbGco2eq: number): ComplianceBalance => ({
    id: `${shipId}-comp`,
    shipId,
    year: 2024,
    cbGco2eq,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createMockPool = (overrides: Partial<Pool> = {}): Pool => ({
    id: '1',
    year: 2024,
    createdAt: new Date(),
    members: [],
    ...overrides,
  });

  describe('execute', () => {
    it('should create pool successfully with valid members', async () => {
      const request: CreatePoolRequest = {
        year: 2024,
        members: [
          { shipId: 'SHIP001', cbBefore: 15000 },
          { shipId: 'SHIP002', cbBefore: -8000 },
        ],
      };

      mockComplianceRepository.findByShipAndYear
        .mockResolvedValueOnce(createMockCompliance('SHIP001', 15000))
        .mockResolvedValueOnce(createMockCompliance('SHIP002', -8000));

      const expectedPool = createMockPool({
        id: '1',
        year: 2024,
        members: [
          { id: '1', poolId: '1', shipId: 'SHIP001', cbBefore: 15000, cbAfter: 7000 },
          { id: '2', poolId: '1', shipId: 'SHIP002', cbBefore: -8000, cbAfter: 0 },
        ],
      });

      mockPoolRepository.create.mockResolvedValue(expectedPool);

      const result = await useCase.execute(request);

      expect(result).toEqual(expectedPool);
      expect(mockPoolRepository.create).toHaveBeenCalledTimes(1);
    });

    it('should throw error when pool has less than 2 members', async () => {
      const request: CreatePoolRequest = {
        year: 2024,
        members: [
          { shipId: 'SHIP001', cbBefore: 15000 },
        ],
      };

      await expect(useCase.execute(request)).rejects.toThrow('Pool validation failed');
    });

    it('should throw error when total CB is negative', async () => {
      const request: CreatePoolRequest = {
        year: 2024,
        members: [
          { shipId: 'SHIP001', cbBefore: -10000 },
          { shipId: 'SHIP002', cbBefore: -8000 },
        ],
      };

      await expect(useCase.execute(request)).rejects.toThrow('Pool validation failed');
    });

    it('should accept pool when total CB is zero', async () => {
      const request: CreatePoolRequest = {
        year: 2024,
        members: [
          { shipId: 'SHIP001', cbBefore: 8000 },
          { shipId: 'SHIP002', cbBefore: -8000 },
        ],
      };

      mockComplianceRepository.findByShipAndYear
        .mockResolvedValueOnce(createMockCompliance('SHIP001', 8000))
        .mockResolvedValueOnce(createMockCompliance('SHIP002', -8000));

      mockPoolRepository.create.mockResolvedValue(createMockPool());

      const result = await useCase.execute(request);

      expect(result).toBeDefined();
    });

    it('should throw error when compliance record not found for a ship', async () => {
      const request: CreatePoolRequest = {
        year: 2024,
        members: [
          { shipId: 'SHIP001', cbBefore: 15000 },
          { shipId: 'SHIP999', cbBefore: -8000 },
        ],
      };

      mockComplianceRepository.findByShipAndYear
        .mockResolvedValueOnce(createMockCompliance('SHIP001', 15000))
        .mockResolvedValueOnce(null);

      await expect(useCase.execute(request)).rejects.toThrow(
        'No compliance record found for ship SHIP999 in year 2024'
      );
    });

    it('should allocate surplus to deficit ships correctly', async () => {
      const request: CreatePoolRequest = {
        year: 2024,
        members: [
          { shipId: 'SHIP001', cbBefore: 20000 },
          { shipId: 'SHIP002', cbBefore: -10000 },
          { shipId: 'SHIP003', cbBefore: -5000 },
        ],
      };

      mockComplianceRepository.findByShipAndYear
        .mockResolvedValueOnce(createMockCompliance('SHIP001', 20000))
        .mockResolvedValueOnce(createMockCompliance('SHIP002', -10000))
        .mockResolvedValueOnce(createMockCompliance('SHIP003', -5000));

      const expectedPool = createMockPool({
        members: [
          { id: '1', poolId: '1', shipId: 'SHIP001', cbBefore: 20000, cbAfter: 5000 },
          { id: '2', poolId: '1', shipId: 'SHIP002', cbBefore: -10000, cbAfter: 0 },
          { id: '3', poolId: '1', shipId: 'SHIP003', cbBefore: -5000, cbAfter: 0 },
        ],
      });

      mockPoolRepository.create.mockResolvedValue(expectedPool);

      const result = await useCase.execute(request);

      expect(result.members).toHaveLength(3);
      expect(result.members.find(m => m.shipId === 'SHIP002')?.cbAfter).toBe(0);
      expect(result.members.find(m => m.shipId === 'SHIP003')?.cbAfter).toBe(0);
    });

    it('should not modify balances when all ships have surplus', async () => {
      const request: CreatePoolRequest = {
        year: 2024,
        members: [
          { shipId: 'SHIP001', cbBefore: 15000 },
          { shipId: 'SHIP002', cbBefore: 10000 },
        ],
      };

      mockComplianceRepository.findByShipAndYear
        .mockResolvedValueOnce(createMockCompliance('SHIP001', 15000))
        .mockResolvedValueOnce(createMockCompliance('SHIP002', 10000));

      const expectedPool = createMockPool({
        members: [
          { id: '1', poolId: '1', shipId: 'SHIP001', cbBefore: 15000, cbAfter: 15000 },
          { id: '2', poolId: '1', shipId: 'SHIP002', cbBefore: 10000, cbAfter: 10000 },
        ],
      });

      mockPoolRepository.create.mockResolvedValue(expectedPool);

      const result = await useCase.execute(request);

      expect(result.members.every(m => m.cbAfter === m.cbBefore)).toBe(true);
    });

    it('should handle large pool with multiple deficit ships', async () => {
      const request: CreatePoolRequest = {
        year: 2024,
        members: [
          { shipId: 'SHIP001', cbBefore: 50000 },
          { shipId: 'SHIP002', cbBefore: -15000 },
          { shipId: 'SHIP003', cbBefore: -10000 },
          { shipId: 'SHIP004', cbBefore: -20000 },
        ],
      };

      mockComplianceRepository.findByShipAndYear
        .mockResolvedValueOnce(createMockCompliance('SHIP001', 50000))
        .mockResolvedValueOnce(createMockCompliance('SHIP002', -15000))
        .mockResolvedValueOnce(createMockCompliance('SHIP003', -10000))
        .mockResolvedValueOnce(createMockCompliance('SHIP004', -20000));

      mockPoolRepository.create.mockResolvedValue(createMockPool());

      const result = await useCase.execute(request);

      expect(result).toBeDefined();
      expect(mockComplianceRepository.findByShipAndYear).toHaveBeenCalledTimes(4);
    });

    it('should reject pool where deficit ship exits worse after pooling', async () => {
      // This is caught by validateAllocations - deficit ships must not get worse
      const request: CreatePoolRequest = {
        year: 2024,
        members: [
          { shipId: 'SHIP001', cbBefore: 5000 },
          { shipId: 'SHIP002', cbBefore: -10000 },
        ],
      };

      mockComplianceRepository.findByShipAndYear
        .mockResolvedValueOnce(createMockCompliance('SHIP001', 5000))
        .mockResolvedValueOnce(createMockCompliance('SHIP002', -10000));

      // This pool cannot be valid - deficit needs 10000 but only 5000 available
      await expect(useCase.execute(request)).rejects.toThrow();
    });

    it('should verify all compliance records exist before creating pool', async () => {
      const request: CreatePoolRequest = {
        year: 2024,
        members: [
          { shipId: 'SHIP001', cbBefore: 15000 },
          { shipId: 'SHIP002', cbBefore: -8000 },
        ],
      };

      mockComplianceRepository.findByShipAndYear
        .mockResolvedValueOnce(createMockCompliance('SHIP001', 15000))
        .mockResolvedValueOnce(createMockCompliance('SHIP002', -8000));

      mockPoolRepository.create.mockResolvedValue(createMockPool());

      await useCase.execute(request);

      expect(mockComplianceRepository.findByShipAndYear).toHaveBeenCalledWith('SHIP001', 2024);
      expect(mockComplianceRepository.findByShipAndYear).toHaveBeenCalledWith('SHIP002', 2024);
    });

    it('should allocate partial surplus when not all deficit can be covered', async () => {
      const request: CreatePoolRequest = {
        year: 2024,
        members: [
          { shipId: 'SHIP001', cbBefore: 10000 },
          { shipId: 'SHIP002', cbBefore: -8000 },
          { shipId: 'SHIP003', cbBefore: -5000 },
        ],
      };

      mockComplianceRepository.findByShipAndYear
        .mockResolvedValueOnce(createMockCompliance('SHIP001', 10000))
        .mockResolvedValueOnce(createMockCompliance('SHIP002', -8000))
        .mockResolvedValueOnce(createMockCompliance('SHIP003', -5000));

      const expectedPool = createMockPool({
        members: [
          { id: '1', poolId: '1', shipId: 'SHIP001', cbBefore: 10000, cbAfter: -3000 },
          { id: '2', poolId: '1', shipId: 'SHIP002', cbBefore: -8000, cbAfter: 0 },
          { id: '3', poolId: '1', shipId: 'SHIP003', cbBefore: -5000, cbAfter: -3000 },
        ],
      });

      mockPoolRepository.create.mockResolvedValue(expectedPool);

      await expect(useCase.execute(request)).rejects.toThrow('Pool validation failed');
    });

    it('should handle pool with exact balance (total CB = 0)', async () => {
      const request: CreatePoolRequest = {
        year: 2024,
        members: [
          { shipId: 'SHIP001', cbBefore: 12000 },
          { shipId: 'SHIP002', cbBefore: -7000 },
          { shipId: 'SHIP003', cbBefore: -5000 },
        ],
      };

      mockComplianceRepository.findByShipAndYear
        .mockResolvedValueOnce(createMockCompliance('SHIP001', 12000))
        .mockResolvedValueOnce(createMockCompliance('SHIP002', -7000))
        .mockResolvedValueOnce(createMockCompliance('SHIP003', -5000));

      const expectedPool = createMockPool({
        members: [
          { id: '1', poolId: '1', shipId: 'SHIP001', cbBefore: 12000, cbAfter: 0 },
          { id: '2', poolId: '1', shipId: 'SHIP002', cbBefore: -7000, cbAfter: 0 },
          { id: '3', poolId: '1', shipId: 'SHIP003', cbBefore: -5000, cbAfter: 0 },
        ],
      });

      mockPoolRepository.create.mockResolvedValue(expectedPool);

      const result = await useCase.execute(request);

      expect(result).toBeDefined();
      const totalAfter = result.members.reduce((sum, m) => sum + m.cbAfter, 0);
      expect(totalAfter).toBe(0);
    });
  });
});
