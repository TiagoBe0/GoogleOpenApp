"use client";

import { useState } from "react";

interface Props {
  /** Link ya cargado, si se está editando en vez de confirmando. */
  currentUrl?: string | null;
  /**
   * Al confirmar el turno el link es opcional y el botón dice "Confirmar".
   * Editando un turno ya confirmado, solo se guarda el link.
   */
  mode: "confirm" | "edit";
  onClose: () => void;
  /** Recibe el link, o null si se dejó vacío. Lanza si el servidor lo rechaza. */
  onSubmit: (meetingUrl: string | null) => Promise<void>;
}

export default function MeetingLinkModal({ currentUrl, mode, onClose, onSubmit }: Props) {
  const [url, setUrl] = useState(currentUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setSaving(true);
    setError("");
    try {
      await onSubmit(url.trim() === "" ? null : url.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar el link.");
      setSaving(false);
    }
  }

  const confirmando = mode === "confirm";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-lg border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              {confirmando ? "Confirmar turno" : "Link de la videollamada"}
            </h2>
            <p className="text-xs text-muted">
              {confirmando
                ? "Si la sesión es online, pegá el link. Podés dejarlo vacío y cargarlo después."
                : "El paciente lo ve en su panel y le llega por correo."}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-ink"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-5">
          <label htmlFor="meeting-url" className="mb-1.5 block text-sm font-semibold text-ink">
            Link de la sesión
          </label>
          <input
            id="meeting-url"
            type="url"
            inputMode="url"
            autoComplete="off"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://meet.google.com/abc-defg-hij"
            className="min-h-11 w-full rounded-md border border-line-strong bg-bg px-3 text-sm text-ink outline-none focus:border-primary"
          />
          <p className="mt-1.5 text-xs text-muted">
            Sirve cualquier proveedor (Meet, Zoom, Jitsi, Whereby). Tiene que empezar
            con https://
          </p>

          {error && (
            <p className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-line px-5 py-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="min-h-11 rounded-md border border-line-strong px-4 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={submit}
            disabled={saving}
            className="min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hi disabled:opacity-50"
          >
            {saving ? "Guardando…" : confirmando ? "Confirmar turno" : "Guardar link"}
          </button>
        </div>
      </div>
    </div>
  );
}
