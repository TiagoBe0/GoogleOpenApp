import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import BookingWidget from "@/components/BookingWidget";
import LinkPsychologistButton from "@/components/LinkPsychologistButton";
import { auth } from "@/auth";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params;

  const profile = await prisma.psychologistProfile.findUnique({
    where: { slug },
    include: {
      user: { select: { name: true, email: true, image: true } },
    },
  });

  if (!profile) notFound();

  const session = await auth();
  const isRegistered = !!session && session.user.role === "PATIENT";

  // El botón de vincular solo tiene sentido para un paciente registrado que
  // todavía no eligió profesional. Quien ya tiene uno reserva desde su panel.
  const myPsychologistId = isRegistered
    ? (
        await prisma.user.findUnique({
          where: { id: session!.user.id },
          select: { psychologistId: true },
        })
      )?.psychologistId ?? null
    : null;
  const canLink = isRegistered && !myPsychologistId;
  const alreadyMine = myPsychologistId === profile.userId;

  const initials = profile.user.name
    ? profile.user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : (profile.user.email?.[0] ?? "P").toUpperCase();

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-line bg-surface py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <span className="font-display text-lg font-semibold text-ink">
            PsicoLink
          </span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-surface rounded-lg border border-line p-6">
              {profile.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.user.image}
                  alt=""
                  className="w-24 h-24 rounded-full mb-4 object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full mb-4 bg-primary-soft flex items-center justify-center text-primary text-2xl font-bold">
                  {initials}
                </div>
              )}
              <h1 className="font-display text-2xl font-semibold text-ink">
                {profile.user.name || "Psicólogo/a"}
              </h1>
              {profile.specialty && (
                <p className="text-sm text-muted mt-1">{profile.specialty}</p>
              )}
              {profile.licenseNumber && (
                <p className="text-xs text-muted mt-1">Matrícula: {profile.licenseNumber}</p>
              )}
            </div>

            {profile.bio && (
              <div className="bg-surface rounded-lg border border-line p-5">
                <h2 className="text-sm font-semibold text-ink mb-2">Sobre mí</h2>
                <p className="text-sm text-muted leading-relaxed">{profile.bio}</p>
              </div>
            )}

            <div className="bg-surface rounded-lg border border-line p-5 space-y-3">
              <h2 className="text-sm font-semibold text-ink">Información</h2>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Duración</span>
                <span className="text-ink font-semibold">{profile.sessionDuration} min</span>
              </div>
              {profile.consultationFee && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted">Honorarios</span>
                  <span className="text-ink font-semibold">
                    {profile.currency} {profile.consultationFee.toLocaleString("es-AR")}
                  </span>
                </div>
              )}
            </div>

            {(profile.instagramUrl || profile.linkedinUrl || profile.websiteUrl) && (
              <div className="bg-surface rounded-lg border border-line p-5 space-y-2">
                <h2 className="text-sm font-semibold text-ink mb-1">Contacto</h2>
                {profile.instagramUrl && (
                  <a href={profile.instagramUrl} target="_blank" rel="noopener noreferrer"
                    className="flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:text-primary-hi transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                    Instagram
                  </a>
                )}
                {profile.linkedinUrl && (
                  <a href={profile.linkedinUrl} target="_blank" rel="noopener noreferrer"
                    className="flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:text-primary-hi transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    LinkedIn
                  </a>
                )}
                {profile.websiteUrl && (
                  <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer"
                    className="flex min-h-11 items-center gap-2 text-sm font-medium text-primary hover:text-primary-hi transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
                    </svg>
                    Sitio web
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Booking widget */}
          <div className="lg:col-span-2">
            <div className="mb-5">
              <h2 className="font-display text-3xl font-semibold text-ink">
                Reservar turno
              </h2>
              <p className="text-sm text-muted mt-1">
                Seleccioná un día y horario disponible para tu consulta.
              </p>
            </div>
            <BookingWidget
              psychologistId={profile.userId}
              profile={{
                sessionDuration: profile.sessionDuration,
                consultationFee: profile.consultationFee,
                currency: profile.currency,
              }}
              isRegistered={isRegistered}
            />

            {canLink && (
              <div className="mt-6 border-t border-line pt-6">
                <LinkPsychologistButton
                  slug={slug}
                  name={profile.user.name ?? "este profesional"}
                />
              </div>
            )}
            {alreadyMine && (
              <p className="mt-6 border-t border-line pt-6 text-sm text-muted">
                Es tu profesional de cabecera. También podés reservar desde{" "}
                <Link href="/patient" className="font-medium text-primary hover:text-primary-hi">
                  tu panel
                </Link>
                .
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
