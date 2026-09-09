"use client";

import type {
  CorrectionRule,
  CorrectionRuleOutput,
} from "@/domain/colorimetry/types";
import {
  toneLabels,
  directionLabels,
  pigmentLabels,
} from "@/domain/colorimetry/tones";

// Explicações técnicas do Método Semida (Aula 42) para cada direção
export const methodInsights: Record<string, string> = {
  "YELLOW:REDISH":
    "Amarelo avermelhado tem excesso de calor alaranjado. O Azul Esverdeado corta a quentura sem acinzentar a mistura e sem gerar verde escuro indesejado.",
  "YELLOW:GREENISH":
    "Amarelo esverdeado puxa para o tom limão frio. O Azul Avermelhado ou Combo de Roxo corta a tendência verde mantendo o amarelo puro e luminoso.",
  "BLUE:REDISH":
    "Azul avermelhado tende para o violeta escuro. O Amarelo Limão clareia e traz o azul para o centro do espectro sem criar contaminação esverdeada.",
  "BLUE:GREENISH":
    "Azul esverdeado tem excesso de ciano. O Óxido Vermelho ou Violeta quebra a nuance verde sem comprometer a profundidade do azul.",
  "GREEN:YELLOWISH":
    "Verde amarelado tem excesso de luminosidade quente. O Violeta Roxo corta o amarelado devolvendo a vivacidade natural da cor.",
  "GREEN:BLUISH":
    "Verde azulado exige corte composto obrigatório: o Violeta Roxo corta o desvio cromático e o Óxido Vermelho neutraliza o excesso de profundidade fria.",
  "RED:BLUISH":
    "Vermelho azulado tem tendência framboesa/magenta. O Amarelo Limão neutraliza o tom frio e devolve o calor vermelho puro.",
  "RED:YELLOWISH":
    "Vermelho amarelado puxa para o coral/laranja. O Azul Avermelhado ou Violeta resfria a cor e reconstrói o corpo escarlate profundo.",
};

export function insightFor(rule: CorrectionRule) {
  return methodInsights[`${rule.mainTone}:${rule.direction}`];
}

const roleLabels: Record<CorrectionRuleOutput["role"], string> = {
  PRIMARY: "CORTE PRINCIPAL",
  COMBINED: "COMBINAÇÃO OBRIGATÓRIA",
  ALTERNATIVE: "ALTERNATIVA",
  SUPPORT: "SUPORTE OPCIONAL",
};

/** Pigmentos de corte da regra ativa e a lógica operacional do Método. */
export function CompassDiagnosis({ rule }: { rule: CorrectionRule }) {
  const insight = insightFor(rule);
  return (
    <div className="result-formula-section">
      <span className="eyebrow">
        FÓRMULA SECRETA SEMIDA · PIGMENTOS DE CORTE
      </span>

      <div className="cutting-pigments-grid">
        {rule.outputs.map((o) => (
          <div
            key={o.pigmentCharacteristic}
            className={`cutting-card ${o.role.toLowerCase()}`}
          >
            <div className="cutting-card-top">
              <span
                className={`pigment-sphere-sample ${o.pigmentCharacteristic.toLowerCase()}`}
              />
              <div>
                <span className="cutting-role-badge">{roleLabels[o.role]}</span>
                <h4>{pigmentLabels[o.pigmentCharacteristic]}</h4>
              </div>
            </div>
            {o.notes && <p className="cutting-note">{o.notes}</p>}
          </div>
        ))}
      </div>

      {insight && (
        <div className="insight-card">
          <span className="insight-title">LÓGICA OPERACIONAL DO CORTE</span>
          <p>{insight}</p>
        </div>
      )}
    </div>
  );
}

/** Régua de seleção direta das 8 direções fundamentais. */
export function CompassShelf({
  rules,
  selected,
  onSelect,
  label = "SELEÇÃO DIRETA DAS 8 DIREÇÕES FUNDAMENTAIS",
}: {
  rules: CorrectionRule[];
  selected?: CorrectionRule;
  onSelect: (rule: CorrectionRule) => void;
  label?: string;
}) {
  return (
    <div className="compass-selector-shelf">
      <span className="shelf-label">{label}</span>
      <div className="compass-options-grid">
        {rules.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`choice-card ${r.id === selected?.id ? "selected" : ""}`}
            aria-pressed={r.id === selected?.id}
            onClick={() => onSelect(r)}
          >
            <span
              className={`choice-sphere ${r.mainTone.toLowerCase()} ${r.direction.toLowerCase()}`}
            />
            <div className="choice-text">
              <span className="choice-main">{toneLabels[r.mainTone]}</span>
              <span className="choice-dir">{directionLabels[r.direction]}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
