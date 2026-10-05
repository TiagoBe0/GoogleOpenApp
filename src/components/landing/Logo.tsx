/**
 * Marca de Malbec Motion: botella de vino con una mordida en el hombro. Toma
 * el color del texto (`currentColor`), así sirve blanca sobre el video y
 * malbec sobre blanco. Mismo trazo que public/brand/logo.svg.
 */
export default function Logo({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="60 10 80 182"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <mask id="mm-logo-bite">
        <rect width="200" height="200" fill="#fff" />
        <circle cx="144" cy="100" r="26" fill="#000" />
      </mask>
      <path
        d="M90 14 H110 V52 C110 62 136 70 136 96 V178 C136 184 132 188 126 188 H74 C68 188 64 184 64 178 V96 C64 70 90 62 90 52 Z"
        fill="currentColor"
        mask="url(#mm-logo-bite)"
      />
    </svg>
  );
}
