import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { availableSlots, labelToMinutes } from "@/lib/slots";
import { weekdayOf, windowsForWeekday } from "@/lib/availability";
import { loadAvailability } from "@/lib/availability-store";
import { DEFAULT_TIMEZONE, zonedParts, zonedTimeToUtc } from "@/lib/timezone";

/**
 * Horarios libres de un día. La grilla se calcula en la zona horaria DEL
 * PROFESIONAL, porque su agenda está escrita en su hora local. Cada horario
 * viaja con el instante exacto (`startsAt`) para que quien reserva no tenga que
 * reconstruirlo: así el turno que se crea es el mismo que se ofreció, aunque el
 * paciente esté en otro país.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const psychologistId = searchParams.get("psychologistId");
  const year = parseInt(searchParams.get("year") ?? "0");
  const month = parseInt(searchParams.get("month") ?? "0"); // 1-based
  const day = parseInt(searchParams.get("day") ?? "0");

  if (!psychologistId || !year || !month || !day) {
    return NextResponse.json({ error: "Parámetros incompletos" }, { status: 400 });
  }

  const [profile, availability] = await Promise.all([
    prisma.psychologistProfile.findUnique({
      where: { userId: psychologistId },
      select: { sessionDuration: true, timezone: true },
    }),
    loadAvailability(psychologistId),
  ]);

  const duration = profile?.sessionDuration ?? 50;
  const timezone = profile?.timezone ?? DEFAULT_TIMEZONE;
  const windows = windowsForWeekday(availability.rules, weekdayOf(year, month, day));

  // Día que el profesional no atiende: no hace falta ir a buscar los turnos.
  if (windows.length === 0) {
    return NextResponse.json({ slots: [], duration, timezone });
  }

  const dayStart = zonedTimeToUtc(year, month, day, 0, timezone);
  const dayEnd = zonedTimeToUtc(year, month, day, 24 * 60, timezone);

  const existing = await prisma.appointment.findMany({
    where: {
      psychologistId,
      status: { not: "CANCELLED" },
      date: { gte: dayStart, lt: dayEnd },
    },
    select: { date: true, duration: true },
  });

  const busy = existing.map((a) => {
    const start = zonedParts(a.date, timezone).minutes;
    return { start, end: start + a.duration };
  });

  // Si el día pedido es hoy para el profesional, lo que ya pasó no se ofrece.
  const now = zonedParts(new Date(), timezone);
  const isToday = now.year === year && now.month === month && now.day === day;

  const slots = availableSlots({
    duration,
    busy,
    windows,
    nowMinutes: isToday ? now.minutes : null,
  }).map((label) => ({
    label,
    startsAt: zonedTimeToUtc(year, month, day, labelToMinutes(label), timezone).toISOString(),
  }));

  return NextResponse.json({ slots, duration, timezone });
}
