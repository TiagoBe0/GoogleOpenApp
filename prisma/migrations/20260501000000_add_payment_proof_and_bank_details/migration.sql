-- AlterTable: add paymentProofUrl to Appointment
ALTER TABLE "Appointment" ADD COLUMN "paymentProofUrl" TEXT;

-- AlterTable: add cbu and alias to PsychologistProfile
ALTER TABLE "PsychologistProfile" ADD COLUMN "cbu" TEXT;
ALTER TABLE "PsychologistProfile" ADD COLUMN "alias" TEXT;
