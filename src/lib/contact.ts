/**
 * Datos de contacto públicos de Malbec Motion. Un solo lugar: el botón
 * flotante, la sección de contacto y el pie los leen de acá.
 */

/** Número en formato internacional, solo dígitos: es lo que pide wa.me. */
export const WHATSAPP_NUMBER = "5492634542090";
export const WHATSAPP_DISPLAY = "+54 9 2634 54-2090";

export const WHATSAPP_GREETING = "Hola Malbec Motion, quiero consultar por un video.";

/** Link a un chat de WhatsApp con el mensaje ya escrito. */
export function whatsappLink(text: string = WHATSAPP_GREETING, number: string = WHATSAPP_NUMBER): string {
  const digits = number.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
