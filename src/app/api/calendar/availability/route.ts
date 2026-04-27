import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const weekStartStr = searchParams.get("weekStart");

  const weekStart = weekStartStr ? new Date(weekStartStr) : getWeekStart(new Date());
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const profile = await prisma.psychologistProfile.findUnique({
    where: { userId: session.user.id },
    select: { sessionDuration: true },
  });

  const sessionDuration = profile?.sessionDuration ?? 50;

  const appointments = await prisma.appointment.findMany({
    where: {
      psychologistId: session.user.id,
      status: { not: "CANCELLED" },
      date: { gte: weekStart, lt: weekEnd },
    },
    select: { date: true, duration: true },
  });

  // Fetch Google Calendar events if token available
  let googleBusy: Array<{ start: string; end: string }> = [];
  if (session.googleAccessToken) {
    try {
      const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
      url.searchParams.set("timeMin", weekStart.toISOString());
      url.searchParams.set("timeMax", weekEnd.toISOString());
      url.searchParams.set("maxResults", "100");
      url.searchParams.set("singleEvents", "true");
      url.searchParams.set("orderBy", "startTime");

      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${session.googleAccessToken}` },
      });

      if (res.ok) {
        const data = await res.json();
        googleBusy = (data.items ?? [])
          .filter((e: { start?: { dateTime?: string }; end?: { dateTime?: string } }) => e.start?.dateTime && e.end?.dateTime)
          .map((e: { start: { dateTime: string }; end: { dateTime: string } }) => ({
            start: e.start.dateTime,
            end: e.end.dateTime,
          }));
      }
    } catch {
      // Silently ignore — show availability without Google events
    }
  }

  const now = new Date();

  const days = Array.from({ length: 7 }, (_, i) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(dayDate.getDate() + i);

    const dayOfWeek = dayDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const dayStr = dayDate.toISOString().split("T")[0];

    if (isWeekend) {
      return { date: dayStr, isWeekend: true, availableSlots: [], bookedCount: 0, googleEventsCount: 0 };
    }

    const sameDay = (d: Date) =>
      d.getFullYear() === dayDate.getFullYear() &&
      d.getMonth() === dayDate.getMonth() &&
      d.getDate() === dayDate.getDate();

    const dayApts = appointments.filter((a) => sameDay(new Date(a.date)));
    const dayGoogleEvents = googleBusy.filter((e) => sameDay(new Date(e.start)));

    const busyRanges: Array<{ start: number; end: number }> = [
      ...dayApts.map((a) => {
        const d = new Date(a.date);
        const s = d.getHours() * 60 + d.getMinutes();
        return { start: s, end: s + a.duration };
      }),
      ...dayGoogleEvents.map((e) => {
        const s = new Date(e.start);
        const en = new Date(e.end);
        return {
          start: s.getHours() * 60 + s.getMinutes(),
          end: en.getHours() * 60 + en.getMinutes(),
        };
      }),
    ];

    const workStart = 8 * 60;
    const workEnd = 20 * 60;

    const isToday = sameDay(now);
    const nowMin = isToday ? now.getHours() * 60 + now.getMinutes() : 0;

    const availableSlots: string[] = [];
    for (let min = workStart; min + sessionDuration <= workEnd; min += sessionDuration) {
      if (isToday && min <= nowMin) continue;
      const busy = busyRanges.some((r) => min < r.end && min + sessionDuration > r.start);
      if (!busy) {
        availableSlots.push(
          `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`
        );
      }
    }

    return {
      date: dayStr,
      isWeekend: false,
      availableSlots,
      bookedCount: dayApts.length,
      googleEventsCount: dayGoogleEvents.length,
    };
  });

  return NextResponse.json({ days, sessionDuration });
}
