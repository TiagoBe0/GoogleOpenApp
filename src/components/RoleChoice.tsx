"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Role = "PATIENT" | "PSYCHOLOGIST";

const OPTIONS: { role: Role; title: string; detail: string }[] = [
  {
    role: "PATIENT",
    title: "Busco un psicólogo",
    detail: "Reservá turnos, pagá online y llevá tu historial de sesiones.",
  },
  {
    role: "PSYCHOLOGIST",
    title: "Soy psicólogo",
    detail: "Publicá tu perfil, gestioná tu agenda y confirmá los turnos que recibís.",
  },
];

export default function RoleChoice() {
  const router = useRouter();
  const [pending, setPending] = useState<Role | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function choose(role: Role) {
    setPending(role);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "No pudimos guardar tu elección. Probá de nuevo.");
        setPending(null);
        return;
      }

      router.replace(data.redirectTo ?? "/patient");
    } catch {
      setError("No pudimos guardar tu elección. Revisá tu conexión.");
      setPending(null);
    }
  }

  return (
    <div className="mt-8">
      <div className="grid gap-3">
        {OPTIONS.map((option) => (
          <button
            key={option.role}
            onClick={() => choose(option.role)}
            disabled={pending !== null}
            className="rounded-lg border border-line-strong bg-surface p-5 text-left transition-colors hover:border-primary hover:bg-primary-soft disabled:bg-surface-2 disabled:text-muted"
          >
            <span className="block font-display text-xl font-semibold text-ink">
              {pending === option.role ? "Guardando…" : option.title}
            </span>
            <span className="mt-1 block text-sm text-muted">{option.detail}</span>
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
