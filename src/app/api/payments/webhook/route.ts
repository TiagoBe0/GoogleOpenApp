import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MercadoPagoConfig, Payment } from "mercadopago";

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
const paymentClient = new Payment(mp);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: true });

  const { type, data } = body;

  // MercadoPago sends type="payment" with data.id = payment ID
  if (type !== "payment" || !data?.id) {
    return NextResponse.json({ ok: true });
  }

  const payment = await paymentClient.get({ id: String(data.id) });

  const appointmentId = payment.external_reference;
  const status = payment.status; // approved | rejected | in_process | pending
  const paymentId = String(payment.id);

  if (!appointmentId) return NextResponse.json({ ok: true });

  const appointmentStatus =
    status === "approved" ? "confirmed"
    : status === "rejected" ? "cancelled"
    : "pending_payment";

  await prisma.appointment.updateMany({
    where: { id: appointmentId },
    data: {
      paymentStatus: status ?? "pending",
      paymentId,
      status: appointmentStatus,
    },
  });

  return NextResponse.json({ ok: true });
}
