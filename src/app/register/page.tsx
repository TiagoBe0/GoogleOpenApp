"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import GoogleButton from "@/components/GoogleButton";

type Role = "PATIENT" | "PSYCHOLOGIST";

export default function RegisterPage() {
  const [role, setRole] = useState<Role>("PATIENT");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
      const target = role === "PSYCHOLOGIST" ? "/dashboard" : "/patient";
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
        redirectTo: target,
      });
      if (result?.ok) {
        window.location.assign(target);
        return;
      }
      setError("La cuenta se creó, pero no se pudo iniciar sesión automáticamente. Probá iniciar sesión.");
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Crear cuenta</h1>
          <p className="text-gray-500 text-sm mt-1">Elegí tu rol para comenzar</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            onClick={() => setRole("PATIENT")}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              role === "PATIENT"
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-sm font-semibold">Paciente</span>
            <span className="text-[11px] text-center leading-tight opacity-70">Reservá turnos con tu psicólogo</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("PSYCHOLOGIST")}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
              role === "PSYCHOLOGIST"
                ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                : "border-gray-200 text-gray-500 hover:border-gray-300"
            }`}
          >
            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-sm font-semibold">Psicólogo</span>
            <span className="text-[11px] text-center leading-tight opacity-70">Gestioná tu agenda y pacientes</span>
          </button>
        </div>

        <GoogleButton
          label={`Registrarse con Google como ${role === "PSYCHOLOGIST" ? "psicólogo" : "paciente"}`}
          callbackUrl={`/auth/complete?role=${role}`}
        />

        <div className="flex items-center gap-3 my-6">
          <hr className="flex-1 border-gray-200" />
          <span className="text-xs text-gray-400 font-medium">O con email</span>
          <hr className="flex-1 border-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
            <input
              name="name"
              type="text"
              required
              placeholder="Juan García"
              value={form.name}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="juan@ejemplo.com"
              value={form.email}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              name="password"
              type="password"
              required
              placeholder="Mínimo 8 caracteres"
              value={form.password}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
            <input
              name="confirm"
              type="password"
              required
              placeholder="Repite tu contraseña"
              value={form.confirm}
              onChange={handleChange}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
          >
            {loading ? "Creando cuenta..." : `Crear cuenta como ${role === "PSYCHOLOGIST" ? "psicólogo" : "paciente"}`}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="text-indigo-600 font-medium hover:underline">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
