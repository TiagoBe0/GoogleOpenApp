"use client";

import { useEffect, useState } from "react";

interface Patient {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  createdAt: string;
}

const inputCls =
  "min-h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-base text-ink outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-soft";

export default function PatientsList() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function fetchPatients() {
    setLoading(true);
    try {
      const res = await fetch("/api/patients");
      const data = await res.json();
      setPatients(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    fetch("/api/patients")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setPatients(Array.isArray(data) ? data : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLink(e: React.FormEvent) {
    e.preventDefault();
    setLinking(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al vincular");
        return;
      }
      setSuccess(`${data.name || data.email} vinculado correctamente`);
      setEmail("");
      setShowModal(false);
      fetchPatients();
    } finally {
      setLinking(false);
    }
  }

  async function handleRemove(patientId: string) {
    setRemovingId(patientId);
    try {
      await fetch("/api/patients", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });
      fetchPatients();
    } finally {
      setRemovingId(null);
    }
  }

  const initials = (name: string | null, email: string) =>
    name ? name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : email[0].toUpperCase();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-ink">Mis pacientes</h1>
          <p className="text-sm text-muted mt-1">
            {loading ? "Cargando…" : `${patients.length} paciente${patients.length !== 1 ? "s" : ""} vinculado${patients.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => { setShowModal(true); setError(""); setSuccess(""); }}
          className="min-h-11 flex items-center gap-2 bg-primary hover:bg-primary-hi text-white text-sm font-semibold px-4 rounded-md transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Vincular <span className="hidden sm:inline">paciente</span>
        </button>
      </div>

      {success && (
        <div className="bg-primary-soft border border-primary rounded-md px-4 py-3 text-sm font-medium text-primary flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {success}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-surface rounded-lg border border-line animate-pulse" />
          ))}
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-surface rounded-lg border border-line p-8">
          <p className="font-semibold text-ink">No tenés pacientes vinculados todavía.</p>
          <p className="mt-1 text-sm text-muted">Agregá un paciente por email para habilitar seguimiento y turnos.</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 min-h-11 rounded-md bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hi transition-colors"
          >
            Vincular tu primer paciente
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map((p) => (
            <div key={p.id} className="bg-surface rounded-lg border border-line px-5 py-4 flex items-center gap-4">
              {p.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image} alt="" className="w-11 h-11 rounded-full flex-shrink-0" />
              ) : (
                <div className="w-11 h-11 bg-primary-soft rounded-full flex items-center justify-center text-primary font-semibold flex-shrink-0">
                  {initials(p.name, p.email)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink truncate">{p.name || "Sin nombre"}</p>
                <p className="text-sm text-muted truncate">{p.email}</p>
              </div>
              <button
                onClick={() => handleRemove(p.id)}
                disabled={removingId === p.id}
                className="min-h-11 text-sm text-muted hover:text-danger px-3 rounded-md hover:bg-danger-soft transition-colors flex-shrink-0 disabled:opacity-50"
              >
                {removingId === p.id ? "…" : "Desvincular"}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface rounded-lg shadow-2xl w-full max-w-sm overflow-hidden border border-line">
            <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-line">
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">Vincular paciente</h2>
                <p className="mt-1 text-sm text-muted">Usá el email de una cuenta paciente.</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                aria-label="Cerrar"
                className="flex h-11 w-11 items-center justify-center rounded-md text-muted hover:bg-surface-2 hover:text-ink transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleLink} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">
                  Email del paciente
                </label>
                <input
                  type="email"
                  required
                  placeholder="paciente@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  className={inputCls}
                />
                <p className="text-xs text-muted mt-1.5">El paciente debe tener una cuenta registrada como paciente.</p>
              </div>

              {error && (
                <div className="bg-danger-soft border border-danger rounded-md px-3 py-2 text-sm font-medium text-danger">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="min-h-11 flex-1 rounded-md border border-line-strong text-base font-semibold text-ink hover:bg-surface-2 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={linking}
                  className="min-h-11 flex-1 rounded-md bg-primary text-base font-semibold text-white hover:bg-primary-hi disabled:bg-surface-2 disabled:text-muted transition-colors"
                >
                  {linking ? "Vinculando…" : "Vincular"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
