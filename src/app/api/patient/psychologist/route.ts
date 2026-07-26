import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { refuseLink } from "@/lib/linking";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "PATIENT") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  const patient = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      psychologist: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return NextResponse.json(patient?.psychologist ?? null);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  // Se acepta slug o email. El slug es el camino de un clic desde /p/[slug];
  // el email queda para quien vincula a mano desde su panel.
  const { email, slug } = await req.json();
  if (!email && !slug) {
    return NextResponse.json({ error: "Email o slug requerido" }, { status: 400 });
  }

  const psychologist = slug
    ? (await prisma.psychologistProfile.findUnique({ where: { slug }, select: { user: true } }))?.user
    : await prisma.user.findUnique({ where: { email } });

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, psychologistId: true },
  });

  // Las reglas viven en lib/linking, testeadas sin base de datos.
  const refusal = refuseLink(me, psychologist ?? null);
  if (refusal) {
    // El mensaje de "no existe" se ajusta a cómo vino la búsqueda.
    const error =
      refusal.status === 404 && email ? "No existe un usuario con ese email" : refusal.error;
    return NextResponse.json({ error }, { status: refusal.status });
  }
  // refuseLink ya descartó el caso ausente; esta guarda es para que TypeScript
  // lo sepa y no para repetir la regla.
  if (!psychologist) {
    return NextResponse.json({ error: "No existe ese profesional" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { psychologistId: psychologist.id },
  });

  return NextResponse.json(
    { id: psychologist.id, name: psychologist.name, email: psychologist.email, image: psychologist.image },
    { status: 201 }
  );
}

export async function DELETE() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "PATIENT") return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { psychologistId: null },
  });

  return NextResponse.json({ ok: true });
}
