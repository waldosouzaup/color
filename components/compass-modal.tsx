"use client";

import { ArrowRight } from "lucide-react";
import type { CorrectionRule, ObservationView } from "@/domain/colorimetry/types";
import { toneLabels, directionLabels } from "@/domain/colorimetry/tones";
import { Dialog, Alert } from "@/components/ui";
import { Compass } from "@/components/compass";
import {
  CompassDiagnosis,
  CompassShelf,
  ObservationModeBar,
} from "@/components/compass-panels";
import {
  canUseInAdjustment,
  resolveSelection,
  type CompassSelection,
} from "@/domain/compass/selection";

/**
 * Mostrador ampliado: o mesmo instrumento em escala xl, com a leitura ao lado.
 * O estado (posição e vista) vive no chamador, então abrir e fechar o modal
 * nunca perde a consulta em curso.
 */
export function CompassModal({
  rules,
  selection,
  onSelect,
  viewMode,
  onViewModeChange,
  close,
  onUse,
}: {
  rules: CorrectionRule[];
  selection: CompassSelection;
  onSelect: (selection: CompassSelection) => void;
  viewMode: ObservationView;
  onViewModeChange: (mode: ObservationView) => void;
  close: () => void;
  onUse?: () => void;
}) {
  const resolution = resolveSelection(rules, selection);
  const usable = canUseInAdjustment(resolution);

  return (
    <Dialog size="wide" title="Bússola da Colorimetria" close={close}>
      <div className="compass-modal-layout">
        <div className="compass-modal-dial">
          <Compass
            size="xl"
            rules={rules}
            selection={selection}
            onSelect={onSelect}
          />
          <ObservationModeBar mode={viewMode} onChange={onViewModeChange} />
        </div>

        <div className="compass-modal-side">
          <div className="result-header">
            <span className="eyebrow">LEITURA DA POSIÇÃO</span>
            <h2>
              {resolution.status === "FAMILY"
                ? toneLabels[resolution.mainTone]
                : `${toneLabels[resolution.mainTone]} ${directionLabels[
                    resolution.direction
                  ].toLowerCase()}`}
            </h2>
            <span className="tone-quadrant-badge">
              Tom {toneLabels[resolution.mainTone]}
              {resolution.status !== "FAMILY" &&
                ` · Direção ${directionLabels[resolution.direction]}`}
            </span>
          </div>

          <hr />

          <CompassDiagnosis resolution={resolution} onSelect={onSelect} />

          <div className="result-footer">
            {resolution.status === "RULE" && (
              <small className="result-source-meta">
                {resolution.rule.source} · Regra v{resolution.rule.version}
              </small>
            )}
            {onUse && (
              <button
                type="button"
                className="button primary w-full"
                disabled={!usable}
                onClick={onUse}
              >
                Usar neste ajuste
                <ArrowRight size={17} />
              </button>
            )}
            {resolution.status === "RULE" && !resolution.rule.active && (
              <Alert error>
                Regra desativada pela oficina: consulta permitida, uso bloqueado.
              </Alert>
            )}
            {viewMode === "FRONT" && usable && (
              <Alert>
                A consulta está em Frente, mas o diagnóstico registrado é sempre
                do ângulo.
              </Alert>
            )}
          </div>
        </div>
      </div>

      <div className="compass-modal-shelf">
        <CompassShelf
          rules={rules}
          selection={selection}
          onSelect={onSelect}
          label="TROCAR A POSIÇÃO SEM SAIR DO MOSTRADOR"
        />
      </div>
    </Dialog>
  );
}
