-- CreateEnum
CREATE TYPE "Prediction" AS ENUM ('NORMAL', 'MI');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MODERATE', 'HIGH');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "BloodGroup" AS ENUM ('A_POSITIVE', 'A_NEGATIVE', 'B_POSITIVE', 'B_NEGATIVE', 'AB_POSITIVE', 'AB_NEGATIVE', 'O_POSITIVE', 'O_NEGATIVE');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "supabaseUserId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "profilePicture" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatientProfile" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "bloodGroup" "BloodGroup" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatientProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ECGSession" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "prediction" "Prediction",
    "confidence" DOUBLE PRECISION,
    "riskLevel" "RiskLevel",
    "heartRate" INTEGER,
    "summary" TEXT,
    "keyFindings" JSONB,
    "ecgFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'PROCESSING',

    CONSTRAINT "ECGSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "ecgSessionId" TEXT NOT NULL,
    "pdfUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Account_supabaseUserId_key" ON "Account"("supabaseUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

-- CreateIndex
CREATE INDEX "PatientProfile_accountId_idx" ON "PatientProfile"("accountId");

-- CreateIndex
CREATE INDEX "ECGSession_profileId_idx" ON "ECGSession"("profileId");

-- CreateIndex
CREATE UNIQUE INDEX "Report_ecgSessionId_key" ON "Report"("ecgSessionId");

-- AddForeignKey
ALTER TABLE "PatientProfile" ADD CONSTRAINT "PatientProfile_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ECGSession" ADD CONSTRAINT "ECGSession_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "PatientProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_ecgSessionId_fkey" FOREIGN KEY ("ecgSessionId") REFERENCES "ECGSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
