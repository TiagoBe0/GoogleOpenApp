import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AvailabilityForm from "@/components/AvailabilityForm";
import { DEFAULT_TIMEZONE } from "@/lib/timezone";

export default async function AvailabilityPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "PSYCHOLOGIST") redirect("/patient");

  const profile = await prisma.psychologistProfile.findUnique({
    where: { userId: session.user.id },
    select: { timezone: true },
  });

  return (
    <div className="mb-6 space-y-1">
      <h1 className="font-display text-3xl font-semibold text-ink">Mi disponibilidad</h1>
      <p className="text-sm text-muted">
        Los días y horarios en los que atendés. Es lo único que los pacientes pueden reservar.
      </p>
      <p className="text-xs text-muted">
        Horarios en {(profile?.timezone ?? DEFAULT_TIMEZONE).replace(/_/g, " ")}.
      </p>
      <div className="pt-4">
        <AvailabilityForm />
      </div>
    </div>
  );
}
