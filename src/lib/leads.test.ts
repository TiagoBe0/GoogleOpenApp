import { describe, it, expect } from "vitest";
import { LEAD_LIMITS, newLeadNotification, validateLead } from "./leads";

const base = { name: "Ana", email: "ana@bodega.com", message: "Quiero un spot para la vendimia" };

describe("validar consulta", () => {
  it("acepta lo mínimo y normaliza", () => {
    const r = validateLead({ ...base, name: "  Ana  ", email: "ANA@Bodega.com", company: "" });
    expect(r).toEqual({
      ok: true,
      value: { name: "Ana", email: "ana@bodega.com", company: null, phone: null, service: null, message: base.message },
    });
  });

  it("pide nombre, email válido y mensaje", () => {
    expect(validateLead({ ...base, name: " " }).ok).toBe(false);
    expect(validateLead({ ...base, email: "ana@" }).ok).toBe(false);
    expect(validateLead({ ...base, message: "" }).ok).toBe(false);
    expect(validateLead(null).ok).toBe(false);
    expect(validateLead("hola").ok).toBe(false);
  });

  it("rechaza tipos raros y textos gigantes", () => {
    expect(validateLead({ ...base, name: 42 }).ok).toBe(false);
    expect(validateLead({ ...base, message: "x".repeat(LEAD_LIMITS.message + 1) }).ok).toBe(false);
    expect(validateLead({ ...base, phone: "1".repeat(LEAD_LIMITS.phone + 1) }).ok).toBe(false);
  });

  // Un id inventado no puede terminar guardado en la base.
  it("solo acepta servicios conocidos", () => {
    const ok = validateLead({ ...base, service: "spot" });
    const raro = validateLead({ ...base, service: "<script>" });
    expect(ok.ok && ok.value.service).toBe("spot");
    expect(raro.ok && raro.value.service).toBe(null);
  });

  it("marca como spam si se llenó el campo trampa", () => {
    expect(validateLead({ ...base, website: "http://spam.example" })).toEqual({ ok: false, spam: true });
    expect(validateLead({ ...base, website: "" }).ok).toBe(true);
  });
});

describe("aviso de consulta nueva", () => {
  // Lo escribe cualquiera sin cuenta: no puede meter HTML en tu correo.
  it("escapa todo lo que viene del formulario", () => {
    const r = validateLead({ ...base, name: "<img src=x onerror=alert(1)>", message: "<b>hola</b>" });
    if (!r.ok) throw new Error("debería validar");
    const { html, subject } = newLeadNotification(r.value);
    expect(html).not.toContain("<img src=x");
    expect(html).not.toContain("<b>hola</b>");
    expect(html).toContain("&lt;b&gt;hola&lt;/b&gt;");
    expect(subject).toContain("<img"); // el asunto es texto plano
  });

  it("incluye empresa y servicio cuando vienen", () => {
    const r = validateLead({ ...base, company: "Bodega Sol", service: "temporada" });
    if (!r.ok) throw new Error("debería validar");
    const { text, subject } = newLeadNotification(r.value);
    expect(subject).toBe("Nueva consulta — Ana (Bodega Sol)");
    expect(text).toContain("Servicio: Campaña de temporada");
  });
});
