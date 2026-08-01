import type { TimeWindow } from "./availability";

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
  /**
   * Franjas en las que el profesional atiende ese día. Vacío significa día
   * cerrado, no día completo: quien no atiende los sábados no debe recibir
   * turnos los sábados.
   */
  windows?: TimeWindow[];
  /**
   * Minuto actual del día cuando la fecha pedida es hoy. `null` para un día
   * futuro, donde no hay que descartar horarios pasados.
   */
  nowMinutes?: number | null;
}

export const WORK_START = 8 * 60; // 08:00
export const WORK_END = 20 * 60; // 20:00

/** Franja usada cuando quien llama no pasa ninguna. */
export const DEFAULT_WINDOWS: TimeWindow[] = [{ start: WORK_START, end: WORK_END }];

export function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function labelToMinutes(label: string): number {
  const [h, m] = label.split(":").map(Number);
  return h * 60 + m;
}

/** Dos intervalos se pisan si uno empieza antes de que el otro termine. */
export function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Horarios libres de un día. Puro a propósito: es la lógica donde un error se
 * traduce en dos pacientes citados a la misma hora.
 *
 * La grilla arranca en el inicio de cada franja, así que alguien que atiende de
 * 09:00 a 13:00 y de 16:00 a 20:00 ofrece 16:00 aunque la sesión dure 50
 * minutos y la mañana haya terminado en un múltiplo distinto.
 */
export function availableSlots({
  duration,
  busy,
  windows = DEFAULT_WINDOWS,
  nowMinutes = null,
}: SlotOptions): string[] {
  if (duration <= 0) return [];

  const slots: string[] = [];

  for (const window of [...windows].sort((a, b) => a.start - b.start)) {
    for (let min = window.start; min + duration <= window.end; min += duration) {
      // Un turno que ya empezó no se puede reservar.
      if (nowMinutes !== null && min <= nowMinutes) continue;
      if (busy.some((r) => overlaps(min, min + duration, r.start, r.end))) continue;
      // Dos franjas que se pisan podrían repetir la misma hora.
      if (slots.includes(minutesToLabel(min))) continue;

      slots.push(minutesToLabel(min));
    }
  }

  return slots.sort();
}
