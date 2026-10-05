import { formatWhen } from "./emails";

/**
 * Contenido de los avisos push. Funciones puras, una por aviso, igual que
 * `emails.ts`.
 *
 * **Ningún aviso nombra al profesional ni al paciente, a propósito.** Un push
 * se muestra en la pantalla bloqueada, donde lo lee cualquiera que levante el
 * teléfono. "Turno confirmado con la Lic. González" delata que esa persona
 * está en terapia y con quién. Los avisos dicen qué pasó y cuándo; el quién
 * está a un toque, ya dentro de la app con sesión iniciada.
 *
 * Por la misma razón el cuerpo no incluye el motivo de consulta ni las notas.
 */

export interface PushPayload {
  title: string;
  body: string;
  /** Ruta a abrir al tocar el aviso. Relativa: el service worker la resuelve. */
  url: string;
  /**
   * Agrupa los avisos de un mismo turno. Si llega uno nuevo, reemplaza al
   * anterior en vez de apilarse: a quien reprograma dos veces no le quedan
   * tres avisos contradictorios en la barra.
   */
  tag: string;
}

export interface AppointmentPush {
  appointmentId: string;
  /** Instante del turno, en UTC. */
  date: Date;
  /** Zona horaria del profesional: es la que manda para mostrar la hora. */
  timezone: string;
}

const PANEL_PROFESIONAL = "/dashboard/turnos";
const PANEL_PACIENTE = "/patient";

function tagFor(appointmentId: string): string {
  return `turno-${appointmentId}`;
}

/** Al profesional: alguien pidió un turno y espera confirmación. */
export function newAppointmentForPsychologist(data: AppointmentPush): PushPayload {
  return {
    title: "Turno para confirmar",
    body: `Te pidieron un turno para el ${formatWhen(data.date, data.timezone)}.`,
    url: PANEL_PROFESIONAL,
    tag: tagFor(data.appointmentId),
  };
}

/** Al paciente: acuse de que el pedido entró y todavía no está confirmado. */
export function newAppointmentForPatient(data: AppointmentPush): PushPayload {
  return {
    title: "Pedido enviado",
    body: `Tu turno del ${formatWhen(data.date, data.timezone)} espera confirmación.`,
    url: PANEL_PACIENTE,
    tag: tagFor(data.appointmentId),
  };
}

export function appointmentConfirmedForPatient(data: AppointmentPush): PushPayload {
  return {
    title: "Turno confirmado",
    body: `Quedó confirmado para el ${formatWhen(data.date, data.timezone)}.`,
    url: PANEL_PACIENTE,
    tag: tagFor(data.appointmentId),
  };
}

/**
 * Turno movido. Va a la otra parte: quien lo movió ya sabe que lo movió.
 * Se nombra solo el horario nuevo; el viejo ya no le sirve a nadie.
 */
export function appointmentRescheduled(
  data: AppointmentPush,
  movedBy: "PATIENT" | "PSYCHOLOGIST",
): PushPayload {
  return {
    title: "Turno reprogramado",
    body: `Nuevo horario: ${formatWhen(data.date, data.timezone)}.`,
    url: movedBy === "PATIENT" ? PANEL_PROFESIONAL : PANEL_PACIENTE,
    tag: tagFor(data.appointmentId),
  };
}

export function appointmentCancelledForPatient(data: AppointmentPush): PushPayload {
  return {
    title: "Turno cancelado",
    body: `Se canceló el turno del ${formatWhen(data.date, data.timezone)}.`,
    url: PANEL_PACIENTE,
    tag: tagFor(data.appointmentId),
  };
}

export function appointmentCancelledForPsychologist(data: AppointmentPush): PushPayload {
  return {
    title: "Turno cancelado",
    body: `Se canceló el turno del ${formatWhen(data.date, data.timezone)}.`,
    url: PANEL_PROFESIONAL,
    tag: tagFor(data.appointmentId),
  };
}

/** Pago rechazado: el horario se liberó y el paciente tiene que enterarse. */
export function paymentFailedForPatient(data: AppointmentPush): PushPayload {
  return {
    title: "El pago no se completó",
    body: `El turno del ${formatWhen(data.date, data.timezone)} sigue sin confirmar.`,
    url: PANEL_PACIENTE,
    tag: tagFor(data.appointmentId),
  };
}
