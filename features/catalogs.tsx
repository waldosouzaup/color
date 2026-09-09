"use client";
import { useState } from "react";
import {
  Plus,
  Search,
  Pencil,
  FlaskConical,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import {
  Heading,
  Badge,
  Empty,
  Dialog,
  SaveForm,
  Field,
  value,
  Alert,
} from "@/components/ui";
import type { Workspace, Pigment } from "@/lib/client-types";
import { mutation, action, paintLabels, formatDate } from "@/lib/client-api";
import { characteristics } from "@/domain/colorimetry/types";
import { pigmentLabels } from "@/domain/colorimetry/tones";
type Coefficient = Workspace["coefficients"][number];
export function PigmentsView({
  workspace,
  refresh,
}: {
  workspace: Workspace;
  refresh: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [edit, setEdit] = useState<Pigment | "new" | null>(null);
  const [filter, setFilter] = useState("");
  const admin = workspace.actor.role === "ADMIN";
  const rows = workspace.pigments.filter(
    (p) =>
      `${p.code} ${p.name} ${p.manufacturer} ${p.productLine}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (!filter || p.characteristic === filter),
  );
  const p = edit && edit !== "new" ? edit : null;
  return (
    <>
      <Heading
        eyebrow="REFERÊNCIA TÉCNICA"
        title="Biblioteca de pigmentos"
        description="Bases, características e comportamento na frente e no ângulo."
      >
        {admin && (
          <button className="button primary" onClick={() => setEdit("new")}>
            <Plus size={17} />
            Cadastrar pigmento
          </button>
        )}
      </Heading>
      <div className="toolbar">
        <label className="search">
          <Search size={18} />
          <input
            aria-label="Buscar pigmentos"
            placeholder="Buscar nome, código, fabricante ou linha…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Filtrar característica"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">Todas as características</option>
          {characteristics.map((c) => (
            <option key={c} value={c}>
              {pigmentLabels[c]}
            </option>
          ))}
        </select>
      </div>
      <div className="pigment-grid">
        {rows.map((p) => (
          <article
            key={p.id}
            className={`panel pigment-card ${!p.active ? "inactive" : ""}`}
          >
            <div className="split">
              <span
                className={`large-pigment ${p.characteristic?.toLowerCase() || ""}`}
              >
                <FlaskConical size={22} />
              </span>
              {admin && (
                <button
                  className="icon-button"
                  aria-label={`Editar ${p.code}`}
                  onClick={() => setEdit(p)}
                >
                  <Pencil size={17} />
                </button>
              )}
            </div>
            <code>{p.code}</code>
            <h3>{p.name}</h3>
            <p>
              {p.manufacturer} · {p.productLine}
            </p>
            <div className="badge-row">
              {p.isDemo && <Badge kind="warning">DADO DEMONSTRATIVO</Badge>}
              {!p.active && <Badge>INATIVO</Badge>}
              <Badge>{p.family}</Badge>
            </div>
            <p>{p.description}</p>
            {p.behaviors.map((b) => (
              <details key={b.id}>
                <summary>
                  {b.view === "FRONT"
                    ? "Frente"
                    : b.view === "ANGLE"
                      ? "Ângulo"
                      : "Comportamento geral"}
                </summary>
                {b.hueCharacteristic && <p>Matiz: {b.hueCharacteristic}</p>}
                {b.lightnessEffect && <p>Luminosidade: {b.lightnessEffect}</p>}
                {b.cleanlinessEffect && <p>Limpeza: {b.cleanlinessEffect}</p>}
                {b.particleEffect && <p>Partículas: {b.particleEffect}</p>}
                <p>{b.notes}</p>
                <small>
                  Fonte: {b.source} · {b.sourceReference}
                </small>
              </details>
            ))}
          </article>
        ))}
      </div>
      {!rows.length && (
        <Empty
          title="Nenhum pigmento encontrado"
          description="Cadastre as bases da oficina ou ajuste os termos da busca."
        />
      )}
      {edit && (
        <Dialog
          title={p ? "Editar pigmento" : "Cadastrar pigmento"}
          close={() => setEdit(null)}
        >
          <SaveForm
            onDone={async () => {
              await refresh();
              setEdit(null);
            }}
            onSubmit={(f) =>
              mutation("pigment", {
                id: p?.id,
                ...Object.fromEntries(
                  [
                    "manufacturer",
                    "productLine",
                    "code",
                    "name",
                    "systemType",
                    "family",
                    "direction",
                    "description",
                    "notes",
                    "reason",
                  ].map((k) => [k, value(f, k)]),
                ),
                characteristic: value(f, "characteristic") || undefined,
                active: f.has("active"),
                isDemo: f.has("isDemo"),
                behaviors: ["GENERAL", "ANGLE", "FRONT"]
                  .filter((view) => value(f, `${view}-source`))
                  .map((view) => ({
                    view,
                    ...Object.fromEntries(
                      [
                        "hueCharacteristic",
                        "lightnessEffect",
                        "cleanlinessEffect",
                        "particleEffect",
                        "notes",
                        "source",
                        "sourceReference",
                      ].map((k) => [k, value(f, `${view}-${k}`)]),
                    ),
                  })),
              })
            }
          >
            <div className="form-grid">
              {[
                ["manufacturer", "Fabricante"],
                ["productLine", "Linha"],
                ["code", "Código"],
                ["name", "Nome"],
                ["systemType", "Sistema"],
                ["family", "Família"],
              ].map(([k, l]) => (
                <Field label={l} key={k}>
                  <input
                    required
                    name={k}
                    defaultValue={p ? String(p[k as keyof Pigment] || "") : ""}
                  />
                </Field>
              ))}
            </div>
            <Field label="Característica de correção">
              <select
                name="characteristic"
                defaultValue={p?.characteristic || ""}
              >
                <option value="">Sem vínculo de matiz / base de efeito</option>
                {characteristics.map((c) => (
                  <option key={c} value={c}>
                    {pigmentLabels[c]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Direção">
              <input name="direction" defaultValue={p?.direction || ""} />
            </Field>
            <Field label="Descrição">
              <textarea name="description" defaultValue={p?.description} />
            </Field>
            {["GENERAL", "ANGLE", "FRONT"].map((view) => {
              const b = p?.behaviors.find((b) => b.view === view);
              return (
                <details key={view}>
                  <summary>
                    {view === "GENERAL"
                      ? "Características gerais"
                      : view === "ANGLE"
                        ? "Características no ângulo"
                        : "Características na frente"}
                  </summary>
                  <div className="form-grid">
                    {[
                      ["hueCharacteristic", "Matiz"],
                      ["lightnessEffect", "Luminosidade"],
                      ["cleanlinessEffect", "Limpeza"],
                      ["particleEffect", "Efeito das partículas"],
                      ["source", "Fonte (preencha para registrar)"],
                      ["sourceReference", "Referência / página"],
                      ["notes", "Observações"],
                    ].map(([k, l]) => (
                      <Field key={k} label={l}>
                        <input
                          name={`${view}-${k}`}
                          defaultValue={
                            b ? String(b[k as keyof typeof b] || "") : ""
                          }
                        />
                      </Field>
                    ))}
                  </div>
                </details>
              );
            })}
            <Field label="Observações">
              <textarea name="notes" defaultValue={p?.notes} />
            </Field>
            <label className="checkbox">
              <input type="checkbox" name="isDemo" defaultChecked={p?.isDemo} />
              DADO DEMONSTRATIVO
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                name="active"
                defaultChecked={p?.active ?? true}
              />
              Base ativa
            </label>
            <Field label="Motivo do cadastro ou alteração">
              <input name="reason" required />
            </Field>
          </SaveForm>
        </Dialog>
      )}
    </>
  );
}
export function CoefficientsView({
  workspace,
  refresh,
}: {
  workspace: Workspace;
  refresh: () => Promise<void>;
}) {
  const [edit, setEdit] = useState<Coefficient | "new" | null>(null);
  const c = edit && edit !== "new" ? edit : null;
  return (
    <>
      <Heading
        eyebrow="ADMINISTRAÇÃO · DOSAGEM"
        title="Coeficientes de calibração"
        description="Evidência, validação e versões para cada recomendação quantitativa."
      >
        <button className="button primary" onClick={() => setEdit("new")}>
          <Plus size={17} />
          Novo coeficiente
        </button>
      </Heading>
      <Alert>
        Somente coeficientes VERIFIED, aprovados e vinculados à base e ao
        contexto exatos, liberam dosagem. Alterar um coeficiente verificado cria
        uma nova versão em rascunho.
      </Alert>
      <div className="stack">
        {workspace.coefficients.map((c) => (
          <article className="panel" key={c.id}>
            <div className="split">
              <div>
                <div className="badge-row">
                  <Badge kind={c.status === "VERIFIED" ? "success" : "warning"}>
                    {c.status}
                  </Badge>
                  <Badge>VERSÃO {c.version}</Badge>
                  {!c.active && <Badge>SUBSTITUÍDO / RETIRADO</Badge>}
                </div>
                <h3>
                  {workspace.rules.find((r) => r.id === c.correctionRuleId)
                    ?.diagnosisLabel || c.correctionRuleId}
                </h3>
                <p>
                  {c.paintSystem} · {paintLabels[c.paintType]} · {c.severity} ·{" "}
                  {workspace.pigments.find((p) => p.id === c.pigmentId)?.code ||
                    "Base não vinculada"}
                </p>
                <p>
                  <strong>{c.gramsPer100g} g / 100 g</strong> · {c.sampleSize}{" "}
                  amostras · Fonte: {c.source}
                </p>
                {c.isDemo && (
                  <Badge kind="warning">DEMO — NÃO UTILIZAR EM PRODUÇÃO</Badge>
                )}
              </div>
              {c.active && (
                <button className="button secondary" onClick={() => setEdit(c)}>
                  <Pencil size={15} />
                  Nova versão
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
      {!workspace.coefficients.length && (
        <Empty
          title="Nenhuma dosagem calibrada"
          description="Registre um coeficiente apenas quando houver evidência quantitativa documentada. Adições manuais já estão disponíveis nos ajustes."
        />
      )}
      {edit && (
        <Dialog
          title={c ? `Nova versão · v${c.version + 1}` : "Novo coeficiente"}
          close={() => setEdit(null)}
        >
          <SaveForm
            onDone={async () => {
              await refresh();
              setEdit(null);
            }}
            onSubmit={(f) =>
              mutation("coefficient", {
                previousVersionId: c?.id,
                correctionRuleId: value(f, "correctionRuleId"),
                pigmentId: value(f, "pigmentId") || undefined,
                paintSystem: value(f, "paintSystem"),
                paintType: value(f, "paintType"),
                severity: value(f, "severity"),
                gramsPer100g: value(f, "gramsPer100g"),
                minimumSuggestedG: value(f, "minimumSuggestedG"),
                maximumSuggestedG: value(f, "maximumSuggestedG"),
                precision: Number(value(f, "precision")),
                status: value(f, "status"),
                source: value(f, "source"),
                sampleSize: Number(value(f, "sampleSize")),
                notes: value(f, "notes"),
                reason: value(f, "reason"),
                isDemo: f.has("isDemo"),
              })
            }
          >
            <Field label="Regra de correção">
              <select
                name="correctionRuleId"
                defaultValue={c?.correctionRuleId}
              >
                {workspace.rules
                  .filter((r) => r.active)
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.diagnosisLabel} · v{r.version}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Base calibrada">
              <select name="pigmentId" defaultValue={c?.pigmentId || ""}>
                <option value="">Vincular posteriormente (rascunho)</option>
                {workspace.pigments
                  .filter((p) => p.active)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} · {p.name}
                    </option>
                  ))}
              </select>
            </Field>
            <div className="form-grid">
              <Field label="Sistema de pintura (correspondência exata)">
                <input
                  required
                  name="paintSystem"
                  defaultValue={c?.paintSystem}
                />
              </Field>
              <Field label="Tipo de tinta">
                <select name="paintType" defaultValue={c?.paintType}>
                  {Object.entries(paintLabels).map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Severidade">
                <select name="severity" defaultValue={c?.severity}>
                  <option value="LIGHT">Leve</option>
                  <option value="MEDIUM">Média</option>
                  <option value="STRONG">Forte</option>
                </select>
              </Field>
              <Field label="Gramas por 100 g">
                <input
                  name="gramsPer100g"
                  required
                  inputMode="decimal"
                  defaultValue={c?.gramsPer100g}
                />
              </Field>
              <Field label="Mínimo sugerido (g, opcional)">
                <input
                  name="minimumSuggestedG"
                  defaultValue={c?.minimumSuggestedG || ""}
                />
              </Field>
              <Field label="Máximo sugerido (g, opcional)">
                <input
                  name="maximumSuggestedG"
                  defaultValue={c?.maximumSuggestedG || ""}
                />
              </Field>
              <Field label="Casas decimais">
                <input
                  type="number"
                  name="precision"
                  min="0"
                  max="4"
                  required
                  defaultValue={c?.precision ?? 2}
                />
              </Field>
              <Field label="Quantidade de amostras">
                <input
                  type="number"
                  name="sampleSize"
                  min="0"
                  required
                  defaultValue={c?.sampleSize ?? 0}
                />
              </Field>
            </div>
            <Field label="Status">
              <select
                name="status"
                defaultValue={
                  c?.status === "VERIFIED" ? "DRAFT" : c?.status || "DRAFT"
                }
              >
                <option value="DRAFT">DRAFT — Rascunho</option>
                <option value="TESTING">TESTING — Em teste</option>
                <option value="VERIFIED">VERIFIED — Validado por mim</option>
                <option value="RETIRED">RETIRED — Retirado</option>
              </select>
            </Field>
            <Field label="Fonte da validação">
              <input name="source" required defaultValue={c?.source} />
            </Field>
            <Field label="Observações técnicas">
              <textarea name="notes" defaultValue={c?.notes} />
            </Field>
            <Field label="Motivo da alteração / aprovação">
              <textarea name="reason" required />
            </Field>
            <label className="checkbox">
              <input type="checkbox" name="isDemo" defaultChecked={c?.isDemo} />
              DEMO — NÃO UTILIZAR EM PRODUÇÃO
            </label>
          </SaveForm>
        </Dialog>
      )}
    </>
  );
}
export function RulesView({
  workspace,
  refresh,
}: {
  workspace: Workspace;
  refresh: () => Promise<void>;
}) {
  const [edit, setEdit] = useState<Workspace["rules"][number] | null>(null);
  return (
    <>
      <Heading
        eyebrow="ADMINISTRAÇÃO · MOTOR DE MATIZ"
        title="Regras de correção"
        description="Oito combinações do método. Alterações são versionadas e limitadas à sua oficina."
      />
      <div className="rules-list">
        {workspace.rules.map((r, i) => (
          <article className="panel rule-card" key={r.id}>
            <span className={`rule-number ${r.mainTone.toLowerCase()}`}>
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h3>{r.diagnosisLabel}</h3>
              <p>
                {r.outputs
                  .map(
                    (o) =>
                      `${pigmentLabels[o.pigmentCharacteristic]}${o.role === "SUPPORT" ? " (suporte opcional)" : ""}`,
                  )
                  .join(
                    r.outputs.some((o) => o.role === "ALTERNATIVE")
                      ? " ou "
                      : " + ",
                  )}
              </p>
              <small>
                {r.source} · v{r.version} · {r.active ? "Ativa" : "Inativa"}
              </small>
            </div>
            <button
              className="icon-button"
              aria-label={`Editar ${r.diagnosisLabel}`}
              onClick={() => setEdit(r)}
            >
              <Pencil size={18} />
            </button>
          </article>
        ))}
      </div>
      {edit && (
        <Dialog
          title={`Versionar: ${edit.diagnosisLabel}`}
          close={() => setEdit(null)}
        >
          <SaveForm
            onDone={async () => {
              await refresh();
              setEdit(null);
            }}
            onSubmit={(f) =>
              mutation("rule", {
                baseId: edit.id,
                mainTone: edit.mainTone,
                direction: edit.direction,
                diagnosisLabel: value(f, "diagnosisLabel"),
                notes: value(f, "notes"),
                source: value(f, "source"),
                active: f.has("active"),
                outputs: JSON.parse(value(f, "outputs")),
                reason: value(f, "reason"),
              })
            }
          >
            <Alert>
              As recomendações já registradas mantêm a versão original.
              Coeficientes anteriores não serão reaproveitados automaticamente.
            </Alert>
            <Field label="Diagnóstico">
              <input
                required
                name="diagnosisLabel"
                defaultValue={edit.diagnosisLabel}
              />
            </Field>
            <Field label="Objetivo e observações">
              <textarea required name="notes" defaultValue={edit.notes} />
            </Field>
            <Field label="Fonte técnica">
              <input required name="source" defaultValue={edit.source} />
            </Field>
            <Field
              label="Saídas da regra (JSON técnico)"
              hint="Papéis: PRIMARY, ALTERNATIVE, COMBINED, SUPPORT. O backend valida a estrutura."
            >
              <textarea
                className="code-editor"
                required
                name="outputs"
                rows={12}
                defaultValue={JSON.stringify(edit.outputs, null, 2)}
              />
            </Field>
            <label className="checkbox">
              <input
                type="checkbox"
                name="active"
                defaultChecked={edit.active}
              />
              Regra ativa
            </label>
            <Field label="Motivo da nova versão">
              <textarea required name="reason" />
            </Field>
          </SaveForm>
        </Dialog>
      )}
    </>
  );
}
export function SettingsView({
  workspace,
  refresh,
}: {
  workspace: Workspace;
  refresh: () => Promise<void>;
}) {
  const [addUser, setAddUser] = useState(false);
  const [resetUser, setResetUser] = useState<Workspace["users"][number] | null>(
    null,
  );
  const [saved, setSaved] = useState(false);
  const [userError, setUserError] = useState("");
  const links = Array.isArray(workspace.organization.officialLinks)
    ? workspace.organization.officialLinks.filter(
        (l): l is { label: string; url: string } =>
          typeof l === "object" &&
          l !== null &&
          "label" in l &&
          "url" in l &&
          typeof l.label === "string" &&
          typeof l.url === "string",
      )
    : [];
  return (
    <>
      <Heading
        eyebrow="ADMINISTRAÇÃO"
        title="Configurações"
        description="Sua oficina, equipe e referências externas."
      />
      {saved && <Alert>Configurações salvas.</Alert>}
      <div className="session-columns">
        <section className="panel">
          <h2>Dados da oficina</h2>
          <SaveForm
            onDone={async () => {
              await refresh();
              setSaved(true);
            }}
            onSubmit={(f) =>
              action("settings", {
                name: value(f, "name"),
                precision: Number(value(f, "precision")),
                officialLinks: links.map((_, i) => ({
                  label: value(f, `label-${i}`),
                  url: value(f, `url-${i}`),
                })),
              })
            }
          >
            <Field label="Nome da oficina">
              <input
                required
                name="name"
                defaultValue={workspace.organization.name}
              />
            </Field>
            <Field label="Precisão visual dos pesos">
              <select
                name="precision"
                defaultValue={workspace.organization.precision}
              >
                {[0, 1, 2, 3, 4].map((p) => (
                  <option key={p} value={p}>
                    {p} casas decimais
                  </option>
                ))}
              </select>
            </Field>
            <h3>Consultar fórmula oficial</h3>
            <p>
              Links abertos em uma nova aba. A fórmula é registrada pelo
              profissional.
            </p>
            {links.map((l, i) => (
              <div className="stack" key={i}>
                <Field label={`Nome do link ${i + 1}`}>
                  <input name={`label-${i}`} required defaultValue={l.label} />
                </Field>
                <Field label="Endereço HTTPS">
                  <input
                    name={`url-${i}`}
                    type="url"
                    required
                    defaultValue={l.url}
                  />
                </Field>
                <a
                  className="text-link"
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir {l.label}
                  <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </SaveForm>
        </section>
        <section className="panel">
          <div className="section-title">
            <h2>Equipe</h2>
            <button
              className="button secondary"
              onClick={() => setAddUser(true)}
            >
              <Plus size={16} />
              Novo usuário
            </button>
          </div>
          {userError && <Alert error>{userError}</Alert>}
          {workspace.users.map((u) => (
            <div className="team-row" key={u.id}>
              <span className="avatar">{u.name.slice(0, 1)}</span>
              <div>
                <strong>{u.name}</strong>
                <small>{u.email}</small>
                <Badge>
                  {u.role === "ADMIN" ? "Administrador" : "Profissional"}
                  {!u.active ? " · Inativo" : ""}
                </Badge>
              </div>
              {u.id !== workspace.actor.id && (
                <div className="team-actions">
                  <button
                    className="button text"
                    onClick={async () => {
                      try {
                        await mutation("userStatus", {
                          userId: u.id,
                          active: !u.active,
                        });
                        await refresh();
                      } catch (e) {
                        setUserError(
                          e instanceof Error ? e.message : "Erro ao atualizar.",
                        );
                      }
                    }}
                  >
                    {u.active ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    className="button text"
                    onClick={() => setResetUser(u)}
                  >
                    Redefinir senha
                  </button>
                </div>
              )}
            </div>
          ))}
          <div className="method-note">
            <ShieldCheck size={20} />
            <p>
              Os dados e usuários desta oficina são isolados das demais
              organizações.
            </p>
          </div>
        </section>
      </div>
      <section className="panel">
        <h2>Trilha de auditoria</h2>
        <p>
          Últimos 100 eventos da oficina. O histórico integral permanece no
          banco.
        </p>
        {workspace.audit.map((a) => (
          <details key={a.id}>
            <summary>
              {formatDate(a.createdAt)} · {a.action} · {a.entityType}
            </summary>
            <p>
              Usuário:{" "}
              {workspace.users.find((u) => u.id === a.userId)?.name || a.userId}{" "}
              · Motivo: {a.reason}
            </p>
            <pre>
              {JSON.stringify({ antes: a.before, depois: a.after }, null, 2)}
            </pre>
          </details>
        ))}
        {!workspace.audit.length && (
          <p>Nenhuma alteração administrativa registrada.</p>
        )}
      </section>
      {addUser && (
        <Dialog title="Cadastrar usuário" close={() => setAddUser(false)}>
          <SaveForm
            onDone={async () => {
              await refresh();
              setAddUser(false);
            }}
            onSubmit={(f) =>
              mutation("user", {
                name: value(f, "name"),
                email: value(f, "email"),
                password: value(f, "password"),
                role: value(f, "role"),
              })
            }
          >
            <Field label="Nome">
              <input name="name" required />
            </Field>
            <Field label="E-mail">
              <input name="email" type="email" required />
            </Field>
            <Field label="Senha inicial (mínimo 12 caracteres)">
              <input
                name="password"
                type="password"
                minLength={12}
                required
                autoComplete="new-password"
              />
            </Field>
            <Field label="Perfil">
              <select name="role">
                <option value="PROFESSIONAL">Profissional</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </Field>
          </SaveForm>
        </Dialog>
      )}
      {resetUser && (
        <Dialog
          title={`Redefinir senha de ${resetUser.name}`}
          close={() => setResetUser(null)}
        >
          <SaveForm
            label="Redefinir e encerrar sessões"
            onDone={async () => {
              await refresh();
              setResetUser(null);
            }}
            onSubmit={(form) =>
              mutation("resetPassword", {
                userId: resetUser.id,
                newPassword: value(form, "newPassword"),
                reason: value(form, "reason"),
              })
            }
          >
            <Alert>
              As sessões atuais deste usuário serão encerradas. A senha não é
              enviada por e-mail.
            </Alert>
            <Field label="Nova senha inicial">
              <input
                name="newPassword"
                type="password"
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                required
              />
            </Field>
            <Field label="Motivo da redefinição">
              <input name="reason" required />
            </Field>
          </SaveForm>
        </Dialog>
      )}
    </>
  );
}
