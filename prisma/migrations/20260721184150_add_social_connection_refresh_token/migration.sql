-- AlterTable
ALTER TABLE "SocialConnection" ADD COLUMN "refreshToken" TEXT;
ALTER TABLE "SocialConnection" ADD COLUMN "tokenExpiresAt" TIMESTAMP(3);
