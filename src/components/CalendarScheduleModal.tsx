"use client";

import { useState, useEffect } from "react";

interface Patient {
  id: string;
  name: string | null;
  email: string;
}

interface Props {
  psychologistId: string;
  initialDate: Date;
  onClose: () => void;
  onCreated: () => void;
}

const DURATIONS = [30, 45, 50, 60, 90];

function pad(n: number) { return String(n).padStart(2, "0"); }

export default function CalendarScheduleModal({ psychologistId, initialDate, onClose, onCreated }: Props) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(true);
  const [patientId, setPatientId] = useState("");

  const initDate = `${initialDate.getFullYear()}-${pad(initialDate.getMonth() + 1)}-${pad(initialDate.getDate())}`;
  const initHour = initialDate.getHours();

  const [date, setDate] = useState(initDate);
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [time, setTime] = useState(`${pad(initHour)}:00`);
  const [duration, setDuration] = useState(50);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/patients")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setPatients(list);
        if (list.length > 0) setPatientId(list[0].id);
      })
      .finally(() => setLoadingPatients(false));
  }, []);

  useEffect(() => {
    if (!date) return;
    setLoadingSlots(true);
    const [y, m, d] = date.split("-").map(Number);
    const tz = new Date().getTimezoneOffset();
    fetch(`/api/appointments/available-slots?psychologistId=${psychologistId}&year=${y}&month=${m}&day=${d}&tzOffset=${tz}`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data.slots) ? data.slots : [];
        setSlots(list);
        // keep current time if it's in the available slots, otherwise reset
        if (list.length > 0 && !list.includes(time)) setTime(list[0]);
      })
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) { setError("Seleccioná un paciente"); return; }
    if (!time) { setError("Seleccioná un horario"); return; }

    setSubmitting(true);
    setError("");
    try {
      const appointmentDate = new Date(`${date}T${time}`);
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId,
          date: appointmentDate.toISOString(),
          duration,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "No se pudo agendar el turno"); return; }
      onCreated();
    } catch {
      setError("Error de conexión. Intentá nuevamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 text-sm">Nuevo turno</h2>
              <p className="text-xs text-gray-400">Solo pacientes vinculados</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Patient */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-1.5 block">Paciente</span>
            <select
              required
              value={patientId}
              disabled={loadingPatients}
              onChange={(e) => { setPatientId(e.target.value); setError(""); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-gray-50"
            >
              {loadingPatients ? (
                <option>Cargando...</option>
              ) : patients.length === 0 ? (
                <option value="">Sin pacientes vinculados</option>
              ) : (
                patients.map((p) => (
                  <option key={p.id} value={p.id}>{p.name || p.email}</option>
                ))
              )}
            </select>
          </label>

          {/* Date */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-1.5 block">Fecha</span>
            <input
              type="date"
              required
              min={today}
              value={date}
              onChange={(e) => { setDate(e.target.value); setError(""); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </label>

          {/* Time slots */}
          <div>
            <span className="text-sm font-medium text-gray-700 mb-1.5 block">Horario</span>
            {loadingSlots ? (
              <div className="h-9 bg-gray-100 rounded-lg animate-pulse" />
            ) : slots.length === 0 ? (
              <p className="text-sm text-gray-400 py-1">Sin horarios disponibles para este día</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => { setTime(slot); setError(""); }}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      time === slot
                        ? "bg-indigo-600 text-white border-indigo-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Duration */}
          <div>
            <span className="text-sm font-medium text-gray-700 mb-1.5 block">Duración</span>
            <div className="flex flex-wrap gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                    duration === d
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-indigo-400 hover:text-indigo-600"
                  }`}
                >
                  {d} min
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <label className="block">
            <span className="text-sm font-medium text-gray-700 mb-1.5 block">
              Notas <span className="font-normal text-gray-400">(opcional)</span>
            </span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Motivo, modalidad, recordatorio..."
              className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </label>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || patients.length === 0 || !time}
              className="flex-1 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium transition-colors"
            >
              {submitting ? "Agendando..." : "Agendar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
