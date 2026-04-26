"use client";

import { useState } from "react";

interface Profile {
  sessionDuration: number;
  consultationFee: number | null;
  currency: string;
}

interface Props {
  psychologistId: string;
  profile: Profile;
  isRegistered?: boolean;
}

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const WEEKDAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function BookingWidget({ psychologistId, profile, isRegistered = false }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<{ y: number; m: number; d: number } | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = daysInMonth(viewYear, viewMonth);

  async function selectDay(d: number) {
    const sel = { y: viewYear, m: viewMonth + 1, d };
    setSelectedDate(sel);
    setSelectedSlot(null);
    setSlots([]);
    setLoadingSlots(true);
    setError(null);

    const tzOffset = new Date().getTimezoneOffset();
    try {
      const res = await fetch(
        `/api/appointments/available-slots?psychologistId=${psychologistId}&year=${sel.y}&month=${sel.m}&day=${sel.d}&tzOffset=${tzOffset}`
      );
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setError("No se pudieron cargar los horarios.");
    } finally {
      setLoadingSlots(false);
    }
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  async function handleBook() {
    if (!selectedDate || !selectedSlot) return;
    if (!isRegistered && (!patientName.trim() || !patientEmail.trim())) {
      setError("Nombre y email son requeridos.");
      return;
    }

    setSubmitting(true);
    setError(null);

    const [h, min] = selectedSlot.split(":").map(Number);
    const tzOffset = new Date().getTimezoneOffset();
    const localMs = Date.UTC(selectedDate.y, selectedDate.m - 1, selectedDate.d, h, min + tzOffset, 0, 0);
    const date = new Date(localMs).toISOString();

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          psychologistId,
          notes: notes || undefined,
          ...(!isRegistered && { patientName, patientEmail, patientPhone }),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al agendar el turno.");
        return;
      }

      // Redirect to MercadoPago if available
      const url: string | undefined =
        process.env.NODE_ENV === "production" ? data.checkoutUrl : (data.sandboxUrl ?? data.checkoutUrl);

      if (url) {
        window.location.href = url;
        return;
      }

      setDone(true);
    } catch {
      setError("Ocurrió un error. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-[#7FA98A]/40 bg-[#7FA98A]/10 p-8 text-center">
        <div className="w-14 h-14 bg-[#7FA98A] rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-[#2D4270]">¡Turno solicitado!</h3>
        <p className="text-sm text-[#2D4270]/70 mt-1">El psicólogo confirmará tu turno a la brevedad.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4 text-[#2D4270]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-[#2D4270] capitalize">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4 text-[#2D4270]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-medium text-gray-400 uppercase py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => {
            const date = new Date(viewYear, viewMonth, d);
            const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isSel = selectedDate?.y === viewYear && selectedDate?.m === viewMonth + 1 && selectedDate?.d === d;

            return (
              <button
                key={d}
                disabled={isPast || isWeekend}
                onClick={() => selectDay(d)}
                className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                  isPast || isWeekend
                    ? "text-gray-300 cursor-not-allowed"
                    : isSel
                    ? "bg-[#2D4270] text-white"
                    : "text-[#2D4270] hover:bg-[#8AACC8]/20"
                }`}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-[#2D4270] mb-3">
            Horarios disponibles — {selectedDate.d}/{selectedDate.m}/{selectedDate.y}
          </h3>
          {loadingSlots ? (
            <div className="grid grid-cols-4 gap-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-9 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-gray-400">No hay horarios disponibles para este día.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSlot(s)}
                  className={`py-2 rounded-lg text-sm font-medium transition-all border ${
                    selectedSlot === s
                      ? "bg-[#2D4270] text-white border-[#2D4270]"
                      : "border-[#8AACC8]/40 text-[#2D4270] hover:bg-[#8AACC8]/20"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contact form (anonymous only) + notes */}
      {selectedSlot && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          {!isRegistered && (
            <>
              <h3 className="text-sm font-semibold text-[#2D4270]">Tus datos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nombre *</label>
                  <input
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#2D4270] focus:outline-none focus:ring-2 focus:ring-[#8AACC8]/40"
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Email *</label>
                  <input
                    type="email"
                    value={patientEmail}
                    onChange={e => setPatientEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#2D4270] focus:outline-none focus:ring-2 focus:ring-[#8AACC8]/40"
                    placeholder="tu@email.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Teléfono (opcional)</label>
                  <input
                    value={patientPhone}
                    onChange={e => setPatientPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#2D4270] focus:outline-none focus:ring-2 focus:ring-[#8AACC8]/40"
                    placeholder="+54 9 11 1234 5678"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-[#2D4270] focus:outline-none focus:ring-2 focus:ring-[#8AACC8]/40 resize-none"
              placeholder="Motivo de la consulta, información adicional..."
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          {profile.consultationFee && (
            <div className="flex items-center justify-between text-sm rounded-lg bg-[#2D4270]/5 px-4 py-3">
              <span className="text-[#2D4270]/70">Valor de la consulta</span>
              <span className="font-semibold text-[#2D4270]">
                {profile.currency} {profile.consultationFee.toLocaleString("es-AR")}
              </span>
            </div>
          )}

          <button
            onClick={handleBook}
            disabled={submitting}
            className="w-full py-3 bg-[#2D4270] hover:bg-[#2D4270]/90 disabled:bg-[#2D4270]/50 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            {submitting ? "Procesando..." : profile.consultationFee ? "Confirmar y pagar" : "Solicitar turno"}
          </button>
        </div>
      )}
    </div>
  );
}
