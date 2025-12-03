import { PoolRepository } from '../ports/PoolRepository';
import { ComplianceRepository } from '../ports/ComplianceRepository';
import { CreatePoolRequest, Pool } from '../domain/models/Pool';
import { PoolValidator } from '../domain/services/PoolValidator';

export class CreatePoolUseCase {
  private poolValidator: PoolValidator;

  constructor(
    private poolRepository: PoolRepository,
    private complianceRepository: ComplianceRepository
  ) {
    this.poolValidator = new PoolValidator();
  }

  async execute(request: CreatePoolRequest): Promise<Pool> {
    // Validate pool request
    const validation = this.poolValidator.validate(request);
    
    if (!validation.isValid) {
      throw new Error(`Pool validation failed: ${validation.errors.join(', ')}`);
    }

    // Verify all ships have compliance records
    for (const member of request.members) {
      const compliance = await this.complianceRepository.findByShipAndYear(
        member.shipId,
        request.year
      );
      
      if (!compliance) {
        throw new Error(
          `No compliance record found for ship ${member.shipId} in year ${request.year}`
        );
      }
    }

    // Allocate balances using greedy algorithm
    const allocations = this.poolValidator.allocatePoolBalances(request.members);

    // Validate allocations meet pooling rules
    const allocationValidation = this.poolValidator.validateAllocations(allocations);
    
    if (!allocationValidation.isValid) {
      throw new Error(
        `Pool allocation validation failed: ${allocationValidation.errors.join(', ')}`
      );
    }

    // Create pool with allocated members
    const poolRequest: CreatePoolRequest = {
      year: request.year,
      members: allocations,
    };

    const pool = await this.poolRepository.create(poolRequest);

    return pool;
  }
}
