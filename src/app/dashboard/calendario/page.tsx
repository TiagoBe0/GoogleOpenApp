import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/auth";
import WeekCalendar from "@/components/WeekCalendar";
import AvailabilityPanel from "@/components/AvailabilityPanel";

export default async function CalendarioPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "PATIENT") redirect("/patient");

  const hasGoogleCalendar = !!session.googleAccessToken;

  const now = new Date();
  const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const upcomingThisWeek = await prisma.appointment.findMany({
    where: {
      psychologistId: session.user.id,
      date: { gte: now, lte: weekEnd },
      status: { not: "CANCELLED" },
    },
    orderBy: { date: "asc" },
    include: { patient: { select: { name: true, email: true } } },
  });

  const fmt = (d: Date) =>
    d.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Calendario</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Turnos y eventos de la semana
          </p>
        </div>
        {!hasGoogleCalendar && (
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard/calendario" });
            }}
          >
            <button
              type="submit"
              className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Conectar Google Calendar
            </button>
          </form>
        )}
      </div>

      {/* This week summary */}
      {upcomingThisWeek.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">Esta semana</p>
            <span className="text-xs bg-indigo-100 text-indigo-700 font-medium px-2 py-0.5 rounded-full">
              {upcomingThisWeek.length} turno{upcomingThisWeek.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="divide-y divide-gray-100">
            {upcomingThisWeek.map((apt) => {
              const d = new Date(apt.date);
              const name =
                apt.patient?.name ?? apt.patientName ?? apt.patient?.email ?? apt.patientEmail ?? "Paciente";
              const isConfirmed = apt.status === "CONFIRMED";
              return (
                <div key={apt.id} className="px-5 py-3 flex items-center gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${isConfirmed ? "bg-emerald-500" : "bg-amber-500"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                    <p className="text-xs text-gray-400 capitalize">
                      {fmt(d)} · {fmtTime(d)} · {apt.duration} min
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${
                      isConfirmed
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {isConfirmed ? "Confirmado" : "Pendiente"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Available slots for the week */}
      <AvailabilityPanel />

      {/* Full week calendar */}
      <WeekCalendar />
    </div>
  );
}
