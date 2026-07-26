import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { availableSlots, isWeekend } from "@/lib/slots";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const psychologistId = searchParams.get("psychologistId");
  const year = parseInt(searchParams.get("year") ?? "0");
  const month = parseInt(searchParams.get("month") ?? "0"); // 1-based
  const day = parseInt(searchParams.get("day") ?? "0");
  const tzOffset = parseInt(searchParams.get("tzOffset") ?? "0"); // minutes behind UTC (e.g. 180 for UTC-3)

  if (!psychologistId || !year || !month || !day) {
    return NextResponse.json({ error: "Parámetros incompletos" }, { status: 400 });
  }

  if (isWeekend(year, month, day)) {
    return NextResponse.json({ slots: [], duration: 50 });
  }

  const profile = await prisma.psychologistProfile.findUnique({
    where: { userId: psychologistId },
    select: { sessionDuration: true },
  });

  const duration = profile?.sessionDuration ?? 50;

  // Build UTC range for the requested local day
  const localStartMs = Date.UTC(year, month - 1, day, 0, tzOffset, 0, 0);
  const localEndMs = localStartMs + 24 * 60 * 60 * 1000;
  const dayStart = new Date(localStartMs);
  const dayEnd = new Date(localEndMs);

  const existing = await prisma.appointment.findMany({
    where: {
      psychologistId,
      status: { not: "CANCELLED" },
      date: { gte: dayStart, lt: dayEnd },
    },
    select: { date: true, duration: true },
  });

  // Convert booked slots to local minutes-since-midnight
  const busyRanges = existing.map((a) => {
    const localMs = a.date.getTime() - tzOffset * 60 * 1000;
    const localDate = new Date(localMs);
    const startMin = localDate.getUTCHours() * 60 + localDate.getUTCMinutes();
    return { start: startMin, end: startMin + a.duration };
  });

  // Si la fecha pedida es hoy para el cliente, hay que descartar lo que ya pasó.
  const nowLocal = new Date(Date.now() - tzOffset * 60 * 1000);
  const isToday =
    nowLocal.getUTCFullYear() === year &&
    nowLocal.getUTCMonth() + 1 === month &&
    nowLocal.getUTCDate() === day;

  const slots = availableSlots({
    duration,
    busy: busyRanges,
    nowMinutes: isToday ? nowLocal.getUTCHours() * 60 + nowLocal.getUTCMinutes() : null,
  });

  return NextResponse.json({ slots, duration });
}
