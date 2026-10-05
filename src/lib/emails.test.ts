import { describe, it, expect } from "vitest";
import {
  appointmentCancelledForPatient,
  appointmentCancelledForPsychologist,
  appointmentConfirmedForPatient,
  appointmentRescheduled,
  escapeHtml,
  formatWhen,
  newAppointmentForPatient,
  newAppointmentForPsychologist,
  paymentFailedForPatient,
  type AppointmentEmail,
} from "./emails";

const base: AppointmentEmail = {
  patientName: "Ana Pérez",
  psychologistName: "Lic. Marta Gómez",
  date: new Date("2026-07-28T17:00:00.000Z"), // martes 14:00 en Argentina
  duration: 50,
  timezone: "America/Argentina/Buenos_Aires",
  notes: "Primera consulta",
  appUrl: "https://psicolink.test",
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
    expect(formatWhen(base.date, base.timezone)).toContain("14:00");
  });

  it("escribe el día en castellano", () => {
    const when = formatWhen(base.date, base.timezone);

    expect(when).toContain("martes");
    expect(when).toContain("julio");
  });

  // Un turno de la nochecita cae al día siguiente en UTC: el mail tiene que
  // decir el día que el paciente tiene anotado, no el del servidor.
  it("respeta el día local cuando UTC ya pasó de medianoche", () => {
    const when = formatWhen(new Date("2026-07-29T01:00:00.000Z"), base.timezone);

    expect(when).toContain("28");
    expect(when).toContain("22:00");
  });

  it("una zona inválida no rompe el envío", () => {
    expect(() => formatWhen(base.date, "Marte/Olympus")).not.toThrow();
  });
});

describe("escapado de HTML", () => {
  it("neutraliza las etiquetas", () => {
    expect(escapeHtml("<script>alert(1)</script>")).not.toContain("<script>");
  });

  it("escapa comillas y ampersands", () => {
    expect(escapeHtml(`"&'`)).toBe("&quot;&amp;&#39;");
  });

  // El nombre de una reserva pública lo escribe cualquiera sin cuenta.
  it("un nombre con HTML no entra crudo en el correo del profesional", () => {
    const message = newAppointmentForPsychologist({
      ...base,
      patientName: '<img src=x onerror="alert(1)">',
    });

    // Queda como texto visible, no como etiqueta: sin "<" ni comillas crudas
    // el cliente de correo no tiene nada que ejecutar.
    expect(message.html).not.toContain("<img");
    expect(message.html).not.toContain('onerror="');
    expect(message.html).toContain("&lt;img");
  });
});

describe("avisos de turno", () => {
  it("todos traen asunto, texto y html", () => {
    for (const build of todos) {
      const message = build(base);

      expect(message.subject.length).toBeGreaterThan(0);
      expect(message.text.length).toBeGreaterThan(0);
      expect(message.html).toContain("</html>");
    }
  });

  it("todos dicen cuándo es el turno", () => {
    for (const build of todos) {
      expect(build(base).text).toContain("14:00");
    }
  });

  it("ninguno deja un placeholder sin reemplazar", () => {
    for (const build of todos) {
      const message = build(base);

      expect(message.subject + message.text + message.html).not.toMatch(/undefined|\[object|NaN/);
    }
  });

  it("el aviso al profesional nombra al paciente y linkea a sus turnos", () => {
    const message = newAppointmentForPsychologist(base);

    expect(message.subject).toContain("Ana Pérez");
    expect(message.html).toContain("/dashboard/turnos");
  });

  it("el aviso al paciente nombra al profesional", () => {
    const message = newAppointmentForPatient(base);

    expect(message.text).toContain("Lic. Marta Gómez");
  });

  it("el motivo aparece cuando se cargó", () => {
    expect(newAppointmentForPsychologist(base).text).toContain("Primera consulta");
  });

  it("sin motivo no queda una línea vacía", () => {
    const message = newAppointmentForPsychologist({ ...base, notes: null });

    expect(message.text).not.toContain("Motivo:");
  });

  it("un motivo en blanco cuenta como sin motivo", () => {
    const message = newAppointmentForPsychologist({ ...base, notes: "   " });

    expect(message.text).not.toContain("Motivo:");
  });

  it("la confirmación lleva la fecha en el asunto", () => {
    expect(appointmentConfirmedForPatient(base).subject).toContain("14:00");
  });

  it("las cancelaciones se dirigen a quien no canceló", () => {
    expect(appointmentCancelledForPatient(base).text).toContain("Lic. Marta Gómez");
    expect(appointmentCancelledForPsychologist(base).text).toContain("Ana Pérez");
  });

  describe("reprogramación", () => {
    const previousDate = new Date("2026-07-21T17:00:00.000Z"); // martes anterior

    it("nombra el horario viejo y el nuevo", () => {
      const message = appointmentRescheduled({ ...base, previousDate, movedBy: "PSYCHOLOGIST" });

      expect(message.text).toContain("21"); // el que estaba
      expect(message.text).toContain("28"); // el nuevo
      expect(message.subject).toContain("14:00");
    });

    // Cada parte tiene que leer quién movió el turno, no un "se movió" sin dueño.
    it("dice quién lo movió según el caso", () => {
      expect(
        appointmentRescheduled({ ...base, previousDate, movedBy: "PATIENT" }).text
      ).toContain("Ana Pérez");
      expect(
        appointmentRescheduled({ ...base, previousDate, movedBy: "PSYCHOLOGIST" }).text
      ).toContain("Lic. Marta Gómez");
    });

    it("al profesional le avisa que queda pendiente de confirmar", () => {
      const message = appointmentRescheduled({ ...base, previousDate, movedBy: "PATIENT" });

      expect(message.text).toContain("pendiente de tu confirmación");
      expect(message.html).toContain("/dashboard/turnos");
    });

    it("al paciente le ofrece cancelar si no le sirve", () => {
      const message = appointmentRescheduled({ ...base, previousDate, movedBy: "PSYCHOLOGIST" });

      expect(message.text).toContain("cancelarlo");
      expect(message.html).toContain("/patient");
    });
  });

  // Decirle "el profesional canceló" a quien se le rechazó la tarjeta sería
  // mentirle y hacerlo desconfiar del profesional.
  it("el pago rechazado no culpa al profesional", () => {
    const message = paymentFailedForPatient(base);

    expect(message.text).toContain("no se pudo procesar");
    expect(message.text).not.toContain("canceló");
    expect(message.text).toContain("No se te cobró nada");
  });
});

describe("link de videollamada en el aviso de confirmación", () => {
  const conLink = { ...base, meetingUrl: "https://meet.jit.si/sala-de-ana" };

  it("aparece en la versión de texto y en la HTML", () => {
    const msg = appointmentConfirmedForPatient(conLink);
    expect(msg.text).toContain("https://meet.jit.si/sala-de-ana");
    expect(msg.html).toContain("https://meet.jit.si/sala-de-ana");
  });

  it("el botón del correo lleva a la sala, no al panel", () => {
    const msg = appointmentConfirmedForPatient(conLink);
    expect(msg.html).toContain('href="https://meet.jit.si/sala-de-ana"');
    expect(msg.html).toContain("Entrar a la videollamada");
  });

  it("sin link, el botón sigue llevando al panel", () => {
    const msg = appointmentConfirmedForPatient(base);
    expect(msg.html).toContain("/patient");
    expect(msg.html).not.toContain("Entrar a la videollamada");
  });

  // Una cancelación no puede ofrecer una sala que ya no se va a usar.
  it("la cancelación no muestra el link", () => {
    const msg = appointmentCancelledForPatient(conLink);
    expect(msg.text).not.toContain("meet.jit.si");
    expect(msg.html).not.toContain("meet.jit.si");
  });
});
