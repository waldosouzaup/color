import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { AppError, getActor } from "@/lib/access";
import { errorResponse } from "@/lib/http";
import {
  createFormula,
  startFromFormula,
  recordCorrection,
  recordPanel,
  approveSession,
  archiveSession,
  getDose,
} from "@/services/adjustments";
import {
  savePigment,
  saveCoefficient,
  saveRule,
  createUser,
  saveSettings,
  setUserStatus,
} from "@/services/admin";
import { diagnosisSchema } from "@/domain/colorimetry/validation";
import { resolveCorrection } from "@/domain/colorimetry/correction-engine";
import { getRules } from "@/repositories/workspace";
import { db } from "@/lib/db";
import { severities } from "@/domain/colorimetry/types";
import { readJsonBody } from "@/lib/request-body";
import { limitAction } from "@/services/rate-limit";
import { resetUserPassword } from "@/services/account";
import { queryPigmentsByBehavior } from "@/services/behavior-query";
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    if (
      !origin ||
      origin !== new URL(process.env.BETTER_AUTH_URL || request.url).origin
    )
      throw new AppError("Origem não autorizada.", 403);
    const actor = await getActor();
    await limitAction(actor);
    const parsed = await readJsonBody(request);
    const { action, data } = z
      .object({ action: z.string(), data: z.unknown() })
      .parse(parsed);
    let result: unknown;
    switch (action) {
      case "createFormula":
        result = await createFormula(actor, data);
        break;
      case "createAdjustment":
        result = await createFormula(actor, data, true);
        break;
      case "startFromFormula":
        result = await startFromFormula(
          actor,
          z.object({ formulaId: z.string() }).parse(data).formulaId,
        );
        break;
      case "correction":
        result = await recordCorrection(actor, data);
        break;
      case "panel":
        result = await recordPanel(actor, data);
        break;
      case "approve":
        result = await approveSession(actor, data);
        break;
      case "archive": {
        const input = z
          .object({
            sessionId: z.string(),
            reason: z.string().min(1).max(2000),
          })
          .parse(data);
        result = await archiveSession(actor, input.sessionId, input.reason);
        break;
      }
      case "pigment":
        result = await savePigment(actor, data);
        break;
      case "coefficient":
        result = await saveCoefficient(actor, data);
        break;
      case "rule":
        result = await saveRule(actor, data);
        break;
      case "user":
        result = await createUser(actor, data);
        break;
      case "resetPassword":
        result = await resetUserPassword(actor, data);
        break;
      case "userStatus": {
        const input = z
          .object({ userId: z.string(), active: z.boolean() })
          .parse(data);
        result = await setUserStatus(actor, input.userId, input.active);
        break;
      }
      case "settings":
        result = await saveSettings(actor, data);
        break;
      case "behaviorQuery":
        result = await queryPigmentsByBehavior(actor, data);
        break;
      case "diagnose": {
        const input = z
          .object({
            diagnosis: diagnosisSchema,
            sessionId: z.string().optional(),
            severity: z.enum(severities).default("LIGHT"),
            pigmentId: z.string().optional(),
          })
          .parse(data);
        const rule = resolveCorrection(
          input.diagnosis,
          await getRules(actor.organizationId),
        );
        let dose = null;
        if (input.sessionId) {
          const session = await db.adjustmentSession.findFirst({
            where: {
              id: input.sessionId,
              organizationId: actor.organizationId,
              status: "IN_PROGRESS",
            },
            include: { formula: true },
          });
          if (!session) throw new AppError("Ajuste não encontrado.", 404);
          dose = await getDose(
            db,
            actor,
            rule.id,
            session.formula.paintSystem,
            session.paintType,
            input.severity,
            input.pigmentId,
            session.currentMassG.toString(),
          );
        }
        result = { rule, dose };
        break;
      }
      default:
        throw new AppError("Ação desconhecida.");
    }
    return NextResponse.json({ result });
  } catch (error) {
    return errorResponse(error);
  }
}
