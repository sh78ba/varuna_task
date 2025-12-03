export interface Pool {
  id: string;
  year: number;
  createdAt: Date;
  members: PoolMember[];
}

export interface PoolMember {
  id: string;
  poolId: string;
  shipId: string;
  cbBefore: number;
  cbAfter: number;
}

export interface CreatePoolRequest {
  year: number;
  members: {
    shipId: string;
    cbBefore: number;
  }[];
}

export interface PoolValidationResult {
  isValid: boolean;
  errors: string[];
}
