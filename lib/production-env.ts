type Environment = Record<string, string | undefined>;
const placeholder =
  /PROJECT_REF|URL_ENCODED_PASSWORD|POOLER_HOST|SEU_DOMINIO|GERAR_SEGREDO|replace-with/i;

function connection(env: Environment, key: string): URL {
  const value = env[key];
  if (!value || placeholder.test(value))
    throw new Error(`${key}: configure o valor real no ambiente de produção.`);
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${key}: URL PostgreSQL inválida.`);
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.username ||
    !url.password
  )
    throw new Error(`${key}: conexão PostgreSQL precisa de usuário e senha.`);
  if (!/\.(supabase\.co|supabase\.com)$/.test(url.hostname))
    throw new Error(
      `${key}: use o endereço PostgreSQL fornecido pelo projeto Supabase.`,
    );
  if (url.searchParams.get("schema") !== "colorimetry")
    throw new Error(`${key}: use o schema privado colorimetry.`);
  if (
    url.searchParams.get("sslmode") !== "require" ||
    url.searchParams.get("sslaccept") !== "strict"
  )
    throw new Error(`${key}: configure sslmode=require e sslaccept=strict.`);
  return url;
}

function projectRef(url: URL) {
  const direct = /^db\.([^.]+)\.supabase\.co$/.exec(url.hostname);
  return direct?.[1] || decodeURIComponent(url.username).split(".").at(-1);
}

export function validateProductionEnvironment(
  env: Environment,
  options: { migrations?: boolean; bootstrap?: boolean } = {},
) {
  if (env.APP_ENV !== "production")
    throw new Error("APP_ENV deve ser production na implantação pública.");
  const runtime = connection(env, "DATABASE_URL");
  if (
    runtime.port === "6543" &&
    runtime.searchParams.get("pgbouncer") !== "true"
  )
    throw new Error("DATABASE_URL: pooler de transação exige pgbouncer=true.");
  const limit = Number(runtime.searchParams.get("connection_limit"));
  if (!Number.isInteger(limit) || limit < 1 || limit > 20)
    throw new Error(
      "DATABASE_URL: configure connection_limit entre 1 e 20 conforme o plano.",
    );
  if (options.migrations) {
    const direct = connection(env, "DIRECT_URL");
    if (
      direct.port === "6543" ||
      direct.searchParams.get("pgbouncer") === "true"
    )
      throw new Error(
        "DIRECT_URL: migrações exigem conexão direta ou pooler em modo sessão.",
      );
    if (
      projectRef(direct) !== projectRef(runtime) ||
      direct.pathname !== runtime.pathname
    )
      throw new Error(
        "DATABASE_URL e DIRECT_URL precisam apontar ao mesmo projeto e banco.",
      );
  }
  const secret = env.BETTER_AUTH_SECRET || "";
  if (secret.length < 32 || placeholder.test(secret))
    throw new Error(
      "BETTER_AUTH_SECRET: gere um segredo aleatório com pelo menos 32 caracteres.",
    );
  let origin: URL;
  try {
    origin = new URL(env.BETTER_AUTH_URL || "");
  } catch {
    throw new Error("BETTER_AUTH_URL: configure a URL pública HTTPS.");
  }
  if (
    origin.protocol !== "https:" ||
    placeholder.test(origin.hostname) ||
    /localhost|\.test$|\.example$/.test(origin.hostname) ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash
  )
    throw new Error(
      "BETTER_AUTH_URL: informe somente a origem pública HTTPS válida.",
    );
  if (env.ALLOW_DEMO_SEED !== "false")
    throw new Error("ALLOW_DEMO_SEED deve ser false em produção.");
  if (options.bootstrap) {
    for (const key of [
      "PRODUCTION_ORGANIZATION_NAME",
      "PRODUCTION_ADMIN_NAME",
      "PRODUCTION_ADMIN_EMAIL",
    ])
      if (!env[key]?.trim())
        throw new Error(
          `${key}: campo obrigatório para criar o primeiro acesso.`,
        );
    if (
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(env.PRODUCTION_ADMIN_EMAIL || "") ||
      /@(example\.|.*\.test$)/.test(env.PRODUCTION_ADMIN_EMAIL || "")
    )
      throw new Error(
        "PRODUCTION_ADMIN_EMAIL: use o e-mail real do responsável.",
      );
    if ((env.PRODUCTION_ADMIN_PASSWORD || "").length < 12)
      throw new Error(
        "PRODUCTION_ADMIN_PASSWORD: use pelo menos 12 caracteres.",
      );
  }
  return {
    origin: origin.origin,
    projectRef: projectRef(runtime),
    schema: "colorimetry",
  };
}
