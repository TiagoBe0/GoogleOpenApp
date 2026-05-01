"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";

interface Psychologist {
  name: string | null;
  email: string;
  image: string | null;
  sessionDuration: number;
  cbu: string | null;
  alias: string | null;
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
  mode: "online";
}

const MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const WEEK_DAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const CALENDAR_DAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

function buildSlots(durationMin: number): Slot[] {
  const slots: Slot[] = [];
  let totalMin = 9 * 60;
  const endMin = 19 * 60;
  while (totalMin + durationMin <= endMin) {
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    const id = `${String(h).padStart(2, "0")}-${String(m).padStart(2, "0")}`;
    const label = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    slots.push({ id, label, hour: h, minute: m, duration: durationMin, mode: "online" });
    totalMin += durationMin;
  }
  return slots;
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatSlotEnd(slot: Slot): string {
  const totalMin = slot.hour * 60 + slot.minute + slot.duration;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

function initials(name: string | null, email: string) {
  if (name) return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);
  return email[0]?.toUpperCase() ?? "P";
}

export default function PsicoLinkAppointmentModal({ psychologist, onClose, onCreated }: Props) {
  const today = startOfDay(new Date());
  const slots = useMemo(() => buildSlots(psychologist.sessionDuration || 50), [psychologist.sessionDuration]);

  const [step, setStep] = useState<1 | 2>(1);
  const [viewDate, setViewDate] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [notes, setNotes] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setProofFile(file);
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setProofPreview(url);
    } else {
      setProofPreview(null);
    }
  }

  async function handleSubmit() {
    if (!selectedDate || !selectedSlot) return;
    setLoading(true);
    setError("");

    try {
      let paymentProofUrl: string | null = null;

      if (proofFile) {
        const fd = new FormData();
        fd.append("file", proofFile);
        const upRes = await fetch("/api/upload", { method: "POST", body: fd });
        const upData = await upRes.json();
        if (!upRes.ok) {
          setError(upData.error ?? "Error al subir el comprobante");
          return;
        }
        paymentProofUrl = upData.url;
      }

      const date = new Date(selectedDate);
      date.setHours(selectedSlot.hour, selectedSlot.minute, 0, 0);

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: date.toISOString(),
          duration: selectedSlot.duration,
          notes,
          paymentProofUrl,
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

  const hasBankInfo = !!(psychologist.cbu || psychologist.alias);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-[#F4F6FA] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <Image src="/logo_final.png" alt="Mi Terapia" width={38} height={38} className="h-[38px] w-[38px] rounded-lg object-cover" />
            <div>
              <p className="font-serif text-lg text-[#2D4270]">Mi Terapia</p>
              <p className="text-xs text-[#8A96A8]">
                {step === 1 ? "Elegí fecha y horario" : "Confirmá tu pago"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Step indicator */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-[#8A96A8]">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${step === 1 ? "bg-[#2D4270] text-white" : "bg-[#D0E8D8] text-[#557C5F]"}`}>1</span>
              <span>Turno</span>
              <span className="mx-1 text-[#D8E2EE]">›</span>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${step === 2 ? "bg-[#2D4270] text-white" : "bg-[#E2E8F0] text-[#8A96A8]"}`}>2</span>
              <span>Pago</span>
            </div>
            <button onClick={onClose} className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100">
              Cerrar
            </button>
          </div>
        </div>

        {/* ── STEP 1: date + slot picker ── */}
        {step === 1 && (
          <>
            <div className="grid gap-4 p-5 lg:grid-cols-[240px_1fr_220px]">
              {/* Psychologist info */}
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
                        {selectedSlot.label} — {formatSlotEnd(selectedSlot)}
                      </p>
                      <p className="text-xs text-[#8A96A8]">{formatDuration(selectedSlot.duration)}</p>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs italic text-[#8A96A8]">Elegí fecha y horario para continuar.</p>
                  )}
                </div>
              </aside>

              {/* Calendar */}
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
                    >‹</button>
                    <button
                      onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))}
                      className="h-9 w-9 rounded-lg border border-[#E2E8F0] bg-[#F4F6FA] text-[#2D4270]"
                    >›</button>
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
                        onClick={() => { setSelectedDate(cell.date); setSelectedSlot(null); setError(""); }}
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

              {/* Slot list */}
              <aside className="rounded-2xl border border-[#E2E8F0] bg-white">
                <div className="border-b border-[#E2E8F0] px-4 py-4">
                  <h2 className="font-serif text-base text-[#2D4270]">Horarios</h2>
                  <p className="text-xs text-[#8A96A8]">{dateLabel}</p>
                </div>
                <div className="max-h-[420px] space-y-2 overflow-y-auto p-3">
                  {!selectedDate ? (
                    <p className="px-3 py-10 text-center text-sm leading-6 text-[#8A96A8]">
                      Seleccioná un día para ver los horarios disponibles.
                    </p>
                  ) : (
                    slots.map((slot) => {
                      const selected = selectedSlot?.id === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => { setSelectedSlot(slot); setError(""); }}
                          className={`w-full rounded-xl border px-3 py-3 text-left transition-colors ${
                            selected ? "border-[#2D4270] bg-[#EEF2FA]" : "border-[#E2E8F0] bg-[#F4F6FA] hover:border-[#8AACC8] hover:bg-[#D8EAF7]"
                          }`}
                        >
                          <span className="text-sm font-semibold text-[#2D4270]">
                            {slot.label} — {formatSlotEnd(slot)}
                          </span>
                          <p className="mt-1 text-[11px] text-[#8A96A8]">{formatDuration(slot.duration)}</p>
                        </button>
                      );
                    })
                  )}
                </div>
              </aside>
            </div>

            {/* Step 1 footer */}
            <div className="border-t border-[#E2E8F0] bg-white px-5 py-4">
              <div className="mx-auto flex max-w-5xl items-center justify-end gap-3">
                {error && <p className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
                <button
                  type="button"
                  onClick={() => { setError(""); setStep(2); }}
                  disabled={!selectedDate || !selectedSlot}
                  className="rounded-xl bg-[#2D4270] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-[#1F3060] disabled:bg-slate-200 disabled:text-slate-400"
                >
                  Continuar →
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── STEP 2: payment proof ── */}
        {step === 2 && (
          <>
            <div className="grid gap-4 p-5 lg:grid-cols-[1fr_1fr]">

              {/* Selected appointment summary + bank info */}
              <div className="space-y-4">
                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8A96A8] mb-3">Turno seleccionado</p>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#D8EAF7] text-sm font-semibold text-[#2D4270] flex-shrink-0">
                      {psychologist.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={psychologist.image} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials(psychologist.name, psychologist.email)
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-[#2D4270]">{psychologist.name || "Psicólogo"}</p>
                      <p className="text-xs text-[#8A96A8]">
                        {dateLabel} · {selectedSlot?.label} — {selectedSlot ? formatSlotEnd(selectedSlot) : ""}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="mt-3 text-xs text-[#8AACC8] hover:underline"
                  >
                    ← Cambiar fecha u horario
                  </button>
                </div>

                {/* Bank details */}
                {hasBankInfo ? (
                  <div className="rounded-2xl border border-[#D0E8D8] bg-[#F2FAF4] p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <svg className="w-4 h-4 text-[#557C5F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      <p className="text-xs font-semibold uppercase tracking-wide text-[#557C5F]">Datos bancarios</p>
                    </div>
                    <p className="text-xs text-[#6B7280] mb-3">
                      Realizá la transferencia y adjuntá el comprobante para confirmar tu turno.
                    </p>
                    {psychologist.cbu && (
                      <div className="mb-2">
                        <p className="text-[10px] font-semibold text-[#8A96A8] uppercase tracking-wide">CBU</p>
                        <p className="font-mono text-sm font-semibold text-[#2D4270] mt-0.5 break-all select-all">{psychologist.cbu}</p>
                      </div>
                    )}
                    {psychologist.alias && (
                      <div>
                        <p className="text-[10px] font-semibold text-[#8A96A8] uppercase tracking-wide">Alias</p>
                        <p className="font-mono text-sm font-semibold text-[#2D4270] mt-0.5 select-all">{psychologist.alias}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
                    <p className="text-sm text-[#8A96A8] text-center">
                      El psicólogo coordinará el pago por separado.
                    </p>
                  </div>
                )}
              </div>

              {/* Proof upload + notes */}
              <div className="space-y-4">
                {hasBankInfo && (
                  <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8A96A8] mb-3">
                      Comprobante de pago <span className="normal-case font-normal text-[#B0BEC5]">(opcional)</span>
                    </p>

                    {proofPreview ? (
                      <div className="relative mb-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={proofPreview} alt="Vista previa" className="w-full rounded-xl object-contain max-h-48 border border-[#E2E8F0]" />
                        <button
                          type="button"
                          onClick={() => { setProofFile(null); setProofPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                          className="absolute top-2 right-2 rounded-full bg-white/90 p-1 text-xs text-slate-500 hover:bg-white shadow"
                        >✕</button>
                      </div>
                    ) : proofFile ? (
                      <div className="mb-3 flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F4F6FA] px-4 py-3">
                        <svg className="w-5 h-5 text-[#8AACC8] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm text-[#2D4270] truncate flex-1">{proofFile.name}</span>
                        <button
                          type="button"
                          onClick={() => { setProofFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                          className="text-xs text-slate-400 hover:text-red-500"
                        >✕</button>
                      </div>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-xl border-2 border-dashed border-[#D0DBF0] bg-[#F4F6FA] px-4 py-6 text-center text-sm text-[#8A96A8] hover:border-[#8AACC8] hover:bg-[#EEF2FA] transition-colors"
                    >
                      <svg className="mx-auto mb-2 w-6 h-6 text-[#8AACC8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {proofFile ? "Cambiar archivo" : "Subir comprobante (JPG, PNG o PDF, máx 10 MB)"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,application/pdf"
                      className="hidden"
                      onChange={handleFileChange}
                    />
                  </div>
                )}

                <div className="rounded-2xl border border-[#E2E8F0] bg-white p-5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-[#8A96A8] mb-2">
                    Motivo o comentario <span className="normal-case font-normal text-[#B0BEC5]">(opcional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: primera consulta, seguimiento..."
                    className="w-full resize-none rounded-xl border border-[#E2E8F0] px-3 py-2 text-sm text-slate-900 focus:border-[#8AACC8] focus:outline-none focus:ring-2 focus:ring-[#8AACC8]/20"
                  />
                </div>
              </div>
            </div>

            {/* Step 2 footer */}
            <div className="border-t border-[#E2E8F0] bg-white px-5 py-4">
              <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                {error && <p className="flex-1 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl border border-[#E2E8F0] px-5 py-3 text-sm font-semibold text-[#8A96A8] hover:bg-slate-50"
                >
                  ← Volver
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="rounded-xl bg-[#2D4270] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-200 transition hover:bg-[#1F3060] disabled:bg-slate-200 disabled:text-slate-400"
                >
                  {loading ? "Enviando..." : "Solicitar turno"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
