import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-bg text-ink">
      <section className="mx-auto flex min-h-[88vh] w-full max-w-6xl flex-col px-5 py-5 sm:px-8 lg:px-10">
        <nav className="flex items-center justify-between gap-4">
          <Link href="/" className="font-display text-2xl font-semibold text-ink">
            PsicoLink
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/psicologos"
              className="flex min-h-11 items-center rounded-md px-4 text-base font-semibold text-ink transition-colors hover:bg-surface-2"
            >
              Buscar psicólogo
            </Link>
            <Link
              href="/login"
              className="flex min-h-11 items-center rounded-md border border-line-strong bg-surface px-4 text-base font-semibold text-ink transition-colors hover:bg-surface-2"
            >
              Iniciar sesión
            </Link>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1fr_440px] lg:py-14">
          <div className="max-w-2xl">
            <p className="mb-4 text-sm font-semibold uppercase tracking-normal text-primary">
              Turnos de terapia, claros desde el primer contacto
            </p>
            <h1 className="font-display text-5xl font-semibold leading-tight text-ink sm:text-6xl">
              PsicoLink
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted">
              Reservá con tu psicólogo, pagá online y recibí la confirmación profesional
              sin perseguir mensajes sueltos. Para consultorios que necesitan una agenda
              simple y pacientes que necesitan confianza.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {/* Una sola acción primaria por vista (DESIGN.md). Para quien
                  llega sin profesional, buscar es el primer paso real. */}
              <Link
                href="/psicologos"
                className="flex min-h-11 items-center justify-center rounded-md bg-primary px-6 text-base font-semibold text-white transition-colors hover:bg-primary-hi"
              >
                Buscar psicólogo
              </Link>
              <Link
                href="/register"
                className="flex min-h-11 items-center justify-center rounded-md border border-line-strong bg-surface px-6 text-base font-semibold text-ink transition-colors hover:bg-surface-2"
              >
                Crear cuenta gratis
              </Link>
              <Link
                href="/login"
                className="flex min-h-11 items-center justify-center rounded-md border border-line-strong bg-surface px-6 text-base font-semibold text-ink transition-colors hover:bg-surface-2"
              >
                Entrar a mi agenda
              </Link>
            </div>
            <div className="mt-8 grid max-w-xl gap-3 text-base text-muted sm:grid-cols-3">
              <p>
                <span className="block font-semibold text-ink">Turnos online</span>
                Reserva sin llamadas.
              </p>
              <p>
                <span className="block font-semibold text-ink">Agenda sincronizada</span>
                Google Calendar integrado.
              </p>
              <p>
                <span className="block font-semibold text-ink">Pago seguro</span>
                Confirmación en un flujo.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-line bg-surface p-4 shadow-sm">
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <p className="text-sm font-semibold text-muted">Hoy</p>
                <h2 className="mt-1 font-display text-3xl font-semibold text-ink">
                  Agenda profesional
                </h2>
              </div>
              <span className="rounded-sm bg-primary-soft px-3 py-1 text-sm font-semibold text-primary">
                Sincronizada
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <article className="rounded-md border border-line bg-bg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink">Lucia M.</p>
                    <p className="mt-1 text-sm text-muted">Primera entrevista online</p>
                  </div>
                  <time className="font-semibold tabular-nums text-primary">10:30</time>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <span className="rounded-sm bg-primary-soft px-2 py-1 font-semibold text-primary">
                    Confirmado
                  </span>
                  <span className="text-muted">Pago registrado</span>
                </div>
              </article>

              <article className="rounded-md border border-line bg-bg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink">Marcos R.</p>
                    <p className="mt-1 text-sm text-muted">Consulta de seguimiento</p>
                  </div>
                  <time className="font-semibold tabular-nums text-pending">15:00</time>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm">
                  <span className="rounded-sm bg-pending-soft px-2 py-1 font-semibold text-pending">
                    Pendiente
                  </span>
                  <span className="text-muted">Esperando confirmación</span>
                </div>
              </article>
            </div>

            <div className="mt-4 rounded-md bg-surface-2 p-4">
              <p className="text-sm font-semibold text-muted">Próximo espacio libre</p>
              <p className="mt-1 text-lg font-semibold text-ink">Jueves, 17:30</p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-surface-2">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-8 sm:px-8 md:grid-cols-3 lg:px-10">
          <p className="text-base leading-7 text-muted">
            <span className="block font-semibold text-ink">Para pacientes</span>
            Encontrá disponibilidad real y dejá el turno resuelto.
          </p>
          <p className="text-base leading-7 text-muted">
            <span className="block font-semibold text-ink">Para profesionales</span>
            Gestioná solicitudes, pagos y calendario desde un solo panel.
          </p>
          <p className="text-base leading-7 text-muted">
            <span className="block font-semibold text-ink">Para el día a día</span>
            Estados simples: confirmado, pendiente o cancelado.
          </p>
        </div>
      </section>
    </main>
  );
}
