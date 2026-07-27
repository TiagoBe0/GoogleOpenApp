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

## Disponibilidad y zonas horarias

La agenda del profesional vive en `AvailabilityRule`: franjas semanales
recurrentes (`weekday` 0-6, `startMinute`/`endMinute` desde la medianoche). Un
día puede tener varias, para quien corta al mediodía. Quien nunca la configuró
cae en `DEFAULT_RULES` (lunes a viernes de 08:00 a 20:00), que es lo que la app
asumía cuando el horario estaba fijo en el código.

**Los minutos son hora local del profesional, no UTC.** La grilla de horarios se
calcula en `PsychologistProfile.timezone` y `/api/appointments/available-slots`
devuelve cada horario con su instante ya resuelto:

```json
{ "slots": [{ "label": "14:00", "startsAt": "2026-07-28T17:00:00.000Z" }], "duration": 50 }
```

Quien reserva manda ese `startsAt` tal cual. No reconstruir la fecha en el
cliente a partir de la etiqueta: fue lo que hacía antes con `tzOffset` del
navegador, y a un paciente en otra zona horaria le ofrecía horarios que después
el servidor rechazaba.

Las tres capas que tienen que coincidir cuando se toca esto:

1. `src/lib/availability.ts` — lógica pura (validar, fundir franjas pisadas,
   franjas de un día, si un turno entra en la agenda). Tiene tests.
2. `src/lib/timezone.ts` — hora de pared ↔ instante UTC vía `Intl`, sin
   dependencias nuevas y con horario de verano contemplado.
3. `POST /api/appointments` — rechaza con 409 cualquier turno fuera de la
   agenda. La grilla ya filtra, pero la API está expuesta igual. El profesional
   sí puede cargarse turnos fuera de su horario publicado.

## Avisos por correo

Tres capas, igual que la disponibilidad:

1. `src/lib/emails.ts` — plantillas puras, una función por aviso, devuelven
   `{subject, text, html}`. Tienen tests. **Todo dato que venga del usuario pasa
   por `escapeHtml`**: en una reserva pública el nombre lo escribe cualquiera
   sin cuenta, y sin escapar entra HTML arbitrario en el correo del profesional.
2. `src/lib/mailer.ts` — SMTP con nodemailer. Sin `SMTP_HOST` no envía nada y
   escribe el aviso en la consola, que es como conviene trabajar en desarrollo.
   `sendMail` nunca lanza: un aviso que falla no puede tumbar la reserva.
3. `src/lib/notifications.ts` — junta turno, paciente y profesional, y despacha.

**Los avisos se disparan con `after()` de `next/server`, nunca con un `await`
suelto ni con una promesa colgada.** `after` corre después de que la respuesta
salió, así que el paciente no espera al servidor de correo, y a diferencia de
una promesa sin esperar, no queda cortada cuando el proceso termina el request.

Puntos de disparo hoy: alta de turno (a las dos partes), confirmación y
cancelación (siempre a la otra parte, quien tocó el botón ya sabe lo que hizo),
y el webhook de MercadoPago. El webhook compara contra el estado anterior antes
de avisar: MercadoPago reintenta el mismo aviso varias veces y sin esa
comparación el paciente recibe el mismo correo una y otra vez.

### Adjunto de calendario (.ics)

Confirmar y cancelar llevan adjunto un archivo `.ics` (`src/lib/ics.ts`), que se
agenda con un clic en Google Calendar, Outlook o el iPhone. Es la vía que NO
depende de que el profesional haya conectado su cuenta de Google ni de que la
app esté verificada por Google, así que funciona desde el primer día.

Tres cosas del formato no son negociables y están cubiertas por tests: los
saltos de línea son CRLF, las líneas se pliegan a 75 **octetos** (medidos en
bytes UTF-8, no en caracteres), y en el texto hay que escapar barra, coma, punto
y coma y saltos de línea. Una coma sin escapar en la dirección del consultorio
corta el campo y rompe el archivo.

El `UID` es `<id del turno>@psicolink` y **tiene que ser el mismo** en la
invitación y en la cancelación: es lo que permite que el `METHOD:CANCEL` borre
el evento ya agendado. La cancelación va con `SEQUENCE:1`, mayor que el
`SEQUENCE:0` de la invitación, o el cliente de calendario la descarta por vieja.

Un turno pendiente no lleva adjunto: todavía no tiene por qué entrar en la
agenda de nadie.

## Reglas del turno: un solo lugar

`src/lib/appointment-rules.ts` decide si un horario se puede tomar. Lo usan
crear y reprogramar. **No duplicar estas comprobaciones dentro de una ruta**:
duplicadas terminan discrepando, y la discrepancia se ve como dos pacientes
citados a la misma hora.

- El conflicto se calcula con la duración real de cada turno vecino, no con la
  del turno nuevo: dos sesiones de duración distinta se pisan igual.
- El profesional puede cargarse turnos fuera de su horario publicado; nadie más.

### Reprogramar

`PATCH /api/appointments/[id]` con `date` mueve el turno. Cuando lo mueve el
**paciente, el turno vuelve a PENDING**: el profesional aceptó una hora
concreta, no cualquier hora. Cuando lo mueve el profesional conserva el estado,
porque él es quien confirma.

Cada reprogramación sube `Appointment.calendarSequence`, que viaja en el `.ics`.
Sin un número mayor que el anterior, el cliente de calendario descarta la
actualización por vieja y el paciente se queda con el horario viejo agendado.

## Pagos: el webhook no es la única vía

`src/lib/payment-sync.ts` tiene la decisión de qué hacer con un pago, y la usan
los dos caminos: el webhook y la reconciliación al volver del checkout. Si
estuviera duplicada, el mismo pago daría resultados distintos según quién lo
procese.

El aviso de MercadoPago puede no llegar nunca (se cayó la red, el servidor
estaba reiniciando, la URL estaba mal). Por eso `/payments/success` consulta el
estado real contra MercadoPago antes de decir nada, y muestra tres desenlaces
distintos: confirmado, rechazado, o todavía sin resolver. **No volver a poner un
"Pago confirmado" fijo ahí**: decirle eso a alguien cuyo pago fue rechazado es
peor que no decirle nada, porque se va tranquilo a un turno que no existe.

`applyPayment` devuelve `changed`, que es true solo si el turno cambió de estado
en esa llamada. Es lo que evita que el webhook y la reconciliación manden dos
veces el mismo correo.

## Webhook de MercadoPago

Es un endpoint público que decide si un turno queda confirmado, así que se
verifica todo lo que entra. La lógica vive en `src/lib/mercadopago.ts`, aparte
de la ruta, para poder testearla sin levantar un servidor.

- **Firma:** HMAC sobre `id:<data.id>;request-id:<x-request-id>;ts:<ts>;`,
  comparada con `timingSafeEqual`. Un `===` sobre un hash devuelve antes cuando
  el primer byte difiere, y con eso se adivina una firma byte a byte.
- **Sin `MP_WEBHOOK_SECRET`:** en producción se rechaza, en desarrollo se deja
  pasar con una advertencia. **No aflojar el caso de producción**: sin clave,
  cualquiera postea y confirma turnos sin pagar.
- **Importe y moneda:** un pago aprobado por menos de lo que costaba el turno, o
  en otra moneda, NO lo confirma. Se registra el pago, el turno queda pendiente
  y el profesional lo resuelve a mano.
- **Reintentos:** MercadoPago manda el mismo aviso varias veces. Antes de
  avisar por correo se compara contra el estado anterior.

## Google Calendar: los tokens salen de `Account`, no de la sesión

`session.googleAccessToken` se captura al iniciar sesión y nunca se renueva,
pero un access token de Google dura una hora: usarlo hacía que la sincronización
se cortara sola sin que nadie se enterara. `src/lib/google-calendar.ts` lee el
token de la tabla `Account` y lo renueva con el refresh token cuando venció.

Eso además permite tocar el calendario del profesional cuando quien actúa es el
paciente, que es lo que pasa cuando el paciente cancela un turno.

`Appointment.calendarEventId` se guarda al confirmar y se usa para borrar el
evento al cancelar. Antes el evento se creaba y la respuesta se descartaba, así
que cancelar dejaba el evento vivo en la agenda.

Tanto el calendario como los correos corren dentro de `after()`: que Google esté
caído no puede impedir que el profesional confirme un turno.

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
