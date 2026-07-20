-- CreateTable
CREATE TABLE "VideoRenderLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoRenderLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoRenderLog_userId_createdAt_idx" ON "VideoRenderLog"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "VideoRenderLog" ADD CONSTRAINT "VideoRenderLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
