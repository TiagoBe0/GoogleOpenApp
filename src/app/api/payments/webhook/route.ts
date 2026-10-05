import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { notifyAppointmentConfirmed, notifyPaymentFailed } from "@/lib/notifications";
import { signatureGate, verifySignature } from "@/lib/mercadopago";
import { applyPayment } from "@/lib/payment-sync";

/**
 * Aviso de pago de MercadoPago. Este endpoint es público y es el que decide si
 * un turno pasa a confirmado, así que todo lo que entra se verifica: la firma,
 * que el pago corresponda al turno, y que el importe y la moneda sean los que
 * el turno costaba.
 */

function checkSignature(req: NextRequest, dataId: string): { ok: boolean; reason?: string } {
  const secret = process.env.MP_WEBHOOK_SECRET;
  const gate = signatureGate(secret, process.env.NODE_ENV === "production");

  if (gate === "reject") {
    console.error("[webhook] MP_WEBHOOK_SECRET no está configurado: se rechaza el aviso.");
    return { ok: false, reason: "Webhook sin clave configurada" };
  }

  if (gate === "skip-development") {
    console.warn("[webhook] Sin MP_WEBHOOK_SECRET: la firma NO se verifica (solo desarrollo).");
    return { ok: true };
  }

  const valid = verifySignature({
    secret: secret!,
    header: req.headers.get("x-signature"),
    requestId: req.headers.get("x-request-id"),
    dataId,
  });

  return valid ? { ok: true } : { ok: false, reason: "Firma inválida" };
}

export async function POST(req: NextRequest) {
  let payload: { type?: string; data?: { id?: string } };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  // La firma cubre el id que viaja en la query; si el cuerpo apunta a otro
  // pago, la firma no ampara ese otro pago.
  const queryDataId = new URL(req.url).searchParams.get("data.id") ?? "";
  const signature = checkSignature(req, queryDataId);
  if (!signature.ok) {
    return NextResponse.json({ error: signature.reason }, { status: 401 });
  }

  if (payload.type !== "payment" || !payload.data?.id) {
    return NextResponse.json({ ok: true });
  }

  const paymentId = String(payload.data.id);

  if (queryDataId && queryDataId !== paymentId) {
    console.error("[webhook] El pago del cuerpo no coincide con el de la firma.");
    return NextResponse.json({ error: "Aviso inconsistente" }, { status: 400 });
  }

  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });

  if (!mpRes.ok) {
    return NextResponse.json({ error: "Error al obtener pago" }, { status: 502 });
  }

  const payment = (await mpRes.json()) as {
    external_reference?: string;
    status?: string;
    transaction_amount?: number;
    currency_id?: string;
  };

  const appointmentId = payment.external_reference;
  if (!appointmentId) return NextResponse.json({ ok: true });

  // La misma decisión que usa la reconciliación al volver del checkout.
  const applied = await applyPayment(appointmentId, {
    id: paymentId,
    status: payment.status ?? "",
    transactionAmount: payment.transaction_amount,
    currencyId: payment.currency_id,
  });

  if (!applied) return NextResponse.json({ ok: true });

  // MercadoPago reintenta el mismo aviso varias veces, y la reconciliación
  // puede haberlo procesado antes. `changed` es false salvo que el turno haya
  // cambiado de estado ahora, así que el correo sale una sola vez.
  if (applied.changed) {
    const status = applied.newStatus;
    after(() =>
      status === "CONFIRMED"
        ? notifyAppointmentConfirmed(appointmentId)
        : notifyPaymentFailed(appointmentId)
    );
  }

  return NextResponse.json({ ok: true });
}
