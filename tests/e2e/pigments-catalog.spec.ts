import { test, expect } from "@playwright/test";
import { adminStorageState, ensureAdminSession } from "./admin-session";

/**
 * A tabela "Características das Cores Básicas" precisa ser consultável dentro
 * do sistema: busca por código, filtros por sistema e família, e o
 * comportamento separado de frente e ângulo visível na listagem.
 */
test.beforeAll(async ({ playwright }) => ensureAdminSession(playwright));

test.use({ storageState: adminStorageState });

test("catálogo: busca por código traz a base com frente e ângulo", async ({
  page,
}) => {
  await page.goto("/pigments");
  await expect(page.locator("h1")).toBeVisible();

  await page.getByPlaceholder(/Buscar por código/i).fill("HS 717");
  const linha = page.getByRole("row").filter({ hasText: "Vermelho Rubi" });
  await expect(linha).toHaveCount(1);
  // A tabela distingue as duas vistas da fonte: frente limpa, ângulo azulado.
  await expect(linha).toContainText("Vermelho limpo");
  await expect(linha).toContainText("Azulado");
  await expect(linha).toContainText("HS 717 / LM 417");
});

test("catálogo: filtros por sistema e família isolam os blocos da tabela", async ({
  page,
}) => {
  await page.goto("/pigments");

  await page.getByLabel("Filtrar sistema").selectOption("Poliuretano");
  await expect(
    page.getByRole("row").filter({ hasText: "LP 501 / LL 112 / LS 201 / FC 601" }),
  ).toHaveCount(1);
  // Nenhuma base de poliéster sobra no filtro de poliuretano.
  await expect(
    page.getByRole("row").filter({ hasText: "HS 717 / LM 417" }),
  ).toHaveCount(0);

  await page.getByLabel("Filtrar sistema").selectOption("");
  await page.getByLabel("Filtrar família").selectOption("Alumínio");
  await expect(
    page.getByRole("row").filter({ hasText: "LM 451" }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("row").filter({ hasText: "Pérola Branca Fina" }),
  ).toHaveCount(0);
});

test("catálogo: função de corte não recebe base incompatível", async ({
  page,
}) => {
  await page.goto("/pigments");

  await page
    .getByLabel("Filtrar característica de correção")
    .selectOption("VIOLET");
  await expect(
    page.getByRole("row").filter({ hasText: "Violeta" }).first(),
  ).toBeVisible();
  // Regressão: "Vermelho Rubi" tem ângulo azulado, mas não é pigmento de corte.
  await expect(
    page.getByRole("row").filter({ hasText: "Vermelho Rubi" }),
  ).toHaveCount(0);

  await page
    .getByLabel("Filtrar característica de correção")
    .selectOption("RED_BLUE");
  await expect(
    page.getByRole("row").filter({ hasText: "Vermelho Rubi" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("row").filter({ hasText: "Azul" }).first(),
  ).toBeVisible();
});
