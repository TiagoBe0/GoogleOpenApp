"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TurnoActions({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
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

  return (
    <div className="flex gap-2 flex-shrink-0">
      <button
        onClick={() => handleAction("CANCELLED")}
        disabled={loading}
        className="min-h-11 px-4 rounded-md border border-line-strong text-sm font-semibold text-muted hover:text-danger hover:border-danger hover:bg-danger-soft transition-colors disabled:opacity-50"
      >
        Rechazar
      </button>
      <button
        onClick={() => handleAction("CONFIRMED")}
        disabled={loading}
        className="min-h-11 px-4 rounded-md text-sm font-semibold text-white bg-primary hover:bg-primary-hi disabled:opacity-50 transition-colors"
      >
        {loading ? "…" : "Confirmar"}
      </button>
    </div>
  );
}
