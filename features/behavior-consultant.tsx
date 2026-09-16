"use client";
import { useId, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Check,
  CircleHelp,
  Compass as CompassIcon,
  LoaderCircle,
  Minus,
  Search,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { Alert, Badge, Field } from "@/components/ui";
import type { Pigment } from "@/lib/client-types";
import { action } from "@/lib/client-api";
import {
  applyCondition,
  interpretBehaviorQuestion,
  type BehaviorInterpretation,
  type UnassignedCondition,
} from "@/domain/colorimetry/behavior-interpreter";
import {
  behaviorQueryResponseSchema,
  behaviorViews,
  criteriaIssues,
  describeCriteria,
  describeView,
  emptyCriteria,
  isEmptyCriteria,
  isEmptyView,
  viewLabels,
  type BehaviorCriteria,
  type BehaviorMatchResult,
  type BehaviorQueryResponse,
  type BehaviorView,
  type CheckOutcome,
  type ViewCriteria,
} from "@/domain/colorimetry/behavior-criteria";
import {
  hueFamilies,
  hueLabels,
  qualifierGroups,
  qualifierLabels,
  type HueFamily,
  type Qualifier,
} from "@/domain/colorimetry/behavior-vocabulary";

/**
 * Consultor de bases por comportamento na frente e no ângulo.
 *
 * Interpretação (domínio, no navegador) → critérios editáveis → consulta
 * somente leitura no servidor, restrita à oficina da sessão. Não calcula dose
 * e não toca em ajuste, fórmula ou adição.
 */
const EXAMPLE = "Preciso de um pigmento que amarele a frente e deixe o ângulo azul";
const PAGE = 8;

type Filters = {
  manufacturer: string;
  productLine: string;
  systemType: string;
  includeDemo: boolean;
};
type RequestState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; response: BehaviorQueryResponse };

const outcomeMeta: Record<CheckOutcome, { label: string; Icon: typeof Check }> = {
  MET: { label: "Atende", Icon: Check },
  TENDENCY: { label: "Só tendência", Icon: Minus },
  UNMET: { label: "Não atende", Icon: X },
  UNDOCUMENTED: { label: "Sem informação", Icon: CircleHelp },
  DIVERGENT: { label: "Divergente", Icon: TriangleAlert },
};

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const unique = (values: string[]) =>
  [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR"));

export function BehaviorConsultant({ pigments }: { pigments: Pigment[] }) {
  const params = useSearchParams();
  const inputId = useId();
  const [question, setQuestion] = useState("");
  const [interpretation, setInterpretation] = useState<BehaviorInterpretation | null>(null);
  const [criteria, setCriteria] = useState<BehaviorCriteria>(emptyCriteria);
  const [unassigned, setUnassigned] = useState<UnassignedCondition[]>([]);
  // Confirmação explícita (botão ou ajuste manual) das pendências da interpretação.
  const [acknowledged, setAcknowledged] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    manufacturer: "",
    productLine: "",
    systemType: "",
    includeDemo: false,
  });
  const [request, setRequest] = useState<RequestState>({ status: "idle" });
  const latest = useRef(0);

  // Opções só das bases que a consulta pode considerar.
  const eligible = (includeDemo: boolean) =>
    pigments.filter((p) => p.active && (includeDemo || !p.isDemo));
  const active = eligible(filters.includeDemo);
  const manufacturers = unique(active.map((p) => p.manufacturer));
  const productLines = unique(
    active
      .filter((p) => !filters.manufacturer || p.manufacturer === filters.manufacturer)
      .map((p) => p.productLine),
  );
  const systems = unique(active.map((p) => p.systemType));

  const pendingConfirmation = Boolean(
    interpretation?.issues.some((i) => i.blocking && i.kind !== "UNASSIGNED"),
  );
  const conflicts = criteriaIssues(criteria);

  function search(next: BehaviorCriteria, nextFilters: Filters) {
    const id = ++latest.current;
    if (isEmptyCriteria(next) || criteriaIssues(next).length) {
      setRequest({ status: "idle" });
      return;
    }
    setRequest({ status: "loading" });
    action("behaviorQuery", { criteria: next, filters: nextFilters })
      .then((result) => {
        if (id === latest.current)
          setRequest({ status: "done", response: behaviorQueryResponseSchema.parse(result) });
      })
      .catch((error) => {
        if (id === latest.current)
          setRequest({
            status: "error",
            message:
              error instanceof Error ? error.message : "Não foi possível consultar as bases.",
          });
      });
  }

  function interpret(text: string) {
    const result = interpretBehaviorQuestion(text);
    setInterpretation(result);
    setCriteria(result.criteria);
    setUnassigned(result.unassigned);
    setAcknowledged(false);
    // Observação e vista ausente têm botões próprios; o editor abre quando é o caminho.
    setEditorOpen(
      result.status === "NOTHING_RECOGNIZED" || result.issues.some((i) => i.kind === "CONFLICT"),
    );
    if (result.status === "READY") search(result.criteria, filters);
    else {
      latest.current++;
      setRequest({ status: "idle" });
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (question.trim()) interpret(question);
  }

  /* Ajustar critérios ou apertar um botão de confirmação resolve a pendência. */
  function confirm(next: BehaviorCriteria) {
    setCriteria(next);
    setAcknowledged(true);
    if (!unassigned.length) search(next, filters);
  }

  function resolveUnassigned(index: number, view: BehaviorView | null) {
    const remaining = unassigned.filter((_, i) => i !== index);
    const next = view ? applyCondition(criteria, unassigned[index], view) : criteria;
    setUnassigned(remaining);
    setCriteria(next);
    if (!remaining.length && (!pendingConfirmation || acknowledged)) search(next, filters);
  }

  function editFilters(next: Filters) {
    setFilters(next);
    if (!unassigned.length && (!pendingConfirmation || acknowledged)) search(criteria, next);
  }

  const showIssues = interpretation && !acknowledged;
  const observation = interpretation?.issues.find((i) => i.kind === "OBSERVATION");
  const alternative = interpretation?.issues.find((i) => i.kind === "ALTERNATIVE");
  const textConflicts = interpretation?.issues.filter((i) => i.kind === "CONFLICT") ?? [];
  const notes = interpretation?.issues.filter((i) => !i.blocking) ?? [];

  return (
    <section
      className="panel behavior-consultant"
      id="consultor"
      aria-labelledby={`${inputId}-title`}
    >
      <div className="consultant-head">
        <p className="eyebrow">CONSULTOR DE COMPORTAMENTO</p>
        <h2 id={`${inputId}-title`}>Qual efeito você procura na frente e no ângulo?</h2>
        <p>
          Descreva em português. A consulta cruza as duas vistas na mesma base, usando os
          comportamentos cadastrados na sua oficina.
        </p>
      </div>

      <form className="consultant-form" role="search" onSubmit={submit}>
        <label htmlFor={inputId} className="consultant-label">
          Pergunta sobre comportamento
        </label>
        <div className="consultant-form-row">
          <div className="search consultant-search">
            <Search size={18} aria-hidden />
            <input
              id={inputId}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex.: amarelar a frente e deixar o ângulo azul"
              autoComplete="off"
              maxLength={500}
              autoFocus={params.has("consultor")}
            />
          </div>
          <button className="button primary" type="submit" disabled={!question.trim()}>
            Consultar
          </button>
        </div>
      </form>
      <div className="consultant-example">
        <span>Exemplo:</span>
        <button
          type="button"
          className="example-chip"
          onClick={() => {
            setQuestion(EXAMPLE);
            interpret(EXAMPLE);
          }}
        >
          “{EXAMPLE}”
        </button>
      </div>

      {(interpretation || acknowledged) && (
        <div className="consultant-interpretation" aria-live="polite">
          <span className="eyebrow">
            {acknowledged ? "CRITÉRIOS DA CONSULTA" : "INTERPRETAÇÃO"}
          </span>
          <p className="interpretation-summary" data-testid="interpretacao">
            {behaviorViews.map((view, i) => (
              <span key={view}>
                {i > 0 && <span className="interpretation-dot"> · </span>}
                <strong>{viewLabels[view]}:</strong>{" "}
                {isEmptyView(criteria[view]) ? (
                  <em>sem critério</em>
                ) : (
                  describeView(criteria[view])
                )}
              </span>
            ))}
          </p>

          {interpretation?.status === "NOTHING_RECOGNIZED" && !acknowledged && (
            <Alert>
              Não reconheci comportamentos na pergunta. Use termos como amarelar, azulado,
              limpo, sujo, leitoso, claro ou escuro, indicando frente ou ângulo — ou defina os
              critérios abaixo.
            </Alert>
          )}

          {showIssues && observation && (
            <div className="consultant-issue" role="alert">
              <p>{observation.message}</p>
              <div className="issue-actions">
                <button
                  type="button"
                  className="button secondary sm"
                  onClick={() => confirm(interpretation.criteria)}
                >
                  Buscar bases que produzam: {describeCriteria(interpretation.criteria, true)}
                </button>
                {!isEmptyCriteria(interpretation.desiredCriteria) && (
                  <button
                    type="button"
                    className="button secondary sm"
                    onClick={() => confirm(interpretation.desiredCriteria)}
                  >
                    Buscar só o pedido: {describeCriteria(interpretation.desiredCriteria, true)}
                  </button>
                )}
                <Link href="/compass" className="button text sm">
                  <CompassIcon size={15} aria-hidden />
                  Diagnosticar na bússola
                </Link>
              </div>
            </div>
          )}

          {showIssues && !observation && alternative && (
            <div className="consultant-issue" role="alert">
              <p>{alternative.message}</p>
              <div className="issue-actions">
                <button
                  type="button"
                  className="button secondary sm"
                  onClick={() => confirm(criteria)}
                >
                  Exigir todas as condições
                </button>
              </div>
            </div>
          )}

          {showIssues &&
            textConflicts.map((issue) => (
              <Alert error key={issue.message}>
                {issue.message}
              </Alert>
            ))}

          {unassigned.map((condition, index) => (
            <div className="consultant-issue" role="alert" key={`${condition.word}-${index}`}>
              <p>
                “{condition.negated ? `sem ${condition.word}` : condition.word}” não foi
                associado à frente nem ao ângulo. Em qual vista?
              </p>
              <div className="issue-actions">
                {behaviorViews.map((view) => (
                  <button
                    key={view}
                    type="button"
                    className="button secondary sm"
                    onClick={() => resolveUnassigned(index, view)}
                  >
                    Aplicar {view === "FRONT" ? "na frente" : "no ângulo"}
                  </button>
                ))}
                <button
                  type="button"
                  className="button text sm"
                  onClick={() => resolveUnassigned(index, null)}
                >
                  Ignorar
                </button>
              </div>
            </div>
          ))}

          {!acknowledged &&
            notes.map((note) => (
              <p className="consultant-note" key={note.message}>
                {note.message}
              </p>
            ))}
        </div>
      )}

      <details
        className="criteria-editor"
        open={editorOpen}
        onToggle={(e) => setEditorOpen(e.currentTarget.open)}
      >
        <summary>Ajustar critérios sem reescrever a pergunta</summary>
        <div className="criteria-grid">
          {behaviorViews.map((view) => (
            <ViewCriteriaEditor
              key={view}
              view={view}
              value={criteria[view]}
              onChange={(value) => confirm({ ...criteria, [view]: value })}
            />
          ))}
        </div>
        {conflicts.map((message) => (
          <Alert error key={message}>
            {message}
          </Alert>
        ))}
        <button
          type="button"
          className="button-link"
          onClick={() => confirm(emptyCriteria())}
        >
          Limpar critérios
        </button>
      </details>

      <div className="consultant-filters" role="group" aria-label="Filtros comerciais da consulta">
        <Field label="Fabricante">
          <select
            value={filters.manufacturer}
            onChange={(e) => {
              const manufacturer = e.target.value;
              const lines = active
                .filter((p) => !manufacturer || p.manufacturer === manufacturer)
                .map((p) => p.productLine);
              editFilters({
                ...filters,
                manufacturer,
                productLine: lines.includes(filters.productLine) ? filters.productLine : "",
              });
            }}
          >
            <option value="">Todos</option>
            {manufacturers.map((m) => (
              <option key={m}>{m}</option>
            ))}
          </select>
        </Field>
        <Field label="Linha">
          <select
            value={filters.productLine}
            onChange={(e) => editFilters({ ...filters, productLine: e.target.value })}
          >
            <option value="">Todas</option>
            {productLines.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
        </Field>
        <Field label="Sistema">
          <select
            value={filters.systemType}
            onChange={(e) => editFilters({ ...filters, systemType: e.target.value })}
          >
            <option value="">Todos</option>
            {systems.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </Field>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={filters.includeDemo}
            onChange={(e) => {
              const includeDemo = e.target.checked;
              const next = eligible(includeDemo);
              const keep = (value: string, values: string[]) =>
                values.includes(value) ? value : "";
              editFilters({
                includeDemo,
                manufacturer: keep(filters.manufacturer, next.map((p) => p.manufacturer)),
                productLine: keep(filters.productLine, next.map((p) => p.productLine)),
                systemType: keep(filters.systemType, next.map((p) => p.systemType)),
              });
            }}
          />
          Incluir dados demonstrativos
        </label>
      </div>

      <div className="consultant-results" aria-live="polite" aria-busy={request.status === "loading"}>
        {request.status === "loading" && (
          <p className="consultant-status">
            <LoaderCircle className="spin" size={16} aria-hidden />
            Consultando as bases da oficina…
          </p>
        )}
        {request.status === "error" && (
          <div className="consultant-issue error" role="alert">
            <p>{request.message}</p>
            <div className="issue-actions">
              <button
                type="button"
                className="button secondary sm"
                onClick={() => search(criteria, filters)}
              >
                Tentar novamente
              </button>
            </div>
          </div>
        )}
        {request.status === "done" && <Results response={request.response} />}
      </div>

      <p className="consultant-disclaimer">
        <ShieldCheck size={16} aria-hidden />
        <span>
          Correspondência documental: mostra o que os comportamentos cadastrados descrevem. Não
          garante o resultado físico da mistura, não calcula dosagem e não registra adição.
          Para corrigir um desvio observado na chapa, use a{" "}
          <Link href="/compass" className="text-link">
            bússola
          </Link>
          .
        </span>
      </p>
    </section>
  );
}

function ViewCriteriaEditor({
  view,
  value,
  onChange,
}: {
  view: BehaviorView;
  value: ViewCriteria;
  onChange: (value: ViewCriteria) => void;
}) {
  const hueOptions = (none: string, label: (h: HueFamily) => string) => (
    <>
      <option value="">{none}</option>
      {hueFamilies.map((h) => (
        <option key={h} value={h}>
          {label(h)}
        </option>
      ))}
    </>
  );
  const groupSelect = (group: (typeof qualifierGroups)[number]) => {
    const members: readonly Qualifier[] = group.qualifiers;
    const required = members.find((q) => value.require.includes(q));
    const excluded = members.find((q) => value.exclude.includes(q));
    const current = required ? `require:${required}` : excluded ? `exclude:${excluded}` : "";
    return (
      <Field label={group.label} key={group.id}>
        <select
          value={current}
          onChange={(e) => {
            const [polarity, qualifier] = e.target.value.split(":") as [
              "require" | "exclude",
              Qualifier,
            ];
            const require = value.require.filter((q) => !members.includes(q));
            const exclude = value.exclude.filter((q) => !members.includes(q));
            if (qualifier) (polarity === "require" ? require : exclude).push(qualifier);
            onChange({ ...value, require, exclude });
          }}
        >
          <option value="">Indiferente</option>
          {members.map((q) => (
            <option key={`r-${q}`} value={`require:${q}`}>
              {capitalize(qualifierLabels[q].require)}
            </option>
          ))}
          {members.map((q) => (
            <option key={`e-${q}`} value={`exclude:${q}`}>
              {capitalize(qualifierLabels[q].exclude)}
            </option>
          ))}
        </select>
      </Field>
    );
  };
  const [primaryGroups, moreGroups] = [qualifierGroups.slice(0, 3), qualifierGroups.slice(3)];
  return (
    <fieldset className="criteria-view">
      <legend>{viewLabels[view]}</legend>
      <div className="criteria-fields">
        <Field label="Matiz principal">
          <select
            value={value.hue ?? ""}
            onChange={(e) => onChange({ ...value, hue: (e.target.value || null) as HueFamily | null })}
          >
            {hueOptions("Indiferente", (h) => capitalize(hueLabels[h].name))}
          </select>
        </Field>
        <Field label="Tendência secundária">
          <select
            value={value.tendency ?? ""}
            onChange={(e) =>
              onChange({ ...value, tendency: (e.target.value || null) as HueFamily | null })
            }
          >
            {hueOptions("Sem exigência", (h) => capitalize(hueLabels[h].tendency))}
          </select>
        </Field>
        {primaryGroups.map(groupSelect)}
      </div>
      <details className="criteria-more">
        <summary>Mais critérios de {viewLabels[view].toLowerCase()}</summary>
        <div className="criteria-fields">{moreGroups.map(groupSelect)}</div>
        <fieldset className="avoid-hues">
          <legend>Evitar matiz</legend>
          <div className="avoid-hues-list">
            {hueFamilies.map((h) => (
              <label className="checkbox" key={h}>
                <input
                  type="checkbox"
                  checked={value.avoidHues.includes(h)}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      avoidHues: e.target.checked
                        ? [...value.avoidHues, h]
                        : value.avoidHues.filter((x) => x !== h),
                    })
                  }
                />
                {capitalize(hueLabels[h].name)}
              </label>
            ))}
          </div>
        </fieldset>
      </details>
    </fieldset>
  );
}

function Results({ response }: { response: BehaviorQueryResponse }) {
  const { complete, partial, generalOnly, considered, demoExcluded } = response;
  return (
    <>
      <p className="consultant-status">
        {considered} {considered === 1 ? "base ativa consultada" : "bases ativas consultadas"}
        {demoExcluded > 0 &&
          ` · ${demoExcluded} ${demoExcluded === 1 ? "demonstrativa ficou" : "demonstrativas ficaram"} fora`}
      </p>
      {considered === 0 ? (
        <div className="consultant-empty" role="status">
          <strong>Dados insuficientes para consultar.</strong>
          <p>Nenhuma base ativa corresponde aos filtros comerciais selecionados.</p>
        </div>
      ) : complete.length ? (
        <section className="consultant-group" aria-label="Correspondências completas">
          <h3>Correspondências completas ({complete.length})</h3>
          <p className="muted">
            Todas as condições pedidas aparecem nos registros da vista correspondente. Ordem:
            fabricante, linha e código.
          </p>
          <div className="match-list">
            {complete.map((match) => (
              <MatchCard key={match.pigment.id} match={match} kind="complete" />
            ))}
          </div>
        </section>
      ) : (
        <div className="consultant-empty" role="status">
          <strong>Nenhuma base cadastrada atende a todas as condições.</strong>
          <p>
            {partial.length
              ? "Veja abaixo as correspondências parciais e o que falta em cada uma."
              : generalOnly.length
                ? "Há apenas registros gerais relacionados, que não comprovam frente e ângulo."
                : "Nenhum comportamento cadastrado se aproxima do pedido nos filtros atuais."}
          </p>
        </div>
      )}
      {considered > 0 && partial.length > 0 && (
        <MatchGroup
          title="Correspondências parciais"
          description="Atendem só parte do pedido. Cada base indica a condição não atendida, sem informação ou divergente. Ordem: matizes atendidos, demais condições atendidas, fabricante, linha e código."
          matches={partial}
          kind="partial"
          open={!complete.length}
        />
      )}
      {considered > 0 && generalOnly.length > 0 && (
        <MatchGroup
          title="Informação insuficiente: só comportamento geral"
          description="Estas bases têm apenas um registro geral relacionado ao pedido. Um registro geral não separa frente e ângulo, por isso não comprova nenhuma das vistas."
          matches={generalOnly}
          kind="general"
          open={false}
        />
      )}
    </>
  );
}

function MatchGroup({
  title,
  description,
  matches,
  kind,
  open,
}: {
  title: string;
  description: string;
  matches: BehaviorMatchResult[];
  kind: "partial" | "general";
  open: boolean;
}) {
  const [shown, setShown] = useState(PAGE);
  return (
    <details className="consultant-group" open={open}>
      <summary>
        {title} ({matches.length})
      </summary>
      <p className="muted">{description}</p>
      <div className="match-list">
        {matches.slice(0, shown).map((match) => (
          <MatchCard key={match.pigment.id} match={match} kind={kind} />
        ))}
      </div>
      {matches.length > shown && (
        <button type="button" className="button secondary sm" onClick={() => setShown(matches.length)}>
          Mostrar mais {matches.length - shown}
        </button>
      )}
    </details>
  );
}

function MatchCard({
  match,
  kind,
}: {
  match: BehaviorMatchResult;
  kind: "complete" | "partial" | "general";
}) {
  const titleId = useId();
  const { pigment, views, generalHints } = match;
  const records = (view: string) => pigment.behaviors.filter((b) => b.view === view);
  return (
    <article className={`match-card ${kind}`} aria-labelledby={titleId}>
      <header className="match-card-head">
        <code className="pigment-code-pill match-code">{pigment.code}</code>
        <div>
          <h4 id={titleId}>{pigment.name}</h4>
          <p className="match-meta">
            {pigment.manufacturer} · {pigment.productLine} · {pigment.systemType} ·{" "}
            {pigment.family}
          </p>
        </div>
        <div className="badge-row">
          {pigment.isDemo && <Badge kind="warning">DADO DEMONSTRATIVO</Badge>}
          {kind === "complete" && <Badge kind="success">Atende a todas as condições</Badge>}
          {kind === "partial" && <Badge kind="warning">Correspondência parcial</Badge>}
          {kind === "general" && <Badge>Só registro geral</Badge>}
        </div>
      </header>

      <div className="match-behaviors">
        {(["FRONT", "ANGLE"] as const).map((view) => {
          const list = records(view);
          return list.length ? (
            list.map((b) => <BehaviorBox key={b.id} label={viewLabels[view]} behavior={b} />)
          ) : (
            <div className="behavior-view-box match-view missing" key={view}>
              <span className="view-tag">{viewLabels[view]}</span>
              <strong>Sem registro</strong>
            </div>
          );
        })}
        {records("GENERAL").map((b) => (
          <BehaviorBox key={b.id} label="Geral — não comprova vista" behavior={b} full />
        ))}
      </div>

      <div className="match-reasons">
        <h5>{kind === "complete" ? "Motivo da correspondência" : "Conferência do pedido"}</h5>
        <ul>
          {views.flatMap((v) =>
            v.checks.map((check, i) => {
              const { label, Icon } = outcomeMeta[check.outcome];
              return (
                <li key={`${v.view}-${i}`} className={`check ${check.outcome.toLowerCase()}`}>
                  <span className="check-outcome">
                    <Icon size={14} aria-hidden />
                    {label}
                  </span>
                  <span>
                    {check.explanation}{" "}
                    <span className="check-requested">(pedido: {check.requested})</span>
                  </span>
                </li>
              );
            }),
          )}
        </ul>
        {generalHints.map((hint) => (
          <p className="consultant-note" key={hint}>
            {hint}
          </p>
        ))}
      </div>
    </article>
  );
}

function BehaviorBox({
  label,
  behavior,
  full = false,
}: {
  label: string;
  behavior: BehaviorMatchResult["pigment"]["behaviors"][number];
  full?: boolean;
}) {
  return (
    <div className={`behavior-view-box match-view ${full ? "full" : ""}`}>
      <span className="view-tag">{label}</span>
      <strong>{behavior.hueCharacteristic || "Matiz não informado"}</strong>
      {behavior.lightnessEffect && <p>Luminosidade: {behavior.lightnessEffect}</p>}
      {behavior.cleanlinessEffect && <p>Limpeza: {behavior.cleanlinessEffect}</p>}
      {behavior.particleEffect && <p>Partículas: {behavior.particleEffect}</p>}
      {behavior.notes && <p>Observações: {behavior.notes}</p>}
      <small className="match-source">
        Fonte: {behavior.source} · {behavior.sourceReference}
      </small>
    </div>
  );
}
