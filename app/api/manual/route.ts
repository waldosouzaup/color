import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export async function GET() {
  try {
    const candidates = [
      path.join(process.cwd(), "public", "MANUAL_DO_USUARIO.pdf"),
      path.join(process.cwd(), "MANUAL_DO_USUARIO.pdf"),
      path.join(process.cwd(), "docs", "MANUAL_DO_USUARIO.pdf"),
    ];
    const target = candidates.find((p) => existsSync(p)) || candidates[0];
    const buffer = await readFile(target);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="MANUAL_DO_USUARIO.pdf"',
        "Content-Length": buffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("Erro ao carregar manual PDF:", error);
    return NextResponse.json(
      { error: "Manual não encontrado." },
      { status: 404 }
    );
  }
}
