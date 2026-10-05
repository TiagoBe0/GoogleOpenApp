/**
 * Validación del link de videollamada que carga el profesional.
 *
 * Este valor termina renderizado como `href` en la pantalla del paciente, así
 * que es una entrada hostil aunque venga de alguien de confianza: una cuenta
 * comprometida podría guardar `javascript:...` y ejecutar código en la sesión
 * de cada paciente que toque "Unirse".
 *
 * Por eso la regla es una lista blanca de esquemas, no una lista negra: se
 * acepta `https:` y nada más. Prohibir `javascript:` uno por uno deja afuera
 * `data:`, `vbscript:`, `blob:` y lo que invente el próximo navegador.
 *
 * `http:` tampoco entra. La app se sirve por HTTPS y el navegador bloquearía o
 * marcaría el enlace igual, y un link de sesión terapéutica en claro no es algo
 * que convenga ofrecer.
 *
 * No se limita a proveedores conocidos a propósito: entre Meet, Zoom, Jitsi,
 * Whereby, Teams y Doxy.me, una lista blanca de dominios envejece mal y deja a
 * gente sin poder trabajar.
 */

/** Tope defensivo: ningún link legítimo se acerca, y evita guardar basura. */
const MAX_LARGO = 2048;

export type MeetingLinkResult =
  | { ok: true; url: string | null }
  | { ok: false; error: string };

/**
 * Normaliza el link recibido.
 *
 * Vacío, null o solo espacios devuelven `url: null`, que es cómo se borra un
 * link ya cargado. Quien llama distingue "no vino el campo" de "vino vacío"
 * antes de invocar esto.
 */
export function normalizeMeetingUrl(input: unknown): MeetingLinkResult {
  if (input === null || input === undefined) return { ok: true, url: null };

  if (typeof input !== "string") {
    return { ok: false, error: "El link tiene que ser texto." };
  }

  const trimmed = input.trim();
  if (trimmed === "") return { ok: true, url: null };

  if (trimmed.length > MAX_LARGO) {
    return { ok: false, error: "El link es demasiado largo." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      ok: false,
      error: "Escribí el link completo, empezando con https://",
    };
  }

  if (parsed.protocol !== "https:") {
    return {
      ok: false,
      error: "El link tiene que empezar con https://",
    };
  }

  return { ok: true, url: parsed.href };
}
