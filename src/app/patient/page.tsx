import { auth } from "@/auth";
import { checkAccess } from "@/lib/session-guard";
import { redirect } from "next/navigation";
import PatientDashboard from "@/components/PatientDashboard";
import PushToggle from "@/components/PushToggle";

export default async function PatientPage() {
  const access = await checkAccess("PATIENT");
  if (!access.ok) redirect(access.redirectTo);
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <>
      <PatientDashboard patient={session.user} />
      <section className="mx-auto mb-10 max-w-5xl px-6">
        <div className="rounded-lg border border-line bg-surface p-6">
          <h2 className="font-display text-xl font-semibold text-ink">
            Avisos en este dispositivo
          </h2>
          <p className="mb-4 mt-1 text-sm text-muted">
            Te avisamos cuando el profesional confirme, mueva o cancele tu turno.
          </p>
          <PushToggle />
        </div>
      </section>
    </>
  );
}
