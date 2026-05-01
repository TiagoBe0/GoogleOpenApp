"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

type Role = "PATIENT" | "PSYCHOLOGIST";
type Tab = "login" | "register";

const OBRAS = ["OSDE", "Swiss Medical", "Medicus", "Galeno", "IOMA", "Sancor Salud", "Sin obra social", "Otra"];

function GoogleLogo() {
  return (
    <svg className="g-logo" viewBox="0 0 20 20" fill="none">
      <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.4a4.6 4.6 0 01-2 3.02v2.5h3.23c1.9-1.75 3-4.33 3-7.31Z" fill="#4285F4" />
      <path d="M10 20c2.7 0 4.96-.9 6.62-2.43l-3.23-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H1.08v2.58A10 10 0 0010 20Z" fill="#34A853" />
      <path d="M4.41 11.91A5.97 5.97 0 014.1 10c0-.66.11-1.3.31-1.91V5.51H1.08A10 10 0 000 10c0 1.61.38 3.13 1.08 4.49l3.33-2.58Z" fill="#FBBC05" />
      <path d="M10 3.96a5.4 5.4 0 013.82 1.5L16.68 2.6A9.6 9.6 0 0010 0a10 10 0 00-8.92 5.51l3.33 2.58C5.2 5.71 7.4 3.96 10 3.96Z" fill="#EA4335" />
    </svg>
  );
}

function pwStrength(pw: string) {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (/[A-Z]/.test(pw)) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;

  const map = [
    { label: "", color: "" },
    { label: "Débil", color: "#C0392B" },
    { label: "Regular", color: "#C07A20" },
    { label: "Buena", color: "#7FA98A" },
    { label: "Fuerte", color: "#2D9E6B" },
  ];

  return { score, ...map[score] };
}

function destinationForRole(role?: string | null) {
  if (role === "ADMIN") return "/dashboard/admin/users";
  if (role === "PSYCHOLOGIST") return "/dashboard";
  return "/patient";
}

function LoginForm({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const { update } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? undefined;
  const authError = searchParams.get("error");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(() => {
    if (authError === "OAuthAccountNotLinked") return "Este email ya existe. Volvé a intentar entrar con Google para vincularlo.";
    return authError ? "No se pudo iniciar sesión. Intentá nuevamente." : "";
  });

  async function handleGoogle() {
    await signOut({ redirect: false });
    await signIn("google", { callbackUrl: callbackUrl ?? "/dashboard" });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !pass) {
      setErr("Completá todos los campos.");
      return;
    }

    setLoading(true);
    setErr("");
    try {
      const result = await signIn("credentials", { email, password: pass, redirect: false });
      if (!result?.ok) {
        setErr("Email o contraseña incorrectos, o usuario dado de baja.");
        return;
      }

      const session = await update();
      router.push(callbackUrl ?? destinationForRole(session?.user?.role));
    } catch {
      setErr("Error de conexión. Intentá nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="slide-in">
      <div className="auth-h">Bienvenido de nuevo</div>
      <div className="auth-sub">Ingresá para gestionar tus turnos y sesiones.</div>

      <button className="google-btn" onClick={handleGoogle} type="button">
        <GoogleLogo />
        Continuar con Google
      </button>

      <div className="or-row">
        <div className="or-line" />
        <span className="or-text">o ingresá con email</span>
        <div className="or-line" />
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Email</label>
          <input className={`form-input ${err && !email ? "error" : ""}`} type="email" placeholder="tu@email.com" value={email} onChange={(e) => { setEmail(e.target.value); setErr(""); }} />
        </div>
        <div className="form-group">
          <label className="form-label form-label-between">
            Contraseña
            <span>¿Olvidaste tu contraseña?</span>
          </label>
          <div className="input-wrap">
            <input className={`form-input ${err && !pass ? "error" : ""}`} type={showPw ? "text" : "password"} placeholder="••••••••" value={pass} onChange={(e) => { setPass(e.target.value); setErr(""); }} />
            <span className="input-icon" onClick={() => setShowPw(!showPw)}>{showPw ? "🙈" : "👁"}</span>
          </div>
        </div>
        {err && <div className="form-error">⚠ {err}</div>}
        <button type="submit" className="submit-btn submit-login" disabled={loading}>{loading ? "Ingresando..." : "Ingresar"}</button>
      </form>

      <div className="terms-text terms-switch">
        ¿No tenés cuenta? <button type="button" onClick={onSwitch}>Registrate gratis</button>
      </div>
    </div>
  );
}

function RegisterForm({ onSwitch }: { onSwitch: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<Role>("PATIENT");
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dni: "",
    obra: "",
    bday: "",
    genero: "",
    pass: "",
    pass2: "",
    terms: false,
    matricula: "",
    especialidad: "",
    modalidad: "",
    precio: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPw, setShowPw] = useState(false);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const pw = pwStrength(form.pass);

  async function handleGoogleRegister() {
    await signOut({ redirect: false });
    await signIn("google", { callbackUrl: `/register/complete?role=${role}` });
  }

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: "" }));
  }

  function validateStep1() {
    const nextErrors: Record<string, string> = {};
    if (!form.firstName.trim()) nextErrors.firstName = "Requerido";
    if (!form.lastName.trim()) nextErrors.lastName = "Requerido";
    if (!form.email.match(/^[^@]+@[^@]+\.[^@]+$/)) nextErrors.email = "Email inválido";
    if (form.phone && !form.phone.match(/^[\d\s\+\-]{7,}$/)) nextErrors.phone = "Teléfono inválido";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateStep2() {
    const nextErrors: Record<string, string> = {};
    if (role === "PATIENT") {
      if (!form.dni.trim()) nextErrors.dni = "Requerido";
    } else {
      if (!form.matricula.trim()) nextErrors.matricula = "Requerido";
      if (!form.especialidad.trim()) nextErrors.especialidad = "Requerido";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function validateStep3() {
    const nextErrors: Record<string, string> = {};
    if (form.pass.length < 8) nextErrors.pass = "Mínimo 8 caracteres";
    if (form.pass !== form.pass2) nextErrors.pass2 = "Las contraseñas no coinciden";
    if (!form.terms) nextErrors.terms = "Debés aceptar los términos";
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function createAccount() {
    setLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
          password: form.pass,
          role,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setErrors({ submit: data.error || "No se pudo crear la cuenta" });
        return;
      }

      const result = await signIn("credentials", { email: form.email, password: form.pass, redirect: false });
      if (result?.ok) {
        setDone(true);
      } else {
        router.push("/login");
      }
    } catch {
      setErrors({ submit: "Error de conexión. Intentá nuevamente." });
    } finally {
      setLoading(false);
    }
  }

  function next() {
    if (step === 1 && validateStep1()) setStep(2);
    if (step === 2 && validateStep2()) setStep(3);
    if (step === 3 && validateStep3()) void createAccount();
  }

  if (done) {
    return (
      <div className="success-box slide-in">
        <div className="success-anim">🎉</div>
        <div className="success-h">¡Cuenta creada!</div>
        <div className="success-sub">
          Tu cuenta quedó registrada con <strong>{form.email}</strong>.<br />
          Ya podés empezar a usar Mi Terapia.
        </div>
        <button className="submit-btn" onClick={() => router.push(destinationForRole(role))} type="button">
          Ir a mi panel
        </button>
      </div>
    );
  }

  return (
    <div className="slide-in" key={step}>
      <div className="steps-mini">
        {[1, 2, 3].map((item) => (
          <div key={item} className={`step-dot ${item < step ? "done" : item === step ? "active" : ""}`} />
        ))}
        <span className="steps-label">Paso {step} de 3</span>
      </div>

      {step === 1 && (
        <>
          <div className="auth-h">Crear cuenta</div>
          <div className="auth-sub">¿Cómo vas a usar Mi Terapia?</div>

          <div className="role-grid role-grid-spaced">
            {[
              { id: "PATIENT" as Role, icon: "🧠", label: "Paciente", sub: "Buscá y agendá con tu psicólogo" },
              { id: "PSYCHOLOGIST" as Role, icon: "💼", label: "Psicólogo", sub: "Gestioná tu agenda y pacientes" },
            ].map((option) => (
              <div key={option.id} className={`role-card ${role === option.id ? "selected" : ""}`} onClick={() => setRole(option.id)}>
                <div className="role-icon">{option.icon}</div>
                <div className="role-label">{option.label}</div>
                <div className="role-sub">{option.sub}</div>
              </div>
            ))}
          </div>

          <div className="or-row or-tight">
            <div className="or-line" />
            <span className="or-text">o registrate con Google</span>
            <div className="or-line" />
          </div>
          <button className="google-btn google-register-btn" onClick={handleGoogleRegister} type="button">
            <GoogleLogo />
            Registrarse con Google
          </button>

          <div className="or-row or-tight">
            <div className="or-line" />
            <span className="or-text">completá tus datos</span>
            <div className="or-line" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Nombre</label>
              <input className={`form-input ${errors.firstName ? "error" : ""}`} placeholder="Ana" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
              {errors.firstName && <div className="form-error">⚠ {errors.firstName}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Apellido</label>
              <input className={`form-input ${errors.lastName ? "error" : ""}`} placeholder="García" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
              {errors.lastName && <div className="form-error">⚠ {errors.lastName}</div>}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className={`form-input ${errors.email ? "error" : ""}`} type="email" placeholder="tu@email.com" value={form.email} onChange={(e) => set("email", e.target.value)} />
            {errors.email && <div className="form-error">⚠ {errors.email}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Teléfono <span>(opcional)</span></label>
            <input className={`form-input ${errors.phone ? "error" : ""}`} placeholder="+54 11 0000-0000" value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            {errors.phone && <div className="form-error">⚠ {errors.phone}</div>}
          </div>
        </>
      )}

      {step === 2 && role === "PATIENT" && (
        <>
          <div className="auth-h">Datos personales</div>
          <div className="auth-sub">Usamos estos datos para coordinar con tu psicólogo.</div>
          <div className="form-group">
            <label className="form-label">DNI</label>
            <input className={`form-input ${errors.dni ? "error" : ""}`} placeholder="38.492.101" value={form.dni} onChange={(e) => set("dni", e.target.value)} />
            {errors.dni && <div className="form-error">⚠ {errors.dni}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de nacimiento</label>
            <input className="form-input" type="date" value={form.bday} onChange={(e) => set("bday", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Obra social</label>
            <select className="form-input selectable" value={form.obra} onChange={(e) => set("obra", e.target.value)}>
              <option value="">Seleccioná…</option>
              {OBRAS.map((obra) => <option key={obra} value={obra}>{obra}</option>)}
            </select>
            {form.obra && form.obra !== "Sin obra social" && <span className="input-hint-chip">✓ Cobertura activa</span>}
          </div>
          <div className="form-group">
            <label className="form-label">Género <span>(opcional)</span></label>
            <select className="form-input selectable" value={form.genero} onChange={(e) => set("genero", e.target.value)}>
              <option value="">Prefiero no indicar</option>
              <option>Femenino</option>
              <option>Masculino</option>
              <option>No binario</option>
              <option>Otro</option>
            </select>
          </div>
        </>
      )}

      {step === 2 && role === "PSYCHOLOGIST" && (
        <>
          <div className="auth-h">Datos profesionales</div>
          <div className="auth-sub">Verificaremos tu matrícula para habilitarte en la plataforma.</div>
          <div className="form-group">
            <label className="form-label">Número de matrícula</label>
            <input className={`form-input ${errors.matricula ? "error" : ""}`} placeholder="MN 00000" value={form.matricula} onChange={(e) => set("matricula", e.target.value)} />
            {errors.matricula && <div className="form-error">⚠ {errors.matricula}</div>}
            <div className="form-hint">Matrícula nacional o provincial habilitante.</div>
          </div>
          <div className="form-group">
            <label className="form-label">Especialidad principal</label>
            <select className={`form-input selectable ${errors.especialidad ? "error" : ""}`} value={form.especialidad} onChange={(e) => set("especialidad", e.target.value)}>
              <option value="">Seleccioná…</option>
              {["Psicología clínica", "TCC", "Psicoanálisis", "Psicología infantil", "Terapia de pareja", "Neuropsicología", "Otra"].map((item) => <option key={item}>{item}</option>)}
            </select>
            {errors.especialidad && <div className="form-error">⚠ {errors.especialidad}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Modalidad de atención</label>
            <div className="mode-row">
              {["Online", "Presencial", "Ambas"].map((mode) => (
                <div key={mode} onClick={() => set("modalidad", mode)} className={`mode-pill ${form.modalidad === mode ? "active" : ""}`}>{mode}</div>
              ))}
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Valor de la sesión (ARS)</label>
            <input className="form-input" placeholder="$4.500" value={form.precio} onChange={(e) => set("precio", e.target.value)} />
            <div className="form-hint">Podés modificarlo más adelante desde tu perfil.</div>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <div className="auth-h">Seguridad</div>
          <div className="auth-sub">Elegí una contraseña segura para proteger tu cuenta.</div>
          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div className="input-wrap">
              <input className={`form-input ${errors.pass ? "error" : ""}`} type={showPw ? "text" : "password"} placeholder="Mínimo 8 caracteres" value={form.pass} onChange={(e) => set("pass", e.target.value)} />
              <span className="input-icon" onClick={() => setShowPw(!showPw)}>{showPw ? "🙈" : "👁"}</span>
            </div>
            {form.pass && (
              <>
                <div className="strength-bar"><div className="strength-fill" style={{ width: `${pw.score * 25}%`, background: pw.color }} /></div>
                <div className="form-hint" style={{ color: pw.color }}>{pw.label}</div>
              </>
            )}
            {errors.pass && <div className="form-error">⚠ {errors.pass}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Confirmar contraseña</label>
            <div className="input-wrap">
              <input className={`form-input ${errors.pass2 ? "error" : ""}`} type={showPw ? "text" : "password"} placeholder="Repetí la contraseña" value={form.pass2} onChange={(e) => set("pass2", e.target.value)} />
              {form.pass2 && form.pass === form.pass2 && <span className="input-icon password-ok">✓</span>}
            </div>
            {errors.pass2 && <div className="form-error">⚠ {errors.pass2}</div>}
          </div>
          <div className="check-row">
            <input type="checkbox" id="terms" checked={form.terms} onChange={(e) => set("terms", e.target.checked)} />
            <label htmlFor="terms">Acepto los <a>Términos y condiciones</a> y la <a>Política de privacidad</a> de Mi Terapia.</label>
          </div>
          {errors.terms && <div className="form-error form-error-bottom">⚠ {errors.terms}</div>}
          {errors.submit && <div className="form-error form-error-bottom">⚠ {errors.submit}</div>}
        </>
      )}

      <div className="form-actions">
        {step > 1 && <button className="submit-btn back-btn" onClick={() => setStep(step - 1)} type="button">← Atrás</button>}
        <button className="submit-btn next-btn" onClick={next} disabled={loading} type="button">{loading ? "Creando cuenta..." : step < 3 ? "Continuar →" : "Crear cuenta"}</button>
      </div>

      <div className="terms-text terms-register">
        ¿Ya tenés cuenta? <button type="button" onClick={onSwitch}>Ingresá aquí</button>
      </div>
    </div>
  );
}

export default function AuthExperience({ initialTab = "login" }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const features = [
    { icon: "📅", label: "Agendá en segundos", sub: "Turnos online en tiempo real" },
    { icon: "💳", label: "Pago seguro integrado", sub: "Con tarjeta o Mercado Pago" },
    { icon: "📹", label: "Sesiones online", sub: "Videollamada directa desde la app" },
    { icon: "🔔", label: "Recordatorios automáticos", sub: "Por email y WhatsApp" },
  ];

  return (
    <main className="auth-template">
      <div className="shell">
        <div className="left">
          <div className="left-logo">
            <Image src="/logo_final.png" alt="Mi Terapia" width={38} height={38} className="brand-logo" priority />
            <span className="logo-text">Mi Terapia</span>
          </div>
          <div className="left-body">
            <div className="left-tag">
              <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="3.5" fill="#7FA98A" /></svg>
              Plataforma de salud mental
            </div>
            <div className="left-h">Tu bienestar,<br />a un turno<br />de distancia.</div>
            <div className="left-sub">Conectamos pacientes con psicólogos de confianza. Agendá, pagá y asistí a tus sesiones desde un solo lugar.</div>
            <div className="feature-list">
              {features.map((feature) => (
                <div className="feature" key={feature.label}>
                  <div className="feature-icon">{feature.icon}</div>
                  <div className="feature-text">
                    <strong>{feature.label}</strong>
                    <span>{feature.sub}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="left-footer">
            <span>© 2026 Mi Terapia</span>
            <a>Privacidad</a>
            <a>Términos</a>
            <a>Ayuda</a>
          </div>
        </div>

        <div className="right">
          <div className="auth-box">
            <div className="mobile-logo">
              <Image src="/logo_final.png" alt="Mi Terapia" width={38} height={38} className="brand-logo" priority />
              <span>Mi Terapia</span>
            </div>
            <div className="auth-tab-row">
              <button className={`auth-tab ${tab === "login" ? "active" : ""}`} onClick={() => setTab("login")} type="button">Ingresar</button>
              <button className={`auth-tab ${tab === "register" ? "active" : ""}`} onClick={() => setTab("register")} type="button">Registrarse</button>
            </div>
            {tab === "login" ? <LoginForm onSwitch={() => setTab("register")} /> : <RegisterForm onSwitch={() => setTab("login")} />}
          </div>
        </div>
      </div>
    </main>
  );
}
