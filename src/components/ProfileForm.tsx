"use client";

import { useState } from "react";
import type { PsychologistProfile } from "@prisma/client";

interface UserInfo {
  name: string;
  email: string;
  image: string | null;
}

interface Props {
  initialUser: UserInfo;
  initialProfile: PsychologistProfile | null;
}

const SPECIALTIES = [
  "Psicología Clínica",
  "Psicología Infantil y Adolescente",
  "Psicología de Pareja y Familia",
  "Neuropsicología",
  "Psicología Forense",
  "Psicología Organizacional",
  "Psicología Educativa",
  "Psicooncología",
  "Psicología del Deporte",
  "Otra",
];

const CURRENCIES = ["ARS", "USD", "EUR", "CLP", "COP", "MXN", "PEN", "UYU"];

function SectionTitle({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <h2 className="font-semibold text-gray-900 text-base">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputCls = "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
const selectCls = inputCls + " bg-white";

export default function ProfileForm({ initialUser, initialProfile }: Props) {
  const p = initialProfile;

  const [name, setName] = useState(initialUser.name);
  const [form, setForm] = useState({
    specialty: p?.specialty ?? "",
    licenseNumber: p?.licenseNumber ?? "",
    bio: p?.bio ?? "",
    phone: p?.phone ?? "",
    address: p?.address ?? "",
    city: p?.city ?? "",
    country: p?.country ?? "Argentina",
    yearsOfExperience: p?.yearsOfExperience?.toString() ?? "",
    consultationFee: p?.consultationFee?.toString() ?? "",
    currency: p?.currency ?? "ARS",
    languages: p?.languages ?? "",
    website: p?.website ?? "",
    instagram: p?.instagram ?? "",
    linkedin: p?.linkedin ?? "",
    sessionDuration: p?.sessionDuration?.toString() ?? "50",
    modalityOnline: p?.modalityOnline ?? false,
    modalityPresential: p?.modalityPresential ?? true,
    acceptsNewPatients: p?.acceptsNewPatients ?? true,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setSaved(false);
  };

  const toggle = (key: "modalityOnline" | "modalityPresential" | "acceptsNewPatients") => () => {
    setForm((f) => ({ ...f, [key]: !f[key] }));
    setSaved(false);
  };

  const completionFields = [
    name, form.specialty, form.licenseNumber, form.bio,
    form.phone, form.city, form.consultationFee,
  ];
  const completedCount = completionFields.filter(Boolean).length;
  const completionPct = Math.round((completedCount / completionFields.length) * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, name }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Error al guardar");
      } else {
        setSaved(true);
      }
    } catch {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Profile completion banner */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Completud del perfil</span>
          <span className="text-sm font-bold text-indigo-600">{completionPct}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        {completionPct < 100 && (
          <p className="text-xs text-gray-400 mt-2">
            Completa tu perfil para que los pacientes puedan encontrarte fácilmente.
          </p>
        )}
      </div>

      {/* Personal info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <SectionTitle
          icon={<svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
          title="Datos personales"
          subtitle="Tu nombre e información de contacto"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Nombre completo" required>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setSaved(false); }}
              placeholder="Lic. Ana García"
              className={inputCls}
              required
            />
          </Field>
          <Field label="Email">
            <input type="email" value={initialUser.email} disabled className={inputCls + " bg-gray-50 text-gray-400"} />
          </Field>
          <Field label="Teléfono de contacto">
            <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+54 9 11 1234-5678" className={inputCls} />
          </Field>
          <Field label="Años de experiencia">
            <input type="number" value={form.yearsOfExperience} onChange={set("yearsOfExperience")} min={0} max={60} placeholder="5" className={inputCls} />
          </Field>
          <Field label="Idiomas que hablas">
            <input type="text" value={form.languages} onChange={set("languages")} placeholder="Español, Inglés, Portugués" className={inputCls} />
          </Field>
        </div>
      </div>

      {/* Professional info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <SectionTitle
          icon={<svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          title="Información profesional"
          subtitle="Especialidad, matrícula y descripción"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Especialidad" required>
            <select value={form.specialty} onChange={set("specialty")} className={selectCls}>
              <option value="">Selecciona una especialidad</option>
              {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="N.° de matrícula / colegiado" required>
            <input type="text" value={form.licenseNumber} onChange={set("licenseNumber")} placeholder="MN 12345" className={inputCls} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Descripción profesional" required>
              <textarea
                value={form.bio}
                onChange={set("bio")}
                rows={4}
                placeholder="Contá a tus pacientes quién sos, tu enfoque terapéutico y en qué podés ayudarlos..."
                className={inputCls + " resize-none"}
              />
              <p className="text-xs text-gray-400 mt-1">{form.bio.length}/500 caracteres</p>
            </Field>
          </div>
        </div>
      </div>

      {/* Consultation settings */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <SectionTitle
          icon={<svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          title="Configuración de consultas"
          subtitle="Precio, duración y modalidad"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <Field label="Precio por sesión" required>
            <input type="number" value={form.consultationFee} onChange={set("consultationFee")} min={0} placeholder="5000" className={inputCls} />
          </Field>
          <Field label="Moneda">
            <select value={form.currency} onChange={set("currency")} className={selectCls}>
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Duración de sesión (min)">
            <input type="number" value={form.sessionDuration} onChange={set("sessionDuration")} min={20} max={180} step={5} className={inputCls} />
          </Field>
        </div>

        {/* Toggles */}
        <div className="space-y-3">
          {([
            ["modalityPresential", "Modalidad presencial", "Atendés pacientes en consultorio"],
            ["modalityOnline", "Modalidad online", "Atendés pacientes por videollamada"],
            ["acceptsNewPatients", "Acepto nuevos pacientes", "Tu perfil aparecerá disponible para nuevos turnos"],
          ] as const).map(([key, label, desc]) => (
            <button
              key={key}
              type="button"
              onClick={toggle(key)}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left"
            >
              <div>
                <p className="text-sm font-medium text-gray-800">{label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
              <div className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${form[key] ? "bg-indigo-600" : "bg-gray-200"}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form[key] ? "left-6" : "left-1"}`} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Location */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <SectionTitle
          icon={<svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          title="Ubicación del consultorio"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label="Dirección">
              <input type="text" value={form.address} onChange={set("address")} placeholder="Av. Corrientes 1234, Piso 3, Of. B" className={inputCls} />
            </Field>
          </div>
          <Field label="Ciudad">
            <input type="text" value={form.city} onChange={set("city")} placeholder="Buenos Aires" className={inputCls} />
          </Field>
          <Field label="País">
            <input type="text" value={form.country} onChange={set("country")} placeholder="Argentina" className={inputCls} />
          </Field>
        </div>
      </div>

      {/* Social / web */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <SectionTitle
          icon={<svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>}
          title="Presencia digital"
          subtitle="Opcional — ayuda a los pacientes a conocerte"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Sitio web">
            <input type="url" value={form.website} onChange={set("website")} placeholder="https://mi-consultorio.com" className={inputCls} />
          </Field>
          <Field label="Instagram">
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-lg">@</span>
              <input type="text" value={form.instagram} onChange={set("instagram")} placeholder="usuario" className={inputCls + " rounded-l-none"} />
            </div>
          </Field>
          <Field label="LinkedIn">
            <input type="url" value={form.linkedin} onChange={set("linkedin")} placeholder="https://linkedin.com/in/..." className={inputCls} />
          </Field>
        </div>
      </div>

      {/* Submit */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Perfil guardado correctamente
        </div>
      )}
      <button
        type="submit"
        disabled={saving}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors shadow-sm"
      >
        {saving ? "Guardando..." : "Guardar perfil"}
      </button>
    </form>
  );
}
