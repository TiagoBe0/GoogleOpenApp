"use client";

import { useEffect, useState } from "react";

interface Appointment {
  id: string;
  date: string;
  duration: number;
  notes: string | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  patient: { id: string; name: string | null; email: string; image: string | null };
}

export default function PendingAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  async function fetchAppointments() {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data.filter((a: Appointment) => a.status === "PENDING" && new Date(a.date) >= new Date()) : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    fetch("/api/appointments")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setAppointments(Array.isArray(data) ? data.filter((a: Appointment) => a.status === "PENDING" && new Date(a.date) >= new Date()) : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAction(id: string, status: "CONFIRMED" | "CANCELLED") {
    setActionId(id);
    try {
      await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchAppointments();
    } finally {
      setActionId(null);
    }
  }

  if (loading) return <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />;
  if (appointments.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-amber-100 bg-amber-50">
        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
        <h2 className="font-semibold text-amber-800 text-sm">
          {appointments.length} solicitud{appointments.length !== 1 ? "es" : ""} pendiente{appointments.length !== 1 ? "s" : ""}
        </h2>
      </div>
      <div className="divide-y divide-gray-100">
        {appointments.map((a) => {
          const d = new Date(a.date);
          const initials = a.patient.name
            ? a.patient.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
            : a.patient.email[0].toUpperCase();

          return (
            <div key={a.id} className="px-5 py-4 flex items-center gap-4">
              {a.patient.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.patient.image} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
              ) : (
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-sm font-semibold flex-shrink-0">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">
                  {a.patient.name || a.patient.email}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })} · {d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} · {a.duration} min
                </p>
                {a.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">📝 {a.notes}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button
                  onClick={() => handleAction(a.id, "CANCELLED")}
                  disabled={actionId === a.id}
                  className="text-sm text-gray-500 hover:text-red-500 px-4 min-h-11 rounded-lg border border-gray-200 hover:border-red-200 hover:bg-red-50 transition-colors"
                >
                  Rechazar
                </button>
                <button
                  onClick={() => handleAction(a.id, "CONFIRMED")}
                  disabled={actionId === a.id}
                  className="text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 px-4 min-h-11 rounded-lg transition-colors"
                >
                  {actionId === a.id ? "..." : "Confirmar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
