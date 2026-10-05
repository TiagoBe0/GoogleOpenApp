import { createHmac, timingSafeEqual } from "crypto";

/**
 * Verificación de los avisos de MercadoPago.
 *
 * Vive acá y no en la ruta porque es lógica de seguridad: se prueba sola, sin
 * levantar un servidor ni inventar un request.
 */

/** Qué hacer con un aviso según haya o no clave configurada. */
export type SignatureGate = "verify" | "skip-development" | "reject";

/**
 * Sin clave no se puede verificar nada. En producción eso es un portón abierto
 * (cualquiera confirma turnos sin pagar), así que se rechaza. En desarrollo se
 * deja pasar, porque el panel de pruebas de MercadoPago no siempre entrega una
 * clave y si no, no se puede probar el flujo localmente.
 */
export function signatureGate(secret: string | undefined, isProduction: boolean): SignatureGate {
  if (secret) return "verify";
  return isProduction ? "reject" : "skip-development";
}

export interface SignatureParts {
  ts: string;
  v1: string;
}

/**
 * El header viene como `ts=1700000000,v1=abc123`. Devuelve null si falta
 * cualquiera de las dos partes.
 */
export function parseSignatureHeader(header: string | null): SignatureParts | null {
  if (!header) return null;

  const parts: Record<string, string> = {};
  for (const chunk of header.split(",")) {
    const [key, ...rest] = chunk.trim().split("=");
    if (key && rest.length) parts[key] = rest.join("=");
  }

  if (!parts.ts || !parts.v1) return null;
  return { ts: parts.ts, v1: parts.v1 };
}

/** Cadena que MercadoPago firma. El orden y los puntos y coma son parte del contrato. */
export function buildSignatureManifest(dataId: string, requestId: string, ts: string): string {
  return `id:${dataId};request-id:${requestId};ts:${ts};`;
}

/**
 * Compara sin filtrar información por el tiempo que tarda. Un `===` sobre un
 * hash devuelve antes cuando el primer byte difiere, y eso alcanza para ir
 * adivinando una firma válida byte a byte.
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function verifySignature(options: {
  secret: string;
  header: string | null;
  requestId: string | null;
  dataId: string;
}): boolean {
  const parts = parseSignatureHeader(options.header);
  if (!parts) return false;

  const manifest = buildSignatureManifest(options.dataId, options.requestId ?? "", parts.ts);
  const expected = createHmac("sha256", options.secret).update(manifest).digest("hex");

  return safeEqual(expected, parts.v1);
}

/**
 * ¿El pago cubre lo que costaba el turno? Se compara con tolerancia de un
 * centavo porque los importes viajan como float y 20000.00 puede volver como
 * 19999.999999997.
 */
export function amountCovers(paid: number | null | undefined, expected: number | null | undefined): boolean {
  // Sin importe esperado no hay nada que verificar (turno sin honorarios).
  if (expected == null) return true;
  if (paid == null) return false;

  return paid + 0.01 >= expected;
}

/** El pago tiene que estar en la misma moneda que el turno. */
export function currencyMatches(paid: string | null | undefined, expected: string | null | undefined): boolean {
  if (!expected) return true;
  if (!paid) return false;

  return paid.toUpperCase() === expected.toUpperCase();
}

/** Estado del turno según lo que informó MercadoPago. `null` = no tocar. */
export function statusForPayment(mpStatus: string): "CONFIRMED" | "CANCELLED" | null {
  if (mpStatus === "approved") return "CONFIRMED";
  if (mpStatus === "rejected" || mpStatus === "cancelled") return "CANCELLED";
  return null;
}
