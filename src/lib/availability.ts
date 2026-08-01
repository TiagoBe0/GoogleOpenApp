/** Franja de atención dentro de un día, en minutos desde la medianoche local. */
export interface TimeWindow {
  start: number;
  end: number;
}

/** Franja semanal recurrente. `weekday` sigue a Date.getDay(): 0 = domingo. */
export interface WeeklyRule extends TimeWindow {
  weekday: number;
}

export const WEEKDAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

/** Orden de presentación: la semana laboral argentina arranca el lunes. */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const MINUTES_IN_DAY = 24 * 60;

/**
 * Agenda de quien todavía no configuró nada: lunes a viernes de 08:00 a 20:00.
 * Es exactamente lo que la app asumía cuando el horario estaba hardcodeado, así
 * que un profesional que ya venía usándola no ve cambiar su disponibilidad.
 */
export const DEFAULT_RULES: WeeklyRule[] = [1, 2, 3, 4, 5].map((weekday) => ({
  weekday,
  start: 8 * 60,
  end: 20 * 60,
}));

function isWholeMinute(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n);
}

export function isValidRule(rule: Partial<WeeklyRule>): boolean {
  if (!isWholeMinute(rule.weekday) || rule.weekday < 0 || rule.weekday > 6) return false;
  if (!isWholeMinute(rule.start) || !isWholeMinute(rule.end)) return false;
  if (rule.start < 0 || rule.end > MINUTES_IN_DAY) return false;
  return rule.start < rule.end;
}

/**
 * Ordena y funde las franjas que se pisan o se tocan dentro del mismo día.
 * Sin esto, "09:00-13:00" y "12:00-18:00" generarían horarios duplicados en la
 * grilla y el paciente vería la misma hora dos veces.
 */
export function normalizeRules(rules: WeeklyRule[]): WeeklyRule[] {
  const sorted = [...rules].sort((a, b) => a.weekday - b.weekday || a.start - b.start);
  const out: WeeklyRule[] = [];

  for (const rule of sorted) {
    const last = out.at(-1);
    if (last && last.weekday === rule.weekday && rule.start <= last.end) {
      last.end = Math.max(last.end, rule.end);
      continue;
    }
    out.push({ ...rule });
  }

  return out;
}

export function windowsForWeekday(rules: WeeklyRule[], weekday: number): TimeWindow[] {
  return rules
    .filter((r) => r.weekday === weekday)
    .map(({ start, end }) => ({ start, end }))
    .sort((a, b) => a.start - b.start);
}

/** Días en los que el profesional atiende, para pintar el calendario. */
export function openWeekdays(rules: WeeklyRule[]): number[] {
  return [...new Set(rules.map((r) => r.weekday))].sort((a, b) => a - b);
}

/**
 * ¿Un turno de [start, end) cae entero dentro de una franja de atención? Se usa
 * en el servidor al crear el turno: la grilla de horarios ya filtra, pero nada
 * impide postear una hora arbitraria contra la API.
 */
export function isWithinWindows(windows: TimeWindow[], start: number, end: number): boolean {
  return windows.some((w) => start >= w.start && end <= w.end);
}

/** Día de la semana de una fecha calendaria, sin depender de la zona del servidor. */
export function weekdayOf(year: number, month: number, day: number): number {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
}
