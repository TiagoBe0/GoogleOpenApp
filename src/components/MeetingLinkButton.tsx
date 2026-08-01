"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import MeetingLinkModal from "@/components/MeetingLinkModal";

interface Props {
  appointmentId: string;
  meetingUrl: string | null;
}

/**
 * Muestra el link de la videollamada de un turno ya confirmado y permite
 * cambiarlo. Las salas se vencen y los links se regeneran, así que cargarlo al
 * confirmar no puede ser la única oportunidad de ponerlo.
 */
export default function MeetingLinkButton({ appointmentId, meetingUrl }: Props) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  async function save(url: string | null) {
    const res = await fetch(`/api/appointments/${appointmentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ meetingUrl: url }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error ?? "No se pudo guardar el link.");
    }

    setEditing(false);
    router.refresh();
  }

  return (
    <>
      {meetingUrl ? (
        <div className="flex items-center gap-2">
          <a
            href={meetingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center rounded-md bg-primary-soft px-3 text-xs font-semibold text-primary-hi transition-colors hover:bg-primary hover:text-white"
          >
            Entrar
          </a>
          <button
            onClick={() => setEditing(true)}
            className="min-h-11 rounded-md px-2 text-xs font-semibold text-muted transition-colors hover:text-ink"
          >
            Cambiar link
          </button>
        </div>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="min-h-11 rounded-md border border-line-strong px-3 text-xs font-semibold text-muted transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary"
        >
          Agregar link
        </button>
      )}

      {editing && (
        <MeetingLinkModal
          mode="edit"
          currentUrl={meetingUrl}
          onClose={() => setEditing(false)}
          onSubmit={save}
        />
      )}
    </>
  );
}
