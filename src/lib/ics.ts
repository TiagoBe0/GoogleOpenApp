/**
 * Archivo de calendario (.ics) para adjuntar a los avisos de turno.
 *
 * Lo abren Google Calendar, Outlook, el iPhone y cualquier otro: el paciente
 * agenda el turno con un clic y el profesional no depende de haber conectado
 * su cuenta de Google. Es la alternativa liviana a la API de Calendar, que
 * exige verificar la app antes de poder usarla en serio.
 *
 * El formato es RFC 5545. Tres detalles no son opcionales: los saltos de línea
 * son CRLF, las líneas se pliegan a 75 octetos, y en el texto hay que escapar
 * la barra, la coma, el punto y coma y los saltos de línea.
 */

export interface IcsPerson {
  name: string;
  email: string;
}

export interface IcsEvent {
  /** Identificador estable del turno: el mismo turno tiene que traer el mismo UID. */
  uid: string;
  start: Date;
  durationMinutes: number;
  summary: string;
  description?: string | null;
  location?: string | null;
  organizer: IcsPerson;
  attendee?: IcsPerson | null;
  status: "CONFIRMED" | "CANCELLED";
  /**
   * Sube con cada cambio del mismo turno. Sin esto el cliente de calendario
   * ignora la actualización porque cree que ya la tiene.
   */
  sequence?: number;
  /** Fijable para poder testear; por defecto, ahora. */
  timestamp?: Date;
}

/** Escapa el texto según el RFC: barra, punto y coma, coma y saltos de línea. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Fecha en UTC básico: 20260728T170000Z. Evita tener que emitir un VTIMEZONE. */
export function formatIcsDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/**
 * Pliega una línea a 75 octetos, continuando con un espacio al principio.
 * Se mide en bytes UTF-8, no en caracteres: un acento ocupa dos, y cortar por
 * caracteres deja líneas más largas de lo permitido.
 */
export function foldLine(line: string): string {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;

  const out: string[] = [];
  let current = "";
  let currentBytes = 0;
  let limit = 75;

  for (const char of line) {
    const size = encoder.encode(char).length;
    if (currentBytes + size > limit) {
      out.push(current);
      current = " ";
      currentBytes = 1;
      limit = 75;
    }
    current += char;
    currentBytes += size;
  }

  out.push(current);
  return out.join("\r\n");
}

export function buildIcs(event: IcsEvent): string {
  const end = new Date(event.start.getTime() + event.durationMinutes * 60 * 1000);
  const method = event.status === "CANCELLED" ? "CANCEL" : "REQUEST";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//PsicoLink//Turnos//ES",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    "BEGIN:VEVENT",
    `UID:${event.uid}`,
    `DTSTAMP:${formatIcsDate(event.timestamp ?? new Date())}`,
    `DTSTART:${formatIcsDate(event.start)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:${escapeIcsText(event.summary)}`,
    `SEQUENCE:${event.sequence ?? 0}`,
    `STATUS:${event.status}`,
    `ORGANIZER;CN=${escapeIcsText(event.organizer.name)}:mailto:${event.organizer.email}`,
  ];

  if (event.description?.trim()) {
    lines.push(`DESCRIPTION:${escapeIcsText(event.description.trim())}`);
  }

  if (event.location?.trim()) {
    lines.push(`LOCATION:${escapeIcsText(event.location.trim())}`);
  }

  if (event.attendee) {
    lines.push(
      `ATTENDEE;CN=${escapeIcsText(event.attendee.name)};ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE:mailto:${event.attendee.email}`
    );
  }

  lines.push("END:VEVENT", "END:VCALENDAR");

  return lines.map(foldLine).join("\r\n") + "\r\n";
}
