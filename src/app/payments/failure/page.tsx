"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function FailureContent() {
  const params = useSearchParams();
  const appointment = params.get("appointment");

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-sm w-full text-center shadow-sm">
        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1
          className="text-2xl font-bold text-[#2D4270] mb-2"
          style={{ fontFamily: "DM Serif Display, Georgia, serif" }}
        >
          Pago rechazado
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          No se pudo procesar el pago. Podés intentarlo de nuevo o elegir otro método de pago.
        </p>
        {appointment && (
          <p className="text-xs text-gray-400 mb-6">Referencia: {appointment}</p>
        )}
        <div className="space-y-2">
          <button
            onClick={() => window.history.back()}
            className="block w-full py-3 bg-[#2D4270] hover:bg-[#2D4270]/90 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            Intentar de nuevo
          </button>
          <Link
            href="/patient"
            className="block w-full py-3 text-[#2D4270] font-medium text-sm rounded-xl hover:bg-gray-50 transition-colors"
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
