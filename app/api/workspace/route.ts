import { NextResponse } from "next/server";
import { getActor } from "@/lib/access";
import { getWorkspace } from "@/repositories/workspace";
import { errorResponse } from "@/lib/http";
export async function GET() {
  try {
    return NextResponse.json(await getWorkspace(await getActor()), {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
