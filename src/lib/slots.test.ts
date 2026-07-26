import { describe, it, expect } from "vitest";
import { availableSlots, overlaps, isWeekend, minutesToLabel, WORK_START } from "./slots";

const at = (h: number, m = 0) => h * 60 + m;

describe("solapamiento de turnos", () => {
  it("detecta que dos turnos se pisan", () => {
    expect(overlaps(at(10), at(11), at(10, 30), at(11, 30))).toBe(true);
  });

  it("uno contenido dentro del otro también se pisa", () => {
    expect(overlaps(at(10), at(12), at(10, 30), at(11))).toBe(true);
  });

  // Dos sesiones seguidas no se pisan: una termina justo cuando arranca la otra.
  it("dos turnos consecutivos no se pisan", () => {
    expect(overlaps(at(10), at(11), at(11), at(12))).toBe(false);
  });

  it("turnos separados no se pisan", () => {
    expect(overlaps(at(9), at(10), at(15), at(16))).toBe(false);
  });
});

describe("horarios disponibles", () => {
  it("con la agenda vacía llena el día completo", () => {
    const slots = availableSlots({ duration: 60, busy: [] });

    expect(slots[0]).toBe("08:00");
    expect(slots).toHaveLength(12); // 08:00 a 20:00
    expect(slots.at(-1)).toBe("19:00");
  });

  // Este es el que importa: si falla, dos pacientes quedan citados a la misma hora.
  it("no ofrece un horario ya reservado", () => {
    const slots = availableSlots({
      duration: 60,
      busy: [{ start: at(10), end: at(11) }],
    });

    expect(slots).not.toContain("10:00");
    expect(slots).toContain("09:00");
    expect(slots).toContain("11:00");
  });

  it("descarta el horario que se pisa parcialmente con uno reservado", () => {
    const slots = availableSlots({
      duration: 60,
      busy: [{ start: at(10, 30), end: at(11, 30) }],
    });

    expect(slots).not.toContain("10:00"); // 10:00-11:00 pisa 10:30
    expect(slots).not.toContain("11:00"); // 11:00-12:00 pisa 11:30
    expect(slots).toContain("09:00");
    expect(slots).toContain("12:00");
  });

  it("permite reservar justo después de un turno existente", () => {
    const slots = availableSlots({
      duration: 60,
      busy: [{ start: at(9), end: at(10) }],
    });

    expect(slots).toContain("10:00");
  });

  it("respeta varios turnos tomados el mismo día", () => {
    const slots = availableSlots({
      duration: 60,
      busy: [
        { start: at(9), end: at(10) },
        { start: at(14), end: at(15) },
      ],
    });

    expect(slots).not.toContain("09:00");
    expect(slots).not.toContain("14:00");
    expect(slots).toContain("10:00");
    expect(slots).toContain("15:00");
  });

  it("un día completamente ocupado no ofrece nada", () => {
    const slots = availableSlots({
      duration: 60,
      busy: [{ start: WORK_START, end: at(20) }],
    });

    expect(slots).toEqual([]);
  });

  it("nunca ofrece un turno que termine después del cierre", () => {
    const slots = availableSlots({ duration: 50, busy: [] });
    const last = slots.at(-1)!;
    const [h, m] = last.split(":").map(Number);

    expect(h * 60 + m + 50).toBeLessThanOrEqual(at(20));
  });
});

describe("horarios de hoy", () => {
  it("no ofrece horarios que ya pasaron", () => {
    const slots = availableSlots({ duration: 60, busy: [], nowMinutes: at(13, 30) });

    expect(slots).not.toContain("09:00");
    expect(slots).not.toContain("13:00");
    expect(slots).toContain("14:00");
  });

  it("para un día futuro ofrece la mañana entera", () => {
    const slots = availableSlots({ duration: 60, busy: [], nowMinutes: null });

    expect(slots).toContain("08:00");
  });

  it("pasado el cierre no queda nada por reservar", () => {
    const slots = availableSlots({ duration: 60, busy: [], nowMinutes: at(21) });

    expect(slots).toEqual([]);
  });
});

describe("duración de la sesión", () => {
  it("una duración más larga deja menos turnos en el día", () => {
    const cortos = availableSlots({ duration: 30, busy: [] });
    const largos = availableSlots({ duration: 90, busy: [] });

    expect(cortos.length).toBeGreaterThan(largos.length);
  });

  it("la grilla arranca siempre en el horario de apertura", () => {
    for (const duration of [30, 45, 50, 60, 90]) {
      expect(availableSlots({ duration, busy: [] })[0]).toBe("08:00");
    }
  });

  it("una duración inválida no rompe", () => {
    expect(availableSlots({ duration: 0, busy: [] })).toEqual([]);
    expect(availableSlots({ duration: -30, busy: [] })).toEqual([]);
  });
});

describe("fin de semana", () => {
  it("sábado y domingo no son días de atención", () => {
    expect(isWeekend(2026, 7, 25)).toBe(true); // sábado
    expect(isWeekend(2026, 7, 26)).toBe(true); // domingo
  });

  it("los días de semana sí lo son", () => {
    expect(isWeekend(2026, 7, 27)).toBe(false); // lunes
    expect(isWeekend(2026, 7, 31)).toBe(false); // viernes
  });
});

describe("formato de la hora", () => {
  it("completa con cero a la izquierda", () => {
    expect(minutesToLabel(at(9))).toBe("09:00");
    expect(minutesToLabel(at(9, 5))).toBe("09:05");
  });

  it("usa reloj de 24 horas", () => {
    expect(minutesToLabel(at(18, 30))).toBe("18:30");
  });
});
