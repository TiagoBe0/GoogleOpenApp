import { DEFAULT_TIMEZONE } from "./timezone";

/** Todo lo que necesita cualquiera de los avisos de turno. */
export interface AppointmentEmail {
  patientName: string;
  psychologistName: string;
  /** Instante del turno, en UTC. */
  date: Date;
  duration: number;
  /** Zona horaria del profesional: es la que manda para mostrar la hora. */
  timezone: string;
  notes?: string | null;
  /** Base para los links, sin barra final. */
  appUrl: string;
  /**
   * Link de la videollamada, si el profesional lo cargó. Solo se muestra en el
   * aviso de confirmación: en una cancelación sería ofrecer una sala que ya no
   * existe. Llega validado como https por src/lib/meeting-link.ts.
   */
  meetingUrl?: string | null;
}

export interface Message {
  subject: string;
  text: string;
  html: string;
}

const COLORS = {
  bg: "#FBFAF8",
  surface: "#FFFFFF",
  line: "#E8E4DE",
  text: "#2A2623",
  muted: "#6F6862",
  primary: "#1A6B54",
};

/**
 * El nombre del paciente en una reserva pública lo escribe cualquiera sin
 * cuenta. Sin escapar, entra HTML arbitrario en el correo del profesional.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** "martes 28 de julio de 2026 a las 14:00", en la hora del profesional. */
export function formatWhen(date: Date, timezone: string): string {
  const zone = timezone || DEFAULT_TIMEZONE;
  const safe = (options: Intl.DateTimeFormatOptions) => {
    try {
      return new Intl.DateTimeFormat("es-AR", { ...options, timeZone: zone }).format(date);
    } catch {
      return new Intl.DateTimeFormat("es-AR", { ...options, timeZone: DEFAULT_TIMEZONE }).format(date);
    }
  };

  const day = safe({ weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const time = safe({ hour: "2-digit", minute: "2-digit", hour12: false });

  return `${day} a las ${time}`;
}

function layout(title: string, lines: string[], cta?: { label: string; href: string }): string {
  const body = lines.map((line) => `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:${COLORS.text}">${line}</p>`).join("");

  // El href se escapa porque desde que existe el link de videollamada puede
  // venir de un campo que carga una persona, no solo de rutas de la app.
  const button = cta
    ? `<a href="${escapeHtml(cta.href)}" style="display:inline-block;margin-top:8px;padding:12px 20px;background:${COLORS.primary};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;font-size:15px">${cta.label}</a>`
    : "";

  return `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:${COLORS.bg};font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
    <table role="presentation" width="100%" style="max-width:520px" cellpadding="0" cellspacing="0">
      <tr><td style="padding:0 0 16px"><span style="font-size:18px;font-weight:700;color:${COLORS.primary}">PsicoLink</span></td></tr>
      <tr><td style="background:${COLORS.surface};border:1px solid ${COLORS.line};border-radius:12px;padding:28px">
        <h1 style="margin:0 0 16px;font-size:20px;line-height:1.3;color:${COLORS.text}">${title}</h1>
        ${body}
        ${button}
      </td></tr>
      <tr><td style="padding:16px 0;font-size:12px;color:${COLORS.muted}">Este es un aviso automático de PsicoLink.</td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

/** Detalle en texto plano, para el cliente de correo que no muestra HTML. */
function detailLines(data: AppointmentEmail): string[] {
  const lines = [
    `Cuándo: ${formatWhen(data.date, data.timezone)}`,
    `Duración: ${data.duration} minutos`,
  ];
  if (data.notes?.trim()) lines.push(`Motivo: ${data.notes.trim()}`);
  return lines;
}

function textMessage(greeting: string, data: AppointmentEmail, closing: string): string {
  return [greeting, "", ...detailLines(data), "", closing].join("\n");
}

function htmlDetail(data: AppointmentEmail): string {
  return detailLines(data)
    .map((line) => {
      const [label, ...rest] = line.split(": ");
      return `<strong>${escapeHtml(label)}:</strong> ${escapeHtml(rest.join(": "))}`;
    })
    .join("<br>");
}

export function newAppointmentForPsychologist(data: AppointmentEmail): Message {
  const subject = `Nuevo turno para confirmar — ${data.patientName}`;
  const greeting = `${data.patientName} pidió un turno con vos.`;
  const closing = "Confirmalo o rechazalo desde tu panel de turnos.";

  return {
    subject,
    text: textMessage(greeting, data, `${closing}\n${data.appUrl}/dashboard/turnos`),
    html: layout(
      "Tenés un turno para confirmar",
      [`<strong>${escapeHtml(data.patientName)}</strong> pidió un turno con vos.`, htmlDetail(data), closing],
      { label: "Ver mis turnos", href: `${data.appUrl}/dashboard/turnos` }
    ),
  };
}

export function newAppointmentForPatient(data: AppointmentEmail): Message {
  const subject = "Recibimos tu solicitud de turno";
  const greeting = `Pediste un turno con ${data.psychologistName}.`;
  const closing = "Te vamos a avisar por mail apenas lo confirme.";

  return {
    subject,
    text: textMessage(greeting, data, closing),
    html: layout(
      "Recibimos tu solicitud",
      [`Pediste un turno con <strong>${escapeHtml(data.psychologistName)}</strong>.`, htmlDetail(data), closing],
      { label: "Ver mis turnos", href: `${data.appUrl}/patient` }
    ),
  };
}

export function appointmentConfirmedForPatient(data: AppointmentEmail): Message {
  const subject = `Turno confirmado — ${formatWhen(data.date, data.timezone)}`;
  const greeting = `${data.psychologistName} confirmó tu turno.`;
  const closing = "Si no vas a poder ir, cancelalo con tiempo desde tu panel.";

  // Con link de videollamada, el botón lleva directo a la sala: es lo que la
  // persona va a querer tocar cuando llegue la hora, y tenerlo en el correo
  // evita tener que abrir la app para buscarlo.
  const cta = data.meetingUrl
    ? { label: "Entrar a la videollamada", href: data.meetingUrl }
    : { label: "Ver mis turnos", href: `${data.appUrl}/patient` };

  const lineaLink = data.meetingUrl ? [`Link de la sesión: ${data.meetingUrl}`] : [];

  return {
    subject,
    text: [greeting, "", ...detailLines(data), ...lineaLink, "", closing].join("\n"),
    html: layout(
      "Tu turno quedó confirmado",
      [
        `<strong>${escapeHtml(data.psychologistName)}</strong> confirmó tu turno.`,
        htmlDetail(data),
        ...(data.meetingUrl
          ? [`<strong>Link de la sesión:</strong> ${escapeHtml(data.meetingUrl)}`]
          : []),
        closing,
      ],
      cta
    ),
  };
}

export function appointmentCancelledForPatient(data: AppointmentEmail): Message {
  const subject = "Tu turno fue cancelado";
  const greeting = `${data.psychologistName} canceló el turno que tenías reservado.`;
  const closing = "Podés reservar otro horario cuando quieras.";

  return {
    subject,
    text: textMessage(greeting, data, closing),
    html: layout(
      "Tu turno fue cancelado",
      [`<strong>${escapeHtml(data.psychologistName)}</strong> canceló el turno que tenías reservado.`, htmlDetail(data), closing],
      { label: "Reservar otro turno", href: `${data.appUrl}/patient` }
    ),
  };
}

/**
 * Turno movido de horario. Lleva el horario anterior además del nuevo: quien
 * lo recibe tiene que poder reconocer de cuál de sus turnos le están hablando.
 */
export function appointmentRescheduled(
  data: AppointmentEmail & { previousDate: Date; movedBy: "PATIENT" | "PSYCHOLOGIST" }
): Message {
  const quien = data.movedBy === "PATIENT" ? data.patientName : data.psychologistName;
  const antes = formatWhen(data.previousDate, data.timezone);
  const subject = `Turno reprogramado — ${formatWhen(data.date, data.timezone)}`;
  const greeting = `${quien} movió el turno que estaba agendado para el ${antes}.`;
  const closing =
    data.movedBy === "PATIENT"
      ? "Queda pendiente de tu confirmación."
      : "Si el horario nuevo no te sirve, podés cancelarlo desde tu panel.";

  return {
    subject,
    text: textMessage(greeting, data, closing),
    html: layout(
      "Se movió un turno",
      [
        `<strong>${escapeHtml(quien)}</strong> movió el turno que estaba agendado para el ${escapeHtml(antes)}.`,
        htmlDetail(data),
        closing,
      ],
      {
        label: "Ver mis turnos",
        href: data.movedBy === "PATIENT" ? `${data.appUrl}/dashboard/turnos` : `${data.appUrl}/patient`,
      }
    ),
  };
}

/**
 * Pago rechazado. No reutiliza la plantilla de cancelación porque diría que lo
 * canceló el profesional, y no fue así: se cayó el pago.
 */
export function paymentFailedForPatient(data: AppointmentEmail): Message {
  const subject = "No pudimos procesar tu pago";
  const greeting = `El pago del turno con ${data.psychologistName} no se pudo procesar, así que el horario quedó liberado.`;
  const closing = "Podés intentar de nuevo reservando otra vez. No se te cobró nada.";

  return {
    subject,
    text: textMessage(greeting, data, closing),
    html: layout(
      "No pudimos procesar tu pago",
      [
        `El pago del turno con <strong>${escapeHtml(data.psychologistName)}</strong> no se pudo procesar, así que el horario quedó liberado.`,
        htmlDetail(data),
        closing,
      ],
      { label: "Reservar de nuevo", href: `${data.appUrl}/patient` }
    ),
  };
}

export function appointmentCancelledForPsychologist(data: AppointmentEmail): Message {
  const subject = `Turno cancelado — ${data.patientName}`;
  const greeting = `${data.patientName} canceló su turno.`;
  const closing = "El horario vuelve a estar disponible en tu agenda.";

  return {
    subject,
    text: textMessage(greeting, data, closing),
    html: layout(
      "Se canceló un turno",
      [`<strong>${escapeHtml(data.patientName)}</strong> canceló su turno.`, htmlDetail(data), closing],
      { label: "Ver mis turnos", href: `${data.appUrl}/dashboard/turnos` }
    ),
  };
}
