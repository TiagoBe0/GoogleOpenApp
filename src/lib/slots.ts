/** Rango ocupado del día, en minutos desde la medianoche local. */
export interface BusyRange {
  start: number;
  end: number;
}

export interface SlotOptions {
  /** Duración de la sesión en minutos. */
  duration: number;
  /** Turnos ya tomados ese día. */
  busy: BusyRange[];
  /** Apertura y cierre de la agenda, en minutos desde medianoche. */
  workStart?: number;
  workEnd?: number;
  /**
   * Minuto actual del día cuando la fecha pedida es hoy. `null` para un día
   * futuro, donde no hay que descartar horarios pasados.
   */
  nowMinutes?: number | null;
}

export const WORK_START = 8 * 60; // 08:00
export const WORK_END = 20 * 60; // 20:00

export function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Dos intervalos se pisan si uno empieza antes de que el otro termine. */
export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function isWeekend(year: number, month: number, day: number): boolean {
  const weekday = new Date(year, month - 1, day).getDay();
  return weekday === 0 || weekday === 6;
}

/**
 * Horarios libres de un día. Puro a propósito: es la lógica donde un error se
 * traduce en dos pacientes citados a la misma hora.
 */
export function availableSlots({
  duration,
  busy,
  workStart = WORK_START,
  workEnd = WORK_END,
  nowMinutes = null,
}: SlotOptions): string[] {
  if (duration <= 0) return [];

  const slots: string[] = [];

  for (let min = workStart; min + duration <= workEnd; min += duration) {
    // Un turno que ya empezó no se puede reservar.
    if (nowMinutes !== null && min <= nowMinutes) continue;
    if (busy.some((r) => overlaps(min, min + duration, r.start, r.end))) continue;

    slots.push(minutesToLabel(min));
  }

  return slots;
}
