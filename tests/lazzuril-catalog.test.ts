import { describe, expect, it } from "vitest";
import {
  lazzurilFullCatalog,
  lazzurilPolyesterCatalog,
  lazzurilPolyurethaneCatalog,
} from "../domain/colorimetry/lazzuril-catalog";

describe("Catálogo Oficial Lazzuril / Sherwin-Williams (05.jpeg)", () => {
  it("contém exatamente as 82 bases transcritas da tabela de referência", () => {
    expect(lazzurilFullCatalog).toHaveLength(82);
    expect(lazzurilPolyesterCatalog).toHaveLength(60);
    expect(lazzurilPolyurethaneCatalog).toHaveLength(22);
  });

  describe("Sistema Poliéster (60 bases)", () => {
    it("todas as bases de poliéster têm registros separados de Frente e Ângulo", () => {
      for (const base of lazzurilPolyesterCatalog) {
        expect(base.systemType).toBe("Poliéster");
        expect(base.behaviors).toHaveLength(2);
        const front = base.behaviors.find((b) => b.view === "FRONT");
        const angle = base.behaviors.find((b) => b.view === "ANGLE");
        expect(front, `Base ${base.code} sem comportamento FRONT`).toBeDefined();
        expect(angle, `Base ${base.code} sem comportamento ANGLE`).toBeDefined();
        expect(front?.hueCharacteristic?.length).toBeGreaterThan(0);
        expect(angle?.hueCharacteristic?.length).toBeGreaterThan(0);
        expect(front?.source).toBe("Sherwin-Williams / Lazzuril");
        expect(angle?.source).toBe("Sherwin-Williams / Lazzuril");
      }
    });

    it("Vermelho Rubi (HS 717 / LM 417) diferencia frente limpa e ângulo azulado", () => {
      const rubi = lazzurilPolyesterCatalog.find(
        (b) => b.name === "Vermelho Rubi" && b.code === "HS 717 / LM 417",
      );
      expect(rubi).toBeDefined();
      expect(rubi?.family).toBe("Lisas");
      // Ângulo azulado descreve o comportamento óptico da base, não a função de
      // corte: `RED_BLUE` é o azul avermelhado do método.
      expect(rubi?.characteristic).toBeUndefined();
      const front = rubi?.behaviors.find((b) => b.view === "FRONT");
      const angle = rubi?.behaviors.find((b) => b.view === "ANGLE");
      expect(front?.hueCharacteristic).toBe("Vermelho limpo");
      expect(angle?.hueCharacteristic).toBe("Azulado");
    });

    it("diferencia claramente comportamentos opostos entre os diferentes alumínios", () => {
      const aluminioMedio = lazzurilPolyesterCatalog.find(
        (b) => b.name === "Alumínio Médio" && b.code === "LM 451",
      );
      const aluminioGraudo = lazzurilPolyesterCatalog.find(
        (b) => b.name === "Alumínio Médio Graúdo" && b.code === "LM 453",
      );
      const aluminioSuperFino = lazzurilPolyesterCatalog.find(
        (b) => b.name === "Alumínio Super Fino" && b.code === "HS 757 / LM 457",
      );

      expect(aluminioMedio?.behaviors.find((b) => b.view === "FRONT")?.hueCharacteristic).toBe("Sujo");
      expect(aluminioMedio?.behaviors.find((b) => b.view === "ANGLE")?.hueCharacteristic).toBe("Claro");

      expect(aluminioGraudo?.behaviors.find((b) => b.view === "FRONT")?.hueCharacteristic).toBe("Claro");
      expect(aluminioGraudo?.behaviors.find((b) => b.view === "ANGLE")?.hueCharacteristic).toBe("Escuro");

      expect(aluminioSuperFino?.behaviors.find((b) => b.view === "FRONT")?.hueCharacteristic).toBe("Escuro / sujo");
      expect(aluminioSuperFino?.behaviors.find((b) => b.view === "ANGLE")?.hueCharacteristic).toBe("Claro leitoso");
    });

    it("Pérola Violeta Graúda (HS 772 / LM 472) registra o efeito de flip frente verde e ângulo vermelho", () => {
      const perola = lazzurilPolyesterCatalog.find(
        (b) => b.name === "Pérola Violeta Graúda" && b.code === "HS 772 / LM 472",
      );
      expect(perola).toBeDefined();
      expect(perola?.family).toBe("Pérola");
      expect(perola?.behaviors.find((b) => b.view === "FRONT")?.hueCharacteristic).toBe("Verde");
      expect(perola?.behaviors.find((b) => b.view === "ANGLE")?.hueCharacteristic).toBe("Vermelho");
    });

    it("Aditivo para Efeito Metálico (AD 500) é catalogado na família Aditivo", () => {
      const aditivo = lazzurilPolyesterCatalog.find((b) => b.code === "AD 500");
      expect(aditivo).toBeDefined();
      expect(aditivo?.family).toBe("Aditivo");
      expect(aditivo?.behaviors.find((b) => b.view === "FRONT")?.hueCharacteristic).toBe(
        "Aumentar a aparência da partícula",
      );
    });

    it("possui as famílias de efeitos estruturadas", () => {
      const aluminios = lazzurilPolyesterCatalog.filter((b) => b.family === "Alumínio");
      const perolas = lazzurilPolyesterCatalog.filter((b) => b.family === "Pérola");
      const lisas = lazzurilPolyesterCatalog.filter((b) => b.family === "Lisas");
      const efeito = lazzurilPolyesterCatalog.filter((b) => b.family === "Efeito");
      const aditivo = lazzurilPolyesterCatalog.filter((b) => b.family === "Aditivo");

      expect(aluminios).toHaveLength(10);
      expect(perolas).toHaveLength(15);
      expect(lisas).toHaveLength(33);
      expect(efeito).toHaveLength(1);
      expect(aditivo).toHaveLength(1);
      expect(aluminios.length + perolas.length + lisas.length + efeito.length + aditivo.length).toBe(60);
    });
  });

  describe("Sistema Poliuretano (22 bases)", () => {
    it("todas as bases de PU possuem comportamento GENERAL preenchido", () => {
      for (const base of lazzurilPolyurethaneCatalog) {
        expect(base.systemType).toBe("Poliuretano");
        expect(base.family).toBe("Lisas");
        expect(base.behaviors).toHaveLength(1);
        const general = base.behaviors.find((b) => b.view === "GENERAL");
        expect(general, `Base ${base.code} sem comportamento GENERAL`).toBeDefined();
        expect(general?.hueCharacteristic?.length).toBeGreaterThan(0);
        expect(general?.source).toBe("Sherwin-Williams / Lazzuril");
      }
    });

    it("mantém os códigos múltiplos correlacionados por entrada", () => {
      const pretoPU = lazzurilPolyurethaneCatalog.find((b) => b.name === "Preto");
      expect(pretoPU?.code).toBe("LP 501 / LL 112 / LS 201 / FC 601");
      expect(pretoPU?.behaviors[0].hueCharacteristic).toBe("Escurece");

      const brancoPU = lazzurilPolyurethaneCatalog.find((b) => b.name === "Branco");
      expect(brancoPU?.code).toBe("LP 550 / LL 130 / LS 250 / FC 650");
      expect(brancoPU?.behaviors[0].hueCharacteristic).toBe("Clarear");

      const cromoPU = lazzurilPolyurethaneCatalog.find((b) => b.name === "Amarelo Cromo");
      expect(cromoPU?.code).toBe("LP 503 / LL 133 / LS 203 / FC 603");
      expect(cromoPU?.behaviors[0].hueCharacteristic).toBe("Amarelado esverdeado");
    });
  });

  describe("Busca e integridade dos códigos", () => {
    it("permite localizar bases por qualquer código individual", () => {
      const match717 = lazzurilFullCatalog.filter((b) => b.code.includes("717"));
      expect(match717.map((b) => b.name)).toEqual(["Vermelho Rubi"]);

      const match517 = lazzurilFullCatalog.filter((b) => b.code.includes("517"));
      expect(match517.map((b) => b.name)).toEqual(["Laranja"]);

      const match451 = lazzurilFullCatalog.find((b) => b.code.includes("LM 451"));
      expect(match451?.name).toBe("Alumínio Médio");

      const matchFC601 = lazzurilFullCatalog.find((b) => b.code.includes("FC 601"));
      expect(matchFC601?.name).toBe("Preto");
      expect(matchFC601?.systemType).toBe("Poliuretano");
    });
  });
});
