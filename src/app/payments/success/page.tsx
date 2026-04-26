import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Turno confirmado!</h1>
        <p className="text-gray-500 text-sm mb-6">
          Tu pago fue aprobado y el turno está reservado. Recibirás un email con los detalles de tu sesión.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-700 mb-6">
          Revisá tu casilla de email para el recordatorio de la sesión.
        </div>
        <Link href="/" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
