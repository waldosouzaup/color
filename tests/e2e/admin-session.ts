import { expect, type PlaywrightWorkerArgs } from "@playwright/test";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * Sessão administrativa compartilhada pelos cenários que não testam o login.
 *
 * `/sign-in/email` aceita cinco tentativas por minuto, e o login pela interface
 * já é coberto em `workflow.spec.ts`. Cada arquivo que autenticava por conta
 * própria consumia uma tentativa; somados, faziam o fluxo completo esbarrar no
 * limitador. A sessão salva só é reaproveitada depois de conferida no servidor.
 */

// `baseURL` é fixture de teste e não pode ser lida em beforeAll; o endereço vem
// da mesma variável que a configuração do Playwright usa.
export const base = process.env.BETTER_AUTH_URL || "http://localhost:3000";
export const adminStorageState = path.join(
  tmpdir(),
  `e2e-admin-${new URL(base).host.replace(/[^a-z0-9]/gi, "-")}.json`,
);

export async function ensureAdminSession(playwright: PlaywrightWorkerArgs["playwright"]) {
  if (existsSync(adminStorageState)) {
    const saved = await playwright.request.newContext({
      baseURL: base,
      storageState: adminStorageState,
    });
    const valid = (await saved.get("/api/workspace")).ok();
    await saved.dispose();
    if (valid) return;
  }
  // `storageState: undefined` evita herdar um arquivo inválido.
  const api = await playwright.request.newContext({ baseURL: base, storageState: undefined });
  const response = await api.post("/api/auth/sign-in/email", {
    headers: { Origin: base, "Content-Type": "application/json" },
    data: {
      email: process.env.SEED_ADMIN_EMAIL,
      password: process.env.SEED_ADMIN_PASSWORD,
    },
  });
  expect(response.ok(), `sign-in retornou ${response.status()}`).toBe(true);
  await api.storageState({ path: adminStorageState });
  await api.dispose();
}
