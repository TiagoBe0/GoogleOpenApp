import webpush from "web-push";
import { prisma } from "./prisma";
import type { PushPayload } from "./push-payloads";

/**
 * Envío de avisos push por Web Push (VAPID). Mismo criterio que `mailer.ts`:
 * sin claves configuradas no se manda nada y el aviso se escribe en consola,
 * así el flujo se prueba en desarrollo sin credenciales.
 *
 * Web Push es el estándar del navegador, no el SDK de Firebase: no agrega una
 * dependencia de Google ni obliga a registrar la app en ningún lado. Lo
 * entienden Chrome, Firefox, Edge y Safari 16.4+.
 */

let configured: boolean | null = null;

function ready(): boolean {
  if (configured !== null) return configured;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;

  if (!publicKey || !privateKey) {
    configured = false;
    return false;
  }

  webpush.setVapidDetails(
    // El subject identifica a quien envía ante el servicio de push, para que
    // pueda avisar si algo anda mal. Tiene que ser mailto: o https:.
    process.env.VAPID_SUBJECT ?? "mailto:no-reply@psicolink.local",
    publicKey,
    privateKey,
  );
  configured = true;
  return true;
}

/** La clave pública es lo único que el navegador necesita para suscribirse. */
export function publicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

/**
 * Manda un aviso a todos los navegadores registrados de una persona. Nunca
 * lanza: un aviso que falla no puede tumbar la reserva que lo originó.
 *
 * Devuelve a cuántos navegadores se entregó.
 */
export async function sendPush(userId: string, payload: PushPayload): Promise<number> {
  if (!ready()) {
    console.info(
      `[push] VAPID sin configurar, no se envió nada.\n` +
        `  Para: ${userId}\n  ${payload.title}: ${payload.body}\n`,
    );
    return 0;
  }

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  if (subs.length === 0) return 0;

  const body = JSON.stringify(payload);
  let entregados = 0;

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          body,
        );
        entregados += 1;
      } catch (err) {
        // 404 y 410 significan que el navegador dio de baja esa suscripción
        // (se desinstaló la app, se limpiaron los datos del sitio). Hay que
        // borrarla o queda acumulando errores en cada aviso, para siempre.
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await prisma.pushSubscription
            .delete({ where: { endpoint: sub.endpoint } })
            .catch(() => {
              // Ya la borró otro envío en paralelo. No hay nada que hacer.
            });
          return;
        }
        console.error(`[push] No se pudo entregar "${payload.title}":`, err);
      }
    }),
  );

  return entregados;
}
