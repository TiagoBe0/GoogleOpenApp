"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";
import PsicoLinkAppointmentModal from "@/components/PsicoLinkAppointmentModal";
import ReviewsPanel from "@/components/ReviewsPanel";

interface Patient {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

interface Psychologist {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface Appointment {
  id: string;
  date: string;
  duration: number;
  notes: string | null;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
  psychologist: { name: string | null; email: string };
  amount: number | null;
  currency: string | null;
  paymentStatus: string | null;
  preferenceId: string | null;
}

interface DashboardAppointment extends Appointment {
  day: string;
  dayName: string;
  month: string;
  time: string;
  professional: string;
}

interface Props {
  patient: Patient;
}

type Section = "home" | "agenda" | "history" | "payments" | "profile";

const SECTION_TITLES: Record<Section, string> = {
  home: "Inicio",
  agenda: "Mis turnos",
  history: "Historial",
  payments: "Pagos",
  profile: "Mi perfil",
};

const STATUS_STYLES: Record<Appointment["status"], { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: "bg-[#FEF4E6] text-[#C07A20]" },
  CONFIRMED: { label: "Confirmado", className: "bg-[#D0E8D8] text-[#557C5F]" },
  CANCELLED: { label: "Cancelado", className: "bg-[#FDF0EE] text-[#C0392B]" },
};

function initials(name?: string | null, email?: string | null) {
  if (name) return name.split(" ").map((part) => part[0]).join("").toUpperCase().slice(0, 2);
  return email?.[0]?.toUpperCase() ?? "P";
}

function shortName(name?: string | null, email?: string | null) {
  if (!name) return email ?? "Paciente";
  const [first, second] = name.split(" ");
  return second ? `${first} ${second[0]}.` : first;
}

function formatAppointment(appointment: Appointment): DashboardAppointment {
  const date = new Date(appointment.date);
  const end = new Date(date.getTime() + appointment.duration * 60 * 1000);

  return {
    ...appointment,
    day: String(date.getDate()),
    dayName: date.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", ""),
    month: date.toLocaleDateString("es-ES", { month: "short" }).replace(".", ""),
    time: `${date.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`,
    professional: appointment.psychologist.name || appointment.psychologist.email,
  };
}

function HomeIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 6.5L8 2l6 4.5V13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V6.5Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /><path d="M6 14V9h4v5" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" /></svg>;
}

function CalendarIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1.5" y="2.5" width="13" height="12" rx="2" stroke="currentColor" strokeWidth="1.4" /><path d="M1.5 6.5h13M5 1v2M11 1v2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}

function HistoryIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" /><path d="M8 5v3l2 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}

function CardIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="1" y="3.5" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.4" /><path d="M1 7h14" stroke="currentColor" strokeWidth="1.4" /><circle cx="4.5" cy="10" r="1" fill="currentColor" /></svg>;
}

function UserIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="6" r="3" stroke="currentColor" strokeWidth="1.4" /><path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>;
}

function BellIcon() {
  return <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2a5 5 0 0 0-5 5v2.5L2 11h12l-1-1.5V7a5 5 0 0 0-5-5Z" stroke="currentColor" strokeWidth="1.4" /><path d="M6.5 11a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.4" /></svg>;
}

function PlusIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function VideoIcon() {
  return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="9" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M10 5.5l3-2v7l-3-2v-3Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>;
}

function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-7 w-7 grid-cols-2 gap-0.5">
        <span className={`rounded-[3px] ${dark ? "bg-white" : "bg-[#2D4270]"}`} />
        <span className="rounded-[3px] bg-[#8AACC8]" />
        <span className="rounded-[3px] bg-[#7FA98A]" />
        <span className="rounded-[3px] bg-[#D8EAF7]" />
      </div>
      <span className={`font-serif text-lg ${dark ? "text-white" : "text-[#2D4270]"}`}>PsicoLink</span>
    </div>
  );
}

function StatCard({ icon, value, label, detail, tone }: { icon: string; value: string; label: string; detail: string; tone: string }) {
  return (
    <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-5">
      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-[10px] ${tone}`}>{icon}</div>
      <div className="font-serif text-3xl text-[#2D4270]">{value}</div>
      <div className="mt-1 text-xs text-[#8A96A8]">{label}</div>
      <div className="mt-3 text-xs font-semibold text-[#7FA98A]">{detail}</div>
    </div>
  );
}

function AppointmentItem({ appointment, onCancel, compact = false }: { appointment: DashboardAppointment; onCancel: (appointment: DashboardAppointment) => void; compact?: boolean }) {
  const status = STATUS_STYLES[appointment.status];

  return (
    <div className="flex items-center gap-4 border-b border-[#E2E8F0] py-3 last:border-b-0 last:pb-0 first:pt-0">
      <div className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-[10px] bg-[#EEF2FA]">
        <div className="font-serif text-[22px] leading-none text-[#2D4270]">{appointment.day}</div>
        <div className="text-[9px] font-semibold uppercase tracking-wide text-[#8A96A8]">{appointment.dayName}</div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-[#1C2940]">{appointment.time}</div>
        <div className="mt-0.5 truncate text-xs text-[#8A96A8]">{appointment.professional}</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-[#D0E8D8] px-2.5 py-1 text-[10px] font-semibold text-[#557C5F]">Online</span>
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${status.className}`}>{status.label}</span>
        </div>
      </div>
      {!compact && appointment.status === "PENDING" && (
        <button onClick={() => onCancel(appointment)} className="rounded-lg bg-[#FDF0EE] px-3 py-2 text-xs font-semibold text-[#C0392B] hover:bg-[#FAD9D5]">
          Cancelar
        </button>
      )}
    </div>
  );
}

function EmptyState({ label, action }: { label: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
      <CalendarIcon />
      <p className="text-sm text-[#8A96A8]">{label}</p>
      {action}
    </div>
  );
}

export default function PatientDashboard({ patient }: Props) {
  const [mounted, setMounted] = useState(false);
  const [section, setSection] = useState<Section>("home");
  const [psychologist, setPsychologist] = useState<Psychologist | null | undefined>(undefined);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<DashboardAppointment | null>(null);
  const [cancelledMessage, setCancelledMessage] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState("");
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [unlinking, setUnlinking] = useState(false);
  const [success, setSuccess] = useState("");

  async function fetchAppointments() {
    setLoading(true);
    try {
      const res = await fetch("/api/appointments");
      const data = await res.json();
      if (Array.isArray(data)) setAppointments(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;
    const mountTimer = window.setTimeout(() => setMounted(true), 0);

    fetch("/api/patient/psychologist")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setPsychologist(data);
      });

    fetch("/api/appointments")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setAppointments(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      window.clearTimeout(mountTimer);
    };
  }, []);

  const dashboardAppointments = useMemo(() => appointments.map(formatAppointment), [appointments]);
  const now = mounted ? new Date() : new Date(0);
  const upcoming = dashboardAppointments
    .filter((appointment) => appointment.status !== "CANCELLED" && new Date(appointment.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const history = dashboardAppointments
    .filter((appointment) => appointment.status === "CANCELLED" || new Date(appointment.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const confirmedCount = appointments.filter((appointment) => appointment.status === "CONFIRMED").length;
  const pendingCount = appointments.filter((appointment) => appointment.status === "PENDING").length;

  async function handleLink(e: React.FormEvent) {
    e.preventDefault();
    setLinking(true);
    setLinkError("");
    try {
      const res = await fetch("/api/patient/psychologist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: linkEmail }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLinkError(data.error ?? "Error al vincular");
        return;
      }
      setPsychologist(data);
      setShowLinkForm(false);
      setLinkEmail("");
    } finally {
      setLinking(false);
    }
  }

  async function handleUnlink() {
    setUnlinking(true);
    try {
      await fetch("/api/patient/psychologist", { method: "DELETE" });
      setPsychologist(null);
      setAppointments([]);
    } finally {
      setUnlinking(false);
    }
  }

  async function confirmCancel() {
    if (!cancelTarget) return;

    await fetch(`/api/appointments/${cancelTarget.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    setCancelTarget(null);
    setCancelledMessage(true);
    fetchAppointments();
  }

  const navItems: Array<{ id: Section; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: "home", label: "Inicio", icon: <HomeIcon /> },
    { id: "agenda", label: "Mis turnos", icon: <CalendarIcon />, badge: upcoming.length || undefined },
    { id: "history", label: "Historial", icon: <HistoryIcon /> },
    { id: "payments", label: "Pagos", icon: <CardIcon />, badge: pendingCount || undefined },
    { id: "profile", label: "Mi perfil", icon: <UserIcon /> },
  ];

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#F4F6FA] p-6">
        <div className="h-20 rounded-2xl bg-white" />
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map((item) => <div key={item} className="h-32 rounded-2xl bg-white" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F6FA] text-[#1C2940]">
      <aside className="hidden w-60 shrink-0 flex-col overflow-hidden bg-[#2D4270] md:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <Logo dark />
        </div>
        <div className="px-3 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.7px] text-white/35">Menú</div>
        <nav className="flex-1 overflow-y-auto px-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`mb-0.5 flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left text-sm font-medium transition ${
                section === item.id ? "bg-white/15 text-white" : "text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.icon}
              {item.label}
              {item.badge ? <span className="ml-auto rounded-full bg-[#7FA98A] px-2 py-0.5 text-[10px] font-bold text-white">{item.badge}</span> : null}
            </button>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button onClick={() => setSection("profile")} className="flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left hover:bg-white/10">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D8EAF7] text-xs font-bold text-[#2D4270]">
              {initials(patient.name, patient.email)}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{shortName(patient.name, patient.email)}</div>
              <div className="text-[11px] text-white/45">Paciente</div>
            </div>
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-40 flex h-[60px] shrink-0 items-center justify-between border-b border-[#E2E8F0] bg-white px-4 md:px-8">
          <div className="md:hidden"><Logo /></div>
          <span className="hidden text-sm font-semibold text-[#2D4270] md:block">{SECTION_TITLES[section]}</span>
          <div className="flex items-center gap-2">
            <div className="relative flex">
              <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#8A96A8] hover:border-[#8AACC8] hover:text-[#2D4270]">
                <BellIcon />
              </button>
              {pendingCount > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full border-2 border-white bg-[#C0392B]" />}
            </div>
            <button
              onClick={() => setShowBooking(true)}
              disabled={!psychologist}
              className="inline-flex items-center gap-2 rounded-lg bg-[#2D4270] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1F3060] disabled:bg-[#E2E8F0] disabled:text-[#8A96A8]"
            >
              <PlusIcon /> Nuevo turno
            </button>
          </div>
        </header>

        <div className="flex gap-2 overflow-x-auto border-b border-[#E2E8F0] bg-white px-4 py-2 md:hidden">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${section === item.id ? "bg-[#2D4270] text-white" : "bg-[#F4F6FA] text-[#8A96A8]"}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <main className="flex-1 px-4 py-6 md:px-8 md:py-7">
          {section === "home" && (
            <>
              {upcoming[0] ? (
                <section className="relative mb-7 overflow-hidden rounded-[18px] bg-gradient-to-br from-[#2D4270] to-[#3A5494] px-6 py-7 text-white md:flex md:items-center md:gap-6">
                  <div className="relative z-10 mb-4 flex h-14 w-14 items-center justify-center rounded-[14px] bg-white/15 text-2xl md:mb-0">📅</div>
                  <div className="relative z-10 flex-1">
                    <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-white/55">Próxima sesión</div>
                    <h1 className="font-serif text-2xl">{upcoming[0].dayName} {upcoming[0].day} de {upcoming[0].month} · {upcoming[0].time}</h1>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-white/70">
                      <span>{upcoming[0].professional}</span>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#7FA98A]" />
                      <span>Online</span>
                      {upcoming[0].status === "PENDING" && <span className="font-semibold text-[#FFD580]">Confirmación pendiente</span>}
                    </div>
                  </div>
                  <div className="relative z-10 mt-5 flex gap-2 md:mt-0">
                    <button className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#2D4270]"><VideoIcon /> Unirse</button>
                    {upcoming[0].status === "PENDING" && <button onClick={() => setCancelTarget(upcoming[0])} className="rounded-lg border border-white/35 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10">Cancelar</button>}
                  </div>
                </section>
              ) : (
                <section className="mb-7 rounded-[18px] border border-dashed border-[#8AACC8] bg-white p-8 text-center">
                  <h1 className="font-serif text-2xl text-[#2D4270]">No tenés turnos próximos</h1>
                  <p className="mt-2 text-sm text-[#8A96A8]">Cuando agendes un turno, aparecerá acá como próxima sesión.</p>
                  <button onClick={() => setShowBooking(true)} disabled={!psychologist} className="mt-5 rounded-lg bg-[#2D4270] px-5 py-2.5 text-sm font-semibold text-white disabled:bg-[#E2E8F0] disabled:text-[#8A96A8]">Agendar turno</button>
                </section>
              )}

              <section className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard icon="📅" value={String(appointments.length)} label="Turnos totales" detail={`${appointments.length} registrados`} tone="bg-[#EEF2FA]" />
                <StatCard icon="✓" value={String(confirmedCount)} label="Turnos confirmados" detail="Sesiones aprobadas" tone="bg-[#D0E8D8]" />
                <StatCard icon="⏳" value={String(pendingCount)} label="Pendientes" detail="Esperando confirmación" tone="bg-[#FEF4E6]" />
                <StatCard icon="🗓" value={String(upcoming.length)} label="Turnos próximos" detail="Agenda activa" tone="bg-[#D8EAF7]" />
              </section>

              <section className="grid gap-5 xl:grid-cols-2">
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-serif text-xl text-[#2D4270]">Próximos turnos</h2>
                    <button onClick={() => setSection("agenda")} className="text-xs font-semibold text-[#8AACC8] hover:text-[#2D4270]">Ver todos →</button>
                  </div>
                  <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-5">
                    {loading ? <div className="h-24 rounded-xl bg-[#F4F6FA]" /> : upcoming.length ? upcoming.slice(0, 3).map((appointment) => <AppointmentItem key={appointment.id} appointment={appointment} onCancel={setCancelTarget} />) : <EmptyState label="Sin turnos próximos." />}
                  </div>
                </div>
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-serif text-xl text-[#2D4270]">Mi psicólogo</h2>
                    {psychologist && <button onClick={handleUnlink} disabled={unlinking} className="text-xs font-semibold text-[#C0392B]">{unlinking ? "..." : "Desvincular"}</button>}
                  </div>
                  <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-5">
                    {psychologist === undefined ? (
                      <div className="h-20 rounded-xl bg-[#F4F6FA]" />
                    ) : psychologist ? (
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-[#D8EAF7] text-sm font-semibold text-[#2D4270]">
                          {psychologist.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={psychologist.image} alt="" className="h-full w-full object-cover" />
                          ) : initials(psychologist.name, psychologist.email)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#1C2940]">{psychologist.name || "Sin nombre"}</p>
                          <p className="truncate text-xs text-[#8A96A8]">{psychologist.email}</p>
                          <p className="mt-1 text-xs font-semibold text-[#7FA98A]">● Disponible</p>
                        </div>
                        <button onClick={() => setSection("profile")} className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-semibold text-[#8A96A8]">Ver</button>
                      </div>
                    ) : (
                      <EmptyState
                        label="No tenés un psicólogo vinculado todavía."
                        action={<button onClick={() => setShowLinkForm(true)} className="rounded-lg bg-[#2D4270] px-4 py-2 text-sm font-semibold text-white">Vincular psicólogo</button>}
                      />
                    )}
                  </div>
                </div>
              </section>
            </>
          )}

          {section === "agenda" && (
            <>
              <div className="mb-5 flex items-center justify-between">
                <h1 className="font-serif text-xl text-[#2D4270]">Mis turnos</h1>
                <button onClick={() => setShowBooking(true)} disabled={!psychologist} className="inline-flex items-center gap-2 rounded-lg bg-[#2D4270] px-4 py-2.5 text-sm font-semibold text-white disabled:bg-[#E2E8F0] disabled:text-[#8A96A8]"><PlusIcon /> Agendar nuevo</button>
              </div>
              {success && <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{success}</div>}
              <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-5">
                {loading ? <div className="h-24 rounded-xl bg-[#F4F6FA]" /> : upcoming.length ? upcoming.map((appointment) => <AppointmentItem key={appointment.id} appointment={appointment} onCancel={setCancelTarget} />) : <EmptyState label="No tenés turnos próximos." />}
              </div>
            </>
          )}

          {section === "history" && (
            <>
              <div className="mb-5 flex items-center justify-between">
                <h1 className="font-serif text-xl text-[#2D4270]">Historial de sesiones</h1>
              </div>
              <div className="overflow-hidden rounded-[14px] border border-[#E2E8F0] bg-white">
                {history.length ? (
                  <div className="divide-y divide-[#E2E8F0]">
                    {history.map((appointment) => <AppointmentItem key={appointment.id} appointment={appointment} onCancel={setCancelTarget} compact />)}
                  </div>
                ) : <EmptyState label="Todavía no hay historial." />}
              </div>
            </>
          )}

          {section === "payments" && (() => {
            const paid = appointments.filter(a => a.paymentStatus === "approved");
            const pending = appointments.filter(a => a.paymentStatus === "pending" || (a.amount && !a.paymentStatus));
            const failed = appointments.filter(a => a.paymentStatus === "rejected" || a.paymentStatus === "cancelled");
            const totalPaid = paid.reduce((sum, a) => sum + (a.amount ?? 0), 0);
            const totalPending = pending.reduce((sum, a) => sum + (a.amount ?? 0), 0);
            const currency = appointments.find(a => a.currency)?.currency ?? "ARS";
            const withPayment = appointments.filter(a => a.amount);

            return (
              <>
                <div className="mb-5 flex items-center justify-between">
                  <h1 className="font-serif text-xl text-[#2D4270]">Pagos</h1>
                </div>
                <section className="mb-6 grid gap-4 md:grid-cols-3">
                  <StatCard icon="✓" value={`${currency} ${totalPaid.toLocaleString("es-AR")}`} label="Total pagado" detail={`${paid.length} pago${paid.length !== 1 ? "s" : ""} aprobado${paid.length !== 1 ? "s" : ""}`} tone="bg-[#D0E8D8]" />
                  <StatCard icon="⏳" value={`${currency} ${totalPending.toLocaleString("es-AR")}`} label="Pendiente" detail={`${pending.length} en proceso`} tone="bg-[#FEF4E6]" />
                  <StatCard icon="✕" value={String(failed.length)} label="Fallidos" detail={`${failed.length} cobro${failed.length !== 1 ? "s" : ""} fallido${failed.length !== 1 ? "s" : ""}`} tone="bg-[#FDF0EE]" />
                </section>
                <div className="rounded-[14px] border border-[#E2E8F0] bg-white divide-y divide-[#E2E8F0]">
                  {withPayment.length === 0 ? (
                    <EmptyState label="No hay pagos registrados todavía." />
                  ) : withPayment.map((a) => {
                    const d = new Date(a.date);
                    const psLabel = a.psychologist.name || a.psychologist.email;
                    const psMap: Record<string, { label: string; className: string }> = {
                      approved: { label: "Pagado", className: "bg-[#D0E8D8] text-[#557C5F]" },
                      pending: { label: "Pendiente", className: "bg-[#FEF4E6] text-[#C07A20]" },
                      rejected: { label: "Rechazado", className: "bg-[#FDF0EE] text-[#C0392B]" },
                      cancelled: { label: "Cancelado", className: "bg-[#FDF0EE] text-[#C0392B]" },
                    };
                    const ps = a.paymentStatus ? (psMap[a.paymentStatus] ?? { label: a.paymentStatus, className: "bg-gray-100 text-gray-600" }) : { label: "Sin pagar", className: "bg-gray-100 text-gray-500" };
                    return (
                      <div key={a.id} className="flex items-center gap-4 px-5 py-4">
                        <div className="flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-[10px] bg-[#EEF2FA]">
                          <div className="font-serif text-[22px] leading-none text-[#2D4270]">{d.getDate()}</div>
                          <div className="text-[9px] font-semibold uppercase tracking-wide text-[#8A96A8]">{d.toLocaleDateString("es-ES", { month: "short" }).replace(".", "")}</div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-semibold text-[#1C2940]">{psLabel}</div>
                          <div className="mt-0.5 text-xs text-[#8A96A8]">{d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "long" })}</div>
                          <span className={`mt-1.5 inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold ${ps.className}`}>{ps.label}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-[#2D4270] text-sm">{a.currency} {a.amount?.toLocaleString("es-AR")}</div>
                          {a.preferenceId && !a.paymentStatus && (
                            <a href={`https://www.mercadopago.com.ar/checkout/v1/redirect?preference-id=${a.preferenceId}`} target="_blank" rel="noopener noreferrer" className="mt-1 block text-[10px] font-semibold text-[#8AACC8] hover:text-[#2D4270]">
                              Pagar →
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            );
          })()}

          {section === "profile" && (
            <>
              <div className="mb-5 flex items-center justify-between">
                <h1 className="font-serif text-xl text-[#2D4270]">Mi perfil</h1>
              </div>
              <div className="grid gap-5 xl:grid-cols-2">
                <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-6">
                  <div className="mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-full bg-gradient-to-br from-[#D8EAF7] to-[#D0E8D8] font-serif text-3xl text-[#2D4270]">
                    {initials(patient.name, patient.email)}
                  </div>
                  <div className="font-serif text-xl text-[#2D4270]">{patient.name || "Paciente"}</div>
                  <div className="mb-5 text-xs text-[#8A96A8]">{patient.email}</div>
                  <div className="h-px bg-[#E2E8F0]" />
                  <div className="mt-5 space-y-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8A96A8]">Email</p>
                      <p className="text-sm text-[#1C2940]">{patient.email}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-[#8A96A8]">Rol</p>
                      <p className="text-sm text-[#1C2940]">Paciente</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-5">
                    <h2 className="mb-3 font-serif text-lg text-[#2D4270]">Mi psicólogo</h2>
                    {psychologist ? (
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#D8EAF7] text-sm font-semibold text-[#2D4270]">{initials(psychologist.name, psychologist.email)}</div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-[#1C2940]">{psychologist.name || "Sin nombre"}</p>
                          <p className="truncate text-xs text-[#8A96A8]">{psychologist.email}</p>
                        </div>
                        <button onClick={handleUnlink} disabled={unlinking} className="rounded-lg border border-[#E2E8F0] px-3 py-2 text-xs font-semibold text-[#C0392B]">{unlinking ? "..." : "Desvincular"}</button>
                      </div>
                    ) : (
                      <form onSubmit={handleLink} className="space-y-3">
                        <input value={linkEmail} onChange={(e) => { setLinkEmail(e.target.value); setLinkError(""); }} type="email" required placeholder="email del psicólogo" className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#8AACC8]" />
                        {linkError && <p className="text-sm text-[#C0392B]">{linkError}</p>}
                        <button disabled={linking} className="rounded-lg bg-[#2D4270] px-4 py-2 text-sm font-semibold text-white">{linking ? "Buscando..." : "Vincular"}</button>
                      </form>
                    )}
                  </div>
                  <ReviewsPanel canReview={!!psychologist} title="Calificaciones" />
                  <div className="rounded-[14px] border border-[#E2E8F0] bg-white p-5">
                    <h2 className="mb-3 font-serif text-lg text-[#2D4270]">Seguridad</h2>
                    <button onClick={() => signOut({ callbackUrl: "/login" })} className="rounded-lg bg-[#FDF0EE] px-4 py-2 text-sm font-semibold text-[#C0392B]">Cerrar sesión</button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      {showLinkForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C2940]/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[18px] border border-[#E2E8F0] bg-white p-6 shadow-2xl">
            <h2 className="font-serif text-xl text-[#2D4270]">Vincular psicólogo</h2>
            <p className="mt-1 text-sm text-[#8A96A8]">Ingresá el email del profesional registrado.</p>
            <form onSubmit={handleLink} className="mt-5 space-y-3">
              <input value={linkEmail} onChange={(e) => { setLinkEmail(e.target.value); setLinkError(""); }} type="email" required placeholder="psicologo@email.com" className="w-full rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#8AACC8]" />
              {linkError && <p className="text-sm text-[#C0392B]">{linkError}</p>}
              <div className="flex gap-2">
                <button type="button" onClick={() => setShowLinkForm(false)} className="flex-1 rounded-lg border border-[#E2E8F0] px-4 py-2 text-sm font-semibold text-[#8A96A8]">Cancelar</button>
                <button disabled={linking} className="flex-1 rounded-lg bg-[#2D4270] px-4 py-2 text-sm font-semibold text-white">{linking ? "Buscando..." : "Vincular"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C2940]/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[18px] border border-[#E2E8F0] bg-white p-7 shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF4E6] text-xl">⚠</div>
            <h2 className="text-center font-serif text-xl text-[#2D4270]">Cancelar turno</h2>
            <p className="mt-2 text-center text-sm leading-6 text-[#8A96A8]">
              ¿Querés cancelar la sesión del <strong>{cancelTarget.dayName} {cancelTarget.day} de {cancelTarget.month}</strong> a las <strong>{cancelTarget.time.split(" ")[0]}</strong>?
            </p>
            <div className="mt-5 flex gap-2">
              <button onClick={() => setCancelTarget(null)} className="flex-1 rounded-lg border border-[#E2E8F0] px-4 py-2.5 text-sm font-semibold text-[#8A96A8]">Mantener turno</button>
              <button onClick={confirmCancel} className="flex-1 rounded-lg bg-[#FDF0EE] px-4 py-2.5 text-sm font-semibold text-[#C0392B]">Sí, cancelar</button>
            </div>
          </div>
        </div>
      )}

      {cancelledMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C2940]/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[18px] border border-[#E2E8F0] bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#D0E8D8] text-xl">✓</div>
            <h2 className="font-serif text-xl text-[#2D4270]">Turno cancelado</h2>
            <p className="mt-2 text-sm text-[#8A96A8]">Tu turno fue cancelado correctamente.</p>
            <button onClick={() => setCancelledMessage(false)} className="mt-5 w-full rounded-lg bg-[#2D4270] px-4 py-2.5 text-sm font-semibold text-white">Entendido</button>
          </div>
        </div>
      )}

      {showBooking && psychologist && (
        <PsicoLinkAppointmentModal
          psychologist={psychologist}
          onClose={() => setShowBooking(false)}
          onCreated={() => {
            setSuccess("Turno solicitado. Tu psicólogo lo confirmará pronto.");
            setSection("agenda");
            fetchAppointments();
          }}
        />
      )}
    </div>
  );
}
