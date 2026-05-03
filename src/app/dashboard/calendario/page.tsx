import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import WeekCalendar from "@/components/WeekCalendar";

export default async function CalendarioPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "PSYCHOLOGIST") redirect("/patient");

  const hasGoogle = !!session.googleAccessToken;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Calendario</h1>
          <p className="text-sm text-gray-500 mt-0.5">Visualizá y gestioná tus turnos semanales</p>
        </div>
      </div>

      {!hasGoogle && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 flex items-center gap-4">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-amber-800">Google Calendar no vinculado</p>
            <p className="text-xs text-amber-600 mt-0.5">Conectalo para ver también tus eventos externos junto a tus turnos.</p>
          </div>
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/dashboard/calendario" });
            }}
          >
            <button
              type="submit"
              className="flex-shrink-0 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium px-3 py-2 rounded-lg transition-colors"
            >
              Conectar
            </button>
          </form>
        </div>
      )}

      <WeekCalendar psychologistId={session.user.id} hasGoogleCalendar={hasGoogle} />
    </div>
  );
}
