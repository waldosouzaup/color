"use client";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ArrowRight, ArrowLeft, Check, Scale } from "lucide-react";
import { Field, Alert } from "@/components/ui";
import {
  toneLabels,
  directionLabels,
  validDirections,
  pigmentLabels,
} from "@/domain/colorimetry/tones";
import {
  primaryTones,
  type PrimaryTone,
  type ToneDirection,
  type CorrectionRule,
  type Severity,
  type PigmentCharacteristic,
} from "@/domain/colorimetry/types";
import type { Adjustment, Workspace } from "@/lib/client-types";
import { action, mutation, formatMass, lightingLabels } from "@/lib/client-api";
type AdditionDraft = {
  characteristic: PigmentCharacteristic;
  pigmentId?: string;
  code: string;
  name: string;
  addedAmountG: string;
};
const doseResponse = z.object({
  dose: z
    .object({
      suggestedAmountG: z.string(),
      gramsPer100g: z.string(),
      coefficientId: z.string(),
    })
    .nullable(),
});
function AdditionInput({
  row,
  change,
  session,
  rule,
  severity,
  workspace,
}: {
  row: AdditionDraft;
  change: (row: AdditionDraft) => void;
  session: Adjustment;
  rule: CorrectionRule;
  severity: Severity;
  workspace: Workspace;
}) {
  const [dose, setDose] = useState<z.infer<typeof doseResponse>["dose"]>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let cancelled = false;
    action("diagnose", {
      diagnosis: { mainTone: rule.mainTone, direction: rule.direction },
      sessionId: session.id,
      severity,
      pigmentId: row.pigmentId,
    })
      .then((result) => {
        if (!cancelled) {
          setDose(doseResponse.parse(result).dose);
          setError("");
        }
      })
      .catch((e) => {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Erro ao consultar dosagem.",
          );
      });
    return () => {
      cancelled = true;
    };
  }, [rule, session.id, severity, row.pigmentId]);
  const bases = workspace.pigments.filter(
    (p) => p.active && p.characteristic === row.characteristic,
  );
  return (
    <div className="addition-card">
      <h3>
        <span className={`pigment-dot ${row.characteristic.toLowerCase()}`} />
        {pigmentLabels[row.characteristic]}
      </h3>
      <Field label="Base utilizada">
        <select
          value={row.pigmentId || ""}
          onChange={(e) => {
            const p = bases.find((b) => b.id === e.target.value);
            setDose(null);
            change({
              ...row,
              pigmentId: p?.id,
              code: p?.code || "",
              name: p?.name || "",
            });
          }}
        >
          <option value="">Informar código e nome manualmente</option>
          {bases.map((p) => (
            <option key={p.id} value={p.id}>
              {p.code} · {p.name}
              {p.isDemo ? " [DADO DEMONSTRATIVO]" : ""}
            </option>
          ))}
        </select>
      </Field>
      <div className="form-grid">
        <Field label="Código do pigmento">
          <input
            required
            value={row.code}
            readOnly={!!row.pigmentId}
            onChange={(e) => change({ ...row, code: e.target.value })}
          />
        </Field>
        <Field label="Nome do pigmento">
          <input
            required
            value={row.name}
            readOnly={!!row.pigmentId}
            onChange={(e) => change({ ...row, name: e.target.value })}
          />
        </Field>
      </div>
      {error ? (
        <Alert error>{error}</Alert>
      ) : dose ? (
        <div className="dose calibrated">
          <Scale size={22} />
          <div>
            <strong>
              Quantidade inicial calculada:{" "}
              {formatMass(
                dose.suggestedAmountG,
                workspace.organization.precision,
              )}{" "}
              g
            </strong>
            <p>
              {formatMass(session.currentMassG)} g × {dose.gramsPer100g} g / 100
              g · Coeficiente validado
            </p>
          </div>
        </div>
      ) : (
        <div className="dose">
          <Scale size={22} />
          <div>
            <strong>DOSAGEM NÃO CALIBRADA</strong>
            <p>
              O método determinou a direção e o pigmento corretivo, mas ainda
              não existe coeficiente quantitativo validado para esta combinação.
            </p>
          </div>
        </div>
      )}
      <Field
        label="Quantidade efetivamente adicionada (g)"
        hint="Registro manual da adição realizada na balança."
      >
        <input
          required
          inputMode="decimal"
          value={row.addedAmountG}
          onChange={(e) =>
            change({ ...row, addedAmountG: e.target.value.replace(",", ".") })
          }
          placeholder="0.00"
        />
      </Field>
    </div>
  );
}
export function Diagnosis({
  session,
  workspace,
  done,
  initialRule,
}: {
  session: Adjustment;
  workspace: Workspace;
  done: () => Promise<void>;
  initialRule?: CorrectionRule;
}) {
  const [step, setStep] = useState(initialRule ? 2 : 0);
  const [tone, setTone] = useState<PrimaryTone | null>(
    initialRule?.mainTone || null,
  );
  const [direction, setDirection] = useState<ToneDirection | null>(
    initialRule?.direction || null,
  );
  const [severity, setSeverity] = useState<Severity>("LIGHT");
  const [lighting, setLighting] = useState("SUNLIGHT");
  const [notes, setNotes] = useState("");
  const [frontNotes, setFrontNotes] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [additions, setAdditions] = useState<AdditionDraft[]>([]);
  const rule = workspace.rules.find(
    (r) => r.mainTone === tone && r.direction === direction && r.active,
  );
  function configure(r: CorrectionRule) {
    const outputs = r.outputs
      .filter((o) => o.required || o.role === "ALTERNATIVE")
      .filter(
        (o, i, arr) =>
          o.role !== "ALTERNATIVE" ||
          arr.findIndex((v) => v.role === "ALTERNATIVE") === i,
      );
    setAdditions(
      outputs.map((o) => ({
        characteristic: o.pigmentCharacteristic,
        code: "",
        name: "",
        addedAmountG: "",
      })),
    );
    setStep(3);
  }
  return (
    <div className="stack">
      <div className="mini-steps">
        {["Tom principal", "Direção", "Diagnóstico", "Registrar adição"].map(
          (s, i) => (
            <span key={s} className={step === i ? "active" : ""}>
              {i + 1}. {s}
            </span>
          ),
        )}
      </div>
      {step === 0 && (
        <>
          <div>
            <span className="eyebrow">OBSERVAÇÃO · PRIMEIRO ÂNGULO</span>
            <h2>Qual é o tom principal observado no ângulo?</h2>
            <p>Compare a chapa aplicada com a cor de referência.</p>
          </div>
          <div className="tone-grid">
            {primaryTones.map((t) => (
              <button
                type="button"
                className={`choice tone-choice ${t.toLowerCase()}`}
                key={t}
                onClick={() => {
                  setTone(t);
                  setDirection(null);
                  setStep(1);
                }}
              >
                <span className="tone-swatch" />
                <strong>{toneLabels[t]}</strong>
                <ArrowRight size={16} />
              </button>
            ))}
          </div>
        </>
      )}
      {step === 1 && tone && (
        <>
          <h2>
            Para qual direção o {toneLabels[tone].toLowerCase()} está puxando?
          </h2>
          <div className="tone-grid">
            {validDirections[tone].map((d) => (
              <button
                className="choice"
                key={d}
                onClick={() => {
                  setDirection(d);
                  setStep(2);
                }}
              >
                <strong>{directionLabels[d]}</strong>
                <ArrowRight size={18} />
              </button>
            ))}
          </div>
          <button className="button secondary" onClick={() => setStep(0)}>
            <ArrowLeft size={16} />
            Rever tom principal
          </button>
        </>
      )}
      {step === 2 && (
        <>
          {rule ? (
            <>
              <div className="diagnosis-result">
                <span className="eyebrow">
                  DIAGNÓSTICO PELO MÉTODO DO MESTRE
                </span>
                <h2>{rule.diagnosisLabel}</h2>
                <p>Correção de matiz indicada</p>
                <div className="correction-output">
                  {rule.outputs.map((o, i) => (
                    <span key={o.pigmentCharacteristic}>
                      {i > 0 && (
                        <small>{o.role === "ALTERNATIVE" ? "ou" : "+"}</small>
                      )}
                      <span
                        className={`pigment-dot ${o.pigmentCharacteristic.toLowerCase()}`}
                      />
                      <span>{pigmentLabels[o.pigmentCharacteristic]}</span>
                      {o.role === "SUPPORT" && <small>opcional</small>}
                    </span>
                  ))}
                </div>
                <p>{rule.notes}</p>
                <small>
                  Regra{" "}
                  {rule.id.startsWith("rule-")
                    ? rule.id.replace("rule-", "")
                    : "da oficina"}{" "}
                  · Versão {rule.version}
                </small>
              </div>
              <div className="form-grid">
                <Field label="Intensidade da diferença">
                  <select
                    value={severity}
                    onChange={(e) => {
                      if (
                        e.target.value === "LIGHT" ||
                        e.target.value === "MEDIUM" ||
                        e.target.value === "STRONG"
                      )
                        setSeverity(e.target.value);
                    }}
                  >
                    <option value="LIGHT">Leve</option>
                    <option value="MEDIUM">Média</option>
                    <option value="STRONG">Forte</option>
                  </select>
                </Field>
                <Field label="Iluminação da avaliação">
                  <select
                    value={lighting}
                    onChange={(e) => setLighting(e.target.value)}
                  >
                    {Object.entries(lightingLabels).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
              <div className="form-footer">
                <button className="button secondary" onClick={() => setStep(1)}>
                  Rever direção
                </button>
                <button
                  className="button primary"
                  onClick={() => configure(rule)}
                >
                  Continuar para adição
                  <ArrowRight size={16} />
                </button>
              </div>
            </>
          ) : (
            <Alert error>
              Nenhuma regra ativa para esta combinação. Consulte a
              administração.
            </Alert>
          )}
        </>
      )}
      {step === 3 && rule && (
        <form
          className="stack"
          onSubmit={async (e) => {
            e.preventDefault();
            if (pending) return;
            setPending(true);
            setError("");
            try {
              await mutation("correction", {
                sessionId: session.id,
                expectedVersion: session.version,
                diagnosis: { mainTone: tone, direction },
                severity,
                view: "ANGLE",
                lightingCondition: lighting,
                notes,
                frontNotes,
                additions,
              });
              await done();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Erro ao registrar.");
            } finally {
              setPending(false);
            }
          }}
        >
          <div className="split">
            <h2>Registrar correção</h2>
            <span className="badge">
              MASSA ATUAL {formatMass(session.currentMassG)} g
            </span>
          </div>
          {rule.outputs.some((o) => o.role === "ALTERNATIVE") && (
            <Field label="Alternativa de correção">
              <select
                value={additions[0]?.characteristic}
                onChange={(e) => {
                  const output = rule.outputs.find(
                    (o) => o.pigmentCharacteristic === e.target.value,
                  );
                  if (output)
                    setAdditions([
                      {
                        characteristic: output.pigmentCharacteristic,
                        code: "",
                        name: "",
                        addedAmountG: "",
                      },
                    ]);
                }}
              >
                {rule.outputs
                  .filter((o) => o.role === "ALTERNATIVE")
                  .map((o) => (
                    <option
                      key={o.pigmentCharacteristic}
                      value={o.pigmentCharacteristic}
                    >
                      {pigmentLabels[o.pigmentCharacteristic]}
                    </option>
                  ))}
              </select>
            </Field>
          )}
          {rule.outputs
            .filter((o) => o.role === "SUPPORT")
            .map((o) => (
              <label className="checkbox" key={o.pigmentCharacteristic}>
                <input
                  type="checkbox"
                  checked={additions.some(
                    (a) => a.characteristic === o.pigmentCharacteristic,
                  )}
                  onChange={(e) =>
                    setAdditions(
                      e.target.checked
                        ? [
                            ...additions,
                            {
                              characteristic: o.pigmentCharacteristic,
                              code: "",
                              name: "",
                              addedAmountG: "",
                            },
                          ]
                        : additions.filter(
                            (a) => a.characteristic !== o.pigmentCharacteristic,
                          ),
                    )
                  }
                />
                Incluir suporte vermelho, quando necessário
              </label>
            ))}
          {additions.map((row, i) => (
            <AdditionInput
              key={row.characteristic}
              row={row}
              change={(r) =>
                setAdditions(additions.map((a, j) => (i === j ? r : a)))
              }
              session={session}
              rule={rule}
              severity={severity}
              workspace={workspace}
            />
          ))}
          {session.iterations.length > 0 && (
            <Field
              label="Reavaliação da frente"
              hint="Registre luminosidade e aparência das partículas separadamente da matiz."
            >
              <textarea
                required
                value={frontNotes}
                onChange={(e) => setFrontNotes(e.target.value)}
              />
            </Field>
          )}
          <Field label="Observações do ângulo e da adição">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
          {error && <Alert error>{error}</Alert>}
          <div className="form-footer">
            <button
              type="button"
              className="button secondary"
              onClick={() => setStep(2)}
            >
              Voltar
            </button>
            <button className="button primary" disabled={pending}>
              <Check size={17} />
              {pending ? "Registrando…" : "Confirmar adição realizada"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
