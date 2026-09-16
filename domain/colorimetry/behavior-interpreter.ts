import {
  behaviorViews,
  criteriaIssues,
  describeCriteria,
  emptyCriteria,
  isEmptyCriteria,
  viewLabels,
  type BehaviorCriteria,
  type BehaviorView,
} from "./behavior-criteria";
import {
  hueLabels,
  negationWords,
  oppositeQualifier,
  recognizeTerms,
  tokenize,
  type LexiconEntry,
  type RecognizedTerm,
  type Token,
} from "./behavior-vocabulary";

/**
 * Interpreta, sem serviço externo, uma pergunta em português como critérios
 * por vista. A regra é conservadora: quando a vista, a intenção ou as
 * condições não ficam claras, o resultado pede confirmação em vez de adivinhar.
 */
const anchorWords: Record<string, BehaviorView> = {
  frente: "FRONT",
  frentes: "FRONT",
  face: "FRONT",
  frontal: "FRONT",
  angulo: "ANGLE",
  angulos: "ANGLE",
  flop: "ANGLE",
};
const clauseBreaks = new Set(["e", "mas", "porem", "enquanto", "entretanto", "contudo", "todavia"]);
/* Artigos e preposições entre um termo e a vista: "amarele a frente", "azulado no ângulo". */
const connectors = new Set([
  "a", "o", "as", "os", "na", "no", "nas", "nos", "em", "de", "da", "do", "das", "dos",
  "pela", "pelo", "pelas", "pelos", "para", "pra", "pro", "ao", "aos", "sua", "seu", "suas", "seus",
]);
const tendencyCues = new Set(["puxado", "puxada", "puxando", "tendendo", "tende", "tendencia", "fundo"]);
/* Palavras que podem ficar entre termos da mesma descrição: "azulado com efeito leitoso". */
const fillers = new Set([
  ...connectors,
  ...tendencyCues,
  "levemente", "leve", "ligeiramente", "bem", "pouco", "meio", "mais", "muito", "bastante",
  "um", "uma", "tom", "efeito", "aspecto", "acabamento", "ser", "seja", "sejam", "fique",
  "fiquem", "ficar", "com",
]);
const desireMarkers = new Set([
  "quero", "queria", "quer", "preciso", "precisa", "precisaria", "necessito", "procuro",
  "procurando", "busco", "buscando", "gostaria", "desejo", "deixe", "deixem", "deixar", "deixa",
  "deixando", "fique", "fiquem", "ficar", "torne", "tornar", "indique", "indica", "sugira",
  "encontre", "encontrar", "qual", "quais", "existe", "existem",
]);
const observationMarkers = new Set([
  "ficou", "ficaram", "ficando", "saiu", "sairam", "veio", "vieram", "apresenta", "apresentando",
  "puxou", "deu",
]);
/* "está"/"tá" perdem o acento; só contam quando descrevem cor ou vista logo adiante. */
const stateVerbs = new Set(["esta", "estao", "ta"]);
const possessives = new Set(["minha", "meu", "nossa", "nosso"]);
const paintNouns = new Set(["tinta", "cor", "mistura", "pintura", "chapa"]);
const negatedModals = new Set([
  "quero", "queria", "quer", "preciso", "precisa", "pode", "possa", "deve", "deixe", "deixar",
  "deixa", "fique", "ficar", "fiquem", "gostaria",
]);

type Anchor = { type: "anchor"; index: number; views: BehaviorView[] };
type Term = {
  type: "term";
  index: number;
  term: RecognizedTerm;
  negated: boolean;
  segment: number;
};
type Item =
  | Anchor
  | Term
  | { type: "negation"; index: number; word: string }
  | { type: "or"; index: number }
  | { type: "word"; index: number; word: string }
  | { type: "break"; index: number; word: string };

type Mood = "DESIRE" | "OBSERVATION" | "MIXED";

export interface InterpretationIssue {
  kind: "OBSERVATION" | "UNASSIGNED" | "CONFLICT" | "ALTERNATIVE" | "VIEW_WITHOUT_BEHAVIOR";
  /* Bloqueante: a consulta só roda depois de confirmação ou ajuste. */
  blocking: boolean;
  message: string;
}

export interface UnassignedCondition {
  word: string;
  negated: boolean;
  entry: LexiconEntry;
}

export interface BehaviorInterpretation {
  question: string;
  status: "READY" | "NEEDS_CONFIRMATION" | "NOTHING_RECOGNIZED";
  /* Tudo o que foi reconhecido e associado a uma vista. */
  criteria: BehaviorCriteria;
  /* Mesmos critérios sem os trechos que descrevem a tinta atual. */
  desiredCriteria: BehaviorCriteria;
  hasObservation: boolean;
  unassigned: UnassignedCondition[];
  issues: InterpretationIssue[];
  summary: string;
}

function buildItems(tokens: Token[]): Item[] {
  const terms = new Map(recognizeTerms(tokens).map((t) => [t.index, t]));
  return tokens.map((token, index): Item => {
    if (token.kind === "separator") return { type: "break", index, word: token.value };
    const word = token.value;
    const term = terms.get(index);
    if (term) return { type: "term", index, term, negated: false, segment: 0 };
    if (anchorWords[word]) return { type: "anchor", index, views: [anchorWords[word]] };
    if (clauseBreaks.has(word)) return { type: "break", index, word };
    if (negationWords.has(word)) return { type: "negation", index, word };
    if (word === "ou") return { type: "or", index };
    return { type: "word", index, word };
  });
}

const isConnector = (item: Item | undefined) =>
  item?.type === "word" && connectors.has(item.word);

/* "frente e ângulo azulados": duas vistas citadas juntas recebem a mesma descrição. */
function groupAnchors(items: Item[]): Item[] {
  const result = [...items];
  for (let i = 0; i < result.length; i++) {
    const anchor = result[i];
    if (anchor.type !== "anchor") continue;
    let back = i - 1;
    while (isConnector(result[back])) back--;
    if (result[back]?.type === "term") continue;
    let j = i + 1;
    while (isConnector(result[j])) j++;
    const joiner = result[j];
    if (joiner?.type !== "break" || !["e", ",", "/"].includes(joiner.word)) continue;
    j++;
    while (isConnector(result[j])) j++;
    const next = result[j];
    if (next?.type !== "anchor") continue;
    anchor.views = [...new Set([...anchor.views, ...next.views])];
    result.splice(i + 1, j - i);
  }
  return result;
}

function splitSegments(items: Item[]): Item[][] {
  const segments: Item[][] = [[]];
  for (const item of items)
    if (item.type === "break") {
      if (segments[segments.length - 1].length) segments.push([]);
    } else segments[segments.length - 1].push(item);
  return segments.filter((s) => s.length);
}

type AlternativePair = [string, string];

/* Negação vale para o termo seguinte; "não quero…" vale para o restante do trecho. */
function applyNegation(segment: Item[], alternatives: AlternativePair[]) {
  let scope: "none" | "next" | "rest" = "none";
  let budget = 0;
  let previous: Term | null = null;
  let pendingOr = false;
  segment.forEach((item, position) => {
    if (item.type === "negation") {
      const next = segment[position + 1];
      if (scope !== "rest")
        scope = next?.type === "word" && negatedModals.has(next.word) ? "rest" : "next";
      budget = 3;
    } else if (item.type === "or") {
      if (previous?.negated && scope !== "rest") {
        scope = "next";
        budget = 3;
      } else pendingOr = Boolean(previous);
    } else if (item.type === "term") {
      if (scope === "rest") item.negated = true;
      else if (scope === "next") {
        item.negated = true;
        scope = "none";
      } else if (pendingOr && previous)
        alternatives.push([previous.term.word, item.term.word]);
      pendingOr = false;
      previous = item;
    } else if (item.type === "anchor") {
      if (scope === "next") scope = "none";
    } else if (scope === "next" && --budget < 0) scope = "none";
  });
}

function segmentMood(segment: Item[]): Mood | null {
  const words = segment.map((item) =>
    item.type === "word" ? item.word : item.type === "term" ? item.term.word : "",
  );
  const desire = segment.some(
    (item) =>
      (item.type === "word" && desireMarkers.has(item.word)) ||
      (item.type === "term" && item.term.entry.form === "verb"),
  );
  const strongObservation = segment.some((item, position) => {
    if (item.type === "term") return item.term.entry.form === "past";
    if (item.type !== "word") return false;
    if (observationMarkers.has(item.word)) return true;
    return (
      stateVerbs.has(item.word) &&
      segment
        .slice(position + 1, position + 4)
        .some((next) => next.type === "term" || next.type === "anchor" || (next.type === "word" && next.word === "com"))
    );
  });
  const possessiveObservation = words.some(
    (word, i) => possessives.has(word) && paintNouns.has(words[i + 1] ?? ""),
  );
  if (desire && strongObservation) return "MIXED";
  if (strongObservation || (possessiveObservation && !desire)) return "OBSERVATION";
  if (desire) return "DESIRE";
  return null;
}

type Cluster = { segment: number; start: number; end: number; terms: Term[] };

function buildClusters(segment: Item[], segmentIndex: number): Cluster[] {
  const clusters: Cluster[] = [];
  let current: Cluster | null = null;
  segment.forEach((item, position) => {
    if (item.type !== "term") return;
    item.segment = segmentIndex;
    const between = current ? segment.slice(current.end + 1, position) : [];
    const glued =
      current &&
      between.every(
        (b) => b.type === "negation" || b.type === "or" || (b.type === "word" && fillers.has(b.word)),
      );
    if (current && glued) {
      current.terms.push(item);
      current.end = position;
    } else {
      current = { segment: segmentIndex, start: position, end: position, terms: [item] };
      clusters.push(current);
    }
  });
  return clusters;
}

type Neighbor = { anchor: Anchor; connectors: number };

function neighbor(segment: Item[], from: number, step: 1 | -1): Neighbor | null {
  let connectorsSeen = 0;
  for (let p = from + step; p >= 0 && p < segment.length; p += step) {
    const item = segment[p];
    if (item.type === "anchor") return { anchor: item, connectors: connectorsSeen };
    if (item.type === "negation") continue;
    if (item.type === "word" && fillers.has(item.word)) {
      if (connectors.has(item.word)) connectorsSeen++;
      continue;
    }
    return null;
  }
  return null;
}

function nearestAnchor(segment: Item[], from: number, step: 1 | -1): Anchor | null {
  for (let p = from + step; p >= 0 && p < segment.length; p += step) {
    const item = segment[p];
    if (item.type === "anchor") return item;
  }
  return null;
}

/**
 * Associa cada grupo de termos a uma vista. "amarele a frente" liga para a
 * frente; "frente amarelada", para trás. Quando as duas leituras são possíveis
 * ("na frente amarelo no ângulo azul"), vence a vista ainda sem descrição.
 */
function assignClusters(segments: Item[][]) {
  const perSegment = segments.map((segment, s) => buildClusters(segment, s));
  const assignment = new Map<Cluster, Anchor | null>();
  const used = new Set<Anchor>();
  const deferred: { cluster: Cluster; back: Anchor; forward: Anchor }[] = [];
  segments.forEach((segment, s) => {
    for (const cluster of perSegment[s]) {
      const back = neighbor(segment, cluster.start, -1);
      const forward = neighbor(segment, cluster.end, 1);
      let chosen: Anchor | null = null;
      if (back && forward) {
        if (forward.connectors === 0) chosen = back.anchor;
        else deferred.push({ cluster, back: back.anchor, forward: forward.anchor });
      } else
        chosen =
          back?.anchor ??
          forward?.anchor ??
          nearestAnchor(segment, cluster.start, -1) ??
          nearestAnchor(segment, cluster.end, 1);
      if (chosen) used.add(chosen);
      assignment.set(cluster, chosen);
    }
  });
  const firstSignificant = segments.flat().find((i) => i.type === "anchor" || i.type === "term");
  for (const { cluster, back, forward } of deferred) {
    const chosen =
      used.has(forward) && !used.has(back)
        ? back
        : used.has(back) && !used.has(forward)
          ? forward
          : firstSignificant?.type === "anchor"
            ? back
            : forward;
    used.add(chosen);
    assignment.set(cluster, chosen);
  }
  // Trechos sem vista: "na frente, amarelo" e "frente amarela e limpa".
  const anchorOnly = (s: number) =>
    segments[s]?.some((i) => i.type === "anchor") && !perSegment[s].length;
  segments.forEach((segment, s) => {
    if (segment.some((i) => i.type === "anchor")) return;
    for (const cluster of perSegment[s]) {
      let chosen: Anchor | null = null;
      if (anchorOnly(s - 1)) chosen = segments[s - 1].filter((i) => i.type === "anchor").at(-1) as Anchor;
      else if (anchorOnly(s + 1)) chosen = segments[s + 1].find((i) => i.type === "anchor") as Anchor;
      else if (cluster.terms.every((t) => t.term.entry.kind === "qualifier"))
        for (let previous = s - 1; previous >= 0 && !chosen; previous--) {
          const assigned = perSegment[previous].map((c) => assignment.get(c)).filter(Boolean);
          chosen = assigned.at(-1) ?? null;
        }
      if (chosen) used.add(chosen);
      assignment.set(cluster, chosen);
    }
  });
  return { clusters: perSegment.flat(), assignment, used };
}

export function interpretBehaviorQuestion(question: string): BehaviorInterpretation {
  const tokens = tokenize(question);
  const segments = splitSegments(groupAnchors(buildItems(tokens)));
  const alternatives: AlternativePair[] = [];
  const moods: (Mood | null)[] = [];
  segments.forEach((segment, s) => {
    applyNegation(segment, alternatives);
    moods.push(segmentMood(segment) ?? (s > 0 ? moods[s - 1] : null));
  });
  const { clusters, assignment, used } = assignClusters(segments);

  const criteria = emptyCriteria();
  const desiredCriteria = emptyCriteria();
  const issues: InterpretationIssue[] = [];
  const unassigned: UnassignedCondition[] = [];
  let hasObservation = false;

  const perView: Record<BehaviorView, { term: Term; observed: boolean }[]> = { FRONT: [], ANGLE: [] };
  for (const cluster of clusters) {
    const anchor = assignment.get(cluster);
    const mood = moods[cluster.segment];
    const observed = mood === "OBSERVATION" || mood === "MIXED";
    for (const term of cluster.terms) {
      if (!anchor) {
        unassigned.push({ word: term.term.word, negated: term.negated, entry: term.term.entry });
        continue;
      }
      if (observed) hasObservation = true;
      for (const view of anchor.views) perView[view].push({ term, observed });
    }
  }

  for (const view of behaviorViews) {
    const entries = perView[view].sort((a, b) => a.term.index - b.term.index);
    for (const target of [criteria, desiredCriteria]) {
      const c = target[view];
      let principalTerm: Term | null = null;
      for (const { term, observed } of entries) {
        if (target === desiredCriteria && observed) continue;
        const entry = term.term.entry;
        if (entry.kind === "qualifier") {
          const list = term.negated ? c.exclude : c.require;
          if (!list.includes(entry.qualifier)) list.push(entry.qualifier);
          continue;
        }
        if (term.negated) {
          if (!c.avoidHues.includes(entry.family)) c.avoidHues.push(entry.family);
        } else if (!c.hue) {
          c.hue = entry.family;
          principalTerm = term;
        } else if (entry.family === c.hue) continue;
        else if (principalTerm && isTendency(tokens, principalTerm, term) && !c.tendency)
          c.tendency = entry.family;
        else if (target === criteria)
          issues.push({
            kind: "CONFLICT",
            blocking: true,
            message: `${viewLabels[view]}: mais de um matiz principal (${hueLabels[c.hue].name} e ${hueLabels[entry.family].name}). Escolha um nos critérios.`,
          });
      }
      // "limpo e não sujo" diz a mesma coisa duas vezes.
      c.exclude = c.exclude.filter((q) => {
        const opposite = oppositeQualifier[q];
        return !(opposite && c.require.includes(opposite));
      });
    }
  }

  if (hasObservation)
    issues.push({
      kind: "OBSERVATION",
      blocking: true,
      message:
        "Parte da pergunta descreve como a tinta está, não o efeito que você procura. Confirme se deseja buscar bases com esse comportamento ou use a bússola para diagnosticar.",
    });
  for (const condition of unassigned)
    issues.push({
      kind: "UNASSIGNED",
      blocking: true,
      message: `"${condition.word}" não foi associado à frente nem ao ângulo. Indique a vista.`,
    });
  for (const [a, b] of alternatives)
    issues.push({
      kind: "ALTERNATIVE",
      blocking: true,
      message: `A pergunta usa "ou" entre "${a}" e "${b}". A consulta exige todas as condições juntas; confirme ou ajuste os critérios.`,
    });
  for (const message of criteriaIssues(criteria))
    issues.push({ kind: "CONFLICT", blocking: true, message });
  const anchors = segments.flat().filter((i): i is Anchor => i.type === "anchor");
  for (const view of behaviorViews) {
    const cited = anchors.some((a) => a.views.includes(view));
    const described = anchors.some((a) => a.views.includes(view) && used.has(a));
    if (cited && !described && !perView[view].length)
      issues.push({
        kind: "VIEW_WITHOUT_BEHAVIOR",
        blocking: false,
        message: `${viewLabels[view]} foi citado, mas nenhum comportamento reconhecido foi associado a ele.`,
      });
  }

  const recognizedAny = clusters.length > 0;
  const status = !recognizedAny || (isEmptyCriteria(criteria) && !unassigned.length)
    ? "NOTHING_RECOGNIZED"
    : issues.some((i) => i.blocking)
      ? "NEEDS_CONFIRMATION"
      : "READY";
  return {
    question,
    status,
    criteria,
    desiredCriteria,
    hasObservation,
    unassigned,
    issues,
    summary: describeCriteria(criteria),
  };
}

/* "Azul esverdeado", "azul puxando pro verde": o segundo matiz é tendência. */
function isTendency(tokens: Token[], principal: Term, candidate: Term) {
  if (candidate.index <= principal.index || candidate.index - principal.index > 5) return false;
  const between = tokens.slice(principal.index + 1, candidate.index);
  if (!between.every((t) => t.kind === "word" && fillers.has(t.value))) return false;
  return (
    candidate.term.entry.form === "tendency" ||
    between.some((t) => t.kind === "word" && tendencyCues.has(t.value))
  );
}

/** Aplica uma condição sem vista à vista escolhida pelo profissional. */
export function applyCondition(
  criteria: BehaviorCriteria,
  condition: UnassignedCondition,
  view: BehaviorView,
): BehaviorCriteria {
  const next = structuredClone(criteria);
  const c = next[view];
  const entry = condition.entry;
  if (entry.kind === "qualifier") {
    const list = condition.negated ? c.exclude : c.require;
    if (!list.includes(entry.qualifier)) list.push(entry.qualifier);
  } else if (condition.negated) {
    if (!c.avoidHues.includes(entry.family)) c.avoidHues.push(entry.family);
  } else if (!c.hue) c.hue = entry.family;
  else if (c.hue !== entry.family && !c.tendency && entry.form === "tendency") c.tendency = entry.family;
  else c.hue = entry.family;
  return next;
}
