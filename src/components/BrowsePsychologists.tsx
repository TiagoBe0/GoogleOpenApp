"use client";

import { useEffect, useMemo, useState } from "react";
import type { DirectoryEntry } from "@/lib/psychologists";
import { hourlyRate, formatMoney } from "@/lib/pricing";

interface Props {
  /** Profesional que el paciente ya tiene, para no ofrecerle vincularse de nuevo. */
  currentPsychologistId?: string | null;
  onLinked?: () => void;
}

export default function BrowsePsychologists({ currentPsychologistId, onLinked }: Props) {
  const [all, setAll] = useState<DirectoryEntry[] | null>(null);
  const [query, setQuery] = useState("");
  const [linking, setLinking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/psychologists")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setAll(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setAll([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // El filtro corre en memoria: el listado completo ya está cargado y así la
  // búsqueda responde mientras se escribe, sin ida y vuelta al servidor.
  const results = useMemo(() => {
    if (!all) return null;
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((p) =>
      [p.name, p.specialty, p.bio].some((f) => f?.toLowerCase().includes(q))
    );
  }, [all, query]);

  async function link(slug: string) {
    setLinking(slug);
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
        return;
      }
      onLinked?.();
    } catch {
      setError("No pudimos vincularte. Revisá tu conexión.");
    } finally {
      setLinking(null);
    }
  }

  if (results === null) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-[14px] bg-surface-2" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar por nombre o especialidad"
        aria-label="Buscar por nombre o especialidad"
        className="min-h-11 w-full rounded-[10px] border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-2 focus:outline-offset-1 focus:outline-primary"
      />

      <p className="mt-4 text-xs text-muted tabular-nums">
        {results.length} {results.length === 1 ? "profesional" : "profesionales"}
        {query && ` para "${query}"`}
      </p>

      {error && (
        <p role="alert" className="mt-3 rounded-[10px] bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {results.length === 0 ? (
        <p className="mt-4 rounded-[14px] border border-dashed border-line-strong p-8 text-center text-sm text-muted">
          Ninguna búsqueda coincide. Probá con otra especialidad.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {results.map((p) => {
            const isMine = p.id === currentPsychologistId;
            const hourly = hourlyRate(p.consultationFee, p.sessionDuration);

            return (
              <li key={p.id} className="rounded-[14px] border border-line bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg text-ink">{p.name ?? "Profesional"}</h3>
                    {p.specialty && <p className="mt-0.5 text-xs text-muted">{p.specialty}</p>}
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="font-display text-lg text-ink tabular-nums">
                      {p.consultationFee == null
                        ? "A consultar"
                        : formatMoney(p.consultationFee, p.currency)}
                    </div>
                    <div className="text-xs text-muted tabular-nums">
                      {p.sessionDuration} min
                      {hourly != null && ` · ${formatMoney(hourly, p.currency)}/hora`}
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-xs text-muted tabular-nums">
                  {p.rating.count > 0
                    ? `★ ${p.rating.average} · ${p.rating.count} ${p.rating.count === 1 ? "opinión" : "opiniones"}`
                    : "Sin opiniones todavía"}
                </div>

                {p.bio && <p className="mt-3 text-sm leading-relaxed text-muted">{p.bio}</p>}

                <div className="mt-4 flex justify-end gap-2 border-t border-line pt-4">
                  <a
                    href={`/p/${p.slug}`}
                    className="inline-flex min-h-11 items-center rounded-[10px] border border-line-strong px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
                  >
                    Ver perfil
                  </a>
                  {isMine ? (
                    <span className="inline-flex min-h-11 items-center rounded-[10px] bg-primary-soft px-4 text-sm font-semibold text-primary-hi">
                      Tu profesional
                    </span>
                  ) : currentPsychologistId ? null : (
                    <button
                      onClick={() => link(p.slug)}
                      disabled={linking !== null}
                      className="inline-flex min-h-11 items-center rounded-[10px] bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hi disabled:bg-surface-2 disabled:text-muted"
                    >
                      {linking === p.slug ? "Vinculando…" : "Elegir"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
