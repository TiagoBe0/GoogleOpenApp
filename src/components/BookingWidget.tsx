"use client";

import { useState } from "react";

interface Props {
  psychologistId: string;
  psychologistName: string;
  fee: number;
  currency: string;
  duration: number;
  acceptsNewPatients: boolean;
}

type Step = "date" | "slot" | "patient" | "confirming";

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function getMaxDateString() {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr: string) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long",
  });
}

export default function BookingWidget({ psychologistId, psychologistName, fee, currency, duration, acceptsNewPatients }: Props) {
  const [step, setStep] = useState<Step>("date");
  const [selectedDate, setSelectedDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [error, setError] = useState("");

  const handleDateChange = async (date: string) => {
    setSelectedDate(date);
    setSelectedSlot("");
    setSlots([]);
    setError("");
    if (!date) return;
    setLoadingSlots(true);
    try {
      // new Date().getTimezoneOffset() returns minutes ahead of UTC (negative for UTC+)
      // We pass it as "minutes behind UTC" so Argentina UTC-3 sends 180
      const tzOffset = new Date().getTimezoneOffset();
      const res = await fetch(
        `/api/appointments/available-slots?psychologistId=${psychologistId}&date=${date}&tzOffset=${tzOffset}`
      );
      const data = await res.json();
      setSlots(data.slots ?? []);
      setStep("slot");
    } catch {
      setError("No se pudo cargar la disponibilidad. Intentá de nuevo.");
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    setStep("patient");
    setError("");
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStep("confirming");

    const [y, m, d] = selectedDate.split("-").map(Number);
    const [hh, mm] = selectedSlot.split(":").map(Number);
    // Build UTC datetime for the selected local date+time
    const scheduledAt = new Date(Date.UTC(y, m - 1, d, hh, mm, 0));

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          psychologistId,
          patientName: form.name,
          patientEmail: form.email,
          patientPhone: form.phone || null,
          scheduledAt: scheduledAt.toISOString(),
          notes: form.notes || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al crear el turno");
        setStep("patient");
        return;
      }

      // Redirect to MercadoPago checkout
      const url: string | undefined =
        process.env.NODE_ENV === "production" ? data.checkoutUrl : (data.sandboxUrl ?? data.checkoutUrl);

      if (!url) {
        setError("No se pudo generar el link de pago. Intentá de nuevo.");
        setStep("patient");
        return;
      }

      window.location.href = url;
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
      setStep("patient");
    }
  };

  if (!acceptsNewPatients) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
        </div>
        <p className="font-semibold text-gray-700">No disponible</p>
        <p className="text-sm text-gray-400 mt-1">Este profesional no está aceptando nuevos pacientes en este momento.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-indigo-600 px-6 py-5">
        <h2 className="font-bold text-white text-lg">Reservar turno</h2>
        <p className="text-indigo-200 text-sm mt-0.5">con {psychologistName}</p>
        {fee > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-indigo-500/50 text-white text-sm px-3 py-1.5 rounded-lg">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" /></svg>
            {currency} {fee.toLocaleString()} · {duration} min
          </div>
        )}
      </div>

      {/* Steps indicator */}
      <div className="flex border-b border-gray-100">
        {(["date", "slot", "patient"] as const).map((s, i) => {
          const labels = ["Fecha", "Horario", "Datos"];
          const done = ["date", "slot", "patient", "confirming"].indexOf(step) > i;
          const active = step === s;
          return (
            <div key={s} className="flex-1 flex flex-col items-center py-3 gap-1">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors
                ${done ? "bg-indigo-600 text-white" : active ? "bg-indigo-100 text-indigo-600 ring-2 ring-indigo-400" : "bg-gray-100 text-gray-400"}`}>
                {done ? "✓" : i + 1}
              </div>
              <span className={`text-[11px] font-medium ${active ? "text-indigo-600" : "text-gray-400"}`}>{labels[i]}</span>
            </div>
          );
        })}
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Step 1 — Date picker */}
        {(step === "date" || step === "slot") && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Elegí una fecha
              </label>
              <input
                type="date"
                value={selectedDate}
                min={getTodayString()}
                max={getMaxDateString()}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Step 2 — Time slots */}
            {selectedDate && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Horarios disponibles — {formatDateLabel(selectedDate)}
                </p>
                {loadingSlots ? (
                  <div className="grid grid-cols-3 gap-2">
                    {[1,2,3,4,5,6].map(i => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">Sin horarios disponibles para este día.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => handleSlotSelect(slot)}
                        className={`py-2.5 rounded-xl text-sm font-medium border transition-all
                          ${selectedSlot === slot
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white text-gray-700 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                          }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 3 — Patient form */}
        {(step === "patient" || step === "confirming") && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Summary */}
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-800">{formatDateLabel(selectedDate)} a las {selectedSlot}</p>
                <p className="text-xs text-indigo-600">{duration} min · {currency} {fee.toLocaleString()}</p>
              </div>
              <button
                type="button"
                onClick={() => { setStep("date"); setSelectedSlot(""); }}
                className="ml-auto text-xs text-indigo-500 hover:text-indigo-700"
              >
                Cambiar
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo <span className="text-red-400">*</span></label>
              <input name="name" type="text" required value={form.name} onChange={handleChange}
                placeholder="Juan Pérez"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-400">*</span></label>
              <input name="email" type="email" required value={form.email} onChange={handleChange}
                placeholder="juan@email.com"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                placeholder="+54 9 11 1234-5678"
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de consulta <span className="text-gray-400 font-normal">(opcional)</span></label>
              <textarea name="notes" value={form.notes} onChange={handleChange} rows={3}
                placeholder="Contanos brevemente por qué buscás atención..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-2">
              <svg className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <p className="text-xs text-amber-700">
                Al continuar serás redirigido a MercadoPago para completar el pago de forma segura. Tu turno se confirma automáticamente al aprobarse el pago.
              </p>
            </div>

            <button
              type="submit"
              disabled={step === "confirming"}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              {step === "confirming" ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Preparando pago...
                </>
              ) : (
                <>
                  Confirmar y pagar {currency} {fee.toLocaleString()}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
