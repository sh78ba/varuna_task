import { calculateComplianceBalance, calculateEnergyInScope, calculatePercentDiff, getTargetIntensity, isCompliant } from '../../../src/core/domain/services/ComplianceCalculator';

describe('ComplianceCalculator', () => {
  describe('getTargetIntensity', () => {
    it('should return correct target intensity for 2025', () => {
      expect(getTargetIntensity(2025)).toBe(89.3368);
    });

    it('should return correct target intensity for 2030', () => {
      expect(getTargetIntensity(2030)).toBe(78.7792);
    });

    it('should return baseline intensity for years before 2025', () => {
      expect(getTargetIntensity(2024)).toBe(91.16);
    });

    it('should return 2050 target for years after 2050', () => {
      expect(getTargetIntensity(2060)).toBe(18.232);
    });
  });

  describe('calculateEnergyInScope', () => {
    it('should calculate energy correctly', () => {
      const fuelConsumption = 5000; // tonnes
      const expected = 5000 * 41000; // 205,000,000 MJ
      expect(calculateEnergyInScope(fuelConsumption)).toBe(expected);
    });

    it('should handle zero fuel consumption', () => {
      expect(calculateEnergyInScope(0)).toBe(0);
    });
  });

  describe('calculateComplianceBalance', () => {
    it('should calculate positive CB for surplus (actual < target)', () => {
      const targetIntensity = 89.3368;
      const actualIntensity = 88.0;
      const energyInScope = 205000000; // MJ
      
      const cb = calculateComplianceBalance(targetIntensity, actualIntensity, energyInScope);
      
      // CB = (89.3368 - 88.0) * 205000000 = 274,044,000
      expect(cb).toBeCloseTo(274044000, -3);
      expect(cb).toBeGreaterThan(0); // Surplus
    });

    it('should calculate negative CB for deficit (actual > target)', () => {
      const targetIntensity = 89.3368;
      const actualIntensity = 93.5;
      const energyInScope = 205000000; // MJ
      
      const cb = calculateComplianceBalance(targetIntensity, actualIntensity, energyInScope);
      
      // CB = (89.3368 - 93.5) * 205000000 = negative
      expect(cb).toBeLessThan(0); // Deficit
    });

    it('should return zero CB when actual equals target', () => {
      const targetIntensity = 89.3368;
      const actualIntensity = 89.3368;
      const energyInScope = 205000000;
      
      const cb = calculateComplianceBalance(targetIntensity, actualIntensity, energyInScope);
      
      expect(cb).toBe(0);
    });
  });

  describe('calculatePercentDiff', () => {
    it('should calculate positive percentage difference', () => {
      const baseline = 91.0;
      const comparison = 93.5;
      
      const diff = calculatePercentDiff(comparison, baseline);
      
      // ((93.5 / 91.0) - 1) * 100 = 2.747%
      expect(diff).toBeCloseTo(2.747, 2);
    });

    it('should calculate negative percentage difference', () => {
      const baseline = 91.0;
      const comparison = 88.0;
      
      const diff = calculatePercentDiff(comparison, baseline);
      
      // ((88.0 / 91.0) - 1) * 100 = -3.297%
      expect(diff).toBeCloseTo(-3.297, 2);
    });

    it('should return zero for equal values', () => {
      const diff = calculatePercentDiff(91.0, 91.0);
      expect(diff).toBe(0);
    });

    it('should handle zero baseline', () => {
      const diff = calculatePercentDiff(10, 0);
      expect(diff).toBe(0);
    });
  });

  describe('isCompliant', () => {
    it('should return true when actual is less than target', () => {
      expect(isCompliant(88.0, 89.3368)).toBe(true);
    });

    it('should return true when actual equals target', () => {
      expect(isCompliant(89.3368, 89.3368)).toBe(true);
    });

    it('should return false when actual exceeds target', () => {
      expect(isCompliant(93.5, 89.3368)).toBe(false);
    });
  });
});
