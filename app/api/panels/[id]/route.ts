import { NextResponse } from "next/server";
import { getActor, AppError } from "@/lib/access";
import { db } from "@/lib/db";
import { errorResponse } from "@/lib/http";
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await getActor();
    const { id } = await context.params;
    const panel = await db.testPanel.findFirst({
      where: { id, session: { organizationId: actor.organizationId } },
      select: { image: true, imageMime: true },
    });
    if (!panel?.image || !panel.imageMime)
      throw new AppError("Foto não encontrada.", 404);
    return new NextResponse(new Uint8Array(panel.image), {
      headers: {
        "Content-Type": panel.imageMime,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (e) {
    return errorResponse(e);
  }
}
