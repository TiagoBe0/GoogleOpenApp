import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AppointmentStatusActions from "@/components/AppointmentStatusActions";
import PsychologistAppointmentScheduler from "@/components/PsychologistAppointmentScheduler";

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  pending_payment: { label: "Pendiente de pago", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed:       { label: "Confirmado",         cls: "bg-green-50 text-green-700 border-green-200" },
  cancelled:       { label: "Cancelado",           cls: "bg-red-50 text-red-700 border-red-200" },
  completed:       { label: "Completado",          cls: "bg-gray-100 text-gray-600 border-gray-200" },
  PENDING: { label: "Pendiente", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  CONFIRMED: { label: "Confirmado", cls: "bg-green-50 text-green-700 border-green-200" },
  CANCELLED: { label: "Cancelado", cls: "bg-red-50 text-red-700 border-red-200" },
  COMPLETED: { label: "Completado", cls: "bg-gray-100 text-gray-600 border-gray-200" },
};

const PENDING_STATUSES = new Set(["pending_payment", "pending", "PENDING"]);
const CONFIRMED_STATUSES = new Set(["confirmed", "CONFIRMED"]);
const COMPLETED_STATUSES = new Set(["completed", "COMPLETED"]);

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, cls: "bg-gray-100 text-gray-500 border-gray-200" };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-lg border ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export default async function TurnosPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const now = new Date();

  const [upcoming, past] = await Promise.all([
    prisma.appointment.findMany({
      where: { psychologistId: session.user.id, date: { gte: now } },
      include: { patient: { select: { name: true, email: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.appointment.findMany({
      where: { psychologistId: session.user.id, date: { lt: now } },
      include: { patient: { select: { name: true, email: true } } },
      orderBy: { date: "desc" },
      take: 20,
    }),
  ]);

  const pendingUpcoming = upcoming.filter((a) => PENDING_STATUSES.has(a.status));
  const confirmedUpcoming = upcoming.filter((a) => CONFIRMED_STATUSES.has(a.status));

  const fmt = (d: Date) =>
    d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const fmtTime = (d: Date) =>
    d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });

  const profile = await prisma.psychologistProfile.findUnique({
    where: { userId: session.user.id },
    select: { slug: true },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mis turnos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestión de citas reservadas por pacientes</p>
        </div>
        <div className="flex items-center gap-3">
          <PsychologistAppointmentScheduler psychologistId={session.user.id} />
          {profile?.slug && (
            <a
              href={`/p/${profile.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 font-medium hover:underline flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              Ver mi perfil público
            </a>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Confirmados", value: confirmedUpcoming.length, color: "text-indigo-600" },
          { label: "Pendientes", value: pendingUpcoming.length, color: "text-amber-600" },
          { label: "Completados", value: past.filter((a) => COMPLETED_STATUSES.has(a.status)).length, color: "text-green-600" },
          { label: "Total histórico", value: upcoming.length + past.length, color: "text-gray-700" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Solicitudes pendientes de confirmación */}
      {pendingUpcoming.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            <h2 className="font-semibold text-gray-900">
              Solicitudes pendientes de confirmación
              <span className="ml-2 text-xs font-normal bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {pendingUpcoming.length}
              </span>
            </h2>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
            <div className="divide-y divide-amber-100">
              {pendingUpcoming.map((apt) => (
                <div key={apt.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="flex-shrink-0 text-center bg-white border border-amber-200 rounded-xl px-4 py-2 min-w-[90px]">
                    <p className="text-xs text-amber-600 font-medium">{fmt(apt.date).split(",")[0]}</p>
                    <p className="text-lg font-bold text-amber-700">{fmtTime(apt.date)}</p>
                    <p className="text-xs text-amber-400">{apt.duration} min</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{apt.patient?.name ?? apt.patientName ?? "Paciente"}</p>
                      <StatusBadge status={apt.status} />
                    </div>
                    <p className="text-sm text-gray-500">{apt.patient?.email ?? apt.patientEmail ?? "Sin email registrado"}</p>
                    {apt.patientPhone && <p className="text-xs text-gray-400">{apt.patientPhone}</p>}
                    {apt.notes && <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">&ldquo;{apt.notes}&rdquo;</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-gray-800">{apt.currency ?? "ARS"} {(apt.amount ?? 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{fmt(apt.date)}</p>
                  </div>
                  <AppointmentStatusActions appointmentId={apt.id} status={apt.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Turnos confirmados próximos */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Turnos confirmados</h2>
        {confirmedUpcoming.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400">
            <svg className="w-10 h-10 mx-auto mb-3 text-gray-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">No tenés turnos confirmados próximos</p>
            {profile?.slug && (
              <p className="text-xs mt-1">
                Confirmá las solicitudes pendientes o compartí tu{" "}
                <a href={`/p/${profile.slug}`} target="_blank" rel="noopener noreferrer" className="text-indigo-500 hover:underline">
                  perfil público
                </a>{" "}
                para recibir más reservas.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {confirmedUpcoming.map((apt) => (
              <div key={apt.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-shrink-0 text-center bg-indigo-50 rounded-xl px-4 py-2 min-w-[90px]">
                  <p className="text-xs text-indigo-500 font-medium">{fmt(apt.date).split(",")[0]}</p>
                  <p className="text-lg font-bold text-indigo-700">{fmtTime(apt.date)}</p>
                  <p className="text-xs text-indigo-400">{apt.duration} min</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900">{apt.patient?.name ?? apt.patientName ?? "Paciente"}</p>
                    <StatusBadge status={apt.status} />
                  </div>
                  <p className="text-sm text-gray-500">{apt.patient?.email ?? apt.patientEmail ?? "Sin email registrado"}</p>
                  {apt.patientPhone && <p className="text-xs text-gray-400">{apt.patientPhone}</p>}
                  {apt.notes && <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">&ldquo;{apt.notes}&rdquo;</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-800">{apt.currency ?? "ARS"} {(apt.amount ?? 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmt(apt.date)}</p>
                </div>
                <AppointmentStatusActions appointmentId={apt.id} status={apt.status} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historial */}
      {past.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Historial</h2>
          <div className="space-y-2">
            {past.map((apt) => (
              <div key={apt.id} className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3 opacity-75">
                <div className="flex-shrink-0 text-center bg-gray-50 rounded-xl px-4 py-2 min-w-[90px]">
                  <p className="text-xs text-gray-400">{fmt(apt.date).split(",")[0]}</p>
                  <p className="text-lg font-bold text-gray-500">{fmtTime(apt.date)}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-700">{apt.patient?.name ?? apt.patientName ?? "Paciente"}</p>
                    <StatusBadge status={apt.status} />
                  </div>
                  <p className="text-sm text-gray-400">{apt.patient?.email ?? apt.patientEmail ?? "Sin email registrado"}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-600">{apt.currency ?? "ARS"} {(apt.amount ?? 0).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
