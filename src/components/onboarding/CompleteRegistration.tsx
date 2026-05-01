"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Role = "PATIENT" | "PSYCHOLOGIST";

export default function CompleteRegistration({
  initialRole,
  initialName,
  email,
}: {
  initialRole: Role;
  initialName: string;
  email: string;
}) {
  const router = useRouter();
  const [role, setRole] = useState<Role>(initialRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: initialName,
    dni: "",
    phone: "",
    licenseNumber: "",
    specialty: "",
    modality: "",
    consultationFee: "",
  });

  function setField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError("");
  }

  async function submit() {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role,
          name: form.name,
          dni: form.dni,
          phone: form.phone,
          licenseNumber: form.licenseNumber,
          specialty: form.specialty,
          modality: form.modality,
          consultationFee: form.consultationFee,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "No se pudo completar el registro");
        return;
      }

      router.push(data.redirectTo || (role === "PSYCHOLOGIST" ? "/dashboard" : "/patient"));
      router.refresh();
    } catch {
      setError("Error de conexión. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-template">
      <div className="shell">
        <div className="left">
          <div className="left-logo">
            <Image src="/logo_final.png" alt="Mi Terapia" width={38} height={38} className="brand-logo" priority />
            <span className="logo-text">Mi Terapia</span>
          </div>
          <div className="left-body">
            <div className="left-tag">
              <span className="h-2 w-2 rounded-full bg-[#7FA98A]" />
              Último paso
            </div>
            <div className="left-h">Completá tu perfil<br />para empezar.</div>
            <div className="left-sub">
              Ya vinculaste tu cuenta de Google. Ahora necesitamos los datos básicos del rol que elegiste.
            </div>
          </div>
          <div className="left-footer">
            <span>© 2026 Mi Terapia</span>
          </div>
        </div>

        <div className="right">
          <div className="auth-box">
            <div className="mobile-logo">
              <Image src="/logo_final.png" alt="Mi Terapia" width={38} height={38} className="brand-logo" priority />
              <span>Mi Terapia</span>
            </div>

            <div className="auth-h">Completar registro</div>
            <div className="auth-sub">{email}</div>

            <div className="role-grid role-grid-spaced">
              {[
                { id: "PATIENT" as Role, icon: "🧠", label: "Paciente", sub: "Agendar y gestionar turnos" },
                { id: "PSYCHOLOGIST" as Role, icon: "💼", label: "Psicólogo", sub: "Gestionar agenda y pacientes" },
              ].map((option) => (
                <div key={option.id} className={`role-card ${role === option.id ? "selected" : ""}`} onClick={() => setRole(option.id)}>
                  <div className="role-icon">{option.icon}</div>
                  <div className="role-label">{option.label}</div>
                  <div className="role-sub">{option.sub}</div>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">Nombre completo</label>
              <input className="form-input" value={form.name} onChange={(e) => setField("name", e.target.value)} />
            </div>

            {role === "PATIENT" ? (
              <>
                <div className="form-group">
                  <label className="form-label">DNI</label>
                  <input className="form-input" placeholder="38.492.101" value={form.dni} onChange={(e) => setField("dni", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Teléfono <span>(opcional)</span></label>
                  <input className="form-input" placeholder="+54 11 0000-0000" value={form.phone} onChange={(e) => setField("phone", e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label">Número de matrícula</label>
                  <input className="form-input" placeholder="MN 00000" value={form.licenseNumber} onChange={(e) => setField("licenseNumber", e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Especialidad principal</label>
                  <select className="form-input selectable" value={form.specialty} onChange={(e) => setField("specialty", e.target.value)}>
                    <option value="">Seleccioná…</option>
                    {["Psicología clínica", "TCC", "Psicoanálisis", "Psicología infantil", "Terapia de pareja", "Neuropsicología", "Otra"].map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Valor de la sesión (ARS)</label>
                  <input className="form-input" placeholder="4500" value={form.consultationFee} onChange={(e) => setField("consultationFee", e.target.value)} />
                </div>
              </>
            )}

            {error && <div className="form-error form-error-bottom">⚠ {error}</div>}

            <button className="submit-btn submit-login" type="button" disabled={loading} onClick={submit}>
              {loading ? "Guardando..." : "Finalizar registro"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
