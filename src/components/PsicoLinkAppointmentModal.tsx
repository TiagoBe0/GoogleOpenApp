"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { labelToMinutes, minutesToLabel } from "@/lib/slots";

interface Psychologist {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Props {
  psychologist: Psychologist;
  onClose: () => void;
  onCreated: () => void;
}

/** Horario que ofrece el servidor, con el instante exacto ya resuelto. */
interface Slot {
  label: string;
  startsAt: string;
}

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const WEEK_DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const CALENDAR_DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/**
 * Hora de fin, para mostrar "16:00 - 16:50". Se calcula sobre la etiqueta y no
 * sobre el instante: la etiqueta ya viene en la hora del profesional, y
 * formatear el instante la traduciría a la zona del navegador.
 */
function formatSlotEnd(slot: Slot, duration: number) {
  return minutesToLabel(labelToMinutes(slot.label) + duration);
}

function initials(name: string | null, email: string) {
  if (name) return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);
  return email[0]?.toUpperCase() ?? "P";
}

export default function PsicoLinkAppointmentModal({ psychologist, onClose, onCreated }: Props) {
  const today = startOfDay(new Date());
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [slots, setSlots] = useState<Slot[]>([]);
  const [duration, setDuration] = useState(50);
  const [loadingSlots, setLoadingSlots] = useState(false);
  // null mientras no se sabe: sin eso el calendario apagaría todos los días.
  const [openWeekdays, setOpenWeekdays] = useState<number[] | null>(null);

  // Días en los que el profesional atiende, para no dejar elegir un día cerrado.
  useEffect(() => {
    let cancelled = false;

    fetch(`/api/availability?psychologistId=${psychologist.id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.rules) return;
        setOpenWeekdays([...new Set((data.rules as { weekday: number }[]).map((r) => r.weekday))]);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [psychologist.id]);

  const loadSlots = useCallback(
    async (date: Date) => {
      setLoadingSlots(true);
      setSlots([]);
      try {
        const res = await fetch(
          `/api/appointments/available-slots?psychologistId=${psychologist.id}` +
            `&year=${date.getFullYear()}&month=${date.getMonth() + 1}&day=${date.getDate()}`
        );
        const data = await res.json();
        setSlots(data.slots ?? []);
        if (data.duration) setDuration(data.duration);
      } catch {
        setError("No se pudieron cargar los horarios.");
      } finally {
        setLoadingSlots(false);
      }
    },
    [psychologist.id]
  );

  const calendarCells = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ day: number | null; date: Date | null; past: boolean }> = [];

    for (let i = 0; i < firstDay; i += 1) cells.push({ day: null, date: null, past: false });

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(year, month, day);
      cells.push({ day, date, past: startOfDay(date) < today });
    }

    return cells;
  }, [today, viewDate]);

  const canGoBack = viewDate > new Date(today.getFullYear(), today.getMonth(), 1);
  const dateLabel = selectedDate
    ? `${WEEK_DAYS[selectedDate.getDay()]} ${selectedDate.getDate()} de ${MONTHS[selectedDate.getMonth()].toLowerCase()}`
    : "Seleccioná un día";

  async function handleSubmit() {
    if (!selectedDate || !selectedSlot) return;

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // El instante lo resolvió el servidor al ofrecer el horario.
          date: selectedSlot.startsAt,
          duration,
          notes,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo solicitar el turno");
        return;
      }

      onCreated();
      onClose();
    } catch {
      setError("Error de conexión. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-lg border border-line bg-bg shadow-2xl">
        <div className="flex items-center justify-between border-b border-line bg-surface px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-display text-lg font-semibold text-ink">PsicoLink</p>
              <p className="text-xs text-muted">Agendar turno</p>
            </div>
          </div>
          <button onClick={onClose} className="min-h-11 rounded-md px-3 text-sm font-semibold text-muted hover:bg-surface-2 hover:text-ink transition-colors">
            Cerrar
          </button>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[240px_1fr_220px]">
          <aside className="rounded-lg border border-line bg-surface p-5">
            <div className="mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-sm font-semibold text-primary">
              {psychologist.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={psychologist.image} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(psychologist.name, psychologist.email)
              )}
            </div>
            <h2 className="font-display text-lg font-semibold text-ink">{psychologist.name || "Psicólogo"}</h2>
            <p className="mt-1 text-xs text-muted">{psychologist.email}</p>
            <span className="mt-4 inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              Profesional vinculado
            </span>
            <div className="my-4 h-px bg-line" />
            <div className="rounded-md bg-surface-2 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">Resumen</p>
              {selectedDate && selectedSlot ? (
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-semibold text-ink">{dateLabel}</p>
                  <p className="text-sm font-semibold text-primary">
                    {selectedSlot.label} - {formatSlotEnd(selectedSlot, duration)}
                  </p>
                  <p className="text-xs text-muted">{duration} minutos</p>
                </div>
              ) : (
                <p className="mt-2 text-xs italic text-muted">Elegí fecha y horario para continuar.</p>
              )}
            </div>
          </aside>

          <section className="rounded-lg border border-line bg-surface p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold text-ink">
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                  disabled={!canGoBack}
                  aria-label="Mes anterior"
                  className="h-11 w-11 rounded-md border border-line-strong bg-surface text-ink hover:bg-surface-2 disabled:opacity-30 transition-colors"
                >
                  ‹
                </button>
                <button
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                  aria-label="Mes siguiente"
                  className="h-11 w-11 rounded-md border border-line-strong bg-surface text-ink hover:bg-surface-2 transition-colors"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {CALENDAR_DAYS.map((day) => (
                <div key={day} className="pb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-muted">
                  {day}
                </div>
              ))}
              {calendarCells.map((cell, index) => {
                if (!cell.day || !cell.date) return <div key={`empty-${index}`} className="aspect-square" />;

                const selected = selectedDate && formatDateKey(selectedDate) === formatDateKey(cell.date);
                const isToday = formatDateKey(cell.date) === formatDateKey(today);
                const closed = openWeekdays !== null && !openWeekdays.includes(cell.date.getDay());
                const unavailable = cell.past || closed;

                return (
                  <button
                    key={formatDateKey(cell.date)}
                    type="button"
                    disabled={unavailable}
                    title={closed && !cell.past ? "El profesional no atiende este día" : undefined}
                    onClick={() => {
                      setSelectedDate(cell.date);
                      setSelectedSlot(null);
                      setError("");
                      if (cell.date) loadSlots(cell.date);
                    }}
                    className={`relative flex aspect-square items-center justify-center rounded-md border text-sm font-semibold transition-colors ${
                      selected
                        ? "border-primary bg-primary text-white"
                        : unavailable
                          ? "border-transparent text-line-strong"
                          : "border-transparent bg-surface-2 text-ink hover:border-primary hover:bg-primary-soft"
                    } ${isToday && !selected ? "border-primary" : ""}`}
                  >
                    {cell.day}
                    {!unavailable && <span className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${selected ? "bg-white/70" : "bg-primary"}`} />}
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="rounded-lg border border-line bg-surface">
            <div className="border-b border-line px-4 py-4">
              <h2 className="font-display text-base font-semibold text-ink">Horarios</h2>
              <p className="text-xs text-muted">{dateLabel}</p>
            </div>
            <div className="max-h-[420px] space-y-2 overflow-y-auto p-3">
              {!selectedDate ? (
                <p className="px-3 py-10 text-center text-sm leading-6 text-muted">Seleccioná un día para ver los horarios disponibles.</p>
              ) : loadingSlots ? (
                [...Array(5)].map((_, i) => <div key={i} className="h-14 animate-pulse rounded-md bg-surface-2" />)
              ) : slots.length === 0 ? (
                <p className="px-3 py-10 text-center text-sm leading-6 text-muted">No quedan horarios libres este día.</p>
              ) : (
                slots.map((slot) => {
                  const selected = selectedSlot?.startsAt === slot.startsAt;
                  return (
                    <button
                      key={slot.startsAt}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(slot);
                        setError("");
                      }}
                      className={`w-full min-h-11 rounded-md border px-3 py-3 text-left transition-colors ${
                        selected ? "border-primary bg-primary-soft" : "border-line bg-surface-2 hover:border-primary hover:bg-primary-soft"
                      }`}
                    >
                      <span className="text-sm font-semibold text-ink">
                        {slot.label} - {formatSlotEnd(slot, duration)}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        </div>

        <div className="border-t border-line bg-surface px-5 py-4">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-end">
            <label className="flex-1">
              <span className="mb-1 block text-xs font-semibold text-ink">Motivo o comentario opcional</span>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: seguimiento, primera consulta…"
                className="w-full resize-none rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
              />
            </label>
            <div className="min-w-60">
              {error && <p className="mb-2 rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger">{error}</p>}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedDate || !selectedSlot || loading}
                className="w-full min-h-11 rounded-md bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-hi disabled:bg-surface-2 disabled:text-muted"
              >
                {loading ? "Solicitando…" : "Solicitar turno"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
