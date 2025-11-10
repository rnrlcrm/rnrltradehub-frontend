import { CciTerm, MoistureSample } from '../types';

/**
 * Calculate average moisture percentage from samples
 */
export function calculateAverageMoisture(samples: MoistureSample[]): number {
  if (!samples || samples.length === 0) {
    return 0;
  }
  const sum = samples.reduce((acc, sample) => acc + sample.moisturePercent, 0);
  return sum / samples.length;
}

/**
 * Calculate moisture adjustment amount based on CCI Setting Master parameters
 * @param averageMoisturePercent - The calculated average moisture percentage
 * @param netDeliveryWeight - Net delivery weight in quintals
 * @param saleRatePerQuintal - Sale rate per quintal
 * @param cciTerm - CCI term containing moisture limits
 * @returns Object containing adjustment amount and type
 */
export function calculateMoistureAdjustment(
  averageMoisturePercent: number,
  netDeliveryWeight: number,
  saleRatePerQuintal: number,
  cciTerm: CciTerm
): {
  adjustmentAmount: number;
  adjustmentType: 'discount' | 'premium' | 'none';
} {
  const { moisture_lower_limit, moisture_upper_limit } = cciTerm;

  // Apply discount if moisture exceeds upper limit
  if (averageMoisturePercent > moisture_upper_limit) {
    const moistureDiscount =
      (averageMoisturePercent - moisture_upper_limit) *
      netDeliveryWeight *
      saleRatePerQuintal;
    return {
      adjustmentAmount: moistureDiscount,
      adjustmentType: 'discount',
    };
  }

  // Apply premium if moisture is below lower limit
  if (averageMoisturePercent < moisture_lower_limit) {
    const moisturePremium =
      (moisture_lower_limit - averageMoisturePercent) *
      netDeliveryWeight *
      saleRatePerQuintal;
    return {
      adjustmentAmount: moisturePremium,
      adjustmentType: 'premium',
    };
  }

  // No adjustment needed if within limits
  return {
    adjustmentAmount: 0,
    adjustmentType: 'none',
  };
}

/**
 * Calculate net invoice amount excluding GST after moisture adjustment
 * @param baseAmount - Base invoice amount
 * @param adjustmentAmount - Moisture adjustment amount
 * @param adjustmentType - Type of adjustment (discount/premium/none)
 * @returns Net invoice amount excluding GST
 */
export function calculateNetInvoiceExclGst(
  baseAmount: number,
  adjustmentAmount: number,
  adjustmentType: 'discount' | 'premium' | 'none'
): number {
  if (adjustmentType === 'discount') {
    return baseAmount - adjustmentAmount;
  } else if (adjustmentType === 'premium') {
    return baseAmount + adjustmentAmount;
  }
  return baseAmount;
}

/**
 * Validate moisture samples meet minimum count requirement
 */
export function validateMoistureSamples(
  samples: MoistureSample[],
  minimumCount: number
): { isValid: boolean; message?: string } {
  if (!samples || samples.length === 0) {
    return {
      isValid: false,
      message: 'No moisture samples provided',
    };
  }

  if (samples.length < minimumCount) {
    return {
      isValid: false,
      message: `Minimum ${minimumCount} samples required, but only ${samples.length} provided`,
    };
  }

  return { isValid: true };
}
