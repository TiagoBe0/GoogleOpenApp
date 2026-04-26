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

function formatDate(start: CalendarEvent["start"]): { date: string; time: string } {
  const raw = start.dateTime || start.date;
  if (!raw) return { date: "Sin fecha", time: "" };
  const d = new Date(raw);
  const date = d.toLocaleDateString("es-ES", { weekday: "short", month: "short", day: "numeric" });
  const time = start.dateTime
    ? d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    : "Todo el día";
  return { date, time };
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
      <div className="flex items-center gap-3 mb-6">
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
        <div className="space-y-3">
          {events.map((event, i) => {
            const { date, time } = formatDate(event.start);
            const colorClass = COLOR_CLASSES[i % COLOR_CLASSES.length];
            return (
              <a
                key={event.id}
                href={event.htmlLink || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
              >
                <div className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold text-center min-w-[64px] ${colorClass}`}>
                  <div>{date.split(" ")[1]}</div>
                  <div className="text-[10px] font-normal opacity-70">{date.split(" ")[0]}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate group-hover:text-indigo-700 transition-colors">
                    {event.summary || "(Sin título)"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{time}</p>
                  {event.location && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">📍 {event.location}</p>
                  )}
                </div>
                <svg className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 flex-shrink-0 mt-0.5 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
