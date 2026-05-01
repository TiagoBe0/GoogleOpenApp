"use client";

import { useEffect, useState } from "react";

interface Appointment {
  id: string;
  date: string;
  duration: number;
  notes: string | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  patient: { id: string; name: string | null; email: string; image: string | null } | null;
  patientName?: string | null;
  patientEmail?: string | null;
  paymentProofUrl?: string | null;
  paymentStatus?: string | null;
}

const PENDING_STATUSES = new Set(["PENDING", "pending", "pending_payment"]);

export default function PendingAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [proofModal, setProofModal] = useState<string | null>(null);

  async function fetchAppointments() {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      setAppointments(
        Array.isArray(data)
          ? data.filter((a: Appointment) => PENDING_STATUSES.has(a.status) && new Date(a.date) >= new Date())
          : []
      );
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
        setAppointments(
          Array.isArray(data)
            ? data.filter((a: Appointment) => PENDING_STATUSES.has(a.status) && new Date(a.date) >= new Date())
            : []
        );
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  async function handleAction(id: string, action: "CONFIRMED" | "CANCELLED" | "PAYMENT_CONFIRMED") {
    setActionId(id);
    try {
      await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          action === "PAYMENT_CONFIRMED"
            ? { paymentStatus: "PAID" }
            : { status: action }
        ),
      });
      fetchAppointments();
    } finally {
      setActionId(null);
    }
  }

  if (loading) return <div className="h-24 bg-gray-100 rounded-2xl animate-pulse" />;
  if (appointments.length === 0) return null;

  return (
    <>
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
            const displayName = a.patient?.name || a.patientName || a.patient?.email || a.patientEmail || "Paciente";
            const displayEmail = a.patient?.email || a.patientEmail || "";
            const ini = displayName !== "Paciente"
              ? displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
              : displayEmail[0]?.toUpperCase() ?? "P";

            const hasProof = !!a.paymentProofUrl;
            const isPaid = a.paymentStatus === "PAID";
            const isImage = hasProof && !a.paymentProofUrl!.endsWith(".pdf");

            return (
              <div key={a.id} className="px-5 py-4 flex flex-col gap-3">
                <div className="flex items-center gap-4">
                  {a.patient?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.patient.image} alt="" className="w-10 h-10 rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-sm font-semibold flex-shrink-0">
                      {ini}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{displayName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" })} · {d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} · {a.duration} min
                    </p>
                    {a.notes && <p className="text-xs text-gray-400 mt-0.5 truncate">📝 {a.notes}</p>}
                  </div>
                </div>

                {/* Payment proof row */}
                {hasProof && (
                  <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${isPaid ? "border-green-200 bg-green-50" : "border-blue-100 bg-blue-50"}`}>
                    <svg className={`w-4 h-4 flex-shrink-0 ${isPaid ? "text-green-500" : "text-blue-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${isPaid ? "text-green-700" : "text-blue-700"}`}>
                        {isPaid ? "Pago confirmado" : "Comprobante adjunto"}
                      </p>
                      <button
                        type="button"
                        onClick={() => setProofModal(a.paymentProofUrl!)}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        {isImage ? "Ver imagen" : "Ver PDF"}
                      </button>
                    </div>
                    {!isPaid && (
                      <button
                        onClick={() => handleAction(a.id, "PAYMENT_CONFIRMED")}
                        disabled={actionId === a.id}
                        className="text-xs text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                      >
                        {actionId === a.id ? "..." : "Confirmar pago"}
                      </button>
                    )}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => handleAction(a.id, "CANCELLED")}
                    disabled={actionId === a.id}
                    className="text-xs text-gray-400 hover:text-red-500 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-red-200 hover:bg-red-50 transition-colors"
                  >
                    Rechazar
                  </button>
                  <button
                    onClick={() => handleAction(a.id, "CONFIRMED")}
                    disabled={actionId === a.id}
                    className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {actionId === a.id ? "..." : "Confirmar turno"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Proof viewer modal */}
      {proofModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
          onClick={() => setProofModal(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setProofModal(null)}
              className="absolute -top-10 right-0 text-white text-sm hover:underline"
            >
              Cerrar ✕
            </button>
            {proofModal.endsWith(".pdf") ? (
              <iframe src={proofModal} className="w-full h-[80vh] rounded-xl" title="Comprobante" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={proofModal} alt="Comprobante" className="w-full rounded-xl object-contain max-h-[80vh]" />
            )}
            <a
              href={proofModal}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 block text-center text-white text-xs hover:underline"
            >
              Abrir en nueva pestaña
            </a>
          </div>
        </div>
      )}
    </>
  );
}
