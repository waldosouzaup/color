-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'PROFESSIONAL');

-- CreateEnum
CREATE TYPE "PrimaryTone" AS ENUM ('YELLOW', 'BLUE', 'GREEN', 'RED');

-- CreateEnum
CREATE TYPE "ToneDirection" AS ENUM ('REDISH', 'GREENISH', 'YELLOWISH', 'BLUISH');

-- CreateEnum
CREATE TYPE "PaintType" AS ENUM ('SOLID', 'METALLIC', 'PEARL', 'OTHER');

-- CreateEnum
CREATE TYPE "CalibrationStatus" AS ENUM ('DRAFT', 'TESTING', 'VERIFIED', 'RETIRED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('LIGHT', 'MEDIUM', 'STRONG');

-- CreateEnum
CREATE TYPE "AdjustmentStatus" AS ENUM ('IN_PROGRESS', 'APPROVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ObservationView" AS ENUM ('ANGLE', 'FRONT');

-- CreateEnum
CREATE TYPE "LightingCondition" AS ENUM ('SUNLIGHT', 'LED', 'BOOTH', 'FLUORESCENT', 'INCANDESCENT', 'OTHER');

-- CreateEnum
CREATE TYPE "FormulaSource" AS ENUM ('OFFICIAL_SYSTEM', 'MANUAL_ENTRY', 'CUSTOM_FORMULA', 'SAVED_COLOR_BANK', 'OTHER');

-- CreateEnum
CREATE TYPE "WeightMode" AS ENUM ('INDIVIDUAL', 'CUMULATIVE');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "precision" INTEGER NOT NULL DEFAULT 2,
    "officialLinks" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'PROFESSIONAL',
    "organizationId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectionRule" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT,
    "mainTone" "PrimaryTone" NOT NULL,
    "direction" "ToneDirection" NOT NULL,
    "diagnosisLabel" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "notes" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "outputs" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorrectionRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pigment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "productLine" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "systemType" TEXT NOT NULL,
    "family" TEXT NOT NULL,
    "direction" TEXT,
    "characteristic" TEXT,
    "description" TEXT NOT NULL DEFAULT '',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pigment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PigmentBehavior" (
    "id" TEXT NOT NULL,
    "pigmentId" TEXT NOT NULL,
    "view" TEXT NOT NULL,
    "hueCharacteristic" TEXT NOT NULL DEFAULT '',
    "lightnessEffect" TEXT NOT NULL DEFAULT '',
    "cleanlinessEffect" TEXT NOT NULL DEFAULT '',
    "particleEffect" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "source" TEXT NOT NULL,
    "sourceReference" TEXT NOT NULL,

    CONSTRAINT "PigmentBehavior_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Formula" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "manufacturer" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "colorCode" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "paintSystem" TEXT NOT NULL,
    "paintType" "PaintType" NOT NULL,
    "paintManufacturer" TEXT NOT NULL,
    "productLine" TEXT NOT NULL,
    "desiredMassG" DECIMAL(16,4) NOT NULL,
    "source" "FormulaSource" NOT NULL,
    "weightMode" "WeightMode" NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Formula_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormulaComponent" (
    "id" TEXT NOT NULL,
    "formulaId" TEXT NOT NULL,
    "pigmentId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weightG" DECIMAL(16,4) NOT NULL,
    "enteredWeightG" DECIMAL(16,4) NOT NULL,
    "order" INTEGER NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "FormulaComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalibrationCoefficient" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "correctionRuleId" TEXT NOT NULL,
    "pigmentId" TEXT,
    "paintSystem" TEXT NOT NULL,
    "paintType" "PaintType" NOT NULL,
    "severity" "Severity" NOT NULL,
    "gramsPer100g" DECIMAL(16,6) NOT NULL,
    "minimumSuggestedG" DECIMAL(16,4),
    "maximumSuggestedG" DECIMAL(16,4),
    "precision" INTEGER NOT NULL DEFAULT 2,
    "status" "CalibrationStatus" NOT NULL DEFAULT 'DRAFT',
    "source" TEXT NOT NULL,
    "sampleSize" INTEGER NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousVersionId" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalibrationCoefficient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdjustmentSession" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "formulaId" TEXT NOT NULL,
    "status" "AdjustmentStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "initialMassG" DECIMAL(16,4) NOT NULL,
    "currentMassG" DECIMAL(16,4) NOT NULL,
    "paintType" "PaintType" NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "AdjustmentSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdjustmentIteration" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "iterationNumber" INTEGER NOT NULL,
    "correctionRuleId" TEXT NOT NULL,
    "ruleSnapshot" JSONB NOT NULL,
    "result" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT NOT NULL DEFAULT '',
    "massAfterG" DECIMAL(16,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdjustmentIteration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorrectionAddition" (
    "id" TEXT NOT NULL,
    "iterationId" TEXT NOT NULL,
    "pigmentId" TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "characteristic" TEXT NOT NULL,
    "addedAmountG" DECIMAL(16,4) NOT NULL,
    "suggestedAmountG" DECIMAL(16,4),
    "calibrationCoefficientId" TEXT,
    "coefficientSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CorrectionAddition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Observation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "iterationId" TEXT,
    "view" "ObservationView" NOT NULL,
    "mainTone" "PrimaryTone",
    "direction" "ToneDirection",
    "severity" "Severity",
    "lightingCondition" "LightingCondition" NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Observation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicationCondition" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "dilution" TEXT,
    "pressure" TEXT,
    "sprayDistance" TEXT,
    "numberOfCoats" INTEGER,
    "wetOrDry" TEXT,
    "temperature" TEXT,
    "humidity" TEXT,
    "gunModel" TEXT,
    "nozzle" TEXT,
    "thinner" TEXT,
    "primerColor" TEXT,
    "clearCoatApplied" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "ApplicationCondition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestPanel" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "iterationId" TEXT,
    "image" BYTEA,
    "imageMime" TEXT,
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "clearCoatApplied" BOOLEAN NOT NULL DEFAULT false,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT NOT NULL DEFAULT '',
    "applicationConditionId" TEXT,

    CONSTRAINT "TestPanel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColorBankEntry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "originalFormula" JSONB NOT NULL,
    "finalFormula" JSONB NOT NULL,
    "professional" TEXT NOT NULL,
    "workshop" TEXT NOT NULL,
    "searchText" TEXT NOT NULL,
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "ColorBankEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "before" JSONB,
    "after" JSONB,
    "reason" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Account_providerId_accountId_key" ON "Account"("providerId", "accountId");

-- CreateIndex
CREATE INDEX "CorrectionRule_organizationId_mainTone_direction_version_idx" ON "CorrectionRule"("organizationId", "mainTone", "direction", "version");

-- CreateIndex
CREATE INDEX "Pigment_organizationId_idx" ON "Pigment"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Pigment_organizationId_manufacturer_productLine_code_key" ON "Pigment"("organizationId", "manufacturer", "productLine", "code");

-- CreateIndex
CREATE INDEX "Formula_organizationId_colorCode_idx" ON "Formula"("organizationId", "colorCode");

-- CreateIndex
CREATE UNIQUE INDEX "CalibrationCoefficient_previousVersionId_key" ON "CalibrationCoefficient"("previousVersionId");

-- CreateIndex
CREATE INDEX "CalibrationCoefficient_organizationId_correctionRuleId_pain_idx" ON "CalibrationCoefficient"("organizationId", "correctionRuleId", "paintSystem", "paintType", "severity");

-- CreateIndex
CREATE INDEX "AdjustmentSession_organizationId_status_idx" ON "AdjustmentSession"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AdjustmentIteration_sessionId_iterationNumber_key" ON "AdjustmentIteration"("sessionId", "iterationNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TestPanel_applicationConditionId_key" ON "TestPanel"("applicationConditionId");

-- CreateIndex
CREATE UNIQUE INDEX "ColorBankEntry_sessionId_key" ON "ColorBankEntry"("sessionId");

-- CreateIndex
CREATE INDEX "ColorBankEntry_organizationId_idx" ON "ColorBankEntry"("organizationId");

-- CreateIndex
CREATE INDEX "AuditLog_organizationId_createdAt_idx" ON "AuditLog"("organizationId", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PigmentBehavior" ADD CONSTRAINT "PigmentBehavior_pigmentId_fkey" FOREIGN KEY ("pigmentId") REFERENCES "Pigment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormulaComponent" ADD CONSTRAINT "FormulaComponent_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "Formula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdjustmentSession" ADD CONSTRAINT "AdjustmentSession_formulaId_fkey" FOREIGN KEY ("formulaId") REFERENCES "Formula"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdjustmentIteration" ADD CONSTRAINT "AdjustmentIteration_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AdjustmentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorrectionAddition" ADD CONSTRAINT "CorrectionAddition_iterationId_fkey" FOREIGN KEY ("iterationId") REFERENCES "AdjustmentIteration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AdjustmentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Observation" ADD CONSTRAINT "Observation_iterationId_fkey" FOREIGN KEY ("iterationId") REFERENCES "AdjustmentIteration"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicationCondition" ADD CONSTRAINT "ApplicationCondition_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AdjustmentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestPanel" ADD CONSTRAINT "TestPanel_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AdjustmentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestPanel" ADD CONSTRAINT "TestPanel_applicationConditionId_fkey" FOREIGN KEY ("applicationConditionId") REFERENCES "ApplicationCondition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColorBankEntry" ADD CONSTRAINT "ColorBankEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AdjustmentSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

