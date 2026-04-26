import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MercadoPagoConfig, Payment } from "mercadopago";
import { createHmac } from "crypto";

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
const paymentClient = new Payment(mp);

function verifySignature(req: NextRequest, rawBody: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  // If no secret is configured, skip verification (dev mode)
  if (!secret) return true;

  // MercadoPago sends: x-signature: ts=<timestamp>,v1=<hash>
  const signatureHeader = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id") ?? "";
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => p.split("=") as [string, string])
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // MP signs: "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
  // We extract data.id from the body for the manifest
  let dataId = "";
  try {
    const body = JSON.parse(rawBody);
    dataId = String(body?.data?.id ?? "");
  } catch {
    return false;
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  return expected === v1;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!verifySignature(req, rawBody)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let body: { type?: string; data?: { id?: unknown } } | null = null;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: true });
  }

  if (!body) return NextResponse.json({ ok: true });

  const { type, data } = body;

  if (type !== "payment" || !data?.id) {
    return NextResponse.json({ ok: true });
  }

  let payment;
  try {
    payment = await paymentClient.get({ id: String(data.id) });
  } catch {
    // Payment not found or MP API error — return 200 so MP doesn't retry forever
    return NextResponse.json({ ok: true });
  }

  const appointmentId = payment.external_reference;
  const status = payment.status;
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
