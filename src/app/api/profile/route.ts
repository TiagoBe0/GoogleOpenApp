import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function toSlug(str: string) {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

async function generateUniqueSlug(base: string, excludeUserId: string): Promise<string> {
  const slug = toSlug(base);
  const existing = await prisma.psychologistProfile.findFirst({
    where: { slug, user: { id: { not: excludeUserId } } },
  });
  if (!existing) return slug;
  // Append random suffix if taken
  return `${slug}-${Math.random().toString(36).slice(2, 6)}`;
}

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

  // Resolve slug: use provided or keep existing or auto-generate from name
  const existing = await prisma.psychologistProfile.findUnique({
    where: { userId: session.user.id },
    select: { slug: true },
  });

  let slug = existing?.slug;
  if (!slug) {
    const nameForSlug = body.name || session.user.name || session.user.email;
    slug = await generateUniqueSlug(nameForSlug, session.user.id);
  }

  const commonData = {
    slug,
    specialty: specialty || null,
    licenseNumber: licenseNumber || null,
    bio: bio || null,
    phone: phone || null,
    address: address || null,
    city: city || null,
    country: country || "Argentina",
    yearsOfExperience: yearsOfExperience ? Number(yearsOfExperience) : null,
    consultationFee: consultationFee ? Number(consultationFee) : null,
    currency: currency || "ARS",
    languages: languages || null,
    website: website || null,
    instagram: instagram || null,
    linkedin: linkedin || null,
    sessionDuration: sessionDuration ? Number(sessionDuration) : 50,
    modalityOnline: Boolean(modalityOnline),
    modalityPresential: Boolean(modalityPresential),
    acceptsNewPatients: Boolean(acceptsNewPatients),
  };

  const profile = await prisma.psychologistProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, ...commonData },
    update: commonData,
  });

  if (body.name) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { name: body.name },
    });
  }

  return NextResponse.json({ profile });
}
