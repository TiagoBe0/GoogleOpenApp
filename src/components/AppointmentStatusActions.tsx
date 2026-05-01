"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface AppointmentStatusActionsProps {
  appointmentId: string;
  status: string;
}

const PENDING_STATUSES = new Set(["PENDING", "pending", "pending_payment"]);
const CONFIRMED_STATUSES = new Set(["CONFIRMED", "confirmed"]);
const CANCELLED_STATUSES = new Set(["CANCELLED", "cancelled"]);

export default function AppointmentStatusActions({ appointmentId, status }: AppointmentStatusActionsProps) {
  const router = useRouter();
  const [loadingStatus, setLoadingStatus] = useState<"CONFIRMED" | "CANCELLED" | null>(null);
  const [error, setError] = useState("");

  const canConfirm = PENDING_STATUSES.has(status);
  const canCancel = (PENDING_STATUSES.has(status) || CONFIRMED_STATUSES.has(status)) && !CANCELLED_STATUSES.has(status);

  if (!canConfirm && !canCancel) return null;

  async function updateStatus(nextStatus: "CONFIRMED" | "CANCELLED") {
    setLoadingStatus(nextStatus);
    setError("");

    try {
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "No se pudo actualizar el turno");
        return;
      }

      router.refresh();
    } catch {
      setError("Error de conexión. Intentá nuevamente.");
    } finally {
      setLoadingStatus(null);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap justify-end gap-2">
        {canCancel && (
          <button
            type="button"
            onClick={() => updateStatus("CANCELLED")}
            disabled={loadingStatus !== null}
            className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loadingStatus === "CANCELLED" ? "Cancelando..." : canConfirm ? "Rechazar" : "Cancelar"}
          </button>
        )}
        {canConfirm && (
          <button
            type="button"
            onClick={() => updateStatus("CONFIRMED")}
            disabled={loadingStatus !== null}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-400"
          >
            {loadingStatus === "CONFIRMED" ? "Confirmando..." : "Confirmar turno"}
          </button>
        )}
      </div>
      {error && <p className="max-w-[220px] text-right text-xs text-red-500">{error}</p>}
    </div>
  );
}
