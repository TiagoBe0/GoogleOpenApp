import { describe, expect, it } from "vitest";
import { checkEnv } from "../../scripts/check-env.mjs";

const ok = {
  DATABASE_URL: "file:./prod.db",
  AUTH_SECRET: "k".repeat(44),
  AUTH_URL: "https://malbecmotion.com",
  NEXTAUTH_URL: "https://malbecmotion.com",
  GOOGLE_CLIENT_ID: "123.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: "GOCSPX-abc",
  MP_ACCESS_TOKEN: "APP_USR-123",
  MP_WEBHOOK_SECRET: "secreto",
  SMTP_HOST: "smtp.resend.com",
  SMTP_USER: "resend",
  SMTP_PASSWORD: "re_123",
  SMTP_FROM: "PsicoLink <turnos@malbecmotion.com>",
  VAPID_SUBJECT: "mailto:contacto@malbecmotion.com",
  VAPID_PUBLIC_KEY: "pub",
  VAPID_PRIVATE_KEY: "priv",
};

describe("checkEnv", () => {
  it("acepta una configuración de producción completa", () => {
    expect(checkEnv(ok)).toEqual({ errors: [], warnings: [] });
  });

  it("rechaza AUTH_URL sin https, con barra final o apuntando a ngrok", () => {
    for (const AUTH_URL of ["http://malbecmotion.com", "https://malbecmotion.com/", "https://abc.ngrok-free.app"]) {
      expect(checkEnv({ ...ok, AUTH_URL, NEXTAUTH_URL: AUTH_URL }).errors.length).toBeGreaterThan(0);
    }
  });

  it("detecta NEXTAUTH_URL distinta de AUTH_URL", () => {
    expect(checkEnv({ ...ok, NEXTAUTH_URL: "https://viejo.ngrok-free.app" }).errors).toHaveLength(1);
  });

  it("rechaza credenciales TEST de MercadoPago y webhook sin clave", () => {
    const { errors } = checkEnv({ ...ok, MP_ACCESS_TOKEN: "TEST-123", MP_WEBHOOK_SECRET: "" });
    expect(errors).toHaveLength(2);
  });

  it("rechaza los valores de ejemplo de .env.example", () => {
    expect(checkEnv({ ...ok, AUTH_SECRET: "your-secret-here-change-in-production" }).errors.length).toBeGreaterThan(0);
  });

  it("sin correo ni push solo avisa, no bloquea", () => {
    const rest = { ...ok, SMTP_HOST: "", VAPID_PUBLIC_KEY: "", VAPID_PRIVATE_KEY: "", VAPID_SUBJECT: "" };
    const { errors, warnings } = checkEnv(rest);
    expect(errors).toEqual([]);
    expect(warnings).toHaveLength(2);
  });

  it("VAPID a medias es error", () => {
    expect(checkEnv({ ...ok, VAPID_PRIVATE_KEY: "" }).errors).toHaveLength(1);
  });
});
