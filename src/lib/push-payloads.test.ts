import { describe, it, expect } from "vitest";
import {
  appointmentCancelledForPatient,
  appointmentCancelledForPsychologist,
  appointmentConfirmedForPatient,
  appointmentRescheduled,
  newAppointmentForPatient,
  newAppointmentForPsychologist,
  paymentFailedForPatient,
  type AppointmentPush,
} from "./push-payloads";

const base: AppointmentPush = {
  appointmentId: "cl_turno_123",
  date: new Date("2026-07-28T17:00:00.000Z"), // martes 14:00 en Argentina
  timezone: "America/Argentina/Buenos_Aires",
};

const todos = [
  newAppointmentForPsychologist,
  newAppointmentForPatient,
  appointmentConfirmedForPatient,
  appointmentCancelledForPatient,
  appointmentCancelledForPsychologist,
  paymentFailedForPatient,
];

describe("hora del turno en el aviso", () => {
  it("usa la hora del profesional, no UTC", () => {
    for (const build of todos) {
      expect(build(base).body).toContain("14:00");
      expect(build(base).body).not.toContain("17:00");
    }
  });

  it("cae en la zona por defecto si la del perfil es inválida", () => {
    const payload = appointmentConfirmedForPatient({ ...base, timezone: "No/Existe" });
    expect(payload.body).toContain("14:00");
  });
});

describe("privacidad en la pantalla bloqueada", () => {
  // El aviso se ve sin desbloquear el teléfono. Nombrar a las partes delata
  // que esa persona está en terapia y con quién.
  const identificatorios = ["Ana", "Pérez", "Marta", "Gómez", "Lic.", "consulta"];

  it("ningún aviso nombra al paciente ni al profesional", () => {
    for (const build of todos) {
      const { title, body } = build(base);
      for (const palabra of identificatorios) {
        expect(`${title} ${body}`).not.toContain(palabra);
      }
    }
  });

  it("tampoco lo hace el aviso de reprogramación", () => {
    for (const movedBy of ["PATIENT", "PSYCHOLOGIST"] as const) {
      const { title, body } = appointmentRescheduled(base, movedBy);
      for (const palabra of identificatorios) {
        expect(`${title} ${body}`).not.toContain(palabra);
      }
    }
  });
});

describe("agrupación por turno", () => {
  it("todos los avisos del mismo turno comparten tag", () => {
    const tags = todos.map((build) => build(base).tag);
    expect(new Set(tags).size).toBe(1);
    expect(tags[0]).toBe("turno-cl_turno_123");
  });

  it("turnos distintos no se pisan entre sí", () => {
    const otro = appointmentConfirmedForPatient({ ...base, appointmentId: "otro" });
    expect(otro.tag).not.toBe(appointmentConfirmedForPatient(base).tag);
  });
});

describe("a dónde lleva cada aviso", () => {
  it("al profesional lo manda a su panel de turnos", () => {
    expect(newAppointmentForPsychologist(base).url).toBe("/dashboard/turnos");
    expect(appointmentCancelledForPsychologist(base).url).toBe("/dashboard/turnos");
  });

  it("al paciente lo manda a su panel", () => {
    expect(appointmentConfirmedForPatient(base).url).toBe("/patient");
    expect(paymentFailedForPatient(base).url).toBe("/patient");
  });

  it("la reprogramación avisa a la otra parte", () => {
    // Quien movió el turno ya sabe que lo movió.
    expect(appointmentRescheduled(base, "PATIENT").url).toBe("/dashboard/turnos");
    expect(appointmentRescheduled(base, "PSYCHOLOGIST").url).toBe("/patient");
  });
});
