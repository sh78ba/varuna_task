/**
 * FuelEU Maritime Constants
 * Based on Regulation (EU) 2023/1805, Annex IV
 */

export const FUEL_EU_CONSTANTS = {
  // Target intensities (gCO2e/MJ) for different years
  TARGET_INTENSITIES: {
    2025: 89.3368, // 2% below 91.16
    2026: 87.9832, // 3.5% below 91.16
    2027: 85.7176, // 6% below 91.16
    2030: 78.7792, // 13.5% below 91.16
    2035: 68.37,   // 26% below 91.16
    2040: 58.8176, // 35.5% below 91.16
    2045: 49.6368, // 46% below 91.16
    2050: 18.232,  // 80% below 91.16
  },

  // Energy conversion factor (MJ per tonne of fuel)
  ENERGY_PER_TONNE_FUEL: 41000, // MJ/t

  // Default baseline intensity
  BASELINE_INTENSITY: 91.16, // gCO2e/MJ
} as const;

/**
 * Get target intensity for a specific year
 */
export function getTargetIntensity(year: number): number {
  const targets = FUEL_EU_CONSTANTS.TARGET_INTENSITIES;
  
  if (year >= 2050) return targets[2050];
  if (year >= 2045) return targets[2045];
  if (year >= 2040) return targets[2040];
  if (year >= 2035) return targets[2035];
  if (year >= 2030) return targets[2030];
  if (year >= 2027) return targets[2027];
  if (year >= 2026) return targets[2026];
  if (year >= 2025) return targets[2025];
  
  return FUEL_EU_CONSTANTS.BASELINE_INTENSITY;
}

/**
 * Calculate energy in scope (MJ) from fuel consumption
 */
export function calculateEnergyInScope(fuelConsumptionTonnes: number): number {
  return fuelConsumptionTonnes * FUEL_EU_CONSTANTS.ENERGY_PER_TONNE_FUEL;
}

/**
 * Calculate Compliance Balance (gCO2eq)
 * CB = (Target Intensity - Actual Intensity) × Energy in Scope
 */
export function calculateComplianceBalance(
  targetIntensity: number,
  actualIntensity: number,
  energyInScope: number
): number {
  return (targetIntensity - actualIntensity) * energyInScope;
}

/**
 * Calculate percentage difference between two intensity values
 */
export function calculatePercentDiff(comparison: number, baseline: number): number {
  if (baseline === 0) return 0;
  return ((comparison / baseline) - 1) * 100;
}

/**
 * Check if a route is compliant based on target intensity
 */
export function isCompliant(actualIntensity: number, targetIntensity: number): boolean {
  return actualIntensity <= targetIntensity;
}
