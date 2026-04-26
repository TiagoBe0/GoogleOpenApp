import { auth } from "@/auth";
import { redirect } from "next/navigation";
import WeekCalendar from "@/components/WeekCalendar";
import PendingAppointments from "@/components/PendingAppointments";
import { signIn, signOut } from "@/auth";
import ReviewsPanel from "@/components/ReviewsPanel";
import ProfileSection from "@/components/ProfileSection";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "PATIENT") redirect("/patient");

  const profile = await prisma.psychologistProfile.findUnique({
    where: { userId: session.user.id },
  });

  const hasGoogleCalendar = !!session.googleAccessToken;
  const initials = session.user.name
    ? session.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : (session.user.email?.[0] ?? "U").toUpperCase();

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
  const profileComplete = completionPct === 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar — desktop only */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col z-10">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">GoogleOpenApp</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-medium text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Inicio
          </div>
          <a href="/dashboard/patients" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Pacientes
          </a>
        </nav>

        <div className="px-4 py-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="w-9 h-9 rounded-full" />
            ) : (
              <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-sm font-semibold">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{session.user.name || "Usuario"}</p>
              <p className="text-xs text-gray-400 truncate">{session.user.email}</p>
            </div>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button
              type="submit"
              className="w-full text-sm text-gray-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-left flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-sm">GoogleOpenApp</span>
          </div>
          <div className="flex items-center gap-3">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="w-7 h-7 rounded-full" />
            ) : (
              <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-semibold">
                {initials}
              </div>
            )}
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button type="submit" className="text-sm text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                Salir
              </button>
            </form>
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Welcome banner */}
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
            <div className="flex items-center gap-4">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="w-14 h-14 rounded-full border-2 border-white/30 shadow-sm" />
              ) : (
                <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-white text-xl font-bold border-2 border-white/30">
                  {initials}
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold">Hola, {session.user.name?.split(" ")[0] || "usuario"} 👋</h1>
                <p className="text-indigo-200 text-sm mt-0.5">{session.user.email}</p>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-white/10 flex items-center gap-2">
              {hasGoogleCalendar ? (
                <span className="inline-flex items-center gap-1.5 bg-white/15 text-white text-xs font-medium px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block"></span>
                  Google Calendar conectado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 bg-white/15 text-amber-200 text-xs font-medium px-3 py-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full inline-block"></span>
                  Google Calendar no vinculado
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
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                        <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                      Conectar con Google
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* Pending appointment requests */}
          <PendingAppointments />

          {/* Public profile editor */}
          <ProfileSection />

          {/* Reviews */}
          <ReviewsPanel title="Mis calificaciones" />

          {/* Weekly calendar */}
          {hasGoogleCalendar && <WeekCalendar />}
        </main>
      </div>
    </div>
  );
}
