import {
  behaviorViews,
  viewLabels,
  isEmptyView,
  type BehaviorCriteria,
  type BehaviorView,
  type CheckOutcome,
  type ViewCriteria,
} from "./behavior-criteria";
import {
  analyzeDescriptor,
  hueLabels,
  oppositeQualifier,
  qualifierLabels,
  type DescriptorAnalysis,
  type HueFamily,
  type Qualifier,
} from "./behavior-vocabulary";

/**
 * Cruza critérios por vista com os comportamentos cadastrados de cada base.
 *
 * - Todas as condições valem para a MESMA base.
 * - Condição de frente só é conferida em registros FRONT; de ângulo, em ANGLE.
 * - GENERAL não comprova vista: aparece como indício, nunca como correspondência.
 * - Nada é inventado: sem descrição, o resultado é "sem informação".
 */
export interface MatchableBehavior {
  id: string;
  view: string;
  hueCharacteristic: string;
  lightnessEffect: string;
  cleanlinessEffect: string;
  particleEffect: string;
  source: string;
  sourceReference: string;
}

export interface MatchablePigment {
  id: string;
  code: string;
  manufacturer: string;
  productLine: string;
  isDemo?: boolean;
  behaviors: MatchableBehavior[];
}

export type CheckAspect = "HUE" | "TENDENCY" | "AVOID_HUE" | "REQUIRE" | "EXCLUDE";

export interface BehaviorCheck {
  aspect: CheckAspect;
  requested: string;
  outcome: CheckOutcome;
  explanation: string;
}

export interface ViewEvaluation {
  view: BehaviorView;
  evidence: "VIEW" | "GENERAL_ONLY" | "MISSING";
  checks: BehaviorCheck[];
}

export interface PigmentMatch<P extends MatchablePigment> {
  pigment: P;
  views: ViewEvaluation[];
  generalHints: string[];
}

export interface MatchResult<P extends MatchablePigment> {
  complete: PigmentMatch<P>[];
  partial: PigmentMatch<P>[];
  generalOnly: PigmentMatch<P>[];
}

/** Texto integral do registro: matiz, luminosidade, limpeza e partículas. */
export const behaviorDescriptor = (b: MatchableBehavior) =>
  [b.hueCharacteristic, b.lightnessEffect, b.cleanlinessEffect, b.particleEffect]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(" · ");

type Requirement =
  | { aspect: "HUE" | "TENDENCY" | "AVOID_HUE"; hue: HueFamily }
  | { aspect: "REQUIRE" | "EXCLUDE"; qualifier: Qualifier };

function requirements(view: ViewCriteria): Requirement[] {
  return [
    ...(view.hue ? [{ aspect: "HUE" as const, hue: view.hue }] : []),
    ...(view.tendency ? [{ aspect: "TENDENCY" as const, hue: view.tendency }] : []),
    ...view.avoidHues.map((hue) => ({ aspect: "AVOID_HUE" as const, hue })),
    ...view.require.map((qualifier) => ({ aspect: "REQUIRE" as const, qualifier })),
    ...view.exclude.map((qualifier) => ({ aspect: "EXCLUDE" as const, qualifier })),
  ];
}

function requestedLabel(r: Requirement) {
  if ("qualifier" in r)
    return qualifierLabels[r.qualifier][r.aspect === "REQUIRE" ? "require" : "exclude"];
  if (r.aspect === "HUE") return hueLabels[r.hue].action;
  if (r.aspect === "TENDENCY") return `tendência ${hueLabels[r.hue].tendency}`;
  return `evitar ${hueLabels[r.hue].name}`;
}

type RecordOutcome = { outcome: CheckOutcome; explanation: string };

function evaluateRecord(r: Requirement, a: DescriptorAnalysis): RecordOutcome {
  const quoted = `"${a.text}"`;
  if (a.empty) return { outcome: "UNDOCUMENTED", explanation: "registro sem descrição" };
  const hasHue = Boolean(a.principalHue);
  if ("hue" in r) {
    const hue = r.hue;
    const name = hueLabels[hue].name;
    const principal = a.principalHue ? hueLabels[a.principalHue].name : "";
    if (r.aspect === "HUE") {
      if (a.principalHue === hue)
        return { outcome: "MET", explanation: `${quoted} tem matiz principal ${name}` };
      if (a.tendencies.includes(hue))
        return {
          outcome: "TENDENCY",
          explanation: `${quoted} traz ${name} só como tendência (matiz principal ${principal})`,
        };
      if (a.excludedHues.includes(hue))
        return { outcome: "UNMET", explanation: `${quoted} exclui ${name}` };
      if (hasHue)
        return {
          outcome: "UNMET",
          explanation: `${quoted} tem matiz principal ${principal}, não ${name}`,
        };
      return { outcome: "UNDOCUMENTED", explanation: `${quoted} não informa matiz` };
    }
    if (r.aspect === "TENDENCY") {
      const tendency = hueLabels[hue].tendency;
      if (a.tendencies.includes(hue))
        return { outcome: "MET", explanation: `${quoted} registra tendência ${tendency}` };
      if (hasHue)
        return {
          outcome: "UNMET",
          explanation: `${quoted} não registra tendência ${tendency}`,
        };
      return { outcome: "UNDOCUMENTED", explanation: `${quoted} não informa matiz` };
    }
    if (a.principalHue === hue || a.tendencies.includes(hue))
      return {
        outcome: "UNMET",
        explanation: `${quoted} registra ${name}; o pedido evita ${name}`,
      };
    return { outcome: "MET", explanation: `${quoted} não registra ${name}` };
  }
  const qualifier = r.qualifier;
  const labels = qualifierLabels[qualifier];
  if (a.contradictory.some((q) => q === qualifier || q === oppositeQualifier[qualifier]))
    return {
      outcome: "DIVERGENT",
      explanation: `${quoted} é contraditório quanto a ${labels.aspect}`,
    };
  const present = a.qualifiers.includes(qualifier);
  if (r.aspect === "REQUIRE") {
    if (present) return { outcome: "MET", explanation: `${quoted} registra ${labels.mention}` };
    const opposite = oppositeQualifier[qualifier];
    if (opposite && a.qualifiers.includes(opposite))
      return {
        outcome: "UNMET",
        explanation: `${quoted} registra ${qualifierLabels[opposite].mention}; o pedido exige ${labels.require}`,
      };
    if (a.excludedQualifiers.includes(qualifier))
      return { outcome: "UNMET", explanation: `${quoted} exclui ${labels.mention}` };
    return { outcome: "UNDOCUMENTED", explanation: `${quoted} não informa ${labels.aspect}` };
  }
  if (present)
    return {
      outcome: "UNMET",
      explanation: `${quoted} registra ${labels.mention}; o pedido é ${labels.exclude}`,
    };
  return { outcome: "MET", explanation: `${quoted} não registra ${labels.mention}` };
}

const positive = (o: CheckOutcome) => o === "MET" || o === "TENDENCY";
/*
 * Só matiz, tendência e qualificador exigido são evidência afirmativa. Evitar
 * um matiz ou excluir "leitoso" é atendido pela ausência do termo e, sozinho,
 * não faz uma base parecer próxima do pedido.
 */
const affirmative = (c: BehaviorCheck) =>
  positive(c.outcome) && (c.aspect === "HUE" || c.aspect === "TENDENCY" || c.aspect === "REQUIRE");

/* Vários registros da mesma vista precisam concordar. */
function combine(results: RecordOutcome[], view: BehaviorView): RecordOutcome {
  const outcomes = new Set(results.map((r) => r.outcome));
  const divergent =
    outcomes.has("DIVERGENT") ||
    (outcomes.has("UNMET") && [...outcomes].some(positive)) ||
    (outcomes.has("MET") && outcomes.has("TENDENCY"));
  if (divergent)
    return {
      outcome: "DIVERGENT",
      explanation: `registros de ${viewLabels[view].toLowerCase()} divergem: ${results
        .map((r) => r.explanation)
        .join(" × ")}`,
    };
  for (const outcome of ["MET", "TENDENCY", "UNMET"] as const) {
    const found = results.find((r) => r.outcome === outcome);
    if (found) return found;
  }
  return results[0];
}

function evaluateView(
  pigment: MatchablePigment,
  view: BehaviorView,
  criteria: ViewCriteria,
): ViewEvaluation {
  const label = viewLabels[view];
  const records = pigment.behaviors.filter((b) => b.view === view);
  const general = pigment.behaviors.filter((b) => b.view === "GENERAL");
  const analyses = records.map((b) => analyzeDescriptor(behaviorDescriptor(b)));
  const evidence = records.length ? "VIEW" : general.length ? "GENERAL_ONLY" : "MISSING";
  const checks = requirements(criteria).map((r): BehaviorCheck => {
    const requested = requestedLabel(r);
    if (evidence === "GENERAL_ONLY")
      return {
        aspect: r.aspect,
        requested,
        outcome: "UNDOCUMENTED",
        explanation: `${label}: sem registro da vista; o comportamento geral ${general
          .map((b) => `"${behaviorDescriptor(b)}"`)
          .join(", ")} não comprova ${label.toLowerCase()}`,
      };
    if (evidence === "MISSING")
      return {
        aspect: r.aspect,
        requested,
        outcome: "UNDOCUMENTED",
        explanation: `${label}: sem registro de comportamento`,
      };
    const combined = combine(
      analyses.map((a) => evaluateRecord(r, a)),
      view,
    );
    return {
      aspect: r.aspect,
      requested,
      outcome: combined.outcome,
      explanation: `${label}: ${combined.explanation}`,
    };
  });
  return { view, evidence, checks };
}

/* Indício do registro GENERAL, sem valor de prova por vista. */
function generalHints(pigment: MatchablePigment, criteria: BehaviorCriteria): string[] {
  const general = pigment.behaviors.filter((b) => b.view === "GENERAL");
  const hints: string[] = [];
  for (const b of general) {
    const analysis = analyzeDescriptor(behaviorDescriptor(b));
    const met = behaviorViews.flatMap((view) =>
      requirements(criteria[view])
        .filter((r) => r.aspect !== "AVOID_HUE" && r.aspect !== "EXCLUDE")
        .filter((r) => positive(evaluateRecord(r, analysis).outcome))
        .map((r) => `${requestedLabel(r)} (${viewLabels[view].toLowerCase()})`),
    );
    if (met.length)
      hints.push(
        `O comportamento geral "${analysis.text}" tem relação com ${[...new Set(met)].join(", ")}, mas não separa frente e ângulo.`,
      );
  }
  return hints;
}

const tally = (
  match: PigmentMatch<MatchablePigment>,
  predicate: (check: BehaviorCheck) => boolean,
) => match.views.flatMap((v) => v.checks).filter(predicate).length;

const commercialOrder = (a: MatchablePigment, b: MatchablePigment) =>
  Number(Boolean(a.isDemo)) - Number(Boolean(b.isDemo)) ||
  a.manufacturer.localeCompare(b.manufacturer, "pt-BR") ||
  a.productLine.localeCompare(b.productLine, "pt-BR") ||
  a.code.localeCompare(b.code, "pt-BR", { numeric: true });

export function matchPigmentsByBehavior<P extends MatchablePigment>(
  criteria: BehaviorCriteria,
  pigments: P[],
): MatchResult<P> {
  const views = behaviorViews.filter((view) => !isEmptyView(criteria[view]));
  const result: MatchResult<P> = { complete: [], partial: [], generalOnly: [] };
  if (!views.length) return result;
  for (const pigment of pigments) {
    const match: PigmentMatch<P> = {
      pigment,
      views: views.map((view) => evaluateView(pigment, view, criteria[view])),
      generalHints: [],
    };
    const checks = match.views.flatMap((v) => v.checks);
    if (checks.every((c) => c.outcome === "MET")) result.complete.push(match);
    else if (checks.some(affirmative)) result.partial.push(match);
    else {
      match.generalHints = generalHints(pigment, criteria);
      if (match.generalHints.length) result.generalOnly.push(match);
    }
  }
  result.complete.sort((a, b) => commercialOrder(a.pigment, b.pigment));
  result.generalOnly.sort((a, b) => commercialOrder(a.pigment, b.pigment));
  // Parciais: primeiro quem atende mais matizes pedidos, depois mais condições
  // atendidas e tendências; empate pela ordem comercial.
  result.partial.sort(
    (a, b) =>
      tally(b, (c) => c.aspect === "HUE" && c.outcome === "MET") -
        tally(a, (c) => c.aspect === "HUE" && c.outcome === "MET") ||
      tally(b, (c) => c.outcome === "MET") - tally(a, (c) => c.outcome === "MET") ||
      tally(b, (c) => c.outcome === "TENDENCY") - tally(a, (c) => c.outcome === "TENDENCY") ||
      commercialOrder(a.pigment, b.pigment),
  );
  return result;
}
