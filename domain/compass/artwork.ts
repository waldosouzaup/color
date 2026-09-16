/**
 * Arte impressa da Bússola da Colorimetria, transcrita de `aplicativo.jpeg`.
 *
 * Cores e posições vêm de amostragem por pixels da referência. As inscrições
 * internas são **reprodução da arte**, não a recomendação vigente: a matriz
 * operacional está em `domain/colorimetry` e é o que os painéis exibem. Onde a
 * arte diverge da matriz, a divergência está registrada em
 * `docs/COLORIMETRY_DOMAIN.md`; nada aqui altera regra, dose ou validação.
 *
 * `domainCharacteristic` só é preenchido quando a correspondência entre o nome
 * impresso e o identificador do domínio é explícita nas fontes do projeto.
 * Inscrições sem correspondência comprovada ficam sem vínculo, de propósito.
 */
import type { PigmentCharacteristic } from "../colorimetry/types";

export interface ArtSphereStyle {
  light: string;
  mid: string;
  dark: string;
}

/** Esferas grandes (tons) e médias (subtons) de cada setor, por índice. */
export const sectorSpheres: readonly ArtSphereStyle[] = [
  { light: "#fdf0a0", mid: "#f4cd27", dark: "#c08c12" }, // 15° amarelo
  { light: "#fcc96d", mid: "#f4a42b", dark: "#c2701a" }, // 45° amarelo avermelhado
  { light: "#6b84c7", mid: "#284e9f", dark: "#152c69" }, // 75° azul avermelhado
  { light: "#4e8fd0", mid: "#1857a7", dark: "#083564" }, // 105° azul
  { light: "#5ec9d1", mid: "#139da7", dark: "#0a6067" }, // 135° azul esverdeado
  { light: "#f1897e", mid: "#e92324", dark: "#9c1114" }, // 165° vermelho amarelado
  { light: "#eb484d", mid: "#d7181f", dark: "#8d0a11" }, // 195° vermelho
  { light: "#c9586c", mid: "#8e0820", dark: "#55020b" }, // 225° vermelho azulado
  { light: "#6eb9a4", mid: "#298669", dark: "#10503a" }, // 255° verde azulado
  { light: "#5c8239", mid: "#456a24", dark: "#284311" }, // 285° verde
  { light: "#bac567", mid: "#7e8c1d", dark: "#4d5611" }, // 315° verde amarelado
  { light: "#ebed8c", mid: "#c7d33f", dark: "#848c22" }, // 345° amarelo esverdeado
];

/** Fundos pastel das duas bandas, por índice de setor. */
export const sectorBackgrounds: readonly { outer: string; inner: string }[] = [
  { outer: "#f9f4cb", inner: "#f6f3cf" },
  { outer: "#fbecd2", inner: "#faeedb" },
  { outer: "#dde7f2", inner: "#dde5f4" },
  { outer: "#d6e3f2", inner: "#dae3f1" },
  { outer: "#dde5f1", inner: "#e2e1ef" },
  { outer: "#f7d9e0", inner: "#f8dee3" },
  { outer: "#f8dade", inner: "#f7e0e6" },
  { outer: "#f8dcdf", inner: "#f7dee1" },
  { outer: "#deece8", inner: "#e1ece9" },
  { outer: "#e1ecd6", inner: "#dceee6" },
  { outer: "#e8f0dc", inner: "#e8f0e5" },
  { outer: "#f7f7db", inner: "#f4f4d8" },
];

export interface ArtPigment {
  /** Nome exatamente como aparece na arte impressa. */
  inscription: string[];
  color: ArtSphereStyle;
  /** Primeiro item de cada setor aparece com rótulo maior na referência. */
  emphasis?: boolean;
  /** Vínculo com o domínio apenas quando documentado no projeto. */
  domainCharacteristic?: PigmentCharacteristic;
}

const violet: ArtSphereStyle = { light: "#8f6fd6", mid: "#472b8c", dark: "#2a1758" };
const redOxide: ArtSphereStyle = { light: "#e8845f", mid: "#c64623", dark: "#822a12" };
const transparentRed: ArtSphereStyle = { light: "#b96148", mid: "#8d3521", dark: "#571c0f" };
const blueGreen: ArtSphereStyle = { light: "#63cdd4", mid: "#10a0a9", dark: "#0a6167" };
const lemon: ArtSphereStyle = { light: "#d7dd70", mid: "#b3ba2c", dark: "#6e7419" };
const yellowOxide: ArtSphereStyle = { light: "#e8ab5c", mid: "#c77d1c", dark: "#7d4c0d" };

const COMBO_DE_ROXO: ArtPigment = {
  inscription: ["COMBO", "DE ROXO"],
  color: violet,
  domainCharacteristic: "VIOLET",
};
const AZUL_ESVERDEADO: ArtPigment = {
  inscription: ["AZUL", "ESVERDEADO"],
  color: blueGreen,
  domainCharacteristic: "BLUE_GREEN",
};
const VERMELHO_OXIDO: ArtPigment = {
  inscription: ["VERMELHO", "ÓXIDO"],
  color: redOxide,
  domainCharacteristic: "RED_OXIDE",
};
const AMARELO_ESVERDEADO: ArtPigment = {
  inscription: ["AMARELO", "ESVERDEADO"],
  color: lemon,
  domainCharacteristic: "LEMON_YELLOW",
};
/** Sem identificador correspondente no domínio: fica apenas como inscrição. */
const VERMELHO_TRANSPARENTE: ArtPigment = {
  inscription: ["VERMELHO", "TRANSPARENTE"],
  color: transparentRed,
};
const AMARELO_OXIDO: ArtPigment = {
  inscription: ["AMARELO", "ÓXIDO"],
  color: yellowOxide,
};

export interface ArtLetter {
  glyph: string;
  /** Deslocamento angular a partir do centro do setor, em graus. */
  offset: number;
  /** Distância em proporção do raio externo. */
  distance: number;
}

export interface SectorArtwork {
  pigments: ArtPigment[];
  letters: ArtLetter[];
  /** Arco curvo entre as letras, como na arte. */
  arc?: { offset: number; from: number; to: number };
}

/**
 * Conteúdo da banda interna por setor de subtom, na ordem do centro para fora
 * conforme a referência (o primeiro item da lista é o mais externo).
 * As letras F, A e V aparecem na arte sem legenda; nenhuma fonte do projeto
 * explica sua função, por isso são reproduzidas sem interpretação.
 */
export const sectorArtwork: Readonly<Record<string, SectorArtwork>> = {
  "YELLOW:REDISH": {
    pigments: [{ ...AMARELO_ESVERDEADO, emphasis: true }, AZUL_ESVERDEADO],
    letters: [],
  },
  "BLUE:REDISH": {
    pigments: [COMBO_DE_ROXO, VERMELHO_TRANSPARENTE, VERMELHO_OXIDO],
    letters: [
      { glyph: "F", offset: 9, distance: 0.56 },
      { glyph: "A", offset: 9, distance: 0.36 },
    ],
    arc: { offset: 11, from: 0.53, to: 0.39 },
  },
  "BLUE:GREENISH": {
    pigments: [{ ...COMBO_DE_ROXO, emphasis: true }, VERMELHO_OXIDO],
    letters: [],
  },
  "RED:YELLOWISH": {
    pigments: [{ ...COMBO_DE_ROXO, emphasis: true }, VERMELHO_OXIDO],
    letters: [],
  },
  "RED:BLUISH": {
    pigments: [{ ...COMBO_DE_ROXO, emphasis: true }, AZUL_ESVERDEADO],
    letters: [],
  },
  "GREEN:BLUISH": {
    pigments: [
      { ...AMARELO_ESVERDEADO, emphasis: true },
      AMARELO_OXIDO,
      VERMELHO_OXIDO,
    ],
    letters: [{ glyph: "V", offset: 9, distance: 0.47 }],
    arc: { offset: 11, from: 0.44, to: 0.31 },
  },
  "GREEN:YELLOWISH": {
    pigments: [VERMELHO_TRANSPARENTE, VERMELHO_OXIDO, COMBO_DE_ROXO],
    letters: [
      { glyph: "F", offset: 9, distance: 0.57 },
      { glyph: "A", offset: 9, distance: 0.38 },
    ],
    arc: { offset: 11, from: 0.54, to: 0.41 },
  },
  "YELLOW:GREENISH": {
    pigments: [{ ...COMBO_DE_ROXO, emphasis: true }, AZUL_ESVERDEADO],
    letters: [],
  },
};

/** Traço escuro do contorno e das divisórias do disco impresso. */
export const artInk = "#3b4450";
/** Pivô central preto. */
export const artPivot = { fill: "#101014", highlight: "rgba(255,255,255,0.75)" };
