import { db } from "../lib/db";

export async function verifyProductionDatabase(client = db) {
  const schema = await client.$queryRaw<
    { schema: string }[]
  >`SELECT current_schema() AS schema`;
  if (schema[0]?.schema !== "colorimetry")
    throw new Error(
      "O runtime não está conectado ao schema privado colorimetry.",
    );
  const tables = await client.$queryRaw<
    { tablename: string }[]
  >`SELECT tablename FROM pg_tables WHERE schemaname = 'colorimetry'`;
  const required = [
    "User",
    "Account",
    "Session",
    "RateLimit",
    "AdjustmentSession",
    "CorrectionAddition",
    "ColorBankEntry",
    "AuditLog",
  ];
  if (required.some((t) => !tables.some((row) => row.tablename === t)))
    throw new Error("Há migrações pendentes no banco de produção.");
  const exposure = await client.$queryRaw<{ role: string; allowed: boolean }[]>`
    SELECT rolname AS role, has_schema_privilege(rolname, 'colorimetry', 'USAGE') AS allowed
    FROM pg_roles WHERE rolname IN ('anon', 'authenticated')`;
  if (exposure.some((row) => row.allowed))
    throw new Error(
      "A API pública ainda tem acesso ao schema privado. Corrija as permissões antes de publicar.",
    );
  const grants = await client.$queryRaw<{ grantee: number }[]>`
    SELECT acl.grantee::int AS grantee FROM pg_namespace n,
      LATERAL aclexplode(COALESCE(n.nspacl, acldefault('n', n.nspowner))) acl
    WHERE n.nspname = 'colorimetry' AND acl.grantee = 0 AND acl.privilege_type = 'USAGE'`;
  if (grants.length)
    throw new Error("PUBLIC ainda tem acesso ao schema privado.");
}
