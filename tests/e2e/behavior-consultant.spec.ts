import { test, expect, type Page } from "@playwright/test";
import { adminStorageState, ensureAdminSession } from "./admin-session";

/**
 * Consultor de comportamento: a pergunta do vídeo do usuário precisa chegar à
 * base cadastrada, com interpretação visível, critérios editáveis, código,
 * comportamentos completos e fonte. Depende do catálogo carregado pelo seed.
 */
const VIDEO = "Preciso de um pigmento que amarele a frente e deixe o ângulo azul";

test.beforeAll(async ({ playwright }) => ensureAdminSession(playwright));

test.use({ storageState: adminStorageState });

const consultant = (page: Page) => page.locator("#consultor");
const completeGroup = (page: Page) =>
  consultant(page).getByRole("region", { name: "Correspondências completas" });

async function ask(page: Page, question: string) {
  await consultant(page).getByLabel("Pergunta sobre comportamento").fill(question);
  await consultant(page).getByRole("button", { name: "Consultar", exact: true }).click();
}

test("consultor: a pergunta do vídeo encontra a base pelos comportamentos", async ({ page }) => {
  await page.goto("/pigments");
  await ask(page, VIDEO);

  await expect(page.getByTestId("interpretacao")).toHaveText(
    "Frente: amarelar · Ângulo: azular",
  );
  const card = completeGroup(page).getByRole("article");
  await expect(card).toHaveCount(1);
  await expect(card.getByRole("heading", { name: "Branco Micronizado" })).toBeVisible();
  await expect(card).toContainText("HS 740 / LM 440");
  await expect(card).toContainText("Sherwin-Williams · Lazzuril Base Poliéster · Poliéster");
  await expect(card).toContainText("Amarelado sujo");
  await expect(card).toContainText("Azulado leitoso");
  await expect(card).toContainText("Fonte: Sherwin-Williams / Lazzuril");
  await expect(card).toContainText("05.jpeg");
  await expect(card).toContainText('Frente: "Amarelado sujo" tem matiz principal amarelo');
  await expect(card).toContainText('Ângulo: "Azulado leitoso" tem matiz principal azul');
  // O erro do chatbot não aparece como resposta.
  await expect(completeGroup(page)).not.toContainText("HS 739");
  await expect(completeGroup(page)).not.toContainText("Amarelo esverdeado");
  await expect(consultant(page)).toContainText("não calcula dosagem");
});

test("consultor: exemplo clicável e ajuste estruturado sem reescrever", async ({ page }) => {
  await page.goto("/pigments");
  await consultant(page).getByRole("button", { name: new RegExp(VIDEO) }).click();
  await expect(completeGroup(page).getByRole("article")).toHaveCount(1);

  await consultant(page).getByText("Ajustar critérios sem reescrever a pergunta").click();
  const front = consultant(page).getByRole("group", { name: "Frente" });
  await front.getByLabel("Limpeza").selectOption({ label: "Limpo" });

  await expect(page.getByTestId("interpretacao")).toHaveText(
    "Frente: amarelar, limpo · Ângulo: azular",
  );
  await expect(consultant(page)).toContainText(
    "Nenhuma base cadastrada atende a todas as condições.",
  );
  const partial = consultant(page)
    .getByRole("article")
    .filter({ hasText: "HS 740 / LM 440" });
  await expect(partial).toContainText('"Amarelado sujo" registra sujo; o pedido exige limpo');
});

test("consultor: observação da tinta pede confirmação antes de buscar", async ({ page }) => {
  await page.goto("/pigments");
  await ask(page, "Minha tinta está amarela de frente");
  await expect(consultant(page)).toContainText("descreve como a tinta está");
  await expect(consultant(page).getByRole("article")).toHaveCount(0);
  await expect(consultant(page).getByRole("link", { name: /Diagnosticar na bússola/ })).toBeVisible();

  await consultant(page)
    .getByRole("button", { name: /Buscar bases que produzam/ })
    .click();
  await expect(consultant(page).getByText(/bases? ativas? consultadas?/)).toBeVisible();
});

test("consultor: vista ausente pede escolha objetiva", async ({ page }) => {
  await page.goto("/pigments");
  await ask(page, "quero um pigmento amarelo");
  await expect(consultant(page)).toContainText("não foi associado à frente nem ao ângulo");
  await consultant(page).getByRole("button", { name: "Aplicar na frente" }).click();
  await expect(page.getByTestId("interpretacao")).toHaveText(
    "Frente: amarelar · Ângulo: sem critério",
  );
  await expect(consultant(page).getByText(/bases? ativas? consultadas?/)).toBeVisible();
});

test("consultor: atalho da bússola e leitura em celular", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/compass");
  await page.getByRole("link", { name: "Consultar bases por comportamento" }).click();
  await expect(page).toHaveURL(/\/pigments\?consultor=1/);
  await expect(consultant(page).getByLabel("Pergunta sobre comportamento")).toBeFocused();

  await ask(page, VIDEO);
  const card = completeGroup(page).getByRole("article");
  await expect(card).toContainText("HS 740 / LM 440");
  await card.scrollIntoViewIfNeeded();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});
