import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { lazzurilFullCatalog } from "../domain/colorimetry/lazzuril-catalog";
import { interpretBehaviorQuestion } from "../domain/colorimetry/behavior-interpreter";
import {
  behaviorDescriptor,
  matchPigmentsByBehavior,
  type MatchableBehavior,
  type MatchablePigment,
} from "../domain/colorimetry/behavior-matcher";
import { analyzeDescriptor } from "../domain/colorimetry/behavior-vocabulary";

/* Mesma forma que o seed grava no banco: um registro por vista. */
const catalogRecords = (): MatchablePigment[] =>
  lazzurilFullCatalog.map((base, i) => ({
    id: `base-${i}`,
    code: base.code,
    name: base.name,
    manufacturer: base.manufacturer,
    productLine: base.productLine,
    isDemo: false,
    behaviors: base.behaviors.map((b, j) => ({
      id: `base-${i}-${j}`,
      view: b.view,
      hueCharacteristic: b.hueCharacteristic ?? "",
      lightnessEffect: b.lightnessEffect ?? "",
      cleanlinessEffect: b.cleanlinessEffect ?? "",
      particleEffect: b.particleEffect ?? "",
      source: b.source,
      sourceReference: b.sourceReference,
    })),
  }));

let seq = 0;
const behavior = (view: string, hue: string, extra: Partial<MatchableBehavior> = {}) => ({
  id: `b-${++seq}`,
  view,
  hueCharacteristic: hue,
  lightnessEffect: "",
  cleanlinessEffect: "",
  particleEffect: "",
  source: "Fonte de teste",
  sourceReference: "Referência de teste",
  ...extra,
});
const pigment = (
  code: string,
  behaviors: MatchableBehavior[],
  extra: Partial<MatchablePigment> = {},
): MatchablePigment => ({
  id: code,
  code,
  manufacturer: "Fabricante de teste",
  productLine: "Linha de teste",
  isDemo: false,
  behaviors,
  ...extra,
});

const ask = (question: string, pigments: MatchablePigment[]) => {
  const interpretation = interpretBehaviorQuestion(question);
  expect(interpretation.status).toBe("READY");
  return matchPigmentsByBehavior(interpretation.criteria, pigments);
};
const VIDEO = "Preciso de um pigmento que amarele a frente e deixe o ângulo azul";
const codes = (matches: { pigment: MatchablePigment }[]) => matches.map((m) => m.pigment.code);

describe("consultor de comportamento: caso do vídeo", () => {
  it("recupera o Branco Micronizado pelos comportamentos cadastrados", () => {
    const { complete } = ask(VIDEO, catalogRecords());
    expect(complete).toHaveLength(1);
    const [match] = complete;
    const base = match.pigment as MatchablePigment & { name: string };
    expect(base.name).toBe("Branco Micronizado");
    expect(base.code).toBe("HS 740 / LM 440");
    const front = base.behaviors.find((b) => b.view === "FRONT");
    const angle = base.behaviors.find((b) => b.view === "ANGLE");
    // Descritores do cadastro, com os qualificadores intactos.
    expect(front?.hueCharacteristic).toBe("Amarelado sujo");
    expect(angle?.hueCharacteristic).toBe("Azulado leitoso");
    expect(front?.source).toBe("Sherwin-Williams / Lazzuril");
    expect(front?.sourceReference).toContain("05.jpeg");
    expect(match.views.flatMap((v) => v.checks.map((c) => c.explanation))).toEqual([
      'Frente: "Amarelado sujo" tem matiz principal amarelo',
      'Ângulo: "Azulado leitoso" tem matiz principal azul',
    ]);
  });

  it("não reproduz o código nem a frente descritos pelo chatbot", () => {
    const { complete } = ask(VIDEO, catalogRecords());
    expect(codes(complete).some((code) => code.includes("739"))).toBe(false);
    // "Amarelo esverdeado" na frente não corresponde ao cadastro "Amarelado sujo".
    const chatbot = ask(
      "frente amarelo esverdeado e ângulo azulado leitoso",
      catalogRecords(),
    );
    expect(codes(chatbot.complete)).not.toContain("HS 740 / LM 440");
    const partial = chatbot.partial.find((m) => m.pigment.code === "HS 740 / LM 440");
    expect(partial?.views[0].checks).toContainEqual(
      expect.objectContaining({
        aspect: "TENDENCY",
        outcome: "UNMET",
        explanation: 'Frente: "Amarelado sujo" não registra tendência esverdeada',
      }),
    );
  });

  it("não depende do código: segue os comportamentos gravados", () => {
    const records = catalogRecords();
    const micronizado = records.find((r) => r.code === "HS 740 / LM 440")!;
    // Edição local que troca código e frente: a base deixa de atender.
    micronizado.code = "CÓDIGO LOCAL";
    micronizado.behaviors[0].hueCharacteristic = "Vermelho limpo";
    const invented = pigment("BASE-FICTICIA", [
      behavior("FRONT", "Amarelado"),
      behavior("ANGLE", "Azulado"),
    ]);
    expect(codes(ask(VIDEO, [...records, invented]).complete)).toEqual(["BASE-FICTICIA"]);

    const renamed = catalogRecords();
    renamed.find((r) => r.code === "HS 740 / LM 440")!.code = "OUTRO CÓDIGO";
    expect(codes(ask(VIDEO, renamed).complete)).toEqual(["OUTRO CÓDIGO"]);
  });

  it("os módulos do consultor não fixam a resposta do exemplo", () => {
    for (const file of [
      "domain/colorimetry/behavior-vocabulary.ts",
      "domain/colorimetry/behavior-criteria.ts",
      "domain/colorimetry/behavior-interpreter.ts",
      "domain/colorimetry/behavior-matcher.ts",
      "services/behavior-query.ts",
      "features/behavior-consultant.tsx",
    ]) {
      const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
      expect(source, file).not.toMatch(/LM ?440|HS ?740|Micronizado/i);
    }
  });
});

describe("consultor de comportamento: correspondência por vista", () => {
  it("uma condição de frente não é satisfeita pelo ângulo", () => {
    const inverted = pigment("INVERTIDA", [
      behavior("FRONT", "Azulado"),
      behavior("ANGLE", "Amarelado"),
    ]);
    const result = ask(VIDEO, [inverted]);
    expect(result.complete).toHaveLength(0);
    expect(codes(result.partial)).toEqual([]);
    expect(codes(ask("frente azul e ângulo amarelo", [inverted]).complete)).toEqual([
      "INVERTIDA",
    ]);
  });

  it("exige as duas condições na mesma base", () => {
    const front = pigment("SO-FRENTE", [behavior("FRONT", "Amarelo"), behavior("ANGLE", "Claro")]);
    const angle = pigment("SO-ANGULO", [behavior("FRONT", "Suja"), behavior("ANGLE", "Azul")]);
    const result = ask(VIDEO, [front, angle]);
    expect(result.complete).toHaveLength(0);
    expect(codes(result.partial).sort()).toEqual(["SO-ANGULO", "SO-FRENTE"]);
  });

  it("limpo não aceita sujo e 'sem leitoso' não aceita leitoso", () => {
    const records = catalogRecords();
    const clean = ask("frente amarela limpa e ângulo azul", records);
    expect(codes(clean.complete)).not.toContain("HS 740 / LM 440");
    expect(
      clean.partial
        .find((m) => m.pigment.code === "HS 740 / LM 440")
        ?.views[0].checks.find((c) => c.aspect === "REQUIRE"),
    ).toMatchObject({
      outcome: "UNMET",
      explanation: 'Frente: "Amarelado sujo" registra sujo; o pedido exige limpo',
    });

    const notMilky = ask("frente amarela e ângulo azul sem efeito leitoso", records);
    expect(codes(notMilky.complete)).not.toContain("HS 740 / LM 440");
    expect(
      notMilky.partial
        .find((m) => m.pigment.code === "HS 740 / LM 440")
        ?.views[1].checks.find((c) => c.aspect === "EXCLUDE"),
    ).toMatchObject({ outcome: "UNMET" });

    expect(
      codes(ask("frente amarelada suja e ângulo azulado leitoso", records).complete),
    ).toEqual(["HS 740 / LM 440"]);
  });

  it("qualificador sem registro fica sem informação, nunca atendido", () => {
    const plain = pigment("SEM-LIMPEZA", [
      behavior("FRONT", "Amarelado"),
      behavior("ANGLE", "Azulado"),
    ]);
    const result = ask("frente amarela limpa e ângulo azul", [plain]);
    expect(result.complete).toHaveLength(0);
    expect(result.partial[0].views[0].checks[1]).toMatchObject({
      outcome: "UNDOCUMENTED",
      explanation: 'Frente: "Amarelado" não informa limpeza',
    });
  });

  it("lê luminosidade, limpeza e partículas gravadas em campos próprios", () => {
    const edited = pigment("CAMPOS", [
      behavior("FRONT", "Amarelado", { cleanlinessEffect: "Limpo" }),
      behavior("ANGLE", "Azulado", { particleEffect: "Partícula fina" }),
    ]);
    expect(
      codes(ask("frente amarela limpa e ângulo azul com partícula fina", [edited]).complete),
    ).toEqual(["CAMPOS"]);
    expect(behaviorDescriptor(edited.behaviors[1])).toBe("Azulado · Partícula fina");
  });

  it("GENERAL não comprova frente nem ângulo", () => {
    const general = pigment("SO-GERAL", [behavior("GENERAL", "Amarelado azulado")]);
    const mixed = pigment("GERAL-E-ANGULO", [
      behavior("GENERAL", "Amarelado"),
      behavior("ANGLE", "Azulado"),
    ]);
    const result = ask(VIDEO, [general, mixed]);
    expect(result.complete).toHaveLength(0);
    expect(codes(result.partial)).toEqual(["GERAL-E-ANGULO"]);
    expect(result.partial[0].views[0]).toMatchObject({
      evidence: "GENERAL_ONLY",
      checks: [expect.objectContaining({ outcome: "UNDOCUMENTED" })],
    });
    expect(codes(result.generalOnly)).toEqual(["SO-GERAL"]);
    expect(result.generalOnly[0].generalHints[0]).toContain("não separa frente e ângulo");

    // O catálogo de poliuretano só tem GENERAL: nenhuma base PU é completa.
    const catalog = ask(VIDEO, catalogRecords());
    const polyurethane = new Set(
      lazzurilFullCatalog.filter((b) => b.systemType === "Poliuretano").map((b) => b.code),
    );
    expect(codes(catalog.complete).some((c) => polyurethane.has(c))).toBe(false);
    expect(codes(catalog.generalOnly).every((c) => polyurethane.has(c))).toBe(true);
  });

  it("vista ausente fica sem informação", () => {
    const result = ask(VIDEO, [pigment("SEM-ANGULO", [behavior("FRONT", "Amarelado")])]);
    expect(result.complete).toHaveLength(0);
    expect(result.partial[0].views[1]).toMatchObject({
      evidence: "MISSING",
      checks: [expect.objectContaining({ outcome: "UNDOCUMENTED" })],
    });
  });

  it("registros contraditórios são sinalizados, não escolhidos", () => {
    const twoFronts = pigment("DUAS-FRENTES", [
      behavior("FRONT", "Amarelado"),
      behavior("FRONT", "Azulado", { source: "Outra fonte" }),
      behavior("ANGLE", "Azulado"),
    ]);
    const selfContradictory = pigment("LIMPO-E-SUJO", [
      behavior("FRONT", "Amarelado limpo", { cleanlinessEffect: "Sujo" }),
      behavior("ANGLE", "Azulado"),
    ]);
    expect(analyzeDescriptor("Amarelado limpo · Sujo").contradictory).toEqual(["CLEAN", "DIRTY"]);
    const result = ask("frente amarela limpa e ângulo azul", [twoFronts, selfContradictory]);
    expect(result.complete).toHaveLength(0);
    const outcomes = (code: string) =>
      result.partial.find((m) => m.pigment.code === code)?.views[0].checks.map((c) => c.outcome);
    expect(outcomes("DUAS-FRENTES")).toContain("DIVERGENT");
    expect(outcomes("LIMPO-E-SUJO")).toEqual(["MET", "DIVERGENT"]);
  });

  it("descrição vazia não vira correspondência", () => {
    const empty = pigment("VAZIA", [behavior("FRONT", ""), behavior("ANGLE", "")]);
    const result = ask(VIDEO, [empty]);
    expect(result.complete).toHaveLength(0);
    expect(result.partial).toHaveLength(0);
    expect(result.generalOnly).toHaveLength(0);
  });

  it("separa completas de parciais, sem repetir bases", () => {
    const { complete, partial, generalOnly } = ask(VIDEO, catalogRecords());
    const all = [...codes(complete), ...codes(partial), ...codes(generalOnly)];
    expect(new Set(all).size).toBe(all.length);
    for (const match of partial) {
      const outcomes = match.views.flatMap((v) => v.checks.map((c) => c.outcome));
      expect(outcomes.every((o) => o === "MET")).toBe(false);
      expect(outcomes.some((o) => o === "MET" || o === "TENDENCY")).toBe(true);
    }
    // Parciais com matiz atendido em uma vista vêm antes das que só têm tendência.
    const firstTendencyOnly = partial.findIndex((m) =>
      m.views.every((v) => v.checks.every((c) => c.outcome !== "MET")),
    );
    expect(firstTendencyOnly === -1 || firstTendencyOnly > 0).toBe(true);
  });

  it("exclusão atendida só por ausência não torna a base parcial", () => {
    const unrelated = pigment("SEM-RELACAO", [
      behavior("FRONT", "Vermelho"),
      behavior("ANGLE", "Verde"),
    ]);
    const result = ask("frente amarela e ângulo sem efeito leitoso", [unrelated]);
    expect(result.partial).toHaveLength(0);
  });

  it("demonstrativos ficam identificados e depois das bases reais", () => {
    const demo = pigment("A-DEMO", [behavior("FRONT", "Amarelo"), behavior("ANGLE", "Azul")], {
      isDemo: true,
    });
    const real = pigment("Z-REAL", [behavior("FRONT", "Amarelo"), behavior("ANGLE", "Azul")]);
    const { complete } = ask(VIDEO, [demo, real]);
    expect(complete.map((m) => [m.pigment.code, m.pigment.isDemo])).toEqual([
      ["Z-REAL", false],
      ["A-DEMO", true],
    ]);
  });

  it("não gera dose, quantidade nem percentual", () => {
    const result = ask(VIDEO, catalogRecords());
    const text = JSON.stringify(result);
    expect(text).not.toMatch(/dose|gramsPer100g|suggestedAmount|addedAmount|confian/i);
    expect(text).not.toMatch(/\d+(,\d+)?\s?(g|%)\b/);
  });
});
