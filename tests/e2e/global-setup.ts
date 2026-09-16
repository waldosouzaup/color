import { db } from "../../lib/db";

/**
 * A suíte faz vários logins e `/sign-in/email` aceita cinco tentativas por
 * minuto. Limpar os contadores antes da execução evita que um teste falhe por
 * causa da tentativa do teste anterior.
 *
 * A limpeza só acontece contra um servidor local: em qualquer outro endereço o
 * setup não toca no banco.
 */
export default async function globalSetup() {
  const url = process.env.BETTER_AUTH_URL || "";
  if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:|\/|$)/.test(url)) {
    console.log(`[e2e] ambiente não local (${url || "sem BETTER_AUTH_URL"}): limitador preservado.`);
    return;
  }
  const { count } = await db.rateLimit.deleteMany();
  await db.$disconnect();
  console.log(`[e2e] limitador reiniciado: ${count} registros removidos.`);
}
