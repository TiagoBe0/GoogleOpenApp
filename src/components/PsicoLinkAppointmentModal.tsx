"use client";

import { useMemo, useState } from "react";

interface Psychologist {
  name: string | null;
  email: string;
  image: string | null;
}

interface Props {
  psychologist: Psychologist;
  onClose: () => void;
  onCreated: () => void;
}

interface Slot {
  id: string;
  label: string;
  hour: number;
  minute: number;
  duration: number;
  mode: "online" | "presencial";
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

const SLOTS: Slot[] = [
  { id: "09-00", label: "09:00", hour: 9, minute: 0, duration: 50, mode: "online" },
  { id: "10-00", label: "10:00", hour: 10, minute: 0, duration: 50, mode: "presencial" },
  { id: "11-30", label: "11:30", hour: 11, minute: 30, duration: 50, mode: "online" },
  { id: "15-00", label: "15:00", hour: 15, minute: 0, duration: 50, mode: "presencial" },
  { id: "16-30", label: "16:30", hour: 16, minute: 30, duration: 50, mode: "online" },
  { id: "18-00", label: "18:00", hour: 18, minute: 0, duration: 50, mode: "online" },
];

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatSlotEnd(slot: Slot) {
  const end = new Date();
  end.setHours(slot.hour, slot.minute + slot.duration, 0, 0);
  return end.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
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

    const date = new Date(selectedDate);
    date.setHours(selectedSlot.hour, selectedSlot.minute, 0, 0);
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: date.toISOString(),
          duration: selectedSlot.duration,
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
                    {selectedSlot.label} - {formatSlotEnd(selectedSlot)}
                  </p>
                  <p className="text-xs text-muted">{selectedSlot.mode === "online" ? "Online" : "Presencial"}</p>
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

                return (
                  <button
                    key={formatDateKey(cell.date)}
                    type="button"
                    disabled={cell.past}
                    onClick={() => {
                      setSelectedDate(cell.date);
                      setSelectedSlot(null);
                      setError("");
                    }}
                    className={`relative flex aspect-square items-center justify-center rounded-md border text-sm font-semibold transition-colors ${
                      selected
                        ? "border-primary bg-primary text-white"
                        : cell.past
                          ? "border-transparent text-line-strong"
                          : "border-transparent bg-surface-2 text-ink hover:border-primary hover:bg-primary-soft"
                    } ${isToday && !selected ? "border-primary" : ""}`}
                  >
                    {cell.day}
                    {!cell.past && <span className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${selected ? "bg-white/70" : "bg-primary"}`} />}
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
              ) : (
                SLOTS.map((slot) => {
                  const selected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(slot);
                        setError("");
                      }}
                      className={`w-full min-h-11 rounded-md border px-3 py-3 text-left transition-colors ${
                        selected ? "border-primary bg-primary-soft" : "border-line bg-surface-2 hover:border-primary hover:bg-primary-soft"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-ink">
                          {slot.label} - {formatSlotEnd(slot)}
                        </span>
                      </div>
                      <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${slot.mode === "online" ? "bg-primary-soft text-primary" : "bg-info/10 text-info"}`}>
                        {slot.mode === "online" ? "Online" : "Presencial"}
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
