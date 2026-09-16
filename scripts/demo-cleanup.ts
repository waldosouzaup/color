/**
 * Desativa bases demonstrativas de uma oficina.
 *
 * Uso:
 *   pnpm demo:deactivate [organizationId]            simula e lista
 *   pnpm demo:deactivate [organizationId] --apply    aplica
 *
 * Uma base demonstrativa ativa aparece no seletor de correção como se fosse
 * base real. Este script a desativa — não apaga — para preservar histórico e
 * manter a operação reversível. Nomes sem marcação recebem o aviso explícito.
 *
 * Contra produção, exporte as variáveis de `.env.production.local` antes.
 */
import "dotenv/config";
import { db } from "../lib/db";

const argumentos = process.argv.slice(2);
const aplicar = argumentos.includes("--apply");
const alvo = argumentos.find((a) => !a.startsWith("--"));

const organizations = await db.organization.findMany({
  where: alvo ? { id: alvo } : { active: true },
  select: { id: true, name: true },
  orderBy: { name: "asc" },
});

let total = 0;
for (const organization of organizations) {
  const demos = await db.pigment.findMany({
    where: { organizationId: organization.id, isDemo: true, active: true },
    select: { id: true, code: true, name: true, characteristic: true },
    orderBy: { code: "asc" },
  });
  console.log(`\n=== ${organization.name} (${organization.id})`);
  if (!demos.length) {
    console.log("nenhuma base demonstrativa ativa.");
    continue;
  }
  for (const pigment of demos) {
    const precisaMarcar = !/demo|demonstrativ/i.test(pigment.name);
    console.log(
      `  ${aplicar ? "desativando" : "desativaria"}: ${pigment.code} · ${pigment.name} (função ${pigment.characteristic ?? "—"})${precisaMarcar ? " · nome receberá marcação" : ""}`,
    );
    if (aplicar)
      await db.pigment.update({
        where: { id: pigment.id },
        data: {
          active: false,
          name: precisaMarcar
            ? `${pigment.name} — DADO DEMONSTRATIVO`
            : pigment.name,
          notes:
            "DADO DEMONSTRATIVO desativado: não deve ser oferecido em produção.",
        },
      });
    total++;
  }
}

console.log(
  `\n${aplicar ? "desativadas" : "seriam desativadas"}: ${total}${aplicar ? "" : " — repita com --apply para aplicar"}`,
);
await db.$disconnect();
