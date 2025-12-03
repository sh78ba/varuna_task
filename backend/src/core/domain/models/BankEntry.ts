export interface BankEntry {
  id: string;
  shipId: string;
  year: number;
  amountGco2eq: number;
  isApplied: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankRequest {
  shipId: string;
  year: number;
  amountGco2eq: number;
}

export interface ApplyBankRequest {
  shipId: string;
  year: number;
  amountGco2eq: number;
}

export interface BankingSummary {
  shipId: string;
  year: number;
  cbBefore: number;
  applied: number;
  cbAfter: number;
}
