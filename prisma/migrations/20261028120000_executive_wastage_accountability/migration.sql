-- Adds explicit investigation and accountability fields to the existing audit log.
-- Existing incidents retain NOT_DETERMINED status: no responsibility is inferred.
ALTER TABLE "ExecutiveWastageLog"
  ADD COLUMN "investigatedByName" TEXT,
  ADD COLUMN "responsibilityStatus" TEXT NOT NULL DEFAULT 'NOT_DETERMINED',
  ADD COLUMN "responsiblePersonName" TEXT,
  ADD COLUMN "responsibilityDecisionNote" TEXT,
  ADD COLUMN "responsibilityDecidedAt" TIMESTAMP(3),
  ADD COLUMN "documentUrl" TEXT;

CREATE INDEX "ExecutiveWastageLog_responsibilityStatus_idx"
  ON "ExecutiveWastageLog"("responsibilityStatus");
