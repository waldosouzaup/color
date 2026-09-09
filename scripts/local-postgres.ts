import "dotenv/config";
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
const url = new URL(
  process.env.DATABASE_URL ||
    "postgresql://color:color_local@127.0.0.1:5433/color",
);
if (!["localhost", "127.0.0.1"].includes(url.hostname))
  throw new Error("db:local exige endereço local.");
const directory = "./.local-postgres";
const pg = new EmbeddedPostgres({
  databaseDir: directory,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  port: Number(url.port || 5433),
  persistent: true,
  postgresFlags: ["-h", "127.0.0.1", "-k", "/tmp"],
  onLog: () => {},
  onError: (message) => console.error(message),
});
if (!existsSync(`${directory}/PG_VERSION`)) await pg.initialise();
await pg.start();
const client = pg.getPgClient();
await client.connect();
const name = url.pathname.slice(1);
const existing = await client.query(
  "SELECT 1 FROM pg_database WHERE datname = $1",
  [name],
);
await client.end();
if (!existing.rows.length) await pg.createDatabase(name);
console.log(
  `PostgreSQL local ativo em 127.0.0.1:${url.port}. Ctrl+C encerra sem apagar os dados.`,
);
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, async () => {
    await pg.stop();
    process.exit(0);
  });
await new Promise(() => {});
