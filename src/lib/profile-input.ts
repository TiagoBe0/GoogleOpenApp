/**
 * Normalización de lo que llega del formulario de perfil.
 *
 * Vive aparte de la ruta para poder probarla sin levantar un servidor. La regla
 * general: un campo que no vino no se toca, y un campo que vino vacío se
 * guarda como null, que es como se borra un dato desde la interfaz.
 */

export const MAX_YEARS_OF_EXPERIENCE = 70;

export interface ProfileTextLimits {
  [field: string]: number;
}

/** Largos máximos. Cortan un payload absurdo antes de que llegue a la base. */
export const TEXT_LIMITS: ProfileTextLimits = {
  specialty: 120,
  licenseNumber: 60,
  bio: 2000,
  phone: 40,
  address: 200,
  city: 100,
  country: 100,
  languages: 200,
  instagramUrl: 300,
  linkedinUrl: 300,
  websiteUrl: 300,
};

export type ProfileValidation = { ok: true; value: unknown } | { ok: false; error: string };

/** Texto opcional: se recorta, y vacío significa "borrar". */
export function normalizeText(field: string, raw: unknown): ProfileValidation {
  if (raw === null) return { ok: true, value: null };
  if (typeof raw !== "string") return { ok: false, error: `El campo ${field} tiene un formato inválido` };

  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: null };

  const limit = TEXT_LIMITS[field];
  if (limit && trimmed.length > limit) {
    return { ok: false, error: `El campo ${field} no puede superar los ${limit} caracteres` };
  }

  return { ok: true, value: trimmed };
}

export function normalizeYearsOfExperience(raw: unknown): ProfileValidation {
  if (raw === null || raw === "") return { ok: true, value: null };

  const years = typeof raw === "string" ? Number(raw) : raw;
  if (typeof years !== "number" || !Number.isFinite(years) || !Number.isInteger(years)) {
    return { ok: false, error: "Los años de experiencia tienen que ser un número entero" };
  }
  if (years < 0 || years > MAX_YEARS_OF_EXPERIENCE) {
    return { ok: false, error: `Los años de experiencia tienen que estar entre 0 y ${MAX_YEARS_OF_EXPERIENCE}` };
  }

  return { ok: true, value: years };
}

export function normalizeBoolean(field: string, raw: unknown): ProfileValidation {
  if (typeof raw !== "boolean") return { ok: false, error: `El campo ${field} tiene un formato inválido` };
  return { ok: true, value: raw };
}
