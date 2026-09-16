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

  const problemas = faltando.length + divergentes.length + extras.length;
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
  if (!problemas) console.log("catálogo íntegro: nada faltando nem divergente.");
}

await db.$disconnect();
if (problemasTotais) process.exitCode = 1;
