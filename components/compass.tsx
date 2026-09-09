"use client";
import type { CorrectionRule } from "@/domain/colorimetry/types";
import { toneLabels, directionLabels } from "@/domain/colorimetry/tones";
const colors = {
  YELLOW: "#eab83d",
  BLUE: "#4686cd",
  GREEN: "#4b9e7a",
  RED: "#cd635b",
};
function point(angle: number, radius: number) {
  const a = ((angle - 90) * Math.PI) / 180;
  return [200 + radius * Math.cos(a), 200 + radius * Math.sin(a)];
}
export function Compass({
  rules,
  selected,
  onSelect,
  compact = false,
}: {
  rules: CorrectionRule[];
  selected?: string;
  onSelect: (rule: CorrectionRule) => void;
  compact?: boolean;
}) {
  const order = [
    "YELLOW:GREENISH",
    "YELLOW:REDISH",
    "BLUE:REDISH",
    "BLUE:GREENISH",
    "RED:YELLOWISH",
    "RED:BLUISH",
    "GREEN:BLUISH",
    "GREEN:YELLOWISH",
  ];
  const sorted = [...rules].sort(
    (a, b) =>
      order.indexOf(`${a.mainTone}:${a.direction}`) -
      order.indexOf(`${b.mainTone}:${b.direction}`),
  );
  return (
    <svg
      className={`compass ${compact ? "compact" : ""}`}
      viewBox="0 0 400 400"
      role="group"
      aria-label="Bússola: oito direções do Método do Mestre"
    >
      <circle cx="200" cy="200" r="190" fill="#fff" stroke="#e7e9e4" />
      {sorted.map((r, i) => {
        const a = point(i * 45 + 1.5, 178),
          b = point((i + 1) * 45 - 1.5, 178),
          c = point((i + 1) * 45 - 1.5, 78),
          d = point(i * 45 + 1.5, 78),
          label = point(i * 45 + 22.5, 132);
        return (
          <g
            key={r.id}
            role="button"
            tabIndex={0}
            aria-label={r.diagnosisLabel}
            aria-pressed={selected === r.id}
            onClick={() => onSelect(r)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect(r);
              }
            }}
            className="compass-sector"
          >
            <path
              d={`M${a.join(",")} A178 178 0 0 1 ${b.join(",")} L${c.join(",")} A78 78 0 0 0 ${d.join(",")} Z`}
              fill={colors[r.mainTone]}
              fillOpacity={selected === r.id ? 1 : 0.2}
              stroke={colors[r.mainTone]}
              strokeWidth={selected === r.id ? 3 : 1}
            />
            <text
              x={label[0]}
              y={label[1] - 4}
              textAnchor="middle"
              fill="#243830"
              fontSize="11"
              fontWeight="750"
            >
              {toneLabels[r.mainTone]}
            </text>
            <text
              x={label[0]}
              y={label[1] + 11}
              textAnchor="middle"
              fill="#243830"
              fontSize="9"
            >
              {directionLabels[r.direction]}
            </text>
          </g>
        );
      })}
      <circle cx="200" cy="200" r="66" fill="#f8faf6" stroke="#dce4dc" />
      <path
        d="M200 160 L208 192 L232 200 L208 208 L200 240 L192 208 L168 200 L192 192Z"
        fill="#254f42"
      />
      <circle cx="200" cy="200" r="5" fill="#f8faf6" />
    </svg>
  );
}
