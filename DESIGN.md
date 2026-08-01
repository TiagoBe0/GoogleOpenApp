# Design System — PsicoLink

## Product Context

- **What this is:** plataforma de turnos entre psicólogos y pacientes. El profesional
  publica su perfil y disponibilidad; el paciente reserva, paga online y recibe la
  confirmación. La agenda se sincroniza con Google Calendar.
- **Who it's for:** dos usuarios con el mismo peso. El **paciente** que busca terapia y
  necesita confiar rápido, y el **profesional** que usa la app como herramienta de
  trabajo diaria.
- **Space/industry:** salud mental y agendamiento, mercado argentino. Referentes
  medidos: [Doctoralia](https://www.doctoralia.com.mx/psicologo/online) (líder del
  rubro en LatAm) y [Calendly](https://calendly.com) (referente de agendamiento).
- **Project type:** híbrido. Web app en los dashboards, sitio de conversión en la
  landing y el perfil público `/p/[slug]`.

## Aesthetic Direction

- **Direction:** natural y calma, profesional sin ser clínica.
- **Decoration level:** mínimo. La tipografía y los neutros cálidos hacen el trabajo.
  Sin degradados, sin blobs, sin íconos decorativos en círculos.
- **Mood:** alguien que llega buscando terapia tiene que sentir calma y seriedad, no
  urgencia ni consultorio. El profesional tiene que sentir precisión.
- **Un sistema, dos densidades:** misma paleta y tipografía en toda la app. El lado del
  paciente respira más; el del profesional es más denso. Nunca dos identidades.

### Por qué no violeta

La app nació con `indigo-600` y un degradado violeta en la landing. Se abandona por dos
razones que apuntan en la misma dirección:

1. **Registro emocional equivocado.** La investigación de diseño en salud mental es
   consistente: los azules fríos leen clínico y corporativo, mientras que los neutros
   cálidos y los verdes tipo salvia transmiten calma y seguridad. Doctoralia ya lo
   valida en este mercado: texto negro cálido `rgb(42,38,35)`, fondo cálido
   `rgb(245,242,239)`, acento verde `rgb(0,124,104)`.
2. **Es la señal más reconocible de interfaz generada por IA.** El degradado
   violeta/índigo encabeza la lista de patrones que delatan una plantilla.

## Typography

- **Display/Hero:** **Fraunces** — serif cálida con eje óptico. Nadie en el rubro usa
  serif (Doctoralia usa `system-ui`, Calendly usa una sans propia), así que da calidez
  humana y diferenciación real. Solo títulos: pide cuidado en tamaños chicos.
- **Body / UI / Labels:** **Geist** — ya estaba cargada en el proyecto. Sans neutra y
  precisa, con cifras tabulares.
- **Data/Tables:** Geist con `font-variant-numeric: tabular-nums`. Obligatorio en
  columnas de hora, duración e importe: sin eso las cifras bailan entre filas.
- **Code:** no aplica (no hay superficies de código en el producto).
- **Loading:** `next/font/google` en `src/app/layout.tsx`. Ambas exponen variables CSS
  (`--font-geist`, `--font-fraunces`) que `@theme` mapea a `--font-sans` y
  `--font-display`.
- **Scale:** 12 / 14 / 16 / 18 / 24 / 28 / 34 / 48 px. Cuerpo mínimo 16px. Etiquetas
  mínimo 12px.

**Trampa de Tailwind v4:** nunca poner `font-family` en una regla sin capa (como
`body { }`) en `globals.css`. Las utilidades de Tailwind viven en `@layer utilities` y el
CSS sin capa les gana sin importar la especificidad, así que una regla suelta pisa
silenciosamente la fuente. Eso ya pasó una vez: la app descargaba Geist y renderizaba
todo en Arial.

## Color

- **Approach:** restringido. Un solo acento. Cuando algo se pone verde, significa algo.

| Token | Hex | Uso |
|-------|-----|-----|
| `--bg` | `#FBFAF8` | Fondo de página, blanco cálido |
| `--surface` | `#FFFFFF` | Tarjetas, modales |
| `--surface-2` | `#F5F2EE` | Sidebar, zonas hundidas |
| `--border` | `#E8E4DE` | Separadores |
| `--border-strong` | `#D6D0C7` | Bordes de input y botón secundario |
| `--muted` | `#6F6862` | Texto secundario |
| `--text` | `#2A2623` | Texto principal, negro cálido |
| `--primary` | `#1A6B54` | Acción primaria y estado confirmado |
| `--primary-hi` | `#14563F` | Hover de acción primaria |
| `--primary-soft` | `#E6F2ED` | Fondo de badge confirmado |
| `--pending` | `#A66A00` | Esperando confirmación |
| `--pending-soft` | `#FBF1DE` | Fondo de badge pendiente |
| `--error` | `#A6362C` | Error y cancelado |
| `--error-soft` | `#F9EBE8` | Fondo de error |
| `--info` | `#2F5C7A` | Informativo, uso raro |

- **Semantic:** el estado confirmado **usa el mismo verde que el acento**. Confirmar es
  el estado de éxito del producto; no hace falta un color más.
- **El error es ladrillo apagado, no rojo alarma.** En un producto de salud mental un
  rojo saturado lee como emergencia médica.
- **Dark mode:** no invertir luminosidad. Superficies marrón muy oscuro (`#1A1816`,
  `#221F1C`) en vez de gris azulado, texto blanco roto `#EDE8E1` en vez de blanco puro,
  y verde desaturado (`#5FAF92`) para que no vibre sobre fondo oscuro.

## Spacing

- **Base unit:** 4px.
- **Density:** cómoda en el lado del paciente, compacta en el del profesional.
- **Scale:** 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 px.

## Layout

- **Approach:** híbrido. Grilla disciplinada en los dashboards; composición libre en la
  landing y el perfil público.
- **Max content width:** 1080px en superficies de lectura; los dashboards usan el ancho
  disponible.
- **Border radius:** `sm 4px` (badges, chips) / `md 8px` (botones, inputs) /
  `lg 12px` (tarjetas, modales). Nunca el mismo radio grande en todo.
- **Touch targets: mínimo 44px de alto en todo elemento interactivo.** No es preferencia,
  es WCAG 2.5.5 más las guías de Apple y Material. Un profesional confirma turnos desde
  el teléfono entre sesiones.

## Motion

- **Approach:** mínimo funcional. Solo transiciones que ayudan a entender qué cambió.
- **Easing:** entrada `ease-out`, salida `ease-in`, movimiento `ease-in-out`.
- **Duration:** micro 100ms, corta 150-250ms, media 250-400ms.
- Animar solo `transform` y `opacity`. Nunca `transition: all`.

## Anti-patrones prohibidos

Cerrados por decisión, no por gusto:

1. Degradados violeta o índigo en cualquier superficie.
2. Grilla de tres columnas con íconos en círculos de color.
3. Todo centrado (`text-align: center` en títulos, textos y tarjetas por igual).
4. El mismo radio grande y burbujeante en todos los elementos.
5. Emoji como elemento de diseño.
6. `system-ui` o `-apple-system` como fuente principal.
7. Tipografía menor a 16px en texto de lectura.
8. Etiqueta de formulario solo como `placeholder`: tiene que seguir visible con el
   campo lleno.

## Decisions Log

| Fecha | Decisión | Fundamento |
|-------|----------|------------|
| 2026-07-25 | Sistema inicial creado | `/design-consultation` con investigación del rubro. Paletas medidas en Doctoralia y Calendly. |
| 2026-07-25 | Geist aplicada de verdad | La app la descargaba y renderizaba en Arial por una regla sin capa en `globals.css`. |
| 2026-07-25 | Fuera el violeta, entra verde `#1A6B54` | Registro emocional equivocado para salud mental, y es el patrón de interfaz generada por IA más reconocible. |
| 2026-07-25 | Fraunces para títulos | Diferenciación real: nadie en el rubro usa serif. Limitada a títulos por legibilidad. |
| 2026-07-25 | Un sistema, dos densidades | El lado paciente y el profesional venían con identidades visuales distintas (azul marino contra blanco y violeta). |
