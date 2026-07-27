import { prisma } from "./prisma";
import { sendMail, type MailAttachment } from "./mailer";
import { buildIcs } from "./ics";
import { DEFAULT_TIMEZONE } from "./timezone";
import {
  appointmentCancelledForPatient,
  appointmentCancelledForPsychologist,
  appointmentConfirmedForPatient,
  appointmentRescheduled,
  newAppointmentForPatient,
  newAppointmentForPsychologist,
  paymentFailedForPatient,
  type AppointmentEmail,
} from "./emails";

/**
 * Avisos por correo del ciclo de vida del turno. Se llaman desde `after()` en
 * las rutas: nada de esto bloquea la respuesta ni puede hacerla fallar.
 */

interface Parties {
  data: AppointmentEmail;
  patientEmail: string | null;
  psychologistEmail: string | null;
  appointmentId: string;
  /** Dirección del consultorio, solo si atiende presencial. */
  location: string | null;
  /** Versión del evento: sube con cada reprogramación. */
  sequence: number;
}

/**
 * Adjunta el turno como archivo de calendario. El paciente lo agenda con un
 * clic en Google Calendar, Outlook o el iPhone, sin que el profesional tenga
 * que haber conectado su cuenta de Google.
 *
 * Solo se adjunta al confirmar y al cancelar: un turno que todavía está
 * pendiente no tiene por qué meterse en la agenda de nadie.
 */
function icsAttachment(
  parties: Parties,
  status: "CONFIRMED" | "CANCELLED"
): MailAttachment[] {
  if (!parties.psychologistEmail) return [];

  const content = buildIcs({
    // El UID tiene que ser el mismo turno siempre: es lo que permite que la
    // cancelación pise el evento que ya se agendó.
    uid: `${parties.appointmentId}@psicolink`,
    start: parties.data.date,
    durationMinutes: parties.data.duration,
    summary: `Sesión con ${parties.data.psychologistName}`,
    description: parties.data.notes,
    location: parties.location,
    organizer: { name: parties.data.psychologistName, email: parties.psychologistEmail },
    attendee: parties.patientEmail
      ? { name: parties.data.patientName, email: parties.patientEmail }
      : null,
    status,
    // Cada versión del evento tiene que traer una secuencia mayor que la
    // anterior, o el cliente de calendario la ignora por considerarla vieja.
    // La cancelación suma uno para superar siempre a la última invitación.
    sequence: status === "CANCELLED" ? parties.sequence + 1 : parties.sequence,
  });

  return [
    {
      filename: status === "CANCELLED" ? "turno-cancelado.ics" : "turno.ics",
      content,
      contentType: `text/calendar; charset=utf-8; method=${status === "CANCELLED" ? "CANCEL" : "REQUEST"}`,
    },
  ];
}

function appUrl(): string {
  return (process.env.NEXTAUTH_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Reúne los datos del turno y de las dos partes, o null si el turno ya no está. */
async function loadParties(appointmentId: string): Promise<Parties | null> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: { select: { name: true, email: true } },
      psychologist: {
        select: {
          name: true,
          email: true,
          psychologistProfile: {
            select: {
              timezone: true,
              address: true,
              city: true,
              country: true,
              modalityPresential: true,
            },
          },
        },
      },
    },
  });

  if (!appointment) return null;

  // El paciente puede no tener cuenta: en la reserva pública sus datos viajan
  // en el propio turno.
  const patientEmail = appointment.patient?.email ?? appointment.patientEmail ?? null;
  const patientName =
    appointment.patient?.name ?? appointment.patientName ?? patientEmail ?? "Un paciente";

  const profile = appointment.psychologist.psychologistProfile;
  const location = profile?.modalityPresential
    ? [profile.address, profile.city, profile.country].filter(Boolean).join(", ") || null
    : null;

  return {
    appointmentId: appointment.id,
    location,
    sequence: appointment.calendarSequence,
    data: {
      patientName,
      psychologistName:
        appointment.psychologist.name ?? appointment.psychologist.email ?? "Tu profesional",
      date: appointment.date,
      duration: appointment.duration,
      timezone: appointment.psychologist.psychologistProfile?.timezone ?? DEFAULT_TIMEZONE,
      notes: appointment.notes,
      appUrl: appUrl(),
    },
    patientEmail,
    psychologistEmail: appointment.psychologist.email ?? null,
  };
}

/** Corre el aviso sin dejar que un fallo escale a quien lo disparó. */
async function safely(label: string, run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch (err) {
    console.error(`[notifications] Falló el aviso ${label}:`, err);
  }
}

/** Turno recién pedido: al profesional para que lo confirme, al paciente como acuse. */
export function notifyNewAppointment(appointmentId: string): Promise<void> {
  return safely(`nuevo turno ${appointmentId}`, async () => {
    const parties = await loadParties(appointmentId);
    if (!parties) return;

    await Promise.all([
      parties.psychologistEmail
        ? sendMail(parties.psychologistEmail, newAppointmentForPsychologist(parties.data))
        : null,
      parties.patientEmail
        ? sendMail(parties.patientEmail, newAppointmentForPatient(parties.data))
        : null,
    ]);
  });
}

export function notifyAppointmentConfirmed(appointmentId: string): Promise<void> {
  return safely(`turno confirmado ${appointmentId}`, async () => {
    const parties = await loadParties(appointmentId);
    if (!parties?.patientEmail) return;

    await sendMail(
      parties.patientEmail,
      appointmentConfirmedForPatient(parties.data),
      icsAttachment(parties, "CONFIRMED")
    );
  });
}

/**
 * Turno movido de horario. El aviso va a la otra parte, con un .ics que
 * actualiza el evento ya agendado en vez de duplicarlo.
 */
export function notifyAppointmentRescheduled(
  appointmentId: string,
  previousDate: Date,
  movedBy: "PATIENT" | "PSYCHOLOGIST"
): Promise<void> {
  return safely(`turno reprogramado ${appointmentId}`, async () => {
    const parties = await loadParties(appointmentId);
    if (!parties) return;

    const destinatario =
      movedBy === "PATIENT" ? parties.psychologistEmail : parties.patientEmail;
    if (!destinatario) return;

    await sendMail(
      destinatario,
      appointmentRescheduled({ ...parties.data, previousDate, movedBy }),
      icsAttachment(parties, "CONFIRMED")
    );
  });
}

/** Pago rechazado: el horario se liberó y el paciente tiene que enterarse. */
export function notifyPaymentFailed(appointmentId: string): Promise<void> {
  return safely(`pago rechazado ${appointmentId}`, async () => {
    const parties = await loadParties(appointmentId);
    if (!parties?.patientEmail) return;

    await sendMail(parties.patientEmail, paymentFailedForPatient(parties.data));
  });
}

/** El aviso va siempre a la otra parte: quien canceló ya sabe que canceló. */
export function notifyAppointmentCancelled(
  appointmentId: string,
  cancelledBy: "PATIENT" | "PSYCHOLOGIST"
): Promise<void> {
  return safely(`turno cancelado ${appointmentId}`, async () => {
    const parties = await loadParties(appointmentId);
    if (!parties) return;

    // El .ics de cancelación borra el evento de la agenda de quien lo recibe.
    const attachment = icsAttachment(parties, "CANCELLED");

    if (cancelledBy === "PSYCHOLOGIST") {
      if (parties.patientEmail) {
        await sendMail(
          parties.patientEmail,
          appointmentCancelledForPatient(parties.data),
          attachment
        );
      }
      return;
    }

    if (parties.psychologistEmail) {
      await sendMail(
        parties.psychologistEmail,
        appointmentCancelledForPsychologist(parties.data),
        attachment
      );
    }
  });
}
