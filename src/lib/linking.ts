/**
 * Reglas de vinculación paciente-profesional. Puras a propósito: son las que
 * evitan estados imposibles (vincularse a uno mismo, tener dos profesionales,
 * elegir a alguien que no atiende) y conviene poder probarlas sin base.
 */

export interface LinkActor {
  id: string;
  role: string;
  /** Profesional que el paciente ya tiene, si tiene alguno. */
  psychologistId?: string | null;
}

export interface LinkTarget {
  id: string;
  role: string;
}

export type LinkRefusal = {
  error: string;
  status: 400 | 403 | 404 | 409;
};

/**
 * Devuelve el motivo del rechazo, o `null` si la vinculación puede hacerse.
 * El orden importa: primero permisos, después existencia, después estado.
 */
export function refuseLink(
  actor: LinkActor | null,
  target: LinkTarget | null
): LinkRefusal | null {
  if (!actor) {
    return { error: "No autenticado", status: 403 };
  }
  if (actor.role !== "PATIENT") {
    return { error: "Solo los pacientes pueden usar este endpoint", status: 403 };
  }
  if (!target) {
    return { error: "No existe ese profesional", status: 404 };
  }
  if (target.role !== "PSYCHOLOGIST") {
    return { error: "Ese usuario no es un psicólogo", status: 400 };
  }
  if (target.id === actor.id) {
    return { error: "No podés vincularte a vos mismo", status: 400 };
  }
  // Un solo profesional de cabecera por vez: para cambiar hay que desvincularse
  // primero, así el paciente ve el cambio en lugar de que ocurra en silencio.
  if (actor.psychologistId) {
    return { error: "Ya tenés un psicólogo asignado", status: 409 };
  }
  return null;
}

export function canLink(actor: LinkActor | null, target: LinkTarget | null): boolean {
  return refuseLink(actor, target) === null;
}
