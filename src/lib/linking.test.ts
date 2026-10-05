import { describe, it, expect } from "vitest";
import { refuseLink, canLink, type LinkActor, type LinkTarget } from "./linking";

const paciente = (over: Partial<LinkActor> = {}): LinkActor => ({
  id: "paciente-1",
  role: "PATIENT",
  psychologistId: null,
  ...over,
});

const profesional = (over: Partial<LinkTarget> = {}): LinkTarget => ({
  id: "psico-1",
  role: "PSYCHOLOGIST",
  ...over,
});

describe("vinculación permitida", () => {
  it("un paciente sin profesional puede elegir uno", () => {
    expect(refuseLink(paciente(), profesional())).toBeNull();
    expect(canLink(paciente(), profesional())).toBe(true);
  });
});

describe("vinculación rechazada", () => {
  it("quien no inició sesión no puede vincularse", () => {
    expect(refuseLink(null, profesional())).toMatchObject({ status: 403 });
  });

  it("un profesional no puede elegirse un profesional de cabecera", () => {
    const refusal = refuseLink(paciente({ role: "PSYCHOLOGIST" }), profesional());
    expect(refusal?.status).toBe(403);
  });

  it("no se puede vincular a alguien que no existe", () => {
    expect(refuseLink(paciente(), null)).toMatchObject({ status: 404 });
  });

  it("no se puede elegir a otro paciente como profesional", () => {
    const refusal = refuseLink(paciente(), profesional({ role: "PATIENT" }));
    expect(refusal?.status).toBe(400);
  });

  // Sin esta guarda alguien podría figurar como su propio profesional.
  it("nadie puede vincularse a sí mismo", () => {
    const yo = paciente({ id: "misma-persona" });
    const refusal = refuseLink(yo, profesional({ id: "misma-persona" }));

    expect(refusal?.status).toBe(400);
    expect(refusal?.error).toMatch(/vos mismo/i);
  });

  it("quien ya tiene profesional no puede tomar otro sin desvincularse", () => {
    const refusal = refuseLink(paciente({ psychologistId: "psico-previo" }), profesional());

    expect(refusal?.status).toBe(409);
    expect(refusal?.error).toMatch(/ya ten[eé]s/i);
  });

  it("tampoco puede volver a vincularse al mismo que ya tiene", () => {
    const refusal = refuseLink(
      paciente({ psychologistId: "psico-1" }),
      profesional({ id: "psico-1" })
    );

    expect(refusal?.status).toBe(409);
  });
});

describe("orden de las guardas", () => {
  // Si el orden se invierte, un visitante anónimo recibiría "no existe ese
  // profesional" y aprendería qué slugs son válidos sin haber iniciado sesión.
  it("los permisos se revisan antes que la existencia del profesional", () => {
    expect(refuseLink(null, null)).toMatchObject({ status: 403 });
  });

  it("el rol se revisa antes que el estado de vinculación", () => {
    const refusal = refuseLink(
      paciente({ role: "PSYCHOLOGIST", psychologistId: "otro" }),
      profesional()
    );

    expect(refusal?.status).toBe(403);
  });
});
