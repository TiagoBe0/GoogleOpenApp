import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const VALID_ROLES = ["PATIENT", "PSYCHOLOGIST"] as const;
type ValidRole = (typeof VALID_ROLES)[number];

function isValidRole(value: unknown): value is ValidRole {
  return typeof value === "string" && (VALID_ROLES as readonly string[]).includes(value);
}

/**
 * Elección de rol de quien entró con Google, que no puede declararlo durante
 * el login. Se responde una sola vez: después queda `roleChosen` en true y el
 * endpoint deja de aceptar cambios, para que nadie se cambie de rol y arrastre
 * turnos o pacientes de un lado al otro.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const { role } = await req.json();
  if (!isValidRole(role)) {
    return NextResponse.json({ error: "Rol inválido" }, { status: 400 });
  }

  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { roleChosen: true },
  });
  if (!me) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  if (me.roleChosen) {
    return NextResponse.json({ error: "Ya elegiste cómo usar PsicoLink" }, { status: 409 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { role, roleChosen: true },
  });

  return NextResponse.json({ role, redirectTo: role === "PSYCHOLOGIST" ? "/dashboard" : "/patient" });
}
