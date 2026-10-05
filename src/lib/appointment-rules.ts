import { prisma } from "./prisma";
import { overlaps } from "./slots";
import { isWithinWindows, windowsForWeekday } from "./availability";
import { loadAvailability } from "./availability-store";
import { DEFAULT_TIMEZONE, zonedParts } from "./timezone";

/**
 * Reglas que decide el servidor antes de aceptar un turno.
 *
 * Están acá y no dentro de una ruta porque las usan dos caminos, crear y
 * reprogramar. Duplicadas terminarían discrepando, y la discrepancia se ve
 * como dos pacientes citados a la misma hora.
 */

/**
 * Ventana de búsqueda de turnos vecinos. Tiene que ser mayor que la sesión más
 * larga que alguien pueda cargar: un turno que arrancó mucho antes todavía
 * puede estar pisando el horario que se pide.
 */
const NEIGHBOUR_WINDOW_MINUTES = 6 * 60;

/**
 * ¿Hay otro turno pisando ese horario? Compara con la duración real de cada
 * turno vecino, no con la del turno nuevo: dos sesiones de duración distinta
 * se pisan igual.
 */
export async function findConflictingAppointment(
  psychologistId: string,
  start: Date,
  durationMinutes: number,
  excludeAppointmentId?: string
): Promise<string | null> {
  const startMs = start.getTime();
  const endMs = startMs + durationMinutes * 60 * 1000;
  const windowMs = NEIGHBOUR_WINDOW_MINUTES * 60 * 1000;

  const neighbours = await prisma.appointment.findMany({
    where: {
      psychologistId,
      status: { not: "CANCELLED" },
      ...(excludeAppointmentId ? { id: { not: excludeAppointmentId } } : {}),
      date: { gte: new Date(startMs - windowMs), lte: new Date(endMs + windowMs) },
    },
    select: { id: true, date: true, duration: true },
  });

  const conflict = neighbours.find((n) => {
    const nStart = n.date.getTime();
    return overlaps(startMs, endMs, nStart, nStart + n.duration * 60 * 1000);
  });

  return conflict?.id ?? null;
}

/**
 * ¿El turno cae dentro de la agenda publicada del profesional? La grilla de
 * horarios ya filtra, pero la API está expuesta igual: sin esto, cualquiera
 * puede reservar un domingo a las 3 de la mañana.
 */
export async function isWithinAvailability(
  psychologistId: string,
  start: Date,
  durationMinutes: number,
  timezone?: string | null
): Promise<boolean> {
  const local = zonedParts(start, timezone || DEFAULT_TIMEZONE);
  const availability = await loadAvailability(psychologistId);
  const windows = windowsForWeekday(availability.rules, local.weekday);

  return isWithinWindows(windows, local.minutes, local.minutes + durationMinutes);
}
