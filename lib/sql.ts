import { Prisma } from "@prisma/client";
type ApplicationTable =
  | "AdjustmentSession"
  | "CalibrationCoefficient"
  | "Organization"
  | "RateLimit";

export function applicationTable(name: ApplicationTable): Prisma.Sql {
  const schema =
    new URL(
      process.env.DATABASE_URL || "postgresql://localhost/postgres",
    ).searchParams.get("schema") || "public";
  if (!/^[a-z_][a-z0-9_]{0,62}$/.test(schema))
    throw new Error("Schema inválido na conexão PostgreSQL.");
  // Identificadores restritos; valores continuam parametrizados pelo Prisma.
  // Qualificar evita depender do search_path de conexões transacionais do pooler.
  return Prisma.raw(`"${schema}"."${name}"`);
}
