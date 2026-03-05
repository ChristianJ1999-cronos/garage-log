-- DropIndex
DROP INDEX "PitUpdate_buildId_status_idx";

-- AlterTable
ALTER TABLE "PitUpdate" ALTER COLUMN "severity" SET DEFAULT 'info';

-- CreateIndex
CREATE INDEX "PitUpdate_buildId_status_createdAt_idx" ON "PitUpdate"("buildId", "status", "createdAt");
