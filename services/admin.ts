import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { db } from "../lib/db";
import { applicationTable } from "../lib/sql";
import { AppError, requireAdmin, type Actor } from "../lib/access";
import {
  pigmentSchema,
  coefficientSchema,
  ruleSchema,
  userSchema,
  settingsSchema,
} from "./schemas";
import { audit, json } from "./adjustments";
import { getRules } from "../repositories/workspace";
export async function savePigment(actor: Actor, raw: unknown) {
  requireAdmin(actor);
  const { id, behaviors, reason, ...data } = pigmentSchema.parse(raw);
  return db.$transaction(async (tx) => {
    const before = id
      ? await tx.pigment.findFirst({
          where: { id, organizationId: actor.organizationId },
          include: { behaviors: true },
        })
      : null;
    if (id && !before) throw new AppError("Pigmento não encontrado.", 404);
    const after = before
      ? await tx.pigment.update({
          where: { id: before.id },
          data: { ...data, behaviors: { deleteMany: {}, create: behaviors } },
        })
      : await tx.pigment.create({
          data: {
            ...data,
            organizationId: actor.organizationId,
            behaviors: { create: behaviors },
          },
        });
    await audit(
      tx,
      actor,
      before ? "PIGMENT_UPDATED" : "PIGMENT_CREATED",
      "Pigment",
      after.id,
      before,
      { ...after, behaviors },
      reason,
    );
    return after;
  });
}
export async function saveCoefficient(actor: Actor, raw: unknown) {
  requireAdmin(actor);
  const { previousVersionId, reason, ...input } = coefficientSchema.parse(raw);
  const rules = await getRules(actor.organizationId);
  const rule = rules.find((r) => r.id === input.correctionRuleId && r.active);
  if (!rule) throw new AppError("Regra indisponível.");
  if (input.status === "VERIFIED" && !input.pigmentId)
    throw new AppError(
      "Vincule uma base específica antes de verificar o coeficiente.",
    );
  return db.$transaction(async (tx) => {
    if (input.pigmentId) {
      const pigment = await tx.pigment.findFirst({
        where: {
          id: input.pigmentId,
          organizationId: actor.organizationId,
          active: true,
        },
      });
      if (
        !pigment ||
        !rule.outputs.some(
          (o) => o.pigmentCharacteristic === pigment.characteristic,
        )
      )
        throw new AppError("Base incompatível com a regra.");
      if (input.status === "VERIFIED" && pigment.isDemo)
        throw new AppError("Base demonstrativa não pode liberar dosagem.");
    }
    if (previousVersionId)
      await tx.$queryRaw`SELECT id FROM ${applicationTable("CalibrationCoefficient")} WHERE id = ${previousVersionId} AND "organizationId" = ${actor.organizationId} FOR UPDATE`;
    const before = previousVersionId
      ? await tx.calibrationCoefficient.findFirst({
          where: {
            id: previousVersionId,
            organizationId: actor.organizationId,
          },
        })
      : null;
    if (previousVersionId && (!before || !before.active))
      throw new AppError("Versão já substituída ou indisponível.", 409);
    // Editar um verificado sempre exige uma etapa separada de revalidação.
    const status =
      before?.status === "VERIFIED" && input.status !== "RETIRED"
        ? "DRAFT"
        : input.status;
    if (before)
      await tx.calibrationCoefficient.update({
        where: { id: before.id },
        data: { active: false },
      });
    const after = await tx.calibrationCoefficient.create({
      data: {
        ...input,
        status,
        pigmentId: input.pigmentId || null,
        minimumSuggestedG: input.minimumSuggestedG || null,
        maximumSuggestedG: input.maximumSuggestedG || null,
        organizationId: actor.organizationId,
        previousVersionId,
        version: (before?.version ?? 0) + 1,
        approvedBy: status === "VERIFIED" ? actor.id : null,
        approvedAt: status === "VERIFIED" ? new Date() : null,
        active: status !== "RETIRED",
      },
    });
    await audit(
      tx,
      actor,
      before ? "COEFFICIENT_VERSIONED" : "COEFFICIENT_CREATED",
      "CalibrationCoefficient",
      after.id,
      before,
      after,
      reason,
    );
    return after;
  });
}
export async function saveRule(actor: Actor, raw: unknown) {
  requireAdmin(actor);
  const { baseId, reason, ...input } = ruleSchema.parse(raw);
  const original = (await getRules(actor.organizationId)).find(
    (r) => r.id === baseId,
  );
  if (
    !original ||
    original.mainTone !== input.mainTone ||
    original.direction !== input.direction
  )
    throw new AppError("Regra de origem indisponível.");
  const required = input.outputs.filter((o) => o.required);
  const alternatives = input.outputs.filter((o) => o.role === "ALTERNATIVE");
  if (
    (!required.length && !alternatives.length) ||
    new Set(input.outputs.map((o) => o.pigmentCharacteristic)).size !==
      input.outputs.length ||
    input.outputs.some(
      (o) => o.required !== ["PRIMARY", "COMBINED"].includes(o.role),
    ) ||
    (alternatives.length > 0 && required.length > 0)
  )
    throw new AppError(
      "Defina saídas obrigatórias ou alternativas, com papéis consistentes.",
    );
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM ${applicationTable("Organization")} WHERE id = ${actor.organizationId} FOR UPDATE`;
    const latest = await tx.correctionRule.findFirst({
      where: {
        organizationId: actor.organizationId,
        mainTone: input.mainTone,
        direction: input.direction,
      },
      orderBy: { version: "desc" },
    });
    if (latest && latest.id !== baseId)
      throw new AppError("Regra já atualizada. Recarregue.", 409);
    if (latest)
      await tx.correctionRule.update({
        where: { id: latest.id },
        data: { active: false },
      });
    const after = await tx.correctionRule.create({
      data: {
        ...input,
        outputs: json(input.outputs),
        id: randomUUID(),
        organizationId: actor.organizationId,
        version: (latest?.version ?? original.version) + 1,
        priority: 200,
      },
    });
    await audit(
      tx,
      actor,
      "RULE_VERSIONED",
      "CorrectionRule",
      after.id,
      original,
      after,
      reason,
    );
    return after;
  });
}
export async function createUser(actor: Actor, raw: unknown) {
  requireAdmin(actor);
  const { password, ...input } = userSchema.parse(raw);
  const passwordHash = await hashPassword(password);
  return db.$transaction(async (tx) => {
    const id = randomUUID();
    const user = await tx.user.create({
      data: {
        ...input,
        email: input.email.toLowerCase(),
        id,
        organizationId: actor.organizationId,
        accounts: {
          create: {
            id: randomUUID(),
            accountId: id,
            providerId: "credential",
            password: passwordHash,
          },
        },
      },
    });
    await audit(
      tx,
      actor,
      "USER_CREATED",
      "User",
      id,
      null,
      { name: user.name, role: user.role },
      "Cadastro administrativo.",
    );
    return { id: user.id };
  });
}
export async function saveSettings(actor: Actor, raw: unknown) {
  requireAdmin(actor);
  const data = settingsSchema.parse(raw);
  return db.$transaction(async (tx) => {
    const before = await tx.organization.findUniqueOrThrow({
      where: { id: actor.organizationId },
    });
    const after = await tx.organization.update({
      where: { id: actor.organizationId },
      data,
    });
    await audit(
      tx,
      actor,
      "SETTINGS_UPDATED",
      "Organization",
      actor.organizationId,
      before,
      after,
      "Configurações da oficina.",
    );
    return after;
  });
}
export async function setUserStatus(
  actor: Actor,
  userId: string,
  active: boolean,
) {
  requireAdmin(actor);
  if (actor.id === userId)
    throw new AppError("Você não pode desativar o próprio acesso.");
  return db.$transaction(async (tx) => {
    const before = await tx.user.findFirst({
      where: { id: userId, organizationId: actor.organizationId },
    });
    if (!before) throw new AppError("Usuário não encontrado.", 404);
    await tx.user.update({ where: { id: userId }, data: { active } });
    if (!active) await tx.session.deleteMany({ where: { userId } });
    await audit(
      tx,
      actor,
      "USER_STATUS_CHANGED",
      "User",
      userId,
      { active: before.active },
      { active },
      "Alteração administrativa de acesso.",
    );
    return { id: userId };
  });
}
