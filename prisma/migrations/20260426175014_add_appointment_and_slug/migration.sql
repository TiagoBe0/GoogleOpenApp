-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "psychologistId" TEXT NOT NULL,
    "patientName" TEXT NOT NULL,
    "patientEmail" TEXT NOT NULL,
    "patientPhone" TEXT,
    "scheduledAt" DATETIME NOT NULL,
    "durationMinutes" INTEGER NOT NULL DEFAULT 50,
    "status" TEXT NOT NULL DEFAULT 'pending_payment',
    "paymentStatus" TEXT NOT NULL DEFAULT 'pending',
    "paymentId" TEXT,
    "preferenceId" TEXT,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ARS',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Appointment_psychologistId_fkey" FOREIGN KEY ("psychologistId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PsychologistProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "slug" TEXT,
    "specialty" TEXT,
    "licenseNumber" TEXT,
    "bio" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT DEFAULT 'Argentina',
    "yearsOfExperience" INTEGER,
    "consultationFee" REAL,
    "currency" TEXT DEFAULT 'ARS',
    "languages" TEXT,
    "website" TEXT,
    "instagram" TEXT,
    "linkedin" TEXT,
    "sessionDuration" INTEGER DEFAULT 50,
    "modalityOnline" BOOLEAN NOT NULL DEFAULT false,
    "modalityPresential" BOOLEAN NOT NULL DEFAULT true,
    "acceptsNewPatients" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PsychologistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PsychologistProfile" ("acceptsNewPatients", "address", "bio", "city", "consultationFee", "country", "createdAt", "currency", "id", "instagram", "languages", "licenseNumber", "linkedin", "modalityOnline", "modalityPresential", "phone", "sessionDuration", "specialty", "updatedAt", "userId", "website", "yearsOfExperience") SELECT "acceptsNewPatients", "address", "bio", "city", "consultationFee", "country", "createdAt", "currency", "id", "instagram", "languages", "licenseNumber", "linkedin", "modalityOnline", "modalityPresential", "phone", "sessionDuration", "specialty", "updatedAt", "userId", "website", "yearsOfExperience" FROM "PsychologistProfile";
DROP TABLE "PsychologistProfile";
ALTER TABLE "new_PsychologistProfile" RENAME TO "PsychologistProfile";
CREATE UNIQUE INDEX "PsychologistProfile_userId_key" ON "PsychologistProfile"("userId");
CREATE UNIQUE INDEX "PsychologistProfile_slug_key" ON "PsychologistProfile"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
