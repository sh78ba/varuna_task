export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number;
  isApplied: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BankingSummary {
  shipId: string;
  year: number;
  cbBefore: number;
  applied: number;
  cbAfter: number;
}
