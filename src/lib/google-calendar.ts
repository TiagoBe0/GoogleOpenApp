import { prisma } from "./prisma";
import { DEFAULT_TIMEZONE } from "./timezone";

/**
 * Sincronización con Google Calendar.
 *
 * Los tokens salen de la tabla `Account`, no de la sesión. El de la sesión se
 * captura al iniciar sesión y nunca se renueva, y un access token de Google dura
 * una hora: la sincronización se cortaba sola sin que nadie se enterara. Además,
 * leyéndolos de la base se puede tocar el calendario del profesional aunque
 * quien esté haciendo la acción sea el paciente, que es lo que pasa cuando el
 * paciente cancela un turno.
 */

const CALENDAR_API = "https://www.googleapis.com/calendar/v3/calendars/primary/events";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";

/** Margen para no usar un token que vence mientras viaja el request. */
const EXPIRY_MARGIN_SECONDS = 60;

export interface CalendarEventInput {
  summary: string;
  description?: string | null;
  start: Date;
  durationMinutes: number;
  timezone: string;
}

/** Cuerpo del evento tal como lo espera la API. Puro, para poder testearlo. */
export function buildEventPayload(input: CalendarEventInput) {
  const end = new Date(input.start.getTime() + input.durationMinutes * 60 * 1000);
  const timeZone = input.timezone || DEFAULT_TIMEZONE;

  return {
    summary: input.summary,
    description: input.description ?? "",
    start: { dateTime: input.start.toISOString(), timeZone },
    end: { dateTime: end.toISOString(), timeZone },
  };
}

/**
 * Access token vigente del usuario, renovándolo si hace falta. Devuelve null
 * cuando no conectó Google Calendar o cuando el refresh ya no sirve, que es lo
 * que pasa si revocó el permiso.
 */
export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: "google" },
    select: { id: true, access_token: true, refresh_token: true, expires_at: true, scope: true },
  });

  if (!account?.access_token) return null;

  // Sin el scope de calendario el token existe pero no sirve para esto.
  if (account.scope && !account.scope.includes("calendar.events")) return null;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const stillValid = !account.expires_at || account.expires_at - EXPIRY_MARGIN_SECONDS > nowSeconds;
  if (stillValid) return account.access_token;

  if (!account.refresh_token) return null;

  try {
    const res = await fetch(TOKEN_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        refresh_token: account.refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!res.ok) {
      console.error("[calendar] No se pudo renovar el token de Google:", res.status);
      return null;
    }

    const data = (await res.json()) as { access_token?: string; expires_in?: number };
    if (!data.access_token) return null;

    await prisma.account.update({
      where: { id: account.id },
      data: {
        access_token: data.access_token,
        expires_at: nowSeconds + (data.expires_in ?? 3600),
      },
    });

    return data.access_token;
  } catch (err) {
    console.error("[calendar] Error renovando el token de Google:", err);
    return null;
  }
}

/** Crea el evento y devuelve su id, o null si no se pudo. Nunca lanza. */
export async function createCalendarEvent(
  userId: string,
  input: CalendarEventInput
): Promise<string | null> {
  const token = await getGoogleAccessToken(userId);
  if (!token) return null;

  try {
    const res = await fetch(CALENDAR_API, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(buildEventPayload(input)),
    });

    if (!res.ok) {
      console.error("[calendar] No se pudo crear el evento:", res.status, await res.text());
      return null;
    }

    const event = (await res.json()) as { id?: string };
    return event.id ?? null;
  } catch (err) {
    console.error("[calendar] Error creando el evento:", err);
    return null;
  }
}

/** Mueve o edita un evento existente. Nunca lanza. */
export async function updateCalendarEvent(
  userId: string,
  eventId: string,
  input: CalendarEventInput
): Promise<boolean> {
  const token = await getGoogleAccessToken(userId);
  if (!token) return false;

  try {
    const res = await fetch(`${CALENDAR_API}/${encodeURIComponent(eventId)}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(buildEventPayload(input)),
    });

    if (res.ok) return true;

    console.error("[calendar] No se pudo mover el evento:", res.status, await res.text());
    return false;
  } catch (err) {
    console.error("[calendar] Error moviendo el evento:", err);
    return false;
  }
}

/**
 * Borra el evento. Un 404 o un 410 cuentan como éxito: el evento ya no está,
 * que es exactamente lo que queríamos.
 */
export async function deleteCalendarEvent(userId: string, eventId: string): Promise<boolean> {
  const token = await getGoogleAccessToken(userId);
  if (!token) return false;

  try {
    const res = await fetch(`${CALENDAR_API}/${encodeURIComponent(eventId)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.ok || res.status === 404 || res.status === 410) return true;

    console.error("[calendar] No se pudo borrar el evento:", res.status, await res.text());
    return false;
  } catch (err) {
    console.error("[calendar] Error borrando el evento:", err);
    return false;
  }
}
