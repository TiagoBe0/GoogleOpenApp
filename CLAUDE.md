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

## Skill routing

Cuando el pedido calce con un skill, invocarlo con la tool Skill:
- Bug / error → `/investigate`
- Revisar el diff / code review → `/review`
- Probar comportamiento del sitio (QA) → `/qa`
- Polish visual → `/design-review`
- Crear PR / deploy → `/ship`
