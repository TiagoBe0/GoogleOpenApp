import { prisma } from "@/lib/prisma";
import { DEFAULT_RULES, type WeeklyRule } from "@/lib/availability";

export interface StoredAvailability {
  rules: WeeklyRule[];
  /** true cuando el profesional todavía no configuró su agenda. */
  usingDefaults: boolean;
}

/**
 * Agenda semanal del profesional. Quien nunca la configuró recibe la agenda por
 * defecto, que es exactamente lo que la app asumía cuando el horario estaba
 * fijo en el código: nadie pierde turnos por no haber pasado por la pantalla.
 */
export async function loadAvailability(psychologistId: string): Promise<StoredAvailability> {
  const stored = await prisma.availabilityRule.findMany({
    where: { psychologistId },
    orderBy: [{ weekday: "asc" }, { startMinute: "asc" }],
    select: { weekday: true, startMinute: true, endMinute: true },
  });

  if (stored.length === 0) return { rules: DEFAULT_RULES, usingDefaults: true };

  return {
    rules: stored.map((r) => ({ weekday: r.weekday, start: r.startMinute, end: r.endMinute })),
    usingDefaults: false,
  };
}

/** Reemplaza la agenda completa. Las franjas ya vienen validadas y normalizadas. */
export async function replaceAvailability(
  psychologistId: string,
  rules: WeeklyRule[]
): Promise<void> {
  // Atómico: si el insert falla, el profesional no queda sin agenda.
  await prisma.$transaction([
    prisma.availabilityRule.deleteMany({ where: { psychologistId } }),
    prisma.availabilityRule.createMany({
      data: rules.map((r) => ({
        psychologistId,
        weekday: r.weekday,
        startMinute: r.start,
        endMinute: r.end,
      })),
    }),
  ]);
}
