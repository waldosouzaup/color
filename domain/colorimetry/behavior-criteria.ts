import { z } from "zod";
import {
  hueFamilies,
  hueLabels,
  oppositeQualifier,
  qualifierLabels,
  qualifiers,
} from "./behavior-vocabulary";

/**
 * Critérios estruturados da consulta de comportamento. Cada vista tem os seus;
 * uma condição de frente nunca é conferida no ângulo, e vice-versa.
 *
 * Esta consulta é qualitativa: não resolve regra da bússola nem calcula dose.
 */
export const behaviorViews = ["FRONT", "ANGLE"] as const;
export type BehaviorView = (typeof behaviorViews)[number];

export const viewLabels: Record<BehaviorView, string> = {
  FRONT: "Frente",
  ANGLE: "Ângulo",
};

const unique = <T>(values: T[]) => [...new Set(values)];

export const viewCriteriaSchema = z.object({
  hue: z.enum(hueFamilies).nullable(),
  tendency: z.enum(hueFamilies).nullable(),
  avoidHues: z.array(z.enum(hueFamilies)).max(hueFamilies.length).transform(unique),
  require: z.array(z.enum(qualifiers)).max(qualifiers.length).transform(unique),
  exclude: z.array(z.enum(qualifiers)).max(qualifiers.length).transform(unique),
});
export type ViewCriteria = z.infer<typeof viewCriteriaSchema>;

export const behaviorCriteriaSchema = z.object({
  FRONT: viewCriteriaSchema,
  ANGLE: viewCriteriaSchema,
});
export type BehaviorCriteria = z.infer<typeof behaviorCriteriaSchema>;

export const emptyViewCriteria = (): ViewCriteria => ({
  hue: null,
  tendency: null,
  avoidHues: [],
  require: [],
  exclude: [],
});

export const emptyCriteria = (): BehaviorCriteria => ({
  FRONT: emptyViewCriteria(),
  ANGLE: emptyViewCriteria(),
});

export const isEmptyView = (view: ViewCriteria) =>
  !view.hue &&
  !view.tendency &&
  !view.avoidHues.length &&
  !view.require.length &&
  !view.exclude.length;

export const isEmptyCriteria = (criteria: BehaviorCriteria) =>
  behaviorViews.every((view) => isEmptyView(criteria[view]));

/** Condições que não podem ser atendidas juntas na mesma vista. */
export function criteriaIssues(criteria: BehaviorCriteria): string[] {
  const issues: string[] = [];
  for (const view of behaviorViews) {
    const c = criteria[view];
    const label = viewLabels[view];
    if (c.hue && c.tendency === c.hue)
      issues.push(`${label}: a tendência repete o matiz principal (${hueLabels[c.hue].name}).`);
    for (const hue of [c.hue, c.tendency])
      if (hue && c.avoidHues.includes(hue))
        issues.push(`${label}: ${hueLabels[hue].name} foi pedido e evitado ao mesmo tempo.`);
    for (const qualifier of c.require) {
      if (c.exclude.includes(qualifier))
        issues.push(
          `${label}: "${qualifierLabels[qualifier].require}" foi exigido e excluído ao mesmo tempo.`,
        );
      const opposite = oppositeQualifier[qualifier];
      if (opposite && c.require.includes(opposite) && qualifier < opposite)
        issues.push(
          `${label}: "${qualifierLabels[qualifier].require}" e "${qualifierLabels[opposite].require}" não podem valer juntos.`,
        );
    }
  }
  return issues;
}

export function describeView(view: ViewCriteria): string {
  const parts = [
    view.hue && hueLabels[view.hue].action,
    view.tendency && `tendência ${hueLabels[view.tendency].tendency}`,
    ...view.require.map((q) => qualifierLabels[q].require),
    ...view.exclude.map((q) => qualifierLabels[q].exclude),
    ...view.avoidHues.map((h) => `evitar ${hueLabels[h].name}`),
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : "sem critério";
}

/** "Frente: amarelar · Ângulo: azular"; `onlyConditioned` omite a vista sem critério. */
export const describeCriteria = (criteria: BehaviorCriteria, onlyConditioned = false) =>
  behaviorViews
    .filter((view) => !onlyConditioned || !isEmptyView(criteria[view]))
    .map((view) => `${viewLabels[view]}: ${describeView(criteria[view])}`)
    .join(" · ");

/* Contrato de transporte da consulta: só leitura, sem campo de dose. */
const filterText = z.string().trim().max(160).default("");
export const behaviorQueryRequestSchema = z.object({
  criteria: behaviorCriteriaSchema,
  filters: z
    .object({
      manufacturer: filterText,
      productLine: filterText,
      systemType: filterText,
      includeDemo: z.boolean().default(false),
    })
    .default({ manufacturer: "", productLine: "", systemType: "", includeDemo: false }),
});

export const checkOutcomes = ["MET", "TENDENCY", "UNMET", "UNDOCUMENTED", "DIVERGENT"] as const;
export type CheckOutcome = (typeof checkOutcomes)[number];

const behaviorRecordSchema = z.object({
  id: z.string(),
  view: z.string(),
  hueCharacteristic: z.string(),
  lightnessEffect: z.string(),
  cleanlinessEffect: z.string(),
  particleEffect: z.string(),
  notes: z.string(),
  source: z.string(),
  sourceReference: z.string(),
});

const matchSchema = z.object({
  pigment: z.object({
    id: z.string(),
    code: z.string(),
    name: z.string(),
    manufacturer: z.string(),
    productLine: z.string(),
    systemType: z.string(),
    family: z.string(),
    isDemo: z.boolean(),
    active: z.boolean(),
    behaviors: z.array(behaviorRecordSchema),
  }),
  views: z.array(
    z.object({
      view: z.enum(behaviorViews),
      evidence: z.enum(["VIEW", "GENERAL_ONLY", "MISSING"]),
      checks: z.array(
        z.object({
          aspect: z.enum(["HUE", "TENDENCY", "AVOID_HUE", "REQUIRE", "EXCLUDE"]),
          requested: z.string(),
          outcome: z.enum(checkOutcomes),
          explanation: z.string(),
        }),
      ),
    }),
  ),
  generalHints: z.array(z.string()),
});

export const behaviorQueryResponseSchema = z.object({
  summary: z.string(),
  considered: z.number().int().nonnegative(),
  demoExcluded: z.number().int().nonnegative(),
  complete: z.array(matchSchema),
  partial: z.array(matchSchema),
  generalOnly: z.array(matchSchema),
});
export type BehaviorQueryResponse = z.infer<typeof behaviorQueryResponseSchema>;
export type BehaviorMatchResult = BehaviorQueryResponse["complete"][number];
