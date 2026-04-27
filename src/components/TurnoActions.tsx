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
        className="text-xs text-gray-400 hover:text-red-500 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50"
      >
        Rechazar
      </button>
      <button
        onClick={() => handleAction("CONFIRMED")}
        disabled={loading}
        className="text-xs text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
      >
        {loading ? "..." : "Confirmar"}
      </button>
    </div>
  );
}
