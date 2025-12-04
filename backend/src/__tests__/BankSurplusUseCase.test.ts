import { BankSurplusUseCase, BankSurplusRequest } from '../core/application/usecases/BankSurplusUseCase';
import type { BankRepository } from '../core/ports/BankRepository';
import type { ComplianceRepository } from '../core/ports/ComplianceRepository';
import type { BankEntry } from '../core/domain/models/BankEntry';
import type { ComplianceBalance } from '../core/domain/models/ComplianceBalance';

describe('BankSurplusUseCase', () => {
  let useCase: BankSurplusUseCase;
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

    useCase = new BankSurplusUseCase(mockBankRepository, mockComplianceRepository);
  });

  const createMockBankEntry = (overrides: Partial<BankEntry> = {}): BankEntry => ({
    id: '1',
    shipId: 'SHIP001',
    year: 2024,
    amountGco2eq: 5000,
    isApplied: false,
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
    it('should bank surplus successfully when ship has positive CB', async () => {
      const request: BankSurplusRequest = {
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: 5000,
      };

      const compliance = createMockCompliance(15000);
      const expectedBankEntry = createMockBankEntry({
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: 5000,
        isApplied: false,
      });

      mockComplianceRepository.findByShipAndYear.mockResolvedValue(compliance);
      mockBankRepository.create.mockResolvedValue(expectedBankEntry);

      const result = await useCase.execute(request);

      expect(result).toEqual(expectedBankEntry);
      expect(mockBankRepository.create).toHaveBeenCalledWith({
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: 5000,
        isApplied: false,
      });
    });

    it('should throw error when amount is zero or negative', async () => {
      const requestZero: BankSurplusRequest = {
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: 0,
      };

      await expect(useCase.execute(requestZero)).rejects.toThrow('Cannot bank non-positive amount');

      const requestNegative: BankSurplusRequest = {
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: -1000,
      };

      await expect(useCase.execute(requestNegative)).rejects.toThrow('Cannot bank non-positive amount');
    });

    it('should throw error when no compliance record exists', async () => {
      const request: BankSurplusRequest = {
        shipId: 'SHIP999',
        year: 2024,
        amountGco2eq: 5000,
      };

      mockComplianceRepository.findByShipAndYear.mockResolvedValue(null);

      await expect(useCase.execute(request)).rejects.toThrow(
        'No compliance record found for ship SHIP999 in year 2024'
      );
    });

    it('should throw error when ship has deficit (negative CB)', async () => {
      const request: BankSurplusRequest = {
        shipId: 'SHIP002',
        year: 2024,
        amountGco2eq: 5000,
      };

      const compliance = createMockCompliance(-8000);
      mockComplianceRepository.findByShipAndYear.mockResolvedValue(compliance);

      await expect(useCase.execute(request)).rejects.toThrow(
        'Ship SHIP002 has no surplus to bank (CB: -8000)'
      );
    });

    it('should throw error when ship has zero CB', async () => {
      const request: BankSurplusRequest = {
        shipId: 'SHIP003',
        year: 2024,
        amountGco2eq: 1000,
      };

      const compliance = createMockCompliance(0);
      mockComplianceRepository.findByShipAndYear.mockResolvedValue(compliance);

      await expect(useCase.execute(request)).rejects.toThrow(
        'Ship SHIP003 has no surplus to bank (CB: 0)'
      );
    });

    it('should throw error when amount exceeds available surplus', async () => {
      const request: BankSurplusRequest = {
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: 20000,
      };

      const compliance = createMockCompliance(15000);
      mockComplianceRepository.findByShipAndYear.mockResolvedValue(compliance);

      await expect(useCase.execute(request)).rejects.toThrow(
        'Amount 20000 exceeds available surplus 15000'
      );
    });

    it('should allow banking entire surplus', async () => {
      const request: BankSurplusRequest = {
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: 15000,
      };

      const compliance = createMockCompliance(15000);
      const expectedBankEntry = createMockBankEntry({
        amountGco2eq: 15000,
      });

      mockComplianceRepository.findByShipAndYear.mockResolvedValue(compliance);
      mockBankRepository.create.mockResolvedValue(expectedBankEntry);

      const result = await useCase.execute(request);

      expect(result.amountGco2eq).toBe(15000);
    });

    it('should create bank entry with isApplied set to false', async () => {
      const request: BankSurplusRequest = {
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: 5000,
      };

      const compliance = createMockCompliance(15000);
      mockComplianceRepository.findByShipAndYear.mockResolvedValue(compliance);
      mockBankRepository.create.mockResolvedValue(createMockBankEntry());

      await useCase.execute(request);

      expect(mockBankRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          isApplied: false,
        })
      );
    });

    it('should handle multiple banking operations for same ship', async () => {
      const request1: BankSurplusRequest = {
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: 5000,
      };

      const request2: BankSurplusRequest = {
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: 3000,
      };

      const compliance = createMockCompliance(15000);
      mockComplianceRepository.findByShipAndYear.mockResolvedValue(compliance);
      mockBankRepository.create.mockResolvedValue(createMockBankEntry());

      await useCase.execute(request1);
      await useCase.execute(request2);

      expect(mockBankRepository.create).toHaveBeenCalledTimes(2);
    });

    it('should validate compliance exists before creating bank entry', async () => {
      const request: BankSurplusRequest = {
        shipId: 'SHIP001',
        year: 2024,
        amountGco2eq: 5000,
      };

      const compliance = createMockCompliance(15000);
      mockComplianceRepository.findByShipAndYear.mockResolvedValue(compliance);
      mockBankRepository.create.mockResolvedValue(createMockBankEntry());

      await useCase.execute(request);

      expect(mockComplianceRepository.findByShipAndYear).toHaveBeenCalledWith('SHIP001', 2024);
    });
  });
});
