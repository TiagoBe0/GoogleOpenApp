import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decideAccess, type GuardState } from "@/lib/access-rules";

export type { GuardedUser, GuardState } from "@/lib/access-rules";
export { decideAccess } from "@/lib/access-rules";

/**
 * Carga al usuario de la sesión desde la base y aplica las reglas de acceso.
 *
 * Lee de la base y no del token a propósito: el rol viaja en el JWT, así que
 * justo después de elegirlo en /bienvenida el token todavía dice lo viejo, y un
 * guard que confiara en él mandaría al recién llegado de vuelta a elegir.
 */
export async function checkAccess(expected?: "PATIENT" | "PSYCHOLOGIST"): Promise<GuardState> {
  const session = await auth();
  if (!session) return { ok: false, redirectTo: "/login" };

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, roleChosen: true, name: true, email: true },
  });

  return decideAccess(user, expected);
}
