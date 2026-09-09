import { cp } from "node:fs/promises";

// Servidor standalone, com os assets locais que o Docker copia durante o build.
await cp(
  new URL("../.next/static", import.meta.url),
  new URL("../.next/standalone/.next/static", import.meta.url),
  { recursive: true },
);
await import("../.next/standalone/server.js");
