"use client";

import type { CorrectionRule, ObservationView } from "@/domain/colorimetry/types";
import { primaryTones } from "@/domain/colorimetry/types";
import {
  toneLabels,
  directionLabels,
  pigmentLabels,
  validDirections,
} from "@/domain/colorimetry/tones";
import { directionSectors } from "@/domain/compass/geometry";
import {
  describeOutputs,
  findRule,
  usesDocumentedOutputs,
  type CompassResolution,
  type CompassSelection,
} from "@/domain/compass/selection";
import { Alert } from "@/components/ui";

/**
 * Explicações do método para a matriz documentada. Só podem ser exibidas quando
 * a regra vigente ainda corresponde a essa matriz: uma customização da oficina
 * receberia um texto citando pigmento que ela removeu.
 */
export const methodInsights: Record<string, string> = {
  "YELLOW:REDISH":
    "Amarelo avermelhado tem excesso de calor alaranjado. O azul esverdeado corta a quentura sem acinzentar a mistura.",
  "YELLOW:GREENISH":
    "Amarelo esverdeado puxa para o tom limão frio. O azul avermelhado ou o violeta corta a tendência verde mantendo o amarelo limpo.",
  "BLUE:REDISH":
    "Azul avermelhado tende para o violeta escuro. O amarelo limão clareia e recentra o azul sem contaminação esverdeada.",
  "BLUE:GREENISH":
    "Azul esverdeado tem excesso de ciano. O óxido vermelho ou o violeta quebra a nuance verde sem perder profundidade.",
  "GREEN:YELLOWISH":
    "Verde amarelado tem excesso de luminosidade quente. O violeta corta o amarelado e devolve a vivacidade da cor.",
  "GREEN:BLUISH":
    "Verde azulado exige corte composto: o violeta corta o desvio cromático e o óxido vermelho neutraliza o excesso frio.",
  "RED:BLUISH":
    "Vermelho azulado tem tendência framboesa. O amarelo limão neutraliza o tom frio e devolve o vermelho puro.",
  "RED:YELLOWISH":
    "Vermelho amarelado puxa para o coral. O azul avermelhado ou o violeta resfria a cor e reconstrói o corpo escarlate.",
};

/** Explicação segura: fixa só se a regra bate com a matriz; senão, a nota da própria regra. */
export function insightFor(rule: CorrectionRule): string | undefined {
  if (usesDocumentedOutputs(rule))
    return methodInsights[`${rule.mainTone}:${rule.direction}`];
  return rule.notes?.trim() || undefined;
}

/** Saídas completas da regra, com papéis, conectivos e obrigatoriedade. */
export function CompassOutputs({ rule }: { rule: CorrectionRule }) {
  const description = describeOutputs(rule);
  return (
    <div className="result-formula-section">
      <span className="eyebrow">PIGMENTOS DE CORTE DA REGRA VIGENTE</span>

      <p className="cutting-summary">{description.summary}</p>

      <div className="cutting-pigments-grid">
        {description.items.map((item) => (
          <div
            key={item.output.pigmentCharacteristic}
            className={`cutting-card ${item.output.role.toLowerCase()}`}
          >
            {item.connector && (
              <span className="cutting-connector">{item.connector}</span>
            )}
            <div className="cutting-card-top">
              <span
                className={`pigment-sphere-sample ${item.output.pigmentCharacteristic.toLowerCase()}`}
              />
              <div>
                <span className="cutting-role-badge">{item.roleLabel}</span>
                <h4>{pigmentLabels[item.output.pigmentCharacteristic]}</h4>
              </div>
            </div>
            {item.output.notes && (
              <p className="cutting-note">{item.output.notes}</p>
            )}
          </div>
        ))}
      </div>

      {insightFor(rule) && (
        <div className="insight-card">
          <span className="insight-title">LÓGICA OPERACIONAL DO CORTE</span>
          <p>{insightFor(rule)}</p>
        </div>
      )}
    </div>
  );
}

/**
 * Leitura da posição selecionada: família sem subtom, regra resolvida ou
 * ausência de regra. Um tom fundamental nunca produz correção automática.
 */
export function CompassDiagnosis({
  resolution,
  onSelect,
}: {
  resolution: CompassResolution;
  onSelect?: (selection: CompassSelection) => void;
}) {
  if (resolution.status === "FAMILY")
    return (
      <div className="result-formula-section">
        <span className="eyebrow">TOM PRINCIPAL SELECIONADO</span>
        <p className="cutting-summary">
          Escolha a direção do subtom observado no ângulo para consultar o corte.
        </p>
        <div className="compass-direction-choice">
          {resolution.directions.map((direction) => (
            <button
              key={direction}
              type="button"
              className="button secondary"
              onClick={() =>
                onSelect?.({ mainTone: resolution.mainTone, direction })
              }
            >
              {toneLabels[resolution.mainTone]} {directionLabels[direction].toLowerCase()}
            </button>
          ))}
        </div>
      </div>
    );

  if (resolution.status === "MISSING")
    return (
      <Alert error>
        Nenhuma regra ativa para {toneLabels[resolution.mainTone].toLowerCase()}{" "}
        {directionLabels[resolution.direction].toLowerCase()} nesta oficina.
        Consulte a administração.
      </Alert>
    );

  return <CompassOutputs rule={resolution.rule} />;
}

/** Contexto de observação da chapa. Não muda a regra nem o disco. */
export function ObservationModeBar({
  mode,
  onChange,
}: {
  mode: ObservationView;
  onChange: (mode: ObservationView) => void;
}) {
  return (
    <div className="compass-viewmode-bar" role="group" aria-label="Vista avaliada na chapa">
      <button
        type="button"
        className={`viewmode-btn ${mode === "ANGLE" ? "active" : ""}`}
        aria-pressed={mode === "ANGLE"}
        onClick={() => onChange("ANGLE")}
      >
        <span className="mode-badge">1º PASSO</span>
        <span className="mode-title">Ângulo (flop)</span>
      </button>
      <button
        type="button"
        className={`viewmode-btn ${mode === "FRONT" ? "active" : ""}`}
        aria-pressed={mode === "FRONT"}
        onClick={() => onChange("FRONT")}
      >
        <span className="mode-badge">2º PASSO</span>
        <span className="mode-title">Frente (face)</span>
      </button>
    </div>
  );
}

/**
 * Controles HTML equivalentes ao disco: quatro famílias e as oito direções.
 * Mesma seleção, mesmo estado, com nome acessível e foco visível.
 */
export function CompassShelf({
  rules,
  selection,
  onSelect,
  label = "SELEÇÃO DIRETA: QUATRO TONS E OITO DIREÇÕES",
}: {
  rules: CorrectionRule[];
  selection: CompassSelection | null;
  onSelect: (selection: CompassSelection) => void;
  label?: string;
}) {
  return (
    <div className="compass-selector-shelf">
      <span className="shelf-label">{label}</span>

      <div className="compass-family-row" role="group" aria-label="Tom principal">
        {primaryTones.map((tone) => (
          <button
            key={tone}
            type="button"
            className={`family-card ${tone.toLowerCase()} ${
              selection?.mainTone === tone && !selection.direction ? "selected" : ""
            }`}
            aria-label={toneLabels[tone]}
            aria-pressed={selection?.mainTone === tone && !selection.direction}
            onClick={() => onSelect({ mainTone: tone, direction: null })}
          >
            <span className={`family-sphere ${tone.toLowerCase()}`} />
            <span className="choice-main">{toneLabels[tone]}</span>
            <small>
              {validDirections[tone]
                .map((d) => directionLabels[d].toLowerCase())
                .join(" · ")}
            </small>
          </button>
        ))}
      </div>

      <div className="compass-options-grid">
        {directionSectors.map((sector) => {
          const rule = findRule(rules, sector.mainTone, sector.direction);
          const selected =
            selection?.mainTone === sector.mainTone &&
            selection?.direction === sector.direction;
          return (
            <button
              key={sector.ruleKey}
              type="button"
              className={`choice-card ${selected ? "selected" : ""} ${
                rule?.active ? "" : "unavailable"
              }`}
              aria-pressed={selected}
              onClick={() =>
                onSelect({
                  mainTone: sector.mainTone,
                  direction: sector.direction,
                })
              }
            >
              <span
                className={`choice-sphere ${sector.mainTone.toLowerCase()} ${sector.direction.toLowerCase()}`}
              />
              <div className="choice-text">
                <span className="choice-main">
                  {toneLabels[sector.mainTone]}{" "}
                  {directionLabels[sector.direction].toLowerCase()}
                </span>
                <span className="choice-dir">
                  {!rule
                    ? "sem regra cadastrada"
                    : !rule.active
                      ? "regra desativada"
                      : describeOutputs(rule).summary}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
