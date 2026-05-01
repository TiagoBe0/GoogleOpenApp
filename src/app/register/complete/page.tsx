import { auth } from "@/auth";
import CompleteRegistration from "@/components/onboarding/CompleteRegistration";
import { redirect } from "next/navigation";

interface Props {
  searchParams: Promise<{ role?: string }>;
}

export default async function CompleteRegistrationPage({ searchParams }: Props) {
  const session = await auth();
  if (!session) redirect("/login");

  const params = await searchParams;
  const role = params.role === "PSYCHOLOGIST" ? "PSYCHOLOGIST" : "PATIENT";

  return (
    <CompleteRegistration
      initialRole={role}
      initialName={session.user.name ?? ""}
      email={session.user.email ?? ""}
    />
  );
}
