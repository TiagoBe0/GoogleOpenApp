import { describe, it, expect } from "vitest";
import { DEFAULT_TIMEZONE, zonedParts, zonedTimeToUtc } from "./timezone";

const AR = DEFAULT_TIMEZONE; // UTC-3 todo el año
const MADRID = "Europe/Madrid"; // UTC+1 / UTC+2 con horario de verano

describe("hora de pared en una zona", () => {
  it("traduce un instante UTC a la hora local argentina", () => {
    const p = zonedParts(new Date("2026-07-28T15:00:00.000Z"), AR);

    expect([p.year, p.month, p.day]).toEqual([2026, 7, 28]);
    expect(p.hour).toBe(12);
    expect(p.minutes).toBe(12 * 60);
  });

  // El caso que rompe las agendas: en Argentina todavía es el día anterior.
  it("respeta el día local cuando el UTC ya pasó a la medianoche", () => {
    const p = zonedParts(new Date("2026-07-29T01:30:00.000Z"), AR);

    expect([p.year, p.month, p.day]).toEqual([2026, 7, 28]);
    expect(p.hour).toBe(22);
    expect(p.weekday).toBe(2); // martes
  });

  it("da el día de la semana local, no el de UTC", () => {
    // Domingo 01:00 UTC es todavía sábado en Argentina.
    const p = zonedParts(new Date("2026-08-02T01:00:00.000Z"), AR);

    expect(p.weekday).toBe(6);
  });

  it("aplica el horario de verano donde existe", () => {
    const verano = zonedParts(new Date("2026-07-28T12:00:00.000Z"), MADRID);
    const invierno = zonedParts(new Date("2026-01-28T12:00:00.000Z"), MADRID);

    expect(verano.hour).toBe(14); // UTC+2
    expect(invierno.hour).toBe(13); // UTC+1
  });

  it("una zona inexistente no rompe: cae en la zona por defecto", () => {
    const p = zonedParts(new Date("2026-07-28T15:00:00.000Z"), "Marte/Olympus");

    expect(p.hour).toBe(12);
  });
});

describe("hora de pared a instante UTC", () => {
  it("convierte un horario argentino al instante correcto", () => {
    const utc = zonedTimeToUtc(2026, 7, 28, 14 * 60, AR);

    expect(utc.toISOString()).toBe("2026-07-28T17:00:00.000Z");
  });

  it("una hora temprana cae en el mismo día UTC", () => {
    const utc = zonedTimeToUtc(2026, 7, 28, 9 * 60, AR);

    expect(utc.toISOString()).toBe("2026-07-28T12:00:00.000Z");
  });

  it("una hora tardía cruza al día siguiente en UTC", () => {
    const utc = zonedTimeToUtc(2026, 7, 28, 22 * 60, AR);

    expect(utc.toISOString()).toBe("2026-07-29T01:00:00.000Z");
  });

  it("convierte con horario de verano y sin él en la misma zona", () => {
    expect(zonedTimeToUtc(2026, 7, 28, 10 * 60, MADRID).toISOString()).toBe(
      "2026-07-28T08:00:00.000Z"
    );
    expect(zonedTimeToUtc(2026, 1, 28, 10 * 60, MADRID).toISOString()).toBe(
      "2026-01-28T09:00:00.000Z"
    );
  });

  // El día del cambio de hora es donde una conversión ingenua se va 60 minutos.
  it("acierta el día del cambio de horario", () => {
    // Madrid adelanta el reloj a las 02:00 del 29/3/2026.
    expect(zonedTimeToUtc(2026, 3, 29, 18 * 60, MADRID).toISOString()).toBe(
      "2026-03-29T16:00:00.000Z"
    );
    expect(zonedTimeToUtc(2026, 3, 29, 1 * 60, MADRID).toISOString()).toBe(
      "2026-03-29T00:00:00.000Z"
    );
  });

  it("ida y vuelta devuelve la misma hora de pared", () => {
    for (const tz of [AR, MADRID, "America/New_York", "Asia/Tokyo"]) {
      for (const minutes of [0, 9 * 60, 14 * 60 + 30, 23 * 60 + 59]) {
        const utc = zonedTimeToUtc(2026, 7, 28, minutes, tz);
        const back = zonedParts(utc, tz);

        expect(back.minutes).toBe(minutes);
        expect(back.day).toBe(28);
      }
    }
  });
});
