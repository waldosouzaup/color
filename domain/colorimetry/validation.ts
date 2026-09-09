import { z } from "zod";
import { primaryTones, toneDirections } from "./types";
import { validDirections } from "./tones";
export const diagnosisSchema = z
  .object({ mainTone: z.enum(primaryTones), direction: z.enum(toneDirections) })
  .refine((v) => validDirections[v.mainTone].includes(v.direction), {
    message: "Subtom inválido para o tom principal.",
    path: ["direction"],
  });
