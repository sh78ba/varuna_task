import { PoolValidationResult, CreatePoolRequest } from '../models/Pool';

/**
 * Pool Validation Service
 * Implements FuelEU Maritime Article 21 - Pooling rules
 */
export class PoolValidator {
  /**
   * Validate pool creation request
   * Rules:
   * 1. Sum of adjusted CB must be >= 0
   * 2. Deficit ship cannot exit worse
   * 3. Surplus ship cannot exit negative
   */
  validate(request: CreatePoolRequest): PoolValidationResult {
    const errors: string[] = [];

    // Check minimum members
    if (request.members.length < 2) {
      errors.push('Pool must have at least 2 members');
    }

    // Calculate total CB
    const totalCb = request.members.reduce((sum, member) => sum + member.cbBefore, 0);

    // Rule 1: Sum of CB must be >= 0
    if (totalCb < 0) {
      errors.push(`Total CB (${totalCb.toFixed(2)}) must be >= 0 for pool creation`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Allocate pool surplus/deficit among members using greedy algorithm
   * Sort members by CB descending, transfer surplus to deficits
   */
  allocatePoolBalances(members: { shipId: string; cbBefore: number }[]): {
    shipId: string;
    cbBefore: number;
    cbAfter: number;
  }[] {
    // Sort by CB descending (surplus ships first)
    const sorted = [...members].sort((a, b) => b.cbBefore - a.cbBefore);
    
    const result = sorted.map(m => ({
      shipId: m.shipId,
      cbBefore: m.cbBefore,
      cbAfter: m.cbBefore,
    }));

    // Separate surplus and deficit ships
    const surplusShips = result.filter(m => m.cbBefore > 0);
    const deficitShips = result.filter(m => m.cbBefore < 0);

    // Transfer surplus to deficits
    for (const deficit of deficitShips) {
      let remainingDeficit = Math.abs(deficit.cbAfter);

      for (const surplus of surplusShips) {
        if (remainingDeficit <= 0) break;
        if (surplus.cbAfter <= 0) continue;

        const transferAmount = Math.min(surplus.cbAfter, remainingDeficit);
        
        surplus.cbAfter -= transferAmount;
        deficit.cbAfter += transferAmount;
        remainingDeficit -= transferAmount;
      }
    }

    return result;
  }

  /**
   * Validate allocated balances meet pooling rules
   */
  validateAllocations(
    allocations: { shipId: string; cbBefore: number; cbAfter: number }[]
  ): PoolValidationResult {
    const errors: string[] = [];

    for (const allocation of allocations) {
      // Rule 2: Deficit ship cannot exit worse
      if (allocation.cbBefore < 0 && allocation.cbAfter < allocation.cbBefore) {
        errors.push(
          `Ship ${allocation.shipId} with deficit cannot exit worse (before: ${allocation.cbBefore}, after: ${allocation.cbAfter})`
        );
      }

      // Rule 3: Surplus ship cannot exit negative
      if (allocation.cbBefore > 0 && allocation.cbAfter < 0) {
        errors.push(
          `Ship ${allocation.shipId} with surplus cannot exit negative (before: ${allocation.cbBefore}, after: ${allocation.cbAfter})`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
