"use client";

import React, { useRef, useState, useCallback, useMemo } from "react";
import type { CorrectionRule, PrimaryTone } from "@/domain/colorimetry/types";
import { toneLabels, directionLabels, pigmentLabels } from "@/domain/colorimetry/tones";

// Escalas do instrumento: sm (miniatura do hero), md (painel da pagina), xl (modal ampliado)
export type CompassSize = "sm" | "md" | "xl";

export interface CompassProps {
  rules: CorrectionRule[];
  selected?: string;
  onSelect: (rule: CorrectionRule) => void;
  size?: CompassSize;
  viewMode?: "ANGLE" | "FRONT";
  onViewModeChange?: (mode: "ANGLE" | "FRONT") => void;
}

// 8 Direções do Método Semida e seus respectivos ângulos no mostrador de 360° (0° = 12h / Norte)
export const ruleAngles: Record<string, number> = {
  "YELLOW:REDISH": 22.5,
  "BLUE:REDISH": 67.5,
  "BLUE:GREENISH": 112.5,
  "RED:YELLOWISH": 157.5,
  "RED:BLUISH": 202.5,
  "GREEN:BLUISH": 247.5,
  "GREEN:YELLOWISH": 292.5,
  "YELLOW:GREENISH": 337.5,
};

// 4 Tons Fundamentais Cardeais (0°, 90°, 180°, 270°)
export const cardinalTones = [
  { tone: "YELLOW" as PrimaryTone, label: "AMARELO", angle: 0, color: "#facc15", darkColor: "#ca8a04" },
  { tone: "BLUE" as PrimaryTone, label: "AZUL", angle: 90, color: "#3b82f6", darkColor: "#1d4ed8" },
  { tone: "RED" as PrimaryTone, label: "VERMELHO", angle: 180, color: "#ef4444", darkColor: "#b91c1c" },
  { tone: "GREEN" as PrimaryTone, label: "VERDE", angle: 270, color: "#10b981", darkColor: "#047857" },
];

function polarToCartesian(cx: number, cy: number, radius: number, angleDegrees: number) {
  const rad = ((angleDegrees - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(rad),
    y: cy + radius * Math.sin(rad),
  };
}

export function Compass({
  rules,
  selected,
  onSelect,
  size = "md",
  viewMode = "ANGLE",
  onViewModeChange,
}: CompassProps) {
  // O viewBox e fixo em 500x500, entao a escala vem do container: sm/md/xl apenas
  // trocam a largura maxima. `expanded` libera detalhes que nao cabem no dial pequeno.
  const compact = size === "sm";
  const expanded = size === "xl";
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredSector, setHoveredSector] = useState<string | null>(null);

  // Mapeamento e ordenação estável das regras
  const activeRule = useMemo(() => {
    return rules.find((r) => r.id === selected) || rules[0];
  }, [rules, selected]);

  const activeAngle = useMemo(() => {
    if (!activeRule) return 0;
    return ruleAngles[`${activeRule.mainTone}:${activeRule.direction}`] ?? 0;
  }, [activeRule]);

  // Encontra a regra mais próxima com base em um ângulo de 0 a 360
  const findClosestRule = useCallback(
    (deg: number) => {
      let normalized = deg % 360;
      if (normalized < 0) normalized += 360;

      let closestRule = rules[0];
      let minDiff = 360;

      for (const r of rules) {
        const key = `${r.mainTone}:${r.direction}`;
        const targetDeg = ruleAngles[key] ?? 0;
        let diff = Math.abs(normalized - targetDeg);
        if (diff > 180) diff = 360 - diff;
        if (diff < minDiff) {
          minDiff = diff;
          closestRule = r;
        }
      }
      return closestRule;
    },
    [rules],
  );

  // Manipulador de arraste interativo
  const handlePointerDown = (e: React.PointerEvent) => {
    if (compact) return;
    setIsDragging(true);
    (e.target as Element).setPointerCapture?.(e.pointerId);
    handlePointerMove(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging && e.type !== "click") return;
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    // Converte coordenada cartesiana para ângulo com 0° no topo (12h)
    let deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (deg < 0) deg += 360;

    const closest = findClosestRule(deg);
    if (closest && closest.id !== activeRule?.id) {
      onSelect(closest);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  };

  // Coordenadas centrais
  const cx = 250;
  const cy = 250;

  return (
    <div className={`compass-container ${size} ${isDragging ? "dragging" : ""}`}>
      <svg
        ref={svgRef}
        viewBox="0 0 500 500"
        className="compass-svg"
        role="region"
        aria-label="Bússola Cromática de Alta Precisão - Método do Mestre"
        onPointerDown={handlePointerDown}
        onPointerMove={isDragging ? handlePointerMove : undefined}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <defs>
          {/* Sombra realista de contato das esferas */}
          <filter id="sphere-shadow" x="-40%" y="-40%" width="180%" height="180%">
            <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.45" />
          </filter>
          <filter id="dial-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#000000" floodOpacity="0.35" />
          </filter>
          <filter id="glow-highlight" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Gradientes Metálicos do Bisel Externo */}
          <linearGradient id="bezel-metal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="25%" stopColor="#1e293b" />
            <stop offset="50%" stopColor="#64748b" />
            <stop offset="75%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          <radialGradient id="inner-dial-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--panel-bg, #121620)" />
            <stop offset="75%" stopColor="var(--panel-border, #1a2232)" />
            <stop offset="100%" stopColor="#090d16" />
          </radialGradient>

          {/* Gradientes 3D para as Esferas do Método Semida */}
          {/* Amarelo Puro */}
          <radialGradient id="sphere-yellow-pure" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#facc15" />
            <stop offset="75%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#854d0e" />
          </radialGradient>
          {/* Amarelo Avermelhado */}
          <radialGradient id="sphere-yellow-redish" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="35%" stopColor="#f97316" />
            <stop offset="75%" stopColor="#c2410c" />
            <stop offset="100%" stopColor="#7c2d12" />
          </radialGradient>
          {/* Amarelo Esverdeado (Limão) */}
          <radialGradient id="sphere-yellow-greenish" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="35%" stopColor="#eab308" />
            <stop offset="70%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#4d7c0f" />
          </radialGradient>

          {/* Azul Puro */}
          <radialGradient id="sphere-blue-pure" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="35%" stopColor="#3b82f6" />
            <stop offset="75%" stopColor="#1d4ed8" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </radialGradient>
          {/* Azul Avermelhado (Cobalto / Violeta suave) */}
          <radialGradient id="sphere-blue-redish" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#c7d2fe" />
            <stop offset="35%" stopColor="#6366f1" />
            <stop offset="75%" stopColor="#4338ca" />
            <stop offset="100%" stopColor="#312e81" />
          </radialGradient>
          {/* Azul Esverdeado (Ciano / Turquesa) */}
          <radialGradient id="sphere-blue-greenish" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#a5f3fc" />
            <stop offset="35%" stopColor="#06b6d4" />
            <stop offset="75%" stopColor="#0e7490" />
            <stop offset="100%" stopColor="#164e63" />
          </radialGradient>

          {/* Vermelho Puro */}
          <radialGradient id="sphere-red-pure" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#fca5a5" />
            <stop offset="35%" stopColor="#ef4444" />
            <stop offset="75%" stopColor="#b91c1c" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </radialGradient>
          {/* Vermelho Amarelado (Coral / Escarlate) */}
          <radialGradient id="sphere-red-yellowish" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="35%" stopColor="#fb923c" />
            <stop offset="75%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#9a3412" />
          </radialGradient>
          {/* Vermelho Azulado (Rubi / Magenta) */}
          <radialGradient id="sphere-red-bluish" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#fbcfe8" />
            <stop offset="35%" stopColor="#ec4899" />
            <stop offset="75%" stopColor="#be185d" />
            <stop offset="100%" stopColor="#831843" />
          </radialGradient>

          {/* Verde Puro */}
          <radialGradient id="sphere-green-pure" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#86efac" />
            <stop offset="35%" stopColor="#10b981" />
            <stop offset="75%" stopColor="#047857" />
            <stop offset="100%" stopColor="#064e3b" />
          </radialGradient>
          {/* Verde Amarelado (Chartreuse / Pistache) */}
          <radialGradient id="sphere-green-yellowish" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#d9f99d" />
            <stop offset="35%" stopColor="#84cc16" />
            <stop offset="75%" stopColor="#4d7c0f" />
            <stop offset="100%" stopColor="#365314" />
          </radialGradient>
          {/* Verde Azulado (Menta / Esmeralda Escuro) */}
          <radialGradient id="sphere-green-bluish" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#99f6e4" />
            <stop offset="35%" stopColor="#14b8a6" />
            <stop offset="75%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#134e4a" />
          </radialGradient>

          {/* Pigmentos de Corte Especiais */}
          <radialGradient id="sphere-violet" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#e9d5ff" />
            <stop offset="35%" stopColor="#a855f7" />
            <stop offset="75%" stopColor="#7e22ce" />
            <stop offset="100%" stopColor="#581c87" />
          </radialGradient>
          <radialGradient id="sphere-red-oxide" cx="35%" cy="30%" r="65%">
            <stop offset="0%" stopColor="#fdba74" />
            <stop offset="35%" stopColor="#c2410c" />
            <stop offset="75%" stopColor="#9a3412" />
            <stop offset="100%" stopColor="#431407" />
          </radialGradient>

          {/* Faixa Diagonal Especular (Semelhante ao estilo do Método em 02.jpeg) */}
          <linearGradient id="specular-band" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="42%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.65" />
            <stop offset="58%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Gradiente da Agulha Usinada */}
          <linearGradient id="needle-light" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="50%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <linearGradient id="needle-gold" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#eab308" />
            <stop offset="100%" stopColor="#a16207" />
          </linearGradient>
        </defs>

        {/* 1. Bisel Externo de Instrumentação */}
        <circle cx={cx} cy={cy} r={238} fill="url(#bezel-metal)" filter="url(#dial-shadow)" />
        <circle cx={cx} cy={cy} r={228} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={2} />
        <circle cx={cx} cy={cy} r={224} fill="url(#inner-dial-grad)" stroke="#090d16" strokeWidth={3} />

        {/* 2. Divisões Quadrantes Coloridas no Fundo do Mostrador */}
        {/* Quadrante Norte (Amarelo) */}
        <path
          d={`M${cx} ${cy} L${cx + 220 * Math.sin(Math.PI * 0.25)} ${cy - 220 * Math.cos(Math.PI * 0.25)} A220 220 0 0 0 ${cx - 220 * Math.sin(Math.PI * 0.25)} ${cy - 220 * Math.cos(Math.PI * 0.25)} Z`}
          fill="rgba(250, 204, 21, 0.04)"
        />
        {/* Quadrante Leste (Azul) */}
        <path
          d={`M${cx} ${cy} L${cx + 220 * Math.sin(Math.PI * 0.75)} ${cy - 220 * Math.cos(Math.PI * 0.75)} A220 220 0 0 0 ${cx + 220 * Math.sin(Math.PI * 0.25)} ${cy - 220 * Math.cos(Math.PI * 0.25)} Z`}
          fill="rgba(59, 130, 246, 0.04)"
        />
        {/* Quadrante Sul (Vermelho) */}
        <path
          d={`M${cx} ${cy} L${cx - 220 * Math.sin(Math.PI * 0.75)} ${cy + 220 * Math.cos(Math.PI * 0.75)} A220 220 0 0 0 ${cx + 220 * Math.sin(Math.PI * 0.75)} ${cy - 220 * Math.cos(Math.PI * 0.75)} Z`}
          fill="rgba(239, 68, 68, 0.04)"
        />
        {/* Quadrante Oeste (Verde) */}
        <path
          d={`M${cx} ${cy} L${cx - 220 * Math.sin(Math.PI * 0.25)} ${cy - 220 * Math.cos(Math.PI * 0.25)} A220 220 0 0 0 ${cx - 220 * Math.sin(Math.PI * 0.75)} ${cy + 220 * Math.cos(Math.PI * 0.75)} Z`}
          fill="rgba(16, 185, 129, 0.04)"
        />

        {/* 3. Escala Graduada de Graus (Marcas a cada 5° e 15°) */}
        {Array.from({ length: 72 }).map((_, i) => {
          const angle = i * 5;
          const isMajor = angle % 45 === 0;
          const isMedium = angle % 15 === 0 && !isMajor;
          const r1 = 224;
          const r2 = isMajor ? 208 : isMedium ? 214 : 218;
          const p1 = polarToCartesian(cx, cy, r1, angle);
          const p2 = polarToCartesian(cx, cy, r2, angle);
          return (
            <line
              key={angle}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke={isMajor ? "rgba(255,255,255,0.7)" : isMedium ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.15)"}
              strokeWidth={isMajor ? 2.5 : isMedium ? 1.5 : 1}
            />
          );
        })}

        {/* 4. Rótulos Cardeais Principais (AMARELO, AZUL, VERMELHO, VERDE) */}
        {cardinalTones.map((c) => {
          const pos = polarToCartesian(cx, cy, expanded ? 178 : 196, c.angle);
          return (
            <g key={c.tone} className="compass-cardinal-label">
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill={c.color}
                fontSize={compact ? "9" : "11"}
                fontWeight="900"
                letterSpacing="1.5px"
                className="select-none"
              >
                {c.label}
              </text>
            </g>
          );
        })}

        {/* 4b. Numerais de Grau das 8 Direções — cabem apenas no mostrador ampliado */}
        {expanded &&
          Object.entries(ruleAngles).map(([key, angle]) => {
            const pos = polarToCartesian(cx, cy, 188, angle);
            return (
              <text
                key={key}
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="rgba(255,255,255,0.42)"
                fontSize="7.5"
                fontWeight="700"
                className="compass-degree-tick select-none pointer-events-none"
              >
                {angle.toFixed(1)}°
              </text>
            );
          })}

        {/* 5. Trilho das Esferas de Direção (Raio = 158) */}
        <circle cx={cx} cy={cy} r={158} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={1} strokeDasharray="4 4" />

        {/* 6. As 8 Esferas 3D das Direções do Método Semida */}
        {rules.map((rule) => {
          const key = `${rule.mainTone}:${rule.direction}`;
          const angle = ruleAngles[key] ?? 0;
          const pos = polarToCartesian(cx, cy, 158, angle);
          const isSelected = activeRule?.id === rule.id;
          const isHovered = hoveredSector === rule.id;
          const sphereRadius = isSelected ? (compact ? 16 : 22) : (compact ? 13 : 18);

          // Gradiente correspondente à direção
          let gradId = "sphere-yellow-pure";
          if (rule.mainTone === "YELLOW") {
            gradId = rule.direction === "REDISH" ? "sphere-yellow-redish" : "sphere-yellow-greenish";
          } else if (rule.mainTone === "BLUE") {
            gradId = rule.direction === "REDISH" ? "sphere-blue-redish" : "sphere-blue-greenish";
          } else if (rule.mainTone === "RED") {
            gradId = rule.direction === "YELLOWISH" ? "sphere-red-yellowish" : "sphere-red-bluish";
          } else if (rule.mainTone === "GREEN") {
            gradId = rule.direction === "YELLOWISH" ? "sphere-green-yellowish" : "sphere-green-bluish";
          }

          const labelPos = polarToCartesian(
            cx,
            cy,
            expanded ? (isSelected ? 112 : 116) : isSelected ? 122 : 126,
            angle,
          );

          return (
            <g
              key={rule.id}
              className={`compass-sphere-group ${isSelected ? "active" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(rule);
              }}
              onMouseEnter={() => setHoveredSector(rule.id)}
              onMouseLeave={() => setHoveredSector(null)}
              cursor="pointer"
              role="button"
              tabIndex={0}
              aria-label={rule.diagnosisLabel}
              aria-pressed={isSelected}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(rule);
                }
              }}
            >
              {/* Halo de foco quando selecionada */}
              {isSelected && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={sphereRadius + 7}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={2.5}
                  strokeDasharray="4 3"
                  className="sphere-active-halo"
                />
              )}

              {/* Sombra de Contato Tridimensional */}
              <ellipse
                cx={pos.x}
                cy={pos.y + sphereRadius * 0.82}
                rx={sphereRadius * 0.88}
                ry={sphereRadius * 0.28}
                fill="rgba(0,0,0,0.5)"
                filter="url(#sphere-shadow)"
              />

              {/* Corpo 3D da Esfera */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={sphereRadius}
                fill={`url(#${gradId})`}
                stroke={isSelected ? "#ffffff" : "rgba(255,255,255,0.2)"}
                strokeWidth={isSelected ? 2 : 0.75}
              />

              {/* Faixa Diagonal de Brilho Especular (Semelhante ao estilo do Método em 02.jpeg) */}
              <g clipPath={`url(#sphere-clip-${rule.id})`}>
                <rect
                  x={pos.x - sphereRadius}
                  y={pos.y - sphereRadius}
                  width={sphereRadius * 2}
                  height={sphereRadius * 2}
                  fill="url(#specular-band)"
                  transform={`rotate(-40, ${pos.x}, ${pos.y})`}
                  pointerEvents="none"
                />
              </g>
              <clipPath id={`sphere-clip-${rule.id}`}>
                <circle cx={pos.x} cy={pos.y} r={sphereRadius} />
              </clipPath>

              {/* Ponto de Reflexo de Luz Superior Esquerda (Hotspot) */}
              <ellipse
                cx={pos.x - sphereRadius * 0.32}
                cy={pos.y - sphereRadius * 0.34}
                rx={sphereRadius * 0.24}
                ry={sphereRadius * 0.14}
                transform={`rotate(-35, ${pos.x - sphereRadius * 0.32}, ${pos.y - sphereRadius * 0.34})`}
                fill="rgba(255,255,255,0.85)"
                pointerEvents="none"
              />

              {/* Rótulo da Direção — duas linhas (tom + direção) no mostrador ampliado */}
              {expanded ? (
                <g className="select-none pointer-events-none">
                  <text
                    x={labelPos.x}
                    y={labelPos.y - 5.5}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={isSelected ? "#ffffff" : isHovered ? "#e2e8f0" : "#cbd5e1"}
                    fontSize={isSelected ? "9.5" : "8.5"}
                    fontWeight="800"
                  >
                    {toneLabels[rule.mainTone]}
                  </text>
                  <text
                    x={labelPos.x}
                    y={labelPos.y + 5.5}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={isSelected ? "#38bdf8" : "#94a3b8"}
                    fontSize={isSelected ? "8.5" : "7.5"}
                    fontWeight={isSelected ? "700" : "600"}
                  >
                    {directionLabels[rule.direction]}
                  </text>
                </g>
              ) : (
                !compact && (
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={isSelected ? "#ffffff" : isHovered ? "#e2e8f0" : "#94a3b8"}
                    fontSize={isSelected ? "9.5" : "8"}
                    fontWeight={isSelected ? "800" : "600"}
                    className="select-none pointer-events-none"
                  >
                    {directionLabels[rule.direction]}
                  </text>
                )
              )}
            </g>
          );
        })}

        {/* 7. Lente Central / Volvelle Núcleo de Revelação da Fórmula */}
        <circle cx={cx} cy={cy} r={88} fill="url(#inner-dial-grad)" stroke="#1e293b" strokeWidth={3} filter="url(#dial-shadow)" />
        <circle cx={cx} cy={cy} r={84} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />

        {/* Conteúdo Informativo Central: Direção e Corte */}
        {activeRule && (
          <g className="compass-center-info select-none pointer-events-none">
            {/* Modo de Vista: ÂNGULO (Flop) vs FRENTE (Face) */}
            <rect
              x={cx - 46}
              y={cy - 68}
              width={92}
              height={18}
              rx={9}
              fill={viewMode === "ANGLE" ? "rgba(245, 158, 11, 0.2)" : "rgba(56, 189, 248, 0.2)"}
              stroke={viewMode === "ANGLE" ? "#f59e0b" : "#38bdf8"}
              strokeWidth={1}
            />
            <text
              x={cx}
              y={cy - 56}
              textAnchor="middle"
              fill={viewMode === "ANGLE" ? "#fbbf24" : "#7dd3fc"}
              fontSize="8"
              fontWeight="900"
              letterSpacing="1px"
            >
              {viewMode === "ANGLE" ? "1º ÂNGULO (FLOP)" : "2º FRENTE (FACE)"}
            </text>

            {/* Nome do Tom e Subtom Ativo */}
            <text x={cx} y={cy - 34} textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="900">
              {toneLabels[activeRule.mainTone]}
            </text>
            <text x={cx} y={cy - 20} textAnchor="middle" fill="#38bdf8" fontSize="10" fontWeight="700">
              {directionLabels[activeRule.direction]}
            </text>

            {/* Miniesfera 3D do Pigmento de Corte Principal no Centro */}
            {activeRule.outputs[0] && (
              <g>
                <ellipse cx={cx} cy={cy + 16} rx={16} ry={6} fill="rgba(0,0,0,0.5)" />
                <circle
                  cx={cx}
                  cy={cy + 6}
                  r={15}
                  fill={
                    activeRule.outputs[0].pigmentCharacteristic === "VIOLET"
                      ? "url(#sphere-violet)"
                      : activeRule.outputs[0].pigmentCharacteristic === "RED_OXIDE"
                        ? "url(#sphere-red-oxide)"
                        : activeRule.outputs[0].pigmentCharacteristic === "BLUE_GREEN"
                          ? "url(#sphere-blue-greenish)"
                          : activeRule.outputs[0].pigmentCharacteristic === "RED_BLUE"
                            ? "url(#sphere-blue-redish)"
                            : "url(#sphere-yellow-greenish)"
                  }
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
                <ellipse
                  cx={cx - 5}
                  cy={cy + 1}
                  rx={4}
                  ry={2.5}
                  transform={`rotate(-35, ${cx - 5}, ${cy + 1})`}
                  fill="rgba(255,255,255,0.9)"
                />
                <text x={cx} y={cy + 34} textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontWeight="800">
                  CORTA COM:
                </text>
                <text x={cx} y={cy + 46} textAnchor="middle" fill="#f8fafc" fontSize="9" fontWeight="800">
                  {pigmentLabels[activeRule.outputs[0].pigmentCharacteristic]}
                </text>
              </g>
            )}

            {/* Ângulo em Graus */}
            <text x={cx} y={cy + 66} textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="700">
              {activeAngle.toFixed(1)}°
            </text>
          </g>
        )}

        {/* 8. Agulha Mecanizada Rotativa de Alta Precisão */}
        <g
          className="compass-needle-assembly"
          style={{
            transform: `rotate(${activeAngle}deg)`,
            transformOrigin: `${cx}px ${cy}px`,
            transition: isDragging ? "none" : "transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          {/* Ponteiro Norte / Direção Ativa (Ponta Dourada/Branca) */}
          <path
            d={`M${cx - 5} ${cy - 88} L${cx} ${cy - 150} L${cx + 5} ${cy - 88} Z`}
            fill="url(#needle-gold)"
            filter="url(#glow-highlight)"
          />
          <path d={`M${cx} ${cy - 150} L${cx + 5} ${cy - 88} L${cx} ${cy - 88} Z`} fill="#a16207" />

          {/* Mira Circular na Esfera Alvo */}
          <circle cx={cx} cy={cy - 158} r={compact ? 19 : 25} fill="none" stroke="#facc15" strokeWidth={2} strokeDasharray="6 4" opacity={0.8} />

          {/* Contra-peso Sul (Ponteiro Oposto Curto) */}
          <path d={`M${cx - 4} ${cy + 88} L${cx} ${cy + 110} L${cx + 4} ${cy + 88} Z`} fill="url(#needle-light)" />
          <path d={`M${cx} ${cy + 110} L${cx + 4} ${cy + 88} L${cx} ${cy + 88} Z`} fill="#475569" />
        </g>

        {/* 9. Pino Central Usinado / Capô de Rolamento */}
        <circle cx={cx} cy={cy} r={18} fill="url(#bezel-metal)" stroke="#475569" strokeWidth={2} filter="url(#dial-shadow)" />
        <circle cx={cx} cy={cy} r={12} fill="#090d16" stroke="#facc15" strokeWidth={1.5} />
        <circle cx={cx - 3} cy={cy - 3} r={3} fill="rgba(255,255,255,0.8)" />
      </svg>

      {/* Alternador de Vista (Frente / Ângulo) quando fornecido */}
      {!compact && onViewModeChange && (
        <div className="compass-viewmode-bar">
          <button
            type="button"
            className={`viewmode-btn ${viewMode === "ANGLE" ? "active" : ""}`}
            onClick={() => onViewModeChange("ANGLE")}
            title="Primeiro Ângulo (Flop) — Sempre avaliado primeiro na chapa com pigmentos sólidos."
          >
            <span className="mode-badge">1º PASSO</span>
            <span className="mode-title">Ângulo (Flop)</span>
          </button>
          <button
            type="button"
            className={`viewmode-btn ${viewMode === "FRONT" ? "active" : ""}`}
            onClick={() => onViewModeChange("FRONT")}
            title="Segunda Frente (Face) — Avaliada somente após o ângulo fechar. Alumínio e pérola fecham a frente."
          >
            <span className="mode-badge">2º PASSO</span>
            <span className="mode-title">Frente (Face)</span>
          </button>
        </div>
      )}
    </div>
  );
}

