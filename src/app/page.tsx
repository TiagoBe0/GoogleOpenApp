import { auth } from "@/auth";
import AuthExperience from "@/components/AuthExperience";
import { redirect } from "next/navigation";
import { Suspense } from "react";

function destinationForRole(role?: string | null) {
  if (role === "ADMIN") return "/dashboard/admin/users";
  if (role === "PSYCHOLOGIST") return "/dashboard";
  return "/patient";
}

export default async function Home() {
  const session = await auth();
  if (session) redirect(destinationForRole(session.user.role));

  return (
    <Suspense>
      <AuthExperience initialTab="login" />
    </Suspense>
  );
}
