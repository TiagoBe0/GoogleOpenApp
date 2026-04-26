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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-[#F4F6FA] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 grid-cols-2 gap-0.5">
              <span className="rounded-[3px] bg-[#2D4270]" />
              <span className="rounded-[3px] bg-[#8AACC8]" />
              <span className="rounded-[3px] bg-[#7FA98A]" />
              <span className="rounded-[3px] bg-[#D8EAF7]" />
            </div>
            <div>
              <p className="font-serif text-lg text-[#2D4270]">PsicoLink</p>
              <p className="text-xs text-[#8A96A8]">Agendar turno</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100">
            Cerrar
          </button>
        </div>

        <div className="grid gap-4 p-5 lg:grid-cols-[240px_1fr_220px]">
          <aside className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
            <div className="mb-3 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#D8EAF7] text-sm font-semibold text-[#2D4270]">
              {psychologist.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={psychologist.image} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(psychologist.name, psychologist.email)
              )}
            </div>
            <h2 className="font-serif text-lg text-[#2D4270]">{psychologist.name || "Psicólogo"}</h2>
            <p className="mt-1 text-xs text-[#8A96A8]">{psychologist.email}</p>
            <span className="mt-4 inline-flex rounded-full bg-[#D0E8D8] px-3 py-1 text-xs font-semibold text-[#557C5F]">
              Profesional vinculado
            </span>
            <div className="my-4 h-px bg-[#E2E8F0]" />
            <div className="rounded-xl bg-[#F4F6FA] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8A96A8]">Resumen</p>
              {selectedDate && selectedSlot ? (
                <div className="mt-2 space-y-1">
                  <p className="text-sm font-semibold text-[#2D4270]">{dateLabel}</p>
                  <p className="text-sm font-semibold text-[#8AACC8]">
                    {selectedSlot.label} - {formatSlotEnd(selectedSlot)}
                  </p>
                  <p className="text-xs text-[#8A96A8]">{selectedSlot.mode === "online" ? "Online" : "Presencial"}</p>
                </div>
              ) : (
                <p className="mt-2 text-xs italic text-[#8A96A8]">Elegí fecha y horario para continuar.</p>
              )}
            </div>
          </aside>

          <section className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="font-serif text-2xl text-[#2D4270]">
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))}
                  disabled={!canGoBack}
                  className="h-9 w-9 rounded-lg border border-[#E2E8F0] bg-[#F4F6FA] text-[#2D4270] disabled:opacity-30"
                >
                  ‹
                </button>
                <button
                  onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                  className="h-9 w-9 rounded-lg border border-[#E2E8F0] bg-[#F4F6FA] text-[#2D4270]"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {CALENDAR_DAYS.map((day) => (
                <div key={day} className="pb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-[#8A96A8]">
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
                    className={`relative flex aspect-square items-center justify-center rounded-xl border-2 text-sm font-medium transition-colors ${
                      selected
                        ? "border-[#2D4270] bg-[#2D4270] text-white"
                        : cell.past
                          ? "border-transparent text-slate-200"
                          : "border-transparent bg-[#F4F6FA] text-[#2D4270] hover:border-[#8AACC8] hover:bg-[#D8EAF7]"
                    } ${isToday && !selected ? "border-[#8AACC8]" : ""}`}
                  >
                    {cell.day}
                    {!cell.past && <span className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${selected ? "bg-white/70" : "bg-[#7FA98A]"}`} />}
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="rounded-2xl border border-[#E2E8F0] bg-white">
            <div className="border-b border-[#E2E8F0] px-4 py-4">
              <h2 className="font-serif text-base text-[#2D4270]">Horarios</h2>
              <p className="text-xs text-[#8A96A8]">{dateLabel}</p>
            </div>
            <div className="max-h-[420px] space-y-2 overflow-y-auto p-3">
              {!selectedDate ? (
                <p className="px-3 py-10 text-center text-sm leading-6 text-[#8A96A8]">Seleccioná un día para ver los horarios disponibles.</p>
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
                      className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                        selected ? "border-[#2D4270] bg-[#EEF2FA]" : "border-[#E2E8F0] bg-[#F4F6FA] hover:border-[#8AACC8] hover:bg-[#D8EAF7]"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-[#2D4270]">
                          {slot.label} - {formatSlotEnd(slot)}
                        </span>
                      </div>
                      <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${slot.mode === "online" ? "bg-[#D0E8D8] text-[#557C5F]" : "bg-[#D8EAF7] text-[#567A98]"}`}>
                        {slot.mode === "online" ? "Online" : "Presencial"}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        </div>

        <div className="border-t border-[#E2E8F0] bg-white px-5 py-4">
          <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-end">
            <label className="flex-1">
              <span className="mb-1 block text-xs font-semibold text-[#1C2940]">Motivo o comentario opcional</span>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: seguimiento, primera consulta..."
                className="w-full resize-none rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm text-slate-900 focus:border-[#8AACC8] focus:outline-none focus:ring-2 focus:ring-[#8AACC8]/20"
              />
            </label>
            <div className="min-w-60">
              {error && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedDate || !selectedSlot || loading}
                className="w-full rounded-xl bg-[#2D4270] px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-[#1F3060] disabled:bg-slate-200 disabled:text-slate-400"
              >
                {loading ? "Solicitando..." : "Solicitar turno"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
