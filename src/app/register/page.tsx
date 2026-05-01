import AuthExperience from "@/components/AuthExperience";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <Suspense>
      <AuthExperience initialTab="register" />
    </Suspense>
  );
}
