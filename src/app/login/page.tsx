"use client";

import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import GoogleButton from "@/components/GoogleButton";
import { Suspense } from "react";

function LoginForm() {
  const router = useRouter();
  const { update } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? undefined;
  const authError = searchParams.get("error");

  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(() => {
    if (authError === "OAuthAccountNotLinked") {
      return "Este email ya existe. Ahora podés volver a intentar entrar con Google para vincularlo.";
    }

    if (authError) {
      return "No se pudo iniciar sesión con Google. Intenta nuevamente.";
    }

    return "";
  });
  const [loading, setLoading] = useState(false);
  const inputClass =
    "min-h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-base text-ink outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        redirect: false,
      });
      if (result?.ok) {
        const session = await update();
        const role = session?.user?.role;
        router.push(callbackUrl ?? (role === "PSYCHOLOGIST" ? "/dashboard" : "/patient"));
      } else {
        setError("Email o contraseña incorrectos");
      }
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-bg text-ink">
      <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_420px] lg:px-10">
        <div className="hidden max-w-xl lg:block">
          <Link href="/" className="font-display text-2xl font-semibold text-ink">
            PsicoLink
          </Link>
          <p className="mt-12 text-sm font-semibold uppercase tracking-normal text-primary">
            Agenda clara para terapia
          </p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-ink">
            Volvé a tus turnos sin perder el hilo.
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted">
            Pacientes y profesionales entran al mismo sistema: solicitudes, pagos y
            calendario con estados simples.
          </p>
        </div>

        <div className="w-full rounded-lg border border-line bg-surface p-6 shadow-sm sm:p-8">
          <Link href="/" className="mb-8 block font-display text-2xl font-semibold text-ink lg:hidden">
            PsicoLink
          </Link>
          <div className="mb-8">
            <h1 className="font-display text-4xl font-semibold text-ink">Iniciar sesión</h1>
            <p className="mt-2 text-base text-muted">Bienvenido de vuelta</p>
          </div>

        <GoogleButton label="Entrar con Google" callbackUrl={callbackUrl} />

        <div className="flex items-center gap-3 my-6">
          <hr className="flex-1 border-line" />
          <span className="text-xs font-semibold uppercase tracking-normal text-muted">O con email</span>
          <hr className="flex-1 border-line" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
              placeholder="Tu contraseña"
              value={form.password}
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
            {loading ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-6 text-base text-muted">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Regístrate gratis
          </Link>
        </p>
      </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
