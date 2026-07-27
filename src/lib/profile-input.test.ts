import { describe, it, expect } from "vitest";
import {
  MAX_YEARS_OF_EXPERIENCE,
  normalizeBoolean,
  normalizeText,
  normalizeYearsOfExperience,
} from "./profile-input";

describe("texto del perfil", () => {
  it("recorta los espacios de los costados", () => {
    expect(normalizeText("city", "  Santa Fe  ")).toEqual({ ok: true, value: "Santa Fe" });
  });

  // Vaciar el campo en la interfaz tiene que borrar el dato, no guardar "".
  it("vacío significa borrar", () => {
    expect(normalizeText("city", "")).toEqual({ ok: true, value: null });
    expect(normalizeText("city", "   ")).toEqual({ ok: true, value: null });
    expect(normalizeText("city", null)).toEqual({ ok: true, value: null });
  });

  it("rechaza lo que no es texto", () => {
    expect(normalizeText("city", 42).ok).toBe(false);
    expect(normalizeText("city", {}).ok).toBe(false);
  });

  it("corta un texto más largo que el límite", () => {
    const result = normalizeText("city", "a".repeat(101));

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("100");
  });

  it("acepta justo el largo máximo", () => {
    expect(normalizeText("city", "a".repeat(100)).ok).toBe(true);
  });

  it("un campo sin límite declarado no se limita", () => {
    expect(normalizeText("campoNuevo", "x".repeat(5000)).ok).toBe(true);
  });
});

describe("años de experiencia", () => {
  it("acepta un entero razonable", () => {
    expect(normalizeYearsOfExperience(12)).toEqual({ ok: true, value: 12 });
  });

  // El formulario manda strings: es un <input type="number">.
  it("acepta el número escrito como texto", () => {
    expect(normalizeYearsOfExperience("12")).toEqual({ ok: true, value: 12 });
  });

  it("vacío queda en null", () => {
    expect(normalizeYearsOfExperience("")).toEqual({ ok: true, value: null });
    expect(normalizeYearsOfExperience(null)).toEqual({ ok: true, value: null });
  });

  it("rechaza negativos y valores absurdos", () => {
    expect(normalizeYearsOfExperience(-1).ok).toBe(false);
    expect(normalizeYearsOfExperience(MAX_YEARS_OF_EXPERIENCE + 1).ok).toBe(false);
  });

  it("acepta los extremos válidos", () => {
    expect(normalizeYearsOfExperience(0)).toEqual({ ok: true, value: 0 });
    expect(normalizeYearsOfExperience(MAX_YEARS_OF_EXPERIENCE).ok).toBe(true);
  });

  it("rechaza decimales y basura", () => {
    expect(normalizeYearsOfExperience(5.5).ok).toBe(false);
    expect(normalizeYearsOfExperience("muchos").ok).toBe(false);
    expect(normalizeYearsOfExperience(NaN).ok).toBe(false);
    expect(normalizeYearsOfExperience(Infinity).ok).toBe(false);
  });
});

describe("modalidades", () => {
  it("acepta booleanos", () => {
    expect(normalizeBoolean("modalityOnline", true)).toEqual({ ok: true, value: true });
    expect(normalizeBoolean("modalityOnline", false)).toEqual({ ok: true, value: false });
  });

  // "false" como string es verdadero en JavaScript: si no se rechaza, un
  // profesional que se saca del directorio seguiría apareciendo.
  it("rechaza los booleanos disfrazados de texto", () => {
    expect(normalizeBoolean("acceptsNewPatients", "false").ok).toBe(false);
    expect(normalizeBoolean("acceptsNewPatients", 0).ok).toBe(false);
    expect(normalizeBoolean("acceptsNewPatients", null).ok).toBe(false);
  });
});
