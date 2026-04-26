import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const { status } = await req.json();

  if (!["CONFIRMED", "CANCELLED"].includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });

  const isPsychologist = session.user.role === "PSYCHOLOGIST" && appointment.psychologistId === session.user.id;
  const isPatient = session.user.role === "PATIENT" && appointment.patientId === session.user.id;

  if (!isPsychologist && !isPatient) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status },
    include: {
      patient: { select: { id: true, name: true, email: true } },
    },
  });

  // Si el psicólogo confirma y tiene Google Calendar, crea el evento
  if (status === "CONFIRMED" && isPsychologist && session.googleAccessToken) {
    const start = new Date(updated.date);
    const end = new Date(start.getTime() + updated.duration * 60 * 1000);

    await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.googleAccessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: `Sesión — ${updated.patient.name || updated.patient.email}`,
        description: updated.notes ?? "",
        start: { dateTime: start.toISOString(), timeZone: "America/Argentina/Buenos_Aires" },
        end: { dateTime: end.toISOString(), timeZone: "America/Argentina/Buenos_Aires" },
      }),
    });
  }

  return NextResponse.json(updated);
}
