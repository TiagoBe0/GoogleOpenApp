import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const profile = await prisma.psychologistProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ profile });
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();

  const {
    specialty, licenseNumber, bio, phone, address, city, country,
    yearsOfExperience, consultationFee, currency, languages,
    website, instagram, linkedin, sessionDuration,
    modalityOnline, modalityPresential, acceptsNewPatients,
  } = body;

  const profile = await prisma.psychologistProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      specialty, licenseNumber, bio, phone, address, city, country,
      yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : null,
      consultationFee: consultationFee ? Number(consultationFee) : null,
      currency, languages, website, instagram, linkedin,
      sessionDuration: sessionDuration ? Number(sessionDuration) : null,
      modalityOnline: Boolean(modalityOnline),
      modalityPresential: Boolean(modalityPresential),
      acceptsNewPatients: Boolean(acceptsNewPatients),
    },
    update: {
      specialty, licenseNumber, bio, phone, address, city, country,
      yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : null,
      consultationFee: consultationFee ? Number(consultationFee) : null,
      currency, languages, website, instagram, linkedin,
      sessionDuration: sessionDuration ? Number(sessionDuration) : null,
      modalityOnline: Boolean(modalityOnline),
      modalityPresential: Boolean(modalityPresential),
      acceptsNewPatients: Boolean(acceptsNewPatients),
    },
  });

  // Sync name from session if not in profile context
  if (body.name && body.name !== session.user.name) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: body.name },
    });
  }

  return NextResponse.json({ profile });
}
