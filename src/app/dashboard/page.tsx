import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WeekCalendar from "@/components/WeekCalendar";
import PendingAppointments from "@/components/PendingAppointments";
import AvailabilityPanel from "@/components/AvailabilityPanel";
import { signIn } from "@/auth";
import ReviewsPanel from "@/components/ReviewsPanel";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "PATIENT") redirect("/patient");

  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const [profile, upcomingCount, pendingCount, patientsCount, todayApts] = await Promise.all([
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
    prisma.appointment.findMany({
      where: {
        psychologistId: session.user.id,
        status: { not: "CANCELLED" },
        date: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { date: "asc" },
      include: { patient: { select: { name: true, email: true } } },
    }),
  ]);

  // Fetch today's Google Calendar events server-side
  interface GCalEvent { summary?: string; start: { dateTime?: string }; end: { dateTime?: string }; htmlLink?: string }
  let todayGoogleEvents: GCalEvent[] = [];
  if (session.googleAccessToken) {
    try {
      const gcalUrl = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
      gcalUrl.searchParams.set("timeMin", todayStart.toISOString());
      gcalUrl.searchParams.set("timeMax", todayEnd.toISOString());
      gcalUrl.searchParams.set("singleEvents", "true");
      gcalUrl.searchParams.set("orderBy", "startTime");
      gcalUrl.searchParams.set("maxResults", "20");
      const gcalRes = await fetch(gcalUrl.toString(), {
        headers: { Authorization: `Bearer ${session.googleAccessToken}` },
        next: { revalidate: 0 },
      });
      if (gcalRes.ok) {
        const gcalData = await gcalRes.json();
        todayGoogleEvents = (gcalData.items ?? []).filter((e: GCalEvent) => e.start?.dateTime);
      }
    } catch { /* ignore */ }
  }

  const fmtTime = (d: Date) => d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

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
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={session.user.image}
                alt=""
                className="w-14 h-14 rounded-full border-2 border-white/30 shadow-sm flex-shrink-0"
              />
            ) : (
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white text-xl font-bold border-2 border-white/30 flex-shrink-0">
                {(session.user.name?.[0] ?? session.user.email?.[0] ?? "P").toUpperCase()}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold">
                Hola, {session.user.name?.split(" ")[0] || "psicólogo"}
              </h1>
              <p className="text-indigo-200 text-sm mt-0.5">
                {profile?.specialty ?? session.user.email}
              </p>
            </div>
          </div>
          {profile?.slug && (
            <Link
              href={`/p/${profile.slug}`}
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors flex-shrink-0"
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
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-indigo-200">Perfil completado al {completionPct}%</span>
              <Link href="/dashboard/perfil" className="text-xs text-white/70 hover:text-white underline">
                Completar
              </Link>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/60 rounded-full transition-all"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>
        )}

        {/* Google Calendar status */}
        <div className="mt-4 pt-4 border-t border-white/10">
          {hasGoogleCalendar ? (
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
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
                className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 text-amber-200 hover:text-white text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
              >
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block" />
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
          className="bg-white rounded-2xl border border-gray-200 p-4 text-center hover:border-indigo-300 hover:shadow-sm transition-all group"
        >
          <p className="text-2xl font-bold text-indigo-600 group-hover:scale-110 transition-transform inline-block">
            {upcomingCount}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Esta semana</p>
        </Link>
        <Link
          href="/dashboard/turnos"
          className={`bg-white rounded-2xl border p-4 text-center hover:shadow-sm transition-all group ${
            pendingCount > 0 ? "border-amber-300 bg-amber-50/50" : "border-gray-200"
          }`}
        >
          <p className={`text-2xl font-bold group-hover:scale-110 transition-transform inline-block ${pendingCount > 0 ? "text-amber-600" : "text-gray-400"}`}>
            {pendingCount}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Solicitudes</p>
        </Link>
        <Link
          href="/dashboard/patients"
          className="bg-white rounded-2xl border border-gray-200 p-4 text-center hover:border-indigo-300 hover:shadow-sm transition-all group"
        >
          <p className="text-2xl font-bold text-gray-700 group-hover:scale-110 transition-transform inline-block">
            {patientsCount}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Pacientes</p>
        </Link>
      </div>

      {/* Today's agenda */}
      {(todayApts.length > 0 || todayGoogleEvents.length > 0) && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Agenda de hoy</p>
            <span className="text-xs bg-indigo-100 text-indigo-700 font-medium px-2 py-0.5 rounded-full">
              {todayApts.length + todayGoogleEvents.length} evento{todayApts.length + todayGoogleEvents.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {/* Internal appointments */}
            {todayApts.map((apt) => {
              const d = new Date(apt.date);
              const name = apt.patient?.name ?? apt.patientName ?? apt.patient?.email ?? apt.patientEmail ?? "Paciente";
              const isConfirmed = apt.status === "CONFIRMED";
              return (
                <div key={apt.id} className="px-5 py-3 flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isConfirmed ? "bg-emerald-500" : "bg-amber-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                    <p className="text-xs text-gray-400">{fmtTime(d)} · {apt.duration} min</p>
                  </div>
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                    isConfirmed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {isConfirmed ? "Confirmado" : "Pendiente"}
                  </span>
                </div>
              );
            })}
            {/* Google Calendar events */}
            {todayGoogleEvents.map((evt, i) => {
              const startTime = evt.start.dateTime ? fmtTime(new Date(evt.start.dateTime)) : "";
              const endTime = evt.end?.dateTime ? fmtTime(new Date(evt.end.dateTime)) : "";
              return (
                <a
                  key={i}
                  href={evt.htmlLink ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-indigo-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{evt.summary ?? "Evento"}</p>
                    <p className="text-xs text-gray-400">{startTime}{endTime ? ` – ${endTime}` : ""}</p>
                  </div>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 bg-indigo-50 text-indigo-600">
                    Google Cal
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Weekly availability */}
      <AvailabilityPanel />

      {/* Pending appointment requests */}
      <PendingAppointments />

      {/* Weekly calendar */}
      <WeekCalendar />

      {/* Reviews */}
      <ReviewsPanel title="Mis calificaciones" />
    </div>
  );
}
