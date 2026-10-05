import { describe, it, expect } from "vitest";
import { normalizeMeetingUrl } from "./meeting-link";

describe("links que se aceptan", () => {
  it("acepta los proveedores habituales", () => {
    const links = [
      "https://meet.google.com/abc-defg-hij",
      "https://us02web.zoom.us/j/1234567890?pwd=xyz",
      "https://meet.jit.si/PsicoLinkSala",
      "https://whereby.com/consultorio",
      "https://teams.microsoft.com/l/meetup-join/19%3ameeting_abc",
    ];
    for (const link of links) {
      expect(normalizeMeetingUrl(link)).toEqual({ ok: true, url: link });
    }
  });

  it("limpia espacios alrededor", () => {
    expect(normalizeMeetingUrl("  https://meet.jit.si/sala  ")).toEqual({
      ok: true,
      url: "https://meet.jit.si/sala",
    });
  });

  it("conserva la query, que suele traer la contraseña de la sala", () => {
    const conPass = "https://us02web.zoom.us/j/123?pwd=secreto";
    const res = normalizeMeetingUrl(conPass);
    expect(res.ok && res.url).toBe(conPass);
  });
});

describe("borrar el link", () => {
  it("vacío, null y undefined lo dejan sin link", () => {
    for (const entrada of ["", "   ", null, undefined]) {
      expect(normalizeMeetingUrl(entrada)).toEqual({ ok: true, url: null });
    }
  });
});

describe("esquemas peligrosos", () => {
  // El link se renderiza como href en la pantalla del paciente. Un esquema
  // ejecutable acá es ejecución de código en la sesión de otra persona.
  const hostiles = [
    "javascript:alert(document.cookie)",
    "JavaScript:alert(1)",
    "  javascript:alert(1)  ",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
    "blob:https://psicolink.test/abc",
    "file:///etc/passwd",
  ];

  it("ninguno pasa", () => {
    for (const link of hostiles) {
      expect(normalizeMeetingUrl(link).ok).toBe(false);
    }
  });
});

describe("otros rechazos", () => {
  it("rechaza http:, porque la app va por https y el navegador lo bloquearía", () => {
    expect(normalizeMeetingUrl("http://meet.jit.si/sala").ok).toBe(false);
  });

  it("rechaza texto que no es una URL", () => {
    expect(normalizeMeetingUrl("meet.google.com/abc").ok).toBe(false);
    expect(normalizeMeetingUrl("pasame el link por whatsapp").ok).toBe(false);
  });

  it("rechaza lo que no es texto", () => {
    for (const entrada of [42, true, {}, []]) {
      expect(normalizeMeetingUrl(entrada).ok).toBe(false);
    }
  });

  it("rechaza links absurdamente largos", () => {
    expect(normalizeMeetingUrl(`https://x.com/${"a".repeat(2100)}`).ok).toBe(false);
  });
});
