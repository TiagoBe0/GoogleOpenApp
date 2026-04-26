import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MercadoPagoConfig, Preference } from "mercadopago";

const mp = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN! });
const preference = new Preference(mp);

export async function POST(req: NextRequest) {
  const { psychologistId, patientName, patientEmail, patientPhone, scheduledAt, notes } =
    await req.json();

  if (!psychologistId || !patientName || !patientEmail || !scheduledAt) {
    return NextResponse.json({ error: "Faltan datos obligatorios" }, { status: 400 });
  }

  const [psy, profile] = await Promise.all([
    prisma.user.findUnique({ where: { id: psychologistId }, select: { name: true } }),
    prisma.psychologistProfile.findUnique({
      where: { userId: psychologistId },
      select: { consultationFee: true, currency: true, sessionDuration: true, acceptsNewPatients: true },
    }),
  ]);

  if (!psy || !profile) {
    return NextResponse.json({ error: "Psicólogo no encontrado" }, { status: 404 });
  }

  if (!profile.acceptsNewPatients) {
    return NextResponse.json({ error: "El profesional no acepta nuevos pacientes" }, { status: 409 });
  }

  const fee = profile.consultationFee ?? 0;
  const currency = profile.currency ?? "ARS";
  const duration = profile.sessionDuration ?? 50;

  // Verify slot is still free
  const slotDate = new Date(scheduledAt);
  const conflict = await prisma.appointment.findFirst({
    where: {
      psychologistId,
      scheduledAt: slotDate,
      status: { in: ["pending_payment", "confirmed"] },
    },
  });

  if (conflict) {
    return NextResponse.json({ error: "Este horario ya no está disponible" }, { status: 409 });
  }

  // Create appointment in pending_payment state
  const appointment = await prisma.appointment.create({
    data: {
      psychologistId,
      patientName,
      patientEmail,
      patientPhone: patientPhone ?? null,
      scheduledAt: slotDate,
      durationMinutes: duration,
      amount: fee,
      currency,
      notes: notes ?? null,
      status: "pending_payment",
      paymentStatus: "pending",
    },
  });

  // Create MercadoPago preference
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const pref = await preference.create({
    body: {
      items: [
        {
          id: appointment.id,
          title: `Consulta psicológica — ${psy.name}`,
          description: `Sesión el ${slotDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })} a las ${slotDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`,
          quantity: 1,
          unit_price: fee,
          currency_id: currency,
        },
      ],
      payer: { name: patientName, email: patientEmail },
      external_reference: appointment.id,
      back_urls: {
        success: `${baseUrl}/payments/success`,
        failure: `${baseUrl}/payments/failure`,
        pending: `${baseUrl}/payments/pending`,
      },
      auto_return: "approved",
      notification_url: `${baseUrl}/api/payments/webhook`,
      statement_descriptor: "PsicoApp",
    },
  });

  // Store preferenceId
  await prisma.appointment.update({
    where: { id: appointment.id },
    data: { preferenceId: pref.id },
  });

  return NextResponse.json({
    appointmentId: appointment.id,
    checkoutUrl: pref.init_point,
    sandboxUrl: pref.sandbox_init_point,
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const psychologistId = searchParams.get("psychologistId");

  if (!psychologistId) {
    return NextResponse.json({ error: "Falta psychologistId" }, { status: 400 });
  }

  const appointments = await prisma.appointment.findMany({
    where: { psychologistId },
    orderBy: { scheduledAt: "asc" },
  });

  return NextResponse.json({ appointments });
}
