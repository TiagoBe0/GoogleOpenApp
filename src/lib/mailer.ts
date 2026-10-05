import nodemailer, { type Transporter } from "nodemailer";
import type { Message } from "./emails";

/**
 * Envío por SMTP. Se eligió SMTP y no la API de un proveedor puntual porque lo
 * hablan todos (Resend, Mailgun, SendGrid, Zoho, Gmail): cambiar de proveedor
 * es cambiar variables de entorno, no reescribir código.
 *
 * Sin `SMTP_HOST` configurado no se envía nada: el mensaje se escribe en la
 * consola. Así el flujo completo se puede probar en desarrollo sin credenciales
 * y sin mandarle un correo real a nadie por accidente.
 */

export interface MailAttachment {
  filename: string;
  content: string;
  contentType: string;
}

let cached: Transporter | null = null;

function transporter(): Transporter | null {
  if (!process.env.SMTP_HOST) return null;
  if (cached) return cached;

  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);

  cached = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    // 465 es SMTP sobre TLS directo; 587 arranca en claro y sube con STARTTLS.
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });

  return cached;
}

export function mailFrom(): string {
  return process.env.SMTP_FROM ?? "PsicoLink <no-reply@psicolink.local>";
}

/**
 * Manda un correo. Nunca lanza: un aviso que falla no puede tumbar la reserva
 * que lo originó, que es lo que el paciente realmente vino a hacer.
 */
export async function sendMail(
  to: string,
  message: Message,
  attachments?: MailAttachment[]
): Promise<boolean> {
  const transport = transporter();

  if (!transport) {
    const adjuntos = attachments?.length
      ? `  Adjuntos: ${attachments.map((a) => a.filename).join(", ")}\n`
      : "";
    console.info(
      `[mailer] SMTP sin configurar, no se envió nada.\n` +
        `  Para: ${to}\n  Asunto: ${message.subject}\n${adjuntos}${message.text}\n`
    );
    return false;
  }

  try {
    await transport.sendMail({
      from: mailFrom(),
      to,
      subject: message.subject,
      text: message.text,
      html: message.html,
      ...(attachments?.length ? { attachments } : {}),
    });
    return true;
  } catch (err) {
    console.error(`[mailer] No se pudo enviar "${message.subject}" a ${to}:`, err);
    return false;
  }
}
