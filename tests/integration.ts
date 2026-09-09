import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { verifyPassword } from "better-auth/crypto";
import { resetUserPassword } from "../services/account";
import { limitAction } from "../services/rate-limit";
import { db } from "../lib/db";
import type { Actor } from "../lib/access";
import {
  createFormula,
  recordPanel,
  recordCorrection,
  approveSession,
  getDose,
} from "../services/adjustments";
import {
  saveCoefficient,
  saveRule,
  savePigment,
  createUser,
  setUserStatus,
} from "../services/admin";
import { getRules, getWorkspace } from "../repositories/workspace";
import { formulaInput } from "./fixtures";
const prefix = `integration-${randomUUID()}`;
const orgA = `${prefix}-a`,
  orgB = `${prefix}-b`;
const actor: Actor = {
  id: `${prefix}-admin`,
  name: "Administrador TEST",
  organizationId: orgA,
  role: "ADMIN",
};
const other: Actor = { ...actor, id: `${prefix}-other`, organizationId: orgB };
const professional: Actor = { ...actor, role: "PROFESSIONAL" };
await db.organization.createMany({
  data: [
    { id: orgA, name: "TEST A", officialLinks: [] },
    { id: orgB, name: "TEST B", officialLinks: [] },
  ],
});
await db.user.createMany({
  data: [
    { ...actor, email: `${prefix}@example.test` },
    { ...other, email: `${prefix}-b@example.test` },
  ],
});
let assertions = 0;
async function rejects(fn: () => Promise<unknown>) {
  await assert.rejects(fn);
  assertions++;
}
try {
  const initial = await createFormula(actor, formulaInput, true);
  const sessionId = initial.id;
  const getSession = () =>
    db.adjustmentSession.findUniqueOrThrow({
      where: { id: sessionId },
      include: { iterations: { include: { additions: true } } },
    });
  const panel = async () => {
    const s = await getSession();
    return recordPanel(actor, {
      sessionId,
      expectedVersion: s.version,
      clearCoatApplied: false,
      notes: "TEST",
      application: { pressure: "2 bar", numberOfCoats: 2 },
    });
  };
  const correction = async (amount: string, expectedVersion?: number) =>
    recordCorrection(actor, {
      sessionId,
      expectedVersion: expectedVersion ?? (await getSession()).version,
      diagnosis: { mainTone: "BLUE", direction: "GREENISH" },
      severity: "LIGHT",
      view: "ANGLE",
      lightingCondition: "SUNLIGHT",
      frontNotes: "Frente avaliada em teste",
      additions: [
        {
          code: "TEST-OX",
          name: "Óxido TEST",
          characteristic: "RED_OXIDE",
          addedAmountG: amount,
        },
      ],
    });
  await rejects(() => correction("1")); // exige chapa
  await rejects(() =>
    recordPanel(other, {
      sessionId,
      expectedVersion: 1,
      clearCoatApplied: false,
      application: {},
    }),
  );
  await panel();
  await correction("1.00");
  assert.equal((await getSession()).currentMassG.toFixed(2), "501.00");
  assertions++;
  await rejects(() => correction("0.50")); // nova chapa obrigatória
  await panel();
  const version = (await getSession()).version;
  const race = await Promise.allSettled([
    correction("0.50", version),
    correction("0.50", version),
  ]);
  assert.equal(race.filter((r) => r.status === "fulfilled").length, 1);
  assertions++;
  const corrected = await getSession();
  assert.equal(corrected.currentMassG.toFixed(2), "501.50");
  assert.equal(corrected.iterations.length, 2);
  assertions += 2;
  assert.equal(corrected.iterations.flatMap((i) => i.additions).length, 2);
  assertions++;
  await rejects(() =>
    recordCorrection(actor, {
      sessionId,
      expectedVersion: corrected.version,
      diagnosis: { mainTone: "BLUE", direction: "YELLOWISH" },
      severity: "LIGHT",
      view: "ANGLE",
      lightingCondition: "LED",
      additions: [
        {
          code: "TEST",
          name: "TEST",
          characteristic: "VIOLET",
          addedAmountG: "1",
        },
      ],
    }),
  );
  const approval = () =>
    approveSession(actor, {
      sessionId,
      expectedVersion: corrected.version,
      angleConfirmed: true,
      frontConfirmed: true,
      lightingCondition: "SUNLIGHT",
      angleNotes: "Ângulo TEST aprovado",
      frontNotes: "Frente TEST aprovada",
    });
  await rejects(approval);
  await panel();
  const entry = await approveSession(actor, {
    sessionId,
    expectedVersion: (await getSession()).version,
    angleConfirmed: true,
    frontConfirmed: true,
    lightingCondition: "SUNLIGHT",
    angleNotes: "Ângulo TEST aprovado",
    frontNotes: "Frente TEST aprovada",
    notes: "TEST",
  });
  assert.equal(entry.professional, actor.name);
  assertions++;
  assert.match(entry.searchText, /test-ox/);
  assertions++;
  assert.equal((await getSession()).status, "APPROVED");
  assertions++;
  await rejects(() => correction("1"));
  assert.equal((await getWorkspace(other)).sessions.length, 0);
  assert.equal((await getWorkspace(other)).bank.length, 0);
  assertions += 2;
  await rejects(() => savePigment(professional, {}));
  await rejects(() => saveCoefficient(professional, {}));
  await rejects(() => saveRule(professional, {}));
  const pigment = await savePigment(actor, {
    manufacturer: "TEST",
    productLine: "TEST",
    code: "TEST-VIOLET",
    name: "TEST fixture matemática",
    systemType: "Sistema de teste",
    family: "Matiz",
    characteristic: "VIOLET",
    reason: "TEST",
  });
  const coefficientData = {
    correctionRuleId: "rule-4",
    pigmentId: pigment.id,
    paintSystem: "Sistema de teste",
    paintType: "METALLIC",
    severity: "LIGHT",
    gramsPer100g: "0.20",
    precision: 2,
    status: "TESTING",
    source: "FIXTURE MATEMÁTICA — NÃO UTILIZAR EM PRODUÇÃO",
    sampleSize: 1,
    reason: "TEST",
  };
  const draft = await saveCoefficient(actor, coefficientData);
  assert.equal(
    await getDose(
      db,
      actor,
      "rule-4",
      "Sistema de teste",
      "METALLIC",
      "LIGHT",
      pigment.id,
      "500",
    ),
    null,
  );
  assertions++;
  const verified = await saveCoefficient(actor, {
    ...coefficientData,
    previousVersionId: draft.id,
    status: "VERIFIED",
  });
  assert.equal(
    (
      await getDose(
        db,
        actor,
        "rule-4",
        "Sistema de teste",
        "METALLIC",
        "LIGHT",
        pigment.id,
        "500",
      )
    )?.suggestedAmountG,
    "1.00",
  );
  assertions++;
  assert.equal(
    await getDose(
      db,
      other,
      "rule-4",
      "Sistema de teste",
      "METALLIC",
      "LIGHT",
      pigment.id,
      "500",
    ),
    null,
  );
  assertions++;
  assert.equal(
    await getDose(
      db,
      actor,
      "rule-4",
      "Outro sistema",
      "METALLIC",
      "LIGHT",
      pigment.id,
      "500",
    ),
    null,
  );
  assertions++;
  const revised = await saveCoefficient(actor, {
    ...coefficientData,
    previousVersionId: verified.id,
    status: "VERIFIED",
    gramsPer100g: "0.30",
  });
  assert.equal(revised.status, "DRAFT");
  assert.equal(revised.version, 3);
  assertions += 2;
  assert.equal(
    (
      await db.calibrationCoefficient.findUniqueOrThrow({
        where: { id: verified.id },
      })
    ).gramsPer100g.toString(),
    "0.2",
  );
  assertions++;
  assert.equal(
    await getDose(
      db,
      actor,
      "rule-4",
      "Sistema de teste",
      "METALLIC",
      "LIGHT",
      pigment.id,
      "500",
    ),
    null,
  );
  assertions++;
  await rejects(() =>
    saveCoefficient(other, {
      ...coefficientData,
      previousVersionId: revised.id,
    }),
  );
  const rules = await getRules(orgA);
  const base = rules.find((r) => r.id === "rule-4");
  assert.ok(base);
  await saveRule(actor, {
    ...base,
    baseId: base.id,
    notes: "TEST versionamento",
    reason: "TEST",
  });
  assert.equal(
    (await getRules(orgA)).find(
      (r) => r.mainTone === "BLUE" && r.direction === "GREENISH",
    )?.version,
    2,
  );
  assertions++;
  assert.equal(
    (await getRules(orgB)).find(
      (r) => r.mainTone === "BLUE" && r.direction === "GREENISH",
    )?.version,
    1,
  );
  assertions++;
  const newUser = await createUser(actor, {
    name: "Teste profissional",
    email: `${prefix}-professional@example.test`,
    password: randomUUID(),
    role: "PROFESSIONAL",
  });
  await setUserStatus(actor, newUser.id, false);
  assert.equal(
    (await db.user.findUniqueOrThrow({ where: { id: newUser.id } })).active,
    false,
  );
  assertions++;
  const resetPassword = randomUUID();
  await rejects(() =>
    resetUserPassword(professional, {
      userId: newUser.id,
      newPassword: resetPassword,
      reason: "TEST",
    }),
  );
  await rejects(() =>
    resetUserPassword(other, {
      userId: newUser.id,
      newPassword: resetPassword,
      reason: "TEST",
    }),
  );
  await db.session.create({
    data: {
      id: randomUUID(),
      token: randomUUID(),
      userId: newUser.id,
      expiresAt: new Date(Date.now() + 3600000),
    },
  });
  await resetUserPassword(actor, {
    userId: newUser.id,
    newPassword: resetPassword,
    reason: "TEST redefinição",
  });
  const account = await db.account.findUniqueOrThrow({
    where: {
      providerId_accountId: { providerId: "credential", accountId: newUser.id },
    },
  });
  assert.ok(account.password);
  assert.equal(
    await verifyPassword({ hash: account.password, password: resetPassword }),
    true,
  );
  assertions++;
  assert.equal(await db.session.count({ where: { userId: newUser.id } }), 0);
  assertions++;
  assert.equal(
    JSON.stringify(
      await db.auditLog.findMany({
        where: { organizationId: actor.organizationId },
      }),
    ).includes(resetPassword),
    false,
  );
  assertions++;
  const now = Date.now();
  const limits = await Promise.allSettled(
    Array.from({ length: 92 }, () => limitAction(actor, now)),
  );
  assert.equal(limits.filter((r) => r.status === "fulfilled").length, 90);
  assertions++;
  assert.equal(limits.filter((r) => r.status === "rejected").length, 2);
  assertions++;
  await limitAction(actor, now + 61000);
  assertions++;
  console.log(
    `Integração PostgreSQL: ${assertions} verificações passaram (massa, concorrência, versões, aprovação, RBAC e isolamento).`,
  );
} finally {
  // Exclusão somente das organizações efêmeras criadas por este teste.
  const whereOrg = { organizationId: { in: [orgA, orgB] } };
  const sessions = await db.adjustmentSession.findMany({
    where: whereOrg,
    select: { id: true },
  });
  const ids = sessions.map((s) => s.id);
  await db.colorBankEntry.deleteMany({ where: whereOrg });
  await db.observation.deleteMany({ where: { sessionId: { in: ids } } });
  await db.testPanel.deleteMany({ where: { sessionId: { in: ids } } });
  await db.applicationCondition.deleteMany({
    where: { sessionId: { in: ids } },
  });
  await db.correctionAddition.deleteMany({
    where: { iteration: { sessionId: { in: ids } } },
  });
  await db.adjustmentIteration.deleteMany({
    where: { sessionId: { in: ids } },
  });
  await db.adjustmentSession.deleteMany({ where: whereOrg });
  await db.formulaComponent.deleteMany({ where: { formula: whereOrg } });
  await db.formula.deleteMany({ where: whereOrg });
  await db.calibrationCoefficient.deleteMany({ where: whereOrg });
  await db.pigmentBehavior.deleteMany({ where: { pigment: whereOrg } });
  await db.pigment.deleteMany({ where: whereOrg });
  await db.correctionRule.deleteMany({ where: whereOrg });
  await db.auditLog.deleteMany({ where: whereOrg });
  await db.rateLimit.deleteMany({ where: { key: { contains: prefix } } });
  await db.user.deleteMany({ where: whereOrg });
  await db.organization.deleteMany({ where: { id: { in: [orgA, orgB] } } });
  await db.$disconnect();
}
