-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "psychologistId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "calendarEventId" TEXT,
    "calendarSequence" INTEGER NOT NULL DEFAULT 0,
    "patientName" TEXT,
    "patientEmail" TEXT,
    "patientPhone" TEXT,
    "preferenceId" TEXT,
    "paymentId" TEXT,
    "paymentStatus" TEXT,
    "amount" REAL,
    "currency" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_psychologistId_fkey" FOREIGN KEY ("psychologistId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Appointment" ("amount", "calendarEventId", "createdAt", "currency", "date", "duration", "id", "notes", "patientEmail", "patientId", "patientName", "patientPhone", "paymentId", "paymentStatus", "preferenceId", "psychologistId", "status", "updatedAt") SELECT "amount", "calendarEventId", "createdAt", "currency", "date", "duration", "id", "notes", "patientEmail", "patientId", "patientName", "patientPhone", "paymentId", "paymentStatus", "preferenceId", "psychologistId", "status", "updatedAt" FROM "Appointment";
DROP TABLE "Appointment";
ALTER TABLE "new_Appointment" RENAME TO "Appointment";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
