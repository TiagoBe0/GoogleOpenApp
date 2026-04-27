import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-[#F4F6FA] flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        <div className="mx-auto mb-6 grid h-20 w-20 grid-cols-2 gap-1">
          <span className="rounded-lg bg-[#2D4270]" />
          <span className="rounded-lg bg-[#8AACC8]" />
          <span className="rounded-lg bg-[#7FA98A]" />
          <span className="rounded-lg bg-[#D8EAF7]" />
        </div>
        <h1 className="text-4xl font-bold text-[#2D4270] mb-3">PsicoLink</h1>
        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          Gestioná turnos, pacientes y agenda profesional desde un solo lugar.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="bg-[#2D4270] hover:bg-[#1F3060] text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-md"
          >
            Crear cuenta gratis
          </Link>
          <Link
            href="/login"
            className="bg-white hover:bg-gray-50 text-gray-700 font-semibold px-6 py-3 rounded-xl border border-gray-300 transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
        <div className="mt-10 flex items-center justify-center gap-6 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Login con Google
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Agenda online
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Pacientes y pagos
          </div>
        </div>
      </div>
    </main>
  );
}
