import type { Metadata, Viewport } from "next";
import { Geist, Fraunces } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import ServiceWorkerRegistrar from "@/components/ServiceWorkerRegistrar";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

// Solo títulos (utilidad font-display). Ver DESIGN.md: la serif cálida es la
// diferenciación del producto, pero pide cuidado en tamaños chicos.
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "PsicoLink — Turnos con tu psicólogo",
  description:
    "Reservá turnos con tu psicólogo: agenda sincronizada, pago online y confirmación del profesional.",
  // iOS ignora el manifest: para que se instale con ícono propio y sin barra de
  // Safari necesita estas meta aparte.
  appleWebApp: {
    capable: true,
    title: "PsicoLink",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

// themeColor va acá, no en metadata: está deprecado en `metadata` desde Next 14.
export const viewport: Viewport = {
  themeColor: "#1A6B54",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${geist.variable} ${fraunces.variable}`}>
      <body className="min-h-screen antialiased font-[family-name:var(--font-geist)]">
        <Providers>{children}</Providers>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
