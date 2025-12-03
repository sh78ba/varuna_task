import apiClient from './apiClient';
import { BankEntry, BankingSummary } from '../../core/domain/models/BankEntry';

export class BankingApiAdapter {
  async getBankRecords(shipId: string, year?: number): Promise<BankEntry[]> {
    const params = new URLSearchParams({ shipId });
    if (year) params.append('year', year.toString());

    const response = await apiClient.get(`/banking/records?${params.toString()}`);
    return response.data;
  }

  async bankSurplus(shipId: string, year: number, amountGco2eq: number): Promise<BankEntry> {
    const response = await apiClient.post('/banking/bank', {
      shipId,
      year,
      amountGco2eq,
    });
    return response.data;
  }

  async applyBanked(shipId: string, year: number, amountGco2eq: number): Promise<BankingSummary> {
    const response = await apiClient.post('/banking/apply', {
      shipId,
      year,
      amountGco2eq,
    });
    return response.data;
  }
}
