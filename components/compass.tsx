"use client";

import React, { useCallback, useId, useMemo, useRef, useState } from "react";
import type { CorrectionRule } from "@/domain/colorimetry/types";
import { toneLabels, directionLabels } from "@/domain/colorimetry/tones";
import {
  SECTOR_COUNT,
  angleOfPoint,
  annularSectorPath,
  compassRatios,
  compassSectors,
  layout,
  polarToCartesian,
  sectorAt,
  sectorFor,
  textRotation,
  wedgePath,
  type CompassSector,
} from "@/domain/compass/geometry";
import {
  artInk,
  artPivot,
  sectorArtwork,
  sectorBackgrounds,
  sectorSpheres,
  type ArtSphereStyle,
} from "@/domain/compass/artwork";
import {
  resolveSelection,
  selectionSummary,
  type CompassSelection,
} from "@/domain/compass/selection";

/** sm = miniatura, md = página, xl = mostrador ampliado. */
export type CompassSize = "sm" | "md" | "xl";

export interface CompassProps {
  rules: CorrectionRule[];
  selection: CompassSelection | null;
  onSelect: (selection: CompassSelection) => void;
  size?: CompassSize;
  /** Miniatura apenas apresenta o instrumento e delega o clique. */
  onActivate?: () => void;
}

const VIEW = 1000;
const CX = VIEW / 2;
const CY = VIEW / 2;
const RADIUS = 468;
const L = layout(CX, CY, RADIUS);

/** Orientação dos nomes de família, medida setor a setor na referência. */
const toneLabelSpin: Record<number, number> = { 0: -90, 3: 90, 6: 90, 9: 90 };

function sameSelection(a: CompassSelection | null, b: CompassSelection | null) {
  return (
    a?.mainTone === b?.mainTone && (a?.direction ?? null) === (b?.direction ?? null)
  );
}

function selectionOfSector(sector: CompassSector): CompassSelection {
  return { mainTone: sector.mainTone, direction: sector.direction ?? null };
}

/** Esfera com volume e reflexo, como as da chapa impressa. */
function Sphere({
  x,
  y,
  r,
  gradient,
}: {
  x: number;
  y: number;
  r: number;
  gradient: string;
}) {
  return (
    <g pointerEvents="none">
      <ellipse
        cx={x}
        cy={y + r * 0.92}
        rx={r * 0.82}
        ry={r * 0.22}
        fill="rgba(23,28,38,0.22)"
      />
      <circle cx={x} cy={y} r={r} fill={`url(#${gradient})`} />
      <ellipse
        cx={x - r * 0.3}
        cy={y - r * 0.36}
        rx={r * 0.22}
        ry={r * 0.14}
        transform={`rotate(-38 ${x - r * 0.3} ${y - r * 0.36})`}
        fill="rgba(255,255,255,0.8)"
      />
    </g>
  );
}

export function Compass({
  rules,
  selection,
  onSelect,
  size = "md",
  onActivate,
}: CompassProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const pointer = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9]/g, "");

  const compact = size === "sm";
  const detailed = size === "xl";
  const interactive = !compact;

  const resolution = useMemo(
    () => (selection ? resolveSelection(rules, selection) : null),
    [rules, selection],
  );
  const summary = resolution
    ? selectionSummary(resolution, {
        tone: toneLabels,
        direction: directionLabels,
      })
    : "Nenhuma posição selecionada.";

  const activeSector = selection
    ? sectorFor(selection.mainTone, selection.direction)
    : undefined;

  /** Coordenadas do SVG a partir do ponteiro, respeitando escala e transformações. */
  const pointOf = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const matrix = svg.getScreenCTM();
    if (matrix && typeof DOMPoint === "function") {
      const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(
        matrix.inverse(),
      );
      return { x: point.x, y: point.y };
    }
    const rect = svg.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * VIEW,
      y: ((event.clientY - rect.top) / rect.height) * VIEW,
    };
  }, []);

  const commit = useCallback(
    (sector: CompassSector) => {
      const next = selectionOfSector(sector);
      if (!sameSelection(next, selection)) onSelect(next);
    },
    [onSelect, selection],
  );

  const selectAtPointer = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const point = pointOf(event);
      if (!point) return;
      const distance = Math.hypot(point.x - CX, point.y - CY);
      // O pivô não seleciona: ali o ângulo é instável e a arte precisa continuar visível.
      if (distance < L.pivot || distance > RADIUS) return;
      commit(sectorAt(angleOfPoint(CX, CY, point.x, point.y)));
    },
    [commit, pointOf],
  );

  function handlePointerDown(event: React.PointerEvent<SVGSVGElement>) {
    if (!interactive) {
      onActivate?.();
      return;
    }
    if (pointer.current !== null) return; // um ponteiro por gesto
    pointer.current = event.pointerId;
    setDragging(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    // A seleção sai já no pointerdown, sem depender de estado assíncrono.
    selectAtPointer(event);
  }

  function handlePointerMove(event: React.PointerEvent<SVGSVGElement>) {
    if (pointer.current !== event.pointerId) return;
    selectAtPointer(event);
  }

  function endGesture(event: React.PointerEvent<SVGSVGElement>) {
    if (pointer.current !== event.pointerId) return;
    pointer.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleKeyDown(event: React.KeyboardEvent<SVGSVGElement>) {
    if (!interactive) return;
    const current = activeSector ? activeSector.index : 0;
    const step =
      event.key === "ArrowRight" || event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowLeft" || event.key === "ArrowUp"
          ? -1
          : 0;
    if (step) {
      event.preventDefault();
      commit(compassSectors[(current + step + SECTOR_COUNT) % SECTOR_COUNT]);
      return;
    }
    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      commit(compassSectors[event.key === "Home" ? 0 : SECTOR_COUNT - 1]);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commit(compassSectors[current]);
    }
  }

  const gradientId = (key: string) => `sphere-${key}-${uid}`;
  const artColors = useMemo(() => {
    const map = new Map<string, ArtSphereStyle>();
    for (const [key, art] of Object.entries(sectorArtwork))
      art.pigments.forEach((pigment, index) =>
        map.set(`${key.replace(/[^a-zA-Z]/g, "")}${index}`, pigment.color),
      );
    return map;
  }, []);

  return (
    <div className={`compass-container ${size} ${dragging ? "dragging" : ""}`}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW} ${VIEW}`}
        className="compass-svg"
        role="group"
        aria-label={`Bússola da Colorimetria, doze posições. ${summary}`}
        tabIndex={interactive ? 0 : -1}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        onLostPointerCapture={endGesture}
        onKeyDown={handleKeyDown}
      >
        <defs>
          {sectorSpheres.map((sphere, index) => (
            <radialGradient
              key={index}
              id={gradientId(`s${index}`)}
              cx="36%"
              cy="30%"
              r="72%"
            >
              <stop offset="0%" stopColor={sphere.light} />
              <stop offset="45%" stopColor={sphere.mid} />
              <stop offset="100%" stopColor={sphere.dark} />
            </radialGradient>
          ))}
          {[...artColors].map(([key, color]) => (
            <radialGradient
              key={key}
              id={gradientId(key)}
              cx="36%"
              cy="30%"
              r="72%"
            >
              <stop offset="0%" stopColor={color.light} />
              <stop offset="45%" stopColor={color.mid} />
              <stop offset="100%" stopColor={color.dark} />
            </radialGradient>
          ))}
          <marker
            id={`arrow-${uid}`}
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#141a21" />
          </marker>
        </defs>

        {/* Chapa impressa: clara nos dois temas, como o instrumento real */}
        <circle cx={CX} cy={CY} r={RADIUS} fill="#ffffff" />

        {compassSectors.map((sector) => {
          const background = sectorBackgrounds[sector.index];
          return (
            <g key={`bg-${sector.index}`} pointerEvents="none">
              <path
                d={annularSectorPath(
                  CX,
                  CY,
                  L.innerRing,
                  RADIUS,
                  sector.start,
                  sector.end,
                )}
                fill={background.outer}
              />
              <path
                d={annularSectorPath(
                  CX,
                  CY,
                  L.pivot * 0.6,
                  L.innerRing,
                  sector.start,
                  sector.end,
                )}
                fill={background.inner}
              />
            </g>
          );
        })}

        {/* Divisórias radiais finas e anel interno */}
        <g pointerEvents="none" stroke={artInk} fill="none">
          {compassSectors.map((sector) => {
            const from = polarToCartesian(CX, CY, L.pivot * 0.6, sector.start);
            const to = polarToCartesian(CX, CY, RADIUS, sector.start);
            return (
              <line
                key={`div-${sector.index}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                strokeWidth={2.6}
              />
            );
          })}
          <circle cx={CX} cy={CY} r={L.innerRing} strokeWidth={3.4} />
          <circle cx={CX} cy={CY} r={RADIUS} strokeWidth={6} />
        </g>

        {/* Esferas e rótulos da banda externa */}
        {compassSectors.map((sector) => {
          const isTone = sector.kind === "TONE";
          const geometry = isTone
            ? compassRatios.toneSphere
            : compassRatios.directionSphere;
          const center = polarToCartesian(
            CX,
            CY,
            RADIUS * geometry.distance,
            sector.center,
          );
          const labelAt = polarToCartesian(
            CX,
            CY,
            RADIUS * compassRatios.directionLabel,
            sector.center,
          );
          return (
            <g key={`outer-${sector.index}`} pointerEvents="none">
              <Sphere
                x={center.x}
                y={center.y}
                r={RADIUS * geometry.radius}
                gradient={gradientId(`s${sector.index}`)}
              />
              {!isTone && !compact && (
                <g
                  transform={`rotate(${textRotation(sector.center, "along")} ${labelAt.x} ${labelAt.y})`}
                >
                  {sector.label.map((line, index) => (
                    <text
                      key={line}
                      x={labelAt.x}
                      y={labelAt.y + (index - (sector.label.length - 1) / 2) * 17}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="compass-label-direction"
                    >
                      {line}
                    </text>
                  ))}
                </g>
              )}
            </g>
          );
        })}

        {/* Banda interna: nome da família ou pigmentos da arte impressa */}
        {compassSectors.map((sector) => {
          if (sector.kind === "TONE") {
            const at = polarToCartesian(
              CX,
              CY,
              RADIUS * compassRatios.toneLabel,
              sector.center,
            );
            if (compact) return null;
            return (
              <text
                key={`tone-${sector.index}`}
                x={at.x}
                y={at.y}
                textAnchor="middle"
                dominantBaseline="central"
                transform={`rotate(${sector.center + (toneLabelSpin[sector.index] ?? -90)} ${at.x} ${at.y})`}
                className="compass-label-tone"
                pointerEvents="none"
              >
                {sector.label[0]}
              </text>
            );
          }

          const art = sector.ruleKey ? sectorArtwork[sector.ruleKey] : undefined;
          if (!art || compact) return null;
          const distances =
            art.pigments.length > 2
              ? compassRatios.artSphere.distances
              : compassRatios.artSphere.pair;
          const artKey = sector.ruleKey!.replace(/[^a-zA-Z]/g, "");

          return (
            <g key={`art-${sector.index}`} pointerEvents="none">
              {art.pigments.map((pigment, index) => {
                const at = polarToCartesian(
                  CX,
                  CY,
                  RADIUS * distances[index],
                  sector.center,
                );
                const labelAt = polarToCartesian(
                  CX,
                  CY,
                  RADIUS * (distances[index] - 0.075),
                  sector.center,
                );
                return (
                  <g key={pigment.inscription.join(" ")}>
                    <Sphere
                      x={at.x}
                      y={at.y}
                      r={RADIUS * compassRatios.artSphere.radius}
                      gradient={gradientId(`${artKey}${index}`)}
                    />
                    {detailed && (
                      <g
                        transform={`rotate(${textRotation(sector.center, "along")} ${labelAt.x} ${labelAt.y})`}
                      >
                        {pigment.inscription.map((line, lineIndex) => (
                          <text
                            key={line}
                            x={labelAt.x}
                            y={
                              labelAt.y +
                              (lineIndex -
                                (pigment.inscription.length - 1) / 2) *
                                (pigment.emphasis ? 14 : 10)
                            }
                            textAnchor="middle"
                            dominantBaseline="central"
                            className={
                              pigment.emphasis
                                ? "compass-label-art strong"
                                : "compass-label-art"
                            }
                          >
                            {line}
                          </text>
                        ))}
                      </g>
                    )}
                  </g>
                );
              })}

              {/* Letras F, A e V da arte: reproduzidas sem interpretação */}
              {detailed &&
                art.letters.map((letter) => {
                  const at = polarToCartesian(
                    CX,
                    CY,
                    RADIUS * letter.distance,
                    sector.center + letter.offset,
                  );
                  return (
                    <text
                      key={letter.glyph + letter.distance}
                      x={at.x}
                      y={at.y}
                      textAnchor="middle"
                      dominantBaseline="central"
                      transform={`rotate(${textRotation(sector.center, "along")} ${at.x} ${at.y})`}
                      className="compass-label-letter"
                    >
                      {letter.glyph}
                    </text>
                  );
                })}
              {detailed && art.arc && (
                <path
                  d={(() => {
                    const from = polarToCartesian(
                      CX,
                      CY,
                      RADIUS * art.arc.from,
                      sector.center + art.arc.offset,
                    );
                    const to = polarToCartesian(
                      CX,
                      CY,
                      RADIUS * art.arc.to,
                      sector.center + art.arc.offset,
                    );
                    return `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${((from.x + to.x) / 2 + 14).toFixed(1)} ${((from.y + to.y) / 2).toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`;
                  })()}
                  fill="none"
                  stroke={artInk}
                  strokeWidth={3}
                />
              )}
            </g>
          );
        })}

        {/* Oito setas curtas partindo do pivô, uma por subtom */}
        <g pointerEvents="none">
          {compassSectors
            .filter((sector) => sector.kind === "DIRECTION")
            .map((sector) => {
              const from = polarToCartesian(
                CX,
                CY,
                RADIUS * compassRatios.arrow.from,
                sector.center,
              );
              const to = polarToCartesian(
                CX,
                CY,
                RADIUS * compassRatios.arrow.to,
                sector.center,
              );
              return (
                <line
                  key={`arrow-${sector.index}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke="#141a21"
                  strokeWidth={4}
                  markerEnd={`url(#arrow-${uid})`}
                />
              );
            })}
        </g>

        {/* Pivô preto pequeno, desenhado antes do destaque de seleção */}
        <g pointerEvents="none">
          <circle cx={CX} cy={CY} r={L.pivot} fill={artPivot.fill} />
          <circle
            cx={CX - L.pivot * 0.32}
            cy={CY - L.pivot * 0.34}
            r={L.pivot * 0.11}
            fill={artPivot.highlight}
          />
        </g>

        {/* Áreas de seleção e destaque discreto do setor ativo */}
        {compassSectors.map((sector) => {
          const active = activeSector?.index === sector.index;
          return (
            <path
              key={`hit-${sector.index}`}
              d={wedgePath(CX, CY, RADIUS, sector.start, sector.end)}
              className={`compass-hit ${active ? "active" : ""}`}
              role="img"
              aria-label={
                sector.kind === "TONE"
                  ? `Tom ${toneLabels[sector.mainTone]}`
                  : `${toneLabels[sector.mainTone]} ${directionLabels[sector.direction!].toLowerCase()}`
              }
            />
          );
        })}
        {activeSector && (
          <path
            d={annularSectorPath(
              CX,
              CY,
              L.pivot * 0.6,
              RADIUS,
              activeSector.start,
              activeSector.end,
            )}
            className="compass-active-outline"
            pointerEvents="none"
          />
        )}
      </svg>

      <p className="compass-live" aria-live="polite">
        {summary}
      </p>
    </div>
  );
}
