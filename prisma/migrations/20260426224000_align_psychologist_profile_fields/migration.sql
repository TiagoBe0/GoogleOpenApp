-- AlterTable
ALTER TABLE "PsychologistProfile" ADD COLUMN "phone" TEXT;
ALTER TABLE "PsychologistProfile" ADD COLUMN "address" TEXT;
ALTER TABLE "PsychologistProfile" ADD COLUMN "city" TEXT;
ALTER TABLE "PsychologistProfile" ADD COLUMN "country" TEXT DEFAULT 'Argentina';
ALTER TABLE "PsychologistProfile" ADD COLUMN "yearsOfExperience" INTEGER;
ALTER TABLE "PsychologistProfile" ADD COLUMN "languages" TEXT;
ALTER TABLE "PsychologistProfile" ADD COLUMN "website" TEXT;
ALTER TABLE "PsychologistProfile" ADD COLUMN "instagram" TEXT;
ALTER TABLE "PsychologistProfile" ADD COLUMN "linkedin" TEXT;
ALTER TABLE "PsychologistProfile" ADD COLUMN "modalityOnline" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "PsychologistProfile" ADD COLUMN "modalityPresential" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "PsychologistProfile" ADD COLUMN "acceptsNewPatients" BOOLEAN NOT NULL DEFAULT true;
