#!/usr/bin/env node
/**
 * Revisa un archivo de variables de producción antes de levantar la app.
 *
 *   node scripts/check-env.mjs .env.production
 *
 * Los errores son cosas que rompen algo en producción (login, pagos, webhook);
 * las advertencias, funciones que quedan apagadas (correo, avisos push).
 * Sale con código 1 si hay errores. Nunca imprime los valores: solo nombres.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const PLACEHOLDER = /your-|tu-|xxxx|change-in-production|PEGAR|\.\.\./i;

export function checkEnv(env) {
  const errors = [];
  const warnings = [];
  const has = (k) => typeof env[k] === "string" && env[k].trim() !== "";
  const looksFake = (k) => has(k) && PLACEHOLDER.test(env[k]);

  for (const k of ["DATABASE_URL", "AUTH_SECRET", "AUTH_URL", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]) {
    if (!has(k)) errors.push(`${k} falta o está vacía.`);
    else if (looksFake(k)) errors.push(`${k} todavía tiene el valor de ejemplo.`);
  }

  if (has("AUTH_SECRET") && env.AUTH_SECRET.length < 32) {
    errors.push("AUTH_SECRET es muy corta: generar una con `openssl rand -base64 32`.");
  }

  if (has("AUTH_URL")) {
    const url = env.AUTH_URL.trim();
    if (!url.startsWith("https://")) errors.push("AUTH_URL tiene que empezar con https:// (Google y MercadoPago lo exigen).");
    if (url.endsWith("/")) errors.push("AUTH_URL no tiene que terminar en /.");
    if (/localhost|ngrok/.test(url)) errors.push("AUTH_URL apunta a localhost o ngrok, no al dominio.");
  }
  if (has("NEXTAUTH_URL") && has("AUTH_URL") && env.NEXTAUTH_URL.trim() !== env.AUTH_URL.trim()) {
    errors.push("NEXTAUTH_URL y AUTH_URL son distintas: dejarlas iguales o borrar NEXTAUTH_URL.");
  }

  if (has("DATABASE_URL") && !env.DATABASE_URL.startsWith("file:")) {
    warnings.push("DATABASE_URL no es un archivo SQLite: el esquema de Prisma está definido para SQLite.");
  }

  if (!has("MP_ACCESS_TOKEN")) {
    warnings.push("MP_ACCESS_TOKEN vacía: los turnos se reservan sin cobro.");
  } else {
    if (env.MP_ACCESS_TOKEN.startsWith("TEST-")) errors.push("MP_ACCESS_TOKEN es de prueba (TEST-): en producción va la de APP_USR-.");
    if (!has("MP_WEBHOOK_SECRET") || looksFake("MP_WEBHOOK_SECRET")) {
      errors.push("MP_WEBHOOK_SECRET falta: en producción el webhook rechaza todo y ningún pago confirma el turno.");
    }
  }

  if (!has("SMTP_HOST")) warnings.push("SMTP_HOST vacía: no se manda ningún correo (los avisos quedan solo en el log).");
  else for (const k of ["SMTP_USER", "SMTP_PASSWORD", "SMTP_FROM"]) if (!has(k)) errors.push(`${k} falta y SMTP_HOST está configurado.`);

  const vapidKeys = ["VAPID_PUBLIC_KEY", "VAPID_PRIVATE_KEY"].filter(has);
  if (vapidKeys.length === 0) warnings.push("Sin claves VAPID: la app no ofrece avisos push.");
  else if (vapidKeys.length === 1) errors.push("Falta una de las dos claves VAPID (pública y privada van juntas).");
  else if (!has("VAPID_SUBJECT")) errors.push("VAPID_SUBJECT falta y hay claves VAPID.");
  else if (looksFake("VAPID_SUBJECT")) warnings.push("VAPID_SUBJECT todavía tiene el mail de ejemplo.");

  return { errors, warnings };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const file = process.argv[2] ?? ".env.production";
  let env;
  try {
    env = dotenv.parse(readFileSync(file));
  } catch {
    console.error(`No se pudo leer ${file}.`);
    process.exit(1);
  }
  const { errors, warnings } = checkEnv(env);
  for (const w of warnings) console.log(`  aviso  ${w}`);
  for (const e of errors) console.log(`  ERROR  ${e}`);
  console.log(errors.length ? `\n${errors.length} error(es) en ${file}.` : `\n${file} OK.`);
  process.exit(errors.length ? 1 : 0);
}
