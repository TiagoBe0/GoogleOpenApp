-- CreateTable
CREATE TABLE "AvailabilityRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "psychologistId" TEXT NOT NULL,
    "weekday" INTEGER NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AvailabilityRule_psychologistId_fkey" FOREIGN KEY ("psychologistId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AvailabilityRule_psychologistId_idx" ON "AvailabilityRule"("psychologistId");
