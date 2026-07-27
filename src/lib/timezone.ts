/**
 * Conversión entre instantes UTC y hora de pared en una zona con nombre.
 *
 * La agenda del profesional está en SU hora local ("atiendo de 14 a 19"), pero
 * los turnos se guardan como instantes UTC. Sin esta traducción, un paciente en
 * otra zona horaria ve la grilla corrida y el servidor le rechaza el turno que
 * la propia grilla le ofreció.
 *
 * Se hace con `Intl`, que ya trae la base de datos de zonas horarias: no hace
 * falta una dependencia nueva y los cambios de horario de verano salen bien.
 */

export const DEFAULT_TIMEZONE = "America/Argentina/Buenos_Aires";

export interface ZonedParts {
  year: number;
  /** 1-based, como lo espera el resto de la app. */
  month: number;
  day: number;
  /** 0 = domingo, igual que Date.getDay(). */
  weekday: number;
  hour: number;
  minute: number;
  /** Minutos desde la medianoche local. */
  minutes: number;
}

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  const cached = formatters.get(timeZone);
  if (cached) return cached;

  // Una zona inválida haría explotar todas las reservas del profesional; es
  // preferible caer a la zona por defecto que devolver un 500.
  let fmt: Intl.DateTimeFormat;
  try {
    fmt = buildFormatter(timeZone);
  } catch {
    fmt = buildFormatter(DEFAULT_TIMEZONE);
  }

  formatters.set(timeZone, fmt);
  return fmt;
}

function buildFormatter(timeZone: string): Intl.DateTimeFormat {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/** Hora de pared que marca el reloj de `timeZone` en ese instante. */
export function zonedParts(date: Date, timeZone: string): ZonedParts {
  const parts = formatterFor(timeZone).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parseInt(parts.find((p) => p.type === type)?.value ?? "0", 10);

  const year = get("year");
  const month = get("month");
  const day = get("day");
  const hour = get("hour");
  const minute = get("minute");

  return {
    year,
    month,
    day,
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay(),
    hour,
    minute,
    minutes: hour * 60 + minute,
  };
}

/** Cuánto se adelanta `timeZone` a UTC en ese instante, en milisegundos. */
function offsetMs(date: Date, timeZone: string): number {
  const p = zonedParts(date, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, date.getUTCSeconds());
  return asUtc - date.getTime() + date.getUTCMilliseconds();
}

/**
 * Instante UTC en el que el reloj de `timeZone` marca esa hora de pared.
 *
 * Se calcula en dos pasos porque el offset depende del instante que estamos
 * buscando: se estima uno, y si el salto de horario de verano cambió el offset,
 * se corrige con el segundo. Sin la corrección, una hora del día del cambio se
 * guarda con 60 minutos de error.
 */
export function zonedTimeToUtc(
  year: number,
  month: number,
  day: number,
  minutes: number,
  timeZone: string
): Date {
  const naive = Date.UTC(year, month - 1, day, 0, minutes);
  const firstGuess = naive - offsetMs(new Date(naive), timeZone);
  const corrected = naive - offsetMs(new Date(firstGuess), timeZone);

  return new Date(corrected);
}
