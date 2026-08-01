import type { MetadataRoute } from "next";

// Colores tomados de DESIGN.md: --primary para la barra del sistema, --bg para
// la pantalla de arranque. Si cambian ahí, cambian acá.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PsicoLink — Turnos con tu psicólogo",
    short_name: "PsicoLink",
    description:
      "Reservá turnos con tu psicólogo: agenda sincronizada, pago online y confirmación del profesional.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#FBFAF8",
    theme_color: "#1A6B54",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // Android recorta el ícono a la forma del launcher. El maskable trae el
      // dibujo achicado dentro de la zona segura para que no le coma los bordes.
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
