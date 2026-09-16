/**
 * Seleção da bússola e apresentação das saídas de uma regra.
 *
 * Puro e sem React: a mesma resolução vale para a página, o modal, a miniatura
 * e o diagnóstico da sessão. A regra vem sempre de `workspace.rules` (já
 * resolvidas para a oficina); aqui não existe fallback silencioso para a
 * primeira regra da lista nem correção inventada para um tom fundamental.
 */
import type {
  CorrectionRule,
  CorrectionRuleOutput,
  PrimaryTone,
  ToneDirection,
} from "../colorimetry/types";
import { validDirections, pigmentLabels } from "../colorimetry/tones";
import { initialRules } from "../colorimetry/correction-engine";

export interface CompassSelection {
  mainTone: PrimaryTone;
  /** `null` = família selecionada, sem subtom: nenhuma correção é resolvida. */
  direction: ToneDirection | null;
}

export type CompassResolution =
  | {
      status: "FAMILY";
      mainTone: PrimaryTone;
      directions: readonly ToneDirection[];
    }
  | {
      status: "RULE";
      mainTone: PrimaryTone;
      direction: ToneDirection;
      rule: CorrectionRule;
    }
  | { status: "MISSING"; mainTone: PrimaryTone; direction: ToneDirection };

/** Regra vigente do par, preferindo a ativa de maior prioridade e versão. */
export function findRule(
  rules: readonly CorrectionRule[],
  mainTone: PrimaryTone,
  direction: ToneDirection,
): CorrectionRule | undefined {
  return [...rules]
    .filter((r) => r.mainTone === mainTone && r.direction === direction)
    .sort(
      (a, b) =>
        Number(b.active) - Number(a.active) ||
        b.priority - a.priority ||
        b.version - a.version,
    )[0];
}

export function resolveSelection(
  rules: readonly CorrectionRule[],
  selection: CompassSelection,
): CompassResolution {
  const { mainTone, direction } = selection;
  if (!direction)
    return {
      status: "FAMILY",
      mainTone,
      directions: validDirections[mainTone],
    };
  const rule = findRule(rules, mainTone, direction);
  return rule
    ? { status: "RULE", mainTone, direction, rule }
    : { status: "MISSING", mainTone, direction };
}

/** Só uma regra ativa e resolvida pode ser encaminhada para um ajuste. */
export function canUseInAdjustment(resolution: CompassResolution): boolean {
  return resolution.status === "RULE" && resolution.rule.active;
}

export type OutputConnector = "ou" | "+" | null;

export interface DescribedOutput {
  output: CorrectionRuleOutput;
  label: string;
  connector: OutputConnector;
  roleLabel: string;
  required: boolean;
}

export type OutputRequirement =
  | "PRIMARY"
  | "ALTERNATIVE"
  | "COMBINED"
  | "EMPTY";

export interface OutputDescription {
  items: DescribedOutput[];
  requirement: OutputRequirement;
  /** Frase operacional inequívoca, idêntica em todos os resumos. */
  summary: string;
  /** Presente apenas quando a regra tem saída de suporte. */
  support?: string;
}

const roleLabels: Record<CorrectionRuleOutput["role"], string> = {
  PRIMARY: "CORTE PRINCIPAL",
  COMBINED: "COMBINAÇÃO OBRIGATÓRIA",
  ALTERNATIVE: "ALTERNATIVA",
  SUPPORT: "SUPORTE OPCIONAL",
};

function byOrder(a: CorrectionRuleOutput, b: CorrectionRuleOutput) {
  return a.order - b.order;
}

/**
 * Descreve todas as saídas na ordem prevista, com conectivos explícitos.
 * Nunca resume a regra à primeira saída.
 */
export function describeOutputs(rule: CorrectionRule): OutputDescription {
  const ordered = [...rule.outputs].sort(byOrder);
  const main = ordered.filter((o) => o.role !== "SUPPORT");
  const support = ordered.filter((o) => o.role === "SUPPORT");

  const items: DescribedOutput[] = ordered.map((output, index) => ({
    output,
    label: pigmentLabels[output.pigmentCharacteristic],
    connector:
      index === 0 ? null : output.role === "ALTERNATIVE" ? "ou" : "+",
    roleLabel: roleLabels[output.role],
    required: output.required,
  }));

  const requirement: OutputRequirement = !main.length
    ? "EMPTY"
    : main.some((o) => o.role === "ALTERNATIVE")
      ? "ALTERNATIVE"
      : main.filter((o) => o.role === "COMBINED").length > 1
        ? "COMBINED"
        : "PRIMARY";

  const names = main.map((o) => pigmentLabels[o.pigmentCharacteristic]);
  const supportNames = support.map(
    (o) => pigmentLabels[o.pigmentCharacteristic],
  );

  let summary: string;
  if (requirement === "EMPTY") summary = "Sem pigmento de corte definido.";
  else if (requirement === "ALTERNATIVE")
    summary = `${names.join(" ou ")} — escolha exatamente uma alternativa`;
  else if (requirement === "COMBINED")
    summary = `${names.join(" + ")} — ${
      names.length === 2 ? "ambos obrigatórios" : "todos obrigatórios"
    }`;
  else summary = `${names.join(" + ")} — corte principal`;

  return {
    items,
    requirement,
    summary: supportNames.length
      ? `${summary} · suporte opcional: ${supportNames.join(", ")}`
      : summary,
    support: supportNames.length
      ? `Suporte opcional: ${supportNames.join(", ")}`
      : undefined,
  };
}

/**
 * Indica se a regra ainda corresponde exatamente à matriz documentada.
 * Explicações fixas do método só podem ser exibidas quando isso é verdade;
 * uma customização da oficina não pode receber um texto que cita pigmento
 * removido.
 */
export function usesDocumentedOutputs(rule: CorrectionRule): boolean {
  const documented = initialRules.find(
    (r) => r.mainTone === rule.mainTone && r.direction === rule.direction,
  );
  if (!documented) return false;
  const signature = (r: CorrectionRule) =>
    [...r.outputs]
      .sort(byOrder)
      .map((o) => `${o.pigmentCharacteristic}:${o.role}:${o.required}`)
      .join("|");
  return signature(documented) === signature(rule);
}

/** Texto curto de estado, usado em rótulos acessíveis e resumos. */
export function selectionSummary(
  resolution: CompassResolution,
  labels: {
    tone: Record<PrimaryTone, string>;
    direction: Record<ToneDirection, string>;
  },
): string {
  if (resolution.status === "FAMILY")
    return `Família ${labels.tone[resolution.mainTone]} selecionada. Escolha o subtom: ${resolution.directions
      .map((d) => labels.direction[d])
      .join(" ou ")}.`;
  const name = `${labels.tone[resolution.mainTone]} ${labels.direction[
    resolution.direction
  ].toLowerCase()}`;
  if (resolution.status === "MISSING")
    return `${name}: nenhuma regra ativa cadastrada nesta oficina.`;
  const description = describeOutputs(resolution.rule);
  return `${name}: ${description.summary}${
    resolution.rule.active ? "" : " (regra desativada pela oficina)"
  }`;
}
