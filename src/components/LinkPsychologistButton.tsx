"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  slug: string;
  name: string;
}

/**
 * Vinculación de un clic desde el perfil público. Antes el paciente tenía que
 * volver a su panel y tipear el email exacto del profesional; acá ya sabemos
 * a quién está mirando.
 */
export default function LinkPsychologistButton({ slug, name }: Props) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "linking" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  async function link() {
    setState("linking");
    setError(null);
    try {
      const res = await fetch("/api/patient/psychologist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "No pudimos vincularte. Probá de nuevo.");
        setState("idle");
        return;
      }

      setState("done");
      router.refresh();
    } catch {
      setError("No pudimos vincularte. Revisá tu conexión.");
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <p className="rounded-md bg-primary-soft px-4 py-3 text-sm font-medium text-primary-hi">
        Listo, {name} es tu profesional. Ya podés reservar desde tu panel.
      </p>
    );
  }

  return (
    <div>
      <button
        onClick={link}
        disabled={state === "linking"}
        className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-line-strong bg-surface px-5 text-sm font-semibold text-ink transition-colors hover:bg-surface-2 disabled:bg-surface-2 disabled:text-muted"
      >
        {state === "linking" ? "Vinculando…" : `Elegir a ${name} como mi profesional`}
      </button>
      <p className="mt-2 text-xs text-muted">
        Queda como tu profesional de cabecera y vas a poder reservar desde tu panel.
      </p>
      {error && (
        <p role="alert" className="mt-2 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
