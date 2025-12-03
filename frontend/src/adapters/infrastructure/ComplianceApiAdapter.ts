import apiClient from './apiClient';
import type { ComplianceBalance, AdjustedComplianceBalance } from '../../core/domain/models/ComplianceBalance';

export class ComplianceApiAdapter {
  async getComplianceBalance(
    shipId: string,
    year: number,
    actualIntensity?: number,
    fuelConsumption?: number
  ): Promise<ComplianceBalance> {
    const params = new URLSearchParams({
      shipId,
      year: year.toString(),
    });

    if (actualIntensity) params.append('actualIntensity', actualIntensity.toString());
    if (fuelConsumption) params.append('fuelConsumption', fuelConsumption.toString());

    const response = await apiClient.get(`/compliance/cb?${params.toString()}`);
    return response.data;
  }

  async getAdjustedComplianceBalance(shipId: string, year: number): Promise<AdjustedComplianceBalance> {
    const response = await apiClient.get(`/compliance/adjusted-cb?shipId=${shipId}&year=${year}`);
    return response.data;
  }
}
