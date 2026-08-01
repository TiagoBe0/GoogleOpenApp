"use client";

import { useEffect, useState } from "react";
import { WEEKDAY_LABELS, WEEKDAY_ORDER, type WeeklyRule } from "@/lib/availability";
import { labelToMinutes, minutesToLabel } from "@/lib/slots";

/** Franja en edición. Se guarda como "HH:MM" porque es lo que pide <input type="time">. */
interface EditableWindow {
  start: string;
  end: string;
}

type Week = Record<number, EditableWindow[]>;

const NEW_WINDOW: EditableWindow = { start: "09:00", end: "18:00" };

const inputCls =
  "min-h-11 rounded-md border border-line-strong bg-surface px-3 text-base text-ink tabular-nums outline-none transition focus:border-primary focus:ring-2 focus:ring-primary-soft";

function toWeek(rules: WeeklyRule[]): Week {
  const week: Week = {};
  for (const day of WEEKDAY_ORDER) week[day] = [];
  for (const rule of rules) {
    week[rule.weekday].push({ start: minutesToLabel(rule.start), end: minutesToLabel(rule.end) });
  }
  return week;
}

function toRules(week: Week): WeeklyRule[] {
  return WEEKDAY_ORDER.flatMap((weekday) =>
    week[weekday].map((w) => ({
      weekday,
      start: labelToMinutes(w.start),
      end: labelToMinutes(w.end),
    }))
  );
}

/** Primer problema que impediría guardar, en las palabras del profesional. */
function firstProblem(week: Week): string | null {
  for (const weekday of WEEKDAY_ORDER) {
    const windows = week[weekday];
    for (const w of windows) {
      if (!w.start || !w.end) return `${WEEKDAY_LABELS[weekday]}: falta completar un horario.`;
      if (labelToMinutes(w.end) <= labelToMinutes(w.start)) {
        return `${WEEKDAY_LABELS[weekday]}: el horario de fin tiene que ser posterior al de inicio.`;
      }
    }
  }
  return null;
}

export default function AvailabilityForm() {
  const [week, setWeek] = useState<Week>(() => toWeek([]));
  const [loading, setLoading] = useState(true);
  const [usingDefaults, setUsingDefaults] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/availability")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data?.rules) return;
        setWeek(toWeek(data.rules));
        setUsingDefaults(!!data.usingDefaults);
      })
      .catch(() => setError("No se pudo cargar tu agenda."))
      .finally(() => setLoading(false));
  }, []);

  function update(next: Week) {
    setWeek(next);
    setSaved(false);
    setError("");
  }

  function toggleDay(weekday: number) {
    update({ ...week, [weekday]: week[weekday].length ? [] : [{ ...NEW_WINDOW }] });
  }

  function addWindow(weekday: number) {
    update({ ...week, [weekday]: [...week[weekday], { ...NEW_WINDOW }] });
  }

  function removeWindow(weekday: number, index: number) {
    update({ ...week, [weekday]: week[weekday].filter((_, i) => i !== index) });
  }

  function setWindow(weekday: number, index: number, field: keyof EditableWindow, value: string) {
    update({
      ...week,
      [weekday]: week[weekday].map((w, i) => (i === index ? { ...w, [field]: value } : w)),
    });
  }

  /** Cargar el mismo horario siete veces a mano es el trabajo que nadie hace. */
  function copyToOtherOpenDays(weekday: number) {
    const source = week[weekday];
    const next = { ...week };
    for (const day of WEEKDAY_ORDER) {
      if (day !== weekday && next[day].length > 0) next[day] = source.map((w) => ({ ...w }));
    }
    update(next);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const problem = firstProblem(week);
    if (problem) {
      setError(problem);
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: toRules(week) }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo guardar la agenda.");
        return;
      }

      setWeek(toWeek(data.rules));
      setUsingDefaults(false);
      setSaved(true);
    } catch {
      setError("Error de conexión.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-surface-2" />
        ))}
      </div>
    );
  }

  const openDays = WEEKDAY_ORDER.filter((d) => week[d].length > 0).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {usingDefaults && (
        <div className="rounded-lg border border-line bg-pending-soft px-5 py-4">
          <p className="text-sm font-semibold text-pending">Estás usando el horario por defecto</p>
          <p className="mt-1 text-sm text-ink">
            Lunes a viernes de 08:00 a 20:00. Ajustalo a tu agenda real y guardá: los pacientes solo
            van a poder reservar dentro de estas franjas.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {WEEKDAY_ORDER.map((weekday) => {
          const windows = week[weekday];
          const open = windows.length > 0;

          return (
            <div key={weekday} className="rounded-lg border border-line bg-surface p-5">
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => toggleDay(weekday)}
                  aria-pressed={open}
                  className="flex min-h-11 items-center gap-3 text-left"
                >
                  <span
                    className={`relative h-6 w-11 flex-shrink-0 rounded-full transition-colors ${open ? "bg-primary" : "bg-line-strong"}`}
                  >
                    <span
                      className={`absolute top-1 h-4 w-4 rounded-full bg-surface shadow transition-[left] ${open ? "left-6" : "left-1"}`}
                    />
                  </span>
                  <span className="text-base font-semibold text-ink">{WEEKDAY_LABELS[weekday]}</span>
                </button>

                {open ? (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => copyToOtherOpenDays(weekday)}
                      className="min-h-11 rounded-md px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
                    >
                      Copiar a los demás
                    </button>
                    <button
                      type="button"
                      onClick={() => addWindow(weekday)}
                      className="min-h-11 rounded-md px-3 text-sm font-semibold text-primary transition-colors hover:bg-primary-soft"
                    >
                      Agregar franja
                    </button>
                  </div>
                ) : (
                  <span className="text-sm text-muted">No atendés</span>
                )}
              </div>

              {open && (
                <div className="mt-4 space-y-3">
                  {windows.map((w, index) => (
                    <div key={index} className="flex flex-wrap items-end gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-muted">Desde</span>
                        <input
                          type="time"
                          step={900}
                          value={w.start}
                          onChange={(e) => setWindow(weekday, index, "start", e.target.value)}
                          className={inputCls}
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-muted">Hasta</span>
                        <input
                          type="time"
                          step={900}
                          value={w.end}
                          onChange={(e) => setWindow(weekday, index, "end", e.target.value)}
                          className={inputCls}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => removeWindow(weekday, index)}
                        aria-label={`Quitar la franja de ${WEEKDAY_LABELS[weekday]}`}
                        className="min-h-11 rounded-md px-3 text-sm font-semibold text-danger transition-colors hover:bg-danger-soft"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                  <p className="text-xs text-muted">
                    Podés cargar más de una franja por día, por ejemplo mañana y tarde.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <div className="rounded-md border border-danger bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          {error}
        </div>
      )}
      {saved && (
        <div className="rounded-md border border-primary bg-primary-soft px-4 py-3 text-sm font-medium text-primary">
          Agenda guardada. Tus pacientes ya ven estos horarios.
        </div>
      )}
      {openDays === 0 && !error && (
        <p className="text-sm text-muted">
          Con todos los días cerrados nadie va a poder reservar un turno con vos.
        </p>
      )}

      <button
        type="submit"
        disabled={saving}
        className="min-h-11 w-full rounded-md bg-primary text-base font-semibold text-white transition-colors hover:bg-primary-hi disabled:bg-surface-2 disabled:text-muted"
      >
        {saving ? "Guardando..." : "Guardar agenda"}
      </button>
    </form>
  );
}
