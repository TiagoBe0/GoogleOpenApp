/**
 * URL pública de la app, sin barra final.
 *
 * Se usa donde un tercero tiene que volver a nosotros sin pasar por un
 * navegador que ya esté en la página: las back_urls y el webhook de
 * MercadoPago, y los links que van en los mails. Por eso no alcanza con
 * `window.location.origin` y tiene que salir de la configuración.
 *
 * AUTH_URL es el nombre que usa Auth.js v5; NEXTAUTH_URL queda como respaldo
 * para los .env que ya existen.
 */
export function appUrl(env: Record<string, string | undefined> = process.env): string {
  const url = env.AUTH_URL || env.NEXTAUTH_URL || "http://localhost:3000";
  return url.trim().replace(/\/+$/, "");
}
