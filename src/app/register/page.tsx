"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import GoogleButton from "@/components/GoogleButton";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Role = "PATIENT" | "PSYCHOLOGIST";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("PATIENT");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputClass =
    "min-h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-base text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Error al registrar");
        return;
      }
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.ok) {
        router.push(role === "PSYCHOLOGIST" ? "/dashboard" : "/patient");
      } else {
        router.push("/login");
      }
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg text-ink">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_460px] lg:px-10">
        <div className="hidden max-w-xl lg:block">
          <Link href="/" className="font-display text-2xl font-semibold text-ink">
            PsicoLink
          </Link>
          <p className="mt-12 text-sm font-semibold uppercase tracking-normal text-primary">
            Empezá con el rol correcto
          </p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-ink">
            Una cuenta para reservar o gestionar terapia.
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted">
            Pacientes reservan turnos con disponibilidad real. Profesionales reciben
            solicitudes, pagos y calendario desde un panel de trabajo.
          </p>
        </div>

        <div className="w-full rounded-lg border border-line bg-surface p-6 shadow-sm sm:p-8">
          <Link href="/" className="mb-8 block font-display text-2xl font-semibold text-ink lg:hidden">
            PsicoLink
          </Link>
          <div className="mb-6">
            <h1 className="font-display text-4xl font-semibold text-ink">Crear cuenta</h1>
            <p className="mt-2 text-base text-muted">Elegí tu rol para comenzar</p>
          </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole("PATIENT")}
            className={`min-h-[116px] rounded-md border p-4 text-left transition-colors ${
              role === "PATIENT"
                ? "border-primary bg-primary-soft text-primary"
                : "border-line-strong bg-surface text-muted hover:bg-surface-2"
            }`}
          >
            <span className="block text-base font-semibold text-ink">Paciente</span>
            <span className="mt-2 block text-xs leading-5">Reservá turnos con tu psicólogo</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("PSYCHOLOGIST")}
            className={`min-h-[116px] rounded-md border p-4 text-left transition-colors ${
              role === "PSYCHOLOGIST"
                ? "border-primary bg-primary-soft text-primary"
                : "border-line-strong bg-surface text-muted hover:bg-surface-2"
            }`}
          >
            <span className="block text-base font-semibold text-ink">Psicólogo</span>
            <span className="mt-2 block text-xs leading-5">Gestioná tu agenda y pacientes</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">Nombre completo</label>
            <input
              name="name"
              type="text"
              required
              placeholder="Juan García"
              value={form.name}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="juan@ejemplo.com"
              value={form.email}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">Contraseña</label>
            <input
              name="password"
              type="password"
              required
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={handleChange}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">Confirmar contraseña</label>
            <input
              name="confirm"
              type="password"
              required
              placeholder="Repite tu contraseña"
              value={form.confirm}
              onChange={handleChange}
              className={inputClass}
            />
          </div>

          {error && (
            <div className="rounded-md border border-danger bg-danger-soft px-3 py-2 text-sm font-medium text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="min-h-11 w-full rounded-md bg-primary px-4 text-base font-semibold text-white transition-colors hover:bg-primary-hi disabled:bg-surface-2 disabled:text-muted"
          >
            {loading ? "Creando cuenta..." : `Crear cuenta como ${role === "PSYCHOLOGIST" ? "psicólogo" : "paciente"}`}
          </button>
        </form>

        <div className="mt-6 flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-line" />
          <span className="text-sm text-muted">o</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        <div className="mt-6">
          <GoogleButton label="Registrarme con Google" />
          <p className="mt-2 text-sm text-muted">
            Te preguntamos si sos paciente o psicólogo apenas entres.
          </p>
        </div>

        <p className="mt-6 text-base text-muted">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
      </section>
    </main>
  );
}
