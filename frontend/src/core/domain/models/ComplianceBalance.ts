export interface ComplianceBalance {
  id: string;
  shipId: string;
  year: number;
  cbGco2eq: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdjustedComplianceBalance {
  shipId: string;
  year: number;
  originalCb: number;
  bankedAmount: number;
  adjustedCb: number;
}
