"use client";

import { ArrowRight } from "lucide-react";
import type {
  CorrectionRule,
  ObservationView,
} from "@/domain/colorimetry/types";
import { toneLabels, directionLabels } from "@/domain/colorimetry/tones";
import { Dialog, Alert } from "@/components/ui";
import { Compass, ruleAngles } from "@/components/compass";
import { CompassDiagnosis, CompassShelf } from "@/components/compass-panels";

/**
 * Versão ampliada da Bússola Cromática: o mesmo instrumento em escala xl,
 * com o diagnóstico da chapa ao lado e a régua das 8 direções no rodapé.
 * O estado (regra ativa e modo de vista) vive no chamador, então abrir e
 * fechar o modal nunca perde a leitura em curso.
 */
export function CompassModal({
  rules,
  selected,
  onSelect,
  viewMode,
  onViewModeChange,
  close,
  onUse,
}: {
  rules: CorrectionRule[];
  selected?: CorrectionRule;
  onSelect: (rule: CorrectionRule) => void;
  viewMode: ObservationView;
  onViewModeChange: (mode: ObservationView) => void;
  close: () => void;
  onUse?: () => void;
}) {
  const angle = selected
    ? (ruleAngles[`${selected.mainTone}:${selected.direction}`] ?? 0)
    : 0;

  return (
    <Dialog
      size="wide"
      title="Bússola Cromática de Alta Precisão"
      close={close}
    >
      <div className="compass-modal-layout">
        <div className="compass-modal-dial">
          <Compass
            size="xl"
            rules={rules}
            selected={selected?.id}
            onSelect={onSelect}
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
          />
        </div>

        {selected && (
          <div className="compass-modal-side">
            <div className="result-header">
              <span className="eyebrow">DIAGNÓSTICO DA CHAPA</span>
              <h2>{selected.diagnosisLabel}</h2>
              <span className="tone-quadrant-badge">
                Tom {toneLabels[selected.mainTone]} · Direção{" "}
                {directionLabels[selected.direction]} · {angle.toFixed(1)}°
              </span>
            </div>

            <hr />

            <CompassDiagnosis rule={selected} />

            <div className="result-footer">
              <small className="result-source-meta">
                {selected.source} · Regra v{selected.version}
              </small>
              {onUse && (
                <button
                  type="button"
                  className="button primary w-full"
                  disabled={!selected.active}
                  onClick={onUse}
                >
                  Usar neste ajuste
                  <ArrowRight size={17} />
                </button>
              )}
              {!selected.active && (
                <Alert error>Regra desativada pela oficina.</Alert>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="compass-modal-shelf">
        <CompassShelf
          rules={rules}
          selected={selected}
          onSelect={onSelect}
          label="TROCAR DIREÇÃO SEM SAIR DO MOSTRADOR"
        />
      </div>
    </Dialog>
  );
}
