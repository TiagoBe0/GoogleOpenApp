import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidRule, normalizeRules, type WeeklyRule } from "@/lib/availability";
import { loadAvailability, replaceAvailability } from "@/lib/availability-store";

/** Máximo de franjas por semana. Corta un request que quiera llenar la tabla. */
const MAX_RULES = 60;

/**
 * Con `psychologistId` es lectura pública: el calendario de reserva necesita
 * saber qué días atiende el profesional antes de que el paciente elija uno.
 * Sin el parámetro devuelve la agenda del profesional logueado.
 */
export async function GET(req: NextRequest) {
  const requested = new URL(req.url).searchParams.get("psychologistId");

  if (requested) {
    const psychologist = await prisma.user.findUnique({
      where: { id: requested },
      select: { role: true },
    });
    if (!psychologist || psychologist.role !== "PSYCHOLOGIST") {
      return NextResponse.json({ error: "Psicólogo no encontrado" }, { status: 404 });
    }
    return NextResponse.json(await loadAvailability(requested));
  }

  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "PSYCHOLOGIST") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  return NextResponse.json(await loadAvailability(session.user.id));
}

/** Reemplaza la agenda semanal completa. Un array vacío significa no atender. */
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (session.user.role !== "PSYCHOLOGIST") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  let body: { rules?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  if (!Array.isArray(body.rules)) {
    return NextResponse.json({ error: "Falta la lista de franjas" }, { status: 400 });
  }

  if (body.rules.length > MAX_RULES) {
    return NextResponse.json(
      { error: `No podés guardar más de ${MAX_RULES} franjas por semana` },
      { status: 400 }
    );
  }

  if (body.rules.some((r) => !isValidRule(r as Partial<WeeklyRule>))) {
    return NextResponse.json(
      { error: "Hay una franja inválida: el horario de fin tiene que ser posterior al de inicio" },
      { status: 400 }
    );
  }

  const rules = normalizeRules(body.rules as WeeklyRule[]);
  await replaceAvailability(session.user.id, rules);

  return NextResponse.json({ rules, usingDefaults: false });
}
