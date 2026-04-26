"use client";

import { useEffect, useState } from "react";

interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  location?: string;
  htmlLink?: string;
}

function formatDate(start: CalendarEvent["start"]): { day: string; month: string; weekday: string; time: string } {
  const raw = start.dateTime || start.date;
  if (!raw) return { day: "?", month: "???", weekday: "???", time: "" };
  const d = new Date(raw);
  const day = d.toLocaleDateString("es-ES", { day: "numeric" });
  const month = d.toLocaleDateString("es-ES", { month: "short" }).replace(".", "");
  const weekday = d.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", "");
  const time = start.dateTime
    ? d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    : "Todo el día";
  return { day, month, weekday, time };
}

function isToday(start: CalendarEvent["start"]): boolean {
  const raw = start.dateTime || start.date;
  if (!raw) return false;
  const d = new Date(raw);
  const today = new Date();
  return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
}

const COLOR_CLASSES = [
  "bg-blue-100 text-blue-700 border-blue-200",
  "bg-purple-100 text-purple-700 border-purple-200",
  "bg-green-100 text-green-700 border-green-200",
  "bg-rose-100 text-rose-700 border-rose-200",
  "bg-amber-100 text-amber-700 border-amber-200",
];

export default function CalendarSection() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/calendar/events")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setEvents(data.items || []);
      })
      .catch(() => setError("No se pudieron cargar los eventos"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Próximos eventos</h2>
            <p className="text-xs text-gray-400">Desde tu Google Calendar</p>
          </div>
        </div>
        {!loading && !error && events.length > 0 && (
          <span className="text-xs font-medium bg-indigo-50 text-indigo-600 px-2.5 py-1 rounded-full">
            {events.length} evento{events.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && !error && events.length === 0 && (
        <div className="text-center py-10 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm">No hay eventos próximos en tu calendario</p>
        </div>
      )}

      {!loading && !error && events.length > 0 && (
        <div className="space-y-2">
          {events.map((event, i) => {
            const { day, month, weekday, time } = formatDate(event.start);
            const today = isToday(event.start);
            const colorClass = COLOR_CLASSES[i % COLOR_CLASSES.length];
            return (
              <a
                key={event.id}
                href={event.htmlLink || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
              >
                <div className={`flex flex-col items-center justify-center rounded-xl border px-3 py-2 min-w-[52px] ${today ? "bg-indigo-600 text-white border-indigo-600" : colorClass}`}>
                  <span className="text-lg font-bold leading-none">{day}</span>
                  <span className="text-[10px] font-medium uppercase mt-0.5 opacity-80">{month}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 text-sm truncate group-hover:text-indigo-700 transition-colors">
                      {event.summary || "(Sin título)"}
                    </p>
                    {today && (
                      <span className="flex-shrink-0 text-[10px] font-semibold bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full">Hoy</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 capitalize">{weekday} · {time}</p>
                  {event.location && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">📍 {event.location}</p>
                  )}
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 flex-shrink-0 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}
