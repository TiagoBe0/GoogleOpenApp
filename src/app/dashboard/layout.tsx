import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { signOut } from "@/auth";
import DashboardNav from "@/components/DashboardNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top header */}
      <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="grid h-8 w-8 grid-cols-2 gap-0.5">
            <span className="rounded-[3px] bg-[#2D4270]" />
            <span className="rounded-[3px] bg-[#8AACC8]" />
            <span className="rounded-[3px] bg-[#7FA98A]" />
            <span className="rounded-[3px] bg-[#D8EAF7]" />
          </div>
          <span className="font-bold text-[#2D4270] text-sm hidden sm:block">PsicoLink</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {session.user.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={session.user.image} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-semibold text-sm">
                {session.user.name?.[0]?.toUpperCase() ?? "P"}
              </div>
            )}
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-700 leading-none">{session.user.name ?? "Psicólogo"}</p>
              <p className="text-xs text-gray-400 mt-0.5">{session.user.email}</p>
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
              className="text-xs text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Salir
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar nav */}
        <aside className="w-56 bg-white border-r border-gray-200 hidden md:flex flex-col py-4 px-3 gap-1">
          <DashboardNav />
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 lg:p-8 max-w-4xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
