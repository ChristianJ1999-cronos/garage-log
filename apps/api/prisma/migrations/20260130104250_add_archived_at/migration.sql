-- AlterTable
ALTER TABLE "PitUpdate" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "PitUpdate_buildId_archivedAt_createdAt_idx" ON "PitUpdate"("buildId", "archivedAt", "createdAt");
