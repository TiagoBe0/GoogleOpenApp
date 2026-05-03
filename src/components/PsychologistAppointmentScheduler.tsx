"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Patient {
  id: string;
  name: string | null;
  email: string;
}

interface PsychologistAppointmentSchedulerProps {
  psychologistId: string;
  buttonLabel?: string;
}

export default function PsychologistAppointmentScheduler({
  psychologistId,
  buttonLabel = "Agendar turno",
}: PsychologistAppointmentSchedulerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [date, setDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("50");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function openModal() {
    setOpen(true);
    setError("");
    if (patients.length > 0 || loadingPatients) return;

    setLoadingPatients(true);
    try {
      const res = await fetch("/api/patients");
      const data = await res.json();
      if (Array.isArray(data)) {
        setPatients(data);
        setPatientId(data[0]?.id ?? "");
      }
    } finally {
      setLoadingPatients(false);
    }
  }

  function closeModal() {
    setOpen(false);
    setPatientId("");
    setDate("");
    setTime("");
    setSlots([]);
    setDuration("50");
    setNotes("");
    setError("");
  }

  async function handleDateChange(newDate: string) {
    setDate(newDate);
    setTime("");
    setSlots([]);
    if (!newDate) return;

    setLoadingSlots(true);
    try {
      const [year, month, day] = newDate.split("-").map(Number);
      const tzOffset = new Date().getTimezoneOffset();
      const url = `/api/appointments/available-slots?psychologistId=${psychologistId}&year=${year}&month=${month}&day=${day}&tzOffset=${tzOffset}`;
      const res = await fetch(url);
      const data = await res.json();
      setSlots(Array.isArray(data.slots) ? data.slots : []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
          duration: Number(duration),
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo agendar el turno");
        return;
      }

      closeModal();
      router.refresh();
    } catch {
      setError("Revisá la fecha y hora e intentá nuevamente.");
    } finally {
      setSubmitting(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
              <div>
                <h2 className="font-semibold text-gray-900">Agendar turno</h2>
                <p className="mt-0.5 text-xs text-gray-400">Solo pacientes previamente vinculados</p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-lg p-1.5 hover:bg-gray-100">
                <svg className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              {/* Patient selector */}
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Paciente</span>
                <select
                  required
                  value={patientId}
                  disabled={loadingPatients || patients.length === 0}
                  onChange={(e) => { setPatientId(e.target.value); setError(""); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-50"
                >
                  {loadingPatients ? (
                    <option>Cargando pacientes...</option>
                  ) : patients.length === 0 ? (
                    <option value="">No tenés pacientes vinculados</option>
                  ) : (
                    patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name || patient.email}
                      </option>
                    ))
                  )}
                </select>
              </label>

              {/* Date */}
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Fecha</span>
                <input
                  type="date"
                  required
                  min={today}
                  value={date}
                  onChange={(e) => { handleDateChange(e.target.value); setError(""); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>

              {/* Time slots */}
              {date && (
                <div>
                  <span className="mb-1.5 block text-sm font-medium text-gray-700">Horario disponible</span>
                  {loadingSlots ? (
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                  ) : slots.length === 0 ? (
                    <p className="text-sm text-gray-400 py-2">Sin horarios disponibles para este día</p>
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
              )}

              {/* Duration */}
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Duración</span>
                <select
                  value={duration}
                  onChange={(e) => { setDuration(e.target.value); if (date) handleDateChange(date); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="50">50 min</option>
                  <option value="60">60 min</option>
                  <option value="90">90 min</option>
                </select>
              </label>

              {/* Notes */}
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Notas</span>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Motivo, modalidad o recordatorio interno..."
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </label>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || loadingPatients || patients.length === 0 || !time}
                  className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:bg-indigo-400"
                >
                  {submitting ? "Agendando..." : "Agendar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
