import Link from "next/link";

export default async function PaymentPendingPage({
  searchParams,
}: {
  searchParams: Promise<{ appointment?: string }>;
}) {
  const { appointment } = await searchParams;

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-10 max-w-sm w-full text-center shadow-sm">
        <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1
          className="text-2xl font-bold text-[#2D4270] mb-2"
          style={{ fontFamily: "DM Serif Display, Georgia, serif" }}
        >
          Pago en proceso
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          Tu pago está siendo procesado. El turno queda como solicitud pendiente hasta que el psicólogo lo confirme.
        </p>
        {appointment && (
          <p className="text-xs text-gray-400 mb-6">Referencia: {appointment}</p>
        )}
        <div className="space-y-2">
          <Link
            href="/patient"
            className="block w-full py-3 bg-[#2D4270] hover:bg-[#2D4270]/90 text-white font-semibold text-sm rounded-xl transition-colors"
          >
            Ver mis turnos
          </Link>
          <Link
            href="/"
            className="block w-full py-3 text-[#2D4270] font-medium text-sm rounded-xl hover:bg-gray-50 transition-colors"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
