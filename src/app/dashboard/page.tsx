import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WeekCalendar from "@/components/WeekCalendar";
import PendingAppointments from "@/components/PendingAppointments";
import { signIn } from "@/auth";
import ReviewsPanel from "@/components/ReviewsPanel";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "PATIENT") redirect("/patient");

  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [profile, upcomingCount, pendingCount, patientsCount] = await Promise.all([
    prisma.psychologistProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.appointment.count({
      where: {
        psychologistId: session.user.id,
        date: { gte: now, lte: weekEnd },
        status: "CONFIRMED",
      },
    }),
    prisma.appointment.count({
      where: {
        psychologistId: session.user.id,
        date: { gte: now },
        status: "PENDING",
      },
    }),
    prisma.user.count({ where: { psychologistId: session.user.id } }),
  ]);

  const hasGoogleCalendar = !!session.googleAccessToken;

  const completionFields = [
    session.user.name,
    profile?.specialty,
    profile?.licenseNumber,
    profile?.bio,
    profile?.consultationFee,
    profile?.slug,
  ];
  const completionPct = Math.round(
    (completionFields.filter(Boolean).length / completionFields.length) * 100
  );

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-lg border border-line bg-surface p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                className="w-14 h-14 rounded-full border border-line shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 bg-primary-soft rounded-full flex items-center justify-center text-primary text-xl font-bold border border-primary flex-shrink-0">
                {(session.user.name?.[0] ?? session.user.email?.[0] ?? "P").toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="font-display text-3xl font-semibold text-ink">
                Hola, {session.user.name?.split(" ")[0] || "psicólogo"}
              </h1>
              <p className="text-muted text-sm mt-1">
                {profile?.specialty ?? session.user.email}
              </p>
            </div>
          </div>
          {profile?.slug && (
            <Link
              href={`/p/${profile.slug}`}
              target="_blank"
              className="hidden min-h-11 sm:flex items-center gap-1.5 border border-line-strong bg-surface hover:bg-surface-2 text-ink text-sm font-semibold px-3 rounded-md transition-colors flex-shrink-0"
            >
              Ver perfil público
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          )}
        </div>

        {/* Profile completion */}
        {completionPct < 100 && (
          <div className="mt-5 pt-4 border-t border-line">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-muted">Perfil completado al {completionPct}%</span>
              <Link href="/dashboard/perfil" className="text-xs font-semibold text-primary hover:text-primary-hi underline">
                Completar
              </Link>
            </div>
            <div className="h-1.5 bg-surface-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-[width]"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Google Calendar status */}
        <div className="mt-4 pt-4 border-t border-line">
          {hasGoogleCalendar ? (
            <span className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-primary-soft px-3 text-sm font-semibold text-primary">
              <span className="w-1.5 h-1.5 bg-primary rounded-full inline-block" />
              Google Calendar conectado
            </span>
          ) : (
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo: "/dashboard" });
              }}
            >
              <button
                type="submit"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md border border-line-strong bg-surface px-3 text-sm font-semibold text-ink hover:bg-surface-2 transition-colors"
              >
                <span className="w-1.5 h-1.5 bg-pending rounded-full inline-block" />
                Conectar Google Calendar
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href="/dashboard/turnos"
          className="bg-surface rounded-lg border border-line p-4 text-center hover:border-primary hover:shadow-sm transition-colors group"
        >
          <p className="text-2xl font-bold text-primary group-hover:scale-110 transition-transform inline-block">
            {upcomingCount}
          </p>
          <p className="text-xs text-muted mt-0.5">Esta semana</p>
        </Link>
        <Link
          href="/dashboard/turnos"
          className={`bg-surface rounded-lg border p-4 text-center hover:shadow-sm transition-colors group ${
            pendingCount > 0 ? "border-pending bg-pending-soft/50" : "border-line"
          }`}
        >
          <p className={`text-2xl font-bold group-hover:scale-110 transition-transform inline-block ${pendingCount > 0 ? "text-pending" : "text-muted"}`}>
            {pendingCount}
          </p>
          <p className="text-xs text-muted mt-0.5">Solicitudes</p>
        </Link>
        <Link
          href="/dashboard/patients"
          className="bg-surface rounded-lg border border-line p-4 text-center hover:border-primary hover:shadow-sm transition-colors group"
        >
          <p className="text-2xl font-bold text-ink group-hover:scale-110 transition-transform inline-block">
            {patientsCount}
          </p>
          <p className="text-xs text-muted mt-0.5">Pacientes</p>
        </Link>
      </div>

      {/* Pending appointment requests */}
      <PendingAppointments />

      {/* Weekly calendar */}
      <WeekCalendar />

      {/* Reviews */}
      <ReviewsPanel title="Mis calificaciones" />
    </div>
  );
}
