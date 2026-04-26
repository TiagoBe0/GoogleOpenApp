import Link from "next/link";

export default function PaymentPendingPage() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Pago en proceso</h1>
        <p className="text-gray-500 text-sm mb-6">
          Tu pago está siendo procesado. En cuanto se confirme, recibirás un email con los detalles del turno.
        </p>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700 mb-6">
          Esto puede tardar hasta 2 días hábiles dependiendo del método de pago utilizado.
        </div>
        <Link href="/" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2.5 rounded-xl text-sm transition-colors">
          Entendido
        </Link>
      </div>
    </main>
  );
}
