import Decimal from "decimal.js";
import type { WeightMode } from "./types";
export function normalizeWeights(values: string[], mode: WeightMode): string[] {
  if (!["INDIVIDUAL", "CUMULATIVE"].includes(mode))
    throw new Error("Selecione o modo de pesagem.");
  let previous = new Decimal(0);
  return values.map((value) => {
    const current = new Decimal(value);
    if (!current.isFinite() || current.lte(0) || current.decimalPlaces() > 4)
      throw new Error("Peso deve ser positivo, com até quatro casas decimais.");
    const increment = mode === "CUMULATIVE" ? current.minus(previous) : current;
    if (increment.lte(0))
      throw new Error("Pesos acumulados devem ser crescentes.");
    previous = current;
    return increment.toFixed(4);
  });
}
export function sumMass(initialMassG: string, additions: string[]): string {
  return additions
    .reduce((mass, value) => mass.plus(value), new Decimal(initialMassG))
    .toFixed(4);
}
