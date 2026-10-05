import { describe, it, expect } from "vitest";
import {
  DEFAULT_RULES,
  isValidRule,
  isWithinWindows,
  normalizeRules,
  openWeekdays,
  weekdayOf,
  windowsForWeekday,
  type WeeklyRule,
} from "./availability";

const at = (h: number, m = 0) => h * 60 + m;
const rule = (weekday: number, from: number, to: number): WeeklyRule => ({
  weekday,
  start: from,
  end: to,
});

describe("validación de una franja", () => {
  it("acepta una franja normal", () => {
    expect(isValidRule(rule(1, at(9), at(13)))).toBe(true);
  });

  it("rechaza el día fuera de rango", () => {
    expect(isValidRule(rule(7, at(9), at(13)))).toBe(false);
    expect(isValidRule(rule(-1, at(9), at(13)))).toBe(false);
  });

  // Sin esto se puede guardar una franja que no contiene ningún turno posible.
  it("rechaza una franja que termina antes de empezar", () => {
    expect(isValidRule(rule(1, at(18), at(9)))).toBe(false);
    expect(isValidRule(rule(1, at(9), at(9)))).toBe(false);
  });

  it("rechaza minutos fuera del día", () => {
    expect(isValidRule(rule(1, -30, at(13)))).toBe(false);
    expect(isValidRule(rule(1, at(9), 24 * 60 + 30))).toBe(false);
  });

  it("acepta el día entero", () => {
    expect(isValidRule(rule(3, 0, 24 * 60))).toBe(true);
  });

  it("rechaza valores que no son minutos enteros", () => {
    expect(isValidRule({ weekday: 1, start: 9.5, end: at(13) })).toBe(false);
    expect(isValidRule({ weekday: 1.5, start: at(9), end: at(13) })).toBe(false);
    expect(isValidRule({ weekday: 1, start: NaN, end: at(13) })).toBe(false);
  });

  it("rechaza lo que ni siquiera es una franja", () => {
    expect(isValidRule({})).toBe(false);
    expect(isValidRule({ weekday: 1 })).toBe(false);
  });
});

describe("normalización de la agenda semanal", () => {
  it("ordena por día y por hora", () => {
    const out = normalizeRules([
      rule(5, at(16), at(20)),
      rule(1, at(14), at(18)),
      rule(1, at(9), at(12)),
    ]);

    expect(out.map((r) => [r.weekday, r.start])).toEqual([
      [1, at(9)],
      [1, at(14)],
      [5, at(16)],
    ]);
  });

  // Dos franjas pisadas duplicarían horarios en la grilla del paciente.
  it("funde dos franjas que se pisan el mismo día", () => {
    const out = normalizeRules([rule(2, at(9), at(13)), rule(2, at(12), at(18))]);

    expect(out).toEqual([rule(2, at(9), at(18))]);
  });

  it("funde dos franjas que se tocan justo", () => {
    const out = normalizeRules([rule(2, at(9), at(13)), rule(2, at(13), at(18))]);

    expect(out).toEqual([rule(2, at(9), at(18))]);
  });

  it("no funde franjas con un hueco en el medio", () => {
    const out = normalizeRules([rule(2, at(9), at(12)), rule(2, at(16), at(20))]);

    expect(out).toHaveLength(2);
  });

  it("no mezcla franjas de días distintos con el mismo horario", () => {
    const out = normalizeRules([rule(1, at(9), at(13)), rule(2, at(9), at(13))]);

    expect(out).toHaveLength(2);
  });

  it("una franja contenida en otra desaparece", () => {
    const out = normalizeRules([rule(4, at(8), at(20)), rule(4, at(10), at(12))]);

    expect(out).toEqual([rule(4, at(8), at(20))]);
  });

  it("no muta lo que recibe", () => {
    const input = [rule(2, at(9), at(13)), rule(2, at(12), at(18))];
    normalizeRules(input);

    expect(input[0].end).toBe(at(13));
  });

  it("una agenda vacía sigue vacía", () => {
    expect(normalizeRules([])).toEqual([]);
  });
});

describe("franjas de un día puntual", () => {
  const semana = [rule(1, at(9), at(13)), rule(1, at(16), at(20)), rule(3, at(14), at(19))];

  it("devuelve solo las del día pedido, ordenadas", () => {
    expect(windowsForWeekday(semana, 1)).toEqual([
      { start: at(9), end: at(13) },
      { start: at(16), end: at(20) },
    ]);
  });

  it("un día sin franjas devuelve vacío", () => {
    expect(windowsForWeekday(semana, 6)).toEqual([]);
  });

  it("los días abiertos son los que tienen alguna franja", () => {
    expect(openWeekdays(semana)).toEqual([1, 3]);
  });
});

describe("un turno dentro de la agenda", () => {
  const windows = [
    { start: at(9), end: at(13) },
    { start: at(16), end: at(20) },
  ];

  it("acepta un turno que entra entero en una franja", () => {
    expect(isWithinWindows(windows, at(10), at(11))).toBe(true);
  });

  it("acepta el turno que arranca en la apertura y el que cierra el día", () => {
    expect(isWithinWindows(windows, at(9), at(10))).toBe(true);
    expect(isWithinWindows(windows, at(19), at(20))).toBe(true);
  });

  // El que importa: la grilla filtra, pero la API está expuesta igual.
  it("rechaza el turno que cae en el hueco del mediodía", () => {
    expect(isWithinWindows(windows, at(14), at(15))).toBe(false);
  });

  it("rechaza el turno que se pasa del cierre", () => {
    expect(isWithinWindows(windows, at(19, 30), at(20, 30))).toBe(false);
  });

  // Un turno no puede apoyarse en dos franjas separadas por un hueco.
  it("rechaza el turno que cruza de una franja a la otra", () => {
    expect(isWithinWindows(windows, at(12), at(17))).toBe(false);
  });

  it("con el día cerrado no acepta nada", () => {
    expect(isWithinWindows([], at(10), at(11))).toBe(false);
  });
});

describe("día de la semana de una fecha", () => {
  it("ubica el día correcto", () => {
    expect(weekdayOf(2026, 7, 25)).toBe(6); // sábado
    expect(weekdayOf(2026, 7, 26)).toBe(0); // domingo
    expect(weekdayOf(2026, 7, 27)).toBe(1); // lunes
    expect(weekdayOf(2026, 7, 31)).toBe(5); // viernes
  });

  it("no se corre en años bisiestos", () => {
    expect(weekdayOf(2028, 2, 29)).toBe(2); // martes
  });
});

describe("agenda por defecto", () => {
  // Preserva lo que la app hacía cuando el horario estaba hardcodeado.
  it("es lunes a viernes de 08:00 a 20:00", () => {
    expect(openWeekdays(DEFAULT_RULES)).toEqual([1, 2, 3, 4, 5]);
    for (const r of DEFAULT_RULES) {
      expect(r.start).toBe(at(8));
      expect(r.end).toBe(at(20));
    }
  });

  it("no incluye el fin de semana", () => {
    expect(openWeekdays(DEFAULT_RULES)).not.toContain(0);
    expect(openWeekdays(DEFAULT_RULES)).not.toContain(6);
  });
});
