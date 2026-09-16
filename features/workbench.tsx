"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  FlaskConical,
  Compass as CompassIcon,
  Library,
  BookOpen,
  Files,
  History,
  SlidersHorizontal,
  Scale,
  Settings,
  Plus,
  Search,
  ArrowRight,
  ExternalLink,
  Menu,
  X,
  LogOut,
  CheckCheck,
  Clock3,
  ChevronRight,
  LoaderCircle,
  CircleHelp,
  Maximize2,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { Workspace, AdjustmentSummary } from "@/lib/client-types";
import {
  formatMass,
  formatDate,
  mutation,
  paintLabels,
} from "@/lib/client-api";
import { Heading, Badge, Empty, Alert, Dialog } from "@/components/ui";
import { Compass } from "@/components/compass";
import { CompassModal } from "@/components/compass-modal";
import { CompassIdentityDisc } from "@/components/compass-identity-disc";
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
import type { ObservationView } from "@/domain/colorimetry/types";
import { ThemeToggle } from "@/components/theme-toggle";
import { FormulaForm, FormulaTable } from "./formula-form";
import { SessionView } from "./session";
import { AccountView } from "./account";
import {
  PigmentsView,
  CoefficientsView,
  RulesView,
  SettingsView,
} from "./catalogs";
import { HelpView } from "./help";
import { toneLabels, directionLabels } from "@/domain/colorimetry/tones";
const nav = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard },
  { href: "/sessions", label: "Meus ajustes", icon: FlaskConical },
  { href: "/compass", label: "Bússola da Colorimetria", icon: CompassIcon },
  { href: "/bank", label: "Banco de Cores", icon: Library },
  { href: "/formulas", label: "Fórmulas", icon: Files },
  { href: "/pigments", label: "Biblioteca de pigmentos", icon: BookOpen },
  { href: "/history", label: "Histórico de ajustes", icon: History },
  { href: "/help", label: "Ajuda", icon: CircleHelp },
];
const adminNav = [
  { href: "/rules", label: "Regras do método", icon: SlidersHorizontal },
  { href: "/coefficients", label: "Calibração de dosagem", icon: Scale },
  { href: "/settings", label: "Configurações", icon: Settings },
];
function SessionsList({ sessions }: { sessions: AdjustmentSummary[] }) {
  return (
    <div className="session-list">
      {sessions.map((s) => (
        <Link href={`/sessions/${s.id}`} key={s.id} className="session-row">
          <span className={`color-chip ${s.formula.isDemo ? "demo" : ""}`}>
            <FlaskConical size={22} />
          </span>
          <div>
            <strong>{s.formula.description}</strong>
            <small>
              {s.formula.manufacturer} {s.formula.model} · {s.formula.year}
            </small>
            {s.formula.isDemo && (
              <span className="demo-label">DADO DEMONSTRATIVO</span>
            )}
          </div>
          <code>{s.formula.colorCode}</code>
          <div className="session-row-mass">
            <strong>{formatMass(s.currentMassG)} g</strong>
            <small>{s._count.iterations} correções</small>
          </div>
          <Badge
            kind={
              s.status === "APPROVED"
                ? "success"
                : s.status === "IN_PROGRESS"
                  ? "warning"
                  : ""
            }
          >
            {s.status === "APPROVED"
              ? "Aprovado"
              : s.status === "IN_PROGRESS"
                ? "Em andamento"
                : "Arquivado"}
          </Badge>
          <ChevronRight size={17} />
        </Link>
      ))}
    </div>
  );
}
function Dashboard({ workspace }: { workspace: Workspace }) {
  const active = workspace.sessions.filter((s) => s.status === "IN_PROGRESS");
  const approved = workspace.sessions.filter((s) => s.status === "APPROVED");
  const router = useRouter();
  return (
    <>
      <Heading
        eyebrow="SUA OFICINA, EM SINTONIA"
        title="Visão geral"
        description="Uma boa cor começa com um bom método."
      >
        <Link href="/new" className="button primary">
          <Plus size={18} />
          Novo ajuste
        </Link>
      </Heading>
      <section className="dashboard-hero">
        <div>
          <Badge>MÉTODO DO MESTRE</Badge>
          <h2>
            Observe com atenção.
            <br />
            Corrija com direção.
          </h2>
          <p>
            Transforme cada avaliação em um ajuste registrado.
            <br />
            Do primeiro ângulo à cor aprovada.
          </p>
          <Link href="/new" className="button primary">
            Começar um ajuste
            <ArrowRight size={17} />
          </Link>
        </div>
        <div className="hero-compass">
          <Compass
            size="sm"
            rules={workspace.rules}
            selection={null}
            onSelect={() => router.push("/compass")}
            onActivate={() => router.push("/compass")}
          />
          <span>QUATRO TONS. OITO DIREÇÕES.</span>
        </div>
      </section>
      <div className="stats-grid">
        {[
          {
            label: "Ajustes em andamento",
            count: active.length,
            icon: FlaskConical,
            className: "green",
            text: "Na sua bancada",
            href: "/sessions",
          },
          {
            label: "Ajustes aprovados",
            count: approved.length,
            icon: CheckCheck,
            className: "blue",
            text: "Com histórico preservado",
            href: "/history",
          },
          {
            label: "Fórmulas registradas",
            count: workspace.formulas.length,
            icon: Files,
            className: "amber",
            text: "Fórmulas de partida",
            href: "/formulas",
          },
          {
            label: "Cores no banco",
            count: workspace.bank.length,
            icon: Library,
            className: "purple",
            text: "Conhecimento da oficina",
            href: "/bank",
          },
        ].map((s) => (
          <Link href={s.href} className="stat-card" key={s.label}>
            <div className="split">
              <span>{s.label}</span>
              <s.icon size={20} className={s.className} />
            </div>
            <strong>{s.count.toString().padStart(2, "0")}</strong>
            <small>
              {s.text}
              <ArrowRight size={13} />
            </small>
          </Link>
        ))}
      </div>
      <div className="dashboard-columns">
        <section className="panel">
          <div className="section-title">
            <div>
              <h2>Na bancada</h2>
              <p>Retome de onde parou.</p>
            </div>
            <Link className="text-link" href="/sessions">
              Ver todos
              <ArrowRight size={15} />
            </Link>
          </div>
          {active.length ? (
            <SessionsList sessions={active.slice(0, 4)} />
          ) : (
            <Empty
              title="Sua bancada está pronta"
              description="Cadastre a fórmula de origem para começar seu primeiro ajuste."
              href="/new"
              cta="Criar primeiro ajuste"
            />
          )}
        </section>
        <section className="panel method-card">
          <div className="section-title">
            <h2>O próximo passo é observar.</h2>
            <CompassIcon size={22} />
          </div>
          <p>No método, a correção começa pelo ângulo.</p>
          <ol>
            <li>
              <span>01</span> Aplique uma chapa de teste.
            </li>
            <li>
              <span>02</span> Identifique tom e direção no ângulo.
            </li>
            <li>
              <span>03</span> Corrija, teste e reavalie.
            </li>
          </ol>
          <Link href="/compass" className="text-link">
            Explorar a bússola
            <ArrowRight size={16} />
          </Link>
          <div className="method-footer">
            <Scale size={18} />
            <span>Dosagem em gramas somente com calibração validada.</span>
          </div>
        </section>
      </div>
      <div className="dashboard-columns">
        <section className="panel">
          <div className="section-title">
            <h2>Últimas fórmulas</h2>
            <Link href="/formulas" className="text-link">
              Ver fórmulas
              <ArrowRight size={15} />
            </Link>
          </div>
          {workspace.formulas.slice(0, 3).map((f) => (
            <Link className="recent-row" href={`/formulas/${f.id}`} key={f.id}>
              <Files size={19} />
              <span>
                <strong>
                  {f.colorCode} · {f.description}
                </strong>
                <small>
                  {f.manufacturer} {f.model}
                </small>
              </span>
              <ChevronRight size={16} />
            </Link>
          ))}
          {!workspace.formulas.length && (
            <p className="muted">As fórmulas de partida aparecerão aqui.</p>
          )}
        </section>
        <section className="panel">
          <div className="section-title">
            <h2>Últimas cores aprovadas</h2>
            <Link href="/bank" className="text-link">
              Abrir banco
              <ArrowRight size={15} />
            </Link>
          </div>
          {workspace.bank.slice(0, 3).map((b) => (
            <Link
              className="recent-row"
              href={`/sessions/${b.sessionId}`}
              key={b.id}
            >
              <CheckCheck size={19} />
              <span>
                <strong>
                  {b.session.formula.colorCode} ·{" "}
                  {b.session.formula.description}
                </strong>
                <small>
                  {b.professional} · {formatDate(b.createdAt)}
                </small>
              </span>
              <ChevronRight size={16} />
            </Link>
          ))}
          {!workspace.bank.length && (
            <p className="muted">
              Aprove um ajuste para guardar a primeira cor da oficina.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
function CompassView({ workspace }: { workspace: Workspace }) {
  // A posição é semântica (tom + subtom), não um id de regra: assim ela
  // sobrevive à troca de versão e à desativação de uma regra da oficina.
  const [selection, setSelection] = useState<CompassSelection>({
    mainTone: "YELLOW",
    direction: "REDISH",
  });
  const resolution = resolveSelection(workspace.rules, selection);
  const usable = canUseInAdjustment(resolution);
  const [viewMode, setViewMode] = useState<ObservationView>("ANGLE");
  const [choose, setChoose] = useState(false);
  const [showOpposition, setShowOpposition] = useState(false);
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="compass-header-bar">
        <Heading
          eyebrow="MÉTODO DO MESTRE DA COLORIMETRIA"
          title="Bússola da Colorimetria"
          description="Doze posições: quatro tons fundamentais e oito direções de subtom. Consulte o pigmento de corte da regra vigente na sua oficina."
        />
        <div className="compass-header-actions">
          <button
            type="button"
            className="button primary sm"
            onClick={() => setExpanded(true)}
            title="Abrir o mostrador ampliado em tela cheia"
          >
            <Maximize2 size={16} />
            Ampliar bússola
          </button>
          <button
            type="button"
            className="button secondary sm"
            onClick={() => setShowOpposition(true)}
            title="Conhecer o Princípio de Oposição e riscos de contaminação direta"
          >
            <CircleHelp size={16} />
            Regras de Oposição & Contaminação
          </button>
          <Link
            href="/pigments?consultor=1#consultor"
            className="button secondary sm"
            title="Encontrar bases pelo comportamento documentado na frente e no ângulo"
          >
            <Search size={16} />
            Consultar bases por comportamento
          </Link>
        </div>
      </div>

      <div className="compass-layout">
        <section className="panel compass-panel">
          <div className="compass-panel-header">
            <span className="panel-subtitle">DISCO CROMÁTICO · DOZE POSIÇÕES</span>
            <div className="panel-header-right">
              <span className="panel-hint">
                Clique, arraste ou use as setas do teclado
              </span>
              <button
                type="button"
                className="icon-button"
                aria-label="Ampliar bússola"
                title="Ampliar bússola"
                onClick={() => setExpanded(true)}
              >
                <Maximize2 size={17} />
              </button>
            </div>
          </div>

          <Compass
            rules={workspace.rules}
            selection={selection}
            onSelect={setSelection}
          />

          <ObservationModeBar mode={viewMode} onChange={setViewMode} />

          <div className="compass-method-callout">
            {viewMode === "ANGLE" ? (
              <div className="callout-box angle-mode">
                <span className="callout-tag">1º PASSO · MÉTODO PRIMEIRO ÂNGULO</span>
                <strong>Avaliação obrigatória do Flop (Ângulo na chapa):</strong>
                <p>
                  A correção sempre começa pelo ângulo. Os pigmentos sólidos definem o ângulo da cor.
                  Se o ângulo fecha na chapa, a frente tende a fechar sozinha.
                </p>
              </div>
            ) : (
              <div className="callout-box front-mode">
                <span className="callout-tag">2º PASSO · AVALIAÇÃO DA FRENTE</span>
                <strong>Avaliação da Frente (Face sob luz normal):</strong>
                <p>
                  Partículas de efeito (alumínio e pérola) influenciam a frente. Apenas reavalie a frente com nova chapa
                  após o ângulo estar rigorosamente fechado.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="panel compass-result">
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

          <CompassDiagnosis resolution={resolution} onSelect={setSelection} />

          <div className="result-footer">
            {resolution.status === "RULE" && (
              <small className="result-source-meta">
                {resolution.rule.source} · Regra v{resolution.rule.version}
              </small>
            )}

            <button
              className="button primary w-full"
              disabled={!usable}
              onClick={() => setChoose(true)}
            >
              Usar neste ajuste
              <ArrowRight size={17} />
            </button>

            {resolution.status === "RULE" && !resolution.rule.active && (
              <Alert error>
                Regra desativada pela oficina: consulta permitida, uso
                bloqueado.
              </Alert>
            )}
            {viewMode === "FRONT" && usable && (
              <Alert>
                A consulta está em Frente. O diagnóstico registrado no ajuste
                continua sendo o do ângulo.
              </Alert>
            )}
          </div>
        </section>
      </div>

      <CompassShelf
        rules={workspace.rules}
        selection={selection}
        onSelect={setSelection}
      />

      <section className="panel compass-second-disc">
        <div className="section-title">
          <div>
            <h2>Segundo disco da referência</h2>
            <p>
              Reproduzido como aparece na imagem: dois quadrantes com a
              identidade gráfica e dois quadrantes claros divididos em três
              setores.
            </p>
          </div>
        </div>
        <CompassIdentityDisc />
        <p className="muted">
          A imagem não demonstra se este disco é máscara, capa, verso ou peça
          móvel, nem qual camada gira. Enquanto não houver fonte que confirme a
          mecânica, ele é apresentado separado do disco cromático e a consulta
          interativa acontece no disco de cima. A arte de marca é uma
          aproximação em vetor.
        </p>
      </section>

      {showOpposition && (
        <Dialog
          title="Princípio de Oposição & Riscos de Contaminação"
          close={() => setShowOpposition(false)}
        >
          <div className="stack opposition-modal-content">
            <div className="opposition-banner">
              <span className="banner-alert-tag">REGRA FUNDAMENTAL DO MÉTODO SEMIDA</span>
              <p>
                A cor automotiva exige neutralização de subtons por transição óptica, nunca pela mistura
                bruta de cores primárias opostas.
              </p>
            </div>

            <div className="opposition-rules-grid">
              <div className="opposition-item">
                <div className="opposition-header">
                  <span className="symbol-prohibit">❌</span>
                  <strong>Amarelo vs Azul (Direto)</strong>
                </div>
                <p>
                  <strong>NUNCA adicione Azul diretamente no Amarelo (ou vice-versa).</strong>
                  O encontro direto de amarelo e azul produz verde indesejado e uma lama acinzentada que destrói a
                  luminosidade da chapa. O corte correto usa azul esverdeado, violeta ou amarelo limão conforme o subtom.
                </p>
              </div>

              <div className="opposition-item">
                <div className="opposition-header">
                  <span className="symbol-prohibit">❌</span>
                  <strong>Verde vs Vermelho (Direto)</strong>
                </div>
                <p>
                  <strong>NUNCA adicione Vermelho diretamente no Verde (ou vice-versa).</strong>
                  A mistura direta sem direção transforma a tinta em marrom escuro opaco e sem reflexo metálico. O corte
                  deve ser feito com Violeta Roxo e Óxido para preservar a pureza.
                </p>
              </div>
            </div>

            <div className="opposition-summary">
              <strong>Como funciona a Fórmula Secreta:</strong>
              <p>
                Identifique primeiro o tom principal (Amarelo, Azul, Verde ou Vermelho), em seguida verifique a direção do
                subtom no ângulo (flop). O pigmento indicado na bússola cortará exclusivamente o desvio, conservando a
                matriz original limpa.
              </p>
            </div>

            <button
              type="button"
              className="button primary"
              onClick={() => setShowOpposition(false)}
            >
              Compreendi as regras
            </button>
          </div>
        </Dialog>
      )}

      {expanded && (
        <CompassModal
          rules={workspace.rules}
          selection={selection}
          onSelect={setSelection}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          close={() => setExpanded(false)}
          onUse={() => {
            setExpanded(false);
            setChoose(true);
          }}
        />
      )}

      {choose && resolution.status === "RULE" && usable && (
        <Dialog
          title="Escolha o ajuste em andamento"
          close={() => setChoose(false)}
        >
          <div className="stack">
            {workspace.sessions
              .filter((s) => s.status === "IN_PROGRESS")
              .map((s) => (
                <Link
                  key={s.id}
                  href={`/sessions/${s.id}?diagnosis=${resolution.mainTone}.${resolution.direction}`}
                  className="button secondary"
                >
                  {s.formula.colorCode} · {s.formula.description}
                  <ArrowRight size={16} />
                </Link>
              ))}
            {!workspace.sessions.some((s) => s.status === "IN_PROGRESS") && (
              <Empty
                title="Nenhum ajuste em andamento"
                description="Comece pela fórmula de origem e registre a primeira chapa."
                href="/new"
                cta="Novo ajuste"
              />
            )}
          </div>
        </Dialog>
      )}
    </>
  );
}
function BankView({ workspace }: { workspace: Workspace }) {
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get("q") || "");
  const rows = workspace.bank.filter((b) =>
    search
      .toLowerCase()
      .split(/\s+/)
      .every((term) => b.searchText.includes(term)),
  );
  return (
    <>
      <Heading
        eyebrow="CONHECIMENTO DA OFICINA"
        title="Banco de Cores"
        description="Fórmulas aprovadas, testes e o caminho percorrido até cada cor."
      />
      <div className="toolbar">
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Buscar no Banco de Cores"
            placeholder="Código, veículo, ano, pigmento, linha ou profissional…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <Badge>
          {rows.length} {rows.length === 1 ? "COR" : "CORES"}
        </Badge>
      </div>
      <div className="bank-grid">
        {rows.map((b) => (
          <Link
            href={`/sessions/${b.sessionId}`}
            key={b.id}
            className="panel bank-card"
          >
            <div className="bank-card-top">
              <Library size={28} />
              <Badge kind="success">APROVADA</Badge>
            </div>
            <code>{b.session.formula.colorCode}</code>
            <h2>{b.session.formula.description}</h2>
            <p>
              {b.session.formula.manufacturer} {b.session.formula.model} ·{" "}
              {b.session.formula.year}
            </p>
            {b.session.formula.isDemo && (
              <Badge kind="warning">DADO DEMONSTRATIVO</Badge>
            )}
            <div className="bank-meta">
              <span>
                {paintLabels[b.session.formula.paintType]} ·{" "}
                {formatMass(b.session.currentMassG)} g
              </span>
              <span>{b.professional}</span>
              <small>{formatDate(b.createdAt)}</small>
            </div>
            <span className="text-link">
              Ver fórmula e histórico
              <ArrowRight size={16} />
            </span>
          </Link>
        ))}
      </div>
      {!rows.length && (
        <Empty
          title={
            search
              ? "Nenhuma cor encontrada"
              : "Sua próxima cor aprovada começa aqui"
          }
          description={
            search
              ? "Experimente outro código, modelo ou pigmento."
              : "Ao aprovar um ajuste, a fórmula final e todo o histórico ficam disponíveis neste banco."
          }
          href={search ? undefined : "/new"}
          cta="Novo ajuste"
        />
      )}
    </>
  );
}
function FormulaDetails({
  workspace,
  id,
  refresh,
}: {
  workspace: Workspace;
  id: string;
  refresh: () => Promise<void>;
}) {
  const formula = workspace.formulas.find((f) => f.id === id);
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  if (!formula)
    return (
      <Empty
        title="Fórmula não encontrada"
        description="O registro não está disponível nesta oficina."
      />
    );
  return (
    <>
      <Heading
        eyebrow="FÓRMULA DE PARTIDA"
        title={`${formula.colorCode} · ${formula.description}`}
        description={`${formula.manufacturer} ${formula.model} · ${formula.year}`}
      >
        <button
          className="button primary"
          disabled={pending}
          onClick={async () => {
            setPending(true);
            try {
              const result = await mutation("startFromFormula", {
                formulaId: id,
              });
              await refresh();
              router.push(`/sessions/${result.id}`);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Erro ao iniciar.");
            } finally {
              setPending(false);
            }
          }}
        >
          <Plus size={17} />
          Iniciar ajuste
        </button>
      </Heading>
      {error && <Alert error>{error}</Alert>}
      {formula.isDemo && <Alert>DADO DEMONSTRATIVO</Alert>}
      <section className="panel">
        <FormulaTable formula={formula} />
        <div className="info-grid">
          <span>
            Sistema<strong>{formula.paintSystem}</strong>
          </span>
          <span>
            Linha<strong>{formula.productLine}</strong>
          </span>
          <span>
            Tipo<strong>{paintLabels[formula.paintType]}</strong>
          </span>
          <span>
            Origem<strong>{formula.source}</strong>
          </span>
        </div>
        <p>{formula.notes}</p>
      </section>
      <section className="panel">
        <h2>Ajustes desta fórmula</h2>
        <SessionsList
          sessions={workspace.sessions.filter(
            (s) => s.formulaId === formula.id,
          )}
        />
      </section>
    </>
  );
}
function Listing({
  workspace,
  kind,
}: {
  workspace: Workspace;
  kind: "sessions" | "history" | "formulas";
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const isFormula = kind === "formulas";
  const sessions = workspace.sessions.filter(
    (s) =>
      (kind !== "sessions" || s.status === "IN_PROGRESS") &&
      (!status || s.status === status) &&
      `${s.formula.colorCode} ${s.formula.manufacturer} ${s.formula.model} ${s.formula.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const formulas = workspace.formulas.filter((f) =>
    `${f.colorCode} ${f.manufacturer} ${f.model} ${f.description}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <Heading
        eyebrow={isFormula ? "PONTO DE PARTIDA" : "BANCADA DE TRABALHO"}
        title={
          isFormula
            ? "Fórmulas"
            : kind === "history"
              ? "Histórico de ajustes"
              : "Meus ajustes"
        }
        description={
          isFormula
            ? "Fórmulas registradas pelo profissional, com origem e componentes preservados."
            : "Cada observação e cada adição, registradas ao longo do processo."
        }
      >
        <Link
          className="button primary"
          href={isFormula ? "/formulas/new" : "/new"}
        >
          <Plus size={17} />
          {isFormula ? "Cadastrar fórmula" : "Novo ajuste"}
        </Link>
      </Heading>
      <div className="toolbar">
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Buscar registros"
            placeholder="Buscar código, cor ou veículo…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        {kind === "history" && (
          <select
            aria-label="Status dos ajustes"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="IN_PROGRESS">Em andamento</option>
            <option value="APPROVED">Aprovados</option>
            <option value="ARCHIVED">Arquivados</option>
          </select>
        )}
      </div>
      <section className="panel">
        {isFormula ? (
          formulas.map((f) => (
            <Link key={f.id} href={`/formulas/${f.id}`} className="recent-row">
              <Files size={22} />
              <span>
                <strong>
                  {f.colorCode} · {f.description}
                </strong>
                <small>
                  {f.manufacturer} {f.model} · {f.year}
                  {f.isDemo ? " · DADO DEMONSTRATIVO" : ""}
                </small>
              </span>
              <b>{formatMass(f.desiredMassG)} g</b>
              <ChevronRight size={17} />
            </Link>
          ))
        ) : (
          <SessionsList sessions={sessions} />
        )}{" "}
        {!(isFormula ? formulas.length : sessions.length) && (
          <Empty
            title="Nenhum registro por aqui"
            description="Cadastre uma fórmula ou ajuste os filtros de busca."
            href={isFormula ? "/formulas/new" : "/new"}
            cta={isFormula ? "Cadastrar fórmula" : "Novo ajuste"}
          />
        )}
      </section>
      {isFormula && (
        <section className="panel">
          <h2>Consultar fórmula oficial</h2>
          <p>Use o sistema do fabricante e registre a fórmula obtida.</p>
          <div className="official-links">
            {Array.isArray(workspace.organization.officialLinks) &&
              workspace.organization.officialLinks.map((l, i) =>
                typeof l === "object" &&
                l &&
                "url" in l &&
                "label" in l &&
                typeof l.url === "string" &&
                typeof l.label === "string" ? (
                  <a
                    className="button secondary"
                    key={i}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {l.label}
                    <ExternalLink size={15} />
                  </a>
                ) : null,
              )}
          </div>
        </section>
      )}
    </>
  );
}
export function Workbench() {
  const pathname = usePathname();
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [error, setError] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const refresh = useCallback(async () => {
    const response = await fetch("/api/workspace", { cache: "no-store" });
    if (response.status === 401) {
      router.push("/login");
      return;
    }
    if (!response.ok)
      throw new Error(
        "Não foi possível carregar a oficina. Confira a conexão e tente novamente.",
      );
    /* Contrato derivado dos tipos do repositório; Decimal e Date são serializados pelo servidor. */ const data =
      (await response.json()) as Workspace;
    setWorkspace(data);
    setError("");
  }, [router]);
  useEffect(() => {
    let cancelled = false;
    fetch("/api/workspace", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          router.push("/login");
          return;
        }
        if (!response.ok)
          throw new Error("Não foi possível carregar a oficina.");
        const data = (await response.json()) as Workspace;
        if (!cancelled) setWorkspace(data);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Erro de conexão.");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);
  if (!workspace)
    return (
      <main className="loading-page">
        {error ? (
          <>
            <Alert error>{error}</Alert>
            <button
              className="button primary"
              onClick={() => refresh().catch((e) => setError(String(e)))}
            >
              Tentar novamente
            </button>
          </>
        ) : (
          <>
            <LoaderCircle className="spin" />
            <p>Preparando sua bancada…</p>
          </>
        )}
      </main>
    );
  const segments = pathname.split("/").filter(Boolean);
  const section = segments[0] || "";
  const id = segments[1];
  const title =
    [...nav, ...adminNav].find((n) => n.href === `/${section}`)?.label ||
    "Novo ajuste";
  const admin = workspace.actor.role === "ADMIN";
  let content;
  if (!section) content = <Dashboard workspace={workspace} />;
  else if (section === "new") content = <FormulaForm refresh={refresh} />;
  else if (section === "sessions" && id)
    content = (
      <SessionView
        key={id}
        id={id}
        workspace={workspace}
        refresh={refresh}
      />
    );
  else if (section === "sessions" || section === "history")
    content = <Listing workspace={workspace} kind={section} />;
  else if (section === "formulas" && id === "new")
    content = <FormulaForm standalone refresh={refresh} />;
  else if (section === "formulas" && id)
    content = (
      <FormulaDetails workspace={workspace} id={id} refresh={refresh} />
    );
  else if (section === "formulas")
    content = <Listing workspace={workspace} kind="formulas" />;
  else if (section === "compass")
    content = <CompassView workspace={workspace} />;
  else if (section === "bank") content = <BankView workspace={workspace} />;
  else if (section === "account")
    content = <AccountView workspace={workspace} />;
  else if (section === "pigments")
    content = <PigmentsView workspace={workspace} refresh={refresh} />;
  else if (section === "help") content = <HelpView />;
  else if (admin && section === "rules")
    content = <RulesView workspace={workspace} refresh={refresh} />;
  else if (admin && section === "coefficients")
    content = <CoefficientsView workspace={workspace} refresh={refresh} />;
  else if (admin && section === "settings")
    content = <SettingsView workspace={workspace} refresh={refresh} />;
  else
    content = (
      <Empty
        title="Página indisponível"
        description="Verifique o endereço e seu perfil de acesso."
        href="/"
        cta="Voltar à visão geral"
      />
    );
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Pular para conteúdo
      </a>
      {mobileOpen && (
        <button
          className="sidebar-backdrop"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside className={`sidebar ${mobileOpen ? "open" : ""}`}>
        <Link href="/" className="brand" onClick={() => setMobileOpen(false)}>
          <span className="brand-mark">
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>
            MESTRE<span className="brand-sub">DA COLORIMETRIA</span>
          </span>
        </Link>
        <button
          className="icon-button mobile-close"
          aria-label="Fechar navegação"
          onClick={() => setMobileOpen(false)}
        >
          <X />
        </button>
        <div className="workspace-label">
          <span className="workspace-dot" />
          <div>
            {workspace.organization.name}
            <small>ESPAÇO DE TRABALHO</small>
          </div>
        </div>
        <span className="nav-label">PRINCIPAL</span>
        <nav aria-label="Menu principal">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setMobileOpen(false)}
              className={
                (
                  n.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(n.href)
                )
                  ? "active"
                  : ""
              }
            >
              <n.icon size={19} />
              {n.label}
              {n.href === "/sessions" &&
                workspace.sessions.some((s) => s.status === "IN_PROGRESS") && (
                  <span className="nav-count">
                    {
                      workspace.sessions.filter(
                        (s) => s.status === "IN_PROGRESS",
                      ).length
                    }
                  </span>
                )}
            </Link>
          ))}
        </nav>
        {admin && (
          <>
            <span className="nav-label">ADMINISTRAÇÃO</span>
            <nav aria-label="Administração">
              {adminNav.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setMobileOpen(false)}
                  className={pathname.startsWith(n.href) ? "active" : ""}
                >
                  <n.icon size={18} />
                  {n.label}
                </Link>
              ))}
            </nav>
          </>
        )}
        <div className="sidebar-bottom">
          <div className="mini-method">
            <CompassIcon size={20} />
            <div>
              Conhecimento com método.
              <small>Precisão com responsabilidade.</small>
            </div>
          </div>
          <div className="user-profile">
            <span className="avatar">{workspace.actor.name.slice(0, 1)}</span>
            <Link
              href="/account"
              aria-label="Minha conta"
              onClick={() => setMobileOpen(false)}
            >
              <strong>{workspace.actor.name}</strong>
              <small>{admin ? "Administrador" : "Profissional"}</small>
            </Link>
            <button
              className="icon-button"
              aria-label="Sair"
              onClick={async () => {
                await authClient.signOut();
                router.push("/login");
              }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            aria-label="Abrir menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            Oficina
            <ChevronRight size={13} />
            <strong>{title}</strong>
          </div>
          <div className="topbar-end">
            <ThemeToggle compact />
            <span>
              <Clock3 size={14} /> Registro em tempo real
            </span>
            <Link
              href="/help"
              className="icon-button"
              aria-label="Manual do Usuário e Central de Ajuda"
              title="Manual do Usuário e Central de Ajuda"
            >
              <CircleHelp size={19} />
            </Link>
            <span className="avatar small">
              {workspace.actor.name.slice(0, 1)}
            </span>
          </div>
        </header>
        <main id="main" className="main-content" key={pathname}>
          {error && <Alert error>{error}</Alert>}
          {content}
          <footer className="page-footer">
            <span>MESTRE DA COLORIMETRIA</span>
            <span>Observar. Corrigir. Testar. Registrar.</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
