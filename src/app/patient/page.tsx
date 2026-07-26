import { auth } from "@/auth";
import { checkAccess } from "@/lib/session-guard";
import { redirect } from "next/navigation";
import PatientDashboard from "@/components/PatientDashboard";

export default async function PatientPage() {
  const access = await checkAccess("PATIENT");
  if (!access.ok) redirect(access.redirectTo);
  const session = await auth();
  if (!session) redirect("/login");

  return <PatientDashboard patient={session.user} />;
}
