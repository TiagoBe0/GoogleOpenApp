import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const WORK_START = 9;  // 09:00
const WORK_END = 19;   // 19:00

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const psychologistId = searchParams.get("psychologistId");
  const date = searchParams.get("date");         // "YYYY-MM-DD" in client's local time
  const tzOffset = Number(searchParams.get("tzOffset") ?? "0"); // minutes behind UTC (e.g. 180 for UTC-3)

  if (!psychologistId || !date) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  // Reject weekends using the date string directly (no timezone ambiguity)
  const [y, mo, d] = date.split("-").map(Number);
  const localDay = new Date(y, mo - 1, d).getDay(); // 0=Sun, 6=Sat
  if (localDay === 0 || localDay === 6) {
    return NextResponse.json({ slots: [], duration: 50 });
  }

  const profile = await prisma.psychologistProfile.findUnique({
    where: { userId: psychologistId },
    select: { sessionDuration: true, acceptsNewPatients: true },
  });

  if (!profile?.acceptsNewPatients) {
    return NextResponse.json({ slots: [], duration: profile?.sessionDuration ?? 50 });
  }

  const duration = profile.sessionDuration ?? 50;

  // Day boundaries: interpret the date as the client's local day
  // tzOffset is minutes behind UTC (positive = west of UTC, e.g. Argentina = 180)
  const dayStartMs = Date.UTC(y, mo - 1, d, 0, tzOffset, 0);   // local 00:00 in UTC
  const dayEndMs   = Date.UTC(y, mo - 1, d, 23, 59 + tzOffset, 59);

  const taken = await prisma.appointment.findMany({
    where: {
      psychologistId,
      scheduledAt: { gte: new Date(dayStartMs), lte: new Date(dayEndMs) },
      status: { in: ["pending_payment", "confirmed"] },
    },
    select: { scheduledAt: true },
  });

  // Convert taken appointments back to local slot minutes
  const takenMinutes = new Set(
    taken.map((a) => {
      const utcMinutes = a.scheduledAt.getUTCHours() * 60 + a.scheduledAt.getUTCMinutes();
      // Convert to local minutes by subtracting the UTC offset
      return ((utcMinutes - tzOffset) % (24 * 60) + 24 * 60) % (24 * 60);
    })
  );

  // "Now" in client's local time, as minutes-since-midnight
  const nowUtc = new Date();
  const nowLocalMinutes =
    ((nowUtc.getUTCHours() * 60 + nowUtc.getUTCMinutes() - tzOffset) % (24 * 60) + 24 * 60) % (24 * 60);

  // isToday: compare the date string to today in client's local timezone
  const todayLocal = new Date(nowUtc.getTime() - tzOffset * 60_000)
    .toISOString()
    .slice(0, 10);
  const isToday = date === todayLocal;

  const slots: string[] = [];
  for (let minutes = WORK_START * 60; minutes + duration <= WORK_END * 60; minutes += duration) {
    if (takenMinutes.has(minutes)) continue;
    // Filter past slots with 1-hour buffer
    if (isToday && minutes <= nowLocalMinutes + 60) continue;
    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mm = String(minutes % 60).padStart(2, "0");
    slots.push(`${hh}:${mm}`);
  }

  return NextResponse.json({ slots, duration });
}
