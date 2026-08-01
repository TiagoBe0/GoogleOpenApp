import Link from "next/link";
import type { Metadata } from "next";
import { listPsychologists, type DirectoryEntry } from "@/lib/psychologists";

export const metadata: Metadata = {
  title: "Psicólogos disponibles — PsicoLink",
  description:
    "Encontrá un psicólogo por especialidad, mirá su experiencia y reservá tu turno online.",
};

function initials(name: string | null) {
  if (!name) return "P";
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatFee(fee: number | null, currency: string, minutes: number) {
  if (fee == null) return "Consultar honorarios";
  const amount = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(fee);
  return `${amount} · ${minutes} min`;
}

function Stars({ average }: { average: number }) {
  return (
    <span className="text-pending" aria-hidden>
      {"★".repeat(Math.round(average))}
      <span className="text-line-strong">{"★".repeat(5 - Math.round(average))}</span>
    </span>
  );
}

function Card({ p }: { p: DirectoryEntry }) {
  return (
    <li className="rounded-lg border border-line bg-surface p-5 transition-colors hover:border-primary">
      <div className="flex gap-4">
        {p.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={p.image} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary-soft font-display text-lg font-semibold text-primary-hi">
            {initials(p.name)}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-xl font-semibold text-ink">{p.name ?? "Profesional"}</h2>
          {p.specialty && <p className="mt-0.5 text-sm text-muted">{p.specialty}</p>}
          {p.licenseNumber && (
            <p className="mt-0.5 text-xs text-muted">Matrícula {p.licenseNumber}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            {p.rating.count > 0 ? (
              <span className="flex items-center gap-1.5">
                <Stars average={p.rating.average} />
                <span className="text-muted tabular-nums">
                  {p.rating.average} · {p.rating.count}{" "}
                  {p.rating.count === 1 ? "opinión" : "opiniones"}
                </span>
              </span>
            ) : (
              <span className="text-muted">Sin opiniones todavía</span>
            )}
            <span className="font-medium text-ink tabular-nums">
              {formatFee(p.consultationFee, p.currency, p.sessionDuration)}
            </span>
          </div>

          {p.bio && <p className="mt-3 text-sm leading-relaxed text-muted">{p.bio}</p>}
        </div>
      </div>

      <div className="mt-4 flex justify-end border-t border-line pt-4">
        <Link
          href={`/p/${p.slug}`}
          className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-hi"
        >
          Ver perfil y reservar
        </Link>
      </div>
    </li>
  );
}

export default async function PsicologosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const results = await listPsychologists(q);

  return (
    <main className="min-h-screen bg-bg">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-4">
          <Link href="/" className="font-display text-lg font-semibold text-ink">
            PsicoLink
          </Link>
          <Link
            href="/login"
            className="inline-flex min-h-11 items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
          >
            Iniciar sesión
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-display text-3xl font-semibold text-ink">Psicólogos disponibles</h1>
        <p className="mt-2 max-w-prose text-muted">
          Mirá la experiencia de cada profesional y reservá directamente el horario que te sirva.
        </p>

        {/* Formulario GET: la búsqueda anda sin JavaScript y queda en la URL,
            así se puede compartir y el buscador la puede indexar. */}
        <form method="get" className="mt-6 flex gap-2">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre o especialidad"
            aria-label="Buscar por nombre o especialidad"
            className="min-h-11 flex-1 rounded-md border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-muted focus:border-primary focus:outline-2 focus:outline-offset-1 focus:outline-primary"
          />
          <button
            type="submit"
            className="inline-flex min-h-11 items-center rounded-md bg-primary px-5 text-sm font-semibold text-white transition-colors hover:bg-primary-hi"
          >
            Buscar
          </button>
        </form>

        <p className="mt-6 text-sm text-muted tabular-nums">
          {results.length}{" "}
          {results.length === 1 ? "profesional disponible" : "profesionales disponibles"}
          {q && ` para "${q}"`}
        </p>

        {results.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-line-strong bg-surface p-10 text-center">
            <p className="font-display text-lg text-ink">
              {q ? "Ninguna búsqueda coincide" : "Todavía no hay profesionales publicados"}
            </p>
            <p className="mx-auto mt-2 max-w-prose text-sm text-muted">
              {q
                ? "Probá con otra especialidad, o mirá el listado completo."
                : "Cuando un profesional complete su perfil, va a aparecer acá."}
            </p>
            {q && (
              <Link
                href="/psicologos"
                className="mt-5 inline-flex min-h-11 items-center rounded-md border border-line-strong bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
              >
                Ver todos
              </Link>
            )}
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {results.map((p) => (
              <Card key={p.id} p={p} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
