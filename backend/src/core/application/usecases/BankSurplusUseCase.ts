import { BankRepository } from '../ports/BankRepository';
import { ComplianceRepository } from '../ports/ComplianceRepository';
import { BankEntry } from '../domain/models/BankEntry';

export interface BankSurplusRequest {
  shipId: string;
  year: number;
  amountGco2eq: number;
}

export class BankSurplusUseCase {
  constructor(
    private bankRepository: BankRepository,
    private complianceRepository: ComplianceRepository
  ) {}

  async execute(request: BankSurplusRequest): Promise<BankEntry> {
    const { shipId, year, amountGco2eq } = request;

    // Validate amount is positive
    if (amountGco2eq <= 0) {
      throw new Error('Cannot bank non-positive amount');
    }

    // Get current compliance balance
    const compliance = await this.complianceRepository.findByShipAndYear(shipId, year);
    
    if (!compliance) {
      throw new Error(`No compliance record found for ship ${shipId} in year ${year}`);
    }

    // Validate ship has surplus
    if (compliance.cbGco2eq <= 0) {
      throw new Error(`Ship ${shipId} has no surplus to bank (CB: ${compliance.cbGco2eq})`);
    }

    // Validate amount doesn't exceed available surplus
    if (amountGco2eq > compliance.cbGco2eq) {
      throw new Error(
        `Amount ${amountGco2eq} exceeds available surplus ${compliance.cbGco2eq}`
      );
    }

    // Create bank entry
    const bankEntry = await this.bankRepository.create({
      shipId,
      year,
      amountGco2eq,
      isApplied: false,
    });

    return bankEntry;
  }
}
