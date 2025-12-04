import { ApplyBankedUseCase, ApplyBankedRequest } from '../core/application/usecases/ApplyBankedUseCase';
import type { BankRepository } from '../core/ports/BankRepository';
import type { ComplianceRepository } from '../core/ports/ComplianceRepository';
import type { BankEntry, BankingSummary } from '../core/domain/models/BankEntry';
import type { ComplianceBalance } from '../core/domain/models/ComplianceBalance';

describe('ApplyBankedUseCase', () => {
  let useCase: ApplyBankedUseCase;
  let mockBankRepository: jest.Mocked<BankRepository>;
  let mockComplianceRepository: jest.Mocked<ComplianceRepository>;

  beforeEach(() => {
    mockBankRepository = {
      create: jest.fn(),
      findAvailableBalance: jest.fn(),
      findByShipAndYear: jest.fn(),
      findByShip: jest.fn(),
      markAsApplied: jest.fn(),
    } as jest.Mocked<BankRepository>;

    mockComplianceRepository = {
      findByShipAndYear: jest.fn(),
      upsert: jest.fn(),
      findAll: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as jest.Mocked<ComplianceRepository>;

    useCase = new ApplyBankedUseCase(mockBankRepository, mockComplianceRepository);
  });

  const createMockBankEntry = (overrides: Partial<BankEntry> = {}): BankEntry => ({
    id: '1',
    shipId: 'SHIP001',
    year: 2024,
    amountGco2eq: 5000,
    isApplied: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockCompliance = (cbGco2eq: number): ComplianceBalance => ({
    id: '1',
    shipId: 'SHIP001',
    year: 2024,
    cbGco2eq,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  describe('execute', () => {
    it('should apply banked surplus successfully when available', async () => {
      const request: ApplyBankedRequest = {
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: 5000,
      };

      const compliance = createMockCompliance(-8000);
      mockComplianceRepository.findByShipAndYear.mockResolvedValue(compliance);
      mockBankRepository.findAvailableBalance.mockResolvedValue(10000);
      mockBankRepository.create.mockResolvedValue(createMockBankEntry());

      const result: BankingSummary = await useCase.execute(request);

      expect(result.shipId).toBe('SHIP001');
      expect(result.year).toBe(2024);
      expect(result.cbBefore).toBe(-8000);
      expect(result.applied).toBe(5000);
      expect(result.cbAfter).toBe(-3000);
    });

    it('should throw error when amount is zero or negative', async () => {
      const requestZero: ApplyBankedRequest = {
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: 0,
      };

      await expect(useCase.execute(requestZero)).rejects.toThrow('Cannot apply non-positive amount');

      const requestNegative: ApplyBankedRequest = {
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: -1000,
      };

      await expect(useCase.execute(requestNegative)).rejects.toThrow('Cannot apply non-positive amount');
    });

    it('should throw error when no compliance record exists', async () => {
      const request: ApplyBankedRequest = {
        shipId: 'SHIP999',
        year: 2024,
        amountGco2eq: 5000,
      };

      mockComplianceRepository.findByShipAndYear.mockResolvedValue(null);

      await expect(useCase.execute(request)).rejects.toThrow(
        'No compliance record found for ship SHIP999 in year 2024'
      );
    });

    it('should throw error when no banked surplus available', async () => {
      const request: ApplyBankedRequest = {
        shipId: 'SHIP002',
        year: 2024,
        amountGco2eq: 5000,
      };

      const compliance = createMockCompliance(-8000);
      mockComplianceRepository.findByShipAndYear.mockResolvedValue(compliance);
      mockBankRepository.findAvailableBalance.mockResolvedValue(0);

      await expect(useCase.execute(request)).rejects.toThrow(
        'Ship SHIP002 has no banked surplus to apply'
      );
    });

    it('should throw error when amount exceeds available balance', async () => {
      const request: ApplyBankedRequest = {
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: 15000,
      };

      const compliance = createMockCompliance(-8000);
      mockComplianceRepository.findByShipAndYear.mockResolvedValue(compliance);
      mockBankRepository.findAvailableBalance.mockResolvedValue(10000);

      await expect(useCase.execute(request)).rejects.toThrow(
        'Amount 15000 exceeds available banked balance 10000'
      );
    });

    it('should allow applying entire available balance', async () => {
      const request: ApplyBankedRequest = {
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: 10000,
      };

      const compliance = createMockCompliance(-15000);
      mockComplianceRepository.findByShipAndYear.mockResolvedValue(compliance);
      mockBankRepository.findAvailableBalance.mockResolvedValue(10000);
      mockBankRepository.create.mockResolvedValue(createMockBankEntry());

      const result = await useCase.execute(request);

      expect(result.applied).toBe(10000);
      expect(result.cbAfter).toBe(-5000);
    });

    it('should create bank entry with isApplied set to true', async () => {
      const request: ApplyBankedRequest = {
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: 5000,
      };

      const compliance = createMockCompliance(-8000);
      mockComplianceRepository.findByShipAndYear.mockResolvedValue(compliance);
      mockBankRepository.findAvailableBalance.mockResolvedValue(10000);
      mockBankRepository.create.mockResolvedValue(createMockBankEntry());

      await useCase.execute(request);

      expect(mockBankRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isApplied: true,
        })
      );
    });

    it('should improve deficit ship towards compliance', async () => {
      const request: ApplyBankedRequest = {
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: 6000,
      };

      const compliance = createMockCompliance(-10000);
      mockComplianceRepository.findByShipAndYear.mockResolvedValue(compliance);
      mockBankRepository.findAvailableBalance.mockResolvedValue(8000);
      mockBankRepository.create.mockResolvedValue(createMockBankEntry());

      const result = await useCase.execute(request);

      expect(result.cbBefore).toBe(-10000);
      expect(result.cbAfter).toBe(-4000);
      expect(result.cbAfter).toBeGreaterThan(result.cbBefore);
    });

    it('should allow applying banked surplus to ship with positive CB', async () => {
      const request: ApplyBankedRequest = {
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: 3000,
      };

      const compliance = createMockCompliance(5000);
      mockComplianceRepository.findByShipAndYear.mockResolvedValue(compliance);
      mockBankRepository.findAvailableBalance.mockResolvedValue(10000);
      mockBankRepository.create.mockResolvedValue(createMockBankEntry());

      const result = await useCase.execute(request);

      expect(result.cbBefore).toBe(5000);
      expect(result.cbAfter).toBe(8000);
    });

    it('should calculate correct CB after for various scenarios', async () => {
      const scenarios = [
        { cbBefore: -20000, applied: 8000, expected: -12000 },
        { cbBefore: -5000, applied: 5000, expected: 0 },
        { cbBefore: 0, applied: 3000, expected: 3000 },
        { cbBefore: 10000, applied: 5000, expected: 15000 },
      ];

      for (const scenario of scenarios) {
        const request: ApplyBankedRequest = {
          shipId: 'SHIP001',
          year: 2024,
          amountGco2eq: scenario.applied,
        };

        const compliance = createMockCompliance(scenario.cbBefore);
        mockComplianceRepository.findByShipAndYear.mockResolvedValue(compliance);
        mockBankRepository.findAvailableBalance.mockResolvedValue(scenario.applied);
        mockBankRepository.create.mockResolvedValue(createMockBankEntry());

        const result = await useCase.execute(request);

        expect(result.cbAfter).toBe(scenario.expected);
      }
    });

    it('should return correct banking summary structure', async () => {
      const request: ApplyBankedRequest = {
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: 5000,
      };

      const compliance = createMockCompliance(-8000);
      mockComplianceRepository.findByShipAndYear.mockResolvedValue(compliance);
      mockBankRepository.findAvailableBalance.mockResolvedValue(10000);
      mockBankRepository.create.mockResolvedValue(createMockBankEntry());

      const result = await useCase.execute(request);

      expect(result).toHaveProperty('shipId');
      expect(result).toHaveProperty('year');
      expect(result).toHaveProperty('cbBefore');
      expect(result).toHaveProperty('applied');
      expect(result).toHaveProperty('cbAfter');
    });

    it('should check available balance before applying', async () => {
      const request: ApplyBankedRequest = {
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: 5000,
      };

      const compliance = createMockCompliance(-8000);
      mockComplianceRepository.findByShipAndYear.mockResolvedValue(compliance);
      mockBankRepository.findAvailableBalance.mockResolvedValue(10000);
      mockBankRepository.create.mockResolvedValue(createMockBankEntry());

      await useCase.execute(request);

      expect(mockBankRepository.findAvailableBalance).toHaveBeenCalledWith('SHIP001');
    });

    it('should handle negative balance becoming positive', async () => {
      const request: ApplyBankedRequest = {
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: 10000,
      };

      const compliance = createMockCompliance(-3000);
      mockComplianceRepository.findByShipAndYear.mockResolvedValue(compliance);
      mockBankRepository.findAvailableBalance.mockResolvedValue(15000);
      mockBankRepository.create.mockResolvedValue(createMockBankEntry());

      const result = await useCase.execute(request);

      expect(result.cbBefore).toBeLessThan(0);
      expect(result.cbAfter).toBeGreaterThan(0);
      expect(result.cbAfter).toBe(7000);
    });
  });
});
