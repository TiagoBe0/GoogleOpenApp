"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import AppointmentModal from "./AppointmentModal";

interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

interface PsicoAppointment {
  id: string;
  date: string;
  duration: number;
  status: string;
  notes: string | null;
  patientName: string | null;
  patientEmail: string | null;
  patient?: { name: string | null; email: string } | null;
}

interface SlotClick {
  date: Date;
  hour: number;
}

const HOUR_START = 8;
const HOUR_END = 21;
const HOUR_HEIGHT = 64;
const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatMonthRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };
  const s = start.toLocaleDateString("es-ES", opts);
  const e = end.toLocaleDateString("es-ES", opts);
  return s === e ? s : `${start.toLocaleDateString("es-ES", { month: "short" })} – ${e}`;
}

function eventToPixels(
  event: CalendarEvent,
  dayDate: Date
): { top: number; height: number } | null {
  const raw = event.start.dateTime;
  const rawEnd = event.end.dateTime;
  if (!raw || !rawEnd) return null;

  const start = new Date(raw);
  const end = new Date(rawEnd);

  if (
    start.getFullYear() !== dayDate.getFullYear() ||
    start.getMonth() !== dayDate.getMonth() ||
    start.getDate() !== dayDate.getDate()
  )
    return null;

  const startMin = start.getHours() * 60 + start.getMinutes();
  const endMin = end.getHours() * 60 + end.getMinutes();
  const originMin = HOUR_START * 60;

  if (endMin <= originMin || startMin >= HOUR_END * 60) return null;

  const top = Math.max((startMin - originMin) / 60, 0) * HOUR_HEIGHT;
  const height = Math.max(
    (Math.min(endMin, HOUR_END * 60) - Math.max(startMin, originMin)) / 60 * HOUR_HEIGHT,
    24
  );
  return { top, height };
}

function psicoEventToPixels(
  apt: PsicoAppointment,
  dayDate: Date
): { top: number; height: number } | null {
  const start = new Date(apt.date);

  if (
    start.getFullYear() !== dayDate.getFullYear() ||
    start.getMonth() !== dayDate.getMonth() ||
    start.getDate() !== dayDate.getDate()
  )
    return null;

  const startMin = start.getHours() * 60 + start.getMinutes();
  const endMin = startMin + apt.duration;
  const originMin = HOUR_START * 60;

  if (endMin <= originMin || startMin >= HOUR_END * 60) return null;

  const top = Math.max((startMin - originMin) / 60, 0) * HOUR_HEIGHT;
  const height = Math.max(
    (Math.min(endMin, HOUR_END * 60) - Math.max(startMin, originMin)) / 60 * HOUR_HEIGHT,
    24
  );
  return { top, height };
}

function psicoDisplayName(apt: PsicoAppointment): string {
  return apt.patient?.name ?? apt.patientName ?? apt.patient?.email ?? apt.patientEmail ?? "Paciente";
}

const GOOGLE_EVENT_COLORS = [
  "bg-primary",
  "bg-info",
  "bg-info",
];

function psicoEventColor(status: string): string {
  if (status === "CONFIRMED") return "bg-primary";
  if (status === "PENDING") return "bg-pending";
  return "bg-muted";
}

export default function WeekCalendar() {
  const { data: session } = useSession();
  const googleConnected = Boolean(session?.googleAccessToken);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [psicoApts, setPsicoApts] = useState<PsicoAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [slot, setSlot] = useState<SlotClick | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = addDays(weekStart, 7);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      // Only hit Google Calendar when the account is actually connected.
      // Otherwise the endpoint 403s on every week load and spams the console.
      const gcalFetch = googleConnected
        ? fetch(`/api/calendar/events?timeMin=${weekStart.toISOString()}&timeMax=${weekEnd.toISOString()}`)
        : Promise.resolve(null);

      const [gcalRes, aptsRes] = await Promise.allSettled([
        gcalFetch,
        fetch("/api/appointments"),
      ]);

      if (gcalRes.status === "fulfilled" && gcalRes.value && gcalRes.value.ok) {
        const data = await gcalRes.value.json();
        setGoogleEvents(data.items ?? []);
      } else {
        setGoogleEvents([]);
      }

      if (aptsRes.status === "fulfilled" && aptsRes.value.ok) {
        const data: PsicoAppointment[] = await aptsRes.value.json();
        // Filter to week range, exclude cancelled
        const wStart = weekStart.getTime();
        const wEnd = weekEnd.getTime();
        setPsicoApts(
          Array.isArray(data)
            ? data.filter(
                (a) =>
                  a.status !== "CANCELLED" &&
                  new Date(a.date).getTime() >= wStart &&
                  new Date(a.date).getTime() < wEnd
              )
            : []
        );
      }
    } finally {
      setLoading(false);
    }
  }, [weekStart, googleConnected]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const today = new Date();
  const isToday = (d: Date) =>
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

  function handleSlotClick(dayDate: Date, hour: number) {
    const d = new Date(dayDate);
    d.setHours(hour, 0, 0, 0);
    setSlot({ date: d, hour });
  }

  const hasAnyEvents = googleEvents.length > 0 || psicoApts.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-line overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-line">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekStart(getWeekStart(new Date()))}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-line hover:bg-surface-2 transition-colors"
          >
            Hoy
          </button>
          <div className="flex items-center">
            <button
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
            >
              <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="p-1.5 rounded-lg hover:bg-surface-2 transition-colors"
            >
              <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <span className="text-sm font-semibold text-ink capitalize">
            {formatMonthRange(weekStart, addDays(weekEnd, -1))}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          {hasAnyEvents && (
            <div className="hidden sm:flex items-center gap-3 text-[11px] text-muted">
              {psicoApts.some((a) => a.status === "CONFIRMED") && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  Confirmado
                </span>
              )}
              {psicoApts.some((a) => a.status === "PENDING") && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-pending inline-block" />
                  Pendiente
                </span>
              )}
              {googleEvents.length > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                  Google Cal
                </span>
              )}
            </div>
          )}
          {loading && (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-line">
        <div />
        {weekDays.map((day, i) => (
          <div
            key={i}
            className={`py-3 text-center border-l border-line ${isToday(day) ? "bg-primary-soft" : ""}`}
          >
            <p className="text-xs font-medium text-muted uppercase tracking-wide">{DAYS[i]}</p>
            <p
              className={`text-lg font-bold mt-0.5 w-9 h-9 mx-auto flex items-center justify-center rounded-full ${
                isToday(day) ? "bg-primary text-white" : "text-ink"
              }`}
            >
              {day.getDate()}
            </p>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-y-auto max-h-[600px]">
        <div className="grid grid-cols-[56px_repeat(7,1fr)]">
          {/* Hour labels */}
          <div>
            {hours.map((h) => (
              <div
                key={h}
                style={{ height: HOUR_HEIGHT }}
                className="flex items-start justify-end pr-2 pt-1"
              >
                <span className="text-[11px] text-muted font-medium">{h}:00</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, di) => (
            <div
              key={di}
              className={`relative border-l border-line ${isToday(day) ? "bg-primary-soft/30" : ""}`}
            >
              {/* Hour slots */}
              {hours.map((h) => (
                <div
                  key={h}
                  style={{ height: HOUR_HEIGHT }}
                  onClick={() => handleSlotClick(day, h)}
                  className="border-t border-line hover:bg-primary-soft/50 cursor-pointer transition-colors group"
                >
                  <div className="hidden group-hover:flex items-center justify-center h-full">
                    <span className="text-xs text-primary font-medium">+ Turno</span>
                  </div>
                </div>
              ))}

              {/* PsicoLink appointments */}
              {psicoApts.map((apt) => {
                const pos = psicoEventToPixels(apt, day);
                if (!pos) return null;
                const colorClass = psicoEventColor(apt.status);
                const startTime = new Date(apt.date).toLocaleTimeString("es-ES", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <div
                    key={`psico-${apt.id}`}
                    style={{ top: pos.top, height: pos.height }}
                    className={`absolute left-0.5 right-0.5 ${colorClass} text-white rounded-lg px-1.5 py-1 overflow-hidden z-20`}
                    title={`${psicoDisplayName(apt)} — ${startTime} (${apt.duration} min)`}
                  >
                    <p className="text-[11px] font-semibold truncate leading-tight">
                      {psicoDisplayName(apt)}
                    </p>
                    {pos.height > 32 && (
                      <p className="text-[10px] opacity-80 mt-0.5">{startTime}</p>
                    )}
                  </div>
                );
              })}

              {/* Google Calendar events */}
              {googleEvents.map((event, ei) => {
                const pos = eventToPixels(event, day);
                if (!pos) return null;
                const color = GOOGLE_EVENT_COLORS[ei % GOOGLE_EVENT_COLORS.length];
                const startTime = event.start.dateTime
                  ? new Date(event.start.dateTime).toLocaleTimeString("es-ES", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";
                return (
                  <a
                    key={`gcal-${event.id}`}
                    href={event.htmlLink ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ top: pos.top, height: pos.height }}
                    className={`absolute left-0.5 right-0.5 ${color} text-white rounded-lg px-1.5 py-1 overflow-hidden z-10 hover:brightness-110 transition-all`}
                  >
                    <p className="text-[11px] font-semibold truncate leading-tight">
                      {event.summary}
                    </p>
                    {pos.height > 32 && (
                      <p className="text-[10px] opacity-80 mt-0.5">{startTime}</p>
                    )}
                  </a>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {slot && (
        <AppointmentModal
          initialDate={slot.date}
          onClose={() => setSlot(null)}
          onCreated={() => {
            setSlot(null);
            fetchAll();
          }}
        />
      )}
    </div>
  );
}
