-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PsychologistProfile" (
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
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "yearsOfExperience" INTEGER,
    "languages" TEXT,
    "modalityOnline" BOOLEAN NOT NULL DEFAULT false,
    "modalityPresential" BOOLEAN NOT NULL DEFAULT true,
    "acceptsNewPatients" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PsychologistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_PsychologistProfile" ("bio", "consultationFee", "createdAt", "currency", "id", "instagramUrl", "licenseNumber", "linkedinUrl", "sessionDuration", "slug", "specialty", "timezone", "updatedAt", "userId", "websiteUrl") SELECT "bio", "consultationFee", "createdAt", "currency", "id", "instagramUrl", "licenseNumber", "linkedinUrl", "sessionDuration", "slug", "specialty", "timezone", "updatedAt", "userId", "websiteUrl" FROM "PsychologistProfile";
DROP TABLE "PsychologistProfile";
ALTER TABLE "new_PsychologistProfile" RENAME TO "PsychologistProfile";
CREATE UNIQUE INDEX "PsychologistProfile_userId_key" ON "PsychologistProfile"("userId");
CREATE UNIQUE INDEX "PsychologistProfile_slug_key" ON "PsychologistProfile"("slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
