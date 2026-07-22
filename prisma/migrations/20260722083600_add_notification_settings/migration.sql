-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN     "notifyOnFailure" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyOnPublish" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifyWeeklyRecap" BOOLEAN NOT NULL DEFAULT true;
