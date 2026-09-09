import type {
  PrimaryTone,
  ToneDirection,
  PigmentCharacteristic,
} from "./types";
export const validDirections: Record<PrimaryTone, readonly ToneDirection[]> = {
  YELLOW: ["REDISH", "GREENISH"],
  BLUE: ["REDISH", "GREENISH"],
  GREEN: ["YELLOWISH", "BLUISH"],
  RED: ["YELLOWISH", "BLUISH"],
};
export const toneLabels: Record<PrimaryTone, string> = {
  YELLOW: "Amarelo",
  BLUE: "Azul",
  GREEN: "Verde",
  RED: "Vermelho",
};
export const directionLabels: Record<ToneDirection, string> = {
  REDISH: "Avermelhado",
  GREENISH: "Esverdeado",
  YELLOWISH: "Amarelado",
  BLUISH: "Azulado",
};
export const pigmentLabels: Record<PigmentCharacteristic, string> = {
  BLUE_GREEN: "Azul esverdeado",
  RED_BLUE: "Azul avermelhado",
  VIOLET: "Violeta",
  LEMON_YELLOW: "Amarelo limão",
  RED_OXIDE: "Óxido vermelho",
  RED_SUPPORT: "Suporte vermelho",
};
