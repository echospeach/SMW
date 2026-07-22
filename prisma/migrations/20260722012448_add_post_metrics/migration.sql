-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "externalPostId" TEXT;

-- CreateTable
CREATE TABLE "PostMetric" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "impressions" INTEGER,
    "likes" INTEGER,
    "comments" INTEGER,
    "shares" INTEGER,
    "views" INTEGER,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostMetric_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PostMetric_postId_fetchedAt_idx" ON "PostMetric"("postId", "fetchedAt");

-- AddForeignKey
ALTER TABLE "PostMetric" ADD CONSTRAINT "PostMetric_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
