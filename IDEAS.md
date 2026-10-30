# Ideas a futuro

## Sala TV — versión de prueba preparada (29/09/2026)

- La tarjeta sigue oculta en el menú general; Social mantiene su lugar.
- Acceso de pantalla: `index.html?tvhost=1`; celulares: `tv.html`.
- La TV mantiene la partida y los celulares envían acciones y respuestas.
- Se corrigieron reconexión, selección de broker, respuestas duplicadas y manejo
  con mando. Ver `SALA_TV_PRUEBA.md` para detalles y pruebas.
- `gvelazcamp/gira-y-adivina-tv` contiene el proyecto Android WebView y un workflow
  que compila y publica un APK de prueba en GitHub Releases.
- Sustituye la preparación Bubblewrap/TWA, que dependía de un navegador compatible.
- Pendiente: TV física el fin de semana, correcciones que aparezcan y decisión de
  distribución final en Play Console. No se ha configurado un dominio propio.

Borrador de cosas pensadas para más adelante — nada de esto está
empezado ni decidido en firme, es una lista para no perder la idea.
Cuando se decida hacer alguna, se saca de acá y se hace de verdad.

## ~~Eventos por ciudad~~ ✅ HECHO — en producción para todos

Idea de Gonzalo: agrupar todo bajo una sección nueva "Eventos" en vez
de tener "Partida Diaria" suelta como está hoy.

- La **Partida Diaria actual pasa a ser el Evento 1**: el botón se
  renombra a algo tipo "🎉 Nuevo evento" y adentro sigue siendo la
  misma partida diaria de siempre (no cambia la mecánica, cambia el
  marco/nombre).
- Se agrega un **Evento 2, el "de ciudad"**: cambia cada 24hs, ciudad
  por ciudad (tipo "🎉 Nuevo evento: Durazno"), con frases
  relacionadas a esa ciudad puntual (no categorías al azar como
  ahora). Al terminarlo se abre un **sobre** que da algo (igual que
  los sobres de colección que ya existen).

Cosas a pensar cuando se encare (resueltas):
- [x] Qué dispara que aparezca cada evento de ciudad — rotación diaria
      simple por índice de día (`eventoCiudadDeHoyIdx()`), mismo
      criterio que `ofertaDiaIdx()`.
- [x] De dónde salen las frases "relacionadas con la ciudad" — quedó
      sin resolver del todo: el Evento 2 usa el modo Mundo normal
      (`empezarDestino`), que elige categorías al azar (`categoriasAlAzar`),
      no frases específicas de esa ciudad puntual.
- [x] Qué da el sobre al completarlo — monedas + vida + un premio
      extra que rota por día (ver pool más abajo).
- [x] Cómo se ve la sección "Eventos" en el home — botón celeste
      propio (`bMenuEventosPrueba`), lleva a una pantalla completa
      nueva (`#eventos`), no un popup.
- [x] Qué pasa si no tocás el evento a tiempo — no se pierde, sigue
      disponible con el mismo premio hasta que rote al otro día.

### Referencia: cómo lo hace Pocket Champs (juego de carreras)

Gonzalo lo tiene instalado y mirando la app en vivo ve esto (no sale
así de claro buscando en internet, los blogs oficiales solo hablan de
eventos más grandes tipo "Squad Training" cada 4 semanas o "Gadget
Ascent" cada 2 semanas):

- Cada 24hs hay **Carrera diaria** (da un sobre) + al menos 2
  "Eventos especiales" nuevos corriendo en paralelo, cada uno con su
  propia duración (ej. "Concurso de correr" dura 24hs, y ya se ve
  "Maravillas selváticas" anunciado para arrancar en 24hs más).
- Da la sensación de que hay que completar uno para que se habilite
  otro (progresión/desbloqueo encadenado), no que todos estén sueltos
  a la vez — a confirmar jugando más para entender bien la regla.
- O sea la cadencia real que se siente jugando es mucho más seguida
  (diaria, con overlap) que lo que cuentan las notas de actualización
  oficiales, que solo anuncian los eventos "grandes".
- Gonzalo mandó capturas de la pantalla real de "Eventos" de Pocket
  Champs — la organizan en 3 niveles, de arriba a abajo:
  1. **Eventos en directo**: lo que está pasando/rotando ahora mismo
     (Carrera Diaria, Campo de Entrenamiento) + un próximo evento
     grande con cuenta regresiva para cuando arranca (ej. "Gadget
     Ascent — Empieza en 10d 19h").
  2. **Eventos especiales**: el activo ahora ("Concurso de Correr",
     23h34min restantes, con una barra de progreso de recompensas
     tipo pase de batalla) + el siguiente ya anunciado con cuenta
     regresiva ("Maravillas Selváticas — Empieza en 23h34min").
  3. **Eventos permanentes**: cosas que no rotan, tipo "Rueda de la
     Fortuna" (ganás la carrera y girás para premios) — acá calzaría
     bien meter nuestra ruleta de skins ya calibrada si algún día se
     retoma ese feature.
- Idea/decisión de Gonzalo sobre las recompensas: que lo que se gana
  en estos eventos sea **de bajo valor** — puede ser un avatar o un
  marco (de tablero o de avatar), pero **nunca algo de la gama
  premium** (los ítems de 8000-9500 monedas de la Tienda). La
  recompensa del evento tiene que quedar claramente por debajo de lo
  que se compra con monedas, para no romper la razón de comprar.

Para arrancar (fase 1, sin copiar los 3 niveles todavía): Evento 1
(partida diaria) + Evento 2 (ciudad, con sobre de recompensa barata).
El nivel "permanente" y el de "próximo evento con cuenta regresiva"
quedan para más adelante si esto funciona bien.

**Decidido:** van 2 eventos (fase 1, arriba). Para el arte de los
botones/banners de evento en el home, se reutiliza el marco azul que
ya existe sin usar en `assets/shop/pack-marco-vacio.webp` (mismo
estilo que el Pack Racha pero en blanco) — no hace falta generar arte
nuevo, solo poner ícono + texto de cada evento arriba de ese marco.

### Pool de recompensas para ir variando

Para que la recompensa de los eventos no sea siempre lo mismo,
armamos un pool de premios de bajo valor (nunca nada premium) y de
ahí se va rotando/combinando cuál toca cada vez — referencia: Pocket
Champs varía entre monedas, gemas, tickets, boosts y skins
cosméticas, siempre bajo valor.

Pool para este juego (decidido con Gonzalo):
- 🪙 Monedas (cantidad variable, ej. 100-300)
- ❤️ Vida
- 🖼️ Marco de avatar
- 🖼️ Marco de tablero / ficha
- 🔍 Una Pista gratis (hoy cuesta 🪙150 en la partida — regalarla de
  vez en cuando se siente bien sin regalar nada caro)
- 🎁 Un coleccionable de alguna colección (lo mismo que ya da el modo
  Mundo normal al ganar una ronda)

**Implementado y en producción:** vida+monedas quedan fijas en los dos
eventos, y el premio extra rota por día entre los 4 últimos ítems del
pool (`EVENTO_PREMIOS_ROTAN`), con offset distinto entre Evento 1 y
Evento 2 para que nunca coincidan el mismo día. El coleccionable
siempre es el de la "ciudad del día". Se agregó `meta.pistasGratis`
para que el premio de pista se pueda gastar de verdad en `hostPista()`.

## ~~Dinero real~~ ✅ HECHO — Google Play Billing conectado

La sección "💳 Paquetes con dinero real" ya está visible y conectada
a Google Play Billing de verdad (Digital Goods API + Payment Request
API), con los 6 productos dados de alta en Play Console
(`monedas_500`, `monedas_1350`, `monedas_3500`, `monedas_8500`,
`vidas_llenas`, `vidas_infinitas_24h`). Los 4 paquetes de monedas dan
monedas que sirven para comprar cualquier cosa del catálogo normal
(no hace falta un producto de pago por cada objeto de la tienda).

### Idea pendiente: renombrar la sección a "Ofertas diarias"

Gonzalo quiere que, cuando el juego esté listo para producción real,
la sección "💳 Paquetes con dinero real" pase a llamarse **"Ofertas
diarias"**, y para eso hay que sacar la sección "⏳ Ofertas diarias"
que ya existe (la de moneda gratis / marco dorado / vida / sobre
relámpago), porque no puede haber dos secciones con el mismo nombre.
No hacer este cambio todavía — recién cuando Gonzalo lo pida.

## Idea pendiente: evento temático/estacional

Un evento especial ligado a fechas puntuales (25 de agosto, carnaval,
etc.) con arte propio y tiempo limitado, para generar urgencia real
("solo esta semana"). Distinto del Evento de fin de semana (que es
genérico y se repite todos los sábados/domingos): este tendría fecha
fija y arte específico para cada ocasión. Dejarlo para más adelante —
no hacer todavía.

## Otras cosas ya con base preparada pero sin terminar

- [ ] **Marcos exclusivos por ciudad**: cada ciudad en `COLECCIONES` ya
      tiene un `frameExclusivo` (`frame-durazno`, `frame-salto`, etc.)
      preparado en el código pero sin el arte subido a
      `assets/frames/` todavía — falta generar/subir esas 20 imágenes
      y activarlos.
- [ ] **Pack Pescera / Acuario**: guardar como estilo futuro para un
      pack cosmético completo. Referencia visual: marco cuadrado con
      vidrio azul, centro crema limpio, peces, burbujas, algas, corales,
      estrella de mar y brillo acuático. Puede convertirse más adelante
      en pack con marco de tablero, fondo de tablero, avatar, puntero y
      ruleta del mismo universo visual.

---

## Segunda app independiente: universo Girá y Adiviná

> Plan guardado para el futuro. No implementar hasta que Gonzalo lo pida explícitamente.

#### Estado de este documento

Este archivo es un **plan para futuro**.

NO implementar nada de esto todavía salvo que Gonzalo lo pida explícitamente.

La idea es que, cuando llegue el momento, Codex pueda usar este documento como guía para crear una **segunda app/juego independiente**, conectada conceptualmente con **Girá y Adiviná Rioplatense**, pero sin convertir el juego actual en una app llena de modos distintos.

---

### Idea principal

Mantener:

**Girá y Adiviná Rioplatense**

como juego independiente centrado en:

- ruleta
- frases
- rondas
- eventos
- tienda
- colecciones
- juego online
- Sala TV
- progresión actual

Y crear en el futuro una **segunda aplicación distinta**, aprovechando todo lo aprendido y reutilizando las mejores partes técnicas y visuales del proyecto actual.

Nombre provisional:

**Desafío Rioplatense**

El nombre NO es definitivo.

Puede cambiarse más adelante.

---

### Regla fundamental

La segunda app:

- NO debe reemplazar a Girá y Adiviná
- NO debe mezclarse dentro del mismo juego como un conjunto gigante de minijuegos
- NO debe romper ni transformar la identidad actual de Girá y Adiviná
- debe ser un producto independiente
- puede compartir identidad visual, universo y filosofía
- debe poder enlazarse con Girá y Adiviná

Pensarlo como:

```text
Girá y Adiviná Rioplatense
            ↕
      universo compartido
            ↕
     Desafío Rioplatense
```

---

### Objetivo de la segunda app

Crear un juego fácil de entender, rápido de jugar y con alta variedad.

Debe buscar:

- partidas cortas
- rejugabilidad
- desafíos diarios
- competencia
- juego con amigos
- contenido compartible
- eventos
- coleccionables
- progresión
- razones para volver todos los días

---

### Concepto general

La segunda app puede funcionar como una colección de desafíos rápidos.

Ejemplos de tipos de prueba:

- trivia
- verdadero o falso
- adivinar imágenes
- reconocer lugares
- cultura rioplatense
- fútbol
- música
- ordenar respuestas
- completar palabras
- contrarreloj
- duelo 1 vs 1
- preguntas visuales
- desafíos de ciudades
- pruebas especiales de eventos

No es obligatorio usar todos.

La app debe empezar con pocos modos bien hechos y crecer después.

---

### Posibles módulos

#### 1. Reto del día

Todos reciben el mismo desafío diario.

Puede incluir varias pruebas.

Ejemplo:

```text
RETO DEL DÍA

1. Trivia
2. Imagen
3. Lugar
4. Contrarreloj
5. Pregunta final
```

Al terminar:

- resultado
- tiempo
- racha
- recompensa
- posibilidad de compartir

Ejemplo de resultado:

```text
4/5
01:37
🔥 Racha: 6 días
```

---

#### 2. Trivia rápida

Partidas cortas de preguntas.

Categorías posibles:

- Uruguay
- Argentina
- Río de la Plata
- fútbol
- música
- televisión
- comida
- historia
- lugares
- cultura popular
- curiosidades

---

#### 3. Adiviná la imagen

Mostrar una imagen parcialmente oculta, ampliada o progresivamente revelada.

El jugador debe reconocer:

- ciudad
- lugar
- comida
- objeto
- deportista
- monumento
- bandera
- escudo
- elemento cultural

---

#### 4. Conquistá Uruguay / Río de la Plata

Reutilizar la experiencia aprendida con el mapa de Girá y Adiviná.

Cada ciudad puede tener desafíos propios.

Ejemplo:

```text
Montevideo
├── Trivia
├── Imagen
├── Lugar
└── Desafío final
```

Después se podría expandir a:

- Argentina
- Brasil
- otros países
- Latinoamérica
- mundo

---

#### 5. Duelo 1 vs 1

Partida rápida contra otro jugador.

Ejemplo:

```text
Ronda 1 → Trivia
Ronda 2 → Imagen
Ronda 3 → Contrarreloj
Ronda 4 → Lugar
Ronda 5 → Final
```

Gana quien consigue más puntos.

---

#### 6. Sala TV

Mantener la idea que ya existe en Girá y Adiviná:

- TV como pantalla principal
- celulares como controles
- código de sala
- amigos o familia jugando juntos

La nueva app puede tener pruebas especialmente pensadas para grupo.

---

### Qué reutilizar conceptualmente de Girá y Adiviná

No copiar código a ciegas.

Primero revisar qué partes conviene convertir en módulos reutilizables.

Áreas potencialmente reutilizables:

- perfil
- nombre de jugador
- avatar
- monedas
- vidas
- tienda
- cosméticos
- colecciones
- eventos
- objetivos diarios
- ranking
- amigos
- recompensas
- sonidos
- música
- modales
- sistema de navegación
- Sala TV
- juego online
- almacenamiento local
- conexión con backend/ranking
- PWA
- instalación Android
- service worker
- estructura de assets

---

### Arquitectura futura recomendada

Antes de desarrollar la segunda app, evaluar separar la arquitectura de Girá y Adiviná en componentes reutilizables.

Ejemplo conceptual:

```text
/shared
  perfil.js
  economia.js
  tienda.js
  colecciones.js
  eventos.js
  ranking.js
  audio.js
  online.js
  storage.js
  ui.js

/gira-y-adivina
  juego-ruleta.js
  frases.js
  mundo.js

/desafio-rioplatense
  trivia.js
  imagenes.js
  reto-diario.js
  duelos.js
  mapa.js
```

Esto es solamente una referencia.

Codex deberá analizar la arquitectura real del repositorio antes de decidir cómo hacerlo.

---

### MUY IMPORTANTE: no refactorizar Girá y Adiviná sin permiso

Cuando se empiece este proyecto:

NO hacer una refactorización gigante del juego actual automáticamente.

Primero:

1. analizar el repo
2. identificar qué puede reutilizarse
3. proponer una estrategia
4. crear la segunda app de forma segura
5. tocar Girá y Adiviná solamente cuando sea necesario y con autorización explícita

Regla:

**No romper lo que ya funciona para conseguir reutilización técnica.**

---

### Relación entre las dos apps

Las apps deben estar conectadas visualmente y mediante enlaces.

#### En Girá y Adiviná

Agregar en el futuro una sección tipo:

```text
🌎 MÁS JUEGOS

Desafío Rioplatense
Probá un nuevo desafío
```

Al tocar:

- si la segunda app está instalada → abrirla
- si no está instalada → llevar a su página correspondiente

---

#### En la segunda app

Agregar:

```text
🎡 GIRÁ Y ADIVINÁ

Jugá al clásico de la ruleta
```

Al tocar:

- abrir Girá y Adiviná si está instalado
- o llevar a su página de instalación

---

### Deep links / App Links

Para conectar ambas aplicaciones, evaluar:

- Android App Links
- deep links
- enlaces web/PWA
- fallback a Play Store o página web

No implementar hasta conocer:

- dominio definitivo
- package names
- URLs finales
- forma de distribución

---

### Identidad compartida

Las apps pueden sentirse parte del mismo universo.

Compartir conceptos como:

- azul nocturno
- violeta oscuro
- dorado
- rosa/magenta
- celeste
- estética rioplatense
- ilustración 3D premium
- personajes/avatares
- lenguaje visual

Pero la segunda app debe tener personalidad propia.

No hacer una copia visual exacta.

---

### Posible ecosistema futuro

La idea puede crecer a varias apps:

```text
UNIVERSO RIoplatense

├── Girá y Adiviná
├── Desafío Rioplatense
├── futuro juego 3
└── futuro juego 4
```

Cada juego independiente.

Todos pueden promocionarse entre sí.

---

### Posible cuenta compartida

Más adelante se puede evaluar una cuenta común para todas las apps.

Podría compartir:

- nombre
- avatar
- amigos
- logros globales
- identidad del jugador

Pero NO asumir desde el principio que:

- monedas
- vidas
- compras
- inventarios

deben ser compartidos.

Eso requiere una decisión de diseño y economía.

---

### Recompensas cruzadas

Posible función futura:

```text
Jugá Desafío Rioplatense
y desbloqueá un cosmético
en Girá y Adiviná.
```

O al revés.

Ejemplos:

- avatar exclusivo
- marco
- título
- ficha
- fondo
- insignia

Usar con moderación.

No obligar al jugador a instalar otra app para poder disfrutar normalmente del juego principal.

---

### Objetivo de atracción y retención

La nueva app debe buscar tres cosas:

#### 1. Entenderse rápido

El jugador debe comprender qué hacer en pocos segundos.

#### 2. Partidas cortas

Idealmente permitir jugar aunque alguien tenga solamente unos minutos.

#### 3. Motivo para volver

Ejemplos:

- reto diario
- eventos
- rachas
- ranking
- nuevas ciudades
- colecciones
- recompensas
- desafíos semanales

---

### Compartir resultados

Priorizar resultados fáciles de compartir.

Ejemplo:

```text
DESAFÍO RIOPLATENSE

🧠 4/5
⏱️ 01:37
🔥 Racha 6

¿Me ganás?
```

El contenido compartido NO debe revelar automáticamente las respuestas.

---

### Tienda

La segunda app puede reutilizar la filosofía de tienda de Girá y Adiviná.

Posibles cosméticos:

- avatares
- marcos
- fondos
- tarjetas de perfil
- efectos de victoria
- animaciones
- títulos
- emotes
- estilos de respuesta
- temas visuales

Evitar que las compras den una ventaja injusta en partidas competitivas.

Priorizar cosméticos.

---

### Eventos

La estructura de Eventos de Girá y Adiviná puede servir de inspiración.

Ejemplos futuros:

- Evento Montevideo
- Evento Carnaval
- Evento Fútbol
- Evento Clásicos
- Evento Verano
- Evento Halloween
- Evento Mundial
- Evento Argentina
- Evento especial de fin de semana

Cada evento puede cambiar:

- desafíos
- recompensas
- estética
- coleccionables

---

### Desarrollo por fases

#### Fase 0 — No hacer todavía

Guardar este documento.

Seguir desarrollando Girá y Adiviná normalmente.

---

#### Fase 1 — Definición

Cuando Gonzalo decida empezar:

- definir nombre
- definir icono
- definir mecánica principal
- definir 2 o 3 módulos iniciales
- definir estética
- decidir si será PWA + Android como Girá y Adiviná

---

#### Fase 2 — Base técnica

Crear un proyecto nuevo.

No desarrollar dentro del mismo `index.html` de Girá y Adiviná.

Preparar:

- estructura de carpetas
- navegación
- perfil
- almacenamiento
- HUD
- audio
- sistema de pantallas

---

#### Fase 3 — Primer modo

Construir solamente un modo completo.

Recomendación inicial:

**Reto del Día**

porque permite probar:

- preguntas
- puntuación
- resultado
- racha
- recompensa
- compartir
- retorno diario

---

#### Fase 4 — Segundo modo

Agregar:

**Trivia rápida**

o:

**Duelo 1 vs 1**

según el comportamiento de los primeros jugadores.

---

#### Fase 5 — Mundo / ciudades

Agregar progresión geográfica solamente después de tener estable el núcleo de juego.

---

#### Fase 6 — Conectar ambas apps

Agregar enlaces cruzados entre:

- Girá y Adiviná
- nueva app

Después evaluar:

- deep links
- recompensas cruzadas
- perfil compartido

---

### Principios para Codex

Cuando este proyecto se active:

1. Leer primero el repositorio completo de Girá y Adiviná.
2. No modificar nada automáticamente.
3. Identificar patrones reutilizables.
4. Separar claramente código reutilizable de código específico de la ruleta.
5. Crear la segunda app como proyecto independiente.
6. No copiar bugs o deuda técnica innecesaria.
7. Mantener compatibilidad móvil desde el comienzo.
8. Diseñar primero para celular.
9. Mantener posibilidad de PC/TV cuando corresponda.
10. Priorizar rendimiento.
11. Evitar dependencias innecesarias.
12. Mantener código fácil de continuar con Codex en futuras sesiones.

---

### Regla de seguridad del proyecto

**NO ROMPER LO QUE FUNCIONA.**

Si una modificación necesaria para la segunda app implica tocar Girá y Adiviná:

- explicar primero qué se necesita tocar
- explicar por qué
- aislar el cambio
- mantener compatibilidad
- no borrar funciones existentes sin una razón concreta

---

### Resumen ejecutivo

La estrategia futura es:

**NO transformar Girá y Adiviná en un mega juego con todos los modos.**

Crear una segunda app independiente, provisionalmente llamada:

**Desafío Rioplatense**

que reutilice lo aprendido con Girá y Adiviná y pueda incorporar:

- Reto del Día
- Trivia
- Imágenes
- Ciudades
- Duelos
- Sala TV
- Eventos
- Ranking
- Colecciones
- Tienda

Ambas aplicaciones estarán conectadas mediante una sección tipo:

**“Más juegos”**

y podrán formar parte de un mismo universo de juegos rioplatenses.

La segunda app debe diseñarse desde el principio para crecer sin tener que reconstruir nuevamente toda la infraestructura.


## Popup de monedas gratis después de Gift de Tienda — PENDIENTE

No activar en producción todavía. La tarjeta de 80 monedas con “Recoger”
permanece en la tienda, sin agregar otro anuncio ni popup automático.

Antes de implementar el popup, Gonzalo quiere definir:
- Cada cuánto aparece y cuánto tiempo dejar entre promociones.
- Cuántos anuncios puede recibir un jugador por sesión o por día.
- Cómo coordinarlo con Gift de Tienda y los demás anuncios para no saturar.
- Si el regalo requiere un anuncio y qué sucede al cancelarlo.

El popup automático y su integración de anuncios quedan fuera de producción
hasta que se acuerde esa planificación.

---

## Ideas para una previa con televisión y celulares — 29/10/2026 (PENDIENTES)

**Estado: solo ideas. No implementar, activar, publicar ni modificar juegos existentes sin autorización explícita.**

Concepto de contexto: una reunión o previa entre amigos, con **Giro como conductor en la TV**, mientras cada participante usa **su propio celular** para responder o votar. Se guardan **tres ideas independientes** para decidir más adelante si se convierten en juegos individuales o en rondas de una misma experiencia.

### 1. La confesión anónima

- **Dinámica:** todos escriben desde su celular una respuesta personal y divertida a la misma pregunta. Las respuestas se envían sin mostrar quién escribió cada una.
- **Ejemplo de pregunta:** «¿Cuál fue la peor excusa que inventaste para no salir?».
- **En la TV:** Giro lee una respuesta por vez, **sin decir el nombre** de su autor.
- **En los celulares:** los demás intentan adivinar qué jugador escribió esa confesión.
- **Momento divertido:** la revelación del autor genera risas, anécdotas y explicaciones espontáneas.
- **Importante:** preservar el anonimato hasta la revelación; no mostrar de antemano quién mandó cada texto.

### 2. Defendé lo indefendible

- **Dinámica:** Giro propone una situación discutible y elige a **dos jugadores** para debatir posiciones contrarias, incluso si no representan sus opiniones personales.
- **Ejemplo de debate:** «¿Está mal revisar el celular de tu pareja?».
- **En la TV:** aparecen los dos jugadores, las posturas que deben defender y el tiempo de intervención.
- **En los celulares:** el resto vota quién defendió mejor su postura, no necesariamente con quién está de acuerdo.
- **Momento divertido:** tener que argumentar a favor de una idea difícil o contraria a la propia opinión.

### 3. ¡Pará, que tengo algo para decir!

- **Dinámica:** después de revelar una votación grupal, cualquier participante puede **pedir la palabra** mediante un botón en su celular.
- **En la TV:** aparece el nombre de quien pidió hablar; Giro le da **15 segundos** para explicar su versión o defenderse.
- **En persona:** el jugador habla normalmente con sus amigos en la previa. **El celular solo pide el turno; no necesita grabar ni transmitir su voz.**
- **Después:** los demás votan desde su celular si le creen o si los convenció, y la TV muestra el resultado.
- **Ejemplo:** la mayoría vota que Martín sería el primero en desaparecer cuando llega la cuenta; Martín pide la palabra y responde: «¡Pero si la última vez pagué yo las pizzas!». El grupo decide si le cree.
- **Momento divertido:** abre espacio a defensas, discusiones espontáneas y risas a partir de lo que votó el grupo.

**Decisión pendiente:** definir más adelante si se presentan por separado o como tres dinámicas dentro de una propuesta de previa con Giro. Por ahora **solo conservar las tres ideas en este documento**.

---

## Idea de pack: Noche de Televisión — 29/10/2026 (PENDIENTE)

**Estado: idea a futuro. Nombre provisional: «Noche de Televisión».** No desarrollar, activar ni modificar el código existente sin pedido explícito.

### Concepto

Un **pack / programa de televisión completo dentro de Girá y Adiviná Rioplatense**, ideal para una previa, amigos o familia. En lugar de entrar y salir de cada juego por separado, los participantes juegan una **competencia continua**, como si estuvieran en un programa real.

- **La TV es el estudio**: escenario, Giro como conductor, presentación de participantes, marcador general y resultados.
- **Cada persona usa su celular como control**: responde, elige opciones o participa según la mecánica de cada desafío.
- **Giro conduce todo el evento**: saluda a los jugadores por sus nombres, presenta los desafíos, anuncia los cambios de ronda y proclama un ganador.
- **Sin salir del programa**: las transiciones van de un juego a otro conservando los participantes y, como idea, un puntaje acumulado.
- **Gran final**: una última prueba de ruleta con presentación de televisión, suspenso y ganador de la noche.

### Apertura imaginada

El estudio se enciende. Aparece Giro y presenta a los jugadores por sus nombres:

> «¡Bienvenidos a la gran noche de Girá y Adiviná! Hoy tenemos cinco desafíos y solamente un ganador».

### Secuencia inicial propuesta

1. **El Rosco** — primer desafío de palabras y respuestas.
2. **Duelo de Conocimiento** — preguntas y competencia entre participantes.
3. **100 Rioplatenses Dicen** — adivinar las respuestas del panel.
4. **Quinto desafío / ronda adicional por definir** — la propuesta original menciona *cinco desafíos*, pero todavía no se eligió cuál será el juego restante ni su posición exacta.
5. **Gran final: la ruleta de Girá y Adiviná** — último enfrentamiento y anuncio del ganador de la noche.

**Importante:** lo anterior es un orden conceptual, no una decisión cerrada sobre reglas, cantidad exacta de participantes, puntajes ni integración técnica. Evaluar la compatibilidad de cada juego con TV y controles desde celulares cuando se decida desarrollarlo.

### Qué lo haría diferente de abrir las extensiones por separado

- La **misma sala y los mismos jugadores** participan durante toda la noche.
- No se vuelve al menú entre juegos; **Giro hace las transiciones** como conductor.
- La TV muestra el espectáculo y los celulares los controles apropiados para cada ronda.
- El programa termina con **un único ganador general**, además de los resultados de cada desafío.
- La idea es un **pack de experiencia**, no necesariamente un juego adicional con mecánica propia.

### Relación con las otras ideas para previa

Este pack es **independiente** de «La confesión anónima», «Defendé lo indefendible» y «¡Pará, que tengo algo para decir!». Más adelante podría evaluarse incluir alguna como ronda especial, pero **no están incorporadas ni decididas por ahora**.

**Pendiente para una futura planificación:** nombre definitivo, duración, número de desafíos, cuál es el desafío faltante, sistema de puntuación, funcionamiento de las salas y viabilidad técnica de integrar todas las extensiones sin alterar su modo individual.

**Regla:** mantener intactos el juego principal, las extensiones y la Sala TV actual hasta que exista autorización expresa para implementar este pack.

## Imágenes guardadas para videos o publicidad (30/10/2026)

- `promo/referencias/ruleta-juego-principal.webp`: captura real del juego principal (Jugar ahora / Jugar online). A la izquierda el tablero (panel de la frase, turno, Girar, Comprar vocal, Resolver, Pista y teclado); a la derecha la ruleta girando con sus valores ($150 a $1000, Quiebra, Pierde turno, Comodín, x2 Premio). Sirve para usarla tal cual en un video o imagen, o para pasársela a ChatGPT como referencia para que dibuje la ruleta igual a la del juego.
