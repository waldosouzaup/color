import { describe, expect, it } from "vitest";
import { resolveCorrection } from "../domain/colorimetry/correction-engine";
import { calculateCorrectionDose } from "../domain/colorimetry/dosage-engine";
import { normalizeWeights, sumMass } from "../domain/colorimetry/weights";
import type { CalibrationCoefficient } from "../domain/colorimetry/types";
describe("Método do Mestre", () => {
  it.each([
    ["YELLOW", "REDISH", ["BLUE_GREEN"]],
    ["YELLOW", "GREENISH", ["RED_BLUE", "VIOLET"]],
    ["BLUE", "REDISH", ["LEMON_YELLOW"]],
    ["BLUE", "GREENISH", ["RED_OXIDE", "VIOLET"]],
    ["GREEN", "YELLOWISH", ["VIOLET", "RED_SUPPORT"]],
    ["GREEN", "BLUISH", ["VIOLET", "RED_OXIDE"]],
    ["RED", "BLUISH", ["LEMON_YELLOW"]],
    ["RED", "YELLOWISH", ["RED_BLUE", "VIOLET"]],
  ])("%s + %s", (mainTone, direction, expected) =>
    expect(
      resolveCorrection({ mainTone, direction }).outputs.map(
        (o) => o.pigmentCharacteristic,
      ),
    ).toEqual(expected),
  );
  it.each([
    ["BLUE", "YELLOWISH"],
    ["YELLOW", "BLUISH"],
    ["GREEN", "REDISH"],
    ["RED", "GREENISH"],
    ["invalid", "BLUISH"],
  ])("rejeita %s + %s", (mainTone, direction) =>
    expect(() => resolveCorrection({ mainTone, direction })).toThrow(),
  );
  it("distingue alternativas, combinação e suporte", () => {
    expect(
      resolveCorrection({
        mainTone: "GREEN",
        direction: "BLUISH",
      }).outputs.every((o) => o.role === "COMBINED" && o.required),
    ).toBe(true);
    expect(
      resolveCorrection({ mainTone: "GREEN", direction: "YELLOWISH" })
        .outputs[1].required,
    ).toBe(false);
  });
});
// Fixture somente matemática. Não é gravada no banco nem oferecida ao profissional.
const coefficient: CalibrationCoefficient = {
  id: "math-only",
  status: "VERIFIED",
  active: true,
  gramsPer100g: "0.20",
  precision: 2,
  approvedBy: "test",
  approvedAt: "2026-01-01",
  sampleSize: 1,
  isDemo: false,
};
describe("dosagem calibrada", () => {
  it.each([
    ["500", "1.00"],
    ["250", "0.50"],
  ])("%s g → %s g", (mass, expected) =>
    expect(
      calculateCorrectionDose({ currentBatchMassG: mass, coefficient })
        ?.suggestedAmountG,
    ).toBe(expected),
  );
  it.each(["DRAFT", "TESTING", "RETIRED"] as const)("bloqueia %s", (status) =>
    expect(
      calculateCorrectionDose({
        currentBatchMassG: "500",
        coefficient: { ...coefficient, status },
      }),
    ).toBeNull(),
  );
  it("bloqueia demo, sem aprovação, fora do limite e sem coeficiente", () => {
    for (const c of [
      null,
      { ...coefficient, isDemo: true },
      { ...coefficient, approvedBy: null },
      { ...coefficient, maximumSuggestedG: "0.5" },
    ])
      expect(
        calculateCorrectionDose({ currentBatchMassG: "500", coefficient: c }),
      ).toBeNull();
  });
});
describe("pesagem decimal", () => {
  it("converte acumulado explicitamente", () =>
    expect(normalizeWeights(["100", "145", "162.5"], "CUMULATIVE")).toEqual([
      "100.0000",
      "45.0000",
      "17.5000",
    ]));
  it("rejeita acumulado decrescente", () =>
    expect(() => normalizeWeights(["100", "99"], "CUMULATIVE")).toThrow());
  it("mantém as duas adições e a massa exata", () => {
    const additions = ["1.00"];
    expect(sumMass("500", additions)).toBe("501.0000");
    additions.push("0.50");
    expect(sumMass("500", additions)).toBe("501.5000");
    expect(additions).toHaveLength(2);
    expect(sumMass("0.1", ["0.2"])).toBe("0.3000");
  });
});
