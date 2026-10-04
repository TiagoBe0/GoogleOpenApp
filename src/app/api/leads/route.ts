import { NextRequest, NextResponse, after } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { newLeadNotification, validateLead } from "@/lib/leads";

/**
 * Formulario de contacto de la landing. La consulta se guarda primero y el
 * aviso por correo sale después, en `after()`: si el SMTP no está o se cae, la
 * consulta igual queda en la tabla Lead y no se pierde.
 */
export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
  }

  const result = validateLead(raw);

  // Al bot se le contesta igual que a una persona, para que no aprenda a
  // esquivar el campo trampa.
  if (!result.ok && "spam" in result) return NextResponse.json({ ok: true }, { status: 201 });
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  const lead = result.value;
  await prisma.lead.create({ data: lead });

  const to = process.env.LEADS_NOTIFY_EMAIL;
  if (to) after(() => sendMail(to, newLeadNotification(lead)));
  else console.info(`[leads] Consulta nueva de ${lead.email} (sin LEADS_NOTIFY_EMAIL, no se avisa por correo)`);

  return NextResponse.json({ ok: true }, { status: 201 });
}
