"use client";

import { useCallback, useEffect, useState } from "react";

interface Slot {
  label: string;
  startsAt: string;
}

interface Props {
  appointmentId: string;
  psychologistId: string;
  /** Horario actual, para que se vea de dónde se está moviendo el turno. */
  currentDate: string;
  onClose: () => void;
  onDone: () => void;
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const WEEKDAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function RescheduleModal({
  appointmentId,
  psychologistId,
  currentDate,
  onClose,
  onDone,
}: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<{ y: number; m: number; d: number } | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [openWeekdays, setOpenWeekdays] = useState<number[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/availability?psychologistId=${psychologistId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.rules) return;
        setOpenWeekdays([...new Set((data.rules as { weekday: number }[]).map((r) => r.weekday))]);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [psychologistId]);

  const loadSlots = useCallback(
    async (y: number, m: number, d: number) => {
      setLoadingSlots(true);
      setSlots([]);
      setError("");
      try {
        const res = await fetch(
          `/api/appointments/available-slots?psychologistId=${psychologistId}&year=${y}&month=${m}&day=${d}`
        );
        const data = await res.json();
        setSlots(data.slots ?? []);
      } catch {
        setError("No se pudieron cargar los horarios.");
      } finally {
        setLoadingSlots(false);
      }
    },
    [psychologistId]
  );

  async function move(startsAt: string) {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: startsAt }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo mover el turno.");
        return;
      }

      onDone();
      onClose();
    } catch {
      setError("Error de conexión.");
    } finally {
      setSaving(false);
    }
  }

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
  const actual = new Date(currentDate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-lg border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Reprogramar turno</h2>
            <p className="text-xs text-muted">
              Ahora: {actual.toLocaleDateString("es-AR", { day: "numeric", month: "long" })} a las{" "}
              {actual.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false })}
            </p>
          </div>
          <button
            onClick={onClose}
            className="min-h-11 rounded-md px-3 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            Cerrar
          </button>
        </div>

        <div className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-ink">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() =>
                  viewMonth === 0
                    ? (setViewMonth(11), setViewYear((y) => y - 1))
                    : setViewMonth((m) => m - 1)
                }
                aria-label="Mes anterior"
                className="h-11 w-11 rounded-md border border-line-strong text-ink transition-colors hover:bg-surface-2"
              >
                ‹
              </button>
              <button
                onClick={() =>
                  viewMonth === 11
                    ? (setViewMonth(0), setViewYear((y) => y + 1))
                    : setViewMonth((m) => m + 1)
                }
                aria-label="Mes siguiente"
                className="h-11 w-11 rounded-md border border-line-strong text-ink transition-colors hover:bg-surface-2"
              >
                ›
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7">
            {WEEKDAYS.map((d) => (
              <div key={d} className="py-1 text-center text-[10px] font-semibold uppercase text-muted">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDow }).map((_, i) => (
              <div key={`e${i}`} />
            ))}
            {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => {
              const date = new Date(viewYear, viewMonth, d);
              const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
              const closed = openWeekdays !== null && !openWeekdays.includes(date.getDay());
              const unavailable = isPast || closed;
              const selected =
                selectedDay?.y === viewYear && selectedDay?.m === viewMonth + 1 && selectedDay?.d === d;

              return (
                <button
                  key={d}
                  disabled={unavailable}
                  title={closed && !isPast ? "No atiende este día" : undefined}
                  onClick={() => {
                    setSelectedDay({ y: viewYear, m: viewMonth + 1, d });
                    loadSlots(viewYear, viewMonth + 1, d);
                  }}
                  className={`aspect-square rounded-md text-sm font-semibold transition-colors ${
                    unavailable
                      ? "cursor-not-allowed text-line-strong"
                      : selected
                        ? "bg-primary text-white"
                        : "text-ink hover:bg-primary-soft hover:text-primary"
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>

          {selectedDay && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-semibold text-ink">Elegí el horario nuevo</h3>
              {loadingSlots ? (
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="h-11 animate-pulse rounded-md bg-surface-2" />
                  ))}
                </div>
              ) : slots.length === 0 ? (
                <p className="text-sm text-muted">No hay horarios libres este día.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {slots.map((s) => (
                    <button
                      key={s.startsAt}
                      disabled={saving}
                      onClick={() => move(s.startsAt)}
                      className="min-h-11 rounded-md border border-line-strong text-sm font-semibold text-ink transition-colors hover:border-primary hover:bg-primary-soft disabled:opacity-50"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <p className="mt-4 rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
