import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";
import { verifyProductionDatabase } from "../services/production-database";
import { initialRules } from "../domain/colorimetry/correction-engine";

const localUrl = new URL(process.env.DATABASE_URL || "");
if (
  !["127.0.0.1", "localhost"].includes(localUrl.hostname) ||
  process.env.APP_ENV === "production"
)
  throw new Error(
    "Este teste só pode criar um banco efêmero no PostgreSQL local.",
  );
const name = `schema_test_${randomUUID().replaceAll("-", "")}`;
const owner = new PrismaClient({ datasourceUrl: localUrl.toString() });
const testUrl = new URL(localUrl);
testUrl.pathname = `/${name}`;
testUrl.searchParams.set("schema", "colorimetry");
const client = new PrismaClient({ datasourceUrl: testUrl.toString() });
const createdRoles: string[] = [];
let createdDatabase = false;
try {
  for (const role of ["anon", "authenticated"]) {
    const roles = await owner.$queryRaw<
      { rolname: string }[]
    >`SELECT rolname FROM pg_roles WHERE rolname = ${role}`;
    if (!roles.length) {
      await owner.$executeRawUnsafe(`CREATE ROLE "${role}" NOLOGIN`);
      createdRoles.push(role);
    }
  }
  // Identificador gerado exclusivamente pelo teste, sem entrada externa.
  await owner.$executeRawUnsafe(`CREATE DATABASE "${name}"`);
  createdDatabase = true;
  const migration = spawnSync(
    process.execPath,
    ["node_modules/prisma/build/index.js", "migrate", "deploy"],
    {
      env: {
        ...process.env,
        DATABASE_URL: testUrl.toString(),
        DIRECT_URL: testUrl.toString(),
      },
      encoding: "utf8",
    },
  );
  assert.equal(
    migration.status,
    0,
    `Migração no schema privado falhou: ${migration.stderr}`,
  );
  await verifyProductionDatabase(client);
  for (const rule of initialRules)
    await client.correctionRule.create({
      data: { ...rule, outputs: rule.outputs.map((o) => ({ ...o })) },
    });
  const integration = spawnSync(
    process.execPath,
    ["--import", "tsx", "tests/integration.ts"],
    {
      env: {
        ...process.env,
        DATABASE_URL: testUrl.toString(),
        DIRECT_URL: testUrl.toString(),
      },
      encoding: "utf8",
    },
  );
  assert.equal(
    integration.status,
    0,
    `Fluxo no schema privado falhou: ${integration.stderr}`,
  );
  const bootstrap = spawnSync(
    process.execPath,
    ["--import", "tsx", "tests/production-bootstrap.ts"],
    {
      env: {
        ...process.env,
        DATABASE_URL: testUrl.toString(),
        DIRECT_URL: testUrl.toString(),
      },
      encoding: "utf8",
    },
  );
  assert.equal(
    bootstrap.status,
    0,
    `Bootstrap no schema privado falhou: ${bootstrap.stderr}`,
  );
  const organization = await client.organization.create({
    data: { name: "TEST SCHEMA PRIVADO", officialLinks: [] },
  });
  assert.equal(
    (
      await client.organization.findUniqueOrThrow({
        where: { id: organization.id },
      })
    ).name,
    "TEST SCHEMA PRIVADO",
  );
  for (const role of ["anon", "authenticated"]) {
    await assert.rejects(() =>
      client.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SET LOCAL ROLE "${role}"`);
        return tx.organization.findMany();
      }),
    );
  }
  console.log(
    "Schema Supabase: migrações, CRUD pelo servidor e bloqueio de anon/authenticated passaram.",
  );
} finally {
  await client.$disconnect();
  if (createdDatabase)
    await owner.$executeRawUnsafe(`DROP DATABASE "${name}" WITH (FORCE)`);
  for (const role of createdRoles)
    await owner.$executeRawUnsafe(`DROP ROLE "${role}"`);
  await owner.$disconnect();
}
