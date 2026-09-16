import { config } from "dotenv";
import { spawnSync } from "node:child_process";
import { validateProductionEnvironment } from "../lib/production-env";

config({ path: ".env.production.local", override: true, quiet: true });
const command = process.argv[2] || "check";
try {
  const config = validateProductionEnvironment(process.env, {
    migrations: command !== "runtime-check",
    bootstrap: command === "bootstrap",
  });
  if (command === "check" || command === "runtime-check") {
    console.log(
      `Configuração válida: projeto ${config.projectRef}, schema ${config.schema}, origem ${config.origin}.`,
    );
  } else if (command === "migrate") {
    const result = spawnSync(
      process.execPath,
      ["node_modules/prisma/build/index.js", "migrate", "deploy"],
      { stdio: "inherit", env: process.env },
    );
    if (result.status !== 0) process.exitCode = 1;
  } else if (command === "bootstrap") {
    const { bootstrapProduction } =
      await import("../services/production-bootstrap");
    const result = await bootstrapProduction(process.env);
    console.log(
      result.created
        ? "Organização, administrador e oito regras criados. Nenhum dado demonstrativo ou coeficiente inventado."
        : "Administrador já cadastrado na organização informada. Senha e dados preservados.",
    );
  } else if (command === "catalog") {
    // Carga do catálogo do fabricante em produção. O seed de desenvolvimento
    // não roda aqui, e o upsert por oficina + fabricante + linha + código é
    // idempotente: repetir não duplica base nem apaga comportamento editado.
    const { db } = await import("../lib/db");
    const { seedLazzurilBases } = await import("../services/lazzuril-seed");
    const target = process.argv[3];
    const organizations = await db.organization.findMany({
      where: { active: true },
      select: { id: true, name: true },
    });
    if (!target) {
      console.log(
        "Informe a oficina que recebe o catálogo: pnpm production:catalog <organizationId>",
      );
      for (const organization of organizations)
        console.log(`  ${organization.id} · ${organization.name}`);
      process.exitCode = 1;
    } else {
      const organization = organizations.find((o) => o.id === target);
      if (!organization)
        throw new Error("Oficina não encontrada ou inativa nesta base.");
      const count = await seedLazzurilBases(organization.id);
      console.log(
        `Catálogo Lazzuril carregado em ${organization.name}: ${count} bases com frente e ângulo. Nenhum coeficiente de dosagem foi criado.`,
      );
    }
  } else if (command === "verify") {
    const { verifyProductionDatabase } =
      await import("../services/production-database");
    await verifyProductionDatabase();
    console.log(
      "Conexão, schema privado, migrações e permissões da API pública verificados.",
    );
  } else {
    throw new Error(
      "Comando inválido: check, runtime-check, migrate, bootstrap, catalog ou verify.",
    );
  }
} catch (error) {
  // Erros de configuração são legíveis; erros do driver não devem expor conexões.
  if (error instanceof Error && !("clientVersion" in error))
    console.error(error.message);
  else
    console.error(
      "A operação de produção falhou. Confira conexão, TLS e permissões do banco.",
    );
  process.exitCode = 1;
} finally {
  const { db } = await import("../lib/db");
  await db.$disconnect();
}
