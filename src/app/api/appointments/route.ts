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
  const { date, duration, notes, psychologistId, patientId, patientName, patientEmail, patientPhone, paymentProofUrl } = body;

  if (!date) return NextResponse.json({ error: "La fecha es requerida" }, { status: 400 });

  const session = await auth();
  const isRegistered = !!session && session.user.role === "PATIENT";
  const isPsychologist = !!session && session.user.role === "PSYCHOLOGIST";

  let linkedPatient: { id: string; name: string | null; email: string } | null = null;

  if (isPsychologist) {
    if (!patientId) {
      return NextResponse.json({ error: "Paciente requerido" }, { status: 400 });
    }

    linkedPatient = await prisma.user.findFirst({
      where: { id: patientId, psychologistId: session!.user.id, role: "PATIENT" },
      select: { id: true, name: true, email: true },
    });

    if (!linkedPatient) {
      return NextResponse.json({ error: "El paciente no está vinculado a tu cuenta" }, { status: 403 });
    }
  }

  // Anonymous bookings require contact data and explicit psychologistId
  if (!isRegistered && !isPsychologist && (!patientName || !patientEmail || !psychologistId)) {
    return NextResponse.json({ error: "Nombre, email y psicólogo son requeridos" }, { status: 400 });
  }

  // Registered patient: derive psychologistId from their linked psychologist
  let resolvedPsychologistId = isPsychologist ? session!.user.id : psychologistId;
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
      status: isPsychologist ? "CONFIRMED" : "PENDING",
      paymentProofUrl: paymentProofUrl ?? null,
      ...(isPsychologist
        ? { patientId: linkedPatient!.id }
        : isRegistered
        ? { patientId: session!.user.id }
        : { patientName, patientEmail, patientPhone: patientPhone ?? null }),
    },
  });

  if (isPsychologist) {
    if (session!.googleAccessToken) {
      const res = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session!.googleAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: `Sesión — ${linkedPatient!.name || linkedPatient!.email}`,
          description: notes ?? "",
          start: { dateTime: appointmentDate.toISOString(), timeZone: "America/Argentina/Buenos_Aires" },
          end: { dateTime: endDate.toISOString(), timeZone: "America/Argentina/Buenos_Aires" },
        }),
      });

      if (res.ok) {
        const event = await res.json();
        if (event.id) {
          await prisma.appointment.update({
            where: { id: appointment.id },
            data: { calendarEventId: event.id },
          });
        }
      }
    }

    return NextResponse.json({ appointment }, { status: 201 });
  }

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
