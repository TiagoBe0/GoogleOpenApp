"use client";

import { useEffect, useState, useCallback } from "react";
import CalendarScheduleModal from "./CalendarScheduleModal";

interface CalendarEvent {
  id: string;
  summary?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
  source: "google";
}

interface AppAppointment {
  id: string;
  date: string;
  duration: number;
  status: string;
  notes: string | null;
  patient: { name: string | null; email: string } | null;
  patientName?: string | null;
  source: "app";
}

type AnyEvent = CalendarEvent | AppAppointment;

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

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function toPixels(startDate: Date, endDate: Date, dayDate: Date): { top: number; height: number } | null {
  if (!sameDay(startDate, dayDate)) return null;

  const startMin = startDate.getHours() * 60 + startDate.getMinutes();
  const endMin = endDate.getHours() * 60 + endDate.getMinutes();
  const origin = HOUR_START * 60;

  if (endMin <= origin) return null;

  const top = ((startMin - origin) / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 24);
  return { top, height };
}

const STATUS_COLORS: Record<string, string> = {
  CONFIRMED: "bg-indigo-500",
  confirmed: "bg-indigo-500",
  PENDING: "bg-amber-400",
  pending: "bg-amber-400",
  pending_payment: "bg-amber-400",
  CANCELLED: "bg-gray-300",
  cancelled: "bg-gray-300",
};

interface Props {
  psychologistId: string;
  hasGoogleCalendar?: boolean;
}

export default function WeekCalendar({ psychologistId, hasGoogleCalendar = false }: Props) {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [googleEvents, setGoogleEvents] = useState<CalendarEvent[]>([]);
  const [appointments, setAppointments] = useState<AppAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [slot, setSlot] = useState<SlotClick | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = addDays(weekStart, 7);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const fetches: Promise<void>[] = [];

      // Always fetch app appointments
      fetches.push(
        fetch("/api/appointments")
          .then((r) => r.json())
          .then((data) => {
            if (Array.isArray(data)) {
              setAppointments(data.map((a: Omit<AppAppointment, "source">) => ({ ...a, source: "app" as const })));
            }
          })
          .catch(() => {})
      );

      // Fetch Google Calendar only if connected
      if (hasGoogleCalendar) {
        fetches.push(
          fetch(`/api/calendar/events?timeMin=${weekStart.toISOString()}&timeMax=${weekEnd.toISOString()}`)
            .then((r) => r.json())
            .then((data) => {
              if (data.items) {
                setGoogleEvents(data.items.map((e: Omit<CalendarEvent, "source">) => ({ ...e, source: "google" as const })));
              }
            })
            .catch(() => {})
        );
      }

      await Promise.all(fetches);
    } finally {
      setLoading(false);
    }
  }, [weekStart, hasGoogleCalendar]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const today = new Date();
  const isToday = (d: Date) => sameDay(d, today);
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);

  function handleSlotClick(dayDate: Date, hour: number) {
    const d = new Date(dayDate);
    d.setHours(hour, 0, 0, 0);
    setSlot({ date: d, hour });
  }

  // Filter app appointments to current week
  const weekAppointments = appointments.filter((a) => {
    const d = new Date(a.date);
    return d >= weekStart && d < weekEnd && a.status !== "CANCELLED" && a.status !== "cancelled";
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setWeekStart(getWeekStart(new Date()))}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Hoy
          </button>
          <div className="flex items-center">
            <button
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <span className="text-sm font-semibold text-gray-900 capitalize">
            {formatMonthRange(weekStart, addDays(weekEnd, -1))}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 inline-block" /> Confirmado
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block" /> Pendiente
            </span>
            {hasGoogleCalendar && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-400 inline-block" /> Google
              </span>
            )}
          </div>
          {loading && (
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-gray-100">
        <div />
        {weekDays.map((day, i) => (
          <div
            key={i}
            className={`py-3 text-center border-l border-gray-100 ${isToday(day) ? "bg-indigo-50" : ""}`}
          >
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{DAYS[i]}</p>
            <p className={`text-base font-bold mt-0.5 w-8 h-8 mx-auto flex items-center justify-center rounded-full ${
              isToday(day) ? "bg-indigo-600 text-white" : "text-gray-900"
            }`}>
              {day.getDate()}
            </p>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="overflow-y-auto max-h-[600px]" style={{ scrollbarGutter: "stable" }}>
        <div className="grid grid-cols-[48px_repeat(7,1fr)]">
          {/* Hour labels */}
          <div>
            {hours.map((h) => (
              <div key={h} style={{ height: HOUR_HEIGHT }} className="flex items-start justify-end pr-2 pt-1">
                <span className="text-[11px] text-gray-400 font-medium">{h}:00</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day, di) => (
            <div key={di} className={`relative border-l border-gray-100 ${isToday(day) ? "bg-indigo-50/30" : ""}`}>
              {/* Hour slots */}
              {hours.map((h) => (
                <div
                  key={h}
                  style={{ height: HOUR_HEIGHT }}
                  onClick={() => handleSlotClick(day, h)}
                  className="border-t border-gray-100 hover:bg-indigo-50/60 cursor-pointer transition-colors group"
                >
                  <div className="hidden group-hover:flex items-center justify-center h-full pointer-events-none">
                    <span className="text-[11px] text-indigo-400 font-medium">+ Turno</span>
                  </div>
                </div>
              ))}

              {/* App appointments */}
              {weekAppointments.map((apt) => {
                const start = new Date(apt.date);
                const end = new Date(start.getTime() + apt.duration * 60 * 1000);
                const pos = toPixels(start, end, day);
                if (!pos) return null;
                const color = STATUS_COLORS[apt.status] ?? "bg-indigo-500";
                const patientLabel = apt.patient?.name || apt.patientName || apt.patient?.email || "Paciente";
                const startTime = start.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                return (
                  <div
                    key={apt.id}
                    style={{ top: pos.top, height: pos.height }}
                    className={`absolute left-0.5 right-0.5 ${color} text-white rounded-lg px-1.5 py-1 overflow-hidden z-10 cursor-default`}
                    title={`${patientLabel} — ${startTime} (${apt.duration} min)`}
                  >
                    <p className="text-[11px] font-semibold truncate leading-tight">{patientLabel}</p>
                    {pos.height > 32 && (
                      <p className="text-[10px] opacity-80 mt-0.5">{startTime} · {apt.duration}′</p>
                    )}
                  </div>
                );
              })}

              {/* Google Calendar events */}
              {googleEvents.map((event, ei) => {
                const rawStart = event.start.dateTime;
                const rawEnd = event.end.dateTime;
                if (!rawStart || !rawEnd) return null;
                const pos = toPixels(new Date(rawStart), new Date(rawEnd), day);
                if (!pos) return null;
                const startTime = new Date(rawStart).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
                const colors = ["bg-blue-400", "bg-sky-500", "bg-cyan-500", "bg-teal-500"];
                const color = colors[ei % colors.length];
                return (
                  <a
                    key={event.id}
                    href={event.htmlLink ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ top: pos.top, height: pos.height }}
                    className={`absolute left-0.5 right-0.5 ${color} text-white rounded-lg px-1.5 py-1 overflow-hidden z-20 hover:brightness-110 transition-all`}
                    title={event.summary}
                  >
                    <p className="text-[11px] font-semibold truncate leading-tight">{event.summary}</p>
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
        <CalendarScheduleModal
          psychologistId={psychologistId}
          initialDate={slot.date}
          onClose={() => setSlot(null)}
          onCreated={() => { setSlot(null); fetchAll(); }}
        />
      )}
    </div>
  );
}
