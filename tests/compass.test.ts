import { describe, expect, it } from "vitest";
import {
  SECTOR_COUNT,
  SECTOR_SPAN,
  angleOfPoint,
  annularSectorPath,
  compassRatios,
  compassSectors,
  directionSectors,
  layout,
  normalizeAngle,
  polarToCartesian,
  sectorAt,
  sectorFor,
  sectorIndexAt,
  shortestAngleDelta,
  toneSectors,
} from "../domain/compass/geometry";
import { sectorArtwork } from "../domain/compass/artwork";
import {
  canUseInAdjustment,
  describeOutputs,
  findRule,
  resolveSelection,
  selectionSummary,
  usesDocumentedOutputs,
} from "../domain/compass/selection";
import { initialRules } from "../domain/colorimetry/correction-engine";
import { toneLabels, directionLabels } from "../domain/colorimetry/tones";
import type { CorrectionRule } from "../domain/colorimetry/types";

describe("geometria dos doze setores", () => {
  it("tem doze setores de 30°, quatro tons e oito direções", () => {
    expect(compassSectors).toHaveLength(SECTOR_COUNT);
    expect(SECTOR_SPAN).toBe(30);
    expect(toneSectors).toHaveLength(4);
    expect(directionSectors).toHaveLength(8);
  });

  it("segue a sequência da referência, com o tom entre seus dois subtons", () => {
    expect(
      compassSectors.map((s) => [s.center, s.ruleKey ?? s.mainTone]),
    ).toEqual([
      [15, "YELLOW"],
      [45, "YELLOW:REDISH"],
      [75, "BLUE:REDISH"],
      [105, "BLUE"],
      [135, "BLUE:GREENISH"],
      [165, "RED:YELLOWISH"],
      [195, "RED"],
      [225, "RED:BLUISH"],
      [255, "GREEN:BLUISH"],
      [285, "GREEN"],
      [315, "GREEN:YELLOWISH"],
      [345, "YELLOW:GREENISH"],
    ]);
  });

  it("mantém as oito chaves operacionais exatamente uma vez", () => {
    const keys = directionSectors.map((s) => s.ruleKey);
    expect(new Set(keys).size).toBe(8);
    expect(keys.sort()).toEqual(
      initialRules.map((r) => `${r.mainTone}:${r.direction}`).sort(),
    );
  });

  it("cada tom fundamental fica entre seus dois subtons no anel", () => {
    for (const tone of toneSectors) {
      const before = compassSectors[(tone.index + 11) % SECTOR_COUNT];
      const after = compassSectors[(tone.index + 1) % SECTOR_COUNT];
      expect(before.mainTone).toBe(tone.mainTone);
      expect(after.mainTone).toBe(tone.mainTone);
      expect(before.direction).not.toBe(after.direction);
    }
  });

  it("identifica o setor no centro e dos dois lados de cada fronteira", () => {
    for (const sector of compassSectors) {
      expect(sectorAt(sector.center).index).toBe(sector.index);
      expect(sectorAt(sector.start + 0.01).index).toBe(sector.index);
      expect(sectorAt(sector.end - 0.01).index).toBe(sector.index);
      // O limite pertence ao setor que começa nele.
      expect(sectorAt(sector.end).index).toBe((sector.index + 1) % SECTOR_COUNT);
    }
  });

  it("trata 0°, 360°, ângulos negativos e voltas completas", () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(360)).toBe(0);
    expect(normalizeAngle(-1)).toBe(359);
    expect(normalizeAngle(-360 * 3 + 15)).toBe(15);
    expect(sectorIndexAt(359.999)).toBe(11);
    expect(sectorIndexAt(-15)).toBe(11);
    expect(sectorIndexAt(720 + 45)).toBe(1);
    expect(sectorAt(0).index).toBe(0);
  });

  it("usa o menor caminho circular", () => {
    expect(shortestAngleDelta(345, 15)).toBe(30);
    expect(shortestAngleDelta(15, 345)).toBe(-30);
    expect(shortestAngleDelta(0, 180)).toBe(180);
    expect(Math.abs(shortestAngleDelta(350, 170))).toBeLessThanOrEqual(180);
  });

  it("converte polar e volta ao mesmo ângulo", () => {
    for (const sector of compassSectors) {
      const point = polarToCartesian(500, 500, 300, sector.center);
      expect(angleOfPoint(500, 500, point.x, point.y)).toBeCloseTo(
        sector.center,
        6,
      );
      expect(sectorAt(angleOfPoint(500, 500, point.x, point.y)).index).toBe(
        sector.index,
      );
    }
    // 0° no topo: y menor que o centro.
    expect(polarToCartesian(500, 500, 100, 0).y).toBeCloseTo(400, 6);
    expect(polarToCartesian(500, 500, 100, 90).x).toBeCloseTo(600, 6);
  });

  it("posiciona esferas e rótulos dentro do próprio setor e da própria banda", () => {
    const geometry = layout(500, 500, 468);
    for (const sector of compassSectors) {
      const sphere =
        sector.kind === "TONE"
          ? compassRatios.toneSphere
          : compassRatios.directionSphere;
      const center = polarToCartesian(
        500,
        500,
        468 * sphere.distance,
        sector.center,
      );
      const distance = Math.hypot(center.x - 500, center.y - 500);
      // Esfera inteira dentro da banda externa.
      expect(distance - 468 * sphere.radius).toBeGreaterThan(geometry.innerRing);
      expect(distance + 468 * sphere.radius).toBeLessThan(468);
      expect(sectorAt(angleOfPoint(500, 500, center.x, center.y)).index).toBe(
        sector.index,
      );
    }
  });

  it("mantém os pigmentos da arte dentro da banda interna", () => {
    const geometry = layout(500, 500, 468);
    for (const [key, art] of Object.entries(sectorArtwork)) {
      const sector = compassSectors.find((s) => s.ruleKey === key)!;
      const distances =
        art.pigments.length > 2
          ? compassRatios.artSphere.distances
          : compassRatios.artSphere.pair;
      expect(distances.length).toBeGreaterThanOrEqual(art.pigments.length);
      art.pigments.forEach((_, index) => {
        const at = polarToCartesian(
          500,
          500,
          468 * distances[index],
          sector.center,
        );
        const distance = Math.hypot(at.x - 500, at.y - 500);
        expect(distance).toBeLessThan(geometry.innerRing);
        expect(distance).toBeGreaterThan(geometry.pivot);
      });
    }
  });

  it("gera setores anelares válidos e recusa varreduras impossíveis", () => {
    expect(annularSectorPath(500, 500, 100, 200, 0, 30)).toMatch(/^M .+ Z$/);
    expect(() => annularSectorPath(500, 500, 100, 200, 30, 30)).toThrow();
    expect(() => annularSectorPath(500, 500, 100, 200, 0, 360)).toThrow();
    expect(() => normalizeAngle(Number.NaN)).toThrow();
  });

  it("encontra o setor de uma seleção de família ou de subtom", () => {
    expect(sectorFor("GREEN", null)?.center).toBe(285);
    expect(sectorFor("GREEN", "BLUISH")?.center).toBe(255);
    expect(sectorFor("YELLOW", "GREENISH")?.center).toBe(345);
  });
});

const labels = { tone: toneLabels, direction: directionLabels };

describe("seleção e resolução de regra", () => {
  it("tom fundamental seleciona família e não inventa correção", () => {
    const resolution = resolveSelection(initialRules, {
      mainTone: "GREEN",
      direction: null,
    });
    expect(resolution.status).toBe("FAMILY");
    if (resolution.status !== "FAMILY") throw new Error("status inesperado");
    expect(resolution.directions).toEqual(["YELLOWISH", "BLUISH"]);
    expect(canUseInAdjustment(resolution)).toBe(false);
    expect(selectionSummary(resolution, labels)).toContain("Escolha o subtom");
  });

  it("subtom resolve a regra da oficina pela chave semântica", () => {
    const resolution = resolveSelection(initialRules, {
      mainTone: "GREEN",
      direction: "BLUISH",
    });
    if (resolution.status !== "RULE") throw new Error("deveria resolver regra");
    expect(resolution.rule.id).toBe("rule-6");
    expect(canUseInAdjustment(resolution)).toBe(true);
  });

  it("lista vazia e par ausente não viram seleção válida", () => {
    expect(
      resolveSelection([], { mainTone: "RED", direction: "BLUISH" }).status,
    ).toBe("MISSING");
    const semVerde = initialRules.filter((r) => r.mainTone !== "GREEN");
    const resolution = resolveSelection(semVerde, {
      mainTone: "GREEN",
      direction: "BLUISH",
    });
    expect(resolution.status).toBe("MISSING");
    expect(canUseInAdjustment(resolution)).toBe(false);
    expect(selectionSummary(resolution, labels)).toContain("nenhuma regra ativa");
  });

  it("regra desativada continua consultável, mas não habilita o uso", () => {
    const rules = initialRules.map((r) =>
      r.id === "rule-6" ? { ...r, active: false } : r,
    );
    const resolution = resolveSelection(rules, {
      mainTone: "GREEN",
      direction: "BLUISH",
    });
    if (resolution.status !== "RULE") throw new Error("deveria resolver regra");
    expect(resolution.rule.active).toBe(false);
    expect(canUseInAdjustment(resolution)).toBe(false);
    expect(selectionSummary(resolution, labels)).toContain("desativada");
  });

  it("nova versão da oficina prevalece sobre a regra base", () => {
    const custom: CorrectionRule = {
      ...initialRules[5],
      id: "rule-6-oficina",
      version: 3,
      priority: 200,
      source: "Oficina",
      outputs: [
        { ...initialRules[5].outputs[0], notes: "Versão da oficina" },
        initialRules[5].outputs[1],
      ],
    };
    const chosen = findRule([...initialRules, custom], "GREEN", "BLUISH");
    expect(chosen?.id).toBe("rule-6-oficina");
    // Uma regra inativa nunca ganha da ativa, mesmo com versão maior.
    const inactive = { ...custom, id: "rule-6-morta", version: 9, active: false };
    expect(findRule([inactive, ...initialRules], "GREEN", "BLUISH")?.id).toBe(
      "rule-6",
    );
  });
});

describe("apresentação das saídas", () => {
  const ruleOf = (mainTone: string, direction: string) =>
    initialRules.find(
      (r) => r.mainTone === mainTone && r.direction === direction,
    )!;

  it("Verde azulado exige as duas adições, nesta ordem", () => {
    const description = describeOutputs(ruleOf("GREEN", "BLUISH"));
    expect(description.requirement).toBe("COMBINED");
    expect(description.summary).toBe(
      "Violeta + Óxido vermelho — ambos obrigatórios",
    );
    expect(description.items.map((i) => i.label)).toEqual([
      "Violeta",
      "Óxido vermelho",
    ]);
    expect(description.items.map((i) => i.connector)).toEqual([null, "+"]);
    expect(description.items.every((i) => i.required)).toBe(true);
  });

  it("alternativa exibe “ou” e exige exatamente uma", () => {
    const description = describeOutputs(ruleOf("YELLOW", "GREENISH"));
    expect(description.requirement).toBe("ALTERNATIVE");
    expect(description.summary).toBe(
      "Azul avermelhado ou Violeta — escolha exatamente uma alternativa",
    );
    expect(description.items[1].connector).toBe("ou");
  });

  it("suporte continua opcional e aparece separado do corte principal", () => {
    const description = describeOutputs(ruleOf("GREEN", "YELLOWISH"));
    expect(description.requirement).toBe("PRIMARY");
    expect(description.summary).toBe(
      "Violeta — corte principal · suporte opcional: Suporte vermelho",
    );
    expect(description.support).toBe("Suporte opcional: Suporte vermelho");
    expect(description.items[1].required).toBe(false);
  });

  it("nunca resume a regra à primeira saída", () => {
    for (const rule of initialRules) {
      const description = describeOutputs(rule);
      expect(description.items).toHaveLength(rule.outputs.length);
      for (const output of rule.outputs)
        expect(
          description.items.some(
            (i) => i.output.pigmentCharacteristic === output.pigmentCharacteristic,
          ),
        ).toBe(true);
    }
  });

  it("respeita a ordem declarada mesmo fora de sequência", () => {
    const rule = ruleOf("GREEN", "BLUISH");
    const shuffled = { ...rule, outputs: [...rule.outputs].reverse() };
    expect(describeOutputs(shuffled).items.map((i) => i.label)).toEqual([
      "Violeta",
      "Óxido vermelho",
    ]);
  });

  it("explicação fixa só vale para a matriz documentada", () => {
    const rule = ruleOf("BLUE", "GREENISH");
    expect(usesDocumentedOutputs(rule)).toBe(true);
    const custom: CorrectionRule = {
      ...rule,
      outputs: [{ ...rule.outputs[1], role: "PRIMARY", required: true, order: 1 }],
    };
    expect(usesDocumentedOutputs(custom)).toBe(false);
    expect(describeOutputs(custom).summary).toBe("Violeta — corte principal");
  });
});
