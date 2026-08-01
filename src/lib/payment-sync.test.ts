import { describe, it, expect } from "vitest";
import { decidePaymentOutcome, type AppointmentCharge, type PaymentFacts } from "./payment-sync";

const turno: AppointmentCharge = { status: "PENDING", amount: 20000, currency: "ARS" };
const pago = (over: Partial<PaymentFacts> = {}): PaymentFacts => ({
  id: "pago-1",
  status: "approved",
  transactionAmount: 20000,
  currencyId: "ARS",
  ...over,
});

describe("qué hacer con un pago", () => {
  it("un pago correcto confirma el turno", () => {
    expect(decidePaymentOutcome(pago(), turno)).toEqual({ newStatus: "CONFIRMED", mismatch: false });
  });

  it("un pago rechazado cancela", () => {
    expect(decidePaymentOutcome(pago({ status: "rejected" }), turno)).toEqual({
      newStatus: "CANCELLED",
      mismatch: false,
    });
  });

  it("un pago en revisión no toca el turno", () => {
    expect(decidePaymentOutcome(pago({ status: "in_process" }), turno)).toEqual({
      newStatus: null,
      mismatch: false,
    });
  });

  // El ataque: pagar $1 una sesión de $20000 y quedar confirmado.
  it("pagar de menos no confirma y queda marcado", () => {
    expect(decidePaymentOutcome(pago({ transactionAmount: 1 }), turno)).toEqual({
      newStatus: null,
      mismatch: true,
    });
  });

  it("pagar en otra moneda no confirma", () => {
    expect(decidePaymentOutcome(pago({ currencyId: "CLP" }), turno)).toEqual({
      newStatus: null,
      mismatch: true,
    });
  });

  it("pagar de más está bien", () => {
    expect(decidePaymentOutcome(pago({ transactionAmount: 25000 }), turno).newStatus).toBe("CONFIRMED");
  });

  // Un rechazo no tiene que revisarse contra el importe: no confirma igual.
  it("un rechazo por un importe distinto sigue siendo un rechazo, no un desvío", () => {
    expect(decidePaymentOutcome(pago({ status: "rejected", transactionAmount: 1 }), turno)).toEqual({
      newStatus: "CANCELLED",
      mismatch: false,
    });
  });

  it("un turno sin precio se confirma con cualquier pago aprobado", () => {
    const gratis: AppointmentCharge = { status: "PENDING", amount: null, currency: null };

    expect(decidePaymentOutcome(pago({ transactionAmount: null }), gratis).newStatus).toBe("CONFIRMED");
  });

  // El webhook y la reconciliación consultan el mismo pago: tienen que llegar
  // a la misma conclusión o el turno queda distinto según quién lo procese.
  it("la misma decisión es estable si se repite", () => {
    const primera = decidePaymentOutcome(pago(), turno);
    const segunda = decidePaymentOutcome(pago(), { ...turno, status: "CONFIRMED" });

    expect(segunda.newStatus).toBe(primera.newStatus);
  });
});
