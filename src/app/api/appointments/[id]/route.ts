import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  notifyAppointmentCancelled,
  notifyAppointmentConfirmed,
  notifyAppointmentRescheduled,
} from "@/lib/notifications";
import {
  createCalendarEvent,
  deleteCalendarEvent,
  updateCalendarEvent,
} from "@/lib/google-calendar";
import { findConflictingAppointment, isWithinAvailability } from "@/lib/appointment-rules";
import { DEFAULT_TIMEZONE } from "@/lib/timezone";
import type { Appointment, User } from "@prisma/client";

type UpdatedAppointment = Appointment & { patient: Pick<User, "id" | "name" | "email"> | null };

/**
 * Refleja el cambio de estado en el calendario del profesional. Confirmar crea
 * el evento y guarda su id; cancelar lo borra. Sin guardar el id, cancelar
 * dejaba el evento vivo en la agenda y el profesional seguía viendo un turno
 * que ya no existía.
 */
async function syncCalendar(
  appointment: UpdatedAppointment,
  status: string,
  psychologistId: string
): Promise<void> {
  if (status === "CONFIRMED") {
    if (appointment.calendarEventId) return; // ya sincronizado

    const profile = await prisma.psychologistProfile.findUnique({
      where: { userId: psychologistId },
      select: { timezone: true },
    });

    const patientName =
      appointment.patient?.name ||
      appointment.patient?.email ||
      appointment.patientName ||
      "Paciente";

    const eventId = await createCalendarEvent(psychologistId, {
      summary: `Sesión — ${patientName}`,
      description: appointment.notes,
      start: appointment.date,
      durationMinutes: appointment.duration,
      timezone: profile?.timezone ?? DEFAULT_TIMEZONE,
    });

    if (eventId) {
      await prisma.appointment.update({
        where: { id: appointment.id },
        data: { calendarEventId: eventId },
      });
    }
    return;
  }

  if (!appointment.calendarEventId) return;

  const deleted = await deleteCalendarEvent(psychologistId, appointment.calendarEventId);
  if (deleted) {
    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { calendarEventId: null },
    });
  }
}

/**
 * Mueve el turno a otro horario.
 *
 * Cuando reprograma el paciente, el turno vuelve a quedar pendiente: el
 * profesional aceptó una hora concreta, no cualquier hora. Cuando reprograma el
 * profesional, conserva el estado, porque él es quien confirma.
 */
async function reschedule({
  appointment,
  date,
  isPsychologist,
}: {
  appointment: Appointment;
  date: unknown;
  isPsychologist: boolean;
}): Promise<NextResponse> {
  if (typeof date !== "string") {
    return NextResponse.json({ error: "La fecha es inválida" }, { status: 400 });
  }

  const nuevaFecha = new Date(date);
  if (Number.isNaN(nuevaFecha.getTime())) {
    return NextResponse.json({ error: "La fecha es inválida" }, { status: 400 });
  }

  if (appointment.status === "CANCELLED") {
    return NextResponse.json(
      { error: "Un turno cancelado no se puede reprogramar; reservá uno nuevo" },
      { status: 409 }
    );
  }

  if (nuevaFecha.getTime() <= Date.now()) {
    return NextResponse.json({ error: "No se puede mover un turno al pasado" }, { status: 400 });
  }

  const profile = await prisma.psychologistProfile.findUnique({
    where: { userId: appointment.psychologistId },
    select: { timezone: true },
  });

  if (!isPsychologist) {
    const dentro = await isWithinAvailability(
      appointment.psychologistId,
      nuevaFecha,
      appointment.duration,
      profile?.timezone
    );

    if (!dentro) {
      return NextResponse.json(
        { error: "Ese horario está fuera de la agenda del profesional" },
        { status: 409 }
      );
    }
  }

  // El propio turno se excluye: mover uno de las 14 a las 14 no es un conflicto.
  const conflict = await findConflictingAppointment(
    appointment.psychologistId,
    nuevaFecha,
    appointment.duration,
    appointment.id
  );

  if (conflict) {
    return NextResponse.json({ error: "El horario no está disponible" }, { status: 409 });
  }

  const anterior = appointment.date;

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: {
      date: nuevaFecha,
      status: isPsychologist ? appointment.status : "PENDING",
      calendarSequence: { increment: 1 },
    },
    include: { patient: { select: { id: true, name: true, email: true } } },
  });

  after(async () => {
    await moveCalendarEvent(updated, appointment.psychologistId, profile?.timezone);
    await notifyAppointmentRescheduled(
      updated.id,
      anterior,
      isPsychologist ? "PSYCHOLOGIST" : "PATIENT"
    );
  });

  return NextResponse.json(updated);
}

/** Mueve el evento ya creado en Google Calendar al horario nuevo. */
async function moveCalendarEvent(
  appointment: UpdatedAppointment,
  psychologistId: string,
  timezone?: string | null
): Promise<void> {
  if (!appointment.calendarEventId) return;

  await updateCalendarEvent(psychologistId, appointment.calendarEventId, {
    summary: `Sesión — ${appointment.patient?.name || appointment.patient?.email || appointment.patientName || "Paciente"}`,
    description: appointment.notes,
    start: appointment.date,
    durationMinutes: appointment.duration,
    timezone: timezone ?? DEFAULT_TIMEZONE,
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { id } = await params;
  const { status, date } = await req.json();

  // El cuerpo trae un cambio de estado o una nueva fecha, no las dos cosas.
  if (date === undefined && !["CONFIRMED", "CANCELLED"].includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const appointment = await prisma.appointment.findUnique({ where: { id } });
  if (!appointment) return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 });

  const isPsychologist = session.user.role === "PSYCHOLOGIST" && appointment.psychologistId === session.user.id;
  const isPatient = session.user.role === "PATIENT" && appointment.patientId === session.user.id;

  if (!isPsychologist && !isPatient) {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  if (date !== undefined) {
    return reschedule({ appointment, date, isPsychologist });
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: { status },
    include: {
      patient: { select: { id: true, name: true, email: true } },
    },
  });

  // Calendario y avisos van después de responder: que Google esté caído no
  // puede impedir que el profesional confirme un turno.
  after(async () => {
    await syncCalendar(updated, status, appointment.psychologistId);

    // Quien tocó el botón ya sabe lo que hizo; el aviso va para la otra parte.
    if (status === "CONFIRMED") return notifyAppointmentConfirmed(updated.id);
    return notifyAppointmentCancelled(updated.id, isPsychologist ? "PSYCHOLOGIST" : "PATIENT");
  });

  return NextResponse.json(updated);
}
