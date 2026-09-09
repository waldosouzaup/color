import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { verifyPassword } from "better-auth/crypto";
import { db } from "../lib/db";
import { bootstrapProduction } from "../services/production-bootstrap";

const connection = new URL(process.env.DATABASE_URL || "");
if (
  !["127.0.0.1", "localhost"].includes(connection.hostname) ||
  process.env.APP_ENV === "production"
)
  throw new Error("Bootstrap de teste permitido somente no PostgreSQL local.");
const id = randomUUID();
// Configuração sintética para validar o provisionamento. O Prisma permanece
// conectado ao banco efêmero local recebido pelo processo, nunca ao host fictício.
const env = {
  APP_ENV: "production",
  DATABASE_URL:
    "postgresql://postgres.fixture:test@aws-0-region.pooler.supabase.com:6543/postgres?schema=colorimetry&sslmode=require&sslaccept=strict&pgbouncer=true&connection_limit=3",
  DIRECT_URL:
    "postgresql://postgres.fixture:test@aws-0-region.pooler.supabase.com:5432/postgres?schema=colorimetry&sslmode=require&sslaccept=strict",
  BETTER_AUTH_URL: "https://fixture.invalid",
  BETTER_AUTH_SECRET: randomUUID(),
  ALLOW_DEMO_SEED: "false",
  PRODUCTION_ORGANIZATION_NAME: `BOOTSTRAP TEST ${id}`,
  PRODUCTION_ADMIN_NAME: "Administrador TEST",
  PRODUCTION_ADMIN_EMAIL: `${id}@fixture.invalid`,
  PRODUCTION_ADMIN_PASSWORD: randomUUID(),
};
let organizationId: string | undefined;
try {
  const result = await bootstrapProduction(env);
  organizationId = result.organizationId;
  assert.equal(result.created, true);
  const user = await db.user.findUniqueOrThrow({
    where: { email: env.PRODUCTION_ADMIN_EMAIL },
    include: { accounts: true },
  });
  assert.equal(user.role, "ADMIN");
  assert.equal(
    await verifyPassword({
      hash: user.accounts[0].password!,
      password: env.PRODUCTION_ADMIN_PASSWORD,
    }),
    true,
  );
  assert.equal(await db.pigment.count({ where: { organizationId } }), 0);
  assert.equal(
    await db.calibrationCoefficient.count({ where: { organizationId } }),
    0,
  );
  assert.equal(
    (
      await bootstrapProduction({
        ...env,
        PRODUCTION_ADMIN_PASSWORD: randomUUID(),
      })
    ).created,
    false,
  );
  const account = await db.account.findFirstOrThrow({
    where: { userId: user.id },
  });
  assert.equal(account.password, user.accounts[0].password);
  assert.equal(
    await db.auditLog.count({
      where: { organizationId, action: "PRODUCTION_BOOTSTRAP" },
    }),
    1,
  );
  await assert.rejects(() =>
    bootstrapProduction({
      ...env,
      PRODUCTION_ORGANIZATION_NAME: "Outra oficina",
    }),
  );
  console.log(
    "Bootstrap: primeiro acesso, senha, ausência de dados demo, idempotência e conflito passaram.",
  );
} finally {
  if (organizationId) {
    await db.auditLog.deleteMany({ where: { organizationId } });
    await db.user.deleteMany({ where: { organizationId } });
    await db.organization.delete({ where: { id: organizationId } });
  }
  await db.$disconnect();
}
