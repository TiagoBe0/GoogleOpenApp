"use client";

import { useEffect, useState } from "react";

interface Profile {
  sessionDuration: number;
  consultationFee: number | null;
  currency: string;
}

/** Horario que ofrece el servidor, con el instante exacto ya resuelto. */
interface Slot {
  label: string;
  startsAt: string;
}

interface Props {
  psychologistId: string;
  profile: Profile;
  isRegistered?: boolean;
}

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const WEEKDAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const inputCls =
  "min-h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-soft";

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export default function BookingWidget({ psychologistId, profile, isRegistered = false }: Props) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<{ y: number; m: number; d: number } | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  // null mientras no se sabe: sin eso el calendario apagaría todos los días.
  const [openWeekdays, setOpenWeekdays] = useState<number[] | null>(null);
  const [notes, setNotes] = useState("");
  const [patientName, setPatientName] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const firstDow = new Date(viewYear, viewMonth, 1).getDay();
  const totalDays = daysInMonth(viewYear, viewMonth);

  // Días en los que el profesional atiende, para no ofrecer un día cerrado.
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

  async function selectDay(d: number) {
    const sel = { y: viewYear, m: viewMonth + 1, d };
    setSelectedDate(sel);
    setSelectedSlot(null);
    setSlots([]);
    setLoadingSlots(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/appointments/available-slots?psychologistId=${psychologistId}&year=${sel.y}&month=${sel.m}&day=${sel.d}`
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

    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // El instante lo resolvió el servidor al ofrecer el horario.
          date: selectedSlot.startsAt,
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
      <div className="rounded-lg border border-primary bg-primary-soft p-8">
        <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mb-4">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-2xl font-semibold text-ink">Turno solicitado</h3>
        <p className="text-sm text-muted mt-1">El psicólogo confirmará tu turno a la brevedad.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="bg-surface rounded-lg border border-line p-5">
        <div className="flex items-center justify-between mb-4">
          <button onClick={prevMonth} aria-label="Mes anterior" className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-surface-2 transition-colors">
            <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-ink capitalize">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button onClick={nextMonth} aria-label="Mes siguiente" className="flex h-11 w-11 items-center justify-center rounded-md hover:bg-surface-2 transition-colors">
            <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-7 mb-2">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-muted uppercase py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: totalDays }, (_, i) => i + 1).map((d) => {
            const date = new Date(viewYear, viewMonth, d);
            const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const isClosed = openWeekdays !== null && !openWeekdays.includes(date.getDay());
            const unavailable = isPast || isClosed;
            const isSel = selectedDate?.y === viewYear && selectedDate?.m === viewMonth + 1 && selectedDate?.d === d;

            return (
              <button
                key={d}
                disabled={unavailable}
                title={isClosed && !isPast ? "No atiende este día" : undefined}
                onClick={() => selectDay(d)}
                className={`aspect-square rounded-md text-sm font-semibold transition-colors ${
                  unavailable
                    ? "text-line-strong cursor-not-allowed"
                    : isSel
                    ? "bg-primary text-white"
                    : "text-ink hover:bg-primary-soft hover:text-primary"
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
        <div className="bg-surface rounded-lg border border-line p-5">
          <h3 className="text-sm font-semibold text-ink mb-3">
            Horarios disponibles — {selectedDate.d}/{selectedDate.m}/{selectedDate.y}
          </h3>
          {loadingSlots ? (
            <div className="grid grid-cols-4 gap-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-11 bg-surface-2 rounded-md animate-pulse" />
              ))}
            </div>
          ) : slots.length === 0 ? (
            <p className="text-sm text-muted">No hay horarios disponibles para este día.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {slots.map((s) => (
                <button
                  key={s.startsAt}
                  onClick={() => setSelectedSlot(s)}
                  className={`min-h-11 rounded-md text-sm font-semibold transition-colors border ${
                    selectedSlot?.startsAt === s.startsAt
                      ? "bg-primary text-white border-primary"
                      : "border-line-strong text-ink hover:bg-primary-soft hover:border-primary"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contact form (anonymous only) + notes */}
      {selectedSlot && (
        <div className="bg-surface rounded-lg border border-line p-5 space-y-4">
          {!isRegistered && (
            <>
              <h3 className="text-sm font-semibold text-ink">Tus datos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Nombre *</label>
                  <input
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    className={inputCls}
                    placeholder="Tu nombre completo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Email *</label>
                  <input
                    type="email"
                    value={patientEmail}
                    onChange={e => setPatientEmail(e.target.value)}
                    className={inputCls}
                    placeholder="tu@email.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-muted mb-1">Teléfono (opcional)</label>
                  <input
                    value={patientPhone}
                    onChange={e => setPatientPhone(e.target.value)}
                    className={inputCls}
                    placeholder="+54 9 11 1234 5678"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-muted mb-1">Notas (opcional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className={`${inputCls} resize-none py-2.5`}
              placeholder="Motivo de la consulta, información adicional…"
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-danger bg-danger-soft border border-danger rounded-md px-3 py-2">{error}</p>
          )}

          {profile.consultationFee && (
            <div className="flex items-center justify-between text-sm rounded-md bg-surface-2 px-4 py-3">
              <span className="text-muted">Valor de la consulta</span>
              <span className="font-semibold text-ink">
                {profile.currency} {profile.consultationFee.toLocaleString("es-AR")}
              </span>
            </div>
          )}

          <button
            onClick={handleBook}
            disabled={submitting}
            className="w-full min-h-11 bg-primary hover:bg-primary-hi disabled:bg-surface-2 disabled:text-muted text-white font-semibold text-sm rounded-md transition-colors"
          >
            {submitting ? "Procesando…" : profile.consultationFee ? "Confirmar y pagar" : "Solicitar turno"}
          </button>
        </div>
      )}
    </div>
  );
}
