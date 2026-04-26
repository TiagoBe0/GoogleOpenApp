import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProfileForm from "@/components/ProfileForm";

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
      <h1 className="text-xl font-bold text-gray-900">Mi perfil profesional</h1>
      <p className="text-sm text-gray-500">Esta información es visible para tus pacientes.</p>
      <div className="pt-4">
        <ProfileForm
          initialUser={{ name: user?.name ?? "", email: user?.email ?? "", image: user?.image ?? null }}
          initialProfile={profile}
        />
      </div>
    </div>
  );
}
