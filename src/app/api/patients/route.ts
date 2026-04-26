import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "PSYCHOLOGIST") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const patients = await prisma.user.findMany({
    where: { psychologistId: session.user.id },
    select: { id: true, name: true, email: true, image: true, createdAt: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(patients);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "PSYCHOLOGIST") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "Email requerido" }, { status: 400 });

  const patient = await prisma.user.findUnique({ where: { email } });

  if (!patient) return NextResponse.json({ error: "No existe un usuario con ese email" }, { status: 404 });
  if (patient.role !== "PATIENT") return NextResponse.json({ error: "Ese usuario no es un paciente" }, { status: 400 });
  if (patient.psychologistId) return NextResponse.json({ error: "Este paciente ya tiene un psicólogo asignado" }, { status: 409 });
  if (patient.id === session.user.id) return NextResponse.json({ error: "No podés vincularte a vos mismo" }, { status: 400 });

  const updated = await prisma.user.update({
    where: { id: patient.id },
    data: { psychologistId: session.user.id },
    select: { id: true, name: true, email: true, image: true, createdAt: true },
  });

  return NextResponse.json(updated, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "PSYCHOLOGIST") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const { patientId } = await req.json();
  if (!patientId) return NextResponse.json({ error: "patientId requerido" }, { status: 400 });

  await prisma.user.updateMany({
    where: { id: patientId, psychologistId: session.user.id },
    data: { psychologistId: null },
  });

  return NextResponse.json({ ok: true });
}
