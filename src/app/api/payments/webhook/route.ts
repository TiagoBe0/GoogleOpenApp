import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHmac } from "crypto";

function verifySignature(req: NextRequest): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // skip in dev when not configured

  const signatureHeader = req.headers.get("x-signature");
  const requestId = req.headers.get("x-request-id");
  if (!signatureHeader) return false;

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((p) => p.trim().split("=") as [string, string])
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  const dataId = new URL(req.url).searchParams.get("data.id") ?? "";
  const manifest = `id:${dataId};request-id:${requestId ?? ""};ts:${ts};`;
  const expected = createHmac("sha256", secret).update(manifest).digest("hex");

  return expected === v1;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();

  if (!verifySignature(req)) {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  let payload: { type?: string; data?: { id?: string } };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (payload.type !== "payment" || !payload.data?.id) {
    return NextResponse.json({ ok: true });
  }

  const paymentId = String(payload.data.id);

  // Fetch real payment data from MP
  const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` },
  });

  if (!mpRes.ok) {
    return NextResponse.json({ error: "Error al obtener pago" }, { status: 502 });
  }

  const payment = await mpRes.json();
  const appointmentId: string = payment.external_reference;
  const mpStatus: string = payment.status;

  if (!appointmentId) return NextResponse.json({ ok: true });

  const appointmentStatusMap: Record<string, string> = {
    rejected: "CANCELLED",
    cancelled: "CANCELLED",
  };
  const paymentStatusMap: Record<string, string> = {
    approved: "PAID",
    pending: "PENDING",
    in_process: "PENDING",
    rejected: "REJECTED",
    cancelled: "CANCELLED",
  };

  const newStatus = appointmentStatusMap[mpStatus];

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      paymentId,
      paymentStatus: paymentStatusMap[mpStatus] ?? mpStatus,
      ...(newStatus ? { status: newStatus } : {}),
    },
  });

  return NextResponse.json({ ok: true });
}
