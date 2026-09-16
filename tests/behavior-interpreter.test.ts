import { describe, expect, it } from "vitest";
import {
  applyCondition,
  interpretBehaviorQuestion,
} from "../domain/colorimetry/behavior-interpreter";
import { criteriaIssues, emptyCriteria } from "../domain/colorimetry/behavior-criteria";

const kinds = (question: string) =>
  interpretBehaviorQuestion(question).issues.map((i) => i.kind);

describe("consultor de comportamento: interpretação da pergunta", () => {
  it.each([
    "Preciso de um pigmento que amarele a frente e deixe o ângulo azul",
    // Transcrição literal da fala no vídeo.
    "preciso de um pigmento que amarelo a frente e deixe o angulo azul",
    "Amarelar a frente e azular o ângulo.",
    "Frente amarelada e ângulo azulado.",
    "Quero o ângulo azul e a frente amarela.",
    "amarelado na frente, azulado no ângulo",
    "na frente, amarelo; no ângulo, azul",
    "frente amarelada angulo azulado",
    "na frente amarelo no angulo azul",
    "amarelo na frente azul no angulo",
    "PRECISO   DE UM PIGMENTO QUE AMARELE A FRENTE   E DEIXE O ANGULO AZUL",
  ])("associa cada condição à sua vista: %s", (question) => {
    const result = interpretBehaviorQuestion(question);
    expect(result.status).toBe("READY");
    expect(result.criteria.FRONT.hue).toBe("YELLOW");
    expect(result.criteria.ANGLE.hue).toBe("BLUE");
    expect(result.summary).toBe("Frente: amarelar · Ângulo: azular");
  });

  it("não troca as vistas quando a frase inverte as cores", () => {
    const result = interpretBehaviorQuestion("Quero o ângulo amarelo e a frente azul");
    expect(result.criteria.FRONT.hue).toBe("BLUE");
    expect(result.criteria.ANGLE.hue).toBe("YELLOW");
  });

  it("aplica a mesma descrição às duas vistas citadas juntas", () => {
    const { criteria } = interpretBehaviorQuestion("frente e ângulo azulados");
    expect(criteria.FRONT.hue).toBe("BLUE");
    expect(criteria.ANGLE.hue).toBe("BLUE");
  });

  it("preserva limpo, sujo, leitoso e a negação na vista certa", () => {
    const dirty = interpretBehaviorQuestion(
      "amarelado sujo na frente e azulado leitoso no ângulo",
    ).criteria;
    expect(dirty.FRONT).toMatchObject({ hue: "YELLOW", require: ["DIRTY"], exclude: [] });
    expect(dirty.ANGLE).toMatchObject({ hue: "BLUE", require: ["MILKY"], exclude: [] });

    const clean = interpretBehaviorQuestion(
      "frente amarela limpa e ângulo azul sem efeito leitoso",
    ).criteria;
    expect(clean.FRONT).toMatchObject({ hue: "YELLOW", require: ["CLEAN"] });
    expect(clean.ANGLE).toMatchObject({ hue: "BLUE", require: [], exclude: ["MILKY"] });
  });

  it("mantém qualificador após 'e' ligado à vista anterior", () => {
    const { criteria } = interpretBehaviorQuestion(
      "quero que a frente fique amarela e limpa e o ângulo azulado sem leitoso",
    );
    expect(criteria.FRONT.require).toEqual(["CLEAN"]);
    expect(criteria.ANGLE.exclude).toEqual(["MILKY"]);
  });

  it("reconhece claro, escuro, transparente e partículas documentadas", () => {
    const light = interpretBehaviorQuestion("frente clara e ângulo escuro").criteria;
    expect(light.FRONT.require).toEqual(["LIGHT"]);
    expect(light.ANGLE.require).toEqual(["DARK"]);
    expect(interpretBehaviorQuestion("ângulo transparente").criteria.ANGLE.require).toEqual([
      "TRANSPARENT",
    ]);
    expect(
      interpretBehaviorQuestion("aumentar a aparência da partícula no ângulo").criteria.ANGLE
        .require,
    ).toEqual(["PARTICLE_VISIBLE"]);
    expect(
      interpretBehaviorQuestion("frente com partícula fina e brilhante").criteria.FRONT.require,
    ).toEqual(["FINE", "BRIGHT"]);
  });

  it("trata negações explicitamente", () => {
    expect(
      interpretBehaviorQuestion("a frente não pode ficar suja").criteria.FRONT.exclude,
    ).toEqual(["DIRTY"]);
    expect(
      interpretBehaviorQuestion("não quero o ângulo leitoso").criteria.ANGLE,
    ).toMatchObject({ require: [], exclude: ["MILKY"] });
    expect(
      interpretBehaviorQuestion("frente sem leitoso nem sujo").criteria.FRONT.exclude,
    ).toEqual(["MILKY", "DIRTY"]);
    expect(interpretBehaviorQuestion("ângulo sem amarelar").criteria.ANGLE).toMatchObject({
      hue: null,
      avoidHues: ["YELLOW"],
    });
  });

  it("separa matiz principal de tendência", () => {
    expect(
      interpretBehaviorQuestion("frente amarelo esverdeado e ângulo azulado").criteria.FRONT,
    ).toMatchObject({ hue: "YELLOW", tendency: "GREEN" });
    expect(
      interpretBehaviorQuestion("ângulo azul puxando pro verde").criteria.ANGLE,
    ).toMatchObject({ hue: "BLUE", tendency: "GREEN" });
  });

  it("não trata observação da tinta como efeito desejado", () => {
    const observed = interpretBehaviorQuestion("Minha tinta está amarela de frente");
    expect(observed.status).toBe("NEEDS_CONFIRMATION");
    expect(observed.hasObservation).toBe(true);
    expect(kinds("Minha tinta está amarela de frente")).toContain("OBSERVATION");
    expect(kinds("a cor ficou azulada no ângulo")).toContain("OBSERVATION");
    expect(kinds("a tinta amarelou na frente")).toContain("OBSERVATION");

    const mixed = interpretBehaviorQuestion(
      "minha tinta está amarela de frente, preciso de algo que deixe o ângulo azul",
    );
    expect(mixed.status).toBe("NEEDS_CONFIRMATION");
    expect(mixed.criteria.FRONT.hue).toBe("YELLOW");
    // O que foi pedido de fato fica separado do que foi observado.
    expect(mixed.desiredCriteria.FRONT.hue).toBeNull();
    expect(mixed.desiredCriteria.ANGLE.hue).toBe("BLUE");

    expect(
      interpretBehaviorQuestion("preciso de um pigmento para minha tinta que amarele a frente")
        .status,
    ).toBe("READY");
  });

  it("pede a vista quando o comportamento não tem frente nem ângulo", () => {
    const result = interpretBehaviorQuestion("quero um pigmento amarelo");
    expect(result.status).toBe("NEEDS_CONFIRMATION");
    expect(result.unassigned).toHaveLength(1);
    expect(kinds("quero um pigmento amarelo")).toEqual(["UNASSIGNED"]);
    const applied = applyCondition(emptyCriteria(), result.unassigned[0], "FRONT");
    expect(applied.FRONT.hue).toBe("YELLOW");
    expect(applied.ANGLE.hue).toBeNull();
  });

  it("pede confirmação para condições conflitantes ou alternativas", () => {
    const conflict = interpretBehaviorQuestion("frente limpa e suja");
    expect(conflict.status).toBe("NEEDS_CONFIRMATION");
    expect(criteriaIssues(conflict.criteria)).toHaveLength(1);
    expect(kinds("frente amarela azul no ângulo")).toContain("CONFLICT");
    expect(kinds("frente limpa ou clara")).toContain("ALTERNATIVE");
  });

  it("informa quando nada foi reconhecido", () => {
    expect(interpretBehaviorQuestion("olá, tudo bem?").status).toBe("NOTHING_RECOGNIZED");
    expect(interpretBehaviorQuestion("").status).toBe("NOTHING_RECOGNIZED");
  });

  it("avisa, sem bloquear, quando uma vista é citada sem comportamento", () => {
    const result = interpretBehaviorQuestion("amarele a frente sem mexer no ângulo");
    expect(result.status).toBe("READY");
    expect(result.issues).toEqual([
      expect.objectContaining({ kind: "VIEW_WITHOUT_BEHAVIOR", blocking: false }),
    ]);
  });
});
