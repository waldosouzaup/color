import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { db } from "../lib/db";
import { initialRules } from "../domain/colorimetry/correction-engine";
import { validateProductionEnvironment } from "../lib/production-env";

export async function bootstrapProduction(
  env: Record<string, string | undefined>,
) {
  validateProductionEnvironment(env, { migrations: true, bootstrap: true });
  const email = env.PRODUCTION_ADMIN_EMAIL!.trim().toLowerCase();
  const name = env.PRODUCTION_ADMIN_NAME!.trim();
  const organizationName = env.PRODUCTION_ORGANIZATION_NAME!.trim();
  const password = await hashPassword(env.PRODUCTION_ADMIN_PASSWORD!);
  return db.$transaction(async (tx) => {
    const existing = await tx.user.findUnique({
      where: { email },
      include: { organization: true },
    });
    if (existing) {
      if (
        existing.role !== "ADMIN" ||
        existing.organization.name !== organizationName
      )
        throw new Error(
          "O e-mail já pertence a outro cadastro. Nenhuma alteração foi realizada.",
        );
      return { created: false, organizationId: existing.organizationId };
    }
    const organization = await tx.organization.create({
      data: {
        name: organizationName,
        officialLinks: [
          {
            label: "Sistema Mixing",
            url: "https://www.sherwin-auto.com.br/sistema-mixing/",
          },
          {
            label: "Sherwin-Williams",
            url: "https://www.sherwin-auto.com.br/",
          },
          {
            label: "Catálogo de cores",
            url: "https://www.sherwin-auto.com.br/cores/",
          },
        ],
      },
    });
    const id = randomUUID();
    await tx.user.create({
      data: {
        id,
        email,
        name,
        role: "ADMIN",
        organizationId: organization.id,
        accounts: {
          create: {
            id: randomUUID(),
            accountId: id,
            providerId: "credential",
            password,
          },
        },
      },
    });
    for (const rule of initialRules)
      await tx.correctionRule.upsert({
        where: { id: rule.id },
        create: { ...rule, outputs: rule.outputs.map((o) => ({ ...o })) },
        update: {},
      });
    await tx.auditLog.create({
      data: {
        userId: id,
        organizationId: organization.id,
        action: "PRODUCTION_BOOTSTRAP",
        entityType: "Organization",
        entityId: organization.id,
        after: { name: organizationName, adminEmail: email },
        reason: "Provisionamento inicial de produção.",
      },
    });
    return { created: true, organizationId: organization.id };
  });
}
