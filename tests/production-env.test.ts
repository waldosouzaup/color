import { describe, expect, it } from "vitest";
import { validateProductionEnvironment } from "../lib/production-env";
const env = {
  APP_ENV: "production",
  DATABASE_URL:
    "postgresql://postgres.abcdefghijklmnopqrst:fixture-password@aws-0-test.pooler.supabase.com:6543/postgres?schema=colorimetry&pgbouncer=true&connection_limit=3&sslmode=require&sslaccept=strict",
  DIRECT_URL:
    "postgresql://postgres.abcdefghijklmnopqrst:fixture-password@aws-0-test.pooler.supabase.com:5432/postgres?schema=colorimetry&sslmode=require&sslaccept=strict",
  BETTER_AUTH_URL: "https://oficina.invalid",
  BETTER_AUTH_SECRET: "fixture-secret-with-more-than-thirty-two-characters",
  ALLOW_DEMO_SEED: "false",
};
describe("configuração de produção Supabase", () => {
  it("aceita runtime transacional e migrações em sessão para o mesmo projeto", () =>
    expect(
      validateProductionEnvironment(env, { migrations: true }).schema,
    ).toBe("colorimetry"));
  it.each([
    { DATABASE_URL: "" },
    { DATABASE_URL: env.DATABASE_URL.replace("colorimetry", "public") },
    {
      DATABASE_URL: env.DATABASE_URL.replace(
        "sslaccept=strict",
        "sslaccept=accept_invalid_certs",
      ),
    },
    {
      DATABASE_URL: env.DATABASE_URL.replace(
        "pgbouncer=true",
        "pgbouncer=false",
      ),
    },
    { DIRECT_URL: env.DIRECT_URL.replace(":5432/", ":6543/") },
    {
      DIRECT_URL: env.DIRECT_URL.replace(
        "abcdefghijklmnopqrst",
        "outroprojeto",
      ),
    },
    { BETTER_AUTH_SECRET: "short" },
    { BETTER_AUTH_URL: "http://oficina.invalid" },
    { ALLOW_DEMO_SEED: "true" },
  ])("rejeita configuração inadequada %j", (patch) =>
    expect(() =>
      validateProductionEnvironment({ ...env, ...patch }, { migrations: true }),
    ).toThrow(),
  );
  it("não revela senhas em erros de validação", () => {
    try {
      validateProductionEnvironment({
        ...env,
        DATABASE_URL: env.DATABASE_URL.replace("colorimetry", "public"),
      });
    } catch (e) {
      expect(String(e)).not.toContain("fixture-password");
    }
  });
});
