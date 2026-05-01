"use client";

import { useEffect, useState } from "react";

interface Profile {
  id: string;
  slug: string;
  specialty: string | null;
  licenseNumber: string | null;
  bio: string | null;
  consultationFee: number | null;
  currency: string;
  sessionDuration: number;
  cbu: string | null;
  alias: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
}

export default function ProfileSection() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    slug: "",
    specialty: "",
    licenseNumber: "",
    bio: "",
    consultationFee: "",
    currency: "ARS",
    sessionDuration: "50",
    cbu: "",
    alias: "",
    instagramUrl: "",
    linkedinUrl: "",
    websiteUrl: "",
  });

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data) {
          setProfile(data);
          setForm({
            slug: data.slug ?? "",
            specialty: data.specialty ?? "",
            licenseNumber: data.licenseNumber ?? "",
            bio: data.bio ?? "",
            consultationFee: data.consultationFee != null ? String(data.consultationFee) : "",
            currency: data.currency ?? "ARS",
            sessionDuration: String(data.sessionDuration ?? 50),
            cbu: data.cbu ?? "",
            alias: data.alias ?? "",
            instagramUrl: data.instagramUrl ?? "",
            linkedinUrl: data.linkedinUrl ?? "",
            websiteUrl: data.websiteUrl ?? "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: form.slug || undefined,
          specialty: form.specialty || null,
          licenseNumber: form.licenseNumber || null,
          bio: form.bio || null,
          consultationFee: form.consultationFee ? parseFloat(form.consultationFee) : null,
          currency: form.currency || "ARS",
          sessionDuration: parseInt(form.sessionDuration) || 50,
          cbu: form.cbu || null,
          alias: form.alias || null,
          instagramUrl: form.instagramUrl || null,
          linkedinUrl: form.linkedinUrl || null,
          websiteUrl: form.websiteUrl || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al guardar");
        return;
      }
      setProfile(data);
      setSaved(true);
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />;

  const publicUrl = form.slug ? `${window.location.origin}/p/${form.slug}` : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-900 text-sm">Perfil público</h2>
        {publicUrl && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-500 hover:text-indigo-700 mt-0.5 block truncate"
          >
            {publicUrl}
          </a>
        )}
      </div>

      <form onSubmit={handleSave} className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">URL pública (slug)</label>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <span className="px-3 py-2 bg-gray-50 text-xs text-gray-400 border-r border-gray-200 whitespace-nowrap">/p/</span>
              <input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })}
                className="flex-1 px-3 py-2 text-sm text-gray-900 focus:outline-none"
                placeholder="tu-nombre"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Especialidad</label>
            <input
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="Ej: Psicología clínica"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Matrícula</label>
            <input
              value={form.licenseNumber}
              onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="MN 12345"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Duración de sesión</label>
            <select
              value={form.sessionDuration}
              onChange={(e) => setForm({ ...form, sessionDuration: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="45">45 minutos</option>
              <option value="50">50 minutos</option>
              <option value="60">1 hora</option>
              <option value="90">1 hora 30 minutos</option>
              <option value="120">2 horas</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Honorarios</label>
            <div className="flex gap-2">
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none"
              >
                <option value="ARS">ARS</option>
                <option value="USD">USD</option>
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.consultationFee}
                onChange={(e) => setForm({ ...form, consultationFee: e.target.value })}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                placeholder="5000"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">CBU</label>
            <input
              value={form.cbu}
              onChange={(e) => setForm({ ...form, cbu: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 font-mono"
              placeholder="0000000000000000000000"
              maxLength={22}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Alias CBU</label>
            <input
              value={form.alias}
              onChange={(e) => setForm({ ...form, alias: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="nombre.apellido.banco"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Instagram</label>
            <input
              value={form.instagramUrl}
              onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              placeholder="https://instagram.com/..."
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-200 resize-none"
            placeholder="Contá un poco sobre vos..."
          />
        </div>

        {error && (
          <p className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
        )}
        {saved && (
          <p className="text-xs text-green-600 bg-green-50 rounded-lg px-3 py-2">Perfil guardado correctamente.</p>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? "Guardando..." : profile ? "Guardar cambios" : "Crear perfil"}
          </button>
        </div>
      </form>
    </div>
  );
}
