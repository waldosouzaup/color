import type { Actor } from "../lib/access";
import { AppError } from "../lib/errors";
import { db } from "../lib/db";
import {
  behaviorQueryRequestSchema,
  criteriaIssues,
  describeCriteria,
  isEmptyCriteria,
  type BehaviorQueryResponse,
} from "../domain/colorimetry/behavior-criteria";
import { matchPigmentsByBehavior } from "../domain/colorimetry/behavior-matcher";

type Reader = Pick<typeof db, "pigment">;

/**
 * Consulta qualitativa de bases por comportamento na frente e no ângulo.
 *
 * Somente leitura: usa os registros atuais da oficina da sessão (inclusive
 * edições locais), considera apenas bases ativas e não calcula nem grava dose,
 * adição, fórmula ou sessão.
 */
export async function queryPigmentsByBehavior(
  actor: Actor,
  raw: unknown,
  client: Reader = db,
): Promise<BehaviorQueryResponse> {
  const { criteria, filters } = behaviorQueryRequestSchema.parse(raw);
  if (isEmptyCriteria(criteria))
    throw new AppError("Informe ao menos um comportamento de frente ou de ângulo.");
  const issues = criteriaIssues(criteria);
  if (issues.length) throw new AppError(issues.join(" "));
  const where = {
    organizationId: actor.organizationId,
    active: true,
    ...(filters.manufacturer && { manufacturer: filters.manufacturer }),
    ...(filters.productLine && { productLine: filters.productLine }),
    ...(filters.systemType && { systemType: filters.systemType }),
  };
  const [pigments, demoExcluded] = await Promise.all([
    client.pigment.findMany({
      where: filters.includeDemo ? where : { ...where, isDemo: false },
      select: {
        id: true,
        code: true,
        name: true,
        manufacturer: true,
        productLine: true,
        systemType: true,
        family: true,
        isDemo: true,
        active: true,
        behaviors: {
          select: {
            id: true,
            view: true,
            hueCharacteristic: true,
            lightnessEffect: true,
            cleanlinessEffect: true,
            particleEffect: true,
            notes: true,
            source: true,
            sourceReference: true,
          },
          orderBy: { view: "asc" },
        },
      },
      orderBy: [{ manufacturer: "asc" }, { productLine: "asc" }, { code: "asc" }],
    }),
    filters.includeDemo
      ? Promise.resolve(0)
      : client.pigment.count({ where: { ...where, isDemo: true } }),
  ]);
  return {
    summary: describeCriteria(criteria),
    considered: pigments.length,
    demoExcluded,
    ...matchPigmentsByBehavior(criteria, pigments),
  };
}
