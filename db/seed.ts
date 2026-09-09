import "dotenv/config";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { db } from "../lib/db";
import { initialRules } from "../domain/colorimetry/correction-engine";
import { pigmentLabels } from "../domain/colorimetry/tones";
import { json } from "../services/adjustments";
if (process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production') throw new Error('Seed de desenvolvimento bloqueado em produção. Use production:bootstrap.');
const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
if (!email || !password || password.length < 12)
  throw new Error(
    "Defina SEED_ADMIN_EMAIL e uma senha de pelo menos 12 caracteres.",
  );
const officialLinks = [
  {
    label: "Sistema Mixing",
    url: "https://www.sherwin-auto.com.br/sistema-mixing/",
  },
  { label: "Sherwin-Williams", url: "https://www.sherwin-auto.com.br/" },
  { label: "Catálogo de cores", url: "https://www.sherwin-auto.com.br/cores/" },
];
await db.organization.upsert({
  where: { id: "development" },
  create: {
    id: "development",
    name: process.env.SEED_ORGANIZATION || "Oficina de desenvolvimento",
    officialLinks,
  },
  update: {},
});
if (!(await db.user.findUnique({ where: { email } }))) {
  const id = randomUUID();
  await db.user.create({
    data: {
      id,
      email,
      name: process.env.SEED_ADMIN_NAME || "Administrador",
      organizationId: "development",
      role: "ADMIN",
      accounts: {
        create: {
          id: randomUUID(),
          accountId: id,
          providerId: "credential",
          password: await hashPassword(password),
        },
      },
    },
  });
}
for (const rule of initialRules)
  await db.correctionRule.upsert({
    where: { id: rule.id },
    create: { ...rule, outputs: json(rule.outputs) },
    update: {},
  });
if (
  process.env.ALLOW_DEMO_SEED === "true"
) {
  for (const [characteristic, name] of Object.entries(pigmentLabels)) {
    const code = `DEMO-${characteristic}`;
    await db.pigment.upsert({
      where: {
        organizationId_manufacturer_productLine_code: {
          organizationId: "development",
          manufacturer: "DEMO",
          productLine: "Treinamento",
          code,
        },
      },
      create: {
        organizationId: "development",
        manufacturer: "DEMO",
        productLine: "Treinamento",
        code,
        name: `${name} — DEMO`,
        systemType: "DEMO",
        family: "Matiz",
        characteristic,
        isDemo: true,
        description:
          "DADO DEMONSTRATIVO. Não corresponde a uma base comercial.",
        behaviors: {
          create: {
            view: "GENERAL",
            source: "DADO DEMONSTRATIVO",
            sourceReference: "Seed de desenvolvimento",
            notes: "Sem propriedades quantitativas calibradas.",
          },
        },
      },
      update: {},
    });
  }
}
console.log(
  "Seed concluído. Oito regras, organização, administrador e bases DEMO opcionais. Nenhum coeficiente inventado.",
);
await db.$disconnect();
