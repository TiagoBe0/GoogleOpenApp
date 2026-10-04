import { describe, it, expect } from "vitest";
import { WHATSAPP_NUMBER, whatsappLink } from "./contact";

describe("link de WhatsApp", () => {
  // wa.me no acepta +, espacios ni guiones: con cualquiera de esos el link abre
  // WhatsApp pero sin chat.
  it("usa solo dígitos", () => {
    expect(WHATSAPP_NUMBER).toMatch(/^\d+$/);
    expect(whatsappLink("hola", "+54 9 2634 54-2090")).toBe("https://wa.me/5492634542090?text=hola");
  });

  it("codifica el mensaje", () => {
    expect(whatsappLink("¿Precio & plazos?")).toContain("?text=%C2%BFPrecio%20%26%20plazos%3F");
  });
});
