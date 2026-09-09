import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { db } from "../../lib/db";
const email = process.env.SEED_ADMIN_EMAIL!;
const password = process.env.SEED_ADMIN_PASSWORD!;
async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar na oficina" }).click();
  await expect(
    page.getByRole("heading", { name: "Visão geral" }),
  ).toBeVisible();
}
test("fluxo completo: fórmula → ângulo → correção → chapa → aprovação → banco", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  const code = `E2E-${Date.now()}`;
  await login(page);
  await page.getByRole("link", { name: "Novo ajuste", exact: true }).click();
  await page.getByLabel("Montadora", { exact: true }).fill("Chevrolet");
  await page.getByLabel("Modelo", { exact: true }).fill("Modelo TEST");
  await page.getByLabel("Ano", { exact: true }).fill("2024");
  await page.getByLabel("Código da cor", { exact: true }).fill(code);
  await page.getByLabel("Descrição da cor").fill("Azul de teste E2E");
  await page.getByLabel("Dado demonstrativo / treinamento").check();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByLabel("Fabricante da tinta").fill("TEST");
  await page.getByLabel("Linha de produtos").fill("TEST");
  await page.getByLabel("Sistema de pintura").fill("Sistema E2E");
  await page.getByLabel("Peso da mistura (g)").fill("500");
  await page.getByLabel("Modo de pesagem").selectOption("INDIVIDUAL");
  await page
    .getByLabel("Código do componente 1", { exact: true })
    .fill("BASE-TEST");
  await page
    .getByLabel("Nome do componente 1", { exact: true })
    .fill("Base TEST");
  await page.getByLabel("Peso do componente 1", { exact: true }).fill("500");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "Metálica", exact: true }).click();
  await page.getByRole("button", { name: "Criar ajuste", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: new RegExp(code) }),
  ).toBeVisible();
  const url = page.url();
  await page
    .getByRole("button", { name: "Registrar chapa", exact: true })
    .click();
  await page
    .getByLabel("Observações da chapa")
    .fill("Primeira aplicação de teste");
  // PNG mínimo válido; fotografia é documentação, sem detecção de cor.
  await page.getByLabel("Foto da chapa").setInputFiles({
    name: "test.png",
    mimeType: "image/png",
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=",
      "base64",
    ),
  });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Registrar chapa", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Iniciar diagnóstico" }).click();
  await page.getByRole("button", { name: "Azul", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Amarelado", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Esverdeado", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Azul esverdeado", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Óxido vermelho", { exact: true })).toBeVisible();
  await expect(page.getByText("Violeta", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continuar para adição" }).click();
  await expect(
    page.getByText("DOSAGEM NÃO CALIBRADA", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Código do pigmento").fill("OX-TEST");
  await page.getByLabel("Nome do pigmento").fill("Óxido TEST");
  await page.getByLabel("Quantidade efetivamente adicionada (g)").fill("1.00");
  await page
    .getByRole("button", { name: "Confirmar adição realizada" })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByText("501,00", { exact: false }).first(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Registrar chapa", exact: true })
    .click();
  await page
    .getByLabel("Observações da chapa")
    .fill("Nova chapa após a correção");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Registrar chapa", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "A cor fechou" }).click();
  await page
    .getByLabel("Avaliação final do ângulo")
    .fill("Ângulo aprovado na luz do sol");
  await page.getByLabel("Ângulo aprovado", { exact: true }).check();
  await page
    .getByLabel("Avaliação final da frente")
    .fill("Frente e partículas aprovadas");
  await page.getByLabel("Frente aprovada", { exact: true }).check();
  await page
    .getByRole("button", {
      name: "Aprovar e salvar no Banco de Cores",
      exact: true,
    })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByText("Fórmula aprovada e salva no Banco de Cores"),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ver Banco de Cores" }).click();
  await page.getByLabel("Buscar no Banco de Cores").fill(code);
  await page.getByRole("link", { name: new RegExp(code) }).click();
  await expect(page).toHaveURL(url);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Fórmula final aprovada" }),
  ).toBeVisible();
  await expect(page.getByText("Primeira aplicação de teste")).toBeVisible();
  await expect(page.getByText("Nova chapa após a correção")).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Chapa de teste 1" }),
  ).toBeVisible();
});
test("API rejeita combinações inválidas e origem externa; rotas exigem login", async ({
  page,
  request,
}) => {
  expect((await request.get("/api/workspace")).status()).toBe(401);
  await login(page);
  for (const [mainTone, direction] of [
    ["BLUE", "YELLOWISH"],
    ["YELLOW", "BLUISH"],
    ["GREEN", "REDISH"],
    ["RED", "GREENISH"],
  ]) {
    const response = await page.request.post("/api/actions", {
      headers: { Origin: process.env.BETTER_AUTH_URL! },
      data: {
        action: "diagnose",
        data: { diagnosis: { mainTone, direction } },
      },
    });
    expect(response.status()).toBe(400);
  }
  const response = await page.request.post("/api/actions", {
    headers: { Origin: "https://external.example" },
    data: { action: "diagnose", data: {} },
  });
  expect(response.status()).toBe(403);
});
test("responsividade e navegação nas quatro larguras", async ({ page }) => {
  await login(page);
  for (const width of [375, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "/",
      "/compass",
      "/pigments",
      "/bank",
      "/new",
      "/formulas",
      "/rules",
      "/coefficients",
      "/settings",
      "/history",
    ]) {
      await page.goto(route);
      await expect(page.locator("h1")).toBeVisible();
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(overflow, `${route} em ${width}px`).toBe(false);
    }
    // Modal ampliado da bússola: é o único overlay que passa de 95vw
    await page.goto("/compass");
    await page.getByRole("button", { name: "Ampliar bússola" }).first().click();
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(modal.locator(".compass-container.xl")).toBeVisible();
    const modalOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1,
    );
    expect(modalOverflow, `modal da bússola em ${width}px`).toBe(false);

    // A direção escolhida no mostrador ampliado continua valendo na página
    await modal
      .locator(".compass-container.xl")
      .getByLabel("Verde azulado")
      .click();
    await page.keyboard.press("Escape");
    await expect(modal).not.toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Verde azulado" }),
    ).toBeVisible();

    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: "Visão geral" }),
    ).toBeVisible();
    await page.screenshot({
      path: `test-results/dashboard-${width}.png`,
      fullPage: true,
    });
  }
});
test("API isola uma segunda oficina e rejeita administração por profissional", async ({
  page,
  request,
}) => {
  await login(page);
  const workspaceResponse = await page.request.get("/api/workspace");
  const workspace = await workspaceResponse.json();
  const foreignSession = workspace.sessions.find(
    (s: { panels: unknown[] }) => s.panels.length > 0,
  );
  expect(foreignSession).toBeTruthy();
  const organizationId = `e2e-isolation-${randomUUID()}`;
  const userId = randomUUID();
  const testEmail = `${userId}@example.test`;
  const testPassword = randomUUID();
  await db.organization.create({
    data: { id: organizationId, name: "TEST ISOLAMENTO", officialLinks: [] },
  });
  try {
    await db.user.create({
      data: {
        id: userId,
        name: "Profissional TEST",
        email: testEmail,
        organizationId,
        role: "PROFESSIONAL",
        accounts: {
          create: {
            id: randomUUID(),
            providerId: "credential",
            accountId: userId,
            password: await hashPassword(testPassword),
          },
        },
      },
    });
    const headers = { Origin: process.env.BETTER_AUTH_URL! };
    expect(
      (
        await request.post("/api/auth/sign-in/email", {
          headers,
          data: { email: testEmail, password: testPassword },
        })
      ).ok(),
    ).toBe(true);
    const ownResponse = await request.get("/api/workspace");
    expect(ownResponse.ok()).toBe(true);
    const own = await ownResponse.json();
    expect(own.sessions).toHaveLength(0);
    expect(own.formulas).toHaveLength(0);
    expect(own.bank).toHaveLength(0);
    expect(own.users).toHaveLength(0);
    expect(
      (
        await request.get(`/api/panels/${foreignSession.panels[0].id}`)
      ).status(),
    ).toBe(404);
    expect(
      (
        await request.post("/api/actions", {
          headers,
          data: {
            action: "diagnose",
            data: {
              sessionId: foreignSession.id,
              diagnosis: { mainTone: "BLUE", direction: "GREENISH" },
            },
          },
        })
      ).status(),
    ).toBe(404);
    for (const action of [
      "coefficient",
      "rule",
      "pigment",
      "user",
      "settings",
      "resetPassword",
    ])
      expect(
        (
          await request.post("/api/actions", {
            headers,
            data: {
              action,
              data: { organizationId: workspace.actor.organizationId },
            },
          })
        ).status(),
      ).toBe(403);
    const newPassword = randomUUID();
    expect(
      (
        await request.post("/api/auth/change-password", {
          headers,
          data: {
            currentPassword: testPassword,
            newPassword,
            revokeOtherSessions: true,
          },
        })
      ).ok(),
    ).toBe(true);
    const account = await db.account.findFirstOrThrow({
      where: { userId, providerId: "credential" },
    });
    expect(
      await verifyPassword({ hash: account.password!, password: newPassword }),
    ).toBe(true);
    expect(
      await verifyPassword({ hash: account.password!, password: testPassword }),
    ).toBe(false);
  } finally {
    await db.rateLimit.deleteMany({
      where: { key: { contains: organizationId } },
    });
    await db.user.deleteMany({ where: { organizationId } });
    await db.organization.delete({ where: { id: organizationId } });
  }
});
test("saúde e CSP de produção", async ({ request }) => {
  expect((await request.get("/api/health")).status()).toBe(200);
  expect((await request.get("/api/ready")).status()).toBe(200);
  const first = await request.get("/login");
  const second = await request.get("/login");
  const policy = first.headers()["content-security-policy"];
  expect(policy).toContain("'strict-dynamic'");
  expect(policy).toMatch(/'nonce-[^']+'/);
  expect(policy).not.toBe(second.headers()["content-security-policy"]);
  if (process.env.E2E_PRODUCTION === "true")
    expect(policy).not.toContain("'unsafe-eval'");
});
