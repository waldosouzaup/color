export const primaryTones = ["YELLOW", "BLUE", "GREEN", "RED"] as const;
export type PrimaryTone = (typeof primaryTones)[number];
export const toneDirections = [
  "REDISH",
  "GREENISH",
  "YELLOWISH",
  "BLUISH",
] as const;
export type ToneDirection = (typeof toneDirections)[number];
export const characteristics = [
  "BLUE_GREEN",
  "RED_BLUE",
  "VIOLET",
  "LEMON_YELLOW",
  "RED_OXIDE",
  "RED_SUPPORT",
] as const;
export type PigmentCharacteristic = (typeof characteristics)[number];
export const paintTypes = ["SOLID", "METALLIC", "PEARL", "OTHER"] as const;
export type PaintType = (typeof paintTypes)[number];
export const severities = ["LIGHT", "MEDIUM", "STRONG"] as const;
export type Severity = (typeof severities)[number];
export type ObservationView = "ANGLE" | "FRONT";
export type WeightMode = "INDIVIDUAL" | "CUMULATIVE";
export type CalibrationStatus = "DRAFT" | "TESTING" | "VERIFIED" | "RETIRED";
export interface CorrectionRuleOutput {
  pigmentCharacteristic: PigmentCharacteristic;
  role: "PRIMARY" | "ALTERNATIVE" | "COMBINED" | "SUPPORT";
  order: number;
  required: boolean;
  notes: string;
}
export interface CorrectionRule {
  id: string;
  mainTone: PrimaryTone;
  direction: ToneDirection;
  diagnosisLabel: string;
  active: boolean;
  version: number;
  notes: string;
  priority: number;
  source: string;
  outputs: CorrectionRuleOutput[];
}
export interface CalibrationCoefficient {
  id: string;
  status: CalibrationStatus;
  active: boolean;
  gramsPer100g: string;
  minimumSuggestedG?: string | null;
  maximumSuggestedG?: string | null;
  precision: number;
  approvedBy?: string | null;
  approvedAt?: string | Date | null;
  sampleSize: number;
  isDemo: boolean;
}
