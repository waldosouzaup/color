import { z } from "zod";
export async function action(name: string, data: unknown): Promise<unknown> {
  const response = await fetch("/api/actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: name, data }),
  });
  const body = z
    .object({ error: z.string().optional(), result: z.unknown().optional() })
    .parse(await response.json());
  if (!response.ok) throw new Error(body.error || "Não foi possível salvar.");
  return body.result;
}
export async function mutation(name: string, data: unknown) {
  return z.object({ id: z.string() }).parse(await action(name, data));
}
export const formatMass = (value: string | number, precision = 2) =>
  new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision,
  }).format(Number(value));
export const formatDate = (value: string) =>
  new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
export const paintLabels = {
  SOLID: "Lisa",
  METALLIC: "Metálica",
  PEARL: "Perolizada",
  OTHER: "Outra",
};
export const sourceLabels = {
  OFFICIAL_SYSTEM: "Sistema oficial do fabricante",
  MANUAL_ENTRY: "Digitada pelo profissional",
  CUSTOM_FORMULA: "Fórmula própria",
  SAVED_COLOR_BANK: "Banco de Cores",
  OTHER: "Outra origem",
};
export const lightingLabels = {
  SUNLIGHT: "Luz do sol",
  LED: "LED",
  BOOTH: "Cabine",
  FLUORESCENT: "Fluorescente",
  INCANDESCENT: "Incandescente",
  OTHER: "Outra",
};
