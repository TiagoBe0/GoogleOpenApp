# Análisis de viabilidad — PsicoLink

Rama analizada: `feat/agenda-avisos-y-pagos` (b3509de, 30-jul-2026), la más
reciente del repositorio. Fecha del análisis: agosto 2026.

Este documento no evalúa el código como código. Evalúa si el producto que ese
código construye tiene un mercado que lo sostenga, y qué hay que cambiar para
que lo tenga.

---

## 1. Qué hay construido hoy

~12.300 líneas de TypeScript, Next.js 16 + Prisma + NextAuth, 15 archivos de
test sobre la lógica de negocio.

Funciona el circuito completo: el profesional define franjas semanales de
atención (`AvailabilityRule`), el paciente lo encuentra en un directorio
público (`/psicologos`), reserva un turno en un slot libre, paga por
MercadoPago, el pago se verifica con firma HMAC y se reconcilia si el webhook
nunca llega, el turno se confirma, se sincroniza con Google Calendar, se manda
mail + push, y el profesional carga un link de videollamada que viaja al mail,
a la pantalla del paciente y al `.ics`.

**La ingeniería está por encima del promedio de un MVP.** La lógica está
separada en `src/lib` con tests propios (slots, disponibilidad, precios,
vinculación, links de reunión, reconciliación de pagos); la verificación de
firma usa `timingSafeEqual`; `meetingUrl` valida esquema con lista blanca
porque termina como `href`; el `.ics` incrementa `calendarSequence` para que
el cliente de calendario no descarte la actualización. Eso no es lo que suele
haber en un proyecto de este tamaño.

**El problema no es el código. Es el modelo de cobro y el mercado.** El resto
del documento es sobre eso.

---

## 2. Cinco hallazgos técnicos que son, en realidad, decisiones de negocio

Estos no son bugs. Son restricciones que definen qué negocio podés operar.

### 2.1. Un solo `MP_ACCESS_TOKEN` para toda la plataforma — bloqueante

`src/app/api/appointments/route.ts:124` crea el cliente de MercadoPago con
`process.env.MP_ACCESS_TOKEN`. Es **una única cuenta**: la tuya.

Consecuencia: cada peso que paga cada paciente de cada profesional entra a tu
cuenta, y tenés que remitirlo vos, a mano. Eso no es "un detalle a resolver
después", es lo que legalmente te convierte en agrupador de fondos de
terceros: facturación por el total, Ingresos Brutos sobre dinero que no es
tuyo, retenciones, y responsabilidad si un profesional no presta el servicio.

No hay `marketplace_fee` en ningún lado del código. **Hoy la plataforma no
tiene forma de cobrarse a sí misma.**

Lo que falta es MercadoPago OAuth (cada profesional conecta su propia cuenta)
+ split de pagos con `marketplace_fee`. Es la pieza número uno, antes que
cualquier feature. Sin eso no hay ni suscripción ni comisión: no hay negocio,
hay una demo.

### 2.2. SQLite

`prisma/schema.prisma` usa `provider = "sqlite"` con `file:./dev.db`. Un
archivo, un escritor a la vez. Sirve para desarrollar; no sirve para servir a
N profesionales concurrentes ni para desplegar en cualquier plataforma con
filesystem efímero. Migrar a Postgres es un día o dos de trabajo — no es
difícil, pero hoy la app **no está desplegable en producción**, y el único
documento de deploy que existe (`docs/deploy/ibm-almalinux-ngrok.md`) usa
ngrok, que es un túnel de desarrollo.

### 2.3. No hay notas clínicas ni historia clínica

El esquema tiene `User`, `Appointment`, `PsychologistProfile`,
`AvailabilityRule`, `Review`, `PushSubscription`. No hay ninguna entidad de
nota de sesión, evolución o ficha de paciente.

Todos los competidores argentinos que revisé la tienen, y no es casual: la
Ley 26.529 define la historia clínica como documento obligatorio, y la Ley
25.326 la trata como dato sensible. Es la funcionalidad que hace que un
psicólogo abra tu app todos los días en vez de solo cuando reserva alguien.
Sin ella, PsicoLink es un calendario con cobro — y un calendario se reemplaza
por Google Calendar gratis.

Ojo con el otro lado: guardar notas clínicas te mete en el régimen de datos
sensibles (consentimiento expreso, cifrado, registro de bases ante la AAIP).
Es un foso competitivo *y* una obligación. Los que ya la tienen —Psicospace
publicita notas cifradas extremo a extremo— ya pagaron ese costo.

### 2.4. Los avisos van por mail y push, no por WhatsApp

`src/lib/emails.ts` + `src/lib/push.ts`. Es una implementación correcta y
además elegante (push cifrado extremo a extremo, así que Google no ve de qué
turno se trata).

Pero en Argentina el canal de confirmación de turnos es WhatsApp. La razón por
la que un profesional paga por software de agenda es reducir el ausentismo, y
el recordatorio que se lee es el de WhatsApp. Turnito, Psicospace, Sesión y
Booksolut lo ofrecen los cuatro. Es la brecha más visible frente a la
competencia y la primera pregunta que te va a hacer cualquier psicólogo en una
demo.

### 2.5. No hay facturación

Ni AFIP/ARCA ni recibos. Brauni lo vende explícitamente como diferencial.
Para el profesional independiente argentino, facturar es dolor real y
recurrente.

---

## 3. El mercado vertical: psicólogos en Argentina

### 3.1. Tamaño

| Nivel | Estimación | Base |
|---|---|---|
| Psicólogos matriculados | ~64.000 | dato de colegios, 2020 |
| En práctica privada activa | ~25.000–30.000 | descontando multi-matrícula, retiro, empleo público |
| Dispuestos a pagar software (SAM) | ~3.000–4.500 | 10–15% de adopción SaaS en profesionales independientes |
| Alcanzable en 2 años (SOM) | ~300–450 | 10% del SAM, repartido entre 8+ jugadores |

Argentina tiene la mayor densidad de psicólogos del mundo (~1 cada 605
habitantes). Eso suena a oportunidad y en parte lo es: hay mucha oferta. Pero
también significa competencia feroz entre profesionales, honorarios
comprimidos y baja disposición a sumar costos fijos.

### 3.2. Ya hay al menos ocho competidores, todos argentinos y todos vivos

| Producto | Posicionamiento | Lo que tiene y PsicoLink no |
|---|---|---|
| **Turnito** | agenda genérica con foco en ausentismo | plan gratis real (3 agendas, 100 reservas/mes), WhatsApp, modelo de 5% de comisión como alternativa |
| **Psicospace** | 100% psicólogos | notas cifradas E2E, WhatsApp |
| **Sesión** (`sesion.com.ar`) | consultorio de psicología | facturación, cobros, WhatsApp |
| **Brauni** | psicólogos, foco administrativo | facturación AFIP, IA clínica, directorio **sin comisión** |
| **Psik** | psicólogos | historia clínica electrónica según Ley 26.529 |
| **Kalyo** | psicólogos AR | expediente clínico digital |
| **Booksolut** | clínicas | módulo clínico, bot de WhatsApp, MercadoPago |
| **Doctoralia** (Docplanner) | marketplace + agenda, multinacional | demanda propia: SEO masivo, es donde el paciente ya busca |

Esto es lo más duro del análisis y quiero ser directo: **PsicoLink no llega
primero, llega noveno, y hoy tiene menos funcionalidad que cualquiera de los
ocho.** Turnito regala gratis lo que PsicoLink hace, y encima con WhatsApp.

Eso no mata al proyecto, pero mata a la estrategia de "agenda para psicólogos"
sin un ángulo que ninguno de los ocho tenga.

### 3.3. Precio de referencia

- Sesión particular: **ARS 25.000–50.000** (mínimos orientativos de colegios,
  2026; CABA llega a 60.000, online ~5.000 menos).
- Turnito plan pago: **~ARS 21.400/mes**, o **5% por transacción** sin fijo.

Un dato útil para pensar precio en un país con inflación: **el ARPU viable de
este software es media sesión por mes.** Más que eso y el profesional hace la
cuenta y se va. Ese es el techo, y no depende del tipo de cambio.

### 3.4. Unit economics del vertical

Asumiendo ARPU = 0,6 sesiones/mes (~ARS 18.000–21.000, alineado con Turnito):

| Escenario | Cuentas pagas | Ingreso mensual | Qué es eso |
|---|---|---|---|
| Sostenerse | 100–130 | ~ARS 2,0–2,7M | un sueldo, proyecto de una persona |
| Negocio chico | 400 | ~ARS 8M | equipo de 2–3, viable y aburrido |
| Escala "startup" (US$1M ARR) | ~5.000 | — | **más que todo el SAM argentino** |

La conclusión numérica es limpia: **el vertical psicólogos en Argentina no
tiene tamaño para un negocio de riesgo. Tiene tamaño para un buen negocio
personal.** Para ARR de startup hay que salir del país (México, Colombia,
España) o salir del vertical. Que es exactamente lo que estás proponiendo en
el punto siguiente.

---

## 4. La tesis nueva: "PedidosYa de profesionales" — PsicolinkYa

> Conectar a cualquier profesional con un cliente por un link de videollamada
> que genera quien presta el servicio, a costos muy bajos.

Es una tesis más grande y más interesante. También es más difícil, y la
analogía con PedidosYa es la que hay que examinar, porque es donde está el
error.

### 4.1. Por qué la analogía no cierra

El activo de PedidosYa no es la app. **Es la flota.** Ese es el moat: hay
comida a 30 minutos porque hay repartidores, y no podés replicar repartidores
por WhatsApp. La app es la interfaz de un negocio de logística.

En PsicolinkYa no hay flota. Lo que se intermedia es *un link de
videollamada*, y un link de videollamada:

- lo genera Google Meet gratis, en dos clics;
- no requiere que nadie se mueva;
- no mejora por tener más volumen en la plataforma.

**Estás cobrando peaje sobre algo que es gratis por afuera.** Ese es el
problema estructural, y no se arregla con producto.

Comparación de las tres variables que hacen o rompen un marketplace:

| | PedidosYa | PsicolinkYa (terapia) | PsicolinkYa (consulta única) |
|---|---|---|---|
| ¿El proveedor es intercambiable? | Sí — hoy sushi, mañana pizza | **No** — es *mi* psicóloga | Sí — cualquier abogado sirve |
| Frecuencia con el *mismo* proveedor | Baja | **Altísima** (semanal, 1–2 años) | Una vez |
| ¿Hay activo físico que no se puede saltear? | Sí, el repartidor | **No** | No |
| Riesgo de fuga fuera de la plataforma | Bajo | **Máximo** | Bajo |

### 4.2. La desintermediación, con números

Terapia es, estructuralmente, **la peor categoría posible para un marketplace
transaccional.** Paciente y psicólogo se ven todas las semanas durante meses o
años, con el mismo profesional. Después de la primera sesión no queda ninguna
razón para volver a pasar por la plataforma: se arreglan por WhatsApp y se
paga por transferencia.

Con un take del 5% sobre una sesión de ARS 35.000, la plataforma se lleva
ARS 1.750 por sesión. Un paciente en tratamiento semanal durante un año son
~48 sesiones: **ARS 84.000 que el profesional ahorra saliéndose.** El incentivo
a fugarse no es marginal, es el sueldo de una semana.

Y esto no es una especulación mía: es el problema conocido de la categoría.
Superpeer cobra 10–15% por sesión y la fuga fuera de la plataforma es su
tensión estructural documentada. Brauni, tu competidor local, ya lo entendió y
lo usa como argumento de venta: directorio **sin comisión por reserva**.

**Corolario duro: en terapia, la comisión por sesión no es cobrable. Solo es
cobrable la suscripción.** Y la suscripción tiene el techo de media sesión por
mes que vimos en §3.3.

### 4.3. Dónde sí funciona el modelo horizontal

La categoría que funciona con comisión tiene tres rasgos, y son exactamente
los opuestos a la terapia:

1. **Consulta única, no relación.** Un abogado para una pregunta puntual, un
   contador antes de un vencimiento, un veterinario a las 3 AM, un técnico
   para diagnosticar algo.
2. **Proveedor intercambiable.** El cliente no quiere *ese* profesional,
   quiere *un* profesional, ahora.
3. **Urgencia o anonimato.** Los dos hacen que el cliente no quiera negociar
   por afuera: quiere la respuesta ya, o no quiere dar su teléfono.

Ese es el modelo JustAnswer, y es un negocio real. Pero notá lo que implica:
**el producto deja de ser la agenda y pasa a ser la demanda.** El valor no
está en organizarle el calendario al profesional; está en traerle un cliente
que no tenía. Y traer demanda es SEO, pauta y marca — es un negocio de
marketing, no de software. El código que tenés hoy es casi todo oferta
(agenda, disponibilidad, perfil) y casi nada demanda.

Segundo problema del horizontal: **destruye el único diferencial que tenés.**
"Software pensado para psicólogos" es un argumento de venta; "software para
cualquier profesional" compite con Calendly, Cal.com y Google Calendar, que
son gratis, mejores y ya los usa todo el mundo.

---

## 5. Veredicto

**El proyecto es técnicamente sólido y comercialmente inviable en su forma
actual.** Los tres motivos, en orden de gravedad:

1. **No puede cobrar.** Un solo token de MercadoPago, sin split de pagos, sin
   `marketplace_fee`. No hay mecanismo de ingreso ni suscripción implementada.
2. **No tiene diferencial.** Ocho competidores argentinos con más features
   —notas clínicas, WhatsApp, facturación— y al menos uno con plan gratis que
   cubre todo lo que hace PsicoLink hoy.
3. **La tesis PedidosYa no aplica a terapia.** Sin activo físico y con máxima
   recurrencia sobre el mismo proveedor, la comisión es incobrable a mediano
   plazo.

Nada de esto significa "abandonar". Significa que el próximo trabajo no es
código, es elegir un camino.

---

## 6. Tres caminos, con lo que cuesta cada uno

### Camino A — Vertical profundo: "el que tiene la historia clínica bien hecha"

Aceptar que es un negocio chico y ganarlo. Sumar notas clínicas cifradas,
WhatsApp, facturación. Monetizar por suscripción, nunca por comisión. Techo:
ARS 8–10M/mes en 2–3 años.

- **A favor:** el mercado existe y paga; ya tenés la mitad del producto.
- **En contra:** llegás noveno, hay que construir tres features grandes para
  empatar, y el techo es un buen sueldo, no una startup.
- **Costo:** 4–6 meses de desarrollo antes de poder vender de verdad.

### Camino B — Horizontal, pero de consulta única (el JustAnswer argentino)

Cambiar la unidad de negocio: no "profesional con agenda", sino "consulta
urgente resuelta ahora". Categorías donde el proveedor es intercambiable
(legal, contable, veterinaria, soporte técnico). Comisión alta (20–30%),
viable porque no hay relación recurrente que proteger.

- **A favor:** mercado grande, comisión defendible, es la tesis que te
  entusiasma.
- **En contra:** es un negocio de generación de demanda, no de software. El
  gasto principal es marketing, no desarrollo. Arranque en frío del lado de
  la demanda, que es la parte cara del problema del huevo y la gallina.
- **Costo:** el código sirve poco; hay que construir matching, guardia de
  disponibilidad y, sobre todo, un motor de adquisición.

### Camino C — Infraestructura: el "Stripe de los turnos con cobro"

No competir por el profesional final. Vender el motor —agenda + slots + cobro
con split + calendario + avisos— a quien ya tiene la demanda: colegios
profesionales, obras sociales, clínicas, plataformas de terapia online que hoy
resuelven turnos con planillas.

- **A favor:** es *exactamente* lo que tu código ya hace bien, y con calidad
  poco común. Sin problema de desintermediación: el cliente es la institución.
  Contratos grandes, pocos clientes.
- **En contra:** ciclo de venta largo, requiere contactos institucionales, no
  hay viralidad.
- **Costo:** Postgres + split de pagos + multi-tenancy. Menos código nuevo que
  A o B.

**Mi recomendación: C, con A como plan B.** El activo real que construiste no
es "una app para psicólogos" — hay ocho. Es un motor de turnos-con-cobro bien
resuelto, con reconciliación de pagos, sincronización de calendario y avisos,
probado y documentado. Eso vale más vendido como infraestructura a quien ya
tiene pacientes que como app en un directorio donde competís con Doctoralia
por atención.

El camino B es el más grande y el más entretenido, pero es un negocio distinto
al que sabés hacer: se gana con presupuesto de pauta, no con ingeniería.

---

## 7. Qué haría en los próximos 90 días

**Antes de escribir una línea más de features:**

1. **Hablar con 15 psicólogos.** No mostrarles la app: preguntarles qué usan
   hoy, cuánto pagan y qué los haría cambiar. Si menos de 3 dicen "esto lo
   pagaría", el Camino A está muerto y te ahorraste 6 meses.
2. **Resolver el split de pagos.** MercadoPago OAuth + `marketplace_fee`. Es
   la única tarea técnica que es condición necesaria en los tres caminos.
3. **Migrar a Postgres y desplegar de verdad.** Sin ngrok, con dominio. Una
   app que no está online no se puede validar.

**Recién después:**

4. Elegir camino y construir lo que ese camino pida (notas clínicas para A;
   matching y adquisición para B; multi-tenancy y API para C).
5. Definir precio anclado a "media sesión por mes", no a un número fijo en
   pesos que la inflación desactualiza cada trimestre.

**La pregunta que ordena todo:** ¿el problema que resolvés es que el
profesional *no tiene agenda*, o que *no tiene pacientes*? Hoy PsicoLink
resuelve el primero, que ya está resuelto por ocho competidores y por Google
Calendar. El segundo es el que la gente paga.

---

## Fuentes

- [Los mejores Software de Turnos para Psicólogos en Argentina 2026 — Turnito](https://turnito.app/blog/los-mejores-software-de-turnos-para-psicologos-en-argentina-2026/)
- [Psicospace — Software de gestión para psicólogos](https://psicospace.app/)
- [Sesión — Gestión de consultorio para psicólogos](https://app.sesion.com.ar/)
- [Brauni — Software para psicólogos: turnos, facturación AFIP e IA clínica](https://brauni.io/)
- [Historia clínica electrónica en Argentina: qué exige la Ley 26.529 — Psik](https://www.psik.com.ar/blog/historia-clinica-electronica-ley-26529)
- [Ley de Protección de Datos Personales para psicólogos (Ley 25.326) — Brauni](https://brauni.io/blog/ley-proteccion-datos-personales-psicologos)
- [Kalyo — Software para psicólogos en Argentina, expediente clínico digital](https://kalyo.io/plataforma-psicologos-argentina/)
- [Mejor Software de Gestión de Turnos para Clínicas 2026 — Booksolut](https://booksolut.com/blog/mejor-software-gestion-turnos-clinicas-2026)
- [Ley 27.706 — Programa Federal Único de Informatización y Digitalización de Historias Clínicas](https://www.argentina.gob.ar/normativa/nacional/ley-27706-380710)
- [Honorarios mínimos orientativos — Colegio de Profesionales de la Psicología](https://colpsilar.com.ar/honorarios-minimos-orientativos/)
- [¿Cuánto cuesta ir al psicólogo en Argentina? Precios 2026 — BuscoPsi](https://buscopsi.com/contenidos/cuanto-cuesta-ir-al-psicologo-en-argentina-precios-2026/)
- [Psicólogos en Argentina: cifras, especialidades y costos — Colegio de Psicólogos SJ](https://colegiodepsicologossj.com.ar/cuantos-psicologos-hay-en-argentina/)
- [Superpeer — One-on-One Expert Video Calls Platform (análisis de modelo y comisiones)](https://saasbm.com/expert-video-calls-knowledge-sharing-platform/)
- [Precios de los planes de Doctoralia PRO](https://pro.doctoralia.es/precios/para-especialistas)
