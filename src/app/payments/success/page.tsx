import Link from "next/link";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { reconcileAppointment } from "@/lib/payment-sync";
import { notifyAppointmentConfirmed, notifyPaymentFailed } from "@/lib/notifications";

/**
 * Vuelta del checkout de MercadoPago.
 *
 * Acá se pone al día el turno en vez de dar por hecho que el pago salió bien.
 * El aviso de MercadoPago puede no haber llegado todavía, o no llegar nunca, y
 * decirle "pago confirmado" a alguien cuyo pago fue rechazado es peor que no
 * decirle nada: se va tranquilo a un turno que no existe.
 */
export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ appointment?: string }>;
}) {
  const { appointment: appointmentId } = await searchParams;

  let status: string | null = null;

  if (appointmentId) {
    const applied = await reconcileAppointment(appointmentId);

    // Si acá se resolvió el pago antes que el webhook, el aviso sale de acá.
    if (applied?.changed) {
      const nuevo = applied.newStatus;
      after(() =>
        nuevo === "CONFIRMED"
          ? notifyAppointmentConfirmed(appointmentId)
          : notifyPaymentFailed(appointmentId)
      );
    }

    status =
      (
        await prisma.appointment.findUnique({
          where: { id: appointmentId },
          select: { status: true },
        })
      )?.status ?? null;
  }

  const confirmed = status === "CONFIRMED";
  const cancelled = status === "CANCELLED";

  const copy = confirmed
    ? {
        title: "Pago confirmado",
        body: "Tu turno quedó reservado. Te mandamos el detalle por mail, con el archivo para agendarlo en tu calendario.",
      }
    : cancelled
      ? {
          title: "El pago no se completó",
          body: "No pudimos procesar el pago, así que el horario quedó liberado. No se te cobró nada y podés reservar de nuevo cuando quieras.",
        }
      : {
          title: "Estamos confirmando tu pago",
          body: "MercadoPago todavía no nos informó el resultado. Puede tardar unos minutos. Te avisamos por mail apenas se resuelva.",
        };

  // Clases completas y no interpoladas: Tailwind las extrae del código fuente,
  // así que una clase armada con template string no se genera nunca.
  const iconBg = confirmed
    ? "bg-primary-soft"
    : cancelled
      ? "bg-danger-soft"
      : "bg-pending-soft";

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="bg-surface rounded-lg border border-line p-10 max-w-sm w-full shadow-sm">
        <div className={`w-16 h-16 ${iconBg} rounded-full flex items-center justify-center mb-5`}>
          {confirmed ? (
            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : cancelled ? (
            <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-8 h-8 text-pending" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <h1 className="font-display text-3xl font-semibold text-ink mb-2">{copy.title}</h1>
        <p className="text-muted text-sm mb-6">{copy.body}</p>
        {appointmentId && (
          <p className="text-xs text-muted mb-6">Referencia: {appointmentId}</p>
        )}
        <div className="space-y-2">
          <Link
            href="/patient"
            className="flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hi"
          >
            Ver mis turnos
          </Link>
          <Link
            href="/"
            className="flex min-h-11 w-full items-center justify-center rounded-md text-primary font-semibold text-sm hover:bg-surface-2 transition-colors"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
