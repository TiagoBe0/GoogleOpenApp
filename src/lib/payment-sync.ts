import { prisma } from "./prisma";
import { amountCovers, currencyMatches, statusForPayment } from "./mercadopago";

/**
 * Estado del pago de un turno.
 *
 * Existe porque el aviso de MercadoPago puede no llegar nunca: se cae la red,
 * el servidor estaba reiniciando, la URL estaba mal configurada. Sin esto el
 * paciente paga, vuelve a la app y el turno se queda en "pendiente" para
 * siempre, sin que nadie lo revise.
 *
 * La decisión de qué hacer con un pago vive acá y la usan los dos caminos, el
 * webhook y la reconciliación: si estuviera duplicada, terminarían discrepando
 * y el mismo pago daría resultados distintos según quién lo procese.
 */

export interface PaymentFacts {
  id: string;
  status: string;
  transactionAmount?: number | null;
  currencyId?: string | null;
}

export interface AppointmentCharge {
  status: string;
  amount: number | null;
  currency: string | null;
}

export type PaymentOutcome = {
  /** Estado nuevo del turno, o null si el pago no lo cambia. */
  newStatus: "CONFIRMED" | "CANCELLED" | null;
  /** true cuando el pago no cubre lo que costaba el turno. */
  mismatch: boolean;
};

/**
 * Un pago aprobado por menos de lo que costaba el turno, o en otra moneda, no
 * confirma nada: queda registrado y el turno sigue pendiente para que el
 * profesional lo resuelva a mano.
 */
export function decidePaymentOutcome(
  payment: PaymentFacts,
  appointment: AppointmentCharge
): PaymentOutcome {
  const status = statusForPayment(payment.status);

  if (status !== "CONFIRMED") return { newStatus: status, mismatch: false };

  const covers = amountCovers(payment.transactionAmount, appointment.amount);
  const sameCurrency = currencyMatches(payment.currencyId, appointment.currency);

  if (!covers || !sameCurrency) return { newStatus: null, mismatch: true };

  return { newStatus: "CONFIRMED", mismatch: false };
}

export interface AppliedPayment {
  /** true solo si el turno cambió de estado ahora: es lo que gatilla el aviso. */
  changed: boolean;
  newStatus: "CONFIRMED" | "CANCELLED" | null;
  mismatch: boolean;
}

/**
 * Guarda el pago en el turno y dice si hubo un cambio de estado. Quien llama
 * decide qué avisar; acá no se manda correo, para que el webhook y la
 * reconciliación no se pisen mandando el mismo aviso dos veces.
 */
export async function applyPayment(
  appointmentId: string,
  payment: PaymentFacts
): Promise<AppliedPayment | null> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    select: { status: true, amount: true, currency: true },
  });

  if (!appointment) return null;

  const outcome = decidePaymentOutcome(payment, appointment);

  if (outcome.mismatch) {
    console.error(
      `[pagos] El pago ${payment.id} no coincide con el turno ${appointmentId}: ` +
        `pagó ${payment.transactionAmount} ${payment.currencyId}, ` +
        `esperaba ${appointment.amount} ${appointment.currency}.`
    );
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      paymentId: payment.id,
      paymentStatus: payment.status,
      ...(outcome.newStatus ? { status: outcome.newStatus } : {}),
    },
  });

  return {
    changed: !!outcome.newStatus && appointment.status !== outcome.newStatus,
    newStatus: outcome.newStatus,
    mismatch: outcome.mismatch,
  };
}

/**
 * Le pregunta a MercadoPago por los pagos de un turno. Devuelve el más
 * reciente: si alguien reintentó tras un rechazo, el que vale es el último.
 */
export async function fetchLatestPayment(appointmentId: string): Promise<PaymentFacts | null> {
  if (!process.env.MP_ACCESS_TOKEN) return null;

  try {
    const url = new URL("https://api.mercadopago.com/v1/payments/search");
    url.searchParams.set("external_reference", appointmentId);
    url.searchParams.set("sort", "date_created");
    url.searchParams.set("criteria", "desc");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
    });

    if (!res.ok) {
      console.error("[pagos] No se pudo consultar el pago:", res.status);
      return null;
    }

    const data = (await res.json()) as {
      results?: Array<{
        id?: number | string;
        status?: string;
        transaction_amount?: number;
        currency_id?: string;
      }>;
    };

    const payment = data.results?.[0];
    if (!payment?.id || !payment.status) return null;

    return {
      id: String(payment.id),
      status: payment.status,
      transactionAmount: payment.transaction_amount,
      currencyId: payment.currency_id,
    };
  } catch (err) {
    console.error("[pagos] Error consultando el pago:", err);
    return null;
  }
}

/**
 * Pone al día el turno preguntándole a MercadoPago. Nunca lanza: se usa al
 * volver del checkout, y una consulta fallida no puede romperle la pantalla al
 * paciente que acaba de pagar.
 */
export async function reconcileAppointment(appointmentId: string): Promise<AppliedPayment | null> {
  try {
    const payment = await fetchLatestPayment(appointmentId);
    if (!payment) return null;

    return await applyPayment(appointmentId, payment);
  } catch (err) {
    console.error(`[pagos] Falló la reconciliación de ${appointmentId}:`, err);
    return null;
  }
}
