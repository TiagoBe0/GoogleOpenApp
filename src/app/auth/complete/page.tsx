import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ role?: string }>;
}

export default async function CompleteAuthPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { role } = await searchParams;
  const nextRole = role === "PSYCHOLOGIST" ? "PSYCHOLOGIST" : "PATIENT";

  if (session.user.role !== nextRole) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { role: nextRole },
    });
  }

  redirect(nextRole === "PSYCHOLOGIST" ? "/dashboard" : "/patient");
}
