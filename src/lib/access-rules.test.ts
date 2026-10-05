import { describe, it, expect } from "vitest";
import { decideAccess, type GuardedUser } from "./access-rules";

const user = (over: Partial<GuardedUser> = {}): GuardedUser => ({
  id: "u1",
  role: "PATIENT",
  roleChosen: true,
  name: "Test",
  email: "test@test.local",
  ...over,
});

describe("acceso sin sesión", () => {
  it("manda a iniciar sesión", () => {
    expect(decideAccess(null)).toEqual({ ok: false, redirectTo: "/login" });
  });
});

describe("quien todavía no eligió su rol", () => {
  // Es el caso de Google: crea la cuenta con el rol por defecto sin preguntar.
  it("va a la bienvenida, no al panel", () => {
    const state = decideAccess(user({ roleChosen: false }), "PATIENT");
    expect(state).toEqual({ ok: false, redirectTo: "/bienvenida" });
  });

  it("va a la bienvenida incluso si el rol por defecto coincide", () => {
    const state = decideAccess(user({ role: "PATIENT", roleChosen: false }), "PATIENT");
    expect(state.ok).toBe(false);
  });

  it("la bienvenida gana sobre el desvío por rol equivocado", () => {
    // Si se invirtiera, un psicólogo nuevo rebotaría entre paneles sin poder
    // elegir nunca.
    const state = decideAccess(user({ role: "PATIENT", roleChosen: false }), "PSYCHOLOGIST");
    expect(state).toEqual({ ok: false, redirectTo: "/bienvenida" });
  });
});

describe("quien ya eligió", () => {
  it("entra al panel que le corresponde", () => {
    const state = decideAccess(user({ role: "PATIENT" }), "PATIENT");
    expect(state.ok).toBe(true);
  });

  it("un paciente que abre el panel profesional vuelve al suyo", () => {
    const state = decideAccess(user({ role: "PATIENT" }), "PSYCHOLOGIST");
    expect(state).toEqual({ ok: false, redirectTo: "/patient" });
  });

  it("un psicólogo que abre el panel de paciente vuelve al suyo", () => {
    const state = decideAccess(user({ role: "PSYCHOLOGIST" }), "PATIENT");
    expect(state).toEqual({ ok: false, redirectTo: "/dashboard" });
  });

  it("sin rol esperado alcanza con haber elegido", () => {
    expect(decideAccess(user({ role: "PSYCHOLOGIST" })).ok).toBe(true);
    expect(decideAccess(user({ role: "PATIENT" })).ok).toBe(true);
  });

  it("devuelve al usuario para no volver a consultarlo", () => {
    const state = decideAccess(user({ id: "u-42" }), "PATIENT");
    expect(state.ok && state.user.id).toBe("u-42");
  });
});
