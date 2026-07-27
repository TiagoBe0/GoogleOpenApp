import { describe, it, expect } from "vitest";
import { buildIcs, escapeIcsText, foldLine, formatIcsDate, type IcsEvent } from "./ics";

const base: IcsEvent = {
  uid: "turno-123@psicolink",
  start: new Date("2026-07-28T17:00:00.000Z"),
  durationMinutes: 50,
  summary: "Sesión con Lic. Marta Gómez",
  description: "Primera consulta",
  organizer: { name: "Lic. Marta Gómez", email: "marta@psicolink.test" },
  attendee: { name: "Ana Pérez", email: "ana@ejemplo.test" },
  status: "CONFIRMED",
  timestamp: new Date("2026-07-27T12:00:00.000Z"),
};

const linesOf = (ics: string) => ics.split("\r\n");

describe("formato de fecha", () => {
  it("usa UTC básico con Z", () => {
    expect(formatIcsDate(new Date("2026-07-28T17:00:00.000Z"))).toBe("20260728T170000Z");
  });

  it("no deja guiones ni dos puntos ni milisegundos", () => {
    expect(formatIcsDate(new Date("2026-01-05T03:07:09.123Z"))).toBe("20260105T030709Z");
  });
});

describe("escapado de texto", () => {
  it("escapa coma, punto y coma y barra", () => {
    expect(escapeIcsText("uno, dos; tres\\cuatro")).toBe("uno\\, dos\\; tres\\\\cuatro");
  });

  it("convierte el salto de línea en \\n literal", () => {
    expect(escapeIcsText("linea1\nlinea2")).toBe("linea1\\nlinea2");
    expect(escapeIcsText("linea1\r\nlinea2")).toBe("linea1\\nlinea2");
  });

  // Una coma sin escapar corta el valor y el resto se pierde o rompe el archivo.
  it("una dirección con comas no parte el campo", () => {
    const ics = buildIcs({ ...base, location: "San Martín 1234, Santa Fe, Argentina" });

    expect(ics).toContain("LOCATION:San Martín 1234\\, Santa Fe\\, Argentina");
  });
});

describe("plegado de líneas", () => {
  it("una línea corta queda igual", () => {
    expect(foldLine("SUMMARY:corto")).toBe("SUMMARY:corto");
  });

  it("una línea larga se parte con espacio al inicio de la continuación", () => {
    const folded = foldLine("DESCRIPTION:" + "a".repeat(200));
    const parts = folded.split("\r\n");

    expect(parts.length).toBeGreaterThan(1);
    for (const part of parts.slice(1)) expect(part.startsWith(" ")).toBe(true);
  });

  // Se mide en bytes: cortar por caracteres deja líneas más largas de lo permitido.
  it("ninguna línea plegada supera los 75 octetos", () => {
    const encoder = new TextEncoder();
    const folded = foldLine("DESCRIPTION:" + "áéíóú ñ ".repeat(40));

    for (const part of folded.split("\r\n")) {
      expect(encoder.encode(part).length).toBeLessThanOrEqual(75);
    }
  });
});

describe("archivo de calendario", () => {
  it("abre y cierra el calendario y el evento", () => {
    const lines = linesOf(buildIcs(base));

    expect(lines[0]).toBe("BEGIN:VCALENDAR");
    expect(lines).toContain("BEGIN:VEVENT");
    expect(lines).toContain("END:VEVENT");
    expect(lines.filter(Boolean).at(-1)).toBe("END:VCALENDAR");
  });

  // Con LF solo, varios clientes rechazan el archivo entero.
  it("todas las líneas terminan en CRLF", () => {
    const ics = buildIcs(base);
    const sinCrlf = ics.replace(/\r\n/g, "");

    expect(sinCrlf).not.toContain("\n");
  });

  it("lleva inicio y fin calculados con la duración", () => {
    const ics = buildIcs(base);

    expect(ics).toContain("DTSTART:20260728T170000Z");
    expect(ics).toContain("DTEND:20260728T175000Z");
  });

  it("incluye organizador e invitado", () => {
    const ics = buildIcs(base);

    expect(ics).toContain("mailto:marta@psicolink.test");
    expect(ics).toContain("mailto:ana@ejemplo.test");
  });

  // El UID es lo que permite que una cancelación pise el evento ya agendado.
  it("mantiene el UID que se le pasa", () => {
    expect(buildIcs(base)).toContain("UID:turno-123@psicolink");
  });

  it("un turno confirmado pide agendar", () => {
    const ics = buildIcs(base);

    expect(ics).toContain("METHOD:REQUEST");
    expect(ics).toContain("STATUS:CONFIRMED");
  });

  it("una cancelación cancela en vez de agendar", () => {
    const ics = buildIcs({ ...base, status: "CANCELLED", sequence: 1 });

    expect(ics).toContain("METHOD:CANCEL");
    expect(ics).toContain("STATUS:CANCELLED");
    expect(ics).toContain("SEQUENCE:1");
  });

  it("sin descripción ni lugar no emite campos vacíos", () => {
    const ics = buildIcs({ ...base, description: null, location: "   " });

    expect(ics).not.toContain("DESCRIPTION:");
    expect(ics).not.toContain("LOCATION:");
  });

  it("sin invitado no emite ATTENDEE", () => {
    expect(buildIcs({ ...base, attendee: null })).not.toContain("ATTENDEE");
  });
});
