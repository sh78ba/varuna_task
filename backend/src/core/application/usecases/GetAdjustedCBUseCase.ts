import { ComplianceRepository } from '../../ports/ComplianceRepository';
import { BankRepository } from '../../ports/BankRepository';
import { AdjustedComplianceBalance } from '../../domain/models/ComplianceBalance';

export class GetAdjustedCBUseCase {
  constructor(
    private complianceRepository: ComplianceRepository,
    private bankRepository: BankRepository
  ) {}

  async execute(shipId: string, year: number): Promise<AdjustedComplianceBalance> {
    const compliance = await this.complianceRepository.findByShipAndYear(shipId, year);
    
    if (!compliance) {
      throw new Error(`No compliance record found for ship ${shipId} in year ${year}`);
    }

    const bankEntries = await this.bankRepository.findByShipAndYear(shipId, year);
    const appliedBanked = bankEntries
      .filter(entry => entry.isApplied)
      .reduce((sum, entry) => sum + entry.amountGco2eq, 0);

    const adjustedCb = compliance.cbGco2eq + appliedBanked;

    return {
      shipId,
      year,
      originalCb: compliance.cbGco2eq,
      bankedAmount: appliedBanked,
      adjustedCb,
    };
  }
}
