/**
 * Geometria da Bússola da Colorimetria.
 *
 * Reconstrução do instrumento impresso (`aplicativo.jpeg`): doze setores de 30°,
 * anel interno em 0,677 do raio externo, pivô preto central e esferas em duas
 * bandas. As proporções vêm de medição por pixels da referência; os ângulos são
 * posições gráficas idealizadas do desenho, não medidas colorimétricas.
 *
 * Este módulo é puro: não importa React nem toca no domínio de correção. Ele é a
 * fonte única usada pelo desenho, pelo hit testing e pela indicação de seleção.
 */
import type { PrimaryTone, ToneDirection } from "../colorimetry/types";

export const SECTOR_COUNT = 12;
export const SECTOR_SPAN = 360 / SECTOR_COUNT;

export type SectorKind = "TONE" | "DIRECTION";

export interface CompassSector {
  /** Posição no anel, 0 = setor cujo centro está em 15°. */
  index: number;
  kind: SectorKind;
  /** Centro angular do setor, 0° no topo e sentido horário. */
  center: number;
  /** Limite inicial (inclusivo) do setor. */
  start: number;
  /** Limite final (exclusivo) do setor. */
  end: number;
  mainTone: PrimaryTone;
  /** Ausente nos quatro setores de tom fundamental. */
  direction?: ToneDirection;
  /** Chave semântica da regra (`mainTone:direction`) quando houver. */
  ruleKey?: string;
  /** Rótulo do desenho, já quebrado nas linhas usadas na referência. */
  label: string[];
}

function sector(
  index: number,
  kind: SectorKind,
  mainTone: PrimaryTone,
  label: string[],
  direction?: ToneDirection,
): CompassSector {
  const start = index * SECTOR_SPAN;
  return {
    index,
    kind,
    center: start + SECTOR_SPAN / 2,
    start,
    end: start + SECTOR_SPAN,
    mainTone,
    direction,
    ruleKey: direction ? `${mainTone}:${direction}` : undefined,
    label,
  };
}

/**
 * Sequência da referência: cada tom fundamental fica entre os seus dois subtons,
 * inclusive na passagem 360°/0° (amarelo esverdeado precede o amarelo).
 */
export const compassSectors: readonly CompassSector[] = [
  sector(0, "TONE", "YELLOW", ["AMARELO"]),
  sector(1, "DIRECTION", "YELLOW", ["AMARELO", "AVERMELHADO"], "REDISH"),
  sector(2, "DIRECTION", "BLUE", ["AZUL", "AVERMELHADO"], "REDISH"),
  sector(3, "TONE", "BLUE", ["AZUL"]),
  sector(4, "DIRECTION", "BLUE", ["AZUL", "ESVERDEADO"], "GREENISH"),
  sector(5, "DIRECTION", "RED", ["VERMELHO", "AMARELADO"], "YELLOWISH"),
  sector(6, "TONE", "RED", ["VERMELHO"]),
  sector(7, "DIRECTION", "RED", ["VERMELHO", "AZULADO"], "BLUISH"),
  sector(8, "DIRECTION", "GREEN", ["VERDE", "AZULADO"], "BLUISH"),
  sector(9, "TONE", "GREEN", ["VERDE"]),
  sector(10, "DIRECTION", "GREEN", ["VERDE", "AMARELADO"], "YELLOWISH"),
  sector(11, "DIRECTION", "YELLOW", ["AMARELO", "ESVERDEADO"], "GREENISH"),
];

/** Os oito setores que carregam regra operacional. */
export const directionSectors = compassSectors.filter(
  (s): s is CompassSector & { direction: ToneDirection; ruleKey: string } =>
    s.kind === "DIRECTION",
);

/** Os quatro setores de tom fundamental: selecionam família, nunca uma correção. */
export const toneSectors = compassSectors.filter((s) => s.kind === "TONE");

/** Reduz qualquer ângulo, inclusive negativo ou com voltas completas, a [0, 360). */
export function normalizeAngle(degrees: number): number {
  if (!Number.isFinite(degrees)) throw new Error("Ângulo inválido.");
  return ((degrees % 360) + 360) % 360;
}

/** Menor deslocamento circular de `from` para `to`, em (-180, 180]. */
export function shortestAngleDelta(from: number, to: number): number {
  const delta = normalizeAngle(to - from);
  return delta > 180 ? delta - 360 : delta;
}

/** 0° no topo, crescendo no sentido horário. */
export function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  degrees: number,
) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return { x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians) };
}

/** Ângulo de um ponto em relação ao centro, na mesma convenção do desenho. */
export function angleOfPoint(cx: number, cy: number, x: number, y: number) {
  return normalizeAngle((Math.atan2(y - cy, x - cx) * 180) / Math.PI + 90);
}

/** Índice do setor que contém o ângulo; limites pertencem ao setor que começa neles. */
export function sectorIndexAt(degrees: number): number {
  return Math.floor(normalizeAngle(degrees) / SECTOR_SPAN) % SECTOR_COUNT;
}

export function sectorAt(degrees: number): CompassSector {
  return compassSectors[sectorIndexAt(degrees)];
}

export function sectorFor(
  mainTone: PrimaryTone,
  direction: ToneDirection | null,
): CompassSector | undefined {
  return compassSectors.find(
    (s) =>
      s.mainTone === mainTone &&
      (direction ? s.direction === direction : s.kind === "TONE"),
  );
}

/**
 * Proporções do raio externo medidas na referência. Multiplicadas pelo raio
 * efetivo do desenho, valem para qualquer escala (miniatura, página ou modal).
 */
export const compassRatios = {
  /** Anel que separa a banda externa (setores rotulados) da interna. */
  innerRing: 0.677,
  /** Pivô preto central. */
  pivot: 0.088,
  toneSphere: { distance: 0.835, radius: 0.121 },
  directionSphere: { distance: 0.875, radius: 0.09 },
  /** Rótulo do subtom, duas linhas entre a esfera e o anel. */
  directionLabel: 0.735,
  /** Nome da família, radial, dentro da banda interna. */
  toneLabel: 0.42,
  /** Esferas pequenas dos pigmentos da arte impressa. */
  artSphere: { radius: 0.047, distances: [0.61, 0.46, 0.31], pair: [0.6, 0.39] },
  /** Setas curtas que partem do pivô nos setores de subtom. */
  arrow: { from: 0.105, to: 0.2 },
} as const;

export interface CompassLayout {
  cx: number;
  cy: number;
  radius: number;
  innerRing: number;
  pivot: number;
}

/** Converte as proporções em coordenadas do viewBox. */
export function layout(cx: number, cy: number, radius: number): CompassLayout {
  return {
    cx,
    cy,
    radius,
    innerRing: radius * compassRatios.innerRing,
    pivot: radius * compassRatios.pivot,
  };
}

/** Caminho de um setor anelar entre dois raios e dois ângulos. */
export function annularSectorPath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const sweep = endAngle - startAngle;
  if (sweep <= 0 || sweep >= 360)
    throw new Error("Setor anelar exige varredura entre 0° e 360°.");
  const largeArc = sweep > 180 ? 1 : 0;
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);
  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

/** Setor cheio, do centro à borda, usado como área de toque. */
export function wedgePath(
  cx: number,
  cy: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const start = polarToCartesian(cx, cy, outerRadius, startAngle);
  const end = polarToCartesian(cx, cy, outerRadius, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${start.x.toFixed(2)} ${start.y.toFixed(2)}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

/**
 * Rotação de um texto radial. `along` mantém o texto perpendicular ao raio
 * (rótulos de subtom); `radial` escreve ao longo do raio (nomes de família).
 * A referência inverte o texto no semicírculo inferior para não ficar de cabeça
 * para baixo — a arte original também gira com o disco, então a inversão é
 * aplicada apenas onde melhora a leitura.
 */
export function textRotation(
  centerAngle: number,
  mode: "along" | "radial",
): number {
  const angle = normalizeAngle(centerAngle);
  if (mode === "along") return angle;
  return angle > 180 ? angle + 90 : angle - 90;
}
