"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import RescheduleModal from "@/components/RescheduleModal";
import MeetingLinkModal from "@/components/MeetingLinkModal";

interface Props {
  id: string;
  /** Necesarios para reprogramar; sin ellos solo se muestran confirmar y rechazar. */
  psychologistId?: string;
  date?: string;
}

export default function TurnoActions({ id, psychologistId, date }: Props) {
  const [loading, setLoading] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const router = useRouter();

  async function handleAction(status: "CONFIRMED" | "CANCELLED") {
    setLoading(true);
    try {
      await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  /**
   * Confirmar manda el estado y el link en el mismo PATCH, para que el aviso
   * al paciente ya salga con el link adentro. En dos pasos, el correo de
   * confirmación se iría sin él.
   */
  async function confirmWithLink(meetingUrl: string | null) {
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CONFIRMED", meetingUrl }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "No se pudo confirmar el turno.");
    }

    setConfirming(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex flex-shrink-0 gap-2">
        <button
          onClick={() => handleAction("CANCELLED")}
          disabled={loading}
          className="min-h-11 rounded-md border border-line-strong px-4 text-sm font-semibold text-muted transition-colors hover:border-danger hover:bg-danger-soft hover:text-danger disabled:opacity-50"
        >
          Rechazar
        </button>
        {psychologistId && date && (
          <button
            onClick={() => setRescheduling(true)}
            disabled={loading}
            className="min-h-11 rounded-md border border-line-strong px-4 text-sm font-semibold text-muted transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary disabled:opacity-50"
          >
            Mover
          </button>
        )}
        <button
          onClick={() => setConfirming(true)}
          disabled={loading}
          className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hi disabled:opacity-50"
        >
          {loading ? "…" : "Confirmar"}
        </button>
      </div>

      {confirming && (
        <MeetingLinkModal
          mode="confirm"
          onClose={() => setConfirming(false)}
          onSubmit={confirmWithLink}
        />
      )}

      {rescheduling && psychologistId && date && (
        <RescheduleModal
          appointmentId={id}
          psychologistId={psychologistId}
          currentDate={date}
          onClose={() => setRescheduling(false)}
          onDone={() => router.refresh()}
        />
      )}
    </>
  );
}
