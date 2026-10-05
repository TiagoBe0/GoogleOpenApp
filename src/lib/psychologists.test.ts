import { describe, it, expect } from "vitest";
import {
  rankEntries,
  weightedScore,
  bioPreview,
  matchesQuery,
  type DirectoryEntry,
} from "./psychologists";

function entry(over: Partial<DirectoryEntry> & { id: string }): DirectoryEntry {
  return {
    name: over.id,
    image: null,
    slug: over.id,
    specialty: null,
    licenseNumber: null,
    bio: null,
    consultationFee: 15000,
    currency: "ARS",
    sessionDuration: 50,
    rating: { average: 0, count: 0 },
    ...over,
  };
}

const order = (entries: DirectoryEntry[], q = "") => rankEntries(entries, q).map((e) => e.id);

describe("orden del directorio", () => {
  // Este es el bug que llegó a producción: ordenar por promedio crudo dejaba
  // que una sola opinión perfecta tapara a alguien con más respaldo.
  it("una opinión de 5,0 no le gana a un 4,8 con cuatro", () => {
    const result = order([
      entry({ id: "una-sola-perfecta", rating: { average: 5, count: 1 } }),
      entry({ id: "cuatro-muy-buenas", rating: { average: 4.8, count: 4 } }),
    ]);

    expect(result[0]).toBe("cuatro-muy-buenas");
  });

  it("la diferencia se sostiene cuando el respaldo es mucho mayor", () => {
    const result = order([
      entry({ id: "una-sola-perfecta", rating: { average: 5, count: 1 } }),
      entry({ id: "treinta-opiniones", rating: { average: 4.8, count: 30 } }),
    ]);

    expect(result[0]).toBe("treinta-opiniones");
  });

  it("con la misma cantidad de opiniones gana el mejor promedio", () => {
    const result = order([
      entry({ id: "peor", rating: { average: 4.1, count: 5 } }),
      entry({ id: "mejor", rating: { average: 4.9, count: 5 } }),
    ]);

    expect(result[0]).toBe("mejor");
  });

  // Sin esto, quien recién publica su perfil arranca último para siempre.
  it("quien no tiene opiniones no queda último", () => {
    const result = order([
      entry({ id: "muy-bueno", rating: { average: 4.9, count: 10 } }),
      entry({ id: "flojo", rating: { average: 3.2, count: 8 } }),
      entry({ id: "recien-llegado", rating: { average: 0, count: 0 } }),
    ]);

    expect(result).toEqual(["muy-bueno", "recien-llegado", "flojo"]);
  });

  it("quien no tiene opiniones tampoco queda primero", () => {
    const result = order([
      entry({ id: "muy-bueno", rating: { average: 4.9, count: 10 } }),
      entry({ id: "recien-llegado", rating: { average: 0, count: 0 } }),
    ]);

    expect(result[0]).toBe("muy-bueno");
  });

  it("no rompe con el directorio vacío", () => {
    expect(rankEntries([])).toEqual([]);
  });

  it("no rompe cuando nadie tiene opiniones todavía", () => {
    const result = order([entry({ id: "a" }), entry({ id: "b" })]);
    expect(result).toHaveLength(2);
  });
});

describe("búsqueda", () => {
  const ana = entry({
    id: "ana",
    name: "Ana Torres",
    specialty: "Terapia cognitivo-conductual",
    bio: "Ansiedad y estrés laboral",
  });

  it("encuentra por nombre sin importar mayúsculas", () => {
    expect(matchesQuery(ana, "ana torres")).toBe(true);
    expect(matchesQuery(ana, "ANA")).toBe(true);
  });

  it("encuentra por especialidad", () => {
    expect(matchesQuery(ana, "cognitivo")).toBe(true);
  });

  it("encuentra por texto de la bio", () => {
    expect(matchesQuery(ana, "ansiedad")).toBe(true);
  });

  it("ignora espacios sobrantes alrededor de la búsqueda", () => {
    expect(matchesQuery(ana, "  cognitivo  ")).toBe(true);
  });

  it("no inventa coincidencias", () => {
    expect(matchesQuery(ana, "cardiología")).toBe(false);
  });

  it("una búsqueda vacía devuelve a todos", () => {
    expect(order([entry({ id: "a" }), entry({ id: "b" })], "")).toHaveLength(2);
  });

  it("filtra y ordena a la vez", () => {
    const result = order(
      [
        entry({ id: "sin-match", specialty: "Otra cosa", rating: { average: 5, count: 9 } }),
        entry({ id: "match-flojo", specialty: "Duelo", rating: { average: 3, count: 9 } }),
        entry({ id: "match-bueno", specialty: "Duelo", rating: { average: 4.8, count: 9 } }),
      ],
      "duelo"
    );

    expect(result).toEqual(["match-bueno", "match-flojo"]);
  });
});

describe("recorte de la bio", () => {
  it("deja intacta una bio corta", () => {
    expect(bioPreview("Dos líneas nada más.")).toBe("Dos líneas nada más.");
  });

  it("recorta la larga y marca que sigue", () => {
    const long = "a".repeat(300);
    const preview = bioPreview(long)!;

    expect(preview.endsWith("…")).toBe(true);
    expect(preview.length).toBeLessThan(long.length);
  });

  it("no deja un espacio colgando antes de los puntos suspensivos", () => {
    const preview = bioPreview(`${"a".repeat(179)} ${"b".repeat(200)}`)!;
    expect(preview).not.toContain(" …");
  });

  it("tolera una bio ausente", () => {
    expect(bioPreview(null)).toBeNull();
  });
});

describe("puntaje ponderado", () => {
  it("con pocas opiniones queda más cerca de la media de referencia", () => {
    const conUna = weightedScore(5, 1);
    const conCien = weightedScore(5, 100);

    expect(conUna).toBeLessThan(conCien);
  });

  it("sin opiniones devuelve exactamente la media de referencia", () => {
    expect(weightedScore(0, 0)).toBeCloseTo(4.3);
  });

  it("el orden no depende de cuántos perfiles haya cargados", () => {
    // El defecto anterior: la media se calculaba sobre el propio directorio,
    // así que agregar o quitar perfiles cambiaba el orden de los demás.
    const dos = rankEntries([
      entry({ id: "una-sola-perfecta", rating: { average: 5, count: 1 } }),
      entry({ id: "cuatro-muy-buenas", rating: { average: 4.8, count: 4 } }),
    ]).map((e) => e.id);

    const conRelleno = rankEntries([
      entry({ id: "una-sola-perfecta", rating: { average: 5, count: 1 } }),
      entry({ id: "cuatro-muy-buenas", rating: { average: 4.8, count: 4 } }),
      entry({ id: "relleno-1", rating: { average: 3.1, count: 12 } }),
      entry({ id: "relleno-2", rating: { average: 3.4, count: 20 } }),
    ])
      .map((e) => e.id)
      .filter((id) => !id.startsWith("relleno"));

    expect(conRelleno).toEqual(dos);
  });
});
