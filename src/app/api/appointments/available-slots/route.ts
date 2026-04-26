import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const WORK_START = 9;  // 9:00
const WORK_END = 19;   // 19:00

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const psychologistId = searchParams.get("psychologistId");
  const date = searchParams.get("date"); // "YYYY-MM-DD"

  if (!psychologistId || !date) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const profile = await prisma.psychologistProfile.findUnique({
    where: { userId: psychologistId },
    select: { sessionDuration: true, acceptsNewPatients: true },
  });

  if (!profile?.acceptsNewPatients) {
    return NextResponse.json({ slots: [] });
  }

  const duration = profile.sessionDuration ?? 50;

  // Day boundaries in UTC
  const dayStart = new Date(`${date}T00:00:00.000Z`);
  const dayEnd = new Date(`${date}T23:59:59.999Z`);

  const taken = await prisma.appointment.findMany({
    where: {
      psychologistId,
      scheduledAt: { gte: dayStart, lte: dayEnd },
      status: { in: ["pending_payment", "confirmed"] },
    },
    select: { scheduledAt: true },
  });

  const takenMinutes = new Set(
    taken.map((a) => a.scheduledAt.getUTCHours() * 60 + a.scheduledAt.getUTCMinutes())
  );

  const now = new Date();
  const isToday = date === now.toISOString().slice(0, 10);
  const currentMinutes = now.getUTCHours() * 60 + now.getUTCMinutes() + 60; // +1h buffer

  const slots: string[] = [];
  for (let minutes = WORK_START * 60; minutes + duration <= WORK_END * 60; minutes += duration) {
    if (takenMinutes.has(minutes)) continue;
    if (isToday && minutes <= currentMinutes) continue;
    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mm = String(minutes % 60).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
  }

  return NextResponse.json({ slots, duration });
}
