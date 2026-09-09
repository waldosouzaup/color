import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { db } from "../lib/db";
import { AppError, requireAdmin, type Actor } from "../lib/access";
import { audit } from "./adjustments";

export async function resetUserPassword(actor: Actor, raw: unknown) {
  requireAdmin(actor);
  const input = z
    .object({
      userId: z.string(),
      newPassword: z.string().min(12).max(128),
      reason: z.string().trim().min(1).max(2000),
    })
    .parse(raw);
  if (input.userId === actor.id)
    throw new AppError(
      "Altere sua própria senha em Minha conta, informando a senha atual.",
    );
  const password = await hashPassword(input.newPassword);
  return db.$transaction(async (tx) => {
    const user = await tx.user.findFirst({
      where: { id: input.userId, organizationId: actor.organizationId },
    });
    if (!user) throw new AppError("Usuário não encontrado.", 404);
    await tx.account.upsert({
      where: {
        providerId_accountId: { providerId: "credential", accountId: user.id },
      },
      create: {
        id: randomUUID(),
        providerId: "credential",
        accountId: user.id,
        userId: user.id,
        password,
      },
      update: { password },
    });
    await tx.session.deleteMany({ where: { userId: user.id } });
    await audit(
      tx,
      actor,
      "PASSWORD_RESET",
      "User",
      user.id,
      null,
      { sessionsRevoked: true },
      input.reason,
    );
    return { id: user.id };
  });
}
