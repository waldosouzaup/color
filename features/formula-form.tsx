"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Field, Alert, Heading, value } from "@/components/ui";
import { mutation, paintLabels, formatMass } from "@/lib/client-api";
import type { Formula } from "@/lib/client-types";
import { normalizeWeights, sumMass } from "@/domain/colorimetry/weights";
type ComponentRow = { code: string; name: string; weightG: string };
export function FormulaForm({
  standalone = false,
  refresh,
  initial,
}: {
  standalone?: boolean;
  refresh: () => Promise<void>;
  initial?: Formula;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [components, setComponents] = useState<ComponentRow[]>(
    initial?.components.map((c) => ({
      code: c.code,
      name: c.name,
      weightG: c.weightG,
    })) || [{ code: "", name: "", weightG: "" }],
  );
  const [mode, setMode] = useState<"INDIVIDUAL" | "CUMULATIVE" | "">(
    initial ? "INDIVIDUAL" : "",
  );
  const [paintType, setPaintType] = useState(initial?.paintType || "METALLIC");
  const [fields, setFields] = useState<Record<string, string>>({
    manufacturer: initial?.manufacturer || "",
    model: initial?.model || "",
    year: initial?.year || "",
    colorCode: initial?.colorCode || "",
    description: initial?.description || "",
    paintSystem: initial?.paintSystem || "",
    paintManufacturer: initial?.paintManufacturer || "",
    productLine: initial?.productLine || "",
    desiredMassG: initial?.desiredMassG || "",
    source: initial ? "SAVED_COLOR_BANK" : "MANUAL_ENTRY",
    notes: "",
  });
  const [isDemo, setIsDemo] = useState(initial?.isDemo || false);
  const labels = ["Identificação", "Fórmula de partida", "Tipo de tinta"];
  function field(name: string, label: string, placeholder = "", type = "text") {
    return (
      <Field label={label}>
        <input
          name={name}
          type={type}
          value={fields[name]}
          placeholder={placeholder}
          required={name !== "notes"}
          onChange={(e) => setFields({ ...fields, [name]: e.target.value })}
        />
      </Field>
    );
  }
  let total = "—";
  try {
    if (mode)
      total = formatMass(
        sumMass(
          "0",
          normalizeWeights(
            components.map((c) => c.weightG),
            mode,
          ),
        ),
      );
  } catch {
    /* Formulário incompleto; o backend valida ao salvar. */
  }
  return (
    <>
      <Heading
        eyebrow="BANCADA DE TRABALHO"
        title={standalone ? "Cadastrar fórmula" : "Novo ajuste"}
        description="Comece pela fórmula de origem. Cada correção será registrada separadamente."
      />
      <div className="wizard-layout">
        <aside className="step-list">
          {labels.map((label, i) => (
            <div
              className={step === i ? "current" : step > i ? "complete" : ""}
              key={label}
            >
              <span>{step > i ? <Check size={16} /> : `0${i + 1}`}</span>
              <div>
                {label}
                <small>
                  {
                    [
                      "Veículo e origem da cor",
                      "Componentes e pesagem",
                      "Confirmar preparação",
                    ][i]
                  }
                </small>
              </div>
            </div>
          ))}
          <div className="method-note">
            PRIMEIRO, O ÂNGULO
            <p>
              Após preparar a mistura, aplique a chapa e observe o ângulo antes
              de corrigir.
            </p>
          </div>
        </aside>
        <section className="panel form-panel">
          <div className="section-title">
            <div>
              <span className="eyebrow">PASSO {step + 1} DE 3</span>
              <h2>{labels[step]}</h2>
            </div>
            <span className="badge">FÓRMULA ORIGINAL</span>
          </div>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              if (step < 2) {
                setStep(step + 1);
                return;
              }
              setPending(true);
              try {
                const result = await mutation(
                  standalone ? "createFormula" : "createAdjustment",
                  {
                    ...fields,
                    paintType,
                    weightMode: mode,
                    components,
                    isDemo,
                  },
                );
                await refresh();
                router.push(
                  standalone
                    ? `/formulas/${result.id}`
                    : `/sessions/${result.id}`,
                );
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Erro ao salvar.",
                );
              } finally {
                setPending(false);
              }
            }}
          >
            {step === 0 && (
              <>
                <div className="form-grid">
                  {field("manufacturer", "Montadora", "Ex.: Chevrolet")}
                  {field("model", "Modelo", "Modelo do veículo")}
                  {field("year", "Ano", "2024", "number")}
                  {field("colorCode", "Código da cor", "Código de referência")}
                </div>
                {field(
                  "description",
                  "Descrição da cor",
                  "Nome ou identificação da cor",
                )}
                <Field label="Origem da fórmula">
                  <select
                    name="source"
                    value={fields.source}
                    onChange={(e) =>
                      setFields({ ...fields, source: e.target.value })
                    }
                  >
                    <option value="MANUAL_ENTRY">
                      Digitada pelo profissional
                    </option>
                    <option value="OFFICIAL_SYSTEM">
                      Sistema oficial do fabricante
                    </option>
                    <option value="CUSTOM_FORMULA">Fórmula própria</option>
                    <option value="SAVED_COLOR_BANK">Banco de Cores</option>
                    <option value="OTHER">Outra origem</option>
                  </select>
                </Field>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={isDemo}
                    onChange={(e) => setIsDemo(e.target.checked)}
                  />
                  Dado demonstrativo / treinamento
                </label>
              </>
            )}
            {step === 1 && (
              <>
                <div className="form-grid">
                  {field("paintManufacturer", "Fabricante da tinta")}
                  {field("productLine", "Linha de produtos")}
                  {field(
                    "paintSystem",
                    "Sistema de pintura",
                    "Ex.: Base solvente",
                  )}
                  {field("desiredMassG", "Peso da mistura (g)", "500.00")}
                </div>
                <Field
                  label="Modo de pesagem"
                  hint="Selecione como os pesos aparecem na sua fórmula."
                >
                  <select
                    value={mode}
                    required
                    onChange={(e) =>
                      setMode(
                        e.target.value === "CUMULATIVE"
                          ? "CUMULATIVE"
                          : e.target.value === "INDIVIDUAL"
                            ? "INDIVIDUAL"
                            : "",
                      )
                    }
                  >
                    <option value="">Selecione o modo</option>
                    <option value="INDIVIDUAL">
                      Individual — peso de cada base
                    </option>
                    <option value="CUMULATIVE">
                      Acumulada — leitura progressiva da balança
                    </option>
                  </select>
                </Field>
                <div className="component-list">
                  {components.map((c, i) => (
                    <div className="component-row" key={i}>
                      <span className="row-number">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {(["code", "name", "weightG"] as const).map((key, j) => (
                        <Field
                          key={key}
                          label={
                            [
                              "Código",
                              "Nome da base",
                              mode === "CUMULATIVE"
                                ? "Acumulado (g)"
                                : "Peso (g)",
                            ][j]
                          }
                        >
                          <input
                            aria-label={`${["Código", "Nome", "Peso"][j]} do componente ${i + 1}`}
                            required
                            value={c[key]}
                            inputMode={key === "weightG" ? "decimal" : "text"}
                            onChange={(e) =>
                              setComponents(
                                components.map((row, index) =>
                                  index === i
                                    ? {
                                        ...row,
                                        [key]: e.target.value.replace(
                                          key === "weightG" ? "," : "\0",
                                          ".",
                                        ),
                                      }
                                    : row,
                                ),
                              )
                            }
                          />
                        </Field>
                      ))}
                      <button
                        type="button"
                        className="icon-button danger"
                        aria-label={`Remover componente ${i + 1}`}
                        disabled={components.length === 1}
                        onClick={() =>
                          setComponents(components.filter((_, j) => j !== i))
                        }
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="split">
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() =>
                      setComponents([
                        ...components,
                        { code: "", name: "", weightG: "" },
                      ])
                    }
                  >
                    <Plus size={16} />
                    Adicionar componente
                  </button>
                  <strong>Total: {total} g</strong>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <p>
                  O tipo de tinta orienta o registro de efeito, frente e ângulo.
                </p>
                <div className="tone-grid">
                  {Object.entries(paintLabels).map(([key, label]) => (
                    <button
                      type="button"
                      key={key}
                      className={`choice ${paintType === key ? "selected" : ""}`}
                      onClick={() => {
                        if (
                          key === "SOLID" ||
                          key === "METALLIC" ||
                          key === "PEARL" ||
                          key === "OTHER"
                        )
                          setPaintType(key);
                      }}
                    >
                      <span className={`paint-swatch ${key.toLowerCase()}`} />
                      <strong>{label}</strong>
                    </button>
                  ))}
                </div>
                {["METALLIC", "PEARL"].includes(paintType) && (
                  <Alert>
                    Observe frente, ângulo e aparência das partículas. O ajuste
                    de efeito será documentado separadamente da correção de
                    matiz.
                  </Alert>
                )}
                <Field label="Observações">
                  <textarea
                    value={fields.notes}
                    onChange={(e) =>
                      setFields({ ...fields, notes: e.target.value })
                    }
                  />
                </Field>
                <div className="formula-summary">
                  <span>
                    {fields.manufacturer} · {fields.model} · {fields.year}
                  </span>
                  <strong>
                    {fields.colorCode} — {fields.description}
                  </strong>
                  <span>
                    {components.length} componentes · {total} g
                  </span>
                </div>
              </>
            )}
            {error && <Alert error>{error}</Alert>}
            <div className="form-footer">
              {step > 0 && (
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => setStep(step - 1)}
                >
                  <ArrowLeft size={16} />
                  Voltar
                </button>
              )}
              <button className="button primary" disabled={pending}>
                {pending
                  ? "Salvando…"
                  : step < 2
                    ? "Continuar"
                    : standalone
                      ? "Salvar fórmula"
                      : "Criar ajuste"}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}
export function FormulaTable({ formula, totalLabel = "Massa original" }: { formula: Formula; totalLabel?: string }) {
  return (
    <div className="data-table">
      <table>
        <thead>
          <tr>
            <th>Base / pigmento</th>
            <th>Código</th>
            <th className="numeric">Peso individual</th>
          </tr>
        </thead>
        <tbody>
          {formula.components.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td>
                <code>{c.code}</code>
              </td>
              <td className="numeric">{formatMass(c.weightG)} g</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2}>{totalLabel}</td>
            <td className="numeric">{formatMass(formula.desiredMassG)} g</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
export { value };
