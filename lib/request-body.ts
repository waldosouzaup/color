import { AppError } from "./errors";

export async function readJsonBody(
  request: Request,
  maxBytes = 3_000_000,
): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > maxBytes)
    throw new AppError("Arquivo muito grande.", 413);
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new AppError("Envie dados em JSON.", 415);
  const reader = request.body?.getReader();
  if (!reader) throw new AppError("Corpo da requisição ausente.");
  let size = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        await reader.cancel();
        throw new AppError("Arquivo muito grande.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new AppError("JSON inválido.");
  }
}
