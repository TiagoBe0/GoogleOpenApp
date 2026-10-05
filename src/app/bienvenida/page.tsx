import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import RoleChoice from "@/components/RoleChoice";

export const metadata = { title: "Bienvenido a PsicoLink" };

export default async function BienvenidaPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, roleChosen: true, role: true },
  });

  // Quien ya eligió no vuelve a pasar por acá, ni escribiendo la URL a mano.
  if (me?.roleChosen) {
    redirect(me.role === "PSYCHOLOGIST" ? "/dashboard" : "/patient");
  }

  const firstName = me?.name?.split(" ")[0];

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-5 py-12">
      <div className="w-full max-w-lg">
        <h1 className="font-display text-3xl font-semibold text-ink">
          {firstName ? `Hola, ${firstName}` : "Hola"}
        </h1>
        <p className="mt-2 text-muted">
          Una sola pregunta y entrás. ¿Cómo vas a usar PsicoLink?
        </p>

        <RoleChoice />

        <p className="mt-6 text-xs text-muted">
          Se elige una vez. Si más adelante necesitás la otra cuenta, escribinos y te
          ayudamos a moverla.
        </p>
      </div>
    </main>
  );
}
