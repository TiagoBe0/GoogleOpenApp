import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MercadoPagoConfig, Preference } from "mercadopago";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const isPatient = session.user.role === "PATIENT";

  const appointments = await prisma.appointment.findMany({
    where: isPatient
      ? { patientId: session.user.id }
      : { psychologistId: session.user.id },
    include: {
      patient: { select: { id: true, name: true, email: true, image: true } },
      psychologist: { select: { id: true, name: true, email: true } },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(appointments);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { date, duration, notes, psychologistId, patientName, patientEmail, patientPhone } = body;

  if (!date) return NextResponse.json({ error: "La fecha es requerida" }, { status: 400 });

  const session = await auth();
  const isRegistered = !!session && session.user.role === "PATIENT";

  // Anonymous bookings require contact data and explicit psychologistId
  if (!isRegistered && (!patientName || !patientEmail || !psychologistId)) {
    return NextResponse.json({ error: "Nombre, email y psicólogo son requeridos" }, { status: 400 });
  }

  // Registered patient: derive psychologistId from their linked psychologist
  let resolvedPsychologistId = psychologistId;
  if (isRegistered && !resolvedPsychologistId) {
    const patient = await prisma.user.findUnique({
      where: { id: session!.user.id },
      select: { psychologistId: true },
    });
    if (!patient?.psychologistId) {
      return NextResponse.json({ error: "No tenés un psicólogo asignado todavía" }, { status: 400 });
    }
    resolvedPsychologistId = patient.psychologistId;
  }

  const psychologist = await prisma.user.findUnique({
    where: { id: resolvedPsychologistId },
    include: { psychologistProfile: true },
  });

  if (!psychologist || psychologist.role !== "PSYCHOLOGIST") {
    return NextResponse.json({ error: "Psicólogo no encontrado" }, { status: 404 });
  }

  // Conflict check
  const appointmentDate = new Date(date);
  const durationMin = duration ?? psychologist.psychologistProfile?.sessionDuration ?? 50;
  const endDate = new Date(appointmentDate.getTime() + durationMin * 60 * 1000);

  const conflict = await prisma.appointment.findFirst({
    where: {
      psychologistId: resolvedPsychologistId,
      status: { not: "CANCELLED" },
      AND: [
        { date: { lt: endDate } },
        { date: { gte: new Date(appointmentDate.getTime() - durationMin * 60 * 1000) } },
      ],
    },
  });

  if (conflict) {
    return NextResponse.json({ error: "El horario no está disponible" }, { status: 409 });
  }

  const appointment = await prisma.appointment.create({
    data: {
      psychologistId: resolvedPsychologistId,
      date: appointmentDate,
      duration: durationMin,
      notes: notes ?? null,
      status: "PENDING",
      ...(isRegistered
        ? { patientId: session!.user.id }
        : { patientName, patientEmail, patientPhone: patientPhone ?? null }),
    },
  });

  // MercadoPago preference
  const fee = psychologist.psychologistProfile?.consultationFee;
  const currency = psychologist.psychologistProfile?.currency ?? "ARS";

  if (!fee || !process.env.MP_ACCESS_TOKEN) {
    return NextResponse.json({ appointment }, { status: 201 });
  }

  const mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
  const preferenceClient = new Preference(mpClient);
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  try {
    const preference = await preferenceClient.create({
      body: {
        items: [
          {
            id: appointment.id,
            title: `Consulta psicológica — ${psychologist.name || psychologist.email}`,
            description: `Turno el ${appointmentDate.toLocaleDateString("es-AR")} a las ${appointmentDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`,
            quantity: 1,
            unit_price: fee,
            currency_id: currency,
          },
        ],
        payer: isRegistered
          ? { name: session!.user.name ?? undefined, email: session!.user.email ?? undefined }
          : { name: patientName, email: patientEmail },
        back_urls: {
          success: `${baseUrl}/payments/success?appointment=${appointment.id}`,
          failure: `${baseUrl}/payments/failure?appointment=${appointment.id}`,
          pending: `${baseUrl}/payments/pending?appointment=${appointment.id}`,
        },
        auto_return: "approved",
        external_reference: appointment.id,
        notification_url: `${baseUrl}/api/payments/webhook`,
      },
    });

    await prisma.appointment.update({
      where: { id: appointment.id },
      data: { preferenceId: preference.id, amount: fee, currency },
    });

    return NextResponse.json(
      { appointment, checkoutUrl: preference.init_point, sandboxUrl: preference.sandbox_init_point },
      { status: 201 }
    );
  } catch {
    await prisma.appointment.delete({ where: { id: appointment.id } });
    return NextResponse.json({ error: "Error al crear el link de pago" }, { status: 500 });
  }
}
