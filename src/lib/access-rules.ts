/**
 * Reglas de acceso a los paneles. Sin dependencias del framework a propósito:
 * importar next-auth acá haría que los tests ni siquiera puedan cargar el
 * módulo, y estas reglas son justamente las que conviene poder probar.
 */

export interface GuardedUser {
  id: string;
  role: string;
  roleChosen: boolean;
  name: string | null;
  email: string;
}

export type GuardState =
  | { ok: true; user: GuardedUser }
  | { ok: false; redirectTo: string };

/**
 * Decide si alguien puede ver un panel. Devuelve la decisión en vez de llamar
 * a redirect(): así la redirección la ejecuta la página, que es donde Next la
 * espera.
 *
 * El orden importa. La bienvenida va ANTES del desvío por rol equivocado: si
 * fuera al revés, un profesional recién llegado por Google (que arranca con el
 * rol por defecto) rebotaría entre paneles sin poder elegir nunca.
 */
export function decideAccess(
  user: GuardedUser | null,
  expected?: "PATIENT" | "PSYCHOLOGIST"
): GuardState {
  if (!user) return { ok: false, redirectTo: "/login" };
  if (!user.roleChosen) return { ok: false, redirectTo: "/bienvenida" };
  if (expected && user.role !== expected) {
    return { ok: false, redirectTo: user.role === "PSYCHOLOGIST" ? "/dashboard" : "/patient" };
  }
  return { ok: true, user };
}
