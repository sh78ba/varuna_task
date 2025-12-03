import { PoolValidator } from '../PoolValidator';
import { CreatePoolRequest } from '../../models/Pool';

describe('PoolValidator', () => {
  let validator: PoolValidator;

  beforeEach(() => {
    validator = new PoolValidator();
  });

  describe('validate', () => {
    it('should accept valid pool with 2 ships and positive total CB', () => {
      const request: CreatePoolRequest = {
        year: 2024,
        members: [
          { shipId: 'SHIP001', cbBefore: 15000 },
          { shipId: 'SHIP002', cbBefore: -8000 },
        ],
      };

      const result = validator.validate(request);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject pool with less than 2 members', () => {
      const request: CreatePoolRequest = {
        year: 2024,
        members: [{ shipId: 'SHIP001', cbBefore: 15000 }],
      };

      const result = validator.validate(request);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Pool must have at least 2 members');
    });

    it('should reject pool with negative total CB', () => {
      const request: CreatePoolRequest = {
        year: 2024,
        members: [
          { shipId: 'SHIP001', cbBefore: -15000 },
          { shipId: 'SHIP002', cbBefore: -8000 },
        ],
      };

      const result = validator.validate(request);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Total CB');
    });

    it('should accept pool with total CB equal to zero', () => {
      const request: CreatePoolRequest = {
        year: 2024,
        members: [
          { shipId: 'SHIP001', cbBefore: 8000 },
          { shipId: 'SHIP002', cbBefore: -8000 },
        ],
      };

      const result = validator.validate(request);

      expect(result.isValid).toBe(true);
    });
  });

  describe('allocatePoolBalances', () => {
    it('should allocate surplus to deficit ships', () => {
      const members = [
        { shipId: 'SHIP001', cbBefore: 15000 },
        { shipId: 'SHIP002', cbBefore: -8000 },
      ];

      const result = validator.allocatePoolBalances(members);

      // SHIP001 should transfer to SHIP002
      const ship1 = result.find((r: any) => r.shipId === 'SHIP001');
      const ship2 = result.find((r: any) => r.shipId === 'SHIP002');

      expect(ship1?.cbAfter).toBe(7000); // 15000 - 8000
      expect(ship2?.cbAfter).toBe(0); // -8000 + 8000
    });

    it('should handle multiple deficit ships', () => {
      const members = [
        { shipId: 'SHIP001', cbBefore: 20000 },
        { shipId: 'SHIP002', cbBefore: -5000 },
        { shipId: 'SHIP003', cbBefore: -3000 },
      ];

      const result = validator.allocatePoolBalances(members);

      const ship1 = result.find((r: any) => r.shipId === 'SHIP001');
      const ship2 = result.find((r: any) => r.shipId === 'SHIP002');
      const ship3 = result.find((r: any) => r.shipId === 'SHIP003');

      expect(ship1?.cbAfter).toBe(12000); // 20000 - 8000
      expect(ship2?.cbAfter).toBe(0);
      expect(ship3?.cbAfter).toBe(0);
    });

    it('should not modify balances if all are surplus', () => {
      const members = [
        { shipId: 'SHIP001', cbBefore: 15000 },
        { shipId: 'SHIP002', cbBefore: 8000 },
      ];

      const result = validator.allocatePoolBalances(members);

      expect(result[0].cbAfter).toBe(result[0].cbBefore);
      expect(result[1].cbAfter).toBe(result[1].cbBefore);
    });
  });

  describe('validateAllocations', () => {
    it('should accept valid allocations', () => {
      const allocations = [
        { shipId: 'SHIP001', cbBefore: 15000, cbAfter: 7000 },
        { shipId: 'SHIP002', cbBefore: -8000, cbAfter: 0 },
      ];

      const result = validator.validateAllocations(allocations);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject if deficit ship exits worse', () => {
      const allocations = [
        { shipId: 'SHIP001', cbBefore: 5000, cbAfter: 2000 },
        { shipId: 'SHIP002', cbBefore: -8000, cbAfter: -10000 },
      ];

      const result = validator.validateAllocations(allocations);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('cannot exit worse');
    });

    it('should reject if surplus ship exits negative', () => {
      const allocations = [
        { shipId: 'SHIP001', cbBefore: 5000, cbAfter: -1000 },
        { shipId: 'SHIP002', cbBefore: -8000, cbAfter: 0 },
      ];

      const result = validator.validateAllocations(allocations);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('cannot exit negative');
    });
  });
});
