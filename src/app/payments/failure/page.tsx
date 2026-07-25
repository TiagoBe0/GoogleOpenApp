"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FailureContent() {
  const params = useSearchParams();
  const appointment = params.get("appointment");

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="bg-surface rounded-lg border border-line p-10 max-w-sm w-full shadow-sm">
        <div className="w-16 h-16 bg-danger-soft rounded-full flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-semibold text-ink mb-2">
          Pago rechazado
        </h1>
        <p className="text-muted text-sm mb-6">
          No se pudo procesar el pago. Podés intentarlo de nuevo o elegir otro método de pago.
        </p>
        {appointment && (
          <p className="text-xs text-muted mb-6">Referencia: {appointment}</p>
        )}
        <div className="space-y-2">
          <button
            onClick={() => window.history.back()}
            className="flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hi"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/patient"
            className="flex min-h-11 w-full items-center justify-center rounded-md text-primary font-semibold text-sm hover:bg-surface-2 transition-colors"
          >
            Ver mis turnos
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailurePage() {
  return (
    <Suspense>
      <FailureContent />
    </Suspense>
  );
}
