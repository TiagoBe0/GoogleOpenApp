@AGENTS.md

# PsicoLink (GoogleOpenApp)

Plataforma de agendamiento entre psicólogos y pacientes. Un psicólogo publica su
perfil (`/p/[slug]`), define disponibilidad y precio; los pacientes reservan turnos,
pagan por MercadoPago y el turno se sincroniza con Google Calendar.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **Prisma 5** sobre **SQLite** (`prisma/dev.db`)
- **NextAuth v5** (Google OAuth + credenciales con bcrypt)
- **Google Calendar API** (evento por turno: `Appointment.calendarEventId`)
- **MercadoPago** (checkout + webhook en `api/payments/webhook`)
- Tailwind v4

Roles: un mismo modelo `User` con `role` = `PATIENT` | `PSYCHOLOGIST`.

## Comandos del proyecto

Estos son los comandos que los skills de gstack deben usar en este repo:

```bash
npm install              # instalar dependencias (node_modules no está versionado)
npm run dev              # servidor de desarrollo (next dev) → http://localhost:3000
npm run build            # build de producción (next build)
npm run start            # servir el build de producción
npm run lint             # ESLint (eslint-config-next)

npx prisma generate      # regenerar el cliente Prisma tras editar schema.prisma
npx prisma migrate dev   # crear/aplicar migraciones en desarrollo
npx prisma studio        # explorar la base SQLite en el navegador
```

- **Comando de test:** todavía no hay framework de tests configurado. Si un skill
  necesita testear, proponer setup (Vitest o Playwright) antes de asumir uno.
- **Comando de lint/typecheck:** `npm run lint`. Para chequeo de tipos:
  `npx tsc --noEmit`.
- **Deploy:** ver [docs/deploy/ibm-almalinux-ngrok.md](docs/deploy/ibm-almalinux-ngrok.md)
  (IBM AlmaLinux + ngrok).

## Variables de entorno

Config en `.env` (no versionado). Plantilla en [.env.example](.env.example):
`DATABASE_URL`, `AUTH_SECRET`, `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`,
`NEXTAUTH_URL`, `MP_ACCESS_TOKEN`/`MP_PUBLIC_KEY`/`MP_WEBHOOK_SECRET`.
Nunca imprimir ni commitear estos valores.

## Cambios de esquema: reiniciar el dev server

Después de tocar `prisma/schema.prisma` y correr una migración, **hay que
reiniciar `npm run dev`**. El cliente de Prisma queda cargado en memoria: aunque
el archivo en disco ya conozca el campo nuevo, el proceso viejo no, y falla con
`Unknown field X for select statement on model Y`. Next lo marca como `(stale)`
en el overlay de error.

Síntoma que confunde: las rutas sin sesión responden bien (307) y las que sí
consultan la base tiran 500, porque el código retorna antes de tocar Prisma
cuando no hay usuario.

Si tras reiniciar sigue igual, borrar la caché: `rm -rf .next`. Turbopack la
conserva entre reinicios y ya causó dos falsos negativos en este proyecto (CSS
viejo servido después de cambiar `globals.css`, y este mismo caso).

Y nunca usar `prisma migrate dev --skip-generate` salvo que se corra
`prisma generate` a mano después: saltear la generación es lo que dejó el
cliente desactualizado la primera vez.

## Design System

Leer [DESIGN.md](DESIGN.md) **antes** de cualquier decisión visual o de interfaz. Ahí
viven la paleta, la tipografía, el espaciado y la dirección estética, con el fundamento
de cada decisión. No desviarse sin aprobación explícita del usuario. En modo QA, marcar
cualquier código que no respete el sistema.

Tres reglas que ya se rompieron una vez y no deben volver a romperse:

1. **Nunca poner `font-family` en una regla sin capa** en `globals.css` (por ejemplo
   `body { }`). Las utilidades de Tailwind v4 viven en `@layer utilities` y el CSS sin
   capa les gana sin importar la especificidad: la app terminó descargando Geist y
   renderizando todo en Arial.
2. **Nada de violeta ni índigo.** El acento es el verde `--primary`. Ver DESIGN.md para
   el porqué (registro emocional y señal de interfaz generada por IA).
3. **Mínimo 44px de alto en todo elemento interactivo.** No es gusto, es WCAG 2.5.5.

Verificar cambios visuales **renderizando la pantalla**, no leyendo el CSS ni mirando
que el server arranque. Un cambio en `next.config.ts` o en `globals.css` puede arrancar
sin error y aun así romper los estilos.

## Skill routing

Cuando el pedido calce con un skill, invocarlo con la tool Skill:
- Bug / error → `/investigate`
- Revisar el diff / code review → `/review`
- Probar comportamiento del sitio (QA) → `/qa`
- Polish visual → `/design-review`
- Crear PR / deploy → `/ship`
