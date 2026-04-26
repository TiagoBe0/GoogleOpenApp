-- Recreate Appointment table to allow optional patientId and add payment fields
PRAGMA foreign_keys=OFF;

CREATE TABLE "Appointment_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "patientId" TEXT,
    "psychologistId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 60,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "calendarEventId" TEXT,
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
    CONSTRAINT "Appointment_new_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Appointment_new_psychologistId_fkey" FOREIGN KEY ("psychologistId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

INSERT INTO "Appointment_new" ("id","patientId","psychologistId","date","duration","notes","status","calendarEventId","createdAt","updatedAt")
SELECT "id","patientId","psychologistId","date","duration","notes","status","calendarEventId","createdAt","updatedAt"
FROM "Appointment";

DROP TABLE "Appointment";
ALTER TABLE "Appointment_new" RENAME TO "Appointment";

PRAGMA foreign_keys=ON;

-- CreateTable PsychologistProfile
CREATE TABLE "PsychologistProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "specialty" TEXT,
    "licenseNumber" TEXT,
    "bio" TEXT,
    "consultationFee" REAL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "sessionDuration" INTEGER NOT NULL DEFAULT 50,
    "timezone" TEXT NOT NULL DEFAULT 'America/Argentina/Buenos_Aires',
    "instagramUrl" TEXT,
    "linkedinUrl" TEXT,
    "websiteUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PsychologistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "PsychologistProfile_userId_key" ON "PsychologistProfile"("userId");
CREATE UNIQUE INDEX "PsychologistProfile_slug_key" ON "PsychologistProfile"("slug");
