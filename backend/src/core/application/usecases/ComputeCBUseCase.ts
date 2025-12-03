import { ComplianceRepository } from '../ports/ComplianceRepository';
import { ComplianceBalance } from '../domain/models/ComplianceBalance';
import { calculateComplianceBalance, calculateEnergyInScope, getTargetIntensity } from '../domain/services/ComplianceCalculator';

export interface ComputeCBRequest {
  shipId: string;
  year: number;
  actualIntensity: number;
  fuelConsumption: number;
}

export class ComputeCBUseCase {
  constructor(private complianceRepository: ComplianceRepository) {}

  async execute(request: ComputeCBRequest): Promise<ComplianceBalance> {
    const { shipId, year, actualIntensity, fuelConsumption } = request;

    const targetIntensity = getTargetIntensity(year);
    const energyInScope = calculateEnergyInScope(fuelConsumption);
    const cbGco2eq = calculateComplianceBalance(targetIntensity, actualIntensity, energyInScope);

    const complianceBalance = await this.complianceRepository.upsert({
      shipId,
      year,
      cbGco2eq,
    });

    return complianceBalance;
  }
}
