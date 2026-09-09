export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NODE_ENV !== "production"
  )
    return;
  const local = (value: string | undefined) => {
    try {
      return ["localhost", "127.0.0.1"].includes(new URL(value || "").hostname);
    } catch {
      return false;
    }
  };
  if (
    process.env.APP_ENV === "test" &&
    local(process.env.DATABASE_URL) &&
    local(process.env.BETTER_AUTH_URL)
  )
    return;
  const { validateProductionEnvironment } =
    await import("./lib/production-env");
  try {
    validateProductionEnvironment(process.env);
  } catch (error) {
    console.error(
      "❌ ERRO CRÍTICO DE CONFIGURAÇÃO EM PRODUÇÃO:\n",
      error instanceof Error ? error.message : error,
    );
    throw error;
  }
}
