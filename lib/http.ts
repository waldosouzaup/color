import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError } from "./access";
export function errorResponse(error: unknown) {
  if (error instanceof ZodError)
    return NextResponse.json(
      {
        error: error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      },
      { status: 400 },
    );
  if (error instanceof AppError)
    return NextResponse.json(
      { error: error.message },
      { status: error.status },
    );
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    ["P2002", "P2034"].includes(error.code)
  )
    return NextResponse.json(
      {
        error:
          "Registro duplicado ou atualizado simultaneamente. Recarregue e confira.",
      },
      { status: 409 },
    );
  console.error(error);
  return NextResponse.json(
    { error: "Não foi possível concluir. Tente novamente." },
    { status: 500 },
  );
}
