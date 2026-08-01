import { describe, it, expect } from "vitest";
import { buildEventPayload } from "./google-calendar";

const base = {
  summary: "Sesión — Ana Pérez",
  description: "Primera consulta",
  start: new Date("2026-07-28T17:00:00.000Z"),
  durationMinutes: 50,
  timezone: "America/Argentina/Buenos_Aires",
};

describe("evento de Google Calendar", () => {
  it("el fin sale de la duración de la sesión", () => {
    const event = buildEventPayload(base);

    expect(event.start.dateTime).toBe("2026-07-28T17:00:00.000Z");
    expect(event.end.dateTime).toBe("2026-07-28T17:50:00.000Z");
  });

  // Estaba fijo en Buenos Aires: el evento de alguien que atiende desde otra
  // provincia o país quedaba con la zona equivocada.
  it("usa la zona horaria del profesional", () => {
    const event = buildEventPayload({ ...base, timezone: "Europe/Madrid" });

    expect(event.start.timeZone).toBe("Europe/Madrid");
    expect(event.end.timeZone).toBe("Europe/Madrid");
  });

  it("sin zona configurada cae en la de por defecto", () => {
    const event = buildEventPayload({ ...base, timezone: "" });

    expect(event.start.timeZone).toBe("America/Argentina/Buenos_Aires");
  });

  it("una sesión larga cruza bien la medianoche", () => {
    const event = buildEventPayload({
      ...base,
      start: new Date("2026-07-28T23:30:00.000Z"),
      durationMinutes: 60,
    });

    expect(event.end.dateTime).toBe("2026-07-29T00:30:00.000Z");
  });

  it("sin notas manda descripción vacía, no 'null'", () => {
    expect(buildEventPayload({ ...base, description: null }).description).toBe("");
  });
});
