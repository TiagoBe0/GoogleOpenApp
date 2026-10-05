import { auth } from "@/auth";
import { redirect } from "next/navigation";
import PatientsList from "@/components/PatientsList";

export default async function PatientsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "PSYCHOLOGIST") redirect("/patient");

  return <PatientsList />;
}
