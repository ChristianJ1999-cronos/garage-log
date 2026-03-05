-- CreateTable
CREATE TABLE "PitUpdate" (
    "id" TEXT NOT NULL,
    "buildId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'info',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PitUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PitUpdate_buildId_createdAt_idx" ON "PitUpdate"("buildId", "createdAt");

-- AddForeignKey
ALTER TABLE "PitUpdate" ADD CONSTRAINT "PitUpdate_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Build"("id") ON DELETE CASCADE ON UPDATE CASCADE;
