-- AlterTable: add referral fields as nullable first, backfill, then enforce constraints
ALTER TABLE "User" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "User" ADD COLUMN "referredByUserId" TEXT;

-- Backfill existing rows with a random unique code (Prisma's cuid() default
-- only applies to new rows going forward, not rows that already exist).
UPDATE "User" SET "referralCode" = md5(random()::text || clock_timestamp()::text || id) WHERE "referralCode" IS NULL;

ALTER TABLE "User" ALTER COLUMN "referralCode" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredByUserId_fkey" FOREIGN KEY ("referredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "ReferralCredit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "consumed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralCredit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReferralCredit_userId_idx" ON "ReferralCredit"("userId");

-- AddForeignKey
ALTER TABLE "ReferralCredit" ADD CONSTRAINT "ReferralCredit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
