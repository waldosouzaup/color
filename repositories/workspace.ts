import { z } from "zod";
import { db } from "../lib/db";
import type { Actor } from "../lib/access";
import { AppError } from "../lib/errors";
import { outputSchema } from "../services/schemas";
import type { CorrectionRule } from "../domain/colorimetry/types";
export const panelSelect = {
  id: true,
  sessionId: true,
  iterationId: true,
  appliedAt: true,
  clearCoatApplied: true,
  approved: true,
  notes: true,
  imageMime: true,
  applicationCondition: true,
} as const;
/* Árvore completa de um ajuste: só o detalhe de uma sessão precisa disso. */
export const sessionInclude = {
  formula: { include: { components: { orderBy: { order: "asc" as const } } } },
  iterations: {
    orderBy: { iterationNumber: "asc" as const },
    include: { additions: true, observations: true },
  },
  panels: { select: panelSelect, orderBy: { appliedAt: "asc" as const } },
  observations: true,
  colorBank: true,
} as const;
/* Forma enxuta para listagens, visão geral e contadores do menu. */
export const sessionSummarySelect = {
  id: true,
  formulaId: true,
  status: true,
  currentMassG: true,
  startedAt: true,
  approvedAt: true,
  formula: {
    select: {
      id: true,
      colorCode: true,
      description: true,
      manufacturer: true,
      model: true,
      year: true,
      isDemo: true,
    },
  },
  _count: { select: { iterations: true } },
} as const;
export async function getRules(
  organizationId: string,
): Promise<CorrectionRule[]> {
  const rows = await db.correctionRule.findMany({
    where: { OR: [{ organizationId: null }, { organizationId }] },
    orderBy: { version: "desc" },
  });
  const selected = new Map<string, CorrectionRule>();
  for (const row of [
    ...rows.filter((r) => r.organizationId),
    ...rows.filter((r) => !r.organizationId),
  ]) {
    const key = `${row.mainTone}:${row.direction}`;
    if (!selected.has(key))
      selected.set(key, {
        ...row,
        outputs: z.array(outputSchema).parse(row.outputs),
      });
  }
  return [...selected.values()];
}
export async function getSession(actor: Actor, id: string) {
  const session = await db.adjustmentSession.findFirst({
    where: { id, organizationId: actor.organizationId },
    include: sessionInclude,
  });
  if (!session) throw new AppError("Ajuste não encontrado.", 404);
  return session;
}
export async function getWorkspace(actor: Actor) {
  const where = { organizationId: actor.organizationId };
  const admin = actor.role === "ADMIN";
  const [
    organization,
    formulas,
    sessions,
    pigments,
    rules,
    coefficients,
    bank,
    users,
    audit,
    professionals,
  ] = await Promise.all([
    db.organization.findUniqueOrThrow({ where: { id: actor.organizationId } }),
    db.formula.findMany({
      where: { ...where, archivedAt: null },
      include: { components: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    db.adjustmentSession.findMany({
      where,
      select: sessionSummarySelect,
      orderBy: { startedAt: "desc" },
    }),
    db.pigment.findMany({
      where,
      include: { behaviors: true },
      orderBy: { code: "asc" },
    }),
    getRules(actor.organizationId),
    admin
      ? db.calibrationCoefficient.findMany({ where, orderBy: { createdAt: "desc" } })
      : Promise.resolve([]),
    db.colorBankEntry.findMany({
      where: { ...where, archivedAt: null },
      /* originalFormula e finalFormula são blobs Json que a interface nunca lê. */
      select: {
        id: true,
        sessionId: true,
        professional: true,
        workshop: true,
        searchText: true,
        notes: true,
        createdAt: true,
        session: {
          select: {
            currentMassG: true,
            formula: {
              select: {
                colorCode: true,
                description: true,
                manufacturer: true,
                model: true,
                year: true,
                isDemo: true,
                paintType: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    admin
      ? db.user.findMany({
          where,
          select: { id: true, name: true, email: true, role: true, active: true },
        })
      : Promise.resolve([]),
    admin
      ? db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 })
      : Promise.resolve([]),
    db.user.findMany({ where, select: { id: true, name: true } }),
  ]);
  return {
    actor,
    organization,
    formulas,
    sessions,
    pigments,
    rules,
    coefficients,
    bank,
    users,
    audit,
    professionals,
  };
}
