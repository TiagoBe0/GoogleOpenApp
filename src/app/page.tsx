import type { Metadata, Viewport } from "next";
import ContactForm from "@/components/landing/ContactForm";

export const metadata: Metadata = {
  title: "Malbec Motion — Video publicitario con IA en Mendoza",
  description:
    "Agencia de video con IA en Mendoza. Spots y reels para bodegas, turismo y gastronomía, en español, portugués e inglés, listos en días.",
  openGraph: {
    title: "Malbec Motion — Video publicitario con IA en Mendoza",
    description: "Spots y reels para bodegas, turismo y gastronomía, en tres idiomas y en días.",
    url: "https://malbecmotion.com",
    siteName: "Malbec Motion",
    locale: "es_AR",
    type: "website",
  },
  appleWebApp: { title: "Malbec Motion" },
};

export const viewport: Viewport = { themeColor: "#110c0d" };

const NAV = [
  { href: "#servicios", label: "Servicios" },
  { href: "#proceso", label: "Cómo trabajamos" },
  { href: "#precios", label: "Precios" },
  { href: "#preguntas", label: "Preguntas" },
];

const AUDIENCES = [
  {
    title: "Bodegas",
    body: "Degustaciones, vendimia, lanzamientos de etiqueta. Video que lleva gente a tu bodega y vende tu vino afuera.",
  },
  {
    title: "Turismo y aventura",
    body: "Rafting, cabalgatas, trekking, hoteles. Mostrá la experiencia antes de que el turista llegue a Mendoza.",
  },
  {
    title: "Gastronomía",
    body: "Restaurantes y menús de pasos. Reels que abren el apetito y llenan reservas en temporada.",
  },
];

const STEPS = [
  { n: "01", title: "Brief", body: "Una llamada de 30 minutos. Entendemos tu negocio, tu público y qué querés lograr." },
  { n: "02", title: "Guion en 48 h", body: "Te mandamos guion y storyboard para aprobar antes de producir una sola toma." },
  {
    n: "03",
    title: "Producción",
    body: "Combinamos tu material real con escenas generadas por IA en nuestros propios equipos en Mendoza.",
  },
  {
    n: "04",
    title: "Entrega",
    body: "En todos los formatos y en los idiomas que necesites. Dos rondas de cambios incluidas.",
  },
];

const PLANS = [
  {
    name: "Pack Redes",
    price: "USD 400",
    period: "por mes",
    pitch: "Presencia constante en Instagram y TikTok.",
    items: ["8 reels por mes", "2 idiomas a elección", "Subtítulos y formatos vertical y cuadrado", "Calendario de publicación"],
    featured: false,
  },
  {
    name: "Spot",
    price: "USD 1.200",
    period: "por pieza",
    pitch: "El video que presenta tu marca.",
    items: [
      "Spot de 30 segundos",
      "Español, portugués e inglés",
      "Formatos 16:9, 9:16 y 1:1",
      "Guion, música y locución incluidos",
    ],
    featured: true,
  },
  {
    name: "Temporada",
    price: "USD 2.800",
    period: "por campaña",
    pitch: "Vendimia, invierno o temporada alta, completa.",
    items: ["1 spot + 12 reels", "Piezas para anuncios pagos", "3 idiomas", "Variantes para probar qué funciona"],
    featured: false,
  },
];

const FAQ = [
  {
    q: "¿Se nota que está hecho con IA?",
    a: "Trabajamos en modo híbrido: tu bodega, tu gente y tus productos son reales, filmados por vos o por nosotros. La IA suma paisajes, transiciones, animación de producto y versiones en otros idiomas. Lo que no pasa nuestro control de calidad, no se entrega.",
  },
  {
    q: "¿Puedo usar mis propias fotos y videos?",
    a: "Sí, y lo recomendamos. Con material tuyo el resultado es más auténtico. Si no tenés, coordinamos una jornada corta de filmación.",
  },
  {
    q: "¿Cuánto tarda?",
    a: "El guion llega en 48 horas. Un spot se entrega en 5 a 7 días hábiles desde que lo aprobás; los reels del Pack Redes, semana a semana.",
  },
  {
    q: "¿De quién son los derechos del video?",
    a: "Tuyos. Una vez pagado, podés usarlo en redes, anuncios, tu web y ferias sin límite de tiempo.",
  },
  {
    q: "¿Se puede hacer publicidad de vino?",
    a: "Sí, respetando la normativa argentina sobre publicidad de bebidas alcohólicas. Cuidamos que cada pieza la cumpla.",
  },
  {
    q: "¿Mi material pasa por servicios de terceros?",
    a: "No. Generamos en nuestras propias GPUs en Mendoza: tus imágenes y tus ideas no se suben a plataformas externas de IA.",
  },
];

const container = "mx-auto w-full max-w-6xl px-4 sm:px-8";
const eyebrow = "text-sm font-semibold uppercase tracking-[0.14em] text-mm-accent-text";
const h2 = "font-display text-4xl font-semibold leading-tight text-mm-text sm:text-5xl";

/** Tres cuadros verticales: la misma pieza en tres idiomas, que es la propuesta. */
function LanguageFrames() {
  const frames = [
    { lang: "ES", line: "Viví la vendimia", tc: "00:00:04:12" },
    { lang: "PT", line: "Viva a vindima", tc: "00:00:04:12" },
    { lang: "EN", line: "Live the harvest", tc: "00:00:04:12" },
  ];

  return (
    <div aria-hidden="true" className="grid grid-cols-3 gap-3 sm:gap-4">
      {frames.map((f, i) => (
        <div
          key={f.lang}
          className={`relative aspect-[9/16] overflow-hidden rounded-lg border border-mm-line bg-mm-surface ${i === 1 ? "translate-y-6" : ""}`}
        >
          {/* Paisaje abstracto: cielo, cordillera y viñedo en capas planas. */}
          <div className="absolute inset-0 bg-[#2a1b1f]" />
          <div className="absolute inset-x-0 top-[38%] h-[30%] bg-[#3b2a2e] [clip-path:polygon(0_100%,0_55%,18%_20%,32%_48%,50%_5%,66%_40%,80%_18%,100%_50%,100%_100%)]" />
          <div className="absolute inset-x-0 top-[55%] h-[20%] bg-[#4d3135] [clip-path:polygon(0_100%,0_60%,25%_30%,45%_55%,70%_20%,100%_55%,100%_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-[30%] bg-mm-accent/80" />
          <div className="absolute inset-x-0 bottom-0 h-[30%] bg-[repeating-linear-gradient(100deg,transparent_0_14px,rgba(0,0,0,0.25)_14px_17px)]" />

          <div className="absolute left-2 top-2 flex items-center gap-1.5 text-[10px] font-semibold text-mm-text/90 sm:left-3 sm:top-3 sm:text-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-mm-accent-text" />
            {f.lang}
          </div>
          <p className="absolute inset-x-2 bottom-[34%] font-display text-sm font-semibold leading-tight text-white sm:inset-x-3 sm:text-lg">
            {f.line}
          </p>
          <p className="absolute bottom-2 left-2 font-mono text-[9px] tabular-nums text-white/70 sm:left-3 sm:text-[10px]">
            {f.tc}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="theme-malbec min-h-screen bg-mm-bg text-mm-text">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-mm-accent focus:px-4 focus:py-3 focus:text-white"
      >
        Saltar al contenido
      </a>

      <header className="sticky top-0 z-40 border-b border-mm-line/60 bg-mm-bg/90 backdrop-blur">
        <nav className={`${container} flex min-h-16 items-center justify-between gap-4`}>
          <a href="#" className="flex min-h-11 items-center font-display text-xl font-semibold text-mm-text">
            Malbec<span className="text-mm-accent-text">·</span>Motion
          </a>
          <div className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="flex min-h-11 items-center rounded-md px-3 text-base text-mm-muted transition-colors hover:text-mm-text"
              >
                {n.label}
              </a>
            ))}
          </div>
          <a
            href="#contacto"
            className="flex min-h-11 items-center rounded-md bg-mm-accent px-4 text-base font-semibold text-white transition-colors hover:bg-mm-accent-hi"
          >
            Pedí tu propuesta
          </a>
        </nav>
      </header>

      <main id="contenido">
        {/* Hero */}
        <section className={`${container} grid items-center gap-12 py-16 sm:py-24 lg:grid-cols-[1.15fr_1fr]`}>
          <div>
            <p className={eyebrow}>Agencia de video con IA · Mendoza</p>
            <h1 className="mt-5 font-display text-5xl font-semibold leading-[1.05] text-mm-text sm:text-6xl lg:text-7xl">
              Publicidad en video, en tres idiomas y en días.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-mm-muted">
              Spots y reels para bodegas, turismo y gastronomía de Mendoza. Tu material real, potenciado con
              inteligencia artificial, para hablarle al turista argentino, al brasileño y al norteamericano.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#contacto"
                className="flex min-h-12 items-center rounded-md bg-mm-accent px-6 text-base font-semibold text-white transition-colors hover:bg-mm-accent-hi"
              >
                Pedí tu propuesta
              </a>
              <a
                href="#precios"
                className="flex min-h-12 items-center rounded-md border border-mm-line px-6 text-base font-semibold text-mm-text transition-colors hover:bg-mm-surface"
              >
                Ver precios
              </a>
            </div>
          </div>
          <LanguageFrames />
        </section>

        {/* Datos del mercado */}
        <section className="border-y border-mm-line bg-mm-surface">
          <div className={`${container} grid gap-8 py-12 sm:grid-cols-3`}>
            {[
              { k: "1,59 M", v: "visitantes recibieron las bodegas de Mendoza en 2024" },
              { k: "43 %", v: "de esos visitantes llegó desde el exterior" },
              { k: "45 %", v: "de los extranjeros vino de Brasil. Tu próximo cliente habla portugués." },
            ].map((s) => (
              <div key={s.k}>
                <p className="font-display text-5xl font-semibold tabular-nums text-mm-text">{s.k}</p>
                <p className="mt-2 text-base leading-7 text-mm-muted">{s.v}</p>
              </div>
            ))}
          </div>
          <p className={`${container} pb-6 text-xs text-mm-muted`}>
            Fuente: relevamiento de enoturismo de Mendoza 2024, citado por{" "}
            <a
              className="underline underline-offset-2 hover:text-mm-text"
              href="https://www.losandes.com.ar/economia/enoturismo-entre-bodegas-y-paisajes-sonados-las-cifras-de-una-industria-que-sigue-creciendo"
              target="_blank"
              rel="noopener noreferrer"
            >
              Los Andes
            </a>
            .
          </p>
        </section>

        {/* Para quién */}
        <section id="servicios" className={`${container} scroll-mt-20 py-20 sm:py-28`}>
          <p className={eyebrow}>Para quién</p>
          <h2 className={`${h2} mt-4 max-w-3xl`}>Hecho para los negocios que hacen a Mendoza.</h2>
          <div className="mt-12 grid gap-px overflow-hidden rounded-lg border border-mm-line bg-mm-line md:grid-cols-3">
            {AUDIENCES.map((a) => (
              <div key={a.title} className="bg-mm-bg p-8">
                <h3 className="font-display text-2xl font-semibold text-mm-text">{a.title}</h3>
                <p className="mt-3 text-base leading-7 text-mm-muted">{a.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Proceso */}
        <section id="proceso" className="scroll-mt-20 border-t border-mm-line bg-mm-surface py-20 sm:py-28">
          <div className={container}>
            <p className={eyebrow}>Cómo trabajamos</p>
            <h2 className={`${h2} mt-4 max-w-3xl`}>De la idea al video publicado, en una semana.</h2>
            <ol className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((s) => (
                <li key={s.n}>
                  <p className="font-mono text-sm tabular-nums text-mm-accent-text">{s.n}</p>
                  <h3 className="mt-3 text-xl font-semibold text-mm-text">{s.title}</h3>
                  <p className="mt-2 text-base leading-7 text-mm-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Precios */}
        <section id="precios" className={`${container} scroll-mt-20 py-20 sm:py-28`}>
          <p className={eyebrow}>Precios</p>
          <h2 className={`${h2} mt-4 max-w-3xl`}>Precios claros, sin &ldquo;pedí presupuesto&rdquo;.</h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-mm-muted">
            Precios de lanzamiento. Se pueden pagar en pesos al tipo de cambio del día.
          </p>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`flex flex-col rounded-lg border p-8 ${p.featured ? "border-mm-accent bg-mm-surface-2" : "border-mm-line bg-mm-surface"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold text-mm-text">{p.name}</h3>
                  {p.featured && (
                    <span className="rounded-full bg-mm-accent px-3 py-1 text-xs font-semibold text-white">Más pedido</span>
                  )}
                </div>
                <p className="mt-2 text-base text-mm-muted">{p.pitch}</p>
                <p className="mt-6">
                  <span className="font-display text-4xl font-semibold tabular-nums text-mm-text">{p.price}</span>{" "}
                  <span className="text-base text-mm-muted">{p.period}</span>
                </p>
                <ul className="mt-6 grid gap-3 text-base text-mm-text">
                  {p.items.map((it) => (
                    <li key={it} className="flex gap-3">
                      <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-mm-accent-text" />
                      {it}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contacto"
                  className={`mt-8 flex min-h-12 items-center justify-center rounded-md px-6 text-base font-semibold transition-colors ${
                    p.featured
                      ? "bg-mm-accent text-white hover:bg-mm-accent-hi"
                      : "border border-mm-line text-mm-text hover:bg-mm-surface-2"
                  }`}
                >
                  Elegir {p.name}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Preguntas */}
        <section id="preguntas" className="scroll-mt-20 border-t border-mm-line bg-mm-surface py-20 sm:py-28">
          <div className={`${container} grid gap-12 lg:grid-cols-[1fr_1.4fr]`}>
            <div>
              <p className={eyebrow}>Preguntas</p>
              <h2 className={`${h2} mt-4`}>Lo que nos preguntan antes de empezar.</h2>
            </div>
            <div className="divide-y divide-mm-line border-y border-mm-line">
              {FAQ.map((f) => (
                <details key={f.q} className="group">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold text-mm-text [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span aria-hidden="true" className="text-2xl font-normal text-mm-accent-text transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="pb-5 text-base leading-7 text-mm-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section id="contacto" className={`${container} scroll-mt-20 py-20 sm:py-28`}>
          <div className="grid gap-12 lg:grid-cols-[1fr_1.3fr]">
            <div>
              <p className={eyebrow}>Contacto</p>
              <h2 className={`${h2} mt-4`}>Contanos qué querés mostrar.</h2>
              <p className="mt-5 max-w-md text-lg leading-8 text-mm-muted">
                Te respondemos con una propuesta concreta: qué video, en qué idiomas, cuánto cuesta y cuándo lo tenés.
              </p>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>

      <footer className="border-t border-mm-line">
        <div className={`${container} flex flex-col gap-2 py-10 text-sm text-mm-muted sm:flex-row sm:items-center sm:justify-between`}>
          <p>
            <span className="font-display font-semibold text-mm-text">Malbec Motion</span> · Video publicitario con IA ·
            Mendoza, Argentina
          </p>
          <p>© {new Date().getFullYear()} Malbec Motion</p>
        </div>
      </footer>
    </div>
  );
}
