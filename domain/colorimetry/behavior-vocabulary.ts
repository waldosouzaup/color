/**
 * Vocabulário explícito da consulta de comportamento óptico.
 *
 * O mesmo léxico lê a pergunta do profissional e os descritores cadastrados em
 * `PigmentBehavior` ("Amarelado sujo", "Azulado leitoso"). Não há sinônimo
 * implícito: um termo fora desta lista não é reconhecido, e "dourado" não vira
 * "amarelo" só por parecer próximo.
 */
export const hueFamilies = [
  "YELLOW",
  "BLUE",
  "GREEN",
  "RED",
  "VIOLET",
  "ORANGE",
  "BROWN",
  "PINK",
  "GOLD",
  "GRAY",
  "BLACK",
  "WHITE",
] as const;
export type HueFamily = (typeof hueFamilies)[number];

export const qualifiers = [
  "CLEAN",
  "DIRTY",
  "LIGHT",
  "DARK",
  "MILKY",
  "TRANSPARENT",
  "FINE",
  "COARSE",
  "BRIGHT",
  "PARTICLE_VISIBLE",
] as const;
export type Qualifier = (typeof qualifiers)[number];

/* Pares que não podem valer juntos na mesma vista. */
export const oppositeQualifier: Partial<Record<Qualifier, Qualifier>> = {
  CLEAN: "DIRTY",
  DIRTY: "CLEAN",
  LIGHT: "DARK",
  DARK: "LIGHT",
  FINE: "COARSE",
  COARSE: "FINE",
};

export const qualifierGroups = [
  { id: "cleanliness", label: "Limpeza", qualifiers: ["CLEAN", "DIRTY"] },
  { id: "lightness", label: "Luminosidade", qualifiers: ["LIGHT", "DARK"] },
  { id: "milky", label: "Efeito leitoso", qualifiers: ["MILKY"] },
  { id: "transparency", label: "Transparência", qualifiers: ["TRANSPARENT"] },
  { id: "particleSize", label: "Tamanho da partícula", qualifiers: ["FINE", "COARSE"] },
  { id: "brightness", label: "Brilho", qualifiers: ["BRIGHT"] },
  { id: "particleVisibility", label: "Aparência da partícula", qualifiers: ["PARTICLE_VISIBLE"] },
] as const satisfies readonly {
  id: string;
  label: string;
  qualifiers: readonly Qualifier[];
}[];

export const hueLabels: Record<
  HueFamily,
  { name: string; action: string; tendency: string }
> = {
  YELLOW: { name: "amarelo", action: "amarelar", tendency: "amarelada" },
  BLUE: { name: "azul", action: "azular", tendency: "azulada" },
  GREEN: { name: "verde", action: "esverdear", tendency: "esverdeada" },
  RED: { name: "vermelho", action: "avermelhar", tendency: "avermelhada" },
  VIOLET: { name: "violeta", action: "arroxear", tendency: "arroxeada" },
  ORANGE: { name: "laranja", action: "alaranjar", tendency: "alaranjada" },
  BROWN: { name: "marrom", action: "amarronzar", tendency: "amarronzada" },
  PINK: { name: "rosa", action: "tender ao rosa", tendency: "rosada" },
  GOLD: { name: "dourado", action: "dourar", tendency: "dourada" },
  GRAY: { name: "cinza", action: "acinzentar", tendency: "acinzentada" },
  BLACK: { name: "preto", action: "tender ao preto", tendency: "enegrecida" },
  WHITE: { name: "branco", action: "tender ao branco", tendency: "esbranquiçada" },
};

export const qualifierLabels: Record<
  Qualifier,
  { require: string; exclude: string; aspect: string; mention: string }
> = {
  CLEAN: { require: "limpo", exclude: "não limpo", aspect: "limpeza", mention: "limpo" },
  DIRTY: { require: "sujo", exclude: "não sujo", aspect: "limpeza", mention: "sujo" },
  LIGHT: { require: "claro", exclude: "não claro", aspect: "luminosidade", mention: "claro" },
  DARK: { require: "escuro", exclude: "não escuro", aspect: "luminosidade", mention: "escuro" },
  MILKY: {
    require: "leitoso",
    exclude: "sem efeito leitoso",
    aspect: "efeito leitoso",
    mention: "efeito leitoso",
  },
  TRANSPARENT: {
    require: "transparente",
    exclude: "não transparente",
    aspect: "transparência",
    mention: "transparência",
  },
  FINE: {
    require: "partícula fina",
    exclude: "partícula não fina",
    aspect: "tamanho de partícula",
    mention: "partícula fina",
  },
  COARSE: {
    require: "partícula graúda",
    exclude: "partícula não graúda",
    aspect: "tamanho de partícula",
    mention: "partícula graúda",
  },
  BRIGHT: { require: "brilhante", exclude: "sem brilho", aspect: "brilho", mention: "brilho" },
  PARTICLE_VISIBLE: {
    require: "partícula aparente",
    exclude: "sem partícula aparente",
    aspect: "aparência da partícula",
    mention: "partícula aparente",
  },
};

/*
 * `verb`: infinitivo, subjuntivo ou gerúndio ("amarelar", "amarele") — pedido.
 * `past`: pretérito ("amarelou") — descreve o que aconteceu com a tinta.
 * Presente ("azula", "escurece") fica em `base`, porque serve aos dois casos.
 */
export type TermForm = "base" | "tendency" | "verb" | "past";
export type LexiconEntry =
  | { kind: "hue"; family: HueFamily; form: TermForm }
  | { kind: "qualifier"; qualifier: Qualifier; form: TermForm };

const genders = (stem: string) => [`${stem}o`, `${stem}a`, `${stem}os`, `${stem}as`];

type WordForms = Partial<Record<TermForm, string[]>>;

const hueWords: Record<HueFamily, WordForms> = {
  YELLOW: {
    base: [...genders("amarel"), "amarelam"],
    tendency: genders("amarelad"),
    verb: ["amarelar", "amarele", "amarelem", "amarelando", "amarelasse"],
    past: ["amarelou", "amarelaram"],
  },
  BLUE: {
    base: ["azul", "azuis", "azula", "azulam"],
    tendency: genders("azulad"),
    verb: ["azular", "azule", "azulem", "azulando", "azulasse"],
    past: ["azulou", "azularam"],
  },
  GREEN: {
    base: ["verde", "verdes", "esverdeia"],
    tendency: genders("esverdead"),
    verb: ["esverdear", "esverdeie", "esverdeiem", "esverdeando"],
    past: ["esverdeou", "esverdearam"],
  },
  RED: {
    base: [...genders("vermelh"), "avermelha"],
    tendency: genders("avermelhad"),
    verb: ["avermelhar", "avermelhe", "avermelhem", "avermelhando"],
    past: ["avermelhou", "avermelharam"],
  },
  VIOLET: {
    base: ["violeta", "violetas", ...genders("rox"), "lilas"],
    tendency: [...genders("arroxead"), ...genders("violace")],
    verb: ["arroxear", "arroxeie", "arroxeando"],
    past: ["arroxeou"],
  },
  ORANGE: {
    base: ["laranja", "laranjas"],
    tendency: genders("alaranjad"),
    verb: ["alaranjar", "alaranje", "alaranjando"],
  },
  BROWN: {
    base: ["marrom", "marrons"],
    tendency: genders("amarronzad"),
    verb: ["amarronzar", "amarronze"],
  },
  PINK: { base: ["rosa", "rosas"], tendency: genders("rosad") },
  GOLD: { base: ["ouro"], tendency: genders("dourad"), verb: ["dourar", "doure"] },
  GRAY: {
    base: ["cinza", "cinzas"],
    tendency: genders("acinzentad"),
    verb: ["acinzentar", "acinzente"],
    past: ["acinzentou"],
  },
  BLACK: { base: [...genders("pret"), ...genders("negr")], tendency: genders("enegrecid") },
  WHITE: { base: genders("branc"), tendency: genders("esbranquicad") },
};

const qualifierWords: Record<Exclude<Qualifier, "PARTICLE_VISIBLE">, WordForms> = {
  CLEAN: {
    base: [...genders("limp"), "limpeza", ...genders("limpid")],
    verb: ["limpar", "limpe", "limpem", "limpando"],
  },
  DIRTY: {
    base: [...genders("suj"), "sujeira", "sujidade", "sujam"],
    verb: ["sujar", "suje", "sujem", "sujando"],
    past: ["sujou", "sujaram"],
  },
  LIGHT: {
    base: [...genders("clar"), ...genders("clarinh"), ...genders("claread"), "clareia"],
    verb: ["clarear", "clareie", "clareiem", "clareando"],
    past: ["clareou", "clarearam"],
  },
  DARK: {
    base: [...genders("escur"), ...genders("escurecid"), "escurece"],
    verb: ["escurecer", "escureca", "escurecam", "escurecendo"],
    past: ["escureceu", "escureceram"],
  },
  MILKY: { base: [...genders("leitos"), "leitosidade"] },
  TRANSPARENT: { base: ["transparente", "transparentes", "transparencia"] },
  FINE: { base: [...genders("fin"), ...genders("fininh")] },
  COARSE: { base: [...genders("graud"), ...genders("gross")] },
  BRIGHT: { base: ["brilhante", "brilhantes", "brilho", ...genders("brilhos")] },
};

const termForms = ["base", "tendency", "verb", "past"] as const;

export const lexicon: ReadonlyMap<string, LexiconEntry> = (() => {
  const map = new Map<string, LexiconEntry>();
  for (const family of hueFamilies)
    for (const form of termForms)
      for (const word of hueWords[family][form] ?? [])
        map.set(word, { kind: "hue", family, form });
  for (const [qualifier, words] of Object.entries(qualifierWords) as [
    Exclude<Qualifier, "PARTICLE_VISIBLE">,
    WordForms,
  ][])
    for (const form of termForms)
      for (const word of words[form] ?? []) map.set(word, { kind: "qualifier", qualifier, form });
  return map;
})();

/* "Partícula" sozinha é contexto; só vira critério quando se fala da aparência dela. */
const particleWords = new Set(["particula", "particulas"]);
const particleCuesBefore = new Set([
  "aparencia",
  "aumentar",
  "aumenta",
  "realcar",
  "realca",
  "destacar",
  "destaca",
  "evidenciar",
  "evidencia",
]);
const particleCuesAfter = new Set(["aparente", "aparentes", "visivel", "visiveis"]);

export const negationWords = new Set([
  "sem",
  "nao",
  "nem",
  "evitar",
  "evite",
  "evitem",
  "evitando",
  "nunca",
  "jamais",
]);

export function normalizeText(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export type Token = { kind: "word"; value: string } | { kind: "separator"; value: string };

export function tokenize(text: string): Token[] {
  // "é" perde o acento na normalização e viraria a conjunção "e".
  const prepared = text.toLowerCase().replace(/(^|[^\p{L}])é(?=$|[^\p{L}])/gu, "$1 ser ");
  const tokens: Token[] = [];
  for (const match of normalizeText(prepared).matchAll(/[a-z0-9]+|[,;.!?/()\n]/g))
    tokens.push(
      /[a-z0-9]/.test(match[0])
        ? { kind: "word", value: match[0] }
        : { kind: "separator", value: match[0] },
    );
  return tokens;
}

export interface RecognizedTerm {
  index: number;
  word: string;
  entry: LexiconEntry;
}

/** Termos do léxico, na ordem em que aparecem. */
export function recognizeTerms(tokens: Token[]): RecognizedTerm[] {
  const terms: RecognizedTerm[] = [];
  tokens.forEach((token, index) => {
    if (token.kind !== "word") return;
    const entry = lexicon.get(token.value);
    if (entry) {
      terms.push({ index, word: token.value, entry });
      return;
    }
    if (!particleWords.has(token.value)) return;
    const window = (from: number, to: number) =>
      tokens
        .slice(Math.max(0, from), Math.max(0, to))
        .filter((t): t is Extract<Token, { kind: "word" }> => t.kind === "word")
        .map((t) => t.value);
    const visible =
      window(index - 3, index).some((w) => particleCuesBefore.has(w)) ||
      window(index + 1, index + 2).some((w) => particleCuesAfter.has(w));
    if (visible)
      terms.push({
        index,
        word: token.value,
        entry: { kind: "qualifier", qualifier: "PARTICLE_VISIBLE", form: "base" },
      });
  });
  return terms;
}

export interface DescriptorAnalysis {
  text: string;
  empty: boolean;
  principalHue: HueFamily | null;
  tendencies: HueFamily[];
  excludedHues: HueFamily[];
  qualifiers: Qualifier[];
  excludedQualifiers: Qualifier[];
  /* Qualificadores que o próprio registro afirma e nega, ou que são opostos. */
  contradictory: Qualifier[];
}

/**
 * Lê um descritor cadastrado. O primeiro matiz é o principal ("Azul
 * esverdeado" é azul); os seguintes são tendências. Negação ("sem leitoso")
 * vale para o termo seguinte.
 */
export function analyzeDescriptor(text: string): DescriptorAnalysis {
  const tokens = tokenize(text);
  const terms = recognizeTerms(tokens);
  const analysis: DescriptorAnalysis = {
    text,
    empty: !text.trim(),
    principalHue: null,
    tendencies: [],
    excludedHues: [],
    qualifiers: [],
    excludedQualifiers: [],
    contradictory: [],
  };
  const negated = (term: RecognizedTerm) => {
    for (let i = term.index - 1, words = 0; i >= 0 && words < 3; i--) {
      const token = tokens[i];
      if (token.kind === "separator") return false;
      if (negationWords.has(token.value)) return true;
      if (lexicon.has(token.value)) return false;
      words++;
    }
    return false;
  };
  const add = <T>(list: T[], value: T) => {
    if (!list.includes(value)) list.push(value);
  };
  for (const term of terms) {
    const isNegated = negated(term);
    if (term.entry.kind === "hue") {
      const family = term.entry.family;
      if (isNegated) add(analysis.excludedHues, family);
      else if (!analysis.principalHue) analysis.principalHue = family;
      else if (family !== analysis.principalHue) add(analysis.tendencies, family);
    } else if (isNegated) add(analysis.excludedQualifiers, term.entry.qualifier);
    else add(analysis.qualifiers, term.entry.qualifier);
  }
  for (const qualifier of analysis.qualifiers) {
    const opposite = oppositeQualifier[qualifier];
    if (
      analysis.excludedQualifiers.includes(qualifier) ||
      (opposite && analysis.qualifiers.includes(opposite))
    )
      add(analysis.contradictory, qualifier);
  }
  return analysis;
}
