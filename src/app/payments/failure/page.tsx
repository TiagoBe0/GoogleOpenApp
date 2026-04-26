"use client";

import Link from "next/link";

export default function PaymentFailurePage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pago rechazado</h1>
        <p className="text-gray-500 text-sm mb-6">
          No se pudo procesar tu pago. El turno no fue reservado. Podés intentarlo nuevamente.
        </p>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-6">
          Verificá los datos de tu tarjeta o probá con otro método de pago.
        </div>
        <button
          onClick={() => window.history.back()}
          className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors cursor-pointer mr-3"
        >
          Volver a intentar
        </button>
        <Link href="/" className="inline-block text-gray-500 hover:text-gray-700 text-sm px-4 py-2.5">
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
