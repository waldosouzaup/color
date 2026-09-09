"use client";
import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  Check,
  Printer,
  ArrowRight,
  Plus,
  FileText,
  Archive,
  LoaderCircle,
} from "lucide-react";
import {
  Heading,
  Badge,
  Dialog,
  SaveForm,
  Field,
  value,
  Alert,
  Empty,
} from "@/components/ui";
import type { Adjustment, Workspace } from "@/lib/client-types";
import {
  mutation,
  formatMass,
  formatDate,
  paintLabels,
  lightingLabels,
} from "@/lib/client-api";
import { FormulaTable } from "./formula-form";
import { Diagnosis } from "./diagnosis";
function PanelForm({
  session,
  done,
}: {
  session: Adjustment;
  done: () => void;
}) {
  const [image, setImage] = useState<string>();
  const [fileError, setFileError] = useState("");
  const [reading, setReading] = useState(false);
  return (
    <SaveForm
      label="Registrar chapa"
      onDone={done}
      onSubmit={async (f) => {
        if (reading || fileError)
          throw new Error(fileError || "Aguarde a leitura da foto.");
        const application: Record<string, string | number> = {};
        for (const key of [
          "dilution",
          "pressure",
          "sprayDistance",
          "wetOrDry",
          "temperature",
          "humidity",
          "gunModel",
          "nozzle",
          "thinner",
          "primerColor",
        ])
          if (value(f, key)) application[key] = value(f, key);
        if (value(f, "numberOfCoats"))
          application.numberOfCoats = Number(value(f, "numberOfCoats"));
        await mutation("panel", {
          sessionId: session.id,
          expectedVersion: session.version,
          image,
          notes: value(f, "notes"),
          clearCoatApplied: f.has("clearCoatApplied"),
          application,
        });
      }}
    >
      <Alert>
        A fotografia documenta o teste. A classificação de tonalidade é feita
        pelo profissional, observando a chapa.
      </Alert>
      <Field label="Foto da chapa (opcional, até 2 MB)">
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={async (e) => {
            setFileError("");
            setImage(undefined);
            const file = e.target.files?.[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) {
              setFileError("A foto deve ter até 2 MB.");
              return;
            }
            setReading(true);
            try {
              const data = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () =>
                  typeof reader.result === "string"
                    ? resolve(reader.result)
                    : reject(new Error("Falha ao ler a foto."));
                reader.onerror = () =>
                  reject(new Error("Falha ao ler a foto."));
                reader.readAsDataURL(file);
              });
              setImage(data);
            } catch (e) {
              setFileError(e instanceof Error ? e.message : "Erro de leitura.");
            } finally {
              setReading(false);
            }
          }}
        />
      </Field>
      {fileError && <Alert error>{fileError}</Alert>}
      <Field label="Observações da chapa">
        <textarea
          name="notes"
          placeholder="Aplicação, cobertura e aparência do teste"
        />
      </Field>
      <label className="checkbox">
        <input type="checkbox" name="clearCoatApplied" />
        Verniz aplicado
      </label>
      <details>
        <summary>Condições de aplicação (opcional)</summary>
        <div className="form-grid">
          {[
            ["dilution", "Diluição"],
            ["pressure", "Pressão"],
            ["sprayDistance", "Distância de aplicação"],
            ["numberOfCoats", "Número de demãos"],
            ["wetOrDry", "Úmida ou seca"],
            ["temperature", "Temperatura"],
            ["humidity", "Umidade"],
            ["gunModel", "Modelo da pistola"],
            ["nozzle", "Bico"],
            ["thinner", "Diluente"],
            ["primerColor", "Cor do primer"],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <input
                name={key}
                type={key === "numberOfCoats" ? "number" : "text"}
                min="1"
                max="30"
              />
            </Field>
          ))}
        </div>
      </details>
    </SaveForm>
  );
}
/* Carrega a árvore completa do ajuste sob demanda: a bancada só traz o resumo. */
export function SessionView({
  id,
  workspace,
  refresh,
}: {
  id: string;
  workspace: Workspace;
  refresh: () => Promise<void>;
}) {
  const [session, setSession] = useState<Adjustment | null>(null);
  const [error, setError] = useState("");
  const fetchSession = useCallback(async (): Promise<Adjustment> => {
    const response = await fetch(`/api/sessions/${id}`, { cache: "no-store" });
    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(body.error || "Não foi possível carregar este ajuste.");
    }
    return (await response.json()) as Adjustment;
  }, [id]);
  const reload = useCallback(async () => {
    setSession(await fetchSession());
    setError("");
  }, [fetchSession]);
  useEffect(() => {
    let cancelled = false;
    fetchSession()
      .then((data) => {
        if (!cancelled) setSession(data);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Erro de conexão.");
      });
    return () => {
      cancelled = true;
    };
  }, [fetchSession]);
  if (error)
    return (
      <Empty
        title="Ajuste indisponível"
        description={error}
        href="/sessions"
        cta="Voltar aos ajustes"
      />
    );
  if (!session)
    return (
      <div className="loading-panel">
        <LoaderCircle className="spin" />
        <p>Carregando o ajuste…</p>
      </div>
    );
  return (
    <SessionDetail
      session={session}
      workspace={workspace}
      reload={reload}
      refresh={refresh}
    />
  );
}
function SessionDetail({
  session,
  workspace,
  reload,
  refresh,
}: {
  session: Adjustment;
  workspace: Workspace;
  reload: () => Promise<void>;
  refresh: () => Promise<void>;
}) {
  const params = useSearchParams();
  const requestedRule = workspace.rules.find(
    (r) => `${r.mainTone}.${r.direction}` === params.get("diagnosis"),
  );
  const [dialog, setDialog] = useState<
    "panel" | "diagnosis" | "approve" | "archive" | null
  >(null);
  const last = session.iterations.at(-1);
  const hasPanel = session.panels.some(
    (p) => p.iterationId === (last?.id ?? null),
  );
  const active = session.status === "IN_PROGRESS";
  const completed = session.status === "APPROVED";
  const mass = (v: string) => formatMass(v, workspace.organization.precision);
  /* Recarrega o ajuste e o resumo da bancada em paralelo. */
  async function done() {
    await Promise.all([reload(), refresh()]);
    setDialog(null);
  }
  return (
    <>
      <Heading
        eyebrow={`AJUSTE · ${session.id.slice(-8).toUpperCase()}`}
        title={`${session.formula.colorCode} · ${session.formula.description}`}
        description={`${session.formula.manufacturer} ${session.formula.model} · ${session.formula.year} · ${paintLabels[session.paintType]}`}
      >
        <button className="button secondary" onClick={() => window.print()}>
          <Printer size={17} />
          Relatório
        </button>
        <Badge kind={completed ? "success" : active ? "warning" : ""}>
          {completed ? "Aprovado" : active ? "Em andamento" : "Arquivado"}
        </Badge>
      </Heading>
      <p className="session-responsible">
        Responsável: {workspace.professionals.find(p => p.id === session.userId)?.name || "Usuário indisponível"}
        {" · "}{workspace.organization.name}{" · Iniciado em "}{formatDate(session.startedAt)}
      </p>
      {session.formula.isDemo && (
        <Alert>DADO DEMONSTRATIVO — sessão de treinamento.</Alert>
      )}
      <div className="session-metrics">
        <div>
          <span>Massa original</span>
          <strong>
            {mass(session.initialMassG)} <small>g</small>
          </strong>
        </div>
        <div>
          <span>Massa atual</span>
          <strong>
            {mass(session.currentMassG)} <small>g</small>
          </strong>
        </div>
        <div>
          <span>Correções registradas</span>
          <strong>
            {session.iterations.length.toString().padStart(2, "0")}
          </strong>
        </div>
        <div>
          <span>Chapas de teste</span>
          <strong>{session.panels.length.toString().padStart(2, "0")}</strong>
        </div>
      </div>
      {active && (
        <section className="next-action no-print">
          <div className="action-symbol">
            {hasPanel ? <ArrowRight /> : <Camera />}
          </div>
          <div>
            <span className="eyebrow">PRÓXIMO PASSO</span>
            <h2>
              {hasPanel
                ? last
                  ? "Reavaliar frente e ângulo"
                  : "Analisar o ângulo"
                : last
                  ? "Aplicar uma nova chapa"
                  : "Registrar a primeira chapa"}
            </h2>
            <p>
              {hasPanel
                ? "Observe a chapa sob a iluminação registrada e identifique a diferença de tonalidade."
                : "Documente a aplicação antes de iniciar o diagnóstico."}
            </p>
          </div>
          <div className="action-buttons">
            {hasPanel ? (
              <>
                <button
                  className="button primary"
                  onClick={() => setDialog("diagnosis")}
                >
                  {last ? "Nova avaliação" : "Iniciar diagnóstico"}
                  <ArrowRight size={17} />
                </button>
                <button
                  className="button secondary"
                  onClick={() => setDialog("approve")}
                >
                  <Check size={17} />A cor fechou
                </button>
              </>
            ) : (
              <button
                className="button primary"
                onClick={() => setDialog("panel")}
              >
                <Plus size={17} />
                Registrar chapa
              </button>
            )}
          </div>
        </section>
      )}
      {completed && (
        <div className="approved-banner">
          <Check />
          <div>
            <strong>Fórmula aprovada e salva no Banco de Cores</strong>
            <p>
              {session.colorBank?.professional} · {session.colorBank?.workshop}{" "}
              · {session.approvedAt && formatDate(session.approvedAt)}
            </p>
          </div>
          <Link className="button secondary no-print" href="/bank">
            Ver Banco de Cores
            <ArrowRight size={16} />
          </Link>
        </div>
      )}
      <div className="session-columns">
        <section className="panel">
          <div className="section-title">
            <h2>Histórico do ajuste</h2>
            <Badge>REGISTRO CONTÍNUO</Badge>
          </div>
          <div className="timeline">
            <article>
              <span className="timeline-dot">
                <FileText size={14} />
              </span>
              <small>{formatDate(session.startedAt)}</small>
              <h3>Fórmula de partida registrada</h3>
              <p>
                {session.formula.components.length} componentes ·{" "}
                {mass(session.initialMassG)} g
              </p>
            </article>
            {session.iterations.map((i) => (
              <article key={i.id}>
                <span className="timeline-dot">
                  <Plus size={14} />
                </span>
                <small>
                  {formatDate(i.createdAt)} · Iteração {i.iterationNumber}
                </small>
                <h3>
                  {workspace.rules.find((r) => r.id === i.correctionRuleId)
                    ?.diagnosisLabel ||
                    (typeof i.ruleSnapshot === "object" &&
                    i.ruleSnapshot &&
                    "diagnosisLabel" in i.ruleSnapshot
                      ? String(i.ruleSnapshot.diagnosisLabel)
                      : "Correção de matiz")}
                </h3>
                {i.additions.map((a) => (
                  <div className="history-addition" key={a.id}>
                    <span>
                      <strong>{a.name}</strong>
                      <small>
                        {a.code}
                        {a.suggestedAmountG
                          ? ` · Sugerido ${mass(a.suggestedAmountG)} g`
                          : " · Dosagem manual"}
                      </small>
                    </span>
                    <b>+ {mass(a.addedAmountG)} g</b>
                  </div>
                ))}
                <p className="mass-after">
                  Massa após adição: <strong>{mass(i.massAfterG)} g</strong>
                </p>
                {i.observations.map((o) => (
                  <p key={o.id}>
                    <b>
                      {o.view === "ANGLE" ? "Ângulo" : "Frente"} ·{" "}
                      {lightingLabels[o.lightingCondition]}:
                    </b>{" "}
                    {o.notes || "Classificação registrada."}
                  </p>
                ))}
                {i.notes && <p>{i.notes}</p>}
                <Badge kind={i.result === "APPROVED" ? "success" : ""}>
                  {i.result === "APPROVED"
                    ? "Cor aprovada"
                    : i.result === "NEEDS_CORRECTION"
                      ? "Nova correção necessária"
                      : "Aguardando nova avaliação"}
                </Badge>
              </article>
            ))}
            {completed && (
              <article>
                <span className="timeline-dot success">
                  <Check size={14} />
                </span>
                <h3>Aprovação final</h3>
                {session.observations
                  .filter((o) => !o.mainTone)
                  .map((o) => (
                    <p key={o.id}>
                      <b>{o.view === "ANGLE" ? "Ângulo" : "Frente"}:</b>{" "}
                      {o.notes} · {lightingLabels[o.lightingCondition]}
                    </p>
                  ))}
                {session.notes && <p>{session.notes}</p>}
              </article>
            )}
          </div>
        </section>
        <div className="stack">
          <section className="panel">
            <div className="section-title">
              <h2>Fórmula original</h2>
              <Badge>ORIGEM PRESERVADA</Badge>
            </div>
            <FormulaTable formula={session.formula} />
            <div className="info-grid">
              <span>
                Sistema<strong>{session.formula.paintSystem}</strong>
              </span>
              <span>
                Linha<strong>{session.formula.productLine}</strong>
              </span>
              <span>
                Fabricante da tinta
                <strong>{session.formula.paintManufacturer}</strong>
              </span>
              <span>
                Pesagem
                <strong>
                  {session.formula.weightMode === "CUMULATIVE"
                    ? "Acumulada"
                    : "Individual"}
                </strong>
              </span>
            </div>
          </section>
          <section className="panel">
            <div className="section-title">
              <h2>Chapas de teste</h2>
              {active && (
                <button
                  className="button text no-print"
                  onClick={() => setDialog("panel")}
                >
                  <Plus size={16} />
                  Nova chapa
                </button>
              )}
            </div>
            {!session.panels.length && (
              <p className="muted">
                A primeira chapa ainda não foi registrada.
              </p>
            )}
            <div className="panel-grid">
              {session.panels.map((p, i) => (
                <article className="test-panel" key={p.id}>
                  {p.imageMime ? (
                    <a
                      href={`/api/panels/${p.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Image
                        unoptimized
                        src={`/api/panels/${p.id}`}
                        width={280}
                        height={180}
                        alt={`Chapa de teste ${i + 1}`}
                      />
                    </a>
                  ) : (
                    <div className="photo-placeholder">
                      <Camera />
                      <span>Sem fotografia</span>
                    </div>
                  )}
                  <div>
                    <strong>
                      Chapa {String(i + 1).padStart(2, "0")}
                      {p.approved && <Check size={16} />}
                    </strong>
                    <small>
                      {formatDate(p.appliedAt)} ·{" "}
                      {p.clearCoatApplied ? "Com verniz" : "Sem verniz"}
                    </small>
                    <p>{p.notes || "Aplicação registrada."}</p>
                    {p.applicationCondition && (
                      <details>
                        <summary>Condições</summary>
                        {Object.entries(p.applicationCondition)
                          .filter(
                            ([key, v]) =>
                              !["id", "sessionId", "clearCoatApplied"].includes(
                                key,
                              ) &&
                              v !== null &&
                              v !== "",
                          )
                          .map(([key, v]) => (
                            <p key={key}>
                              {(
                                {
                                  dilution: "Diluição",
                                  pressure: "Pressão",
                                  sprayDistance: "Distância",
                                  numberOfCoats: "Demãos",
                                  wetOrDry: "Aplicação",
                                  temperature: "Temperatura",
                                  humidity: "Umidade",
                                  gunModel: "Pistola",
                                  nozzle: "Bico",
                                  thinner: "Diluente",
                                  primerColor: "Primer",
                                  notes: "Observações",
                                } as Record<string, string>
                              )[key] || key}
                              : {String(v)}
                            </p>
                          ))}
                      </details>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </div>
      {completed && (
        <section className="panel final-formula">
          <div className="section-title">
            <h2>Fórmula final aprovada</h2>
            <Badge kind="success">{mass(session.currentMassG)} g</Badge>
          </div>
          <p>
            Componentes de origem e adições realizadas, preservados para
            reprodução e auditoria.
          </p>
          <FormulaTable
            totalLabel="Massa final aprovada"
            formula={{
              ...session.formula,
              desiredMassG: session.currentMassG,
              components: [
                ...session.formula.components,
                ...session.iterations.flatMap((i) =>
                  i.additions.map((a, j) => ({
                    id: a.id,
                    formulaId: session.formulaId,
                    pigmentId: a.pigmentId,
                    code: a.code,
                    name: `${a.name} (correção ${i.iterationNumber})`,
                    weightG: a.addedAmountG,
                    enteredWeightG: a.addedAmountG,
                    order: j,
                    notes: "",
                  })),
                ),
              ],
            }}
          />
        </section>
      )}
      {active && (
        <button
          className="button text no-print"
          onClick={() => setDialog("archive")}
        >
          <Archive size={16} />
          Arquivar ajuste
        </button>
      )}
      {dialog && (
        <Dialog
          title={
            dialog === "panel"
              ? "Chapa de teste"
              : dialog === "diagnosis"
                ? "Diagnóstico de matiz"
                : dialog === "approve"
                  ? "Aprovar e salvar no Banco de Cores"
                  : "Arquivar ajuste"
          }
          close={() => setDialog(null)}
        >
          {dialog === "panel" ? (
            <PanelForm session={session} done={done} />
          ) : dialog === "diagnosis" ? (
            <Diagnosis
              session={session}
              workspace={workspace}
              done={done}
              initialRule={requestedRule}
            />
          ) : dialog === "approve" ? (
            <SaveForm
              label="Aprovar e salvar no Banco de Cores"
              onDone={done}
              onSubmit={(f) =>
                mutation("approve", {
                  sessionId: session.id,
                  expectedVersion: session.version,
                  angleConfirmed: f.has("angleConfirmed"),
                  frontConfirmed: f.has("frontConfirmed"),
                  lightingCondition: value(f, "lightingCondition"),
                  angleNotes: value(f, "angleNotes"),
                  frontNotes: value(f, "frontNotes"),
                  notes: value(f, "notes"),
                })
              }
            >
              <Alert>
                Confirme a avaliação prática da nova chapa. A aprovação encerra
                as adições nesta sessão.
              </Alert>
              <Field label="Iluminação">
                <select name="lightingCondition">
                  {Object.entries(lightingLabels).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Avaliação final do ângulo">
                <textarea required name="angleNotes" />
              </Field>
              <label className="checkbox">
                <input required type="checkbox" name="angleConfirmed" />
                Ângulo aprovado
              </label>
              <Field label="Avaliação final da frente">
                <textarea required name="frontNotes" />
              </Field>
              <label className="checkbox">
                <input required type="checkbox" name="frontConfirmed" />
                Frente aprovada
              </label>
              <Field label="Observações finais">
                <textarea name="notes" />
              </Field>
            </SaveForm>
          ) : (
            <SaveForm
              label="Arquivar e preservar histórico"
              onDone={done}
              onSubmit={(f) =>
                mutation("archive", {
                  sessionId: session.id,
                  reason: value(f, "reason"),
                })
              }
            >
              <Field label="Motivo do arquivamento">
                <textarea required name="reason" />
              </Field>
            </SaveForm>
          )}
        </Dialog>
      )}
    </>
  );
}
