import { describe, it, expect } from "vitest";
import { hourlyRate, formatMoney } from "./pricing";

describe("tarifa por hora", () => {
  it("una sesión de 60 minutos vale lo mismo por hora", () => {
    expect(hourlyRate(20000, 60)).toBe(20000);
  });

  // El caso que motiva todo esto: sesiones más cortas cuestan más por hora de
  // lo que sugiere el precio de la sesión.
  it("una sesión de 50 minutos cuesta más por hora que su precio", () => {
    expect(hourlyRate(18500, 50)).toBe(22200);
  });

  it("una sesión de 45 minutos también", () => {
    expect(hourlyRate(16000, 45)).toBe(21333);
  });

  it("permite comparar sesiones de distinta duración", () => {
    // Parecen casi iguales por sesión, pero no lo son por hora.
    const a = hourlyRate(18000, 45)!; // 24.000
    const b = hourlyRate(18500, 60)!; // 18.500

    expect(a).toBeGreaterThan(b);
  });

  it("sin honorario cargado no inventa un número", () => {
    expect(hourlyRate(null, 50)).toBeNull();
  });

  it("una duración inválida no divide por cero", () => {
    expect(hourlyRate(18000, 0)).toBeNull();
    expect(hourlyRate(18000, -30)).toBeNull();
  });

  it("un honorario en cero es un dato válido, no un dato ausente", () => {
    expect(hourlyRate(0, 50)).toBe(0);
  });
});

describe("formato de moneda", () => {
  it("no muestra centavos", () => {
    expect(formatMoney(18500, "ARS")).not.toContain(",00");
  });

  it("incluye el monto", () => {
    expect(formatMoney(18500, "ARS")).toMatch(/18\.?500/);
  });

  it("una moneda desconocida no rompe el listado", () => {
    const out = formatMoney(1000, "XXX");
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
  });
});
