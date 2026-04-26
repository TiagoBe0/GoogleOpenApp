import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CalendarSection from "@/components/CalendarSection";

export default async function DashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const profile = await prisma.psychologistProfile.findUnique({
    where: { userId: session.user.id },
  });

  const hasGoogleCalendar = !!session.googleAccessToken;

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
    <div className="space-y-5">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">
          Bienvenido, {session.user.name?.split(" ")[0] ?? "psicólogo"} 👋
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {new Date().toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Profile completion card */}
        <div className={`rounded-2xl border p-5 ${profileComplete ? "bg-green-50 border-green-200" : "bg-white border-gray-200"}`}>
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${profileComplete ? "bg-green-100" : "bg-indigo-100"}`}>
              {profileComplete ? (
                <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              )}
            </div>
            <span className={`text-sm font-bold ${profileComplete ? "text-green-700" : "text-indigo-600"}`}>{completionPct}%</span>
          </div>
          <p className={`text-sm font-semibold ${profileComplete ? "text-green-800" : "text-gray-800"}`}>
            {profileComplete ? "Perfil completo" : "Perfil incompleto"}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2 mb-3">
            <div className={`h-1.5 rounded-full transition-all ${profileComplete ? "bg-green-500" : "bg-indigo-500"}`} style={{ width: `${completionPct}%` }} />
          </div>
          {!profileComplete && (
            <Link href="/dashboard/perfil" className="text-xs text-indigo-600 font-medium hover:underline">
              Completar perfil →
            </Link>
          )}
        </div>

        {/* Specialty card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <p className="text-sm font-semibold text-gray-800">Especialidad</p>
          <p className="text-sm text-gray-500 mt-1">{profile?.specialty ?? <span className="italic">Sin configurar</span>}</p>
        </div>

        {/* Patients card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="w-9 h-9 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <p className="text-sm font-semibold text-gray-800">Nuevos pacientes</p>
          <p className={`text-sm mt-1 font-medium ${profile?.acceptsNewPatients ? "text-emerald-600" : "text-gray-400"}`}>
            {profile?.acceptsNewPatients ? "Aceptando" : "No disponible"}
          </p>
        </div>
      </div>

      {/* Profile summary preview */}
      {profile && (profile.bio || profile.consultationFee) && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Vista previa del perfil</h2>
            <Link href="/dashboard/perfil" className="text-sm text-indigo-600 hover:underline font-medium">
              Editar
            </Link>
          </div>
          <div className="flex items-start gap-4">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
            ) : (
              <div className="w-14 h-14 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-bold text-xl flex-shrink-0">
                {session.user.name?.[0]?.toUpperCase() ?? "P"}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900">{session.user.name}</p>
              <p className="text-sm text-indigo-600 font-medium">{profile.specialty}</p>
              {profile.licenseNumber && <p className="text-xs text-gray-400 mt-0.5">Mat. {profile.licenseNumber}</p>}
              {profile.bio && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{profile.bio}</p>}
              <div className="flex flex-wrap gap-2 mt-3">
                {profile.consultationFee && (
                  <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-1 rounded-lg">
                    {profile.currency} {profile.consultationFee.toLocaleString()}
                  </span>
                )}
                {profile.sessionDuration && (
                  <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-lg">
                    {profile.sessionDuration} min
                  </span>
                )}
                {profile.modalityOnline && (
                  <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-2 py-1 rounded-lg">Online</span>
                )}
                {profile.modalityPresential && (
                  <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2 py-1 rounded-lg">Presencial</span>
                )}
                {profile.city && (
                  <span className="text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2 py-1 rounded-lg">
                    📍 {profile.city}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No profile yet */}
      {!profile && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-6 flex items-start gap-4">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <div>
            <p className="font-semibold text-indigo-800">Configurá tu perfil profesional</p>
            <p className="text-sm text-indigo-600 mt-1">Cargá tu especialidad, precio de consulta y descripción para que los pacientes puedan encontrarte.</p>
            <Link href="/dashboard/perfil" className="inline-block mt-3 bg-indigo-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Crear perfil →
            </Link>
          </div>
        </div>
      )}

      {/* Google Calendar */}
      {!hasGoogleCalendar ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
          <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <p className="font-semibold text-amber-800 text-sm">Google Calendar no vinculado</p>
            <p className="text-amber-700 text-xs mt-1">Conectá tu Google para ver tus turnos y citas directamente desde el dashboard.</p>
            <a
              href="/api/auth/signin/google?callbackUrl=/dashboard"
              className="inline-flex items-center gap-2 mt-3 bg-white border border-amber-300 text-amber-800 text-xs font-medium px-3 py-2 rounded-lg hover:bg-amber-50 transition-colors"
            >
              Vincular Google Calendar
            </a>
          </div>
        </div>
      ) : (
        <CalendarSection />
      )}
    </div>
  );
}
