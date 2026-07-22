-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "brandExamplePosts" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "brandIndustry" TEXT,
ADD COLUMN     "brandToneDescription" TEXT;
