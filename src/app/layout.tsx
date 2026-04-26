import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: "GoogleOpenApp — Registro con Google Calendar",
  description: "Regístrate y vincula tu Google Calendar",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={geist.variable}>
      <body className="min-h-screen antialiased font-[family-name:var(--font-geist)]">
        {children}
      </body>
    </html>
  );
}
