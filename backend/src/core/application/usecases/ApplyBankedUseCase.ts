import { BankRepository } from '../ports/BankRepository';
import { ComplianceRepository } from '../ports/ComplianceRepository';
import { BankingSummary } from '../domain/models/BankEntry';

export interface ApplyBankedRequest {
  shipId: string;
  year: number;
  amountGco2eq: number;
}

export class ApplyBankedUseCase {
  constructor(
    private bankRepository: BankRepository,
    private complianceRepository: ComplianceRepository
  ) {}

  async execute(request: ApplyBankedRequest): Promise<BankingSummary> {
    const { shipId, year, amountGco2eq } = request;

    // Validate amount is positive
    if (amountGco2eq <= 0) {
      throw new Error('Cannot apply non-positive amount');
    }

    // Get current compliance balance
    const compliance = await this.complianceRepository.findByShipAndYear(shipId, year);
    
    if (!compliance) {
      throw new Error(`No compliance record found for ship ${shipId} in year ${year}`);
    }

    // Get available banked balance
    const availableBalance = await this.bankRepository.findAvailableBalance(shipId);

    if (availableBalance <= 0) {
      throw new Error(`Ship ${shipId} has no banked surplus to apply`);
    }

    if (amountGco2eq > availableBalance) {
      throw new Error(
        `Amount ${amountGco2eq} exceeds available banked balance ${availableBalance}`
      );
    }

    // Create new bank entry (negative for application)
    await this.bankRepository.create({
      shipId,
      year,
      amountGco2eq,
      isApplied: true,
    });

    const cbBefore = compliance.cbGco2eq;
    const cbAfter = cbBefore + amountGco2eq;

    return {
      shipId,
      year,
      cbBefore,
      applied: amountGco2eq,
      cbAfter,
    };
  }
}
