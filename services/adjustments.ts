import { randomUUID } from "node:crypto";
import Decimal from "decimal.js";
import { Prisma } from "@prisma/client";
import { db } from "../lib/db";
import { applicationTable } from "../lib/sql";
import { AppError, type Actor } from "../lib/access";
import {
  formulaSchema,
  correctionSchema,
  panelSchema,
  approvalSchema,
} from "./schemas";
import { getRules, sessionInclude } from "../repositories/workspace";
import { resolveCorrection } from "../domain/colorimetry/correction-engine";
import { calculateCorrectionDose } from "../domain/colorimetry/dosage-engine";
import { normalizeWeights, sumMass } from "../domain/colorimetry/weights";
import type {
  Severity,
  PigmentCharacteristic,
} from "../domain/colorimetry/types";
export const json = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value));
export async function audit(
  tx: Prisma.TransactionClient,
  actor: Actor,
  action: string,
  entityType: string,
  entityId: string,
  before: unknown,
  after: unknown,
  reason: string,
) {
  await tx.auditLog.create({
    data: {
      userId: actor.id,
      organizationId: actor.organizationId,
      action,
      entityType,
      entityId,
      before: before == null ? Prisma.JsonNull : json(before),
      after: after == null ? Prisma.JsonNull : json(after),
      reason,
    },
  });
}
async function lockSession(
  tx: Prisma.TransactionClient,
  actor: Actor,
  id: string,
  expectedVersion?: number,
) {
  // O bloqueio serializa todas as escritas na sessão, incluindo aprovação e fotos.
  await tx.$queryRaw`SELECT id FROM ${applicationTable("AdjustmentSession")} WHERE id = ${id} AND "organizationId" = ${actor.organizationId} FOR UPDATE`;
  const session = await tx.adjustmentSession.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: sessionInclude,
  });
  if (!session) throw new AppError("Ajuste não encontrado.", 404);
  if (session.status !== "IN_PROGRESS")
    throw new AppError("Este ajuste está encerrado.");
  if (expectedVersion !== undefined && session.version !== expectedVersion)
    throw new AppError(
      "O ajuste foi atualizado. Recarregue antes de registrar.",
      409,
    );
  return session;
}
async function validatePigments(
  tx: Prisma.TransactionClient,
  actor: Actor,
  ids: (string | undefined)[],
) {
  for (const id of new Set(ids.filter((v): v is string => !!v))) {
    if (
      !(await tx.pigment.findFirst({
        where: { id, organizationId: actor.organizationId, active: true },
      }))
    )
      throw new AppError("Pigmento indisponível nesta oficina.");
  }
}
export async function createFormula(
  actor: Actor,
  raw: unknown,
  startSession = false,
) {
  const input = formulaSchema.parse(raw);
  const weights = normalizeWeights(
    input.components.map((c) => c.weightG),
    input.weightMode,
  );
  const total = sumMass("0", weights);
  if (!new Decimal(total).eq(input.desiredMassG))
    throw new AppError(
      `A soma dos componentes (${new Decimal(total).toFixed(2)} g) deve ser igual ao peso informado.`,
    );
  return db.$transaction(async (tx) => {
    await validatePigments(
      tx,
      actor,
      input.components.map((c) => c.pigmentId),
    );
    const { components, ...data } = input;
    const formula = await tx.formula.create({
      data: {
        ...data,
        organizationId: actor.organizationId,
        userId: actor.id,
        components: {
          create: components.map((c, i) => ({
            ...c,
            enteredWeightG: c.weightG,
            weightG: weights[i],
            order: i + 1,
          })),
        },
      },
    });
    if (!startSession) return formula;
    return tx.adjustmentSession.create({
      data: {
        organizationId: actor.organizationId,
        userId: actor.id,
        formulaId: formula.id,
        paintType: formula.paintType,
        initialMassG: total,
        currentMassG: total,
      },
    });
  });
}
export async function startFromFormula(actor: Actor, formulaId: string) {
  const formula = await db.formula.findFirst({
    where: {
      id: formulaId,
      organizationId: actor.organizationId,
      archivedAt: null,
    },
    include: { components: true },
  });
  if (!formula) throw new AppError("Fórmula não encontrada.", 404);
  const mass = sumMass(
    "0",
    formula.components.map((c) => c.weightG.toString()),
  );
  return db.adjustmentSession.create({
    data: {
      organizationId: actor.organizationId,
      userId: actor.id,
      formulaId,
      paintType: formula.paintType,
      initialMassG: mass,
      currentMassG: mass,
    },
  });
}
export async function getDose(
  tx: Prisma.TransactionClient,
  actor: Actor,
  ruleId: string,
  paintSystem: string,
  paintType: "SOLID" | "METALLIC" | "PEARL" | "OTHER",
  severity: Severity,
  pigmentId: string | undefined,
  currentMassG: string,
) {
  if (!pigmentId) return null; // Uma característica abstrata não identifica a força tintorial da base utilizada.
  const pigment = await tx.pigment.findFirst({
    where: {
      id: pigmentId,
      organizationId: actor.organizationId,
      active: true,
      isDemo: false,
    },
  });
  if (!pigment) return null;
  const coefficients = await tx.calibrationCoefficient.findMany({
    where: {
      organizationId: actor.organizationId,
      correctionRuleId: ruleId,
      paintSystem,
      paintType,
      severity,
      pigmentId,
      status: "VERIFIED",
      active: true,
      isDemo: false,
    },
  });
  if (coefficients.length !== 1) return null; // Coeficientes concorrentes não são escolhidos arbitrariamente.
  const coefficient = coefficients[0];
  const dose = calculateCorrectionDose({
    currentBatchMassG: currentMassG,
    coefficient: {
      ...coefficient,
      gramsPer100g: coefficient.gramsPer100g.toString(),
      minimumSuggestedG: coefficient.minimumSuggestedG?.toString(),
      maximumSuggestedG: coefficient.maximumSuggestedG?.toString(),
    },
  });
  return dose ? { ...dose, coefficientSnapshot: json(coefficient) } : null;
}
function validateChosenAdditions(
  outputs: ReturnType<typeof resolveCorrection>["outputs"],
  chosen: PigmentCharacteristic[],
) {
  if (new Set(chosen).size !== chosen.length)
    throw new AppError("Registre cada característica uma vez por iteração.");
  if (chosen.some((c) => !outputs.some((o) => o.pigmentCharacteristic === c)))
    throw new AppError("Pigmento incompatível com a regra.");
  for (const required of outputs.filter((o) => o.required))
    if (!chosen.includes(required.pigmentCharacteristic))
      throw new AppError(
        "Registre todos os pigmentos obrigatórios da correção combinada.",
      );
  const alternatives = outputs.filter((o) => o.role === "ALTERNATIVE");
  if (
    alternatives.length &&
    alternatives.filter((o) => chosen.includes(o.pigmentCharacteristic))
      .length !== 1
  )
    throw new AppError("Escolha uma das alternativas da regra.");
}
export async function recordCorrection(actor: Actor, raw: unknown) {
  const input = correctionSchema.parse(raw);
  const rule = resolveCorrection(
    input.diagnosis,
    await getRules(actor.organizationId),
  );
  validateChosenAdditions(
    rule.outputs,
    input.additions.map((a) => a.characteristic),
  );
  return db.$transaction(async (tx) => {
    const session = await lockSession(
      tx,
      actor,
      input.sessionId,
      input.expectedVersion,
    );
    const last = session.iterations.at(-1);
    if (!session.panels.some((p) => p.iterationId === (last?.id ?? null)))
      throw new AppError(
        "Registre uma chapa após a última adição antes de diagnosticar.",
      );
    if (last && !input.frontNotes.trim())
      throw new AppError("Registre também a reavaliação da frente.");
    await validatePigments(
      tx,
      actor,
      input.additions.map((a) => a.pigmentId),
    );
    for (const addition of input.additions) {
      if (addition.pigmentId) {
        const pigment = await tx.pigment.findUniqueOrThrow({
          where: { id: addition.pigmentId },
        });
        if (
          pigment.characteristic !== addition.characteristic ||
          pigment.code !== addition.code ||
          pigment.name !== addition.name
        )
          throw new AppError(
            "A base selecionada não corresponde ao pigmento informado.",
          );
      }
    }
    const massBefore = sumMass(
      session.initialMassG.toString(),
      session.iterations.flatMap((i) =>
        i.additions.map((a) => a.addedAmountG.toString()),
      ),
    );
    const massAfter = sumMass(
      massBefore,
      input.additions.map((a) => a.addedAmountG),
    );
    const additions = [];
    for (const addition of input.additions) {
      const dose = await getDose(
        tx,
        actor,
        rule.id,
        session.formula.paintSystem,
        session.paintType,
        input.severity,
        addition.pigmentId,
        massBefore,
      );
      additions.push({
        ...addition,
        suggestedAmountG: dose?.suggestedAmountG,
        calibrationCoefficientId: dose?.coefficientId,
        coefficientSnapshot: dose?.coefficientSnapshot,
      });
    }
    const iteration = await tx.adjustmentIteration.create({
      data: {
        sessionId: session.id,
        iterationNumber: session.iterations.length + 1,
        correctionRuleId: rule.id,
        ruleSnapshot: json(rule),
        notes: input.notes,
        massAfterG: massAfter,
        additions: { create: additions },
        observations: {
          create: [
            {
              sessionId: session.id,
              view: "ANGLE",
              ...input.diagnosis,
              severity: input.severity,
              lightingCondition: input.lightingCondition,
              notes: input.notes,
            },
            ...(last
              ? [
                  {
                    sessionId: session.id,
                    view: "FRONT" as const,
                    lightingCondition: input.lightingCondition,
                    notes: input.frontNotes,
                  },
                ]
              : []),
          ],
        },
      },
    });
    if (last)
      await tx.adjustmentIteration.update({
        where: { id: last.id },
        data: { result: "NEEDS_CORRECTION" },
      });
    await tx.adjustmentSession.update({
      where: { id: session.id },
      data: { currentMassG: massAfter, version: { increment: 1 } },
    });
    await audit(
      tx,
      actor,
      "CORRECTION_ADDED",
      "AdjustmentIteration",
      iteration.id,
      { mass: massBefore },
      { mass: massAfter, additions, rule },
      "Adição registrada pelo profissional.",
    );
    return iteration;
  });
}
function decodeImage(data?: string) {
  if (!data) return {};
  const match =
    /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/.exec(data);
  if (!match) throw new AppError("Use uma imagem PNG, JPEG ou WebP.");
  const image = Buffer.from(match[2], "base64");
  const valid =
    match[1] === "image/png"
      ? image
          .subarray(0, 8)
          .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      : match[1] === "image/jpeg"
        ? image[0] === 255 && image[1] === 216 && image[2] === 255
        : image.subarray(0, 4).toString() === "RIFF" &&
          image.subarray(8, 12).toString() === "WEBP";
  if (!valid || image.length > 2 * 1024 * 1024)
    throw new AppError("Imagem inválida ou maior que 2 MB.");
  return { image, imageMime: match[1] };
}
export async function recordPanel(actor: Actor, raw: unknown) {
  const input = panelSchema.parse(raw);
  const imageData = decodeImage(input.image);
  return db.$transaction(async (tx) => {
    const session = await lockSession(
      tx,
      actor,
      input.sessionId,
      input.expectedVersion,
    );
    const panel = await tx.testPanel.create({
      data: {
        session: { connect: { id: session.id } },
        iterationId: session.iterations.at(-1)?.id,
        notes: input.notes,
        clearCoatApplied: input.clearCoatApplied,
        ...imageData,
        applicationCondition: {
          create: {
            ...input.application,
            sessionId: session.id,
            clearCoatApplied: input.clearCoatApplied,
          },
        },
      },
      select: { id: true },
    });
    await tx.adjustmentSession.update({
      where: { id: session.id },
      data: { version: { increment: 1 } },
    });
    return panel;
  });
}
export async function approveSession(actor: Actor, raw: unknown) {
  const input = approvalSchema.parse(raw);
  return db.$transaction(async (tx) => {
    const session = await lockSession(
      tx,
      actor,
      input.sessionId,
      input.expectedVersion,
    );
    const last = session.iterations.at(-1);
    const panel = session.panels
      .filter((p) => p.iterationId === (last?.id ?? null))
      .at(-1);
    if (!panel)
      throw new AppError("Registre uma nova chapa antes da aprovação.");
    const organization = await tx.organization.findUniqueOrThrow({
      where: { id: actor.organizationId },
    });
    const allAdditions = session.iterations.flatMap((i) => i.additions);
    const finalComponents = session.formula.components.map((c) => ({
      code: c.code,
      name: c.name,
      pigmentId: c.pigmentId,
      weightG: c.weightG.toString(),
      origin: "ORIGINAL",
    }));
    finalComponents.push(
      ...allAdditions.map((a) => ({
        code: a.code,
        name: a.name,
        pigmentId: a.pigmentId,
        weightG: a.addedAmountG.toString(),
        origin: "CORRECTION",
      })),
    );
    const finalMass = sumMass(
      session.initialMassG.toString(),
      allAdditions.map((a) => a.addedAmountG.toString()),
    );
    await tx.observation.createMany({
      data: [
        {
          sessionId: session.id,
          iterationId: last?.id,
          view: "ANGLE",
          lightingCondition: input.lightingCondition,
          notes: input.angleNotes,
        },
        {
          sessionId: session.id,
          iterationId: last?.id,
          view: "FRONT",
          lightingCondition: input.lightingCondition,
          notes: input.frontNotes,
        },
      ],
    });
    await tx.testPanel.update({
      where: { id: panel.id },
      data: { approved: true },
    });
    if (last)
      await tx.adjustmentIteration.update({
        where: { id: last.id },
        data: { result: "APPROVED" },
      });
    await tx.adjustmentSession.update({
      where: { id: session.id },
      data: {
        status: "APPROVED",
        approvedAt: new Date(),
        currentMassG: finalMass,
        notes: input.notes,
        version: { increment: 1 },
      },
    });
    const entry = await tx.colorBankEntry.create({
      data: {
        organizationId: actor.organizationId,
        sessionId: session.id,
        originalFormula: json(session.formula),
        finalFormula: json({ components: finalComponents, massG: finalMass }),
        professional: actor.name,
        workshop: organization.name,
        searchText: [
          session.formula.manufacturer,
          session.formula.model,
          session.formula.year,
          session.formula.colorCode,
          session.formula.description,
          session.formula.productLine,
          actor.name,
          ...finalComponents.flatMap((c) => [c.code, c.name]),
        ]
          .join(" ")
          .toLowerCase(),
        notes: input.notes,
      },
    });
    await audit(
      tx,
      actor,
      "FORMULA_APPROVED",
      "ColorBankEntry",
      entry.id,
      { status: session.status },
      { ...entry, mass: finalMass },
      input.notes || "Frente e ângulo aprovados pelo profissional.",
    );
    return entry;
  });
}
export async function archiveSession(
  actor: Actor,
  sessionId: string,
  reason: string,
) {
  if (!reason.trim()) throw new AppError("Informe o motivo do arquivamento.");
  return db.$transaction(async (tx) => {
    const session = await lockSession(tx, actor, sessionId);
    await tx.adjustmentSession.update({
      where: { id: session.id },
      data: {
        status: "ARCHIVED",
        archivedAt: new Date(),
        version: { increment: 1 },
      },
    });
    await audit(
      tx,
      actor,
      "ARCHIVED",
      "AdjustmentSession",
      session.id,
      session.status,
      "ARCHIVED",
      reason,
    );
    return { id: randomUUID() };
  });
}
