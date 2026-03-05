-- CreateEnum
CREATE TYPE "PitStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- AlterTable
ALTER TABLE "PitUpdate" ADD COLUMN     "status" "PitStatus" NOT NULL DEFAULT 'TODO',
ALTER COLUMN "severity" DROP DEFAULT;

-- CreateIndex
CREATE INDEX "PitUpdate_buildId_status_idx" ON "PitUpdate"("buildId", "status");
