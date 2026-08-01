import { prisma } from "@/lib/prisma";

// Directorio público: lo consume gente sin cuenta, así que el select es
// explícito. Nunca agregar email, teléfono ni nada que no esté ya publicado
// en /p/[slug].
const PUBLIC_PROFILE_SELECT = {
  slug: true,
  specialty: true,
  bio: true,
  consultationFee: true,
  currency: true,
  sessionDuration: true,
  licenseNumber: true,
} as const;

const BIO_PREVIEW_CHARS = 180;

// Cuántas opiniones hacen falta para que el promedio propio pese más que el
// promedio general. Con pocas reseñas el puntaje se "encoge" hacia la media:
// así un 5,0 con una opinión no le gana a un 4,8 con treinta, y alguien recién
// publicado no arranca último como si lo hubieran calificado 0.
const RATING_CONFIDENCE = 3;

// Media de referencia FIJA, no calculada sobre el propio directorio. Calcularla
// tenía un defecto sutil: con pocos perfiles, el 5,0 que queremos moderar
// levantaba la media que debía moderarlo, y terminaba ganando igual. Un valor
// fijo apenas por debajo de lo típico en marketplaces de servicios (que rondan
// 4,5-4,7) hace que el encogimiento realmente pese y que el orden no dependa de
// cuántos perfiles haya cargados.
const PRIOR_MEAN = 4.3;

export function weightedScore(average: number, count: number): number {
  return (count * average + RATING_CONFIDENCE * PRIOR_MEAN) / (count + RATING_CONFIDENCE);
}

/** Recorta la bio para la tarjeta del listado, sin cortar a mitad de palabra visible. */
export function bioPreview(bio: string | null): string | null {
  if (!bio || bio.length <= BIO_PREVIEW_CHARS) return bio;
  return `${bio.slice(0, BIO_PREVIEW_CHARS).trimEnd()}…`;
}

export function matchesQuery(entry: DirectoryEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [entry.name, entry.specialty, entry.bio].some((f) => f?.toLowerCase().includes(q));
}

/**
 * Filtra y ordena el directorio. Puro a propósito: el orden es la parte con
 * criterio del producto y se testea sin tocar la base.
 */
export function rankEntries(entries: DirectoryEntry[], query = ""): DirectoryEntry[] {
  return entries
    .filter((e) => matchesQuery(e, query))
    .sort((a, b) => weightedScore(b.rating.average, b.rating.count) - weightedScore(a.rating.average, a.rating.count));
}

export interface DirectoryEntry {
  id: string;
  name: string | null;
  image: string | null;
  slug: string;
  specialty: string | null;
  licenseNumber: string | null;
  bio: string | null;
  consultationFee: number | null;
  currency: string;
  sessionDuration: number;
  rating: { average: number; count: number };
}

export async function listPsychologists(query = ""): Promise<DirectoryEntry[]> {
  const q = query.trim().toLowerCase();

  // Solo quienes ya completaron el perfil: el slug es obligatorio en
  // PsychologistProfile, así que tener perfil equivale a tener página pública.
  // Listar a alguien sin perfil sería mandar al paciente a un 404.
  //
  // `acceptsNewPatients` en false saca el perfil del directorio, pero su link
  // directo sigue andando: quien ya es paciente suyo puede seguir reservando.
  const psychologists = await prisma.user.findMany({
    where: {
      role: "PSYCHOLOGIST",
      psychologistProfile: { is: { acceptsNewPatients: true } },
    },
    select: {
      id: true,
      name: true,
      image: true,
      psychologistProfile: { select: PUBLIC_PROFILE_SELECT },
      reviewsReceived: { select: { rating: true } },
    },
  });

  const entries = psychologists.map((p): DirectoryEntry => {
    const profile = p.psychologistProfile!;
    const ratings = p.reviewsReceived;
    const count = ratings.length;
    const average =
      count === 0 ? 0 : Number((ratings.reduce((s, r) => s + r.rating, 0) / count).toFixed(1));

    return {
      id: p.id,
      name: p.name,
      image: p.image,
      slug: profile.slug,
      specialty: profile.specialty,
      licenseNumber: profile.licenseNumber,
      bio: bioPreview(profile.bio),
      consultationFee: profile.consultationFee,
      currency: profile.currency,
      sessionDuration: profile.sessionDuration,
      rating: { average, count },
    };
  });

  // SQLite no soporta `mode: "insensitive"` en Prisma, así que filtrar y
  // ordenar pasa acá. El directorio es chico; cuando crezca, mover a un índice.
  return rankEntries(entries, q);
}
