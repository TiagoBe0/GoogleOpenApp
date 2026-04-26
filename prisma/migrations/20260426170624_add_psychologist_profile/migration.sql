-- CreateTable
CREATE TABLE "PsychologistProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
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
    "sessionDuration" INTEGER,
    "modalityOnline" BOOLEAN NOT NULL DEFAULT false,
    "modalityPresential" BOOLEAN NOT NULL DEFAULT true,
    "acceptsNewPatients" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PsychologistProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "PsychologistProfile_userId_key" ON "PsychologistProfile"("userId");
