import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import WeekCalendar from "@/components/WeekCalendar";
import PendingAppointments from "@/components/PendingAppointments";
import { signIn } from "@/auth";
import ReviewsPanel from "@/components/ReviewsPanel";
import ProfileSection from "@/components/ProfileSection";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.isActive === false) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/dashboard/admin/users");
  if (session.user.role === "PATIENT") redirect("/patient");

  const profile = await prisma.psychologistProfile.findUnique({
    where: { userId: session.user.id },
  });

  const hasGoogleCalendar = !!session.googleAccessToken;

  const now = new Date();
  const upcomingConfirmed = await prisma.appointment.findMany({
    where: {
      psychologistId: session.user.id,
      status: { in: ["CONFIRMED", "confirmed"] },
      date: { gte: now },
    },
    include: {
      patient: { select: { name: true, email: true, image: true } },
    },
    orderBy: { date: "asc" },
    take: 5,
  });

  const completionFields = [
    session.user.name,
    profile?.specialty,
    profile?.licenseNumber,
    profile?.bio,
    profile?.phone,
    profile?.city,
    profile?.consultationFee,
  ];
  const completedCount = completionFields.filter(Boolean).length;
  const completionPct = Math.round((completedCount / completionFields.length) * 100);

  const fmt = (d: Date) =>
    d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
        <div className="flex items-center gap-4">
          {session.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={session.user.image} alt="" className="w-14 h-14 rounded-full border-2 border-white/30 shadow-sm" />
          ) : (
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white text-xl font-bold border-2 border-white/30">
              {session.user.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) ?? "P"}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold">Hola, {session.user.name?.split(" ")[0] || "usuario"}</h1>
            <p className="text-indigo-200 text-sm mt-0.5">{session.user.email}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center gap-3">
          {hasGoogleCalendar ? (
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
              Google Calendar conectado
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-amber-200 text-xs font-medium px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block" />
              Google Calendar no vinculado
            </span>
          )}
          {completionPct < 100 && (
            <span className="inline-flex items-center gap-1.5 bg-white/15 text-amber-200 text-xs font-medium px-3 py-1.5 rounded-full">
              Perfil {completionPct}% completo
            </span>
          )}
        </div>
      </div>

      {/* Connect Google Calendar */}
      {!hasGoogleCalendar && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">Vincula tu Google Calendar</h2>
              <p className="text-gray-500 text-sm mt-1">
                Conecta tu cuenta de Google para ver tus próximos eventos directamente aquí.
              </p>
              <form
                action={async () => {
                  "use server";
                  await signIn("google", { redirectTo: "/dashboard" });
                }}
              >
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  Conectar con Google
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Pending appointment requests */}
      <PendingAppointments />

      {/* Upcoming confirmed appointments */}
      {upcomingConfirmed.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm">Próximos turnos confirmados</h2>
            <Link href="/dashboard/turnos" className="text-xs text-indigo-600 hover:underline font-medium">
              Ver todos
            </Link>
          </div>
          <div className="divide-y divide-gray-100">
            {upcomingConfirmed.map((apt) => {
              const d = new Date(apt.date);
              const patientName = apt.patient?.name || apt.patientName || apt.patient?.email || apt.patientEmail || "Paciente";
              return (
                <div key={apt.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="text-center bg-indigo-50 rounded-xl px-3 py-2 min-w-[80px] flex-shrink-0">
                    <p className="text-xs text-indigo-500 font-medium">{fmt(d)}</p>
                    <p className="text-base font-bold text-indigo-700">{fmtTime(d)}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">{patientName}</p>
                    <p className="text-xs text-gray-400">{apt.duration} min</p>
                  </div>
                  <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-lg font-medium flex-shrink-0">
                    Confirmado
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Public profile editor */}
      <ProfileSection />

      {/* Reviews */}
      <ReviewsPanel title="Mis calificaciones" />

      {/* Weekly calendar */}
      {hasGoogleCalendar && <WeekCalendar psychologistId={session.user.id} hasGoogleCalendar={hasGoogleCalendar} />}
    </div>
  );
}
