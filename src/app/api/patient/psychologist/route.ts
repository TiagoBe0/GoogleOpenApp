import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "PATIENT") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const patient = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      psychologist: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          psychologistProfile: { select: { sessionDuration: true, cbu: true, alias: true } },
        },
      },
    },
  });

  const psych = patient?.psychologist;
  if (!psych) return NextResponse.json(null);

  return NextResponse.json({
    id: psych.id,
    name: psych.name,
    email: psych.email,
    image: psych.image,
    sessionDuration: psych.psychologistProfile?.sessionDuration ?? 50,
    cbu: psych.psychologistProfile?.cbu ?? null,
    alias: psych.psychologistProfile?.alias ?? null,
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "PATIENT") return NextResponse.json({ error: "Solo los pacientes pueden usar este endpoint" }, { status: 403 });

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

  const psychologist = await prisma.user.findUnique({ where: { email } });
  if (!psychologist) return NextResponse.json({ error: "No existe un usuario con ese email" }, { status: 404 });
  if (psychologist.role !== "PSYCHOLOGIST") return NextResponse.json({ error: "Ese usuario no es un psicólogo" }, { status: 400 });

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { psychologistId: true },
  });
  if (me?.psychologistId) return NextResponse.json({ error: "Ya tenés un psicólogo asignado" }, { status: 409 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { psychologistId: psychologist.id },
  });

  return NextResponse.json(
    { id: psychologist.id, name: psychologist.name, email: psychologist.email, image: psychologist.image },
    { status: 201 }
  );
}

export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "PATIENT") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { psychologistId: null },
  });

  return NextResponse.json({ ok: true });
}
