import fs from "node:fs";
import path from "node:path";
import type { Metadata, Viewport } from "next";
import { Inter_Tight } from "next/font/google";
import ContactForm from "@/components/landing/ContactForm";
import InViewVideo from "@/components/landing/InViewVideo";
import Logo from "@/components/landing/Logo";
import MotionRoot from "@/components/landing/MotionRoot";
import { WHATSAPP_DISPLAY, whatsappLink } from "@/lib/contact";

// Grotesca apretada para los títulos enormes en mayúsculas. Solo la carga esta
// página: PsicoLink sigue con Geist y Fraunces.
const grotesk = Inter_Tight({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-mm" });

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
  // La landing tiene su propia marca: no hereda el ícono de PsicoLink del layout.
  icons: {
    icon: [
      { url: "/brand/icon.svg", type: "image/svg+xml" },
      { url: "/brand/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/brand/icon-180.png",
  },
};

export const viewport: Viewport = { themeColor: "#000000" };

/**
 * Video de fondo de la portada. Se revisa al compilar: soltar el archivo en
 * public/reel/ y volver a hacer el build alcanza para que aparezca.
 */
const HERO_VIDEO = "/reel/hero.mp4";
const HERO_POSTER = "/reel/hero.jpg";
const publicFile = (p: string) => fs.existsSync(path.join(process.cwd(), "public", p));

const NAV = [
  { href: "#somos", label: "Somos" },
  { href: "#portfolio", label: "Portfolio" },
  { href: "#servicios", label: "Servicios" },
  { href: "#precios", label: "Precios" },
  { href: "#contacto", label: "Contacto" },
];

const WHAT = ["Reels", "Spots", "Campañas", "Idiomas"];

const SECTORS = [
  { name: "Bodegas", tag: "Vendimia · Degustaciones", bg: "bg-[#8c1c3a]", fg: "text-white" },
  { name: "Turismo aventura", tag: "Rafting · Trekking", bg: "bg-[#1f4d3a]", fg: "text-white" },
  { name: "Gastronomía", tag: "Restaurantes · Menús", bg: "bg-[#e3a72f]", fg: "text-black" },
  { name: "Hoteles", tag: "Posadas · Lodges", bg: "bg-[#0b0b0b]", fg: "text-white" },
  { name: "Olivícolas", tag: "Aceites · Productos", bg: "bg-[#9aa63a]", fg: "text-black" },
  { name: "Eventos", tag: "Ferias · Lanzamientos", bg: "bg-[#c4512b]", fg: "text-white" },
];

const SERVICES = ["Reels", "Spots", "Campañas", "Traducción"];

/** Piezas del portfolio, todas generadas con LTX en nuestros equipos. Archivos en public/reel/. */
const PORTFOLIO = [
  { file: "perfume_amber", title: "Ámbar", kind: "Producto" },
  { file: "synthwave_coche", title: "Neón", kind: "Automotor" },
  { file: "cabana_niebla", title: "Cabaña en la niebla", kind: "Turismo" },
  { file: "retrato_neonoir", title: "Neo-noir", kind: "Retrato" },
  { file: "hombre_playa", title: "Costa", kind: "Lifestyle" },
  { file: "cabana_simetrica", title: "Refugio", kind: "Hospedaje" },
];
/**
 * Composición de la galería flotante en escritorio: cada pieza toma el lugar de
 * su índice. `speed` es el parallax (negativo sube al bajar), `depth` cuánto se
 * inclina con el mouse, `dur`/`rot` el ritmo y el giro con que flota. En el
 * celular queda en una columna y conserva la flotación.
 */
const FLOAT_LAYOUT = [
  { cls: "lg:col-span-7", aspect: "aspect-video", speed: -0.05, depth: 0.6, dur: 7, rot: 0.6 },
  { cls: "lg:col-span-5 lg:mt-36", aspect: "aspect-[4/5]", speed: 0.1, depth: 1.2, dur: 8.5, rot: -0.9 },
  { cls: "lg:col-span-4 lg:-mt-52", aspect: "aspect-square", speed: 0.14, depth: 1.4, dur: 6.2, rot: 1.1 },
  { cls: "lg:col-span-5 lg:mt-16", aspect: "aspect-video", speed: -0.03, depth: 0.8, dur: 9, rot: -0.5 },
  { cls: "lg:col-span-3 lg:mt-48", aspect: "aspect-[3/4]", speed: 0.12, depth: 1.3, dur: 7.6, rot: 0.8 },
  { cls: "lg:col-span-6 lg:col-start-4 lg:-mt-6", aspect: "aspect-video", speed: -0.07, depth: 0.9, dur: 8, rot: -0.7 },
];
const REEL = "/reel/reel.mp4";
const REEL_POSTER = "/reel/reel.jpg";

const STEPS = [
  { n: "01", title: "Brief", body: "Una llamada de 30 minutos para entender tu negocio y tu público." },
  { n: "02", title: "Guion en 48 h", body: "Guion y storyboard para aprobar antes de producir una sola toma." },
  { n: "03", title: "Producción", body: "Tu material real más escenas generadas con IA en nuestros equipos." },
  { n: "04", title: "Entrega", body: "Todos los formatos y los idiomas que necesites. Dos rondas de cambios." },
];

const PLANS = [
  {
    name: "Pack Redes",
    price: "USD 400",
    period: "por mes",
    items: ["8 reels por mes", "2 idiomas a elección", "Formatos vertical y cuadrado", "Calendario de publicación"],
    featured: false,
  },
  {
    name: "Spot",
    price: "USD 1.200",
    period: "por pieza",
    items: ["Spot de 30 segundos", "Español, portugués e inglés", "Formatos 16:9, 9:16 y 1:1", "Guion, música y locución"],
    featured: true,
  },
  {
    name: "Temporada",
    price: "USD 2.800",
    period: "por campaña",
    items: ["1 spot + 12 reels", "Piezas para anuncios pagos", "3 idiomas", "Variantes para probar qué funciona"],
    featured: false,
  },
];

const FAQ = [
  {
    q: "¿Se nota que está hecho con IA?",
    a: "Trabajamos en modo híbrido: tu bodega, tu gente y tus productos son reales. La IA suma paisajes, transiciones, animación de producto y versiones en otros idiomas. Lo que no pasa nuestro control de calidad, no se entrega.",
  },
  {
    q: "¿Puedo usar mis propias fotos y videos?",
    a: "Sí, y lo recomendamos: el resultado es más auténtico. Si no tenés material, coordinamos una jornada corta de filmación.",
  },
  {
    q: "¿Cuánto tarda?",
    a: "El guion llega en 48 horas. Un spot se entrega en 5 a 7 días hábiles desde que lo aprobás; los reels del Pack Redes, semana a semana.",
  },
  {
    q: "¿De quién son los derechos del video?",
    a: "Tuyos. Una vez pagado, lo usás en redes, anuncios, tu web y ferias sin límite de tiempo.",
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

const wrap = "mx-auto w-full max-w-[1400px] px-4 sm:px-10";
const label = "text-xs font-medium uppercase tracking-[0.08em]";
const giant = "font-semibold uppercase leading-[0.86] tracking-[-0.045em]";

/** Cordillera y viñedo en capas planas: fondo de la portada mientras no haya video. */
function HeroScene() {
  return (
    <div aria-hidden="true" className="absolute inset-0 bg-[#1b1416]">
      <div className="absolute inset-x-0 top-0 h-2/3 bg-[linear-gradient(180deg,#2b1d22_0%,#4a2a31_70%,#6b3640_100%)]" />
      <div className="absolute inset-x-0 top-[34%] h-[34%] bg-[#3a2a2f] [clip-path:polygon(0_100%,0_58%,9%_40%,17%_52%,28%_14%,37%_38%,47%_6%,58%_34%,66%_22%,77%_46%,88%_18%,100%_42%,100%_100%)]" />
      <div className="absolute inset-x-0 top-[50%] h-[22%] bg-[#2a1f23] [clip-path:polygon(0_100%,0_56%,14%_34%,30%_58%,46%_26%,63%_52%,80%_30%,100%_54%,100%_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-[34%] bg-[#5b1a2c]" />
      <div className="absolute inset-x-0 bottom-0 h-[34%] bg-[repeating-linear-gradient(98deg,transparent_0_38px,rgba(0,0,0,0.35)_38px_44px)]" />
    </div>
  );
}

/** Insignia circular con texto, al estilo sello. */
function Badge() {
  return (
    <svg viewBox="0 0 200 200" className="h-40 w-40 shrink-0 sm:h-52 sm:w-52" role="img" aria-label="Hecho en Mendoza, video con IA">
      <defs>
        <path id="mm-ring" d="M100,100 m-74,0 a74,74 0 1,1 148,0 a74,74 0 1,1 -148,0" />
      </defs>
      <circle cx="100" cy="100" r="98" fill="#0b0b0b" />
      <g className="mm-spin" style={{ transformOrigin: "100px 100px" }}>
        <text fill="#fff" fontSize="15" fontWeight="600" letterSpacing="3.4">
          <textPath href="#mm-ring">HECHO EN MENDOZA · VIDEO CON IA · </textPath>
        </text>
      </g>
      <circle cx="100" cy="100" r="50" fill="#8c1c3a" />
      <svg x="76" y="62" width="48" height="76" viewBox="60 10 80 182" className="text-white">
        <mask id="mm-badge-bite">
          <rect width="200" height="200" fill="#fff" />
          <circle cx="144" cy="100" r="26" fill="#000" />
        </mask>
        <path
          d="M90 14 H110 V52 C110 62 136 70 136 96 V178 C136 184 132 188 126 188 H74 C68 188 64 184 64 178 V96 C64 70 90 62 90 52 Z"
          fill="currentColor"
          mask="url(#mm-badge-bite)"
        />
      </svg>
    </svg>
  );
}

function Marquee({ word, className }: { word: string; className: string }) {
  const items = Array.from({ length: 8 }, (_, i) => (
    <span key={i} className="px-[0.25em]">
      {word}
    </span>
  ));
  return (
    <div aria-hidden="true" className="overflow-hidden">
      <div className={`mm-marquee ${className}`}>
        {items}
        {items}
      </div>
    </div>
  );
}

export default function Landing() {
  const hasVideo = publicFile(HERO_VIDEO);
  const hasPoster = publicFile(HERO_POSTER);
  const hasReel = publicFile(REEL);
  const pieces = PORTFOLIO.filter((p) => publicFile(`/reel/${p.file}.mp4`));

  return (
    <div
      className={`theme-malbec ${grotesk.variable} min-h-screen bg-mm-bg font-[family-name:var(--font-mm)] text-mm-text`}
    >
      <MotionRoot />
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-mm-accent focus:px-5 focus:py-3 focus:text-white"
      >
        Saltar al contenido
      </a>

      {/* Portada */}
      <header className="relative flex min-h-[100svh] flex-col overflow-hidden bg-black text-white">
        {hasVideo ? (
          <video
            className="mm-kenburns absolute inset-0 h-full w-full object-cover"
            src={HERO_VIDEO}
            poster={hasPoster ? HERO_POSTER : undefined}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
          />
        ) : (
          <HeroScene />
        )}
        <div aria-hidden="true" className="absolute inset-0 bg-black/45" />

        <nav className={`${wrap} relative z-10 flex min-h-20 items-center justify-between gap-6`}>
          <a href="#" className="flex min-h-11 items-center gap-2 text-lg font-semibold tracking-tight">
            <Logo className="h-8 w-auto" />
            Malbec Motion
          </a>
          <div className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className={`${label} flex min-h-11 items-center px-3 text-white/85 hover:text-white`}>
                {n.label}
              </a>
            ))}
          </div>
        </nav>

        <div className={`${wrap} relative z-10 flex flex-1 flex-col justify-center py-16`}>
          <h1 className="max-w-4xl text-5xl font-semibold leading-[0.95] tracking-[-0.035em] sm:text-7xl lg:text-8xl">
            {"Video publicitario con IA".split(" ").map((w, i) => (
              <span key={i} className="mm-word" style={{ "--i": i } as React.CSSProperties}>
                {w}
                {"\u00a0"}
              </span>
            ))}
          </h1>
          <p className="mm-fade-up mt-5 max-w-2xl text-xl leading-snug text-white/90 sm:text-2xl">
            Para bodegas, turismo y gastronomía de Mendoza. En tres idiomas y en días.
          </p>
        </div>

        <div className={`${wrap} relative z-10 pb-24 sm:pb-10`}>
          <p className={`${label} mm-fade-up text-white/80`} style={{ "--i": 2 } as React.CSSProperties}>
            Qué hacemos <span className="mm-bob inline-block">↘</span>
          </p>
          <ul className="mt-3 w-56">
            {WHAT.map((w, i) => (
              <li
                key={w}
                className={`${label} mm-fade-up flex justify-between border-b border-white/40 py-2 text-white`}
                style={{ "--i": i + 3 } as React.CSSProperties}
              >
                <span>{w}</span>
                <span className="tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <main id="contenido">
        {/* Somos */}
        <section id="somos" className={`${wrap} scroll-mt-4 py-24 sm:py-32`}>
          <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
            <div data-reveal className="max-w-3xl">
              <h2 className={`${giant} text-4xl sm:text-6xl`}>
                Somos una agencia de video con IA, hecha en Mendoza.
              </h2>
              <p className="mt-8 max-w-xl text-lg leading-relaxed text-mm-muted">
                Combinamos tu material real con inteligencia artificial generada en nuestros propios equipos para
                producir spots y reels en español, portugués e inglés. Más rápido y a una fracción del costo de una
                producción tradicional, sin perder lo auténtico de tu marca.
              </p>
            </div>
            <div data-reveal style={{ "--i": 2 } as React.CSSProperties}>
              <div data-speed="-0.08" className="mm-parallax">
                <Badge />
              </div>
            </div>
          </div>

          <dl className="mt-20 grid gap-10 border-t border-mm-line pt-10 sm:grid-cols-3">
            {[
              { k: "1,59 M", v: "visitantes recibieron las bodegas de Mendoza en 2024" },
              { k: "43 %", v: "de esos visitantes llegó desde el exterior" },
              { k: "45 %", v: "de los extranjeros vino de Brasil: tu próximo cliente habla portugués" },
            ].map((s, i) => (
              <div key={s.k} data-reveal style={{ "--i": i } as React.CSSProperties}>
                <dt className="text-5xl font-semibold tabular-nums tracking-[-0.04em]">{s.k}</dt>
                <dd className="mt-2 text-base leading-relaxed text-mm-muted">{s.v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-xs text-mm-muted">
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

        {/* Portfolio */}
        {pieces.length > 0 && (
          <section id="portfolio" className="scroll-mt-4 overflow-hidden pb-24 sm:pb-40">
            <div data-reveal className={wrap}>
              <h2 className={`${giant} text-5xl sm:text-7xl`}>Portfolio</h2>
              <p className="mt-4 max-w-lg text-base text-mm-muted">
                Cada pieza fue generada con IA en nuestros propios equipos.
              </p>
            </div>
            <ul className={`${wrap} mt-12 grid gap-10 sm:grid-cols-2 sm:gap-8 lg:mt-20 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-6`}>
              {pieces.map((p, i) => {
                const l = FLOAT_LAYOUT[i % FLOAT_LAYOUT.length];
                return (
                  <li key={p.file} className={l.cls} data-reveal style={{ "--i": i % 3 } as React.CSSProperties}>
                    <div data-speed={l.speed} className="mm-parallax">
                      <div
                        className="mm-float"
                        style={
                          { "--dur": `${l.dur}s`, "--delay": `${-i * 1.3}s`, "--rot": `${l.rot}deg` } as React.CSSProperties
                        }
                      >
                        <div
                          className={`mm-tilt group relative ${l.aspect} overflow-hidden rounded-[6px] bg-black shadow-[0_30px_60px_-20px_rgb(0_0_0/0.45)]`}
                          style={{ "--depth": l.depth } as React.CSSProperties}
                        >
                          <InViewVideo
                            src={`/reel/${p.file}.mp4`}
                            poster={`/reel/${p.file}.jpg`}
                            className="h-full w-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.08]"
                          />
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-4 pt-14 text-white sm:p-5">
                            <p className={`${label} text-white/70`}>
                              {String(i + 1).padStart(2, "0")} · {p.kind}
                            </p>
                            <p className="mt-1.5 text-2xl font-semibold leading-none tracking-[-0.02em] transition-transform duration-500 group-hover:-translate-y-1">
                              {p.title}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Rubros */}
        <section className="pb-24 sm:pb-32">
          <Marquee
            word={SECTORS.map((s) => s.name).join(" · ") + " ·"}
            className="mm-marquee-rev whitespace-nowrap border-y border-mm-line py-4 text-2xl font-semibold uppercase tracking-[-0.02em] text-mm-muted sm:text-4xl"
          />
          <div className={wrap}>
            <h2 data-reveal className="mt-20 text-center text-xl font-semibold uppercase tracking-[-0.01em]">
              Para quién trabajamos
            </h2>
            <ul className="mt-10 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {SECTORS.map((s, i) => (
                <li
                  key={s.name}
                  data-reveal
                  style={{ "--i": i % 3 } as React.CSSProperties}
                  className={`group relative flex aspect-[4/3] flex-col justify-end overflow-hidden rounded-[3px] p-5 transition-transform duration-500 ease-out hover:-translate-y-2 hover:-rotate-1 sm:p-7 ${s.bg} ${s.fg}`}
                >
                  <span aria-hidden="true" className="absolute right-4 top-4 grid h-7 w-7 place-items-center rounded-full bg-white/20 text-sm transition-transform duration-500 group-hover:rotate-45 group-hover:scale-125">
                    ↗
                  </span>
                  <span className="text-2xl font-semibold leading-none tracking-[-0.03em] sm:text-4xl">{s.name}</span>
                  <span className={`${label} mt-2 opacity-80`}>{s.tag}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Frase gigante */}
        <section aria-label="Lo que hacemos" className={`${wrap} overflow-hidden pb-24 sm:pb-32`}>
          <p className={`${giant} text-[13vw] lg:text-[10vw]`}>
            <span data-speed="0.25" className="mm-drift block">Video con IA</span>
            <span data-speed="-0.2" className="mm-drift block pl-[6vw]">en tres</span>
            <span data-speed="0.3" className="mm-drift block pl-[22vw] text-mm-accent">idiomas</span>
          </p>
        </section>

        {/* Servicios */}
        <section id="servicios" className="grid scroll-mt-4 bg-mm-ink text-white lg:grid-cols-2">
          <div className="relative min-h-[50vh] overflow-hidden">
            {hasReel ? (
              <div data-reveal className="flex h-full flex-col justify-center gap-4 px-6 py-12 sm:px-10">
                <p className={`${label} text-white/70`}>Reel 2026 · 60 segundos</p>
                <video
                  src={REEL}
                  poster={REEL_POSTER}
                  controls
                  playsInline
                  preload="none"
                  className="aspect-video w-full rounded-[3px] bg-black"
                >
                  Tu navegador no puede reproducir este video.
                </video>
              </div>
            ) : (
              <HeroScene />
            )}
            <div className={`${hasReel ? "hidden" : ""} absolute inset-x-6 bottom-6 grid grid-cols-3 gap-3 sm:inset-x-10 sm:bottom-10`}>
              {[
                ["ES", "Viví la vendimia"],
                ["PT", "Viva a vindima"],
                ["EN", "Live the harvest"],
              ].map(([lang, line]) => (
                <div key={lang} className="rounded-[3px] bg-black/55 p-3 backdrop-blur-sm sm:p-4">
                  <p className={`${label} text-white/70`}>{lang}</p>
                  <p className="mt-1 text-sm font-semibold leading-tight sm:text-lg">{line}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="px-6 py-16 sm:px-12 sm:py-20">
            <p className={`${label} border-b border-white/30 pb-3 text-white/70`}>Nuestros servicios</p>
            <ul className="mt-8">
              {SERVICES.map((s, i) => (
                <li
                  key={s}
                  data-reveal
                  style={{ "--i": i } as React.CSSProperties}
                  className={`${giant} text-5xl transition-[color,padding] duration-300 hover:pl-4 hover:text-white/60 sm:text-6xl`}
                >
                  {s}
                  <sup className="ml-1 text-xl">°</sup>
                </li>
              ))}
            </ul>
            <ol className="mt-14 grid gap-8 sm:grid-cols-2">
              {STEPS.map((s, i) => (
                <li key={s.n} data-reveal style={{ "--i": i } as React.CSSProperties} className="border-t border-white/25 pt-4">
                  <p className="text-sm tabular-nums text-white/60">{s.n}</p>
                  <h3 className="mt-1 text-lg font-semibold uppercase tracking-[-0.01em]">{s.title}</h3>
                  <p className="mt-1 text-base leading-relaxed text-white/75">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Precios */}
        <section id="precios" className={`${wrap} scroll-mt-4 py-24 sm:py-32`}>
          <div className="flex flex-col justify-between gap-6 border-b border-mm-line pb-8 sm:flex-row sm:items-end">
            <h2 data-reveal className={`${giant} text-5xl sm:text-7xl`}>Precios</h2>
            <p className="max-w-sm text-base text-mm-muted">
              Precios de lanzamiento, sin &ldquo;pedí presupuesto&rdquo;. Se pueden pagar en pesos al cambio del día.
            </p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {PLANS.map((p, i) => (
              <div
                key={p.name}
                data-reveal
                style={{ "--i": i } as React.CSSProperties}
                className={`flex flex-col rounded-[3px] p-8 transition-[transform,box-shadow] duration-500 ease-out hover:-translate-y-2 hover:shadow-[0_30px_60px_-25px_rgb(0_0_0/0.4)] ${p.featured ? "bg-mm-ink text-white" : "bg-mm-surface text-mm-text"}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-xl font-semibold uppercase tracking-[-0.01em]">{p.name}</h3>
                  {p.featured && <span className={`${label} rounded-full bg-mm-accent px-3 py-1 text-white`}>Más pedido</span>}
                </div>
                <p className="mt-8">
                  <span className="text-5xl font-semibold tabular-nums tracking-[-0.04em]">{p.price}</span>
                  <span className={`ml-2 text-base ${p.featured ? "text-white/70" : "text-mm-muted"}`}>{p.period}</span>
                </p>
                <ul className="mt-8 grid gap-0 text-base">
                  {p.items.map((it) => (
                    <li key={it} className={`border-t py-3 ${p.featured ? "border-white/20" : "border-mm-line"}`}>
                      {it}
                    </li>
                  ))}
                </ul>
                <a
                  href="#contacto"
                  className={`mt-8 flex min-h-12 items-center justify-center gap-2 rounded-full border px-6 text-sm font-semibold uppercase tracking-[0.04em] transition-colors ${
                    p.featured
                      ? "border-white bg-white text-black hover:bg-white/85"
                      : "border-mm-text hover:bg-mm-text hover:text-white"
                  }`}
                >
                  Elegir {p.name} <span aria-hidden="true">✦</span>
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Preguntas */}
        <section id="preguntas" className={`${wrap} pb-24 sm:pb-32`}>
          <div className="grid gap-10 lg:grid-cols-[1fr_1.5fr]">
            <h2 data-reveal className={`${giant} text-4xl sm:text-6xl`}>Preguntas</h2>
            <div data-reveal className="border-t border-mm-text">
              {FAQ.map((f) => (
                <details key={f.q} className="group border-b border-mm-line">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span aria-hidden="true" className="text-2xl font-normal transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="pb-5 text-base leading-relaxed text-mm-muted">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Contacto */}
        <section id="contacto" className="scroll-mt-4 pb-24 sm:pb-32">
          <h2 className="sr-only">Contacto</h2>
          <Marquee word="Contacto" className={`${giant} text-[18vw] lg:text-[11vw]`} />
          <div data-reveal className={`${wrap} mt-10 grid gap-12 border-t border-mm-text/40 pt-12 lg:grid-cols-[1fr_1.4fr]`}>
            <div>
              <p className="max-w-xs text-lg leading-snug">
                Contanos qué querés mostrar y te respondemos con una propuesta concreta: qué video, en qué idiomas,
                cuánto cuesta y cuándo lo tenés.
              </p>
              <p className="mt-8 text-base text-mm-muted">¿Preferís hablar ahora?</p>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex min-h-11 items-center text-2xl font-semibold tracking-[-0.02em] underline decoration-1 underline-offset-4 hover:text-mm-accent"
              >
                {WHATSAPP_DISPLAY}
              </a>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>

      <footer className="bg-mm-ink pt-14 text-white">
        <div className={`${wrap} flex flex-wrap items-start justify-between gap-6`}>
          <div>
            <p className={`${label} max-w-xs text-white/80`}>Video publicitario con IA · Mendoza, Argentina</p>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className={`${label} mt-2 inline-flex min-h-11 items-center text-white hover:text-white/75`}
            >
              WhatsApp {WHATSAPP_DISPLAY}
            </a>
          </div>
          <a href="#" className={`${label} flex min-h-11 items-center gap-2 text-white`}>
            <span aria-hidden="true" className="grid h-6 w-6 place-items-center rounded-full bg-white text-black">
              ↑
            </span>
            Volver arriba
          </a>
        </div>
        <div className="mt-12">
          <Marquee word="Malbec Motion" className={`${giant} text-[16vw] lg:text-[10vw]`} />
        </div>
        <p className={`${wrap} py-8 text-xs text-white/60`}>© {new Date().getFullYear()} Malbec Motion</p>
      </footer>

      {/* Atajo flotante a WhatsApp, como el "Agendar una reunión" de la referencia. */}
      <a
        href={whatsappLink()}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-40 flex min-h-12 items-center gap-2 rounded-full border border-[#1faa52] bg-white pl-5 pr-1.5 text-sm font-semibold text-[#0b0b0b] shadow-lg shadow-black/20 transition-colors hover:bg-[#effaf2]"
      >
        Agendar por WhatsApp
        <span aria-hidden="true" className="mm-pulse grid h-9 w-9 place-items-center rounded-full bg-[#25d366] text-white">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
            <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.79-1.47-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.61-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 0 1-4.79-1.31l-.34-.2-3.56.93.95-3.47-.22-.36A9.4 9.4 0 0 1 2.6 12.05c0-5.2 4.24-9.44 9.46-9.44 2.52 0 4.9.99 6.68 2.77a9.38 9.38 0 0 1 2.76 6.68c0 5.21-4.24 9.44-9.45 9.44zm8.05-17.5A11.32 11.32 0 0 0 12.05.67C5.78.67.67 5.77.67 12.05c0 2 .52 3.96 1.52 5.69L.57 23.33l5.72-1.5a11.36 11.36 0 0 0 5.75 1.47h.01c6.27 0 11.38-5.1 11.38-11.38 0-3.04-1.18-5.9-3.33-8.05z" />
          </svg>
        </span>
      </a>
    </div>
  );
}
