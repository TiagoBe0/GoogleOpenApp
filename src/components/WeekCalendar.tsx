"use client";

import { useEffect, useState, useCallback } from "react";
import AppointmentModal from "./AppointmentModal";

interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

interface SlotClick {
  date: Date;
  hour: number;
}

const HOUR_START = 8;
const HOUR_END = 21;
const HOUR_HEIGHT = 64; // px per hour
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

function eventToPixels(event: CalendarEvent, dayDate: Date): { top: number; height: number } | null {
  const raw = event.start.dateTime;
  const rawEnd = event.end.dateTime;
  if (!raw || !rawEnd) return null;

  const start = new Date(raw);
  const end = new Date(rawEnd);

  if (
    start.getFullYear() !== dayDate.getFullYear() ||
    start.getMonth() !== dayDate.getMonth() ||
    start.getDate() !== dayDate.getDate()
  ) return null;

  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes = end.getHours() * 60 + end.getMinutes();
  const originMinutes = HOUR_START * 60;

  if (endMinutes <= originMinutes) return null;

  const top = ((startMinutes - originMinutes) / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 24);
  return { top, height };
}

const EVENT_COLORS = [
  "bg-indigo-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-rose-500",
];

export default function WeekCalendar() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [slot, setSlot] = useState<SlotClick | null>(null);

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = addDays(weekStart, 7);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/calendar/events?timeMin=${weekStart.toISOString()}&timeMax=${weekEnd.toISOString()}`
      );
      const data = await res.json();
      setEvents(data.items ?? []);
    } finally {
      setLoading(false);
    }
  }, [weekStart]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    const currentWeekEnd = addDays(weekStart, 7);

    fetch(`/api/calendar/events?timeMin=${weekStart.toISOString()}&timeMax=${currentWeekEnd.toISOString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setEvents(data.items ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [weekStart]);

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
        {loading && (
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-gray-100">
        <div />
        {weekDays.map((day, i) => (
          <div
            key={i}
            className={`py-3 text-center border-l border-gray-100 ${isToday(day) ? "bg-indigo-50" : ""}`}
          >
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">{DAYS[i]}</p>
            <p className={`text-lg font-bold mt-0.5 w-9 h-9 mx-auto flex items-center justify-center rounded-full ${
              isToday(day) ? "bg-indigo-600 text-white" : "text-gray-900"
            }`}>
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
                  className="border-t border-gray-100 hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                >
                  <div className="hidden group-hover:flex items-center justify-center h-full">
                    <span className="text-xs text-indigo-400 font-medium">+ Turno</span>
                  </div>
                </div>
              ))}

              {/* Events */}
              {events.map((event, ei) => {
                const pos = eventToPixels(event, day);
                if (!pos) return null;
                const color = EVENT_COLORS[ei % EVENT_COLORS.length];
                const startTime = event.start.dateTime
                  ? new Date(event.start.dateTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                  : "";
                return (
                  <a
                    key={event.id}
                    href={event.htmlLink ?? "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ top: pos.top, height: pos.height }}
                    className={`absolute left-0.5 right-0.5 ${color} text-white rounded-lg px-1.5 py-1 overflow-hidden z-10 hover:brightness-110 transition-all`}
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
        <AppointmentModal
          initialDate={slot.date}
          onClose={() => setSlot(null)}
          onCreated={() => { setSlot(null); fetchEvents(); }}
        />
      )}
    </div>
  );
}
