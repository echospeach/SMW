-- AlterTable
ALTER TABLE "VideoRenderLog" ADD COLUMN "contentHash" TEXT NOT NULL DEFAULT '';
ALTER TABLE "VideoRenderLog" ADD COLUMN "jobId" TEXT;
ALTER TABLE "VideoRenderLog" ADD COLUMN "videoUrl" TEXT;

ALTER TABLE "VideoRenderLog" ALTER COLUMN "contentHash" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "VideoRenderLog_userId_contentHash_idx" ON "VideoRenderLog"("userId", "contentHash");
