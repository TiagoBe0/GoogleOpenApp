import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "PsicoLink",
  description: "Agenda, pacientes y turnos para profesionales de salud mental",
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
