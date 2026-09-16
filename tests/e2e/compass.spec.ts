import { test, expect, type Page } from "@playwright/test";
import { tmpdir } from "node:os";
import path from "node:path";

/**
 * A sessão vem da API de autenticação, não do formulário: o login pela
 * interface já é coberto em `workflow.spec.ts` e repetí-lo aqui consumiria o
 * limitador de tentativas de entrada.
 */
const storageState = path.join(tmpdir(), "compass-e2e-auth.json");

// `baseURL` é fixture de teste e não pode ser lida em beforeAll; o endereço vem
// da mesma variável que a configuração do Playwright usa.
const base = process.env.BETTER_AUTH_URL || "http://localhost:3000";

test.beforeAll(async ({ playwright }) => {
  // `storageState: undefined` evita herdar o arquivo que este hook ainda vai criar.
  const api = await playwright.request.newContext({
    baseURL: base,
    storageState: undefined,
  });
  const response = await api.post("/api/auth/sign-in/email", {
    headers: { Origin: base, "Content-Type": "application/json" },
    data: {
      email: process.env.SEED_ADMIN_EMAIL,
      password: process.env.SEED_ADMIN_PASSWORD,
    },
  });
  expect(response.ok(), `sign-in retornou ${response.status()}`).toBe(true);
  await api.storageState({ path: storageState });
  await api.dispose();
});

test.use({ storageState });

/** Ponto do disco no ângulo pedido, a 80% do raio (banda externa). */
async function pointAt(page: Page, degrees: number, fraction = 0.8) {
  const box = await page.locator(".compass-container.md .compass-svg").boundingBox();
  if (!box) throw new Error("Mostrador não encontrado.");
  const radius = (Math.min(box.width, box.height) / 2) * fraction;
  const radians = ((degrees - 90) * Math.PI) / 180;
  return {
    x: box.x + box.width / 2 + radius * Math.cos(radians),
    y: box.y + box.height / 2 + radius * Math.sin(radians),
  };
}

test("bússola: doze posições, família sem correção e combinação obrigatória", async ({
  page,
}) => {
  await page.goto("/compass");

  // O disco anuncia as doze posições e a leitura corrente.
  const dial = page.locator(".compass-container.md .compass-svg");
  await expect(dial).toHaveAttribute("aria-label", /doze posições/i);

  // Tom fundamental seleciona família e não fabrica pigmento de corte.
  await page.getByRole("button", { name: "Verde", exact: true }).click();
  await expect(
    page.getByText("Escolha a direção do subtom observado no ângulo"),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Usar neste ajuste" })).toBeDisabled();

  // Subtom resolve a regra: as duas adições obrigatórias aparecem sem ambiguidade.
  await page.getByRole("button", { name: /^Verde azulado/ }).first().click();
  await expect(
    page.getByText("Violeta + Óxido vermelho — ambos obrigatórios").first(),
  ).toBeVisible();
  await expect(page.getByText("Violeta", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText("Óxido vermelho", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Usar neste ajuste" })).toBeEnabled();

  // Alternativa exclusiva continua exibindo o "ou".
  await page.getByRole("button", { name: /^Amarelo esverdeado/ }).first().click();
  await expect(
    page
      .getByText("Azul avermelhado ou Violeta — escolha exatamente uma alternativa")
      .first(),
  ).toBeVisible();

  // Suporte segue opcional e separado do corte principal.
  await page.getByRole("button", { name: /^Verde amarelado/ }).first().click();
  await expect(
    page.getByText(/Violeta — corte principal · suporte opcional/).first(),
  ).toBeVisible();
});

test("bússola: clique, arraste e teclado chegam ao mesmo resultado", async ({
  page,
}) => {
  await page.goto("/compass");
  const heading = page.locator(".compass-result h2");

  // Clique direto no setor de 255° (verde azulado).
  const green = await pointAt(page, 255);
  await page.mouse.click(green.x, green.y);
  await expect(heading).toHaveText("Verde azulado");

  // Arraste contínuo até 165° (vermelho amarelado): a leitura acompanha.
  const red = await pointAt(page, 165);
  await page.mouse.move(green.x, green.y);
  await page.mouse.down();
  await page.mouse.move(red.x, red.y, { steps: 12 });
  await page.mouse.up();
  await expect(heading).toHaveText("Vermelho amarelado");

  // Teclado: seta avança um setor no sentido horário (195° = tom Vermelho).
  await page.locator(".compass-container.md .compass-svg").focus();
  await page.keyboard.press("ArrowRight");
  await expect(heading).toHaveText("Vermelho");
  await expect(
    page.getByText("Escolha a direção do subtom observado no ângulo"),
  ).toBeVisible();

  // Volta pelo menor caminho: de 15° (Amarelo) para 345° com a seta à esquerda.
  await page.keyboard.press("Home");
  await expect(heading).toHaveText("Amarelo");
  await page.keyboard.press("ArrowLeft");
  await expect(heading).toHaveText("Amarelo esverdeado");
});

test("bússola: modal preserva seleção e não repete ids de SVG", async ({
  page,
}) => {
  await page.goto("/compass");
  await page.getByRole("button", { name: /^Verde azulado/ }).first().click();

  await page.getByRole("button", { name: "Ampliar bússola" }).first().click();
  const modal = page.getByRole("dialog");
  await expect(modal).toBeVisible();
  await expect(modal.locator("h2").first()).toHaveText(
    "Bússola da Colorimetria",
  );

  // Página e modal montados juntos: nenhum id de SVG pode se repetir.
  const duplicated = await page.evaluate(() => {
    const ids = [...document.querySelectorAll("svg [id]")].map((n) => n.id);
    return ids.filter((id, index) => ids.indexOf(id) !== index);
  });
  expect(duplicated).toEqual([]);

  // Escolher no modal atualiza a página e a seleção sobrevive ao fechamento.
  await modal
    .locator(".compass-container.xl")
    .getByLabel("Vermelho azulado")
    .click();
  await page.keyboard.press("Escape");
  await expect(modal).not.toBeVisible();
  await expect(page.locator(".compass-result h2")).toHaveText(
    "Vermelho azulado",
  );

  // Consultar não grava nada: segue possível encaminhar ao ajuste.
  await expect(page.getByRole("button", { name: "Usar neste ajuste" })).toBeEnabled();
});
