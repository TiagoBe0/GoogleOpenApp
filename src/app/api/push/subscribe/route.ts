import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { publicKey } from "@/lib/push";

/**
 * Ciclo de vida de la suscripción a avisos push del navegador.
 *
 * GET    devuelve la clave pública VAPID, que es lo único que el navegador
 *        necesita para suscribirse. Se sirve en runtime y no como
 *        NEXT_PUBLIC_* para no tener que reconstruir la app si rotan las
 *        claves.
 * POST   registra este navegador.
 * DELETE lo da de baja.
 */

export async function GET() {
  const key = publicKey();
  // Sin clave configurada el cliente no debe ni ofrecer el botón de activar.
  return NextResponse.json({ publicKey: key, enabled: key !== null });
}

interface SubscriptionBody {
  endpoint?: unknown;
  keys?: { p256dh?: unknown; auth?: unknown };
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  let body: SubscriptionBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  const endpoint = body.endpoint;
  const p256dh = body.keys?.p256dh;
  const authKey = body.keys?.auth;

  if (
    typeof endpoint !== "string" ||
    typeof p256dh !== "string" ||
    typeof authKey !== "string"
  ) {
    return NextResponse.json({ error: "Suscripción incompleta" }, { status: 400 });
  }

  // El endpoint es único: si el mismo navegador vuelve a suscribirse, se
  // actualizan sus claves en vez de duplicar la fila. Y el userId se reasigna,
  // que es lo correcto cuando dos personas usan el mismo dispositivo: los
  // avisos tienen que seguir a quien tiene la sesión abierta ahora.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    create: { endpoint, p256dh, auth: authKey, userId: session.user.id },
    update: { p256dh, auth: authKey, userId: session.user.id },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  let endpoint: unknown;
  try {
    endpoint = (await request.json())?.endpoint;
  } catch {
    return NextResponse.json({ error: "Cuerpo inválido" }, { status: 400 });
  }

  if (typeof endpoint !== "string") {
    return NextResponse.json({ error: "Falta el endpoint" }, { status: 400 });
  }

  // Acotado al usuario de la sesión: sin eso, cualquiera con sesión iniciada
  // podría dar de baja los avisos de otra persona mandando su endpoint.
  await prisma.pushSubscription.deleteMany({
    where: { endpoint, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
