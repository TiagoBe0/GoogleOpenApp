import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import PatientsList from "@/components/PatientsList";

export default async function PatientsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "PSYCHOLOGIST") redirect("/patient");

  const initials = session.user.name
    ? session.user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : (session.user.email?.[0] ?? "U").toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 hidden lg:flex flex-col z-10">
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 grid-cols-2 gap-0.5">
              <span className="rounded-[3px] bg-[#2D4270]" />
              <span className="rounded-[3px] bg-[#8AACC8]" />
              <span className="rounded-[3px] bg-[#7FA98A]" />
              <span className="rounded-[3px] bg-[#D8EAF7]" />
            </div>
            <span className="font-bold text-[#2D4270]">PsicoLink</span>
          </div>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">
          <a href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Inicio
          </a>
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-medium text-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Pacientes
          </div>
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
          <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
            <button type="submit" className="w-full text-sm text-gray-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-left flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <a href="/dashboard" className="text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
          <span className="font-bold text-gray-900 text-sm">Pacientes</span>
        </div>
        <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
          <button type="submit" className="text-sm text-gray-500 hover:text-red-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            Salir
          </button>
        </form>
      </header>

      <div className="lg:pl-64">
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
          <PatientsList />
        </main>
      </div>
    </div>
  );
}
