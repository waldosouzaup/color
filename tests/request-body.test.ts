import { expect, it } from "vitest";
import { readJsonBody } from "../lib/request-body";
const request = (body: string, type = "application/json") =>
  new Request("http://localhost/api/actions", {
    method: "POST",
    headers: { "Content-Type": type },
    body,
  });
it("aceita JSON válido", async () =>
  expect(await readJsonBody(request('{"action":"test"}'))).toEqual({
    action: "test",
  }));
it("rejeita conteúdo acima do limite mesmo sem Content-Length", async () =>
  await expect(
    readJsonBody(request(" ".repeat(100)), 20),
  ).rejects.toMatchObject({ status: 413 }));
it("rejeita tipo de conteúdo inadequado", async () =>
  await expect(readJsonBody(request("{}", "text/plain"))).rejects.toMatchObject(
    { status: 415 },
  ));
it("rejeita JSON malformado", async () =>
  await expect(readJsonBody(request("{"))).rejects.toMatchObject({
    status: 400,
  }));
