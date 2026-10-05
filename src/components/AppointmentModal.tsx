"use client";

import { useState } from "react";

interface Props {
  initialDate: Date;
  onClose: () => void;
  onCreated: () => void;
}

const DURATIONS = [
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "1 hora", value: 60 },
  { label: "1:30 hs", value: 90 },
];

const inputCls =
  "min-h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-base text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-soft";

function toLocalDateTimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function AppointmentModal({ initialDate, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    patientName: "",
    startDateTime: toLocalDateTimeInput(initialDate),
    duration: 60,
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const start = new Date(form.startDateTime);
      const end = new Date(start.getTime() + form.duration * 60 * 1000);

      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: `Sesión — ${form.patientName}`,
          description: form.notes || undefined,
          startDateTime: start.toISOString(),
          endDateTime: end.toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al crear el turno");
        return;
      }
      onCreated();
    } catch {
      setError("Error de conexión. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-surface rounded-lg shadow-2xl w-full max-w-md overflow-hidden border border-line">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-line">
          <div>
            <h2 className="font-display text-2xl font-semibold text-ink">Nuevo turno</h2>
            <p className="mt-1 text-sm text-muted">Creá un evento en tu calendario.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-11 w-11 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Nombre del paciente</label>
            <input
              type="text"
              required
              placeholder="Ej: María González"
              value={form.patientName}
              onChange={(e) => setForm((p) => ({ ...p, patientName: e.target.value }))}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Fecha y hora</label>
            <input
              type="datetime-local"
              required
              value={form.startDateTime}
              onChange={(e) => setForm((p) => ({ ...p, startDateTime: e.target.value }))}
              className={inputCls}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Duración</label>
            <div className="grid grid-cols-4 gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, duration: d.value }))}
                  className={`min-h-11 rounded-md text-sm font-semibold border transition-colors ${
                    form.duration === d.value
                      ? "bg-primary text-white border-primary"
                      : "bg-surface text-muted border-line-strong hover:border-primary hover:bg-primary-soft hover:text-primary"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">
              Notas <span className="text-muted font-normal">(opcional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Motivo de consulta, recordatorios..."
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              className={inputCls + " resize-none"}
            />
          </div>

          {error && (
            <div className="bg-danger-soft border border-danger rounded-md px-3 py-2 text-sm font-medium text-danger">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="min-h-11 flex-1 rounded-md border border-line-strong text-base font-semibold text-ink transition-colors hover:bg-surface-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="min-h-11 flex-1 rounded-md bg-primary text-base font-semibold text-white transition-colors hover:bg-primary-hi disabled:bg-surface-2 disabled:text-muted"
            >
              {loading ? "Guardando…" : "Guardar turno"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
