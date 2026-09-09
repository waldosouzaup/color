import { z } from "zod";
import {
  characteristics,
  paintTypes,
  severities,
  primaryTones,
  toneDirections,
} from "../domain/colorimetry/types";
import { diagnosisSchema } from "../domain/colorimetry/validation";
const text = z.string().trim().max(2000);
const short = z.string().trim().min(1, "Preencha este campo.").max(160);
export const mass = z
  .string()
  .regex(
    /^\d{1,10}(\.\d{1,4})?$/,
    "Use peso positivo com até quatro casas decimais.",
  )
  .refine((v) => Number(v) > 0, "O peso deve ser maior que zero.");
const optionalMass = z.union([mass, z.literal("")]).optional();
export const formulaSchema = z.object({
  manufacturer: short,
  model: short,
  year: z.string().regex(/^(19|20|21)\d{2}$/, "Informe um ano válido."),
  colorCode: short,
  description: short,
  paintSystem: short,
  paintType: z.enum(paintTypes),
  paintManufacturer: short,
  productLine: short,
  desiredMassG: mass,
  source: z.enum([
    "OFFICIAL_SYSTEM",
    "MANUAL_ENTRY",
    "CUSTOM_FORMULA",
    "SAVED_COLOR_BANK",
    "OTHER",
  ]),
  weightMode: z.enum(["INDIVIDUAL", "CUMULATIVE"]),
  notes: text.default(""),
  isDemo: z.boolean().default(false),
  components: z
    .array(
      z.object({
        pigmentId: z.string().optional(),
        code: short,
        name: short,
        weightG: mass,
        notes: text.default(""),
      }),
    )
    .min(1)
    .max(100),
});
export const lightingSchema = z.enum([
  "SUNLIGHT",
  "LED",
  "BOOTH",
  "FLUORESCENT",
  "INCANDESCENT",
  "OTHER",
]);
export const correctionSchema = z.object({
  sessionId: short,
  expectedVersion: z.number().int().positive(),
  diagnosis: diagnosisSchema,
  severity: z.enum(severities),
  view: z.literal("ANGLE"),
  lightingCondition: lightingSchema,
  frontNotes: text.default(""),
  notes: text.default(""),
  additions: z
    .array(
      z.object({
        pigmentId: z.string().optional(),
        code: short,
        name: short,
        characteristic: z.enum(characteristics),
        addedAmountG: mass,
      }),
    )
    .min(1)
    .max(6),
});
export const panelSchema = z.object({
  sessionId: short,
  expectedVersion: z.number().int().positive(),
  notes: text.default(""),
  clearCoatApplied: z.boolean(),
  image: z.string().max(2800000).optional(),
  application: z.object({
    dilution: text.optional(),
    pressure: text.optional(),
    sprayDistance: text.optional(),
    numberOfCoats: z.number().int().min(1).max(30).optional(),
    wetOrDry: text.optional(),
    temperature: text.optional(),
    humidity: text.optional(),
    gunModel: text.optional(),
    nozzle: text.optional(),
    thinner: text.optional(),
    primerColor: text.optional(),
    notes: text.default(""),
  }),
});
export const approvalSchema = z.object({
  sessionId: short,
  expectedVersion: z.number().int().positive(),
  angleConfirmed: z.literal(true),
  frontConfirmed: z.literal(true),
  lightingCondition: lightingSchema,
  angleNotes: short,
  frontNotes: short,
  notes: text.default(""),
});
export const pigmentSchema = z.object({
  id: z.string().optional(),
  manufacturer: short,
  productLine: short,
  code: short,
  name: short,
  systemType: short,
  family: short,
  direction: text.default(""),
  characteristic: z.enum(characteristics).optional(),
  description: text.default(""),
  notes: text.default(""),
  isDemo: z.boolean().default(false),
  active: z.boolean().default(true),
  behaviors: z
    .array(
      z.object({
        view: z.enum(["ANGLE", "FRONT", "GENERAL"]),
        hueCharacteristic: text.default(""),
        lightnessEffect: text.default(""),
        cleanlinessEffect: text.default(""),
        particleEffect: text.default(""),
        notes: text.default(""),
        source: short,
        sourceReference: short,
      }),
    )
    .max(10)
    .default([]),
  reason: short,
});
export const coefficientSchema = z
  .object({
    previousVersionId: z.string().optional(),
    correctionRuleId: short,
    pigmentId: z.string().optional(),
    paintSystem: short,
    paintType: z.enum(paintTypes),
    severity: z.enum(severities),
    gramsPer100g: z
      .string()
      .regex(/^\d{1,6}(\.\d{1,6})?$/)
      .refine((v) => Number(v) > 0),
    minimumSuggestedG: optionalMass,
    maximumSuggestedG: optionalMass,
    precision: z.number().int().min(0).max(4),
    status: z.enum(["DRAFT", "TESTING", "VERIFIED", "RETIRED"]),
    source: short,
    sampleSize: z.number().int().min(0),
    notes: text.default(""),
    reason: short,
    isDemo: z.boolean().default(false),
  })
  .refine(
    (v) => v.status !== "VERIFIED" || (v.sampleSize > 0 && !v.isDemo),
    "Verificação exige amostras e dados não demonstrativos.",
  )
  .refine(
    (v) =>
      !v.minimumSuggestedG ||
      !v.maximumSuggestedG ||
      Number(v.minimumSuggestedG) <= Number(v.maximumSuggestedG),
    "Limite mínimo maior que máximo.",
  );
export const outputSchema = z.object({
  pigmentCharacteristic: z.enum(characteristics),
  role: z.enum(["PRIMARY", "ALTERNATIVE", "COMBINED", "SUPPORT"]),
  order: z.number().int().positive(),
  required: z.boolean(),
  notes: text,
});
export const ruleSchema = z
  .object({
    baseId: short,
    mainTone: z.enum(primaryTones),
    direction: z.enum(toneDirections),
    diagnosisLabel: short,
    notes: short,
    source: short,
    active: z.boolean(),
    outputs: z.array(outputSchema).min(1).max(6),
    reason: short,
  })
  .refine(
    (v) => diagnosisSchema.safeParse(v).success,
    "Combinação de tom e direção inválida.",
  );
export const userSchema = z.object({
  name: short,
  email: z.email(),
  password: z.string().min(12).max(128),
  role: z.enum(["ADMIN", "PROFESSIONAL"]),
});
export const settingsSchema = z.object({
  name: short,
  precision: z.number().int().min(0).max(4),
  officialLinks: z
    .array(
      z.object({
        label: short,
        url: z
          .url()
          .refine(
            (v) => new URL(v).protocol === "https:",
            "Use um endereço HTTPS.",
          ),
      }),
    )
    .max(10),
});
