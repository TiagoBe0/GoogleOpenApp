"use client";

import { useEffect, useState, useCallback } from "react";

interface DayAvailability {
  date: string;
  isWeekend: boolean;
  availableSlots: string[];
  bookedCount: number;
  googleEventsCount: number;
}

const DAYS_ES = ["Lun", "Mar", "Mié", "Jue", "Vie"];

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

export default function AvailabilityPanel() {
  const [days, setDays] = useState<DayAvailability[]>([]);
  const [sessionDuration, setSessionDuration] = useState(50);
  const [loading, setLoading] = useState(true);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()));

  const fetchAvailability = useCallback(async () => {
    setLoading(true);
    setExpandedDay(null);
    try {
      const res = await fetch(`/api/calendar/availability?weekStart=${weekStart.toISOString()}`);
      if (res.ok) {
        const data = await res.json();
        setDays((data.days as DayAvailability[]).filter((d) => !d.isWeekend));
        setSessionDuration(data.sessionDuration);
      }
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  const weekEnd = addDays(weekStart, 4);
  const weekLabel = weekStart.toLocaleDateString("es-AR", { day: "numeric", month: "short" }) +
    " – " +
    weekEnd.toLocaleDateString("es-AR", { day: "numeric", month: "short" });

  const totalAvailable = days.reduce((acc, d) => acc + d.availableSlots.length, 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Disponibilidad</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Sesiones de {sessionDuration} min · 8:00–20:00
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!loading && (
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
              totalAvailable > 0
                ? "bg-emerald-50 text-emerald-700"
                : "bg-gray-100 text-gray-500"
            }`}>
              {totalAvailable} slot{totalAvailable !== 1 ? "s" : ""} libres
            </span>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setWeekStart(addDays(weekStart, -7))}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Semana anterior"
            >
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-xs text-gray-500 font-medium w-24 text-center capitalize">
              {weekLabel}
            </span>
            <button
              onClick={() => setWeekStart(addDays(weekStart, 7))}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Semana siguiente"
            >
              <svg className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            {/* Day cards */}
            <div className="grid grid-cols-5 gap-2">
              {days.map((day, i) => {
                const isExpanded = expandedDay === day.date;
                const hasSlots = day.availableSlots.length > 0;
                const dayDate = new Date(day.date + "T12:00:00");
                const isToday =
                  dayDate.toDateString() === new Date().toDateString();

                return (
                  <button
                    key={day.date}
                    onClick={() => hasSlots && setExpandedDay(isExpanded ? null : day.date)}
                    disabled={!hasSlots}
                    className={`rounded-xl p-2.5 text-center transition-all ${
                      isExpanded
                        ? "bg-emerald-600 text-white shadow-sm shadow-emerald-200"
                        : hasSlots
                        ? "bg-emerald-50 hover:bg-emerald-100 border border-emerald-200"
                        : "bg-gray-50 border border-gray-100 cursor-default"
                    }`}
                  >
                    <p className={`text-[11px] font-semibold uppercase tracking-wide ${
                      isExpanded ? "text-white/80" : isToday ? "text-indigo-600" : hasSlots ? "text-emerald-700" : "text-gray-400"
                    }`}>
                      {DAYS_ES[i]}
                    </p>
                    <p className={`text-xl font-bold mt-0.5 ${
                      isExpanded ? "text-white" : isToday ? "text-indigo-700" : hasSlots ? "text-emerald-700" : "text-gray-300"
                    }`}>
                      {dayDate.getDate()}
                    </p>
                    <p className={`text-[11px] mt-1 font-medium ${
                      isExpanded ? "text-white/80" : hasSlots ? "text-emerald-600" : "text-gray-400"
                    }`}>
                      {hasSlots
                        ? `${day.availableSlots.length} libre${day.availableSlots.length !== 1 ? "s" : ""}`
                        : day.bookedCount > 0
                        ? "Completo"
                        : "Sin agenda"}
                    </p>
                    {day.bookedCount > 0 && (
                      <p className={`text-[10px] mt-0.5 ${isExpanded ? "text-white/60" : "text-gray-400"}`}>
                        {day.bookedCount} reservado{day.bookedCount !== 1 ? "s" : ""}
                      </p>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Expanded slot list */}
            {expandedDay && (() => {
              const day = days.find((d) => d.date === expandedDay);
              if (!day || day.availableSlots.length === 0) return null;
              const dateObj = new Date(day.date + "T12:00:00");
              return (
                <div className="mt-3 p-3.5 bg-gray-50 rounded-xl">
                  <p className="text-xs font-semibold text-gray-700 capitalize mb-2.5">
                    {dateObj.toLocaleDateString("es-AR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {day.availableSlots.map((slot) => (
                      <span
                        key={slot}
                        className="text-xs font-semibold bg-white border border-emerald-200 text-emerald-700 px-2.5 py-1 rounded-lg shadow-sm"
                      >
                        {slot}
                      </span>
                    ))}
                  </div>
                  {(day.bookedCount > 0 || day.googleEventsCount > 0) && (
                    <p className="text-[11px] text-gray-400 mt-2.5 flex items-center gap-1">
                      {day.bookedCount > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                          {day.bookedCount} turno{day.bookedCount !== 1 ? "s" : ""} reservado{day.bookedCount !== 1 ? "s" : ""}
                        </span>
                      )}
                      {day.bookedCount > 0 && day.googleEventsCount > 0 && <span>·</span>}
                      {day.googleEventsCount > 0 && (
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
                          {day.googleEventsCount} evento{day.googleEventsCount !== 1 ? "s" : ""} de Google Cal
                        </span>
                      )}
                    </p>
                  )}
                </div>
              );
            })()}
          </>
        )}
      </div>
    </div>
  );
}
