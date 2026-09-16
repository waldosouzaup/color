import { describe, expect, it } from "vitest";
import { lazzurilFullCatalog } from "../domain/colorimetry/lazzuril-catalog";
import { characteristics } from "../domain/colorimetry/types";
import type { PigmentCharacteristic } from "../domain/colorimetry/types";

/**
 * A tabela da Sherwin-Williams descreve **comportamento óptico** ("ângulo
 * azulado", "amarelo óxido sujo"). A `characteristic` do domínio é outra coisa:
 * é a **função de corte** do método, e ela decide quais bases o formulário de
 * adição oferece para cada correção. Confundir as duas coloca a base errada na
 * frente do profissional, então o vínculo só existe quando o pigmento é mesmo
 * daquela função.
 */
const esperado: Record<PigmentCharacteristic, RegExp> = {
  // Azul esverdeado e azul avermelhado são azuis.
  BLUE_GREEN: /azul/i,
  RED_BLUE: /azul/i,
  // Amarelo limão.
  LEMON_YELLOW: /amarelo/i,
  // Óxido vermelho.
  RED_OXIDE: /(óxido|oxido).*(vermelho|ferro)|vermelho.*(óxido|oxido)/i,
  VIOLET: /violeta/i,
  RED_SUPPORT: /vermelh/i,
};

describe("catálogo Lazzuril × funções de corte do método", () => {
  it("só usa características declaradas no domínio", () => {
    for (const base of lazzurilFullCatalog)
      if (base.characteristic)
        expect(characteristics).toContain(base.characteristic);
  });

  it("cada base vinculada é coerente com a função de corte", () => {
    for (const base of lazzurilFullCatalog) {
      if (!base.characteristic) continue;
      expect(
        base.name,
        `${base.name} (${base.code}) foi vinculada a ${base.characteristic}`,
      ).toMatch(esperado[base.characteristic]);
    }
  });

  it("um vermelho de ângulo azulado não vira azul avermelhado", () => {
    // Regressão: "Vermelho Rubi" tem ângulo azulado, mas RED_BLUE é o azul
    // avermelhado que corta amarelo esverdeado e vermelho amarelado.
    for (const nome of ["Vermelho Rubi"]) {
      for (const base of lazzurilFullCatalog.filter((b) => b.name === nome))
        expect(base.characteristic).toBeUndefined();
    }
    // "Ocre" é amarelo óxido; o método não tem identificador para ele.
    expect(
      lazzurilFullCatalog.find((b) => b.name === "Ocre")?.characteristic,
    ).toBeUndefined();
  });

  it("registra a cobertura atual de bases por função de corte", () => {
    const cobertura = Object.fromEntries(
      characteristics.map((c) => [
        c,
        lazzurilFullCatalog.filter((b) => b.characteristic === c).length,
      ]),
    ) as Record<PigmentCharacteristic, number>;

    expect(cobertura.BLUE_GREEN).toBeGreaterThan(0);
    expect(cobertura.RED_BLUE).toBeGreaterThan(0);
    expect(cobertura.LEMON_YELLOW).toBeGreaterThan(0);
    expect(cobertura.RED_OXIDE).toBeGreaterThan(0);
    expect(cobertura.VIOLET).toBeGreaterThan(0);
    // Lacuna conhecida: a tabela não traz uma base específica de suporte
    // vermelho. A adição de suporte continua sendo registrada manualmente.
    // Alterar este número é decisão deliberada, não ajuste de teste.
    expect(cobertura.RED_SUPPORT).toBe(0);
  });
});
