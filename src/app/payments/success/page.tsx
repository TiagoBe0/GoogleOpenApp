import Link from "next/link";

export default async function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ appointment?: string }>;
}) {
  const { appointment } = await searchParams;

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="bg-surface rounded-lg border border-line p-10 max-w-sm w-full shadow-sm">
        <div className="w-16 h-16 bg-primary-soft rounded-full flex items-center justify-center mb-5">
          <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-3xl font-semibold text-ink mb-2">
          Pago confirmado
        </h1>
        <p className="text-muted text-sm mb-6">
          Tu consulta fue reservada y el pago fue procesado correctamente. El psicólogo recibirá la confirmación.
        </p>
        {appointment && (
          <p className="text-xs text-muted mb-6">Referencia: {appointment}</p>
        )}
        <div className="space-y-2">
          <Link
            href="/patient"
            className="flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-hi"
          >
            Ver mis turnos
          </Link>
          <Link
            href="/"
            className="flex min-h-11 w-full items-center justify-center rounded-md text-primary font-semibold text-sm hover:bg-surface-2 transition-colors"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
