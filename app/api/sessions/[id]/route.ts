import { NextResponse } from "next/server";
import { getActor } from "@/lib/access";
import { getSession } from "@/repositories/workspace";
import { errorResponse } from "@/lib/http";
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await getActor();
    const { id } = await context.params;
    return NextResponse.json(await getSession(actor, id), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
