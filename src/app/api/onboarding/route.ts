import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

async function uniqueSlug(baseValue: string, userId: string) {
  const base = normalizeSlug(baseValue) || `profesional-${userId.slice(0, 8)}`;
  let slug = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.psychologistProfile.findUnique({ where: { slug } });
    if (!existing || existing.userId === userId) return slug;
    slug = `${base}-${suffix}`;
    suffix += 1;
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const body = await req.json();
  const role = body.role;

  if (!["PATIENT", "PSYCHOLOGIST"].includes(role)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "El nombre es requerido" }, { status: 400 });
  }

  if (role === "PATIENT") {
    const dni = typeof body.dni === "string" ? body.dni.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";

    if (!dni) {
      return NextResponse.json({ error: "El DNI es requerido" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { name, role: "PATIENT" },
    });

    await prisma.patientProfile.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        dni,
        phone: phone || null,
      },
      update: {
        dni,
        phone: phone || null,
      },
    });

    return NextResponse.json({ ok: true, redirectTo: "/patient" });
  }

  const specialty = typeof body.specialty === "string" ? body.specialty.trim() : "";
  const licenseNumber = typeof body.licenseNumber === "string" ? body.licenseNumber.trim() : "";
  const consultationFee =
    body.consultationFee === "" || body.consultationFee === undefined
      ? null
      : Number(body.consultationFee);

  if (!licenseNumber || !specialty) {
    return NextResponse.json({ error: "Matrícula y especialidad son requeridas" }, { status: 400 });
  }

  if (consultationFee !== null && (!Number.isFinite(consultationFee) || consultationFee < 0)) {
    return NextResponse.json({ error: "Valor de sesión inválido" }, { status: 400 });
  }

  const slug = await uniqueSlug(name || session.user.email || session.user.id, session.user.id);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { name, role: "PSYCHOLOGIST" },
  });

  await prisma.psychologistProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      slug,
      specialty,
      licenseNumber,
      consultationFee,
      currency: "ARS",
      sessionDuration: 50,
      timezone: "America/Argentina/Buenos_Aires",
    },
    update: {
      specialty,
      licenseNumber,
      consultationFee,
    },
  });

  return NextResponse.json({ ok: true, redirectTo: "/dashboard" });
}
