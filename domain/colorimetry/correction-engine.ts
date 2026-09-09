import type {
  CorrectionRule,
  CorrectionRuleOutput,
  PrimaryTone,
  ToneDirection,
  PigmentCharacteristic,
} from "./types";
import { diagnosisSchema } from "./validation";
import { toneLabels, directionLabels } from "./tones";
const output = (
  pigmentCharacteristic: PigmentCharacteristic,
  order: number,
  role: CorrectionRuleOutput["role"] = "PRIMARY",
): CorrectionRuleOutput => ({
  pigmentCharacteristic,
  order,
  role,
  required: role === "PRIMARY" || role === "COMBINED",
  notes:
    role === "SUPPORT" ? "Suporte opcional, somente quando necessário." : "",
});
function rule(
  id: string,
  mainTone: PrimaryTone,
  direction: ToneDirection,
  outputs: CorrectionRuleOutput[],
): CorrectionRule {
  return {
    id,
    mainTone,
    direction,
    diagnosisLabel: `${toneLabels[mainTone]} ${directionLabels[direction].toLowerCase()}`,
    active: true,
    version: 1,
    priority: 100,
    source: "Manual do Método do Mestre — documento fornecido",
    notes: `Reduzir a direção ${directionLabels[direction].toLowerCase()} do ${toneLabels[mainTone].toLowerCase()}. Reavaliar frente e ângulo após a aplicação.`,
    outputs,
  };
}
export const initialRules: CorrectionRule[] = [
  rule("rule-1", "YELLOW", "REDISH", [output("BLUE_GREEN", 1)]),
  rule("rule-2", "YELLOW", "GREENISH", [
    output("RED_BLUE", 1, "ALTERNATIVE"),
    output("VIOLET", 2, "ALTERNATIVE"),
  ]),
  rule("rule-3", "BLUE", "REDISH", [output("LEMON_YELLOW", 1)]),
  rule("rule-4", "BLUE", "GREENISH", [
    output("RED_OXIDE", 1, "ALTERNATIVE"),
    output("VIOLET", 2, "ALTERNATIVE"),
  ]),
  rule("rule-5", "GREEN", "YELLOWISH", [
    output("VIOLET", 1),
    output("RED_SUPPORT", 2, "SUPPORT"),
  ]),
  rule("rule-6", "GREEN", "BLUISH", [
    output("VIOLET", 1, "COMBINED"),
    output("RED_OXIDE", 2, "COMBINED"),
  ]),
  rule("rule-7", "RED", "BLUISH", [output("LEMON_YELLOW", 1)]),
  rule("rule-8", "RED", "YELLOWISH", [
    output("RED_BLUE", 1, "ALTERNATIVE"),
    output("VIOLET", 2, "ALTERNATIVE"),
  ]),
];
export function resolveCorrection(
  input: unknown,
  rules: readonly CorrectionRule[] = initialRules,
): CorrectionRule {
  const { mainTone, direction } = diagnosisSchema.parse(input);
  const match = rules
    .filter(
      (r) => r.active && r.mainTone === mainTone && r.direction === direction,
    )
    .sort((a, b) => b.priority - a.priority || b.version - a.version)[0];
  if (!match)
    throw new Error(
      "Nenhuma regra ativa para esta combinação. Consulte o administrador.",
    );
  return structuredClone(match);
}
