import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PatientDashboard from "@/components/PatientDashboard";

export default async function PatientPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "PSYCHOLOGIST") redirect("/dashboard");

  return <PatientDashboard patient={session.user} />;
}
