import { headers } from "next/headers";
import { auth } from "./auth";
import { db } from "./db";
import { AppError } from "./errors";
export { AppError } from "./errors";
export interface Actor {
  id: string;
  name: string;
  organizationId: string;
  role: "ADMIN" | "PROFESSIONAL";
}
export async function getActor(): Promise<Actor> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new AppError("Entre para continuar.", 401);
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: { organization: true },
  });
  if (!user?.active || !user.organization.active)
    throw new AppError("Acesso indisponível.", 403);
  return {
    id: user.id,
    name: user.name,
    organizationId: user.organizationId,
    role: user.role,
  };
}
export function requireAdmin(actor: Actor) {
  if (actor.role !== "ADMIN")
    throw new AppError("Ação exclusiva de administradores.", 403);
}
