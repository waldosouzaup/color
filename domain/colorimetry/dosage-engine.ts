import Decimal from "decimal.js";
import type { CalibrationCoefficient } from "./types";
export function calculateCorrectionDose({
  currentBatchMassG,
  coefficient,
}: {
  currentBatchMassG: string;
  coefficient: CalibrationCoefficient | null;
}) {
  if (
    !coefficient ||
    !coefficient.active ||
    coefficient.status !== "VERIFIED" ||
    coefficient.isDemo ||
    !coefficient.approvedBy ||
    !coefficient.approvedAt ||
    coefficient.sampleSize < 1
  )
    return null;
  const mass = new Decimal(currentBatchMassG);
  const rate = new Decimal(coefficient.gramsPer100g);
  if (
    !mass.isFinite() ||
    !rate.isFinite() ||
    mass.lte(0) ||
    rate.lte(0) ||
    !Number.isInteger(coefficient.precision) ||
    coefficient.precision < 0 ||
    coefficient.precision > 4
  )
    throw new Error("Massa ou coeficiente inválido.");
  const raw = mass.times(rate).div(100);
  const rounded = raw.toDecimalPlaces(
    coefficient.precision,
    Decimal.ROUND_HALF_UP,
  );
  // Fora dos limites validados, não extrapolar nem truncar uma dose técnica.
  if (
    rounded.lte(0) ||
    (coefficient.minimumSuggestedG &&
      rounded.lt(coefficient.minimumSuggestedG)) ||
    (coefficient.maximumSuggestedG && rounded.gt(coefficient.maximumSuggestedG))
  )
    return null;
  return {
    gramsPer100g: rate.toString(),
    suggestedAmountG: rounded.toFixed(coefficient.precision),
    precision: coefficient.precision,
    coefficientId: coefficient.id,
  };
}
