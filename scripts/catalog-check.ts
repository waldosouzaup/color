/**
 * Confere o catálogo do fabricante contra o que está registrado no banco.
 *
 * Uso:
 *   pnpm catalog:check [organizationId]   (padrão: todas as oficinas ativas)
 *
 * Relata, por oficina: bases do catálogo que faltam, bases registradas que
 * divergem em nome, sistema, família ou comportamento, e bases da mesma linha
 * de produto que existem no banco sem estar no catálogo. Não escreve nada.
 */
import "dotenv/config";
import { db } from "../lib/db";
import {
  lazzurilFullCatalog,
  type LazzurilBaseDef,
} from "../domain/colorimetry/lazzuril-catalog";

const alvo = process.argv[2];
const linhas = new Set(lazzurilFullCatalog.map((b) => b.productLine));

function comportamentoEsperado(base: LazzurilBaseDef) {
  return base.behaviors
    .map((b) => `${b.view}=${b.hueCharacteristic ?? ""}`)
    .sort()
    .join(" | ");
}

const organizations = await db.organization.findMany({
  where: alvo ? { id: alvo } : { active: true },
  select: { id: true, name: true },
  orderBy: { name: "asc" },
});

if (!organizations.length) {
  console.error("Nenhuma oficina encontrada para conferir.");
  process.exitCode = 1;
}

let problemasTotais = 0;

for (const organization of organizations) {
  const registradas = await db.pigment.findMany({
    where: { organizationId: organization.id, productLine: { in: [...linhas] } },
    include: { behaviors: true },
  });
  const porCodigo = new Map(registradas.map((p) => [p.code, p]));

  const faltando: string[] = [];
  const divergentes: string[] = [];

  for (const base of lazzurilFullCatalog) {
    const registrada = porCodigo.get(base.code);
    if (!registrada) {
      faltando.push(`${base.code} · ${base.name}`);
      continue;
    }
    const diferencas: string[] = [];
    if (registrada.name !== base.name)
      diferencas.push(`nome "${registrada.name}" ≠ "${base.name}"`);
    if (registrada.systemType !== base.systemType)
      diferencas.push(`sistema "${registrada.systemType}" ≠ "${base.systemType}"`);
    if (registrada.family !== base.family)
      diferencas.push(`família "${registrada.family}" ≠ "${base.family}"`);
    if ((registrada.characteristic ?? undefined) !== base.characteristic)
      diferencas.push(
        `função "${registrada.characteristic ?? "—"}" ≠ "${base.characteristic ?? "—"}"`,
      );
    const esperado = comportamentoEsperado(base);
    const atual = registrada.behaviors
      .map((b) => `${b.view}=${b.hueCharacteristic}`)
      .sort()
      .join(" | ");
    if (atual !== esperado)
      diferencas.push(`comportamento "${atual}" ≠ "${esperado}"`);
    if (!registrada.active) diferencas.push("base inativa");
    if (registrada.isDemo) diferencas.push("marcada como demonstrativa");
    if (diferencas.length)
      divergentes.push(`${base.code} · ${base.name}: ${diferencas.join("; ")}`);
  }

  const codigosCatalogo = new Set(lazzurilFullCatalog.map((b) => b.code));
  const extras = registradas
    .filter((p) => !codigosCatalogo.has(p.code))
    .map((p) => `${p.code} · ${p.name}`);

  // Base demonstrativa ativa aparece no seletor de correção como se fosse real.
  const demonstrativas = (
    await db.pigment.findMany({
      where: { organizationId: organization.id, isDemo: true, active: true },
      select: { code: true, name: true, characteristic: true },
    })
  ).map(
    (p) => `${p.code} · ${p.name} (função ${p.characteristic ?? "—"})`,
  );

  // Em desenvolvimento a base demonstrativa é esperada; em produção ela é
  // defeito, porque entra no seletor de correção como se fosse base real.
  const emProducao =
    process.env.APP_ENV === "production" || process.env.NODE_ENV === "production";
  const problemas =
    faltando.length +
    divergentes.length +
    extras.length +
    (emProducao ? demonstrativas.length : 0);
  problemasTotais += problemas;

  console.log(`\n=== ${organization.name} (${organization.id})`);
  console.log(
    `registradas ${registradas.length} de ${lazzurilFullCatalog.length} do catálogo`,
  );
  if (faltando.length) {
    console.log(`faltando (${faltando.length}):`);
    for (const f of faltando) console.log(`  - ${f}`);
  }
  if (divergentes.length) {
    console.log(`divergentes (${divergentes.length}):`);
    for (const d of divergentes) console.log(`  ! ${d}`);
  }
  if (extras.length) {
    console.log(`na linha do fabricante, fora do catálogo (${extras.length}):`);
    for (const e of extras) console.log(`  ? ${e}`);
  }
  if (demonstrativas.length) {
    console.log(
      `bases demonstrativas ATIVAS (${demonstrativas.length})${emProducao ? " — defeito em produção" : " — aceitável fora de produção"}:`,
    );
    for (const d of demonstrativas) console.log(`  ⚠ ${d}`);
    if (emProducao) {
      console.log(
        `  corrija com: pnpm demo:deactivate ${organization.id} --apply`,
      );
      console.log(
        `  sem pnpm no PATH: node node_modules/tsx/dist/cli.mjs scripts/demo-cleanup.ts ${organization.id} --apply`,
      );
    }
  }
  if (!problemas) console.log("catálogo íntegro: nada faltando nem divergente.");
}

await db.$disconnect();
if (problemasTotais) process.exitCode = 1;
