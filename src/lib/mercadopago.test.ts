import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import {
  amountCovers,
  buildSignatureManifest,
  currencyMatches,
  parseSignatureHeader,
  signatureGate,
  statusForPayment,
  verifySignature,
} from "./mercadopago";

const SECRET = "clave-de-webhook-de-prueba";

function signedHeader(dataId: string, requestId: string, ts = "1785000000"): string {
  const manifest = buildSignatureManifest(dataId, requestId, ts);
  const v1 = createHmac("sha256", SECRET).update(manifest).digest("hex");
  return `ts=${ts},v1=${v1}`;
}

describe("qué hacer sin clave de webhook", () => {
  it("con clave, siempre verifica", () => {
    expect(signatureGate(SECRET, true)).toBe("verify");
    expect(signatureGate(SECRET, false)).toBe("verify");
  });

  // El agujero que esto cierra: sin clave en producción, cualquiera posteaba
  // al webhook y se confirmaba un turno sin haber pagado.
  it("sin clave en producción, rechaza", () => {
    expect(signatureGate(undefined, true)).toBe("reject");
    expect(signatureGate("", true)).toBe("reject");
  });

  it("sin clave en desarrollo, deja pasar para poder probar", () => {
    expect(signatureGate(undefined, false)).toBe("skip-development");
  });
});

describe("header de firma", () => {
  it("separa ts y v1", () => {
    expect(parseSignatureHeader("ts=123,v1=abc")).toEqual({ ts: "123", v1: "abc" });
  });

  it("tolera espacios alrededor de las comas", () => {
    expect(parseSignatureHeader(" ts=123 , v1=abc ")).toEqual({ ts: "123", v1: "abc" });
  });

  it("rechaza lo que no trae las dos partes", () => {
    expect(parseSignatureHeader("ts=123")).toBeNull();
    expect(parseSignatureHeader("v1=abc")).toBeNull();
    expect(parseSignatureHeader("")).toBeNull();
    expect(parseSignatureHeader(null)).toBeNull();
    expect(parseSignatureHeader("cualquier cosa")).toBeNull();
  });
});

describe("verificación de la firma", () => {
  it("acepta una firma legítima", () => {
    expect(
      verifySignature({
        secret: SECRET,
        header: signedHeader("pago-1", "req-1"),
        requestId: "req-1",
        dataId: "pago-1",
      })
    ).toBe(true);
  });

  it("rechaza una firma inventada", () => {
    expect(
      verifySignature({
        secret: SECRET,
        header: "ts=1785000000,v1=0000000000000000000000000000000000000000000000000000000000000000",
        requestId: "req-1",
        dataId: "pago-1",
      })
    ).toBe(false);
  });

  it("rechaza si la firmó otra clave", () => {
    const otra = createHmac("sha256", "otra-clave")
      .update(buildSignatureManifest("pago-1", "req-1", "1785000000"))
      .digest("hex");

    expect(
      verifySignature({
        secret: SECRET,
        header: `ts=1785000000,v1=${otra}`,
        requestId: "req-1",
        dataId: "pago-1",
      })
    ).toBe(false);
  });

  // Reusar la firma de un aviso para hablar de OTRO pago es el ataque obvio.
  it("rechaza una firma válida apuntada a otro pago", () => {
    expect(
      verifySignature({
        secret: SECRET,
        header: signedHeader("pago-1", "req-1"),
        requestId: "req-1",
        dataId: "pago-2",
      })
    ).toBe(false);
  });

  it("rechaza si cambia el request-id", () => {
    expect(
      verifySignature({
        secret: SECRET,
        header: signedHeader("pago-1", "req-1"),
        requestId: "req-2",
        dataId: "pago-1",
      })
    ).toBe(false);
  });

  it("no explota con una firma de largo distinto", () => {
    expect(
      verifySignature({ secret: SECRET, header: "ts=1,v1=corta", requestId: "r", dataId: "p" })
    ).toBe(false);
  });
});

describe("importe pagado", () => {
  it("acepta el importe exacto", () => {
    expect(amountCovers(20000, 20000)).toBe(true);
  });

  it("acepta de más", () => {
    expect(amountCovers(25000, 20000)).toBe(true);
  });

  // El ataque: pagar $1 una sesión de $20000 y quedar confirmado.
  it("rechaza pagar de menos", () => {
    expect(amountCovers(1, 20000)).toBe(false);
    expect(amountCovers(19999, 20000)).toBe(false);
  });

  it("tolera el redondeo de los float", () => {
    expect(amountCovers(19999.999999997, 20000)).toBe(true);
  });

  it("sin importe esperado no hay nada que verificar", () => {
    expect(amountCovers(null, null)).toBe(true);
  });

  it("si el turno tenía precio, un pago sin importe no alcanza", () => {
    expect(amountCovers(null, 20000)).toBe(false);
    expect(amountCovers(undefined, 20000)).toBe(false);
  });
});

describe("moneda", () => {
  it("acepta la misma moneda sin importar mayúsculas", () => {
    expect(currencyMatches("ars", "ARS")).toBe(true);
  });

  // Pagar 20000 pesos chilenos una sesión de 20000 pesos argentinos.
  it("rechaza otra moneda", () => {
    expect(currencyMatches("CLP", "ARS")).toBe(false);
  });

  it("sin moneda esperada no verifica nada", () => {
    expect(currencyMatches(null, null)).toBe(true);
  });

  it("si el turno tenía moneda, un pago sin moneda no alcanza", () => {
    expect(currencyMatches(null, "ARS")).toBe(false);
  });
});

describe("estado según el pago", () => {
  it("aprobado confirma", () => {
    expect(statusForPayment("approved")).toBe("CONFIRMED");
  });

  it("rechazado y cancelado cancelan", () => {
    expect(statusForPayment("rejected")).toBe("CANCELLED");
    expect(statusForPayment("cancelled")).toBe("CANCELLED");
  });

  // Un pago en revisión no puede confirmar ni cancelar el turno.
  it("los estados intermedios no tocan el turno", () => {
    expect(statusForPayment("pending")).toBeNull();
    expect(statusForPayment("in_process")).toBeNull();
    expect(statusForPayment("authorized")).toBeNull();
    expect(statusForPayment("cualquier-cosa")).toBeNull();
  });
});
