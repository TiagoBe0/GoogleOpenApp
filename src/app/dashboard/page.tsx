import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CalendarSection from "@/components/CalendarSection";
import { signOut } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session) redirect("/login");

  const hasGoogleCalendar = !!session.googleAccessToken;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-lg">GoogleOpenApp</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
              ) : (
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-sm font-semibold">
                  {session.user.name?.[0]?.toUpperCase() || "U"}
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {session.user.name || session.user.email}
              </span>
            </div>

            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
            >
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {/* Welcome card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-900">
            Hola, {session.user.name?.split(" ")[0] || "usuario"} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {session.user.email}
          </p>
        </div>

        {/* Google Calendar status */}
        {!hasGoogleCalendar ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-amber-800">Google Calendar no vinculado</h2>
              <p className="text-amber-700 text-sm mt-1">
                Conecta tu cuenta de Google para ver tus próximos eventos del calendario directamente aquí.
              </p>
              <a
                href="/api/auth/signin/google?callbackUrl=/dashboard"
                className="inline-flex items-center gap-2 mt-4 bg-white border border-amber-300 text-amber-800 text-sm font-medium px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Vincular Google Calendar
              </a>
            </div>
          </div>
        ) : (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-4 flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-800 text-sm font-medium">Google Calendar vinculado correctamente</p>
          </div>
        )}

        {/* Calendar events section */}
        {hasGoogleCalendar && <CalendarSection />}
      </div>
    </main>
  );
}
