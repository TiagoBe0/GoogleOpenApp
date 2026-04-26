import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const isPatient = session.user.role === "PATIENT";

  const appointments = await prisma.appointment.findMany({
    where: isPatient
      ? { patientId: session.user.id }
      : { psychologistId: session.user.id },
    include: {
      patient: { select: { id: true, name: true, email: true, image: true } },
      psychologist: { select: { id: true, name: true, email: true } },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "PATIENT") return NextResponse.json({ error: "Solo los pacientes pueden solicitar turnos" }, { status: 403 });

  const { date, duration, notes } = await req.json();
  if (!date) return NextResponse.json({ error: "La fecha es requerida" }, { status: 400 });

  const patient = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { psychologistId: true },
  });

  if (!patient?.psychologistId) {
    return NextResponse.json({ error: "No tenés un psicólogo asignado todavía" }, { status: 400 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      patientId: session.user.id,
      psychologistId: patient.psychologistId,
      date: new Date(date),
      duration: duration ?? 60,
      notes: notes ?? null,
      status: "PENDING",
    },
    include: {
      patient: { select: { id: true, name: true, email: true } },
      psychologist: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(appointment, { status: 201 });
}
