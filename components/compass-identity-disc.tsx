"use client";

/**
 * Segundo disco da referência `aplicativo.jpeg`.
 *
 * O que a imagem comprova: contorno escuro, abertura circular central, dois
 * quadrantes opacos com a identidade gráfica (superior esquerdo e inferior
 * direito) e dois quadrantes claros subdivididos em três setores de 30°.
 *
 * O que a imagem **não** comprova: se este disco é máscara, capa, verso ou peça
 * móvel; se as áreas claras são transparentes; qual camada gira. Enquanto não
 * houver fonte que sustente a mecânica, ele é apresentado separado do disco
 * cromático, como aparece na captura. A arte de marca é aproximada em vetor:
 * não existe no projeto um asset em resolução suficiente para reproduzi-la.
 */
import {
  annularSectorPath,
  polarToCartesian,
  wedgePath,
} from "@/domain/compass/geometry";
import { artInk } from "@/domain/compass/artwork";

const VIEW = 1000;
const CX = VIEW / 2;
const CY = VIEW / 2;
const RADIUS = 468;
/** Abertura central medida na referência: 0,099 do raio. */
const HOLE = RADIUS * 0.099;

/** Quadrantes opacos com a identidade, medidos na captura. */
const brandQuadrants = [
  { start: 270, end: 360, lines: ["MESTRE", "da Colorimetria"] },
  { start: 90, end: 180, lines: ["BUSSOLA", "DA", "COLORIMETRIA"] },
];

/** Quadrantes claros, cada um dividido em três setores de 30°. */
const openQuadrants = [0, 180];

export function CompassIdentityDisc({ size = "md" }: { size?: "sm" | "md" | "xl" }) {
  return (
    <div className={`compass-identity ${size}`}>
      <svg
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="compass-identity-svg"
        role="img"
        aria-label="Segundo disco da bússola: dois quadrantes com a identidade gráfica e dois quadrantes claros divididos em três setores, com abertura circular no centro."
      >
        <circle cx={CX} cy={CY} r={RADIUS} fill="#fdfdfc" />

        {openQuadrants.map((start) =>
          [0, 30, 60].map((offset) => (
            <path
              key={`open-${start}-${offset}`}
              d={wedgePath(
                CX,
                CY,
                RADIUS,
                start + offset,
                start + offset + 30,
              )}
              fill="#fbfbf9"
              stroke={artInk}
              strokeWidth={3}
            />
          )),
        )}

        {brandQuadrants.map((quadrant) => {
          const center = (quadrant.start + quadrant.end) / 2;
          const at = polarToCartesian(CX, CY, RADIUS * 0.52, center);
          return (
            <g key={quadrant.start}>
              <path
                d={wedgePath(CX, CY, RADIUS, quadrant.start, quadrant.end)}
                fill="#0a0c12"
              />
              {quadrant.lines.map((line, index) => (
                <text
                  key={line}
                  x={at.x}
                  y={at.y + (index - (quadrant.lines.length - 1) / 2) * 52}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={
                    index === 0
                      ? "compass-identity-title"
                      : "compass-identity-subtitle"
                  }
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}

        {/* Anel externo e abertura central */}
        <circle
          cx={CX}
          cy={CY}
          r={RADIUS}
          fill="none"
          stroke={artInk}
          strokeWidth={6}
        />
        <path
          d={annularSectorPath(CX, CY, HOLE, HOLE + 1, 0, 359.9)}
          fill="none"
        />
        <circle cx={CX} cy={CY} r={HOLE} fill="#ffffff" stroke={artInk} strokeWidth={5} />
      </svg>
    </div>
  );
}
