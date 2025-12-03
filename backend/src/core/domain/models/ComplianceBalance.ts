export interface ComplianceBalance {
  id: string;
  shipId: string;
  year: number;
  cbGco2eq: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdjustedComplianceBalance {
  shipId: string;
  year: number;
  originalCb: number;
  bankedAmount: number;
  adjustedCb: number;
}

export interface ComplianceBalanceCalculation {
  shipId: string;
  year: number;
  targetIntensity: number;
  actualIntensity: number;
  energyInScope: number;
  complianceBalance: number;
}
