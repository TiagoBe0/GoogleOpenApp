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
  const psychologists = await prisma.user.findMany({
    where: { role: "PSYCHOLOGIST", psychologistProfile: { isNot: null } },
    select: {
      id: true,
      name: true,
      image: true,
      psychologistProfile: { select: PUBLIC_PROFILE_SELECT },
      reviewsReceived: { select: { rating: true } },
    },
  });

  return (
    psychologists
      .map((p): DirectoryEntry => {
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
          bio:
            profile.bio && profile.bio.length > BIO_PREVIEW_CHARS
              ? `${profile.bio.slice(0, BIO_PREVIEW_CHARS).trimEnd()}…`
              : profile.bio,
          consultationFee: profile.consultationFee,
          currency: profile.currency,
          sessionDuration: profile.sessionDuration,
          rating: { average, count },
        };
      })
      // SQLite no soporta `mode: "insensitive"` en Prisma, así que el filtro va
      // acá. El directorio es chico; cuando crezca, mover a un índice.
      .filter((p) => {
        if (!q) return true;
        return [p.name, p.specialty, p.bio].some((field) => field?.toLowerCase().includes(q));
      })
      // Mejor calificados primero, y entre iguales los que tienen más opiniones:
      // un 5.0 con una sola reseña no debería tapar a un 4.8 con treinta.
      .sort((a, b) => b.rating.average - a.rating.average || b.rating.count - a.rating.count)
  );
}
