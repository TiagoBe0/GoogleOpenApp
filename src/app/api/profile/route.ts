import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "PSYCHOLOGIST") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const profile = await prisma.psychologistProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(profile ?? null);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "PSYCHOLOGIST") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const body = await req.json();
  const {
    slug, specialty, licenseNumber, bio, consultationFee, currency,
    sessionDuration, timezone, instagramUrl, linkedinUrl, websiteUrl,
  } = body;

  if (slug !== undefined) {
    if (typeof slug !== "string" || !/^[a-z0-9-]{3,60}$/.test(slug)) {
      return NextResponse.json({ error: "Slug inválido (solo letras minúsculas, números y guiones, 3-60 caracteres)" }, { status: 400 });
    }
    const existing = await prisma.psychologistProfile.findUnique({ where: { slug } });
    if (existing && existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Ese slug ya está en uso" }, { status: 409 });
    }
  }

  const profile = await prisma.psychologistProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      slug: slug ?? session.user.id,
      specialty: specialty ?? null,
      licenseNumber: licenseNumber ?? null,
      bio: bio ?? null,
      consultationFee: consultationFee ?? null,
      currency: currency ?? "ARS",
      sessionDuration: sessionDuration ?? 50,
      timezone: timezone ?? "America/Argentina/Buenos_Aires",
      instagramUrl: instagramUrl ?? null,
      linkedinUrl: linkedinUrl ?? null,
      websiteUrl: websiteUrl ?? null,
    },
    update: {
      ...(slug !== undefined && { slug }),
      ...(specialty !== undefined && { specialty }),
      ...(licenseNumber !== undefined && { licenseNumber }),
      ...(bio !== undefined && { bio }),
      ...(consultationFee !== undefined && { consultationFee }),
      ...(currency !== undefined && { currency }),
      ...(sessionDuration !== undefined && { sessionDuration }),
      ...(timezone !== undefined && { timezone }),
      ...(instagramUrl !== undefined && { instagramUrl }),
      ...(linkedinUrl !== undefined && { linkedinUrl }),
      ...(websiteUrl !== undefined && { websiteUrl }),
    },
  });

  return NextResponse.json(profile);
}
