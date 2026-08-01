import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { normalizeBoolean, normalizeText, normalizeYearsOfExperience } from "@/lib/profile-input";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "PSYCHOLOGIST") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const profile = await prisma.psychologistProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(profile ?? null);
}

/**
 * Crea o actualiza el perfil profesional. Devuelve el perfil, o el error que
 * corresponda para que quien llama lo pase tal cual.
 */
/** Campos de texto opcionales que el formulario puede mandar. */
const TEXT_FIELDS = [
  "specialty", "licenseNumber", "bio", "phone", "address", "city", "country",
  "languages", "instagramUrl", "linkedinUrl", "websiteUrl",
] as const;

const BOOLEAN_FIELDS = ["modalityOnline", "modalityPresential", "acceptsNewPatients"] as const;

async function upsertProfile(userId: string, body: Record<string, unknown>) {
  const { slug, consultationFee, currency, sessionDuration, timezone } = body;

  // Los campos opcionales se validan de a uno y solo se tocan los que vinieron.
  const clean: Record<string, unknown> = {};

  for (const field of TEXT_FIELDS) {
    if (body[field] === undefined) continue;
    const result = normalizeText(field, body[field]);
    if (!result.ok) return { error: result.error, status: 400 } as const;
    clean[field] = result.value;
  }

  for (const field of BOOLEAN_FIELDS) {
    if (body[field] === undefined) continue;
    const result = normalizeBoolean(field, body[field]);
    if (!result.ok) return { error: result.error, status: 400 } as const;
    clean[field] = result.value;
  }

  if (body.yearsOfExperience !== undefined) {
    const result = normalizeYearsOfExperience(body.yearsOfExperience);
    if (!result.ok) return { error: result.error, status: 400 } as const;
    clean.yearsOfExperience = result.value;
  }

  if (slug !== undefined) {
    if (typeof slug !== "string" || !/^[a-z0-9-]{3,60}$/.test(slug)) {
      return { error: "Slug inválido (solo letras minúsculas, números y guiones, 3-60 caracteres)", status: 400 } as const;
    }
    const existing = await prisma.psychologistProfile.findUnique({ where: { slug } });
    if (existing && existing.userId !== userId) {
      return { error: "Ese slug ya está en uso", status: 409 } as const;
    }
  }

  const profile = await prisma.psychologistProfile.upsert({
    where: { userId },
    create: {
      userId,
      slug: (slug as string) ?? userId,
      consultationFee: (consultationFee as number) ?? null,
      currency: (currency as string) ?? "ARS",
      sessionDuration: (sessionDuration as number) ?? 50,
      timezone: (timezone as string) ?? "America/Argentina/Buenos_Aires",
      ...clean,
    },
    update: {
      ...(slug !== undefined && { slug: slug as string }),
      ...(consultationFee !== undefined && { consultationFee: consultationFee as number | null }),
      ...(currency !== undefined && { currency: currency as string }),
      ...(sessionDuration !== undefined && { sessionDuration: sessionDuration as number }),
      ...(timezone !== undefined && { timezone: timezone as string }),
      ...clean,
    },
  });

  return { profile } as const;
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "PSYCHOLOGIST") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const result = await upsertProfile(session.user.id, await req.json());
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  return NextResponse.json(result.profile);
}

/**
 * Guardado desde la pantalla "Mi perfil". Es PUT y no PATCH porque el
 * formulario manda el perfil entero e incluye el nombre, que vive en `User` y
 * no en `PsychologistProfile`.
 */
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "PSYCHOLOGIST") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const body = await req.json();
  const { name } = body;

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "El nombre es demasiado corto" }, { status: 400 });
    }
  }

  const result = await upsertProfile(session.user.id, body);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

  if (typeof name === "string") {
    await prisma.user.update({ where: { id: session.user.id }, data: { name: name.trim() } });
  }

  return NextResponse.json({ profile: result.profile });
}
