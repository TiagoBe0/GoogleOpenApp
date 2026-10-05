"use client";

import { useState } from "react";
import { SERVICES } from "@/lib/leads";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

const field =
  "min-h-12 w-full rounded-[3px] border border-mm-line bg-mm-bg px-4 py-3 text-base text-mm-text placeholder:text-mm-muted/70 focus:border-mm-text focus:outline-none focus:ring-2 focus:ring-mm-text/15";
const label = "mb-1.5 block text-sm font-medium text-mm-text";

export default function ContactForm() {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setStatus({ kind: "sending" });

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus({ kind: "error", message: data.error ?? "No pudimos enviar tu consulta. Probá de nuevo." });
        return;
      }
      form.reset();
      setStatus({ kind: "sent" });
    } catch {
      setStatus({ kind: "error", message: "Sin conexión. Revisá tu internet y probá de nuevo." });
    }
  }

  if (status.kind === "sent") {
    return (
      <div role="status" className="rounded-[3px] bg-mm-surface p-8">
        <p className="text-3xl font-semibold tracking-[-0.03em] text-mm-text">¡Gracias! Ya tenemos tu consulta.</p>
        <p className="mt-3 text-base leading-7 text-mm-muted">
          Te escribimos dentro de las 24 horas hábiles para coordinar una llamada corta y entender tu proyecto.
        </p>
        <button
          type="button"
          onClick={() => setStatus({ kind: "idle" })}
          className="mt-6 min-h-11 rounded-full border border-mm-text px-5 text-sm font-semibold uppercase tracking-[0.04em] hover:bg-mm-text hover:text-white"
        >
          Enviar otra consulta
        </button>
      </div>
    );
  }

  const sending = status.kind === "sending";

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="lead-name" className={label}>Nombre</label>
          <input id="lead-name" name="name" required autoComplete="name" maxLength={100} className={field} />
        </div>
        <div>
          <label htmlFor="lead-company" className={label}>
            Empresa <span className="font-normal text-mm-muted">(opcional)</span>
          </label>
          <input id="lead-company" name="company" autoComplete="organization" maxLength={120} className={field} />
        </div>
        <div>
          <label htmlFor="lead-email" className={label}>Email</label>
          <input id="lead-email" name="email" type="email" required autoComplete="email" maxLength={200} className={field} />
        </div>
        <div>
          <label htmlFor="lead-phone" className={label}>
            WhatsApp <span className="font-normal text-mm-muted">(opcional)</span>
          </label>
          <input id="lead-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} className={field} />
        </div>
      </div>

      <div>
        <label htmlFor="lead-service" className={label}>¿Qué te interesa?</label>
        <select id="lead-service" name="service" defaultValue="" className={field}>
          <option value="" disabled>Elegí una opción</option>
          {SERVICES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="lead-message" className={label}>Contanos tu proyecto</label>
        <textarea
          id="lead-message"
          name="message"
          required
          rows={4}
          maxLength={2000}
          placeholder="Ej.: somos una bodega en Luján y queremos un video para la temporada de vendimia, en español y portugués."
          className={`${field} resize-y`}
        />
      </div>

      {/* Campo trampa para bots: invisible y fuera del orden de tabulación. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="lead-website">No completar</label>
        <input id="lead-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {status.kind === "error" && (
        <p role="alert" className="rounded-[3px] border border-mm-accent/50 bg-mm-accent/10 px-4 py-3 text-base text-mm-text">
          {status.message}
        </p>
      )}

      <button
        type="submit"
        disabled={sending}
        className="flex min-h-12 w-fit items-center gap-2 rounded-full border border-mm-text px-7 text-sm font-semibold uppercase tracking-[0.04em] text-mm-text transition-colors hover:bg-mm-text hover:text-white disabled:opacity-60"
      >
        {sending ? "Enviando…" : "Enviar mensaje"} <span aria-hidden="true">✦</span>
      </button>
      <p className="text-sm text-mm-muted">Respondemos en menos de 24 horas hábiles. Sin compromiso.</p>
    </form>
  );
}
