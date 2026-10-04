import { escapeHtml, type Message } from "./emails";

/**
 * Formulario de contacto de la landing de Malbec Motion.
 *
 * Vive aparte de la ruta para poder probarlo sin levantar un servidor. Es un
 * endpoint público: lo postea cualquiera sin cuenta, así que todo lo que entra
 * se valida, se recorta y se escapa antes de llegar a un correo.
 */

/** Servicios que se ofrecen en la landing. El formulario manda el `id`. */
export const SERVICES = [
  { id: "redes", label: "Pack Redes" },
  { id: "spot", label: "Spot publicitario" },
  { id: "temporada", label: "Campaña de temporada" },
  { id: "otro", label: "Otra cosa / no sé todavía" },
] as const;

export type ServiceId = (typeof SERVICES)[number]["id"];

export const LEAD_LIMITS = {
  name: 100,
  email: 200,
  company: 120,
  phone: 40,
  message: 2000,
} as const;

export interface LeadInput {
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  service: ServiceId | null;
  message: string;
}

export type LeadValidation =
  | { ok: true; value: LeadInput }
  | { ok: false; error: string }
  /** Lo llenó un bot: se le responde bien y no se guarda nada. */
  | { ok: false; spam: true };

// Suficiente para atrapar errores de tipeo; la verdad la dice el correo que
// rebota, no una regex.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(raw: unknown, limit: number): string | null | undefined {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  return trimmed.length > limit ? undefined : trimmed;
}

export function validateLead(raw: unknown): LeadValidation {
  if (!raw || typeof raw !== "object") return { ok: false, error: "Datos inválidos" };
  const body = raw as Record<string, unknown>;

  // Campo trampa: está oculto en el formulario, una persona no lo ve ni lo
  // llena. Un bot que completa todo lo que encuentra, sí.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return { ok: false, spam: true };
  }

  const name = text(body.name, LEAD_LIMITS.name);
  if (!name) return { ok: false, error: "Contanos tu nombre" };

  const email = text(body.email, LEAD_LIMITS.email);
  if (!email || !EMAIL.test(email)) return { ok: false, error: "Revisá el email" };

  const message = text(body.message, LEAD_LIMITS.message);
  if (message === undefined) return { ok: false, error: "El mensaje es demasiado largo" };
  if (!message) return { ok: false, error: "Contanos qué necesitás" };

  const company = text(body.company, LEAD_LIMITS.company);
  if (company === undefined) return { ok: false, error: "El nombre de la empresa es demasiado largo" };

  const phone = text(body.phone, LEAD_LIMITS.phone);
  if (phone === undefined) return { ok: false, error: "Revisá el teléfono" };

  const service = SERVICES.find((s) => s.id === body.service)?.id ?? null;

  return { ok: true, value: { name, email: email.toLowerCase(), company, phone, service, message } };
}

export function serviceLabel(id: string | null): string {
  return SERVICES.find((s) => s.id === id)?.label ?? "Sin especificar";
}

/** Aviso interno: llegó una consulta nueva desde la landing. */
export function newLeadNotification(lead: LeadInput): Message {
  const who = lead.company ? `${lead.name} (${lead.company})` : lead.name;
  const rows: [string, string][] = [
    ["Nombre", lead.name],
    ["Empresa", lead.company ?? "—"],
    ["Email", lead.email],
    ["Teléfono", lead.phone ?? "—"],
    ["Servicio", serviceLabel(lead.service)],
  ];

  const text = [
    `Nueva consulta desde malbecmotion.com`,
    "",
    ...rows.map(([k, v]) => `${k}: ${v}`),
    "",
    lead.message,
  ].join("\n");

  const html = `<!doctype html>
<html lang="es"><body style="margin:0;padding:24px;background:#faf7f4;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#231a1c">
  <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #eadfd9;border-radius:12px;padding:28px">
    <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#8c1c3a">Malbec Motion</p>
    <h1 style="margin:0 0 16px;font-size:20px">Nueva consulta de ${escapeHtml(who)}</h1>
    <table style="font-size:15px;line-height:1.6">${rows
      .map(([k, v]) => `<tr><td style="padding-right:12px;color:#6e6266">${k}</td><td>${escapeHtml(v)}</td></tr>`)
      .join("")}</table>
    <p style="margin:16px 0 0;font-size:15px;line-height:1.6;white-space:pre-wrap">${escapeHtml(lead.message)}</p>
  </div>
</body></html>`;

  return { subject: `Nueva consulta — ${who}`, text, html };
}
