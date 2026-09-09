import { randomUUID } from "node:crypto";
import { db } from "../lib/db";
import { applicationTable } from "../lib/sql";
import { AppError, type Actor } from "../lib/access";

export async function limitAction(actor: Actor, now = Date.now()) {
  const key = `actions:${actor.organizationId}:${actor.id}`;
  const timestamp = BigInt(now);
  const cutoff = timestamp - 60_000n;
  // Incremento atômico compartilhado entre instâncias, independente de headers de IP.
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO ${applicationTable("RateLimit")} AS bucket (id, key, count, "lastRequest") VALUES (${randomUUID()}, ${key}, 1, ${timestamp})
    ON CONFLICT (key) DO UPDATE SET
      count = CASE WHEN bucket."lastRequest" < ${cutoff} THEN 1 ELSE bucket.count + 1 END,
      "lastRequest" = CASE WHEN bucket."lastRequest" < ${cutoff} THEN ${timestamp} ELSE bucket."lastRequest" END
    RETURNING count`;
  if (rows[0].count > 90)
    throw new AppError(
      "Muitas operações. Aguarde um minuto e tente novamente.",
      429,
    );
}
