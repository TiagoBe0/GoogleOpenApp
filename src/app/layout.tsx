import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "PsicoLink — Turnos con tu psicólogo",
  description:
    "Reservá turnos con tu psicólogo: agenda sincronizada, pago online y confirmación del profesional.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={geist.variable}>
      <body className="min-h-screen antialiased font-[family-name:var(--font-geist)]">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
