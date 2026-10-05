import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/ProfileForm";
import PushToggle from "@/components/PushToggle";

export default async function ProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");

  const [user, profile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, image: true },
    }),
    prisma.psychologistProfile.findUnique({ where: { userId: session.user.id } }),
  ]);

  return (
    <div className="space-y-1 mb-6">
      <h1 className="font-display text-3xl font-semibold text-ink">Mi perfil profesional</h1>
      <p className="text-sm text-muted">Esta información es visible para tus pacientes.</p>
      <div className="pt-4">
        <ProfileForm
          initialUser={{ name: user?.name ?? "", email: user?.email ?? "", image: user?.image ?? null }}
          initialProfile={profile}
        />
      </div>

      <section className="mt-8 rounded-lg border border-line bg-surface p-6">
        <h2 className="font-display text-xl font-semibold text-ink">Avisos en este dispositivo</h2>
        <p className="mb-4 mt-1 text-sm text-muted">
          Se configura por dispositivo: activalo en el teléfono y en la computadora
          del consultorio por separado.
        </p>
        <PushToggle />
      </section>
    </div>
  );
}
