# Cerebro del proyecto — Girá y Adiviná Rioplatense

Memoria técnica y funcional para Gonzalo, Codex y Claude Code.

**Fecha:** 05/10/2026. **Rama examinada:** `main`. **Referencia de origen:** `ed5b812e71917c4208a062a9cbe2fb191d433177`.

## Cómo usar esta memoria

Leer este archivo al comenzar un trabajo y después abrir los archivos fuente del área solicitada. Es una fotografía del repositorio en la referencia indicada; el código posterior puede cambiar. Este documento no se actualiza solo ni garantiza que un asistente lo recuerde sin leerlo.

Las cinco etapas propuestas por Gonzalo se usan como analogía para organizar conocimiento del proyecto. No se agrega inteligencia artificial, un sistema neuronal ni una función nueva al juego.

**Reglas del dueño:** no romper lo que funciona; agregar solo lo pedido; no eliminar ni reescribir código sin autorización; consultar las decisiones de alcance incierto. Conservar indentación, datos, estilos y comportamientos ajenos al pedido. No convertir ideas guardadas en tareas autorizadas.

**Jerarquía de evidencia:** instrucción actual de Gonzalo para decidir qué hacer; código de la revisión actual para determinar qué existe; resultados de pruebas para afirmar qué se comprobó; documentación para contexto; conversaciones anteriores como antecedentes que necesitan confirmación. Una función presente no demuestra que funciona en todos los celulares ni que un servicio externo está configurado.

## 1. Codificación: captar información y decidir qué merece atención

> Tus sentidos captan información y el cerebro decide qué parte merece atención.

En el proyecto, las entradas son el pedido de Gonzalo, el árbol del repositorio, el código, los recursos, los documentos y las pruebas. Registrar hechos con ruta, símbolo y referencia de Git; separar los hechos de las hipótesis.

### Identidad y arquitectura comprobadas

- Repositorio VIVO (desde el 21/10/2026): https://github.com/gvelazcamp/gira-y-adivina-web → sirve el juego en https://girayadivina.com (archivo `CNAME`). Todo cambio del juego va acá (rama + PR a `main`).
- Repositorio anterior: https://github.com/gvelazcamp/gira-y-adivina-rioplatense → ahora su `index.html` es el puente de traslado (`migracion/puente.html`) que cifra la partida guardada en github.io y la manda a `girayadivina.com/migrar.html`; el juego viejo quedó como `juego-anterior.html`. No publicar cambios del juego ahí (ver `migracion/README.md`).
- Play Store (actualizado el 27/10/2026): versión 17 en producción; versión 19 con entrada celular y Android TV disponible para testers internos. La versión 18 exclusiva de TV quedó reemplazada por la 19 combinada.
- Juego de ruleta y frases con cultura rioplatense, mapas, progreso, cosméticos, colecciones, eventos, torneos, opciones sociales y extensiones.
- Aplicación estática de HTML, CSS y JavaScript sin framework ni compilación de producción. El núcleo sigue en `index.html`, con estilos y lógica embebidos; las extensiones tienen módulos propios.
- PWA: `manifest.json`, `sw.js`, iconos y página principal. El manifiesto declara idioma `es-UY`, presentación `standalone`, orientación `any` para respetar el giro del celular y color `#160B24`.
- Android: `.well-known/assetlinks.json` vincula `io.github.gvelazcamp.twa`. El proyecto Android y sus permisos no están en este árbol; no afirmar que un cambio del empaquetado está resuelto aquí.
- Existe `package.json` para pruebas con Playwright. No implica un proceso de build del juego.

### Qué examinar ante un pedido

1. Identificar la pantalla, el modo y el dispositivo afectados.
2. Encontrar el código que controla el comportamiento y sus dependencias.
3. Revisar las claves de guardado, versiones de recursos y pruebas pertinentes.
4. Registrar el alcance exacto. Si es documental, no modificar reglas ni interfaz.
5. Guardar la fuente del hallazgo; no deducir implementación a partir del nombre de un asset.

## 2. Cambios en las conexiones: relacionar las partes del proyecto

> Algunas neuronas empiezan a comunicarse con mayor facilidad entre sí. Esto se llama plasticidad sináptica. Si una conexión se activa repetidamente, puede fortalecerse.

En esta memoria, reforzar una relación significa documentar qué piezas se necesitan mutuamente y confirmar esa relación en el código. No significa cambiar automáticamente la arquitectura.

### Mapa de dependencias

| Área | Fuente y relación que debe conservarse |
|---|---|
| Partida principal | `index.html`: `S` es estado autoritativo del anfitrión; `publicar()` produce `V`; `pintar()` y `pintarTodo()` presentan la vista. |
| Modos | `modo`: `local`, `bot`, `host`, `guest`, `tvhost`, `tvguest`. Revisar todas las ramas afectadas por un cambio compartido. |
| Ruleta | `SEG`, `ETI`, `FONDO`, `TINTA` y lógica de giro en `index.html`. Hay 24 gajos, dos QUIEBRA y dos PIERDE TURNO. La selección tiene condiciones especiales; contar gajos no prueba la frecuencia efectiva de cada contexto. |
| Mapas | `MUNDO_URUGUAY`, `MUNDO_ARGENTINA`, `MUNDO`, `claveMundo()` y progreso. Uruguay y Argentina tienen 21 destinos cada uno. No confundir un id de destino con su nombre visible. |
| Tienda | Funciones `tn*`, confirmaciones, metadatos, propiedad/equipamiento y persistencia en `index.html`. Mantener los ids de productos y cosméticos. |
| Colecciones | `COLECCIONES`, sobres y arte en `assets/collectibles/`. La existencia de una ciudad en el mapa no confirma su colección o sus sellos. |
| Pasaporte | Recursos en `assets/passport/` y lógica correspondiente en `index.html`. Los sellos son distintos de los coleccionables. |
| Extensiones | `extensiones.js`: catálogo `EXTENSIONES`, lobby, apertura, cierre y teclas. `extensiones.css` aporta estilos; cada módulo implementa su juego. |
| Contenido compartido | `duelo-extensiones.js`: `Vistas` guarda contenido visto; `Duelo` maneja encuentros; `sonidoErrorExt` respeta el sonido del juego. |
| Salas de extensiones | `MultiBroker`: cuatro brokers MQTT en paralelo y Supabase Realtime, con descarte de mensajes duplicados. `GYA_VERSION_SALAS` identifica la versión de diagnóstico. |
| Sala principal y TV | `conectar()` en `index.html` usa transporte propio. `sala-tv.js`, `sala-tv.css` y `tv.html` completan la experiencia TV/celular. No aplicar cambios de MultiBroker suponiendo que todos los modos lo usan. |
| Contra Reloj online | `contra-reloj-rioplatense-online.js` sincroniza sala y roles; `contra-reloj-rioplatense-voz.js` transporta voz WebRTC; el módulo principal aporta reglas e interfaz. |
| Juegos de previa | `pantalla-fija.js`: pantalla completa, Wake Lock, confirmación de salida y herramientas comunes de jugadores/invitación. |
| Lectura de pistas | `hablar()` en `extensiones.js` usa Web Speech y coordina la pausa/reanudación de música. La voz disponible depende del dispositivo. |
| Guardado y social | `index.html`: localStorage, `capturarEstadoJuego()`, ranking, usuarios y sincronización Supabase. |
| Distribución | `index.html` carga scripts versionados; `sw.js` precachea el shell y decide cómo actualizar recursos. |

### Catálogo real del lobby

Los 18 juegos siguientes aparecen en `EXTENSIONES`. En esta revisión los flags del núcleo para el lobby, Rueda, Palabra, Rosco, Cien y Ahorcado están en `true`. Esto confirma disponibilidad declarada en código, no una prueba completa de cada juego.

| Juego | Archivo principal | Mecánica y ubicación |
|---|---|---|
| Sopa Fugaz | `sopa-fugaz.js` | Al entrar se elige: Sopa clásica (14×14 con reloj, formas cada 3 niveles, escaleritas desde el 4, dibujos) o Sopa giratoria (las letras se mudan). Palabras que no se repiten nunca. |
| Rueda de Letras | `rueda-de-letras.js` | Unir letras contra el tiempo; datos y diccionario propios. |
| Palabra Secreta | `palabra-secreta.js` | Palabra de 5 letras en 6 intentos. |
| Frases en Giro | `frases-en-giro.js` | Ordenar frases entre giros y señuelos. |
| Memoria en Giro | `memoria-en-giro.js` | Encontrar pares antes de que giren. |
| El Rosco | `rosco-rioplatense.js` | Resolver palabras a partir de pistas. |
| Silabario Rioplatense | `silabario-rioplatense.js` | Construir respuestas con sílabas del tablero. |
| 100 Rioplatenses Dicen | `cien-rioplatenses.js` | Descubrir respuestas del panel según el tema. |
| Ahorcado Rioplatense | `ahorcado-rioplatense.js` | La ruleta selecciona categoría y se adivina la palabra. |
| Contra Reloj | `contra-reloj-rioplatense.js` | Previa, 4+ jugadores; describir 5 palabras; ronda de 30 s y previa de 3 s. Módulos separados para online y voz. |
| Impostor | `impostor.js` | Previa, 3+ jugadores; una persona no recibe la misma palabra. |
| Mímica rioplatense | `mimica.js` | Previa, 4+ jugadores; actuar para que el equipo adivine. Dificultades Fácil +1 / Media +2 / Difícil +3 elegidas en el menú (una o varias) y frases al azar de esas. |
| Canta la Canción | `canta-la-cancion.js` | Previa; cantar una canción que contenga la palabra. Se graba el canto y un jurado (los demás) vota 👍/👎; sin voz a texto. |
| Tutti Frutti | `tutti-frutti.js` | Previa con celulares y sala (hasta 10 jugadores, `MAXJ`); 3 rondas fijas, tiempos 60/90/120 s, categorías, validación de respuestas, objeciones con respuesta del autor, chat de la sala y música. |
| ¿Quién soy? | `quien-soy.js` | Previa; celular en la frente y adivinar la palabra. Tiempos 30/40/50 s; un toque en cualquier lado = acerté, dos toques = paso. |
| Bomba | `bomba.js` | Previa; decir una palabra y pasar el celular antes de la explosión. |
| ¿Qué número soy? | `que-numero-soy.js` | Previa; número grande con pantalla fija. |
| Moon Tap | `moon-tap.js` | Acierto por timing sobre un aro; está integrado al lobby. |
| Tirame una Birra (Cervecería Durazno) | `cerveceria.js` → `cerveceria.html` (iframe), arte en `assets/cerveceria/` | **Ya NO está en Girá y Adiviná (sacado el 19/10/2026): va a ser una app aparte.** Los archivos quedan en el repo sin enlazar (se abre directo en /cerveceria.html). Tipo Cooking Madness: canillas (toque = se llena sola; mantener apretado = espuma justa con premio/castigo), freidora, plancha, maní, picada, horno de pizza; 6 niveles, clientes con paciencia propia (10 personajes), mejoras con monedas (`gya_birra_*`), banda en vivo, mesas que se llenan, tele con partido. Arranca en el mapa "Ruta Durazno" (bares inventados; solo la Cervecería Durazno se juega, el resto "Próximamente" + "¿Tu bar acá?"). Con el celular parado la escena se gira 90°. |

**Mahjong:** `mahjong-rioplatense.html` es una página independiente. El catálogo explica que está oculto del lobby porque su inicio necesita arreglos. Sus reglas se consultan en `mahjong-rioplatense.md`: pares por asociación, fichas apiladas y modos Espejo/Memoria/Hielo/Reloj. No extender su regla de interfaz sin texto a los demás juegos.

**Archivos alternativos:** `Moon_tap.html`, las páginas HTML individuales de varias extensiones, `assets/worlds/index.html` y `test-lodo.html` existen. No asumir que son la implementación cargada por el lobby; comprobar los `script src` y enlaces actuales antes de editar.

## 3. Consolidación: convertir hallazgos en memoria estable

> El hipocampo es especialmente importante para formar recuerdos nuevos. Con el tiempo, muchos recuerdos se van integrando en distintas zonas de la corteza cerebral.

En el proyecto, consolidar consiste en pasar de un hallazgo puntual a una descripción verificable, con fecha, fuente y estado. Las ideas permanecen como ideas hasta que Gonzalo autorice implementarlas.

### Estado consolidado del juego

- **Progreso:** claves `gya_*` y `larueda_*`; `capturarEstadoJuego()` captura las claves admitidas y la presencia de mapa, respetando `ESTADO_JUEGO_EXCLUIR`. No borrar ni renombrar claves sin tratar la compatibilidad del progreso existente.
- **Supabase:** `gya_ranking` se usa para `global` y `usuarios`, con `estado_juego` y upsert por `grupo,apodo`. También hay inserción de reportes en `gya_reportes_frases`. Supabase Realtime participa en las salas de extensiones. El repositorio no demuestra por sí solo el esquema, las políticas o el estado operativo de la base.
- **Restauración:** existe el flujo `?restaurar_apodo=`. La identidad por nombre no equivale a una cuenta autenticada y no se debe cambiar sin evaluar la compatibilidad.
- **Billing:** `TN_PRODUCTOS_REALES` contiene `monedas_500`, `monedas_1350`, `monedas_3500`, `monedas_8500`, `vidas_llenas`, `vidas_infinitas_30min`, `vidas_infinitas_24h`, `sin_publicidad`. Hay integración Digital Goods API/PaymentRequest, otorgamiento de productos y restauración de sin publicidad. Las compras reales requieren prueba desde la app de Google Play; esta revisión no hizo transacciones.
- **Torneos:** `TORNEO_TICKETS_ENTRADA=5`, temporada definida por `TORNEO_TEMPORADA_MS=10*86400000`; hay premios y lógica de racha. No usar el precio en monedas de conversaciones antiguas como descripción actual.
- **Eventos y futuro:** `IDEAS.md` mezcla funcionalidades marcadas hechas con propuestas pendientes. Su plan de segunda app independiente exige autorización expresa antes de implementar. El popup automático de monedas después de Gift sigue indicado como pendiente y fuera de producción.
- **Caché:** revisión con `CACHE_NAME="gya-cache-v189"`. Assets y recursos externos usan caché primero; otros recursos, red primero con `cache:"no-store"` y fallback. Reemplazar bytes de un asset con el mismo nombre requiere revisar la versión de caché. Los cambios de JS requieren mantener coherentes las URLs versionadas del HTML y el shell.

### Contradicciones documentales detectadas

| Texto anterior | Evidencia actual y cómo recordarlo |
|---|---|
| `CLAUDE.md`: sin `package.json` ni pruebas | Existen `package.json` y 14 archivos de pruebas/auditoría en `tests/`. Consultarlos. |
| `CLAUDE.md`: compras reales todavía stub/pendientes | `index.html` implementa Billing; `IDEAS.md` lo marca conectado. No afirmar compra exitosa sin prueba Android. |
| `CLAUDE.md`: todo Supabase pasa por una tabla | También se usa `gya_reportes_frases` y Realtime. |
| `PLAY_BILLING_SETUP.md`: seis productos | El catálogo de código tiene ocho ids, incluidos 30 min y sin publicidad. Verificar Play Console aparte. |
| Comentarios con cantidades históricas | Verificar arrays y recursos; un comentario no es un inventario actualizado. |

No se corrigieron estos documentos en este trabajo: se registran las diferencias para no perder conocimiento ni ampliar el cambio autorizado.

### Pendientes que sí tienen fuente

| Pendiente | Fuente y límite |
|---|---|
| Voz online en redes difíciles | `CONTRA_RELOJ_VOZ_PENDIENTE.md`: TURN pendiente; existe enganche `window.GYA_TURN_SERVERS`. No publicar credenciales fijas en el cliente. |
| Micrófono en Android si falla | El mismo documento señala revisar `RECORD_AUDIO` en el proyecto Android externo. No se comprobó un fallo en esta revisión. |
| Sala TV en dispositivos reales | `SALA_TV_PRUEBA.md`: pruebas físicas de TV, mando, suspensión y redes pendientes; cierre del anfitrión no recupera partida. |
| **Versión para TV: esperar a que la app esté ACTIVA en producción** (Gonzalo, 16/10/2026) | Gonzalo: "íbamos a esperar que esté activo para subir una versión y hacer todo lo de tenerlo en la TV". Plan: cuando Play apruebe producción y la app esté publicada, subir una versión nueva del APK/AAB preparada para Android TV (lo que pida Play para TV: manifiesto apto para TV, banner de TV, control remoto, capturas de TV) y terminar la Sala TV. Antes de eso NO tocar nada de TV. Ver también la fila de arriba y `SALA_TV_PRUEBA.md`. Revisión de código del 16/10: el lobby de la TV mete sin escapar datos que llegan por MQTT (avatar/nombre de `tv_hola`); arreglarlo en esa tanda. |
| **Contra Reloj: lista de usuarios que lo pueden probar** (Gonzalo, 18/10/2026) | Hoy está oculto para todos menos Gonzalo (soloGonzalo:true). Gonzalo: "después vemos los usuarios, pero así lo prueban solo algunos". Cuando pase los nombres, permitirlo a esa lista de perfiles (además de Gonzalo). No hacerlo antes de que diga quiénes. |
| **Dominio propio en vez de gvelazcamp.github.io** (Gonzalo, 19/10/2026) | Después de que Play apruebe. Gonzalo compra el dominio en sered.net. Plan: GitHub Pages con dominio propio (archivo CNAME + DNS en sered: 4 registros A a 185.199.108/109/110/111.153 y www CNAME a gvelazcamp.github.io; activar "Enforce HTTPS"). ⚠️ Cambia el origen: (1) la app de Android (TWA) apunta a github.io → hace falta AAB nuevo con el dominio nuevo y `.well-known/assetlinks.json` servido en el dominio nuevo; (2) el localStorage es por dominio → los jugadores arrancarían de cero: migrar el progreso (respaldo de Supabase / pase de datos desde github.io) ANTES de mover a nadie; (3) mantener github.io andando (redirección con migración) para quien tenga la app vieja. |
| Inicio de Mahjong | Comentario de `extensiones.js`: mantenerlo oculto hasta corregir el inicio. |
| Segunda app y popup promocional | `IDEAS.md`: propuestas que no deben activarse sin pedido y definición de Gonzalo. |
| Marcos de ciudad y Pack Pescera/Acuario | `IDEAS.md` los menciona como pendientes/futuros. Antes de actuar, volver a contrastar catálogo y assets actuales. |
| Fichas del Mahjong con Ideogram (13/10/2026) | Script de Gonzalo `generar_fichas_ideogram.py` (50 objetos rioplatenses). Se generaron 22 y se acabó el saldo de Ideogram (402 insufficient_funds). Con magic_prompt=OFF salieron casi sin color (solo contorno); la de prueba (mate, magic prompt por defecto) salió bien a color → rehacer las 50 con el magic prompt por defecto, v3 generate-transparent, DEFAULT (~6–9 centavos c/u, ~5 USD). Gonzalo: "dejamos para más adelante". El Mahjong sigue oculto. |
| Registro de testers de Pakistán (12/10/2026) | Se publicó el respaldo cifrado por MQTT (ver Registro de cambios). Si igual no llegan, queda la opción del proxy propio en Cloudflare hacia Supabase. |

## 4. Almacenamiento distribuido: conservar conocimiento donde corresponde

> Un recuerdo puede involucrar varias regiones. Por ejemplo, la imagen de una persona, su voz, su nombre y las emociones relacionadas pueden estar representados en circuitos diferentes.

Este archivo orienta; el código conserva la implementación, los datos conservan contenido, los recursos conservan arte/sonido y las pruebas conservan comprobaciones. Evitar copiar todo el código aquí: esas copias quedarían desactualizadas.

### Dónde vive cada memoria

| Tipo de conocimiento | Lugar de referencia |
|---|---|
| Resumen y navegación del proyecto | `CEREBRO_DEL_PROYECTO.md` |
| Instrucciones históricas de trabajo | `CLAUDE.md`, contrastado con código actual y pedido del dueño |
| Reglas y sistema principal | `index.html` |
| Catálogo, estilos y funciones de extensiones | `extensiones.js`, `extensiones.css`, módulos específicos |
| Palabras/pistas/respuestas | `*-datos.js`, diccionario de Rueda y `assets/diccionario/` |
| Pruebas y auditoría de contenido | `tests/`, `package.json`, `AUDITORIA_PALABRAS.md` |
| Ideas y decisiones de futuro | `IDEAS.md` |
| Voz, TV y pagos | Documentos específicos y sus implementaciones |
| Arte y sonidos | `assets/`, `img/`, logos e iconos de la raíz |
| Estilo para nuevos assets | `assets/**/PROMPT*.md` |
| Instalación, caché y vinculación Android | `manifest.json`, `sw.js`, `.well-known/assetlinks.json` |
| Licencias y privacidad | `THIRD_PARTY_NOTICES.md`, licencias de terceros y `privacidad.html` |

### Reglas de contenido y visuales

- `CLAUDE.md` exige que las respuestas únicas de Ahorcado, Contra Reloj, Impostor, Mímica, Quién soy, Rosco, Silabario y Sopa Fugaz no se repitan entre juegos ni dentro de ellos; también controla pistas/preguntas/frases. Las excepciones del auditor generan avisos para Cien, Canta, Palabra y Rueda.
- Prioridad documentada para conservar una respuesta: Rosco > Silabario > Ahorcado > Sopa Fugaz > Contra Reloj.
- Después de cambiar contenido: `node tests/auditar-palabras.cjs --md`; revisar el informe generado y corregir errores antes de subir.
- `Vistas` conserva el historial de contenido mostrado hasta agotar cada banco; no quitarlo al agregar niveles.
- Para arte, leer el PROMPT del tipo correspondiente. Preservar el exterior oscuro de los marcos de letra. Una imagen por objeto cuando Gonzalo pida assets separados. Distinguir marcos, fondos, sellos y coleccionables.
- No inventar lugares o elementos de una ciudad como si fueran reales; verificar referencias cuando se cree arte geográfico.
- **REGLA DE GONZALO (19/10/2026): el deslizado (scroll) NUNCA se toca.** Nada de `overscroll-behavior`, `touch-action`, `scroll-snap`, `scroll-behavior`, `overflow` en html/body ni listeners de touch/wheel que frenen el deslizar en las pantallas del juego. Si algo parece pedirlo (p. ej. la recarga al deslizar hacia abajo), preguntarle antes a Gonzalo. Los juegos con PantallaFija/canvas propios (Puzzle, Bomba, etc.) manejan su propio toque y no cuentan.
- **REGLA DE GONZALO (ruleta de la partida):** el PRIMER giro de cada partida nunca es PIERDE TURNO ni QUIEBRA, y nunca salen dos "malos" seguidos (PIERDE TURNO o QUIEBRA, de cualquier jugador). Vale en todos los modos (máquina, sala de a dos, Sala TV, local): todos los giros pasan por hostGirar() (index.html), con S.girosHechos y S.ultimoMalo.
- Para audio, revisar referencias existentes antes de sustituir una pista. No borrar música o sonidos de otras extensiones por cambiar una sola.

## 5. Recuperación: encontrar y reactivar el contexto necesario

> Cuando recordás algo, el cerebro reactiva parte de ese patrón de neuronas.

En el proyecto, recuperar significa usar este índice para abrir el código y las decisiones relevantes, comprobar si siguen vigentes y trabajar solo en el alcance pedido.

### Índice de búsquedas rápidas

| Pedido | Empezar por |
|---|---|
| Cambiar giro, quiebra, letras o turnos | `SEG`, `publicar`, `pintar`, `S`, `V`, `modo` en `index.html` |
| Agregar una extensión | `EXTENSIONES`, flags en el núcleo, scripts del HTML, CSS y `APP_SHELL`; seguir el contrato `abrir`/`salir` existente |
| Cambiar una extensión | Su módulo, `*-datos.js`, estilos con prefijo propio, pruebas de ese juego |
| Fallo al entrar a una sala | Distinguir juego principal/TV, Contra Reloj o extensiones/Tutti; revisar su transporte específico |
| Problema de voz Contra Reloj | Archivos online/voz y documento de TURN; permisos del dispositivo |
| Compra, cosmético o inventario | `tnPuedeComprar`, `tnEjecutarCompra`, confirmaciones, helpers de propiedad y claves de equipamiento |
| Dinero real | `TN_PRODUCTOS_REALES`, `tnInicializarBilling`, `tnComprarReal`, `tnOtorgarProductoReal`, `tnRestaurarCompras` |
| Progreso, ranking o recuperar usuario | `capturarEstadoJuego`, `ESTADO_JUEGO_EXCLUIR`, `empujarUsuario`, `empujarRanking`, `restaurar_apodo` |
| Ciudad o colección faltante | Comparar mundo, `COLECCIONES`, pasaporte y recursos; no deducir uno a partir de otro |
| Teléfono muestra versión vieja | URLs `?v=`, `APP_SHELL`, `CACHE_NAME`, estrategia del service worker |
| Propuesta nueva | `IDEAS.md` y autorización actual; no implementar planes futuros por iniciativa propia |

### Verificación que corresponde a cada cambio

Hay scripts npm `test:tv`, `test:mobile`, `test:background`, `test:escudos`, `test:sopa`, `test:rueda`, `test:palabra`, `test:frases`, `test:memoria`, `test:social`. Otros tests existentes se invocan directamente con Node. Leer sus requisitos antes de ejecutarlos; Playwright necesita navegador disponible. No asumir que todos los archivos tienen un script npm.

Para UI, verificar el modo afectado y el tamaño móvil; para funciones compartidas, cubrir los consumidores afectados. Para voz, compras y TV física, una prueba simulada no reemplaza el dispositivo real.

### Cómo actualizar el cerebro después de un cambio

1. Registrar el pedido y los archivos afectados.
2. Confirmar el comportamiento final en código y con la comprobación pertinente.
3. Actualizar la sección correspondiente; eliminar o marcar como histórico un hecho reemplazado.
4. Añadir fecha, referencia del cambio, decisión, motivo, validación y pendiente real.
5. No declarar resuelto un pendiente externo porque exista una función preparada.

Plantilla para futuras entradas:

```text
Fecha:
Pedido de Gonzalo:
Referencia/commit del cambio:
Archivos y símbolos:
Comportamiento final:
Decisión y motivo:
Comprobación realizada y resultado:
Pendiente o limitación:
```

### Prompt para retomar con otro asistente

```text
Trabajá en gvelazcamp/gira-y-adivina-rioplatense.
Leé CEREBRO_DEL_PROYECTO.md y las instrucciones aplicables.
Después abrí el código actual del área que voy a pedir.
Confirmá las diferencias respecto de la referencia documentada.
No romper lo que funciona. Solo agregar lo pedido.
No elimines código ni implementes ideas pendientes sin autorización.
Actualizá esta memoria con los cambios confirmados y sus pruebas.
Mi pedido es: [describir el cambio].
```

## Registro de esta revisión

- Inventario completo del árbol Git, sin truncamiento: 967 entradas entre archivos y directorios.
- Se obtuvieron 94 archivos propios de código, configuración, documentación y pruebas para inspección textual y búsqueda de relaciones. Las bibliotecas vendorizadas, diccionarios extensos, binarios y ZIP se inventariaron; no se revisaron visualmente todas las imágenes ni se escucharon todos los audios.
- Revisión dirigida de arquitectura, catálogo, dependencias, persistencia, Billing, mapas, salas, caché y documentación. No es una auditoría exhaustiva de errores línea por línea ni una prueba integral de todas las partidas.
- Se ejecutó `node tests/auditar-palabras.cjs`: código de salida 0, cero errores; avisos permitidos de coincidencias en Cien, Canta, Palabra y Rueda.
- No se ejecutaron pruebas de navegador, compras reales, voz en redes difíciles ni TV física: el cambio entregado es documental.
- Este trabajo agrega únicamente `CEREBRO_DEL_PROYECTO.md` al repositorio.

## Anexo: inventario para localizar fuentes

### Archivos propios inspeccionados textualmente

- `.well-known/assetlinks.json`
- `AUDITORIA_PALABRAS.md`
- `CLAUDE.md`
- `CONTRA_RELOJ_VOZ_PENDIENTE.md`
- `IDEAS.md`
- `Moon_tap.html`
- `PLAY_BILLING_SETUP.md`
- `SALA_TV_PRUEBA.md`
- `THIRD_PARTY_NOTICES.md`
- `ahorcado-rioplatense-datos.js`
- `ahorcado-rioplatense.html`
- `ahorcado-rioplatense.js`
- `assets/collectibles/PROMPT-argentina.md`
- `assets/passport/PROMPT-argentina.md`
- `assets/passport/PROMPT.md`
- `assets/punteros/PROMPT.md`
- `assets/ruedas/PROMPT.md`
- `assets/tableros/PROMPT.md`
- `assets/worlds/PROMPT.md`
- `assets/worlds/index.html`
- `bomba.js`
- `canta-la-cancion-datos.js`
- `canta-la-cancion.js`
- `cien-rioplatenses-datos.js`
- `cien-rioplatenses-dicen.html`
- `cien-rioplatenses.js`
- `contra-reloj-rioplatense-datos.js`
- `contra-reloj-rioplatense-online.js`
- `contra-reloj-rioplatense-voz.js`
- `contra-reloj-rioplatense.js`
- `duelo-extensiones.js`
- `extension-ahorcado-rioplatense.md`
- `extension-cien-rioplatenses-dicen.md`
- `extension-palabra-secreta.md`
- `extension-rosco-rioplatense.md`
- `extension-rueda-de-letras.md`
- `extension-sopa-fugaz.md`
- `extensiones.css`
- `extensiones.js`
- `frases-en-giro-datos.js`
- `frases-en-giro.js`
- `impostor-datos.js`
- `impostor.js`
- `index.html`
- `mahjong-rioplatense.html`
- `mahjong-rioplatense.md`
- `manifest.json`
- `memoria-en-giro.js`
- `mimica-datos.js`
- `mimica.js`
- `moon-tap.js`
- `package.json`
- `palabra-secreta-datos.js`
- `palabra-secreta.html`
- `palabra-secreta.js`
- `pantalla-fija.js`
- `privacidad.html`
- `que-numero-soy.js`
- `quien-soy-datos.js`
- `quien-soy.js`
- `rosco-rioplatense-datos.js`
- `rosco-rioplatense.html`
- `rosco-rioplatense.js`
- `rueda-de-letras-datos.js`
- `rueda-de-letras-diccionario.js`
- `rueda-de-letras.html`
- `rueda-de-letras.js`
- `sala-tv.css`
- `sala-tv.js`
- `silabario-rioplatense-datos.js`
- `silabario-rioplatense.js`
- `sopa-fugaz-datos.js`
- `sopa-fugaz.html`
- `sopa-fugaz.js`
- `sw.js`
- `test-lodo.html`
- `tests/auditar-palabras.cjs`
- `tests/background.cjs`
- `tests/cien-rioplatenses.cjs`
- `tests/emergency-shields.cjs`
- `tests/frases-en-giro.cjs`
- `tests/memoria-en-giro.cjs`
- `tests/mobile-ui.cjs`
- `tests/palabra-secreta.cjs`
- `tests/rosco-rioplatense.cjs`
- `tests/rueda-de-letras.cjs`
- `tests/sala-tv.cjs`
- `tests/social-city.cjs`
- `tests/sopa-fugaz.cjs`
- `tests/vale-gift.cjs`
- `tutti-frutti-datos.js`
- `tutti-frutti.js`
- `tv.html`
- `ui-icons.js`

### Recursos y archivos por grupo del árbol

Cantidades de archivos, sin contar directorios. Inventario de presencia, no verificación de cada contenido multimedia.

| Grupo | Archivos |
|---|---:|
| `.well-known` | 1 |
| `assets/audio` | 18 |
| `assets/avatars` | 53 |
| `assets/collectibles` | 197 |
| `assets/compartir` | 6 |
| `assets/decor` | 5 |
| `assets/diccionario` | 25 |
| `assets/eventos` | 4 |
| `assets/expansion` | 6 |
| `assets/extensiones` | 4 |
| `assets/festejos` | 40 |
| `assets/fichas` | 29 |
| `assets/frames` | 10 |
| `assets/logo.webp` | 1 |
| `assets/passport` | 214 |
| `assets/powers` | 7 |
| `assets/punteros` | 9 |
| `assets/ruedas` | 25 |
| `assets/salatv-arranca-jugador.webp` | 1 |
| `assets/salatv-bienvenida.webp` | 1 |
| `assets/salatv-resultados-costura-1.webp` | 1 |
| `assets/salatv-resultados-costura-2.webp` | 1 |
| `assets/salatv-resultados-costura-3.webp` | 1 |
| `assets/salatv-resultados-fondo.webp` | 1 |
| `assets/salatv-ruleta-marco.webp` | 1 |
| `assets/salatv-sorteo.webp` | 1 |
| `assets/shop` | 15 |
| `assets/social` | 8 |
| `assets/splash-tv.webp` | 1 |
| `assets/splash.webp` | 1 |
| `assets/tableros` | 35 |
| `assets/tutorial` | 1 |
| `assets/ui` | 2 |
| `assets/worlds` | 58 |
| `lib` | 2 |
| `raíz` | 105 |
| `store-screenshots` | 5 |
| `tests` | 14 |


## Registro de cambios

```text
Fecha: 04-05/10/2026 (sesión Claude Code, PRs #825–#843)
Pedido de Gonzalo: mejorar juegos de previa.
Cambios confirmados (mergeados en main):
- Mímica (#825–#827): diseño de teatro, equipos con color, metas 10/20/30, dificultades Fácil/Media/Difícil
  (MIMICA_FRASES / MIMICA_MEDIA / MIMICA_DIFICIL en mimica-datos.js) elegidas en el menú; frases al azar.
  Difícil = cosas concretas que se adivinan pero cuesta actuar (Gonzalo rechazó situaciones largas/abstractas).
- Canta la Canción (#828–#836): se canta hasta el final o "Terminé"; jurado vota 👍/👎 (mayoría, empate vale);
  se graba el canto para "Escuchar de nuevo". Se probó voz a texto (SpeechRecognition y Whisper en el
  navegador) y se descartó: en Android grabación y reconocimiento no comparten el micrófono y Whisper tiny
  entendía mal el canto. Decisión de Gonzalo: solo audio.
- Tutti Frutti: partida termina en la 3ª ronda sin "ronda más" (#837); música assets/audio/tutti-frutti-musica.mp3
  (Denis Pavlov Music, Pixabay) mientras se escribe (#840); Wikipedia con control de tipo para marca, famoso,
  película, animal, comida, color y profesión + apellidos raros (#841); objeción: el autor elige "Sí, no vale" o
  "No, la defiendo" (defendida necesita mayoría de TODOS para anularse; botón "👍 Acepto") (#842);
  chat de la sala fuera de la ronda (#843).
- ¿Quién soy? (#838–#839): 1 toque = acerté, 2 toques = paso; tiempos 30/40/50 s.
Comprobación: Playwright con MQTT/micrófono/Wikipedia simulados; auditor de palabras 0 errores.
Pendiente o limitación: validación de Wikipedia no probada contra la Wikipedia real (sin acceso desde el entorno).
```

```text
Guardado sin publicar (Gonzalo: "dejalo guardado en git para después, no lo publiques")
Rama: claude/guardado-cadena-trabalenguas
Contenido: dos juegos de previa terminados — Memoria en cadena (memoria-cadena.js) y Trabalenguas contra reloj
(trabalenguas.js + trabalenguas-datos.js, con grabación y jurado). Memoria en cadena probado; Trabalenguas sin probar.
Publicar solo si Gonzalo lo pide.
```

```text
Aprendizajes de trabajo
- Los scripts de Playwright deben guardar capturas con ruta absoluta en el scratchpad: con ruta relativa
  quedaban en la raíz del repo y se colaron en commits (se borraron en #836 y #840).
- Gonzalo no quiere insignias "Nuevo" en el lobby.
- Juegos de un solo celular: sin sonido al pasar; sonido de error (sonidoErrorExt) solo cuando hace falta.
```

```text
Fecha: 07/10/2026
Pedido de Gonzalo: archivo para la API key de Ideogram (generar imágenes desde Python en su PC).
Archivos: .env.example (plantilla sin key) y .gitignore (agrega .env).
Decisión: la key real va solo en ".env" en la PC de Gonzalo; nunca en el repo ni en el juego (GitHub Pages es público).
```

```text
Fecha: 07/10/2026
Pedido de Gonzalo: completar las colecciones de Argentina que faltaban, mismo sistema que Uruguay (4 por ciudad).
Cambios: 11 colecciones nuevas en COLECCIONES (la-plata, rosario, jujuy, ushuaia, puerto-madryn, villa-carlos-paz,
posadas, santa-fe, purmamarca, san-miguel-de-tucuman, corrientes). Temas = los 4 sellos del pasaporte de cada ciudad
(como Buenos Aires). Imágenes generadas con la API de Ideogram v3 (generate-transparent, QUALITY, prompt de
assets/collectibles/PROMPT-argentina.md + 3 coleccionables existentes como style_reference), recortadas a 700x700 webp.
Gonzalo aprobó el estilo ("seguí así"), aunque es más limpio que el de ChatGPT.
Ideogram: key como "secreto de red" del entorno (header Api-Key para api.ideogram.ai) y dominio ideogram.ai permitido
para bajar las imágenes. Nunca en el repo.
Actualización (mismo día, +3 USD de saldo, modo DEFAULT ≈ 6 centavos por imagen; QUALITY ≈ 9-10 centavos):
se completaron Puerto Iguazú, Gualeguaychú y San Martín de los Andes (14 colecciones de Argentina nuevas en total,
todas las ciudades del mapa argentino tienen colección); se rehicieron rosario/parana, rosario/puente,
puerto-madryn/muelle y ushuaia/tren (nevado, Gonzalo lo aprobó aunque la base no es dorada).
Limitación: varias tienen letras inventadas grabadas en el borde dorado; el muelle de Madryn sigue con un pie raro.
Avisar el costo a Gonzalo antes de generar en lote.
```

```text
Fecha: 07/10/2026
Pedido de Gonzalo: Tutti Frutti "Jugar online" contra bots, como el Jugar online de la rueda.
Cambios: botón "🌐 Jugar online" en tutti-frutti.js. Simula una sala sin red (on.bots=true, on.cli=null):
matchmaking falso con NOMBRES_ONLINE/AVATARES_* de index.html, 2 o 3 bots con habilidad (completa cada
categoría con prob .75-.97) y velocidad (cuándo canta BASTA). Palabras: TUTTI_LISTAS y TUTTI_BOTS (nuevo, en
tutti-frutti-datos.js: famoso, marca, película, cosa). Al cortar, cada bot entrega lo que llegó a escribir;
6% de error de tipeo. Contra bots alcanza el voto del jugador para anular (necesarios()=1); chat oculto.
Comprobación: Playwright, 3 rondas + final, BASTA de un bot y corte por tiempo, sin errores.
```

```text
Fecha: 07/10/2026 — Tutti Frutti online: popup con 3 tipos de rivales (MODOS_BOT): Normal 8-12 s por
categoría, Difícil 5-7 s, Persona mayor 15-25 s (nombres de BOT_MAYORES). +40% en categorías difíciles
(Famoso, Marca, Película, Cosa, Profesión) y letras U/I/J/V. Cada bot escribe categoría por categoría; al cortar
entrega solo las que terminó. Error de tipeo 5% y solo en palabras de más de 6 letras.
```

```text
Fecha: 07/10/2026 — Tutti Frutti: "ver error" sugería cualquier cosa en Marca/Famoso/Película (tomaba el primer
resultado de Wikipedia: Rebook → "Somos calentura"). Ahora sugiere de listas propias (TUTTI_MARCAS nuevo, ~170
marcas, y TUTTI_BOTS) y de Wikipedia solo si el título se parece de verdad (misma distancia fonética que el resto).
TUTTI_MARCAS también acepta directo en Marca.
```

```text
Fecha: 08/10/2026 — Tutti Frutti, correcciones por partida real: (1) el cartel amarillo (mostrarToast) con texto
largo quedaba asomado arriba para siempre (top:-120px fijo); ahora se esconde con translate(-50%,-100% - 50px).
(2) ⚠️ salvada con ✔ se ve en verde "salvada con ✔" (clase tf-salvada; antes seguía ⚠️ aunque sumaba).
(3) +~235 marcas en TUTTI_MARCAS (Panavox, Enxuta, OCA, Columbia, supermercados, bancos, bebidas uruguayas…).
(4) Película/Famoso: plurales sueltos no hacen perder ("Domingos en familia"); nombre y apellido con página de
desambiguación de personas vale ("Carlos Núñez"). (5) "ver error" ya no sugiere algo de otra categoría
(todo terreno → Todoterreno era un auto). Wikipedia no se pudo probar desde la nube (bloqueada).
```

```text
Fecha: 08/10/2026 — Tutti Frutti: las ✓/⚠️ las calcula el anfitrión; si su celular tenía la versión vieja,
marcas uruguayas nuevas (Enxuta, Columbia, Sisi) salían ⚠️ igual. Ahora cada celular, al recibir el resultado,
pasa a ✓ lo que está en sus listas propias (reforzarMarcas/enListaPropia). +~90 marcas uruguayas más.
```

```text
Fecha: 08/10/2026 — Tutti Frutti: TUTTI_PELICULAS nuevo (~250 películas/series, incluye ET, rioplatenses) que vale
directo en "Película o serie" y se usa para sugerir. OCA e Indian ya valen como Marca (desde #853).
```

```text
Fecha: 08/10/2026 — Tutti Frutti: Wikipedia se buscaba con la palabra sin ñ ni tildes ("carlos nunez") y el
buscador no encontraba "Carlos Núñez". Ahora busca con lo escrito tal cual (q en enWikiTipo/enWikipedia/
apellidoEnWiki). TUTTI_FAMOSOS nuevo (~300, muchos uruguayos; vale también el apellido solo) acepta directo.
```

```text
Fecha: 08/10/2026 — Tutti Frutti: iPlace agregada a TUTTI_MARCAS.
```

```text
Fecha: 08/10/2026 — Tutti Frutti: ~100 marcas más sacadas del listado de empresas uruguayas (MEF, SGA 2024) que pasó Gonzalo (Acodike, Mosca, Cementos Artigas, Fanapel, Geocom, Perceli, Sadia, Saceem…).
```

```text
Fecha: 08/10/2026 — Tutti Frutti: +169 jugadores de la selección uruguaya en TUTTI_FAMOSOS (lista que pasó Gonzalo, por partidos jugados).
```

```text
Fecha: 08/10/2026 — Tutti Frutti, Famoso: se probó exigir nombre y apellido para apellidos comunes (#860/#861) y Gonzalo pidió volver atrás: cualquier apellido de un famoso vale solo (González, Rodríguez…). (Corrección: era un malentendido, quedó como en #861).
```

```text
Fecha: 08/10/2026 — Tutti Frutti, regla FINAL confirmada por Gonzalo: en Famoso los apellidos comunes (COMUNES) van con nombre y apellido ("González" solo no, "Brian Rodríguez" sí); Suárez solo vale (Luis Suárez); apellidos raros solos valen (Cavani). En la categoría Apellido valen todos.
```

```text
Fecha: 08/10/2026 — Tutti Frutti con bots: Difícil era lento (con letra difícil cantaban BASTA a los ~64 s y una persona rápida les ganaba sola). Ahora Difícil 3-4,5 s por categoría, Normal 6-9 s, extra por categoría/letra difícil 25% (antes 40%): BASTA ~25-35 s. Los bots responden Famoso/Marca/Película también desde TUTTI_FAMOSOS/MARCAS/PELICULAS (más variedad).
```

```text
Fecha: 08/10/2026 — Tutti Frutti: sumador de puntos en las ⚠️ dudosas (− 0 +, de 5 en 5 hasta 20) en lugar del ✔. Lo usan los demás jugadores (contra bots, vos en todas, incluida la tuya). Mensaje {t:"extra"}; on.extra[a|i] pisa los puntos de esa casilla y la pinta en verde "vale". Pedido de Gonzalo "hasta que solucionemos todas las palabras".
```

```text
Fecha: 08/10/2026 — Tutti Frutti: historial de palabras en amarillo. El anfitrión anota cada ⚠️ de jugadores (no bots) en Supabase gya_ranking grupo "tutti_dudas" (apodo "Categoría|palabra", estado_juego {cat,palabra,veces,jugador,ultima}). Gonzalo lo ve en Más → Pruebas → "Tutti Frutti · palabras en amarillo" (TuttiFrutti.verDudas) con botón Copiar lista. Probado con Supabase simulado; falta confirmar con el real.
```

```text
Fecha: 08/10/2026 — Tutti Frutti: +310 animales en TUTTI_LISTAS.animal (ahora ~560). La página a-z-animals.com que pasó Gonzalo no se pudo abrir desde la nube y está en inglés: se armó la lista en español.
```

```text
Fecha: 08/10/2026 — Tutti Frutti: los 194 países que pasó Gonzalo + nombres comunes (Holanda, Inglaterra, Sudáfrica, Qatar, Myanmar…) en lugar (+62 nuevos). +99 colores (Wikipedia "Anexo:Colores" no se pudo abrir desde la nube; se cargaron de memoria). Colores ~220.
```

```text
Fecha: 08/10/2026 — Tutti Frutti: una ⚠️ con puntos del sumador (extra>0) cuenta como respondida para los demás en puntosRonda (antes el rival seguía con 20 "único"). Palabras del historial aprobadas por Gonzalo: Jaguar, Sussex (servilletas), Nappo (electrodomésticos UY), isla de las tentaciones, inspector de tránsito. Propuesto y no confirmado: ignorar letra suelta al final ("Indian a").
```

```text
Fecha: 09/10/2026 — Tutti Frutti: categorías elegidas en verde con ✓ y las no elegidas apagadas (punteadas). Antes era al revés (amarillo = elegida, verde = no) y confundía.
```

```text
Fecha: 09/10/2026 — Tutti Frutti: NORM ignora apóstrofos ("Greys Anatomy" = "Grey's Anatomy"). Agregadas: Trapiche, H y M/HyM (marcas), Grey's Anatomy / Anatomía de Grey (series).
```

```text
Fecha: 09/10/2026 — Tutti Frutti: +252 famosos (actores 1-250 de la lista IMDb que pasó Gonzalo, quedan 251-1000) y +220 películas/series (las de esos actores, títulos en español).
```

```text
Fecha: 09/10/2026 — Tutti Frutti: +252 famosos (IMDb 251-500) y +222 películas/series. Quedan IMDb 501-1000.
```

```text
Fecha: 09/10/2026 — Tutti Frutti: +257 famosos (IMDb 501-750) y +186 películas/series. Quedan IMDb 751-1000.
```

```text
Fecha: 09/10/2026 — Tutti Frutti: +254 famosos (IMDb 751-1000, lista completa) y +144 películas/series. Totales: ~1440 famosos, ~1000 películas/series.
```

```text
Fecha: 09/10/2026 — Tutti Frutti: el historial de palabras en amarillo oculta las que ya están en las listas propias (enListaPropia), así no quedan las viejas ya corregidas (ej. Bruce Willis).
```

```text
Fecha: 09/10/2026 — Tutti Frutti: en Nombre y País o ciudad, Wikipedia ya no acepta cualquier página con ese título ("González" pasaba como nombre, "Mesa" también). Ahora usa enWikiTipo con TIPOS.nombre (nombre propio/de pila) y TIPOS.lugar (ciudad, país, departamento…). Un apellido de la lista no vale como Nombre (salvo que esté también en la lista de nombres).
```

```text
Fecha: 09/10/2026 — Tutti Frutti: lista de los ~357 apellidos más comunes de Uruguay (apellidos.de, pasada por Gonzalo). +51 apellidos nuevos en la lista (todos valen en Apellido) y +248 en COMUNES (en Famoso solos valen 0, van con nombre y apellido). Excepciones que valen solas en Famoso por ser de un famoso conocido: Suárez, Artigas, Tabárez, Sanguinetti, Quiroga, Bentancur, Páez, Iglesias, Abreu. Miranda, Amaro, Severo, Beltrán, Nieves y Aparicio se agregaron también a nombres para que sigan valiendo en Nombre.
```

```text
Fecha: 09/10/2026 — Tutti Frutti: Fruta o verdura pasó de 150 a ~468 (+318). Base: lista libre dariusk/corpora (foods/fruits y vegetables, en inglés) traducida, más nombres rioplatenses y de otros países (frutilla/fresa, palta/aguacate, choclo/maíz, chaucha/ejote, zapallito, butiá, arazá, mburucuyá, etc.).
```

```text
Fecha: 09/10/2026 — Tutti Frutti: País o ciudad pasó de ~508 a ~2800 (+2300). Uruguay: localidades del INE (censo 2011, data loc_agr_ine del paquete R geouy, RichDeto/geouy). Argentina: zokeber/argentina-json (MIT, ~2100 localidades + provincias, se descartaron las abreviadas con punto). Las que no estén siguen yendo a Wikipedia con control de tipo.
```

```text
Fecha: 09/10/2026 — Tutti Frutti: Comida pasó de ~262 a ~1184 (+930): platos rioplatenses, de Latinoamérica y del mundo, postres, panadería, fiambres, quesos, salsas y golosinas. Regla de Gonzalo: las BEBIDAS NO valen en Comida (se sacaron jugo, té, café, mate, leche, licuado, etc. de la lista y "bebida" del control de tipo de Wikipedia).
```

```text
Fecha: 09/10/2026 — Tutti Frutti: Profesión pasó de ~311 a ~939 (+628): oficios, especialidades médicas, ingenierías, artes, deportes, oficios rioplatenses (canillita, calesitero, payador, murguista, cuidacoches, colectivero) y nuevos (influencer, streamer, community manager). El femenino se acepta solo (abogada → abogado).
```

```text
Fecha: 09/10/2026 — Tutti Frutti: Marca acepta M&M's (m&m, mym, m y m, mms). Famoso: "Mirta" sola NO vale (Gonzalo), tiene que ser "Mirtha Legrand" (también "Mirta Legrand").
```

```text
Fecha: 09/10/2026 — Tutti Frutti: Marca acepta MAC (maquillaje; también "M.A.C" y "Mac Cosmetics").
```

```text
Fecha: 09/10/2026 — Social: cada jugador muestra "🎮 Último juego: <juego> · hace X". anotarUltimoJuego(nombre) guarda gya_ultimo_juego {n,t} en localStorage (viaja solo en el respaldo estado_juego a Supabase). Se anota al abrir cualquier extensión (Extensiones.abrirJuego, incluye invitaciones de Tutti y duelos), al arrancar una partida de la rueda ("Girá y Adiviná", "Girá y Adiviná con amigos", "Sala TV") y al unirse como invitado.
```

```text
Fecha: 10/10/2026 — Social: Gonzalo reportó que gente que se registró hoy no aparecía. Supabase devuelve máximo 1000 filas por pedido y Social pedía todo de una (ordenado por apodo), así que los que quedaban después en orden alfabético no salían (las filas viejas "Jugador N" ocupan lugar aunque se filtren). usrTraerFilas() ahora trae de a 1000 con .range() y pide solo las claves que usa Social (estado_juego->localStorage->>clave, mucho más liviano); si esa consulta falla, vuelve a select("*") paginado. Debajo de la lista se muestra "N jugadores". Recordatorio: solo aparecen quienes completaron perfil (nombre propio, avatar y país Uruguay/Argentina).
```

```text
Fecha: 10/10/2026 — Social: 5 personas se registraron (solo jugaron extensiones) y no aparecían. Registrarse ya alcanza (guardarPerfil → empujarUsuario), no hace falta jugar; no se pudo ver la base desde acá. Diagnóstico agregado: empujarUsuario guarda el resultado en usrSyncEstado (antes tragaba el error). Al abrir Social, si el jugador tiene perfil y no se ve en la lista, se vuelve a registrar y recarga una vez; si sigue sin aparecer muestra "⚠️ Vos todavía no aparecés: <motivo>. Mandale esta captura a Gonzalo." PENDIENTE: ver la captura de alguno de ellos.
```

```text
Fecha: 10/10/2026 — Social: (1) los nombres iguales escritos con otra forma de tilde o espacios de más ("Gastón G" dos veces) cuentan como uno solo (dedupe con normalize NFC + espacios). (2) Gonzalo ve una ✕ al lado de "Invitar": pide confirmación y saca a esa persona SOLO de Social (fila en gya_ranking grupo "social_ocultos" con el apodo exacto; no se borra nada de su cuenta). Para volver a mostrar a alguien, borrar esa fila en Supabase (pedírmelo). El panel "Registros con problemas" quedó guardado en el historial de la rama (commit 7c32844, revertido), sin publicar.
```

```text
Fecha: 10/10/2026 — Social ✕: los sacados volvían a aparecer porque la fila de social_ocultos se mandaba sin monedas_totales/ciudades_ganadas/mejor_racha/logros (la tabla los exige) y el error se tragaba. Ahora manda esos campos en 0 (como tutti_dudas) y, si falla, muestra el motivo en vez de sacarlo solo de la pantalla.
```

```text
Fecha: 11/10/2026 — Social: "Pato" se registró y no aparecía (otra vez gente nueva que no figura). (1) empujarUsuario reintenta cada 5 s (hasta 2 min) si la librería de Supabase todavía no cargó al registrarse (antes se perdía el registro). (2) Publicado el panel Más → Pruebas → "👥 Registros con problemas (Social)" (solo Gonzalo): muestra quién no pudo entrar a Social y el motivo (filas grupo "registro_fallas", con los campos obligatorios en 0) y los últimos 15 conectados con el nombre exacto guardado.
```

```text
Fecha: 11/10/2026 — Tutti Frutti: palabras en amarillo aprobadas por Gonzalo: Apellido Ubillo; Marca Ues, Fixed, Ernex; Famoso Nicky Nicole; Película o serie Cazador/El cazador, Visión nocturna, Solo tú y yo, Un país lejano, Ultratumba; Cosa Sorete, Ukelele. Nueva lista window.TUTTI_COSAS (cosas aprobadas que el diccionario no trae; los bots no las usan). Las demás del historial de ese día quedaron rechazadas.
```

```text
Fecha: 11/10/2026 — Tutti Frutti: Comida + nata, natto/nato, nacatamal (lista de comidas con N que pasó Gonzalo; el resto ya estaba).
```

```text
Fecha: 11/10/2026 — Tutti Frutti: corregir respuestas. Debajo de "Después / Siguiente" aparecen las respuestas ya hechas ("¿Te equivocaste? Tocá para corregir" · Categoría Palabra ✏️); al tocar una vuelve a abrir esa categoría para editarla (lo que se estaba escribiendo queda guardado como con "Después"). Al completar la última categoría sigue cantando BASTA solo. Pendientes que Gonzalo todavía no confirmó: castigo por salir de la app durante la ronda (0 puntos + aviso "salió del juego", margen ~3 s) e ignorar una letra suelta al final ("Gladiador ñ").
```

```text
Fecha: 11/10/2026 — Tutti Frutti: Gonzalo no quiso la lista de respuestas tocables debajo (se sacó). En su lugar, botón "⟵ Anterior" (junto a Después / Siguiente): vuelve a la última categoría confirmada para corregirla (on.hist guarda el orden); al confirmar con Siguiente sigue con la que estaba escribiendo (lo escrito queda guardado). Anterior queda apagado si todavía no confirmó ninguna.
```

```text
Fecha: 11/10/2026 — Tutti Frutti: Gonzalo vio letras repetidas en la revancha. En el código la revancha de la misma sala ya no repetía (on.usadas), pero se perdía si la sala se volvía a crear o la app se recargaba. Ahora el anfitrión guarda las letras salidas en localStorage (gya_tf_letras_usadas) y no se repiten entre partidas/salas hasta que salieron las 20; ahí se reinicia.
```

```text
Fecha: 11/10/2026 — Tutti Frutti: debajo de los puntos de cada ronda y del ganador se muestra "🔤 Ya salieron: A · M · G" (las letras del ciclo, no se repiten hasta que salgan las 20). El anfitrión manda on.usadas en el mensaje "ronda" para que todos vean lo mismo.
```

```text
Fecha: 11/10/2026 — Tutti Frutti: autoaprobación por Gonzalo. Cuando Gonzalo (esGonzalo) sube puntos con el sumador a una palabra en amarillo, queda aprobada para siempre y para todos: fila en gya_ranking grupo "tutti_aprobadas" (apodo "Categoría|palabra normalizada"), cache en localStorage gya_tf_aprobadas. Se cargan al abrir el Tutti (cargarAprobadas) y revisar/enListaPropia las aceptan (después del control de apellidos comunes en Famoso). Lo que sumen otros jugadores NO aprueba (solo cuenta en esa partida y queda en el historial).
```

```text
Fecha: 11/10/2026 — Tutti Frutti: botón "🙋 Apelar" en tus propias palabras en amarillo (solo con amigos, no contra bots). Manda {t:"apela"}; a los demás les aparece "X apela su respuesta · ¿Le sumás los puntos?" con "✅ Sí, vale (+10)" (manda extra como el sumador) o "❌ No vale"; queda en el chat. Si el que dice que sí es Gonzalo, además la palabra queda aprobada para siempre (tutti_aprobadas). No se pudo probar con dos celulares reales desde el entorno (MQTT bloqueado): probado el dibujo y el código.
```

```text
Fecha: 11/10/2026 — Tutti Frutti: el sumador va 0 → 5 → 10 → 20 (y al revés); el 15 no se usa (pasoSuma / PASOS_SUMA). Texto de ayuda: "(5, 10 o 20)".
```

```text
Fecha: 11/10/2026 — Tutti Frutti apelación: con que UNO solo diga "Sí, vale" ya se suman los puntos (como el sumador); a los demás se les cierra el aviso y ven "X ya le sumó los puntos".
```

```text
Fecha: 11/10/2026 — Tutti Frutti (regla de Gonzalo): una apelación aceptada por OTRA persona ("✅ Sí, vale") deja la palabra aprobada para siempre (tutti_aprobadas), sea quien sea el que acepta. El sumador suelto de otros jugadores sigue sin aprobar para siempre (solo Gonzalo).
```

```text
Fecha: 11/10/2026 — Tutti Frutti (regla de Gonzalo): el +/− se sigue viendo en las palabras en amarillo de los demás, pero con amigos SOLO suma si el autor apeló esa palabra (on.apeladas, se marca al recibir "apela"); si no, se ve apagado y avisa "Solo se suma si el que la escribió la apela". Excepciones: Gonzalo puede sumar siempre; contra bots, el jugador suma todo.
```

```text
Fecha: 11/10/2026 — Contra Reloj (Gonzalo jugó online, cada uno con su celular, iPhone y Android mezclados; reloj de arena quieto, la correcta no se ponía verde, la dicha a propósito no se ponía roja):
- Reloj de arena: la arena se mueve con el atributo transform de SVG (antes CSS transform, que en iPhone podía no aplicarse).
- Online: el estado del anfitrión manda su hora (now) y, si a un celular no le llegó la tarjeta de la ronda (mensaje perdido), el reloj arranca igual y pide la tarjeta de nuevo (need_card). Antes quedaba clavado en 30.
- Verde: NUNCA fue automático; lo pone el que describe tocando la palabra. Se agrandó la indicación ("Cuando tu equipo diga una palabra, TOCALA: se pone en VERDE"). Rivales: "tocá ⚠ MARCAR (se pone en rojo)".
- Rojo: el árbitro por voz escucha solo el micrófono del que describe; con la voz online prendida, en Android el micrófono queda ocupado y el árbitro no escucha → ahora lo dice ("ÁRBITRO APAGADO… los rivales marcan a mano").
- Prueba para Gonzalo (Más → Pruebas → "Contra Reloj · prueba con 3 bots"): un celular, vos + Bot Ana vs Bot Beto + Bot Caro; botón para hablar "como el que DESCRIBE" (decir la palabra → ROJO) o "como el que ADIVINA" (→ VERDE). Probado con reconocedor simulado: rojo, verde y reloj OK.
```

```text
Fecha: 11/10/2026 — Contra Reloj online (regla de Gonzalo): todos activan el micrófono, pero durante la ronda solo se transmite el de los jugadores del grupo que juega; los demás quedan cortados ("🔇 Ahora juega otro grupo…") hasta el turno de su grupo. En el lobby y entre turnos, todos hablan. ContraRelojVoz.permitir(v) (track.enabled = !silenciado && permitido).
```

```text
Fecha: 11/10/2026 — Contra Reloj online, verde automático (acordado con Gonzalo): durante la ronda, el celular de cada compañero que adivina ESCUCHA a su dueño (SpeechRecognition) y manda lo que oye al anfitrión ({type:"guess"}); si dice una palabra de la tarjeta, se pone verde sola. Para eso su micrófono se suelta de la llamada durante la ronda (ContraRelojVoz.soltarMic / retomarMic al terminar): el que describe no lo oye, lo ve escrito ("🗣️ Bea dijo: «…» ✓", últimas 4 frases). El que describe sigue pudiendo tocar a mano. Si el celular escuchó por error al que describe, los rivales pueden anular con ⚠ MARCAR también una palabra que ya se puso verde. Rojo sigue siendo por los rivales (⚠ MARCAR). Probado con 4 jugadores simulados (mqtt falso por BroadcastChannel y voz simulada).
```

```text
Fecha: 11/10/2026 — Contra Reloj online: cambiar personas de grupo. El anfitrión ve "⇄ Grupo N" al lado de cada nombre (en la sala de espera y entre turnos, también en la pantalla de juego; nunca en medio de una ronda) y lo pasa al grupo siguiente (moverJugador). Si movía al que iba a describir antes de empezar la ronda, el turno se vuelve a preparar.
```

```text
Fecha: 11/10/2026 — Contra Reloj online: arriba de la jugada, todos ven un cartel con "Grupo N · 🎤 Describe: X · 🙋 Adivina(n): Y" (con "(vos)" en el propio nombre), antes y durante la ronda.
```

```text
Fecha: 11/10/2026 — Tutti Frutti: las categorías se muestran como "Animal / especie" y "Famoso / banda" (las bandas uruguayas como Marka Registrada o Cuarteto de Nos valen en Famoso). Solo cambia el texto que se ve (ETIQ / etiq()); por dentro siguen llamándose "Animal" y "Famoso" para no romper partidas con celulares viejos ni las listas/aprobaciones.
```

```text
Fecha: 11/10/2026 — Tutti Frutti: en Famoso / banda NO valen personajes de ficción (dibujitos, películas, series, historietas, videojuegos): "Correcaminos" pasaba porque Wikipedia lo describe como "personaje" y esa palabra estaba en TIPOS.famoso. Se sacó "personaje" del control y, si la página dice "personaje ficticio / de dibujos animados / de la serie…", no vale como famoso (va en Película o serie). La lista propia de famosos no tiene personajes de ficción (revisado).
```

```text
Fecha: 11/10/2026 — Tutti Frutti: en una partida "apareció la letra y volvió a aparecer". Causa probable: el aviso de ronda llega por varios servidores (MultiBroker: 4 brokers + Supabase) y si uno se atrasa más de 1,5 s no se descarta como duplicado → se volvía a sortear la letra en pantalla y se borraba lo escrito. Ahora un aviso "ronda" con número igual o menor al actual se ignora. Además "Siguiente ronda" y "Revancha" se desactivan al primer toque (evita doble toque).
```

```text
Fecha: 12/10/2026 — Tutti Frutti: Marca + Balenciaga, Burberry, Bershka, Bottega Veneta, Billabong, Benetton, Bentley, Bugatti, Brooks, Birkenstock, BlackBerry (lista con B que pasó Gonzalo; BMW, Bimbo, Burger King, Barbie y BIC ya estaban).
```

```text
Fecha: 12/10/2026 — Tutti Frutti: Marca + Globant, Gartner, Glovo, Guess, Givenchy, Giorgio Armani/Armani, Geox, G-Star, Genesis, GMC, Great Wall, GasGas, Gilera, Grido, Grohe (lista con G de Gonzalo). "Gbarin" no se agregó: no se encontró como marca (preguntar).
```

```text
Fecha: 12/10/2026 — Pantalla de carga con internet lento (una tester de Fiverr mandó captura con el cuadrado del logo vacío y "GIRÁ Y ADIVINÁ"): (1) el logo de la pantalla de carga va dentro del HTML (data URI webp 112 px), ya no espera a bajar icono-192.png; (2) en <head> quedan solo los estilos mínimos de la pantalla de carga y el resto del <style> grande se movió al principio de <body>, después de la pantalla de carga (antes había que bajar ~150 KB de estilos antes de dibujar algo); (3) extensiones.css y sala-tv.css cargan sin bloquear (preload + onload); (4) la barra avanza sola con CSS desde el primer momento; (5) a los 8 s aparece "Cargando… con internet lento puede tardar un poco / Loading… slow connection, please wait". Probado con red simulada a 15 KB/s y en carga normal (inicio y extensiones se ven bien).
```

```text
Fecha: 12/10/2026 — Social / testers: Gonzalo tenía ~11 jugadores nuevos (testers de Fiverr) que no aparecían. Solo aparece quien completó el perfil. Ahora, si alguien abre la app y a los 15 s no tiene perfil, se anota en gya_ranking grupo "sin_perfil" (apodo = id del celular en localStorage "dispositivo_gya"; estado_juego: idioma, Android/iPhone, nombre si lo escribió, fecha). Cuando crea el perfil y se registra bien, ese renglón se borra. En Más → Pruebas → "Registros con problemas / sin perfil" se ve "📱 Abrieron la app sin crear el perfil: N" con la lista.
```

```text
Fecha: 12/10/2026 — Registro en Supabase / Social más firme: (1) supabase-js ahora está guardado en el juego (lib/supabase.min.js, v2.45.4, MIT) y no depende de jsdelivr (si el archivo local falla, prueba jsdelivr); con CDN lento o bloqueado en otro país el registro no llegaba; (2) usuario nuevo que toca "Tutorial" en la bienvenida: primero crea nombre + avatar + país y después arranca el tutorial (antes el perfil se pedía al terminar el tutorial y, si cerraba la app antes, no quedaba registrado); el logro del tutorial se sigue pagando; (3) si el envío a Supabase falla, empujarUsuario reintenta solo cada 20 s (hasta 10 veces). sw.js v258 con lib/supabase.min.js en la caché.
```

```text
Fecha: 12/10/2026 — Social: botón "➕ Agregar jugador a Social" (solo Gonzalo, abajo de la lista). Para testers con perfil completo cuyo celular no llega a Supabase (Hira y Abdullah, Pakistán): Gonzalo escribe el nombre igual que en su celular, elige país y avatar, y se crea su fila en gya_ranking grupo "usuarios" (insert, nunca pisa a alguien que ya existe; estado_juego.agregado_por:"Gonzalo"). Si el celular del jugador algún día conecta, la reemplaza con sus datos reales. El arreglo de fondo (proxy Cloudflare o respaldo por MQTT) sigue pendiente. sw.js v259.
```

```text
Fecha: 12/10/2026 — Registro que no llega a Supabase (Hira y Abdullah, Pakistán, perfil completo): respaldo CIFRADO por los brokers MQTT de las salas, con OK de Gonzalo. El celular de Gonzalo crea la primera vez un par de llaves RSA-OAEP (privada en localStorage "regllave_priv", fuera de gya_/larueda_ para que nunca viaje al respaldo de Supabase) y publica la pública como mensaje guardado en gya-rioplatense/registro/v2/llave. Cada jugador que a los 40 s no confirmó que quedó guardado en Supabase cifra (AES-GCM + RSA) nombre, avatar, país, motivo, Android/iPhone e idioma y lo deja guardado en .../v2/d/<id del celular> (sin nombre en el tema). Al abrir la app o Social, el celular de Gonzalo lo descifra, inserta en grupo "usuarios" a quien falte (nunca pisa; estado_juego.llego_por_respaldo), anota el motivo en "Registros con problemas" y borra el mensaje del broker. Además, botón "➕ Agregar jugador a Social" (solo Gonzalo) para anotar a alguien a mano. Probado con dos celulares simulados (Hira sin Supabase → aparece en Social de Gonzalo, una sola vez). sw.js v260.
```

```text
Fecha: 13/10/2026 — Testers de Nigeria (Victor: Adigun, Daniel, Seun, Gbemi, Lazarus, Kami, Victor) dicen que se registraron y no aparecen; el panel mostraba 10 "(sin nombre)". Arreglos: (1) el respaldo cifrado ahora también sale 40 s después de crear el perfil (antes solo a los 40 s de abrir la app: si tardaba más en registrarse, nunca salía); (2) el renglón "sin perfil" guarda el nombre que esté escribiendo y, al crear el perfil, pasa a decir "✅ ya está en Social" o "❌ <error de Supabase>" antes de intentar borrarse (si el borrado no lo permite el servidor, igual se ve qué pasó). sw.js v261.
```

```text
Fecha: 13/10/2026 — Social (solo Gonzalo): cada jugador muestra desde dónde juega: "📲 App de Play Store" (la TWA abre con referrer android-app://io.github.gvelazcamp.twa; queda anotado en localStorage gya_origen_app y no se pisa después), "🌐 Instalada desde el navegador" (display-mode standalone sin TWA), "🌐 Juega en el navegador" o "❔ Sin dato" (no abrió la versión nueva). Sirve para ver quién cuenta para la prueba cerrada de Google. También viaja en el respaldo cifrado. sw.js v262.
```

```text
Fecha: 13/10/2026 — Rueda de Letras al estilo Words of Wonders (Gonzalo: "no encuentro ninguna palabra, todas van al cajón, no es muy jugable"): (1) las ocultas se arman como crucigrama (armarCruz: la base horizontal y las demás cruzándose; máx. 10×10; se valida que no se formen palabras falsas), cada palabra encontrada destapa sus letras en las cruzadas; (2) botón 💡 Pista: destapa una letra al azar (3 pistas al empezar, guardadas en gya_rueda_de_letras.pistas); si una palabra queda toda destapada cuenta como encontrada sin puntos; (3) cada 3 palabras extra (diccionario o de la lista que no entraron en el crucigrama) = +1 pista; (4) sin reloj en solitario (el duelo 1 vs 1 sigue con reloj y bono de tiempo). Probado: 480 crucigramas generados sin errores. extensiones.css v81, rueda-de-letras.js v12, extensiones.js v39, sw v263.
```

```text
Fecha: 13/10/2026 — Idioma de los menús Español / English (parte 1, para testers de afuera): nuevo i18n.js (cargado primero en <head>). No toca cada pantalla: traduce el texto ya dibujado (nodos de texto y placeholder/title/aria-label, con MutationObserver) buscando la frase exacta en su diccionario EN; los números se reemplazan por # ("🪙 120 monedas" → "# monedas" → "# coins") y los emojis del principio se respetan; también alert/confirm/prompt. Idioma: localStorage gya_idioma; si nunca se eligió, el del celular (es* → español, el resto → inglés). Selector "🌐 Idioma / Language" en ⚙️ Más opciones (cambia y recarga). El cartel de bienvenida (imagen en español) se reemplaza en inglés por una tarjeta HTML con los botones en el mismo lugar; los adornos "Más para disfrutar"/"Pequeños desafíos" se ocultan en inglés. NO se traduce el contenido del juego (frases, dichos, palabras de extensiones, nombres de ciudades/coleccionables) ni #frase ni el chat. Cubre: inicio, perfil, tutorial, carteles diarios, tienda, Social, Más opciones, logros y objetivos. Pendiente parte 2 (mapa, eventos, resto de menús) y parte 3 (menús de extensiones). Para agregar una traducción: sumar "texto exacto en español":"English" al objeto EN de i18n.js. sw v264.
```

```text
Fecha: 13/10/2026 — Tutti Frutti online, corregir respuestas (Gonzalo: "jugué online y no pude poner Anterior para corregir"): antes, al confirmar la última categoría se mandaba ¡BASTA! al instante y no había forma de volver. Ahora, con todo completo aparece una pantalla de revisión con todas las respuestas (tocar una la abre para corregir; al confirmar vuelve a la revisión) y un botón grande "✋ ¡BASTA!" que recién ahí corta la ronda (el reloj sigue corriendo). Además los puntitos de progreso se pueden tocar para saltar a cualquier categoría, y "⟵ Anterior" también funciona desde la revisión. Probado online contra bots. tutti-frutti.js v63, extensiones.css v82, sw v265.
```

```text
Fecha: 13/10/2026 — Tutti Frutti, Marca: + BYM / B&M / B y M / mbyM / BYM Generation (pedido de Gonzalo; varias marcas reales con ese nombre, entre ellas BYM Moda de Maldonado). tutti-frutti-datos.js v34, sw v266.
```

```text
Fecha: 13/10/2026 — Rueda de Letras, palabras del crucigrama (Gonzalo: "¿me vas a poner TOTEM en serio, y MOTA?"): se rehicieron las listas de las 24 ruedas solo con palabras comunes (las que cualquiera piensa jugando) y se sumaron muchas comunes que faltaban (ej. TOMATE: MATE, TEMA, META, TOMA, MATO, TEMO, METO; CAMINOS: CAMINO, CAMION, CASINO, CAMISON, MOCASIN…). Afuera las raras: TOTEM, MOTA, TOME, ARDUO, CAMPA, CAREO, ANTA, CIAN, JARA, LOAR, ACOSE, ROCE, RETA, TARA, etc. elegir() ya no tira error si una rueda no alcanza para el nivel: usa solo las que tienen suficientes palabras comunes. Las palabras de la lista que no entran al crucigrama siguen contando como extra. 480 crucigramas generados sin errores. rueda-de-letras-datos.js v2, rueda-de-letras.js v13, sw v267.
```

```text
Fecha: 13/10/2026 — Rueda de Letras: de 24 a 97 ruedas (Gonzalo: "sumame muchas más, que ahora se entiende"). 73 bases nuevas (CARPETA, CANTERA, ARBOLES, ESCOLAR, MAESTRA, PELOTAS, CORTINA, TRACTOR, REVISTA, MOTORES, etc.). Palabras elegidas así: todas las que se arman con las letras (diccionario an-array-of-spanish-words), filtradas por frecuencia de uso real (wordfreq, zipf ≥ 3,9) y revisadas a mano: afuera nombres propios (RITA, MARTA, LOLA…), inglés (TOP, SET, TEST…), groserías y formas raras. Ruedas posibles por nivel: 1 → 33, 2 → 30, 3 → 58, 4 → 52, 9+ → 36. Probado: 1200 crucigramas sin errores; auditoría de palabras OK. rueda-de-letras-datos.js v3, sw v268.
```

```text
Fecha: 14/10/2026 — Palabra Secreta, compartir por WhatsApp (Gonzalo: "mirá qué raro se ve"): el mensaje traía el link largo .../index.html y WhatsApp armaba una tarjeta gigante con el logo de la ruleta arriba del resultado. Ahora el link es ps.html (página corta con og:image chica de 200 px = assets/compartir/palabra-secreta-og.png, título "Palabra Secreta · Girá y Adiviná") que redirige a index.html?ext=palabra-secreta, o sea abre el juego directo. Texto: "Palabra Secreta 14/10 6/6 + cuadraditos + ¿Me ganás? 👉 link". El "copiar resultado" también lleva el link. palabra-secreta.js v13, sw v269.
```

```text
Fecha: 14/10/2026 — Palabra Secreta, compartir (2ª vuelta, Gonzalo: "tira dos cosas, una con letras y otra sin; sacá la sin letras"): el texto ya no lleva los cuadraditos de colores, solo "🟩 Palabra Secreta 14/10: la saqué en 5/6 ✅" (o "no la saqué ❌") + "¿Me ganás? 👉 link". La tarjeta de WhatsApp ahora dice PALABRA / SECRETA en fichas y "¿Me ganás?" (assets/compartir/palabra-secreta-og2.png; la anterior mostraba MATES/SALSA/ASADO y un amigo creyó que la respuesta era ASADO). palabra-secreta.js v14, sw v270.
```

```text
Fecha: 14/10/2026 — Palabra Secreta: WhatsApp seguía mostrando la tarjeta vieja (ASADO) porque guarda la vista previa por link. El link compartido pasa a ps.html?v=2 (link nuevo = tarjeta nueva). Si algún día se cambia otra vez la imagen, subir ese ?v=. palabra-secreta.js v15, sw v271.
```

```text
Fecha: 15/10/2026 — Rueda de Letras, ideas tomadas de "Colmena" (criptico.es) sin sacar nada de lo que había: (1) cada rueda tiene un TEMA (campo tema en rueda-de-letras-datos.js; 103 ruedas, se sumaron 6 de ❤️ Amor: ROMANCE, AMORES, CORAZON, ABRAZOS, AMANTES, POEMAS) que se muestra arriba ("Tema: 🍅 Verduras") para adivinar más encaminado; la palabra base es del tema y las chicas son palabras comunes con esas letras (no siempre del tema); (2) en los niveles pares (2, 4, 6…) una letra va EN EL MEDIO de la rueda (la que más palabras comunes tiene) y todas las palabras del crucigrama y las extra la tienen que llevar ("Tiene que llevar la O del medio"); Girar no la mueve; (3) RANGOS por puntos dentro de cada rueda con barrita de puntitos: 🐣 Arrancando → 🙂 Va bien → 🔥 Picante → ⭐ Crack → 👑 Maestro (al completar). Probado: nivel 1 con tema, nivel 2 con letra del medio y rechazo de palabras sin ella. rueda-de-letras.js v14, datos v4, extensiones.css v83, sw v272.
```

```text
Fecha: 15/10/2026 — Mapa Argentina sin nada de Uruguay (Gonzalo: "argentina no puede tener nada que diga uruguay"). En el banco FRASES (index.html) cada frase puede llevar p:"uy" (solo Uruguay: categorías Lugar, Localidades de Uruguay, Historia de Uruguay, Cultura uruguaya, Rivera, Geografia y sueltas como Rambla, ómnibus, gurises, murga/candombe/llamadas, chivito, Chajá, Buenos Días Uruguay) o p:"ar" (74 nuevas: "Lugares de Argentina" 40, "Historia argentina" 18, "Cultura argentina" 16). frasesDelMapa() en nuevoMazo: en Argentina nunca sale p:"uy"; en Uruguay no salen las p:"ar" salvo elegir esa categoría a mano. MUNDO_ARGENTINA: "Lugar"→"Lugares de Argentina", "Historia de Uruguay"→"Historia argentina", Buenos Aires y Mendoza con "Cultura argentina". El texto "🔒 Muy pronto… Argentina" pasó a "Cruzá el Río de la Plata y jugá en Argentina". Al sumar frases nuevas uruguayas o argentinas, ponerles p. sw v273.
```

```text
Fecha: 15/10/2026 — Más frases de Argentina (Gonzalo: "agregá buenas frases para argentina"): +138 frases p:"ar" (total 214): Lugares de Argentina 76, Historia argentina 36, Cultura argentina 34 y tres categorías nuevas: "Comida argentina" 28, "Deporte argentino" 17 (Superclásico, Scaloneta, tercera estrella, Pumas, Leonas…), "Dichos argentinos" 23 (al horno, me cayó la ficha, hacer la gamba, laburar, sin un mango…; sin malas palabras ni alcohol). Ciudades de MUNDO_ARGENTINA que usaban categorías genéricas (Viaje/Comida) ahora usan estas: Buenos Aires, La Plata, Rosario, Mar del Plata, Córdoba, Mendoza, Salta, Carlos Paz, Tucumán, Gualeguaychú. sw v274.
```

```text
Fecha: 15/10/2026 — Nuevo juego PUZZLE en Extensiones ("Más juegos", no previa). Gonzalo pasó puzzle.html (rompecabezas en canvas: 12 a 150 piezas, girar piezas, guía, zoom, imagen propia) y pidió sumarlo con logo; "lo vamos a ir afinando". Queda como puzzle.html (página propia, porque usa globales $ y S que chocan con index.html) abierta en un iframe a pantalla completa por puzzle.js (Puzzle.abrir/salir/armados); botón "‹" vuelve al lobby. Se agregó la opción de imagen "Ciudades" (por defecto): fotos de assets/worlds/ de Uruguay y Argentina. Récord: gya_puzzle {armados}. Logo: logo-puzzle.svg. extensiones.js v40, sw v275.
```

```text
Fecha: 15/10/2026 — Puzzle con GUARDADO (Gonzalo: "guardar y seguir después con lo que hicieron"). Se guarda solo (al soltar/unir piezas, al salir con ‹, al cerrar o minimizar) y con el botón "💾 Guardar". Al volver a entrar aparece "Tenés un puzzle a medio armar · N piezas · X% · tiempo" con "Seguir armándolo" / "Empezar otro". Se guarda forma de cada pieza, posición, giro, grupos unidos, tiempo y movimientos en localStorage "pz_partida" (sin prefijo gya_, para no subir la imagen al respaldo de Supabase); si la imagen es de una ciudad va solo el nombre, si no una copia jpg chica. Al terminar el puzzle se borra. Mezclar o cambiar piezas/imagen con uno empezado pide confirmación. puzzle.html v2, puzzle.js v2, sw v276.
```

```text
Fecha: 15/10/2026 — Puzzle: DIBUJOS como primeras imágenes (Gonzalo pasó 5 dibujos). Nueva opción de imagen "Dibujos" (por defecto, con 24 piezas): assets/puzzle/golosinas, playa, espacio, dinosaurios, parque (.webp, 1254×1254). Salen en ese orden, uno distinto en cada puzzle (índice en gya_puzzle.dibujo); "Ciudades" sigue como opción. Como son cuadradas, "24" arma 5×5 = 25 piezas. El guardado guarda solo la ruta del dibujo (campo archivo). puzzle.html v3, puzzle.js v3, extensiones.js v41, sw v277.
```

```text
Fecha: 15/10/2026 — Puzzle: 4 dibujos más (dragon, granja, oceano, selva; la playa que vino repetida no se duplicó). Orden de DIBUJOS: dragón (el primero que arma alguien nuevo: zonas bien distintas —dragón, castillo, arcoíris, flores— ideal para 24), granja, golosinas, océano, selva, dinosaurios, espacio, playa, parque. puzzle.html v4, puzzle.js v4, sw v278.
```

```text
Fecha: 15/10/2026 — Puzzle: la opción "24" pasa a "25" (Gonzalo: "que no haya más 24, que todos sean 25"); los dibujos cuadrados ya armaban 5×5. Guardados viejos con 24 se muestran como 25. puzzle.html v5, puzzle.js v5, sw v279.
```

```text
Fecha: 15/10/2026 — Puzzle: dibujo nuevo "nieve" (muñeco de nieve, assets/puzzle/nieve.webp), 3º en el orden (dragón, granja, nieve, golosinas, océano, selva, dinosaurios, espacio, playa, parque). 10 dibujos. puzzle.html v6, puzzle.js v6, sw v280.
```

```text
Fecha: 15/10/2026 — Puzzle: ventanita "🧩 Cómo jugar" al entrar por primera vez (arrastrar, TOCAR UNA PIEZA PARA GIRARLA, se pega sola, Ver imagen/Guía, pellizcar para zoom, se guarda solo) con botón "¡A armar!"; se vuelve a abrir con el botón ❓ de arriba. Visto = gya_puzzle.tuto. Se sacó el cartelito de ayuda de abajo (tapaba piezas). puzzle.html v7, puzzle.js v7, sw v281.
```

```text
Fecha: 15/10/2026 — Puzzle, comentarios de un tester: (1) la vista previa "Tocá para agrandar" no funcionaba (no tenía código) y tapaba piezas arriba a la derecha → ahora está oculta; "🖼️ Ver imagen" la abre grande y centrada sobre el tablero y se cierra tocándola ("Tocá para volver a armar"). (2) "No mantiene la estética del juego" → colores y letras del resto: violeta (#160B24/#2A1A3C/#46206B), dorado #F5B301, turquesa #37D6C0, letras Outfit y Archivo Black, botones redondos con sombra, mesa violeta. puzzle.html v8, puzzle.js v8, sw v282.
```

```text
Fecha: 15/10/2026 — Puzzle: categoría nueva "Aventuras" (pinturas con mucho detalle, más difíciles): egipto, tren-del-oeste, ciudad-voladora, base-espacial, barcos (assets/puzzle/). Al elegirla sube sola a 49 piezas (7×7). Rotan igual que los Dibujos (índice gya_puzzle.aventura). La opción "48" pasa a "49" (las imágenes cuadradas arman 7×7). Categorías de imagen: Dibujos (fáciles, 25) · Aventuras (49) · Ciudades · Paisaje · Geométrico · Foto · Tu imagen. puzzle.html v9, puzzle.js v9, sw v283.
```

```text
Fecha: 15/10/2026 — Puzzle, Aventuras +5: piratas, torneo-medieval, vikingos, samurai, futbol. Orden: piratas, egipto, torneo medieval, tren del oeste, vikingos, ciudad voladora, samurái, base espacial, fútbol, barcos (10). puzzle.html v10, puzzle.js v10, sw v284.
```

```text
Fecha: 15/10/2026 — Puzzle: la tester extrañó "el cosito de referencia" (la imagen chiquita), que en v8 había quedado solo detrás de "Ver imagen". Vuelve como miniatura chica abajo a la izquierda (86px, borde dorado, 🔍); tocándola se ve grande y se cierra tocando. Además el iframe del Puzzle arranca debajo de la barra del celular (env(safe-area-inset-top)) para que la barra de arriba del juego no quede tapada. puzzle.html v11, puzzle.js v11, sw v285.
```

```text
Fecha: 15/10/2026 — Puzzle: la barra de arriba no entraba en iPhone (se cortaba a la derecha: Mezclar/Guardar/Guía quedaban fuera de pantalla). Ahora son 2 filas centradas que entran enteras: (1) ‹ 🧩 [25 piezas] [Dibujos] ❓ · (2) Girar · 🔀 Mezclar · 💾 Guardar · Guía. El tiempo/% pasó a una pastilla chica arriba a la izquierda del tablero. "Ver imagen" se sacó de la barra (la miniatura de abajo hace eso). Probado en 320, 375 y 800 px. puzzle.html v12, puzzle.js v12, sw v286.
```

```text
Fecha: 15/10/2026 — Puzzle EN PAREJA (cooperativo). Desplegable nuevo arriba: "👤 Solo / 👥 En pareja". En pareja abre el lobby de los duelos (Crear sala / Unirme con código / invitar por WhatsApp con ?duelo=puzzle&sala=XXXX) y los dos arman EL MISMO puzzle a la vez, cada uno en su celular. Cómo sincroniza (puzzle.html, usa parent.Duelo): el que crea la sala manda el puzzle entero (ronda: imagen de assets, formas, posiciones); después cada uno manda el grupo que soltó/unió ("gr", las piezas de ese grupo) y mientras arrastra la posición en vivo ("mv", cada ~110 ms). Si llega algo mientras uno arrastra, se aplica al soltar. Solo el que creó la sala elige piezas/imagen/Mezclar (al otro se le bloquean); "Jugar otro" lo elige él y le llega al compañero. En pareja no se guarda en el celular (no pisa el puzzle propio). Si el otro sale: aviso y seguís solo. Solo imágenes de assets (Dibujos/Aventuras/Ciudades); si el anfitrión tenía otra, arranca un Dibujo. duelo-extensiones.js: cambios mínimos y opcionales (sub/frase en mostrarLobby, invitacionPara, onRivalSeFue, puzzle en DUELO_EXT); la conexión de las salas no se tocó. Probado con dos pestañas simuladas: mismo puzzle, jugadas de los dos a la vez sin perder piezas, terminan juntos, puzzle nuevo compartido, salida del compañero. NO probado con dos celulares reales (el sandbox no llega a los servidores). puzzle.html v13, puzzle.js v13, duelo-extensiones.js v16, sw v287.
```

```text
Fecha: 15/10/2026 — Puzzle EN PAREJA con SALAS QUE DURAN HASTA TERMINAR (Gonzalo: "si me voy, la otra persona sigue armando y si vuelvo sigo donde estaba, sin importar los días"). Reemplaza el modo en pareja anterior (que usaba el lobby de duelos y se cortaba al salir). Ahora: "👥 En pareja" abre una ventana con "Tus salas sin terminar" (código · con quién · % · hace cuánto), "➕ Crear sala con este puzzle" y "Unirme" con código de 5 letras. La sala se guarda en Supabase (gya_ranking, grupo "puzzle_sala", apodo = código; estado_juego {d: puzzle entero, nombres, act, fin}) cada ~1 s después de cada jugada y al salir/minimizar. Cualquiera entra cuando quiere y arma solo; si están los dos a la vez se ve en vivo (MultiBroker, tema gyapuzzle/<código>; "hola"/"todo" al entrar se quedan con el estado más nuevo). Invitación: ?puzzle=CÓDIGO&de=<nombre> (extensiones.js abre el Puzzle y entra a la sala). Dentro de la sala el desplegable es "👥 CÓDIGO / 📲 Invitar / 👤 Salir a solo"; piezas/imagen/Mezclar quedan bloqueados. Al terminar: "¡Lo terminaron juntos!", la sala se marca fin y desaparece de la lista. El puzzle propio (solo) no se toca. Lista local: gya_puzzle_salas. Probado con dos jugadores simulados (servidor falso): crear, salir, el otro entra y arma, volver y ver lo que armó el otro, los dos en vivo, terminar. NO probado con Supabase/celulares reales. Las funciones agregadas a duelo-extensiones.js en v16 quedan pero el Puzzle ya no las usa. puzzle.html v14, puzzle.js v14, extensiones.js v42, sw v288.
```

```text
Fecha: 15/10/2026 — Puzzle en pareja: ELEGIR EL PUZZLE JUNTOS. Al crear la sala (después de invitar) y al unirse a una sala que todavía no tiene puzzle, aparece "🧩 Elijan el puzzle": solo categoría (Dibujos 25 / Aventuras 49 / Ciudades 25) + la imagen de referencia grande con ‹ › para recorrerlas. Los dos celulares ven lo mismo en vivo ("elige"); "✅ Aceptar" ("ok"): si la pareja está conectada arranca cuando aceptan los dos (lo arma el de id menor y lo manda con "nuevo"); si está sola, arranca al toque y la pareja se suma después. La sala se crea sin puzzle (estado_juego.d = null) hasta que se elige. Botón "Salir de la sala" en esa ventana. puzzle.html v15, puzzle.js v15, sw v289.
```

```text
Fecha: 15/10/2026 — Puzzle: textos "en pareja" → "COOPERATIVO" (Gonzalo: "pareja fue un ejemplo"). Desplegable "👤 Solo / 👥 Cooperativo", ventana "👥 Puzzle cooperativo", "📲 Invitá a jugar", "tu compañero". (Internamente el código sigue usando ids "pareja".) puzzle.html v16, puzzle.js v16, sw v290.
```

```text
Fecha: 15/10/2026 — Puzzle cooperativo: AVATARES de los jugadores de la sala, chiquitos arriba a la izquierda (debajo del reloj), con puntito VERDE si está conectado ahora y gris/apagado si no. No bloquean el tablero (pointer-events none). El avatar viaja en cada mensaje (av) y se guarda en la sala (estado_juego.av = {nombre: avatar}) para mostrar también al que no está. El "🟢 nombre" del texto de arriba se sacó (ahora lo dicen las caritas). puzzle.html v17, puzzle.js v17, sw v291.
```

```text
Fecha: 15/10/2026 — Puzzle cooperativo, después de la primera partida real de Gonzalo ("quedó impecable"): (1) ARREGLO "la última ficha queda bailando afuera" (y 98% con el cartel de terminado): los mensajes llegan repetidos/atrasados por los varios servidores y uno viejo movía o separaba piezas. Ahora cada jugada lleva un "reloj de sala" que siempre crece (tick, aunque los relojes de los celulares no coincidan) y cada pieza solo acepta jugadas más nuevas (p.t); grupos fijos se ponen en su lugar exacto; al ganar todas las piezas quedan exactas y se ignora todo lo que llegue después. Probado con red simulada que duplica y atrasa mensajes: los dos terminan 100% sin piezas fuera de lugar. (2) FOTO DEL PUZZLE TERMINADO en el cartel final (tocándola se ve grande) + "📲 Compartir foto": arma una imagen 1080 con el puzzle, piezas · tiempo · con quién y "Girá y Adiviná Rioplatense", y usa compartir del celular (o la descarga si no se puede). (3) "⏸️ Pausar y salir" en el menú de la sala (reemplaza "Salir a solo"): le avisa al compañero ("⏸️ Martina pausó por ahora y salió") y queda en el chat. (4) CHAT de la sala: botón 💬 arriba a la derecha con globito de no leídos y burbujita de 4 s con el mensaje; panel abajo que se abre/cierra, con atajos 👍 🙌 🤔 ⏰ 😂; se guarda en la sala (últimos 40, estado_juego.chat) para el que no estaba; visto por sala en gya_puzzle_chatvisto. puzzle.html v18, puzzle.js v18, sw v292.
```

```text
Fecha: 15/10/2026 — Puzzle: la foto final (cartel, vista grande y la de compartir) ahora es "estilo puzzle": la imagen con el corte de cada pieza marcado en relieve suave (puzzleArmado), no la imagen lisa. puzzle.html v19, puzzle.js v19, sw v293.
```

```text
Fecha: 15/10/2026 — Puzzle cooperativo, elegir: cuando uno acepta un puzzle, al otro lo LLEVA a ese puzzle (aunque estuviera mirando otro) y le pregunta "✅ Juan eligió este puzzle. ¿Aceptás el puzzle de Juan?" con "✅ Sí, acepto" / "❌ No, hablemos por el chat". Sí → arrancan los dos. No → a Juan le avisa ("Martina no aceptó. Hablen por el chat 💬"), queda en el chat "❌ Martina no aceptó Piratas" y a Martina se le abre el chat para escribir. Botón "💬 Chat" también en esa ventana (el chat ahora se abre por encima). puzzle.html v20, puzzle.js v20, sw v294.
```

```text
Fecha: 16/10/2026 — Puzzle con MÚSICA de fondo: assets/audio/puzzle-musica.mp3 = "Puzzle & Casual Game Music" (Sounova Music, Pixabay; Gonzalo la eligió y la mandó; pasada a 128 kbps, 89 s en loop). Suena bajita (volumen .32) desde el primer toque, respeta el sonido del juego (parent.sonidoPermitido), se pausa al minimizar, salir con ‹ o terminar el puzzle, y vuelve con el puzzle siguiente. puzzle.html v21, puzzle.js v21, sw v295.
```

```text
Fecha: 16/10/2026 — Puzzle: categoría nueva "🦸 Héroes" (25 piezas) con 9 imágenes de Gonzalo: princesa-hielo, super-veloz, jaguar, chica-rayo, rey-del-mar, hombre-lava, chica-estelar, viajero-tiempo, gata-nocturna (assets/puzzle/, pasadas de PNG a webp). Está en el desplegable de imagen y en "Elijan el puzzle" del cooperativo. La 10ª (hada del bosque con búho y zorros) vino con los cortes de puzzle ya dibujados (captura de un puzzle terminado): no se agregó; falta que Gonzalo la mande limpia. puzzle.html v22, puzzle.js v22, sw v296.
```

```text
Fecha: 16/10/2026 — Puzzle, Héroes +1: hada-bosque (Gonzalo la mandó limpia, sin cortes). Queda 2ª en el orden de Héroes (10 imágenes). puzzle.html v23, puzzle.js v23, sw v297.
```

```text
Fecha: 16/10/2026 — Puzzle cooperativo, ARREGLOS DE LA ENTRADA tras jugarlo de verdad (Gonzalo + tester): (1) El Puzzle no leía el perfil (perfil es "let" en index.html y no queda en window) → todos eran "Jugador": la invitación decía "¡Jugador te invita…", se veía una sola carita con "J" y el chat salía como Jugador. Ahora index.html expone window.gyaPerfil=()=>perfil y el Puzzle lo usa; nombres "Jugador" viejos se limpian de la sala. (2) Elegir el puzzle no se sincronizaba (ella aceptó y a él no lo llevó a su imagen; él elegía y ella no lo veía; recién al 2º/3er intento): los avisos "elige"/"ok" iban UNA sola vez y se perdían si un mensaje fallaba o si el otro todavía se estaba conectando. Ahora es un estado que cada celular repite cada 2 s ("sel": categoría, imagen, momento del cambio y si aceptó); gana el cambio más nuevo y "aceptó" solo vale para esa misma imagen. Si uno ya arrancó y le llega un "sel", reenvía el puzzle ("nuevo"). Mientras conecta: "🔄 Conectando con la sala…". Si los dos arrancan puzzles distintos sin verse, queda el creado primero (d.creado). Probado con red simulada que pierde 35% de mensajes, los atrasa hasta 1,5 s y uno conecta 4 s tarde: se ven las elecciones, aparece "¿Aceptás el puzzle de Gonzalo?", arrancan los dos con el mismo puzzle y se ven las dos caritas con nombre. puzzle.html v24, puzzle.js v24, sw v298.
```

```text
Fecha: 16/10/2026 — Puzzle SOLO: "🧩 Elegir" (reemplaza "Mezclar") abre "Elegí el puzzle" (la misma ventana del cooperativo, sin chat): categoría + imagen grande con ‹ › para pasar y "▶ Armar este". Los puzzles ya armados quedan EN GRIS con sello "✅ Ya lo armaste" y el botón dice "🔁 Armarlo de nuevo"; arriba dice cuántos armaste de esa categoría. Se guardan en gya_puzzle.hechos ("dibujo:dragon", "ciudad:colonia"…; también los del cooperativo). Al abrir propone el que estás armando o el siguiente sin armar; "Jugar otro" del cartel final abre la ventana en el siguiente sin armar. puzzle.html v25, puzzle.js v25, sw v299.
```

```text
Fecha: 16/10/2026 — Puzzle con 300, 500 y 1000 PIEZAS + categoría "🧠 Gigantes" (solo, no en cooperativo). Primera imagen: mercado-puerto (Gonzalo la hizo con ChatGPT con el prompt de "mucho detalle", 2508 px; webp 1,7 MB, se descarga recién al elegirla). Elegir Gigantes sube a 500 piezas (o 1000). Con imágenes cuadradas: 500 → 22×23 = 506, 1000 → 32×31 = 992. Para que el celular aguante: (1) la resolución de cada pieza se ajusta para que todas juntas ocupen ~36 MB (calidad()); (2) con más de 250 piezas no se arma sombra por pieza; (3) solo se dibujan las piezas que están en pantalla; (4) al agarrar una pieza con 150+ piezas se saca una "foto" del resto (capa) y mientras se arrastra solo se redibuja la de la mano; (5) acomodo inicial más rápido. Zoom máximo según el tamaño de la pieza. Botón 🔲 (con 150+ piezas, sobre los de zoom): junta las piezas de borde sueltas alrededor del marco. Medido en la compu: 1000 piezas se arman en <1 s. FALTA probarlo en celulares reales (gama media). Para más Gigantes: imágenes ≥2000 px con muchísimo detalle (prompt en la charla del 16/10). puzzle.html v26, puzzle.js v26, sw v300.
```

```text
Fecha: 16/10/2026 — Puzzle 500/1000 MÁS FLUIDO (Gonzalo: "se tranca un poco"). Cambios: (1) cada pieza se recorta solo de su pedacito de imagen (antes cada una dibujaba la imagen ENTERA recortada: 1000 veces); con 150+ piezas se recorta directo de la imagen original ya descomprimida (mapa del "cover"), no del lienzo grande. (2) loadImg usa decode() (descomprime fuera del hilo principal). (3) Las piezas se arman de a tandas con "🧩 Armando piezas… 40%" para no congelar la pantalla. (4) Al mover o pellizcar la mesa con 300+ piezas se usa una foto de la pantalla que se desplaza/escala (se renueva cada 300 ms): de ~107 ms a ~12 ms por cuadro. (5) Vista previa y ventana "Elegí el puzzle" usan miniaturas livianas: assets/puzzle/mini/<id>.webp (600 px; al sumar imágenes nuevas, crear también su mini). (6) mercado-puerto achicada a 1900 px (1,2 MB). Medido con CPU simulada 4× más lenta: congelamiento máximo al armar 1000 piezas de 3,4 s → 0,9 s. puzzle.html v27, puzzle.js v27, sw v301.
```

```text
Fecha: 16/10/2026 — Se BORRÓ el "Estadio 3D por pisos" del Puzzle (Gonzalo: "un mamarracho, borralo"). Se revirtió todo (#960): código, imágenes assets/puzzle/estadio/ y mini/estadio/. No retomar esa versión de maqueta dibujada con cajas; si algún día se vuelve a la idea del puzzle 3D, partir de cero y mostrarle antes una prueba a Gonzalo. puzzle.html v29, puzzle.js v29, sw v303.
```

```text
Fecha: 16/10/2026 — Puzzle 3D ENCASTRABLE publicado (categoría "🧊 3D"; en 🧩 Elegir → "🧊 Puzzle 3D: Estadio Centenario encastrable" [hoy "🧊 Puzzles 3D: estadios encastrables", ver entrada del Futurista], o en el desplegable de imagen). Lo que Gonzalo aprobó en la prueba: imagen de la maqueta completa del Centenario hecha con ChatGPT (estilo puzzle 3D de cartón, sin gente) → assets/puzzle/3d/centenario.webp (900 px), cortada en 24 piezas y 5 capas de abajo hacia arriba: cancha (4), pista (6), tribunas y butacas (10), Torre de los Homenajes (2), torres de luz (2). Cada capa aparece al terminar la anterior. TODOS los huecos de la capa se ven con contorno amarillo (no dice cuál va en cuál: hay que adivinar por la forma/dibujo). Las piezas vienen GIRADAS (90/180/270°): tocar = girar 90°, arrastrar = mover; solo encastra derecha en su hueco ("Va ahí, pero está girada"). Clic + vibración + chispitas al encastrar. Progreso guardado en gya_puzzle3d (sigue donde quedó); al terminar: "🏆 ¡Estadio Centenario armado!" + hechos "p3d:centenario". Solo, no cooperativo. Código: módulo P3D en puzzle.html (zonas medidas a mano sobre la imagen). Próximos 3D: Gonzalo está generando un estadio futurista inventado (prompt del 16/10) — con la imagen de la maqueta completa alcanza para cortarlo igual. Reemplaza al "Estadio 3D por pisos" borrado. puzzle.html v30, puzzle.js v30, sw v304.
```

```text
Fecha: 16/10/2026 — Puzzle 3D: SEGUNDO estadio, el ESTADIO FUTURISTA (inventado, imagen completa con entrada hecha por Gonzalo con ChatGPT → assets/puzzle/3d/futurista.webp, 900 px). Ahora la categoría 3D abre un menú "🧊 Puzzles 3D" con los dos estadios (miniaturas en assets/puzzle/3d/mini/, marca "✅ Ya lo armaste" o "▶️ Seguís donde quedaste"). Futurista: 24 piezas en 6 capas, arranca por la base y lo de afuera va al final (Gonzalo: "lo de afuera que sea lo último"): cancha (2), tribunas (4), fachada (3), techo de vidrio (4), arcos (2), explanada y estacionamiento (9). El fondo blanco se vuelve transparente y los cortes que quedan en pedazos separados se parten solos en piezas. Progreso en gya_puzzle3d_futurista; al terminar hechos "p3d:futurista". Mejoras que valen para LOS DOS estadios (motor P3D único en puzzle.html, cada estadio es una entrada de ESTADIOS): huecos oscuros con contorno amarillo grueso que titila (Gonzalo: "lo amarillo no se ve"), zoom (+ − ⤢, pellizco, rueda) y mover la maqueta arrastrando, apaisado = maqueta a la izquierda y piezas a la derecha, y la fotito "🔍 Armado" arriba a la derecha que al tocarla muestra el estadio completo de ejemplo (Gonzalo: "que se vea cómo es armado, de ejemplo"). Ya no se ve el estadio tenue de fondo (Gonzalo: "¿por qué viene todo hecho?"). Para sumar otro estadio: imagen completa + polígonos de las zonas medidos a mano + capas, y mostrarle antes una prueba a Gonzalo. puzzle.html v31, puzzle.js v31, sw v305.
```

```text
Fecha: 16/10/2026 — Estadio Futurista: ARREGLO "no carga, solo se ve la pantalla" en el celular + empieza por la BASE GRIS. Causa: el teléfono recortaba las piezas al abrir (fondo blanco fuera, partir pedazos sueltos: decenas de lienzos de 900×900) y se quedaba sin memoria. Ahora las piezas vienen YA RECORTADAS en assets/puzzle/3d/futurista-piezas.webp + la lista ESTADIOS.futurista.piezas (capa, x, y, ancho, alto, x/y en el atlas); carga en ~0,3 s. Para regenerarlas: assets/puzzle/3d/generar-piezas.html (herramienta, no es del juego). El Centenario reusa un solo lienzo para recortar (menos memoria). Capas del Futurista (30 piezas, 7 capas): base gris (6, la imagen de la base que mandó Gonzalo: futurista-base.webp, puesta bajo el estadio), cancha (2), tribunas (4), fachada (3), techo de vidrio (4), arcos (2), explanada y estacionamiento (9). Progreso nuevo en gya_puzzle3d_futurista2 (el anterior no sirve porque cambiaron las piezas). puzzle.html v32, puzzle.js v32, sw v306.
```

```text
Fecha: 16/10/2026 — Estadio Futurista: la BASE GRIS ya viene ARMADA (Gonzalo: "la base gris ya venía armada"). Sus 6 piezas son capa 0, puestas desde el principio; el juego arranca por la cancha. Quedan 24 piezas para armar en 6 capas: cancha (2), tribunas (4), fachada (3), techo de vidrio (4), arcos (2), explanada y estacionamiento (9). Progreso en gya_puzzle3d_futurista3. puzzle.html v33, puzzle.js v33, sw v307.
```

```text
Fecha: 16/10/2026 — Puzzle 3D: el césped del Estadio Futurista vuelve a ser de 4 PIEZAS (Gonzalo: "eran 4 de césped y me pusiste dos"; la cancha está cortada en 4 por sus ejes y esa capa no se junta aunque las piezas sean chicas, igual que los arcos). Y las piezas de la bandeja se ven MÁS GRANDES en el celular (hasta 1,8× el tamaño del hueco; al agarrarlas toman el tamaño real del hueco). Vale para los dos estadios. Futurista: 26 piezas para armar en 6 capas: cancha (4), tribunas (4), fachada (3), techo de vidrio (4), arcos (2), explanada (9). Progreso en gya_puzzle3d_futurista4. puzzle.html v34, puzzle.js v34, sw v308.
```

```text
Fecha: 16/10/2026 — Puzzle Gigantes (500/1000): +5 imágenes que mandó Gonzalo → valle-dragones (Valle de los dragones), estacion-tren (Estación de trenes), islas-cielo (Islas del cielo), biblioteca-magica (Biblioteca mágica), oasis-desierto (Oasis del desierto). assets/puzzle/<id>.webp (1254 px) + mini 600 px en assets/puzzle/mini/. Gigantes queda con 6. Gonzalo mandó 5 más (puerto medieval, pueblo de nieve, ciudad bajo el mar, casas en el árbol, ciudad steampunk) pero no llegaron como archivo: pendiente que las reenvíe. puzzle.html v35, puzzle.js v35, sw v309.
```

```text
Fecha: 16/10/2026 — Puzzle Gigantes: llegaron las otras 5 → pueblo-nieve (Pueblo de nieve), ciudad-submarina (Ciudad bajo el mar), casas-arbol (Casas en el árbol), ciudad-vapor (Ciudad a vapor), puerto-medieval (Puerto medieval). Gigantes queda con 11 imágenes (ya no hay pendiente de reenvío). puzzle.html v36, puzzle.js v36, sw v310.
```

```text
Fecha: 16/10/2026 — Puzzle 3D MÁS RÁPIDO (Gonzalo: "gira demasiado lento, no como el puzzle normal"). Causa: cada cuadro dibujaba cada pieza con ctx.filter (oscurecido) + shadowBlur (sombra difuminada): en un celular lento (CPU simulada 6×) iba a 1,7 cuadros por segundo. Ahora la sombra oscura de cada pieza se prepara una sola vez (p.osc) y el giro es más ágil (factor 0,5 y frena exacto). Medido: 1,7 → ~22 cuadros/s con CPU 6× más lenta (en un celular normal, fluido). No volver a usar ctx.filter ni shadowBlur dentro del dibujo de cada cuadro. Además la ayuda del Puzzle menciona los dos estadios 3D y la foto "🔍 Armado". puzzle.html v37, puzzle.js v37, sw v311.
```

```text
Fecha: 16/10/2026 — ARREGLOS antes del lanzamiento (revisión de código "despertar agente" + prueba automática de todo el juego). Prueba automática (Playwright, celular 390×800): inicio, menú, las 19 extensiones abiertas y con cientos de toques al azar, páginas sueltas (mahjong, privacidad, tv, puzzle…) → 1 solo error, ya arreglado (tutorial: si salías en el momento justo, "Cannot read 'fase' of null"). Los tests viejos de tests/*.cjs fallan por estar desactualizados (esperan 8 extensiones, botones que cambiaron), no por fallas del juego. Fallas arregladas en index.html: (1) perder el Evento diario cobraba 2 vidas → 1 (vidaCobrada); (2) después de "No hay «X»", Quiebra, Pierde turno, resolver mal o tiempo agotado, durante ~1,5 s se podía tocar otra letra o girar → ahora S.fase="pasando" hasta cambiarTurno; (3) al completar/resolver la frase se podía comprar vocal y cobrar la ronda 2 veces → S.fase="ronda_fin" hasta nuevaRonda (hostResolver solo en girar/consonante/vocal; botón Resolver apagado fuera de esas fases); (4) Ranking: con tu propio nombre de perfil decía "ya lo usa otro" → con el propio nombre solo se fija en el grupo ranking; el ilike escapa % y _; (5) Evento de fin de semana: en Uruguay sáb/dom después de las 21 h se podía cobrar otra vez → se guarda r.finde (sábado en hora local, findeIdLocal); (6) completar una colección con un premio de evento no daba +1500 🪙 +1 ❤️ → ahora pasa por colVerificarCompletada; (7) abrir/cancelar Resolver daba tiempo infinito → el reloj se renueva 1 sola vez por turno (S.resolverRefrescado) y 1 vez en la Ronda Bonus (S.bonusRefrescado); (8) la Revancha no reponía los escudos "1 por partida" → se reponen. NO se tocó (decisión de Gonzalo): el nombre "Gonzalo" sin internet ("al momento esto como estaba dejalo"), ni la Sala TV (su falla de seguridad quedó en Pendientes, para la versión de TV). Probado: cada arreglo con una prueba propia + partida completa contra la máquina (rondas, Prueba de Velocidad y Ronda Bonus) sin errores.
```

```text
Fecha: 17/10/2026 — Tutti Frutti pasa de "Juegos de previa" a "🎮 Más juegos" en el lobby de Extensiones (Gonzalo: "quiero que Tutti Frutti pase al lugar de Más juegos"). Solo se sacó grupo:"previa" de su entrada en extensiones.js; el juego no cambió (sigue online, cada uno con su celular). Queda entre Ahorcado y Puzzle. extensiones.js v43, sw v312.
```

```text
Fecha: 17/10/2026 — Puzzle (iPhone, cooperativo): (1) la ventana "📲 Invitá a jugar" quedaba abierta para quien creó la sala aunque ya estaban jugando y había que salir y volver a entrar → se cierra al abrir "Elegí el puzzle" y al cargarse el puzzle elegido (abrirElegir, cargarElegido, generarElegido). (2) "A veces hace zoom al tocar dos veces y mueve el juego": en iPhone a veces se pierde el "soltar" de un dedo; quedaba guardado y el toque siguiente contaba como 2 dedos (pellizco) → zoom y la mesa se movía sola. Ahora un toque nuevo (primer dedo, isPrimary) borra dedos viejos; lo mismo en el Puzzle 3D. Además se bloquea el zoom de página de iPhone (gesturestart/dblclick). Probado simulando el dedo "perdido": antes cambiaba el zoom, ahora no. puzzle.html v38, puzzle.js v38, sw v313.
```

```text
Fecha: 17/10/2026 — Puzzle cooperativo: cada sala de "Tus salas sin terminar" tiene una ✕ para quitarla de la lista (Gonzalo: "una cruz en las salas donde pueda eliminar la que no juego más"). Pide confirmar ahí mismo ("¿Quitar la sala X de tu lista? Quitar / No"). Solo la saca de ESTE celular (localStorage gya_puzzle_salas); la sala sigue existiendo para la otra persona y se puede volver a entrar con el código. puzzle.html v39, puzzle.js v39, sw v314.
```

```text
Fecha: 17/10/2026 — Puzzle 500/1000: el botón 🔲 (juntar bordes alrededor del marco) ahora se prende y se apaga como la Guía (Gonzalo: "no se pueden sacar después, sería como guía ponerlo y sacarlo"). Prendido (verde): pone las piezas de borde sueltas alrededor del marco. Tocándolo de nuevo, las que siguen sin tocar vuelven exactamente a donde estaban en la mesa; las que ya moviste o encastraste se quedan. Se apaga solo al empezar o retomar otro puzzle (bordesReset). Probado con 500 piezas: 86 bordes salen y vuelven a su lugar. puzzle.html v40, puzzle.js v40, sw v315.
```

```text
Fecha: 17/10/2026 — Puzzle 500/1000: más fácil agarrar piezas sin hacer zoom (Gonzalo: "a veces solo acepta moverlas haciendo zoom hasta la pieza"). Sin zoom cada pieza mide ~12 px en el celular y había que tocarla exacto; si el dedo caía al lado, movía la mesa. Ahora hitTocar(): si el toque no cae justo sobre una pieza suelta, agarra la suelta más cercana (hasta ~24 px de pantalla). Medido con 1000 piezas, 300 toques a 6–20 px de una pieza: antes agarraba 61, ahora 300. Para mover la mesa: tocar lejos de las piezas o con dos dedos. puzzle.html v41, puzzle.js v41, sw v316.
```

```text
Fecha: 17/10/2026 — Puzzle: (1) pellizco con dos dedos en 500/1000: el 1er dedo casi siempre agarra una pieza y el 2º dedo la giraba en vez de hacer zoom → ahora si la pieza todavía no se movió, el 2º dedo hace pellizco (zoom) y la pieza vuelve a su lugar; si ya la venías arrastrando, el 2º dedo la gira como antes. (2) Gigantes (500/1000) en COOPERATIVO (antes estaba desactivado a propósito): en "Elijan el puzzle" aparece "500 piezas / 1000 piezas" cuando la categoría es Gigantes (sel.n, viaja en el mensaje 'sel'; los dos tienen que aceptar la misma cantidad). También en solo. Ojo: el estado completo de 1000 piezas pesa ~135 KB por mensaje 'nuevo'/'todo' (500 ≈ 70 KB); si en salas reales no llega a la pareja, achicar ese mensaje (redondear posiciones, mandar sin bordes). El botón 🔲 sigue oculto en cooperativo. puzzle.html v42, puzzle.js v42, sw v317.
```

```text
Fecha: 17/10/2026 — Comentarios de los testers de Fiverr (Hira y su equipo, comentarios privados de Play del 17/10) → arreglos en index.html:
(1) Botón "atrás" de Android (Hira Saleem: "cierra la app en vez de volver"): la TWA es una página web y sin historial "atrás" salía. Ahora hay un "atrás" propio (popstate + history.pushState({gyaAtras:1})): cierra el confirm abierto (botón …No), la ventana/capa de más arriba (busca su botón Cerrar/Volver/✕/Cancelar), vuelve del juego de Extensiones al lobby y del lobby al inicio, sale del mapa/eventos/perfil/ciudad, y en una partida abre "¿Abandonar?". En el inicio muestra "Tocá atrás de nuevo para salir" y el 2º atrás sale. Los juegos en PantallaFija siguen con su propio atrás.
(2) Monedas que no se actualizaban hasta cerrar y abrir (Innovatia/Hira): sumarMonedas/gastarMonedas ahora llaman refrescarMonedas() (HUD del inicio, mapa, tienda y ciudad al instante).
(3) Premio de resolver que se llevaba el rival (Hira): si el turno pasaba al rival mientras escribías en "Resolver" (se acabó el tiempo), la respuesta se aceptaba igual y el premio iba al que tenía el turno (el rival). Ahora en bot/host esa respuesta no cuenta ("⏱️ Se terminó tu turno antes de resolver") y la ventana Resolver se cierra sola cuando el turno pasa al rival.
(4) "Vuelve a empezar desde el splash" (Umer Farooq): si se abrió hace menos de 20 min (ga_ultima_apertura, fuera de gya_ para no viajar al respaldo), el splash dura ~0,4 s y no espera las imágenes del mapa (antes ~2 s o más con internet lento).
(5) Fotos de perfil que no cargan con internet lento (Muhammad Shehzad): un avatar que falla se reintenta a los 2,5 s y, si vuelve a fallar, muestra una silueta en vez del cuadrado roto.
(6) Sin arreglar por falta de detalle: Hasnain Malik "tabs y botones a veces no responden o no abren la página correcta" → pedirle qué pantalla/botón. Probado: cada arreglo con Playwright + partida completa contra la máquina, sin errores.
```

```text
Fecha: 17/10/2026 — Revisión enfocada en Android (Gonzalo pidió revisar después de que los testers encontraran cosas que la auditoría no vio). Qué se revisó y cómo (Playwright simulando celular, NO un Android real): botones tapados por capas invisibles en 31 pantallas (no hubo), celulares chicos 360×640 y 320×568, teclado abierto, app en segundo plano 30 s en plena partida (el reloj se pausa bien), botón atrás. Arreglos: (1) deslizar hacia abajo arriba de todo podía RECARGAR el juego en Android (volvía al splash; posible causa del comentario de Umer) → html,body{overscroll-behavior-y:none}. (2) Pantallas angostas (≤350 px, o "Tamaño de pantalla grande" en Android): el ⚙️ del inicio quedaba cortado → la fila de racha/monedas/vidas se achica y baja. (3) "Resolver" con el teclado abierto en celular chico: el botón para confirmar quedaba tapado → se lleva a la vista al enfocar o al abrirse el teclado (Enter ya confirmaba). (4) Botón atrás: si quedó una ventana abierta DETRÁS de un juego de Extensiones, el primer "atrás" la cerraba sin que se viera nada → ahora solo cierra la que se ve arriba de todo (elementFromPoint). Dentro del Puzzle, "atrás" cierra primero lo de adentro (foto Armado, 3D → menú de estadios, chat, Elegir…) con window.gyaAtras de puzzle.html, y recién después sale del Puzzle. Límite: nada de esto se probó en un Android real ni en la app de Play. puzzle.html v43, puzzle.js v43, sw v318.
```

```text
Fecha: 18/10/2026 — 🎉 Google Play APROBÓ el acceso a PRODUCCIÓN ("¡Enhorabuena! Tu juego tiene acceso a producción en Google Play"). Falta que Gonzalo cree la versión de producción en Play Console (Producción → Crear nueva versión → agregar el AAB de la prueba cerrada desde la biblioteca → notas de la versión → países → Enviar a revisión) y que Google la revise. Cuando esté PUBLICADA: (1) se desbloquea el pendiente de la versión para Android TV (ver Pendientes); (2) cambiar las imágenes de LinkedIn de "Muy pronto en Google Play" a "Ya disponible".
```

```text
Fecha: 18/10/2026 — Contra Reloj OCULTO para todos menos Gonzalo (Gonzalo: "dejá el juego Contra Reloj solo para Gonzalo y nadie más hasta tenerlo ok"). En extensiones.js su entrada tiene soloGonzalo:true (extensionVisible) y se sacó el atajo ?contrareloj=1 que lo mostraba a cualquiera con ese link. Los links de invitación (?sala=…, ?ext=contra-reloj-rioplatense) tampoco lo abren para otros. Para volver a mostrarlo: sacar soloGonzalo:true. extensiones.js v44, sw v319.
```

```text
Fecha: 19/10/2026 — Social ✕ (otra vez): Gonzalo sacaba jugadores (testers con número de teléfono como nombre) y al volver a entrar reaparecían. Ahora la ✕ los guarda también en su celular (localStorage gya_social_ocultos, viaja en el respaldo) y los saca de la lista al instante aunque el servidor no responda o no devuelva la fila; la comparación es por nombre normalizado (mayúsculas/espacios/tildes), no exacta. Si el servidor falla, avisa "Sacado solo en tu celular". No se pudo ver la tabla de Supabase desde esta sesión para saber la causa exacta del lado del servidor. sw v320.
```

```text
Fecha: 19/10/2026 — Diagnóstico de traba (solo Gonzalo): en su celular el inicio a veces no deja deslizar ~6 s (video 19/10 11:10) y en la compu no se reproduce (deslizar anda desde el segundo 2,5, con o sin overscroll-behavior). Se agregó un aviso fijo arriba, solo para el perfil Gonzalo, que lista cada traba de más de 1 s con la función y la posición en el código (API long-animation-frame). Tocándolo se cierra. Con la captura se busca el culpable; SACARLO cuando se resuelva. sw v321.
```

```text
Fecha: 19/10/2026 — Deslizar trabado en el inicio: Gonzalo dice que nunca le pasó antes de los cambios del 17/10. Se sacó la regla html,body{overscroll-behavior-y:none} (PR #978), el único cambio de esos días que tocaba el deslizado. Vuelve a pasar lo de antes: deslizar hacia abajo estando arriba de todo puede recargar el juego. Si con esto se arregla, NO volver a ponerla en body (si hace falta frenar la recarga, probar solo en html y probarlo en el celular de Gonzalo). El diagnóstico de trabas (solo Gonzalo) sigue puesto. sw v322.
```

```text
Fecha: 19/10/2026 — Regla nueva de Gonzalo: "el deslizado nunca se toca". Anotada en "Reglas de contenido y visuales" y en CLAUDE.md.
```

```text
Fecha: 19/10/2026 — Nueva extensión "Tirame una Birra" (Cervecería Durazno), hecha con imágenes de ChatGPT de Gonzalo y probada antes como artifact. Visible solo para los perfiles Gonzalo y Vale (nuevo campo soloUsuarios en extensiones.js / extensionVisible). cerveceria.js abre cerveceria.html en iframe como el Puzzle; "‹" y el atrás de Android (gyaAtras) vuelven al lobby. Colores y letras de Girá y Adiviná (noche/oro/magenta/agua, Archivo Black + Outfit) y logo-cerveceria.svg. Guarda en localStorage gya_birra_estrellas/banco/mejoras (viajan en el respaldo). Para abrirla a todos: sacar soloUsuarios. extensiones.js v45, sw v323.
```

```text
Fecha: 19/10/2026 — Se sacó el aviso de "Diagnóstico" de trabas (solo Gonzalo): ya no hace falta (el deslizado se arregló sacando overscroll-behavior). Lo último que marcó fue 1,6 s al abrir la lista de Usuarios (se dibujan ~17 jugadores con datos del servidor). sw v324.
```

```text
Fecha: 19/10/2026 — Tirame una Birra: música de la banda en el nivel 1 (assets/cerveceria/musica-nivel1.mp3, "Copper Taps and Trumpets", hecha por Gonzalo con Gemini, 63 s en loop). Volumen 0,3 (+0,08 por nivel de la mejora Banda en vivo), se pausa con la pausa/al minimizar, se corta al terminar o salir y respeta el sonido de Girá y Adiviná. Otros niveles: agregar en MUSICA {nivelIdx: archivo}. cerveceria.html v2, sw v325.
```

```text
Fecha: 19/10/2026 — Tirame una Birra: música del nivel 2 (assets/cerveceria/musica-nivel2.mp3, "Friday in Montevideo", trompeta, hecha por Gonzalo con Gemini). cerveceria.html v3, sw v326.
```

```text
Fecha: 19/10/2026 — Tirame una Birra: música del nivel 3 (assets/cerveceria/musica-nivel3.mp3, "Viernes en la Esquina", batería/candombe, Gemini). La música va con el músico que toca (nivelIdx%3): niveles 4 y 5 repiten la de guitarra y trompeta. cerveceria.html v4, sw v327.
```

```text
Fecha: 19/10/2026 — Tirame una Birra: Vale reportó "pantalla azul" al entrar (no reproducido en la compu con perfil Vale). Se blindó el arranque: si el iframe todavía mide 0 al cargar, reintenta acomodar la escena (también con ResizeObserver, load y orientationchange), y si hay un error de JavaScript se muestra en pantalla con el mensaje para que manden captura. cerveceria.html v5, sw v328.
```

```text
Fecha: 19/10/2026 — Tirame una Birra en iPhone (Vale): pantalla violeta vacía. Causa probable: Safari de iPhone agranda el iframe al tamaño del contenido (escena de 1600 px fija al centro) y la escena queda fuera de lo visible. Arreglo: el iframe usa width:1px;min-width:100% (y alto igual) + scrolling="no"; adentro ajustar() mide el tamaño real con frameElement, fija html/body en px y la escena va en position:absolute. No se pudo probar en iPhone real (solo Chromium). cerveceria.js v3, cerveceria.html v6, sw v329.
```

```text
Fecha: 19/10/2026 — Tirame una Birra: mejora "Segunda chopera" (250 monedas, una compra): 2 choperas = 8 canillas para tirar dos pintas iguales a la vez; con ella la barra se reacomoda y las máquinas se achican (disposicion() en cerveceria.html; medidas internas escaladas). Teclas 1-8 en la compu. La tienda de mejoras pasó a 3 columnas para que entren las 6. cerveceria.html v7, sw v330.
```

```text
Fecha: 19/10/2026 — Tirame una Birra: en iPhone ya carga (Vale jugó el nivel 1). Arreglado el menú: el título en dos renglones empujaba la frase de abajo encima de los niveles; ahora el título va en un renglón más chico y el bloque título+frase tiene alto fijo arriba de los niveles. cerveceria.html v8, sw v331.
```

```text
Fecha: 19/10/2026 — Tirame una Birra: pizza. Nuevo nivel 6 "Noche de pizza" (16 clientes, todo lo anterior + pizza, $14). Horno de leña arriba a la izquierda sobre la barra: tocar = hornear (4,5 s, la mejora Cocina a punto lo acelera), tocar lista = servir, se quema como papas/burger (a la basura). Tecla Z. Arte dibujado por Claude en SVG (assets/cerveceria/horno.webp, pizza.webp, pizza_q.webp). En los niveles 1-5 el horno se ve apagado con candado. Probado en Samsung/Redmi emulados (sin errores). cerveceria.html v9, cerveceria.js v4, sw v332.
```

```text
Fecha: 19/10/2026 — Tirame una Birra: pantalla de inicio = mapa "Ruta Durazno" (idea de la Ruta Montevideo, primera ciudad Durazno). Mapa dibujado en SVG dentro de cerveceria.html (río Yí, Santa Bernardina, Ruta 5 con puente, plaza, costanera) con 7 bares inventados (BARES): Cervecería Durazno abierta (entra al menú de niveles o a mejoras) y Rockería del Centro, Pizzería La Plaza, Parrillada Ruta 5, Bar El Yí, Cantina del Puente y Parador Santa Bernardina en "Próximamente", más el pin "¿Tu bar acá?" para la presentación a bares. "‹"/atrás en el menú de niveles vuelve al mapa; en el mapa sale a Extensiones. Para abrir otro bar: abierto:true en BARES (y hacerle su juego). cerveceria.html v10, cerveceria.js v5, sw v333.
```

```text
Fecha: 19/10/2026 — Tirame una Birra: "Entrar al bar" no hacía nada. Causa: #mapa{display:block} le ganaba a .pantalla[hidden]{display:none} y el mapa quedaba tapando el menú. Arreglo: #mapa[hidden]{display:none}. Ojo: si a una .pantalla se le pone display por id, agregarle su regla [hidden]. cerveceria.html v11, sw v334.
```

```text
Fecha: 19/10/2026 — Tirame una Birra sale de Girá y Adiviná (pedido de Gonzalo: "fue para probar, lo dejamos aparte"). Motivo: un juego que promociona cerveza obliga a calificación +18 / control de edad en Play Store, y no tiene que arrastrar a Girá y Adiviná. Se sacó la entrada de extensiones.js (v46), el script cerveceria.js de index.html y los 3 archivos del APP_SHELL del sw (v335). Quedan en el repo, sin enlazar desde el juego: cerveceria.html, cerveceria.js, logo-cerveceria.svg y assets/cerveceria/ (para la futura app aparte; se juega en https://gvelazcamp.github.io/gira-y-adivina-rioplatense/cerveceria.html). El campo soloUsuarios/extensionVisible queda en extensiones.js por si se usa para otra prueba. No volver a meterlo en Girá y Adiviná sin que Gonzalo lo pida.
```

```text
Fecha: 20/10/2026 — Impostor con dibujos. Gonzalo hizo con ChatGPT una hoja 3x3 (prompt de Claude, misma paleta de Girá y Adiviná); recortada en assets/impostor/ (logo, pasar, carta_dorso, carta_palabra, carta_impostor, ronda, votar, atrapado, gano_impostor). Logo en el panel; dibujo en cada pantalla; al ver la palabra la carta se da vuelta (misma animación y tiempo para todos, las cartas se precargan al abrir para que nadie note quién es el impostor); la palabra va escrita dentro de carta_palabra y "SOS EL IMPOSTOR" sobre carta_impostor. Estilos nuevos todos bajo .imp en extensiones.css (Mímica comparte las clases imp-*). impostor.js v6, extensiones.css v84, sw v336. Prompt hermano para Tutti Frutti (hoja 4x4: logo, ficha de letra, ¡BASTA!, trofeo + 12 íconos de categorías) entregado; falta que Gonzalo mande la imagen.
```

```text
Fecha: 20/10/2026 — Tutti Frutti con dibujos. Hoja 4x4 de ChatGPT (prompt de Claude) recortada en assets/tutti/: logo, ficha (de la letra), basta, trofeo y c_<categoría> (12 íconos: nombre, apellido, pais, comida, animal, color, marca, fruta, cosa, profesion, famoso, pelicula; mapa ICONO en tutti-frutti.js). Logo en el panel; íconos en los botones de categorías, en la categoría que se escribe, en la revisión y en la tabla de resultados; la letra sorteada aparece sobre la ficha (también chica arriba mientras se escribe); el BASTA muestra el dibujo del chico gritando; el ganador final, el trofeo. Estilos bajo .tf en extensiones.css. tutti-frutti.js v64, extensiones.css v85, sw v337.
```

```text
Fecha: 20/10/2026 — Tutti Frutti: la letra quedaba corrida a la izquierda en la ficha (Gonzalo). Centrada sobre la parte crema (medida en la imagen: centro x 52 %, y 45 %). Además se le sacó a ficha.webp una gotita magenta suelta. extensiones.css v86, sw v338.
```

```text
Fecha: 20/10/2026 — Tutti Frutti: con el teclado abierto se tapaban los botones (video de Gonzalo). La pantalla de escribir va pegada arriba y compacta (ficha chica de 64 px, ícono de categoría 30 px, botones de 52 px, sin el renglón de aviso vacío): con 380 px de alto visibles entran letra, categoría, casilla y los 3 botones. extensiones.css v87, sw v339.
```

```text
Fecha: 20/10/2026 — Sopa Fugaz con dibujos. Hoja 4x3 de ChatGPT (prompt de Claude; mascota: chica de rulos con gorra violeta y lupa) recortada en assets/sopa/: logo, mascota, ficha, ficha_ok (recortada al cuadrado sin destellos para llenar la celda), mudanza, reloj, libro, duelo, gano, tiempo, record, encontrada. Logo arriba; cada celda usa ficha.webp (encontradas ficha_ok); reloj en el HUD de Tiempo; libro en "Mis palabras"; remolino encima de la grilla mientras se mudan las letras; destello "encontrada" sobre la palabra marcada; paneles: inicio/cómo se juega = mascota (botón "Jugar con un amigo" con el dibujo del duelo), ronda superada = gano, se acabó el tiempo = tiempo, encontraste todas = record. Estilos bajo .sf-game (sf-panel/sf-acciones los comparten otros juegos). sopa-fugaz.js v8, extensiones.css v88, sw v340.
```

```text
Fecha: 20/10/2026 — Rueda de Letras con dibujos. Gonzalo rechazó dos versiones (una muy infantil, otra muy realista): el estilo que va es el mismo de Impostor/Sopa/Tutti (cartoon 3D tipo Royal Match, personajes jóvenes, objetos sin caritas). Hoja 4x4 recortada en assets/rueda-letras/: logo, rueda, ficha, casilla, casilla_ok, girar, pista, cajon, r1..r5 (rangos Arrancando→Maestro), personaje, completada, tiempo. Logo arriba; la rueda y cada letra usan sus imágenes (letra marcada en verde agua); casillas del crucigrama vacía/llena; íconos en Girar, Pista, el cajón y el rango; paneles: inicio = personaje, rueda completada = completada, se acabó el tiempo = tiempo. Estilos bajo .rl-game. rueda-de-letras.js v15, extensiones.css v89, sw v341. Recorte: el script de manchas manda confeti/nubes que caen en la fila de rangos al casillero de abajo.
```

```text
Fecha: 20/10/2026 — Palabra Secreta con dibujos. Hoja 4x3 (mismo estilo aprobado) recortada en assets/palabra-secreta/: logo, personaje, casilla, verde, amarilla, gris, racha, stats, dia, gano, perdio, extra. Logo arriba; botón de estadísticas con su ícono; renglón "Palabra de hoy / Palabra extra · Racha" con íconos; casillas del tablero (y del ejemplo de la ayuda) con las imágenes por color (letra oscura sobre amarilla); ayuda = personaje; estadísticas = ícono; final = gano/perdio; "Jugar otra palabra" con el dado. El teclado sigue con colores planos. Estilos bajo .ps-game. Recorte: las manchas chicas van con el dibujo más cercano (distancia a sus píxeles). palabra-secreta.js v16, extensiones.css v90, sw v342.
```

```text
Fecha: 20/10/2026 — Palabra Secreta: el final ("¡La encontraste…!" / "La palabra era…") sale como popup en el medio, adelante del tablero (Gonzalo: abajo quedaba mal). ✕ o tocar afuera lo cierra para ver el tablero, y queda el botón "🏁 Ver resultado" para reabrirlo (compartir, jugar otra). En duelo no se cierra (después sale el resultado del duelo). palabra-secreta.js v17, extensiones.css v91, sw v343.
```

```text
Fecha: 20/10/2026 — Frases en Giro con dibujos. Hoja 4x3 (mismo estilo; personaje: chica rubia de trenza con mate y campera de jean) recortada en assets/frases-giro/: logo, personaje, ficha, espacio, giro, reloj, intentos, racha, pista, comprobar, armada, perdio. Logo arriba; íconos en Intentos/Tiempo del HUD, en "Escena", en la racha y en "Comprobar frase"; fichas y espacios con border-image (9 partes) para que el borde no se deforme con palabras largas; remolino sobre las palabras disponibles mientras giran; paneles: inicio = personaje, frase armada = armada, perdiste = perdio. La racha solo se redibuja si cambia (hud corre 20 veces por segundo). Estilos bajo .fg-game. frases-en-giro.js v9, extensiones.css v92, sw v344.
```

```text
Fecha: 20/10/2026 — Memoria en Giro con dibujos. Hoja 4x3 (mismo estilo; personaje: chico morocho de anteojos redondos y buzo verde agua) recortada en assets/memoria-giro/: logo, dorso, frente, encontrada (recortada a la carta), giro, reloj, racha, ojo, personaje, pares, tiempo, record. Logo arriba; cartas con dorso/frente/encontrada en imagen (proporción .75; tablero limitado a 42vh para que entren 4 filas); íconos de reloj, giro, racha y ojo (fase de memorizar) en el HUD y textos (ponerHtml solo redibuja si cambió); paneles: inicio = personaje, todos los pares = pares, se terminó el tiempo = tiempo. Los símbolos siguen siendo emojis (hoja de 20 símbolos rioplatenses: opcional, pendiente). Recorte: el script corta la línea más vacía entre filas/columnas para separar dibujos que se tocan. memoria-en-giro.js v8, extensiones.css v93, sw v345.
```

```text
Fecha: 20/10/2026 — El Rosco con dibujos. Hoja 4x4 (mismo estilo; personaje: conductor de camisa celeste y moño dorado) recortada en assets/rosco/. Se usan: logo, aciertos, errores, reloj (HUD), pista y escuchar (cuadro de la pista), pasapalabra (botón), personaje (inicio), perfecto / terminado / tiempo (paneles finales). La ruleta y las burbujas de letras con imagen (aro, azul, verde, roja, actual) se probaron y Gonzalo dijo que quedaban mal: el rosco y sus letras quedan como antes (CSS original) y esas imágenes no se subieron. Estilos bajo .rr-game. rosco-rioplatense.js v12, extensiones.css v94, sw v346.
```


```text
Fecha: 22/10/2026 — Inicio web más fluido (fff5a2c, publicado en main).
Pedido de Gonzalo: entrar con pantalla oscura completa, sin el logo y la barra intermedios; evitar que los iconos del menú aparezcan después.
Cambio: index.html precarga el splash y los iconos visibles, elimina el logo y la barra HTML, y deja de esperar los fondos de MUNDO antes de mostrar el menú. sw.js incorpora esas imágenes a la caché.
Comprobación: Chromium móvil con carga demorada del icono de Tienda; pantalla oscura al comienzo, menú descubierto con iconos cargados y sin errores JS. Pruebas entrada-dominio y migracion-dominio OK.
Límite: el primer logo grande está en res/drawable/splash.png del AAB Android v16; el cambio web no lo modifica. La barra de URL en una TWA depende de la verificación Android del dominio y requiere comprobación en dispositivo.
```

```text
Fecha: 22/10/2026 — Pantalla de carga (Gonzalo, versión 17 prueba interna: "volvé mi splash; nunca más pantalla negra ni la barrita de carga de arriba"). Vuelve el splash de siempre: fondo violeta #160B24 (no negro), logo + "Girá y Adiviná" dentro del HTML al instante, barra dorada abajo que avanza sola; cuando baja la ilustración grande aparece encima; se cierra con la barra al 100% recién cuando están listos los íconos del menú, el logo, el mate y las banderas del inicio (que vuelven a cargar sin loading="lazy": con lazy se veía el inicio a medio dibujar, solo las olas). Reapertura antes de 20 min: corta. Tope 8 s (2,5 s si volvió). El ida y vuelta al dominio anterior (?comprobar_partida=1) ya no oculta la página (negro): pone una tapa con logo y barra; migrar.html y el puente de github.io también tienen fondo violeta, logo y barra. La barrita blanca de arriba es de Chrome/Android al pasar por gvelazcamp.github.io (origen que la TWA 17 no tiene como confiable): se saca en el AAB agregando gvelazcamp.github.io como "additional trusted origin" (su assetlinks ya tiene las dos huellas). Test entrada-dominio: el logo del puente no cuenta como visita. sw v349.
```

```text
Fecha: 22/10/2026 — Carga como cualquier juego (Gonzalo: "entro al juego, pantalla negra como todos los juegos, y este splash"): negro → la ilustración grande (assets/splash.webp?v=4, recomprimida de 310 a 180 KB para que aparezca antes) con la barra dorada → menú. Sin el logo chico ni fondo violeta en la carga; la barra aparece junto con la ilustración. La ilustración se ve SIEMPRE (también al reabrir antes de 20 min): mínimo 1,8 s la primera vez, 0,8 s al reabrir. El splash va arriba de todo (z-index máximo): ningún aviso (racha, logros) se ve encima. El ida y vuelta al dominio anterior también es negro. sw v350.
```

```text
Fecha: 22/10/2026 — El Rosco: se quejaron de que no veían "Pasapalabra" (con el teclado abierto quedaba debajo, tapado). Ahora el botón va en la misma fila que la respuesta y "Enviar" (ícono arriba, texto chico), siempre a la vista arriba del teclado. Placeholder "Tu palabra" (el anterior se cortaba). rosco-rioplatense.js v13, extensiones.css v95, sw v351.
```

```text
Fecha: 22/10/2026 — Extensiones: al girar (mudanza de Sopa Fugaz, botón Girar de Rueda de Letras) sonaba el ruido de la ruleta del juego principal (sonarRuletaGiro, a propósito desde el diseño original) y Gonzalo lo vio como bug. Ahora usan sonarGiroExt() (index.html): un "fiuu" corto y suave sintetizado (respeta el sonido del juego). El ruido de la ruleta queda solo para la ruleta principal. No reusar sonarRuletaGiro en extensiones. sopa-fugaz.js v9, rueda-de-letras.js v16, sw v352.
```

```text
Fecha: 22/10/2026 — Carga, según el video de Gonzalo (versión 17): Android muestra su pantalla oscura y después la de la TWA en violeta #160B24 (sale del AAB, no del juego); después el juego pasaba a negro, se asomaba la fila de abajo del menú (Ruleta de premios / Ranking / Objetivos) y al final la ilustración y el menú se veían encimados. Arreglo: (1) el fondo de la carga del juego es el mismo violeta #160B24 que la pantalla de Android, así no hay salto violeta→negro; (2) html.cargando oculta todo el juego (visibility, sin tocar el deslizado) hasta que termina la carga, con tope de 12 s; (3) al cerrar, primero la ilustración y la barra se apagan al violeta y recién después aparece el menú (nunca los dos encimados). Si en la versión 18 se cambia el color de la pantalla de carga de Android, cambiar también #160B24 en el head de index.html (html, #splash y la tapa de comprobar_partida). sw v353.
```

```text
Fecha: 22/10/2026 — Fin de la carga (Gonzalo: "que termine el splash y entre al juego, no que desaparezca y aparezca"): ya no pasa por el violeta. El menú queda listo atrás y la ilustración se abre con un zoom suave (opacidad 0 y escala 1,08 en 0,5 s), entrando directo al juego. sw v354.
```

```text
Fecha: 22/10/2026 — Aviso "¡Hay una versión nueva!" para la app de Android (Gonzalo). Ventana #capaActualizar (logo, texto, "📲 Actualizar ahora" → https://play.google.com/store/apps/details?id=io.github.gvelazcamp.twa, "Más tarde"), una vez por día como máximo (gya_aviso_actualizar_dia), después del splash y antes del popup diario (avisoActualizarApp en tutChequearBienvenida). Cómo sabe la versión instalada (gya_app_version): la 16 abre github.io y el puente (repo gira-y-adivina-rioplatense, si document.referrer es android-app://) agrega ?app=16 → migrar.html lo pasa → index.html lo guarda; la 17 abre con ?comprobar_partida=1 (= 17); desde la 18 el start_url de la app debería traer ?app=18 (además de comprobar_partida). En el navegador no hay número y no se avisa. VERSION_APP_PLAY (index.html) = la versión que está en PRODUCCIÓN: hoy 16 → nadie ve el aviso. Cuando Google apruebe la 17 en producción, poner 17 y los de la 16 lo ven. Prueba: index.html?probaractualizar=1. No se puede actualizar "adentro" del juego: el aviso de actualización nativo de Google (In-App Updates) necesita código Android en la app. sw v355.
```

```text
Fecha: 22/10/2026 — Silabario Rioplatense con dibujos. Hoja 4x3 (mismo estilo; personaje: chica morena de rodetes con enterito de jean) recortada en assets/silabario/: logo, ficha, ficha_sel, ficha_usada, mezcla, reloj, aciertos, errores, personaje, perfecto, terminado, tiempo. Logo arriba; íconos en el HUD; fichas del tablero con border-image (crema; elegida = magenta; usada = gris); remolino "mezcla" sobre el tablero mientras se reordena; paneles: inicio = personaje, final = perfecto / terminado / tiempo. Estilos bajo .sb-game. silabario-rioplatense.js v15, extensiones.css v96, sw v356.
```

```text
Fecha: 22/10/2026 — 100 Rioplatenses Dicen con dibujos. Hoja 4x5 (mismo estilo; personaje: conductora de saco azul con hombreras doradas y micrófono) recortada en assets/cien/: logo, oculta, revelada, error, c_<id de CIEN_CATEGORIAS> (12 temas), personaje, gano, perdio, record. Logo arriba; íconos dibujados en los gajos de la ruleta y en el chip del tema (en vez de los emojis); cruces de error en imagen (apagadas hasta usarse); filas del panel con border-image (azul oculta, dorada descubierta); conductora en la pantalla de inicio; final con record (mejor marca) / gano (alguna ronda con 4+) / perdio. Estilos bajo .cr-game. cien-rioplatenses.js v8, extensiones.css v97, sw v357.
```

```text
Fecha: 22/10/2026 — Tutti Frutti: volvió el sonido del "¡BASTA!" (Gonzalo: "se fue"). Se había perdido el 04/10 al sacar el modo papel y lápiz (#824): el modo online solo hacía sonar el "uy" cuando lo cantaba otro y nada si lo cantabas vos. Ahora en cortarRonda suena siempre el ta-taaa de antes (523 → 392 Hz); si lo cantaste vos, además una fanfarria corta; si fue otro, después el "uy". tutti-frutti.js v65.
```

```text
Fecha: 22/10/2026 — 100 Rioplatenses Dicen con dibujos (salió publicado junto con el arreglo del BASTA, #10). Hoja 4x5 (mismo estilo; personaje: conductora de saco azul con hombreras doradas y micrófono) recortada en assets/cien/: logo, oculta, revelada, error, c_<id de CIEN_CATEGORIAS> (12 temas), personaje, gano, perdio, record. Logo arriba; íconos dibujados en los gajos de la ruleta y en el chip del tema (en vez de los emojis); cruces de error en imagen (apagadas hasta usarse); filas del panel con border-image (azul oculta, dorada descubierta); conductora en el inicio; final con record / gano (alguna ronda con 4+) / perdio. Estilos bajo .cr-game. cien-rioplatenses.js v8, extensiones.css v97.
```

```text
Fecha: 22/10/2026 — Ahorcado Rioplatense con dibujos. Hoja 4x3 (mismo estilo; personaje: gaucho joven con boina, pañuelo rojo y mate) recortada en assets/ahorcado/: logo, horca (estructura de madera sin muñeco), casilla, casilla_ok, vida, vida_perdida, pista, ruleta, personaje, gano, perdio, record (vida/vida_perdida/pista/ruleta quedan para usar). Logo arriba; ruleta y chip de categoría con los íconos de 100 Rioplatenses (assets/cien/c_<id>: mismos 6 temas); el muñeco (p0..p5, misma lógica) se dibuja en SVG encima de la estructura de madera (viewBox 315x309, cuelga en x=245); letras de la palabra en casillas (violeta vacía, crema descubierta); paneles: inicio = personaje, fin = record / gano / perdio. El modo por turnos sigue con los mini muñecos SVG de antes. Estilos bajo .ah-game. ahorcado-rioplatense.js v12, extensiones.css v98, sw v359.
```

```text
Fecha: 22/10/2026 — El Rosco: reclamo de un jugador ("pronóstico del tiempo" le daba mal; la respuesta es PRONOSTICO). Ahora vale(d,valor) acepta la palabra, sus alternativas y también la palabra seguida de un complemento corto "de/del/de la/de los…" (máx. 12 letras más). PRONOSTICO además tiene alternativas explícitas (del tiempo / de tiempo / del clima). Si llegan más reclamos de palabras del Rosco: agregar alternativas en rosco-rioplatense-datos.js (6.º elemento) y correr node tests/auditar-palabras.cjs --md.
```

```text
Fecha: 22/10/2026 — Impostor: la elección de categoría ahora son tarjetas ilustradas (hoja 4x2 de ChatGPT recortada en assets/impostor/cat_<id>.webp, 300x340; también cat_bloqueada sin usar). Grilla de 3 columnas, "Mezcla" centrada abajo, nombre corto en la franja oscura (CORTO en impostor.js), la última elegida brilla dorada. Tocar una sigue arrancando la ronda como antes. impostor.js v7, extensiones.css v99, sw v361.
```

```text
Fecha: 23/10/2026 — ¿Quién soy?: arte nuevo (hoja 3x3 de ChatGPT recortada en assets/quien-soy/: logo, como, frente, ok, paso, reloj, tiempo, trofeo, fondo). Inicio con logo + dibujo de cómo se juega + íconos de acerté/paso; la partida tiene de fondo el escenario de TV (oscurecido al centro para que la palabra se lea), cronómetro al lado del tiempo, el chico con el celular en la frente durante la cuenta 3-2-1 y un ícono que salta al acertar/pasar (el destello verde/naranja ahora es una capa encima). Final con trofeo si es récord o despertador si no. Las categorías siguen como botones hasta que Gonzalo mande la hoja de tarjetas (prompt 1). quien-soy.js v9, extensiones.css v100, sw v362.
```

```text
Fecha: 23/10/2026 — ¿Quién soy?: la elección de categoría ahora son tarjetas ilustradas (hoja 3x2 de ChatGPT recortada en assets/quien-soy/cat_<id>.webp, 300x400). Grilla de 3x2, nombre corto en la franja oscura ("Cosas de la casa" → "Casa"), la última jugada brilla dorada. quien-soy.js v10, extensiones.css v101, sw v363.
```

```text
Fecha: 23/10/2026 — 100 Rioplatenses Dicen: la conductora ya no queda abajo de la ruleta; ahora aparece en un popup de bienvenida al abrir el juego (#crBienvenida) que explica cómo se juega (tema, 6 respuestas, 3 errores, 3 rondas ×1/×2/×3, jugar con un amigo). Se cierra con "¡A jugar!", ✕ o tocando afuera, y se vuelve a abrir con "❓ Cómo se juega" (reemplaza el desplegable viejo). cien-rioplatenses.js v9, extensiones.css v102, sw v364.
```

```text
Fecha: 23/10/2026 — ¿Quién soy?: logo re-recortado entero (el corte entre columnas le comía el borde del signo de pregunta) y centrado en el inicio. El ícono del juego en Extensiones ahora es ese logo sobre un cuadrado violeta (assets/quien-soy/icono.webp, reemplaza logo-quien-soy.svg). Ojo: como assets/ es cache-first, se bumpeó CACHE_NAME para que llegue el logo nuevo. extensiones.js v47, extensiones.css v103, sw v365.
```

```text
Fecha: 23/10/2026 — ¿Qué número soy?: arte nuevo con tema bingo (hoja 3x3 de ChatGPT recortada en assets/que-numero-soy/: logo, como, bolilla, facil, medio, dificil, candado, revela, fondo; la bolilla se redondeó con espejo porque venía achatada). Inicio con logo + dibujo de cómo se juega + candado en el aviso; los rangos 1 a 10/50/100 tienen una bolilla, tres bolillas o el bombo. El número sale escrito dentro de una bolilla dorada gigante sobre el estudio de bingo (más chico si es 100). Final con el chico sorprendido y la bolilla con el número. Ícono en Extensiones: assets/que-numero-soy/icono.webp (reemplaza logo-que-numero-soy.svg). que-numero-soy.js v7, extensiones.js v48, extensiones.css v104, sw v366.
```

```text
Fecha: 23/10/2026 — Bomba: arte nuevo (hoja 3x3 de ChatGPT recortada por cajas en assets/bomba/: logo, como, bomba, chispa, pasar, micro, boom, perdedor, fondo). Inicio con logo + dibujo de cómo se juega, chispa en el aviso y micrófono en el botón del árbitro por voz. En la partida la bomba (con una chispa que titila en la mecha) late con el tic-tac sobre el cuarto con luces de alarma, y el botón Pasar lleva las manos pasando el celular. Al explotar: nube de explosión con el chico tiznado y "¡BOOM!". Ícono en Extensiones: assets/bomba/icono.webp (reemplaza logo-bomba.svg). bomba.js v13, extensiones.js v49, extensiones.css v105, sw v367.
```

```text
Fecha: 23/10/2026 — Canta la Canción: arte nuevo tema karaoke (hoja 4x3 de ChatGPT recortada por cajas en assets/canta/: logo, como, micro, arriba, abajo, jurado, parlante, vale, novale, crono, trofeo, fondo). Inicio con logo + dibujo de cómo se juega; el botón para arrancar es el micrófono dorado; el escenario de karaoke de fondo en todas las pantallas del juego; cronómetro detrás del aro del tiempo; la votación con la mesa del jurado, pulgares ilustrados (el no elegido se apaga) y parlante en "Escuchar de nuevo"; resultado con festejo de notas / micrófono roto y trofeo al ganador. Ícono en Extensiones: assets/canta/icono.webp (reemplaza logo-canta-la-cancion.svg). canta-la-cancion.js v12, extensiones.js v50, extensiones.css v106, sw v368.
```

```text
Fecha: 23/10/2026 — Mímica rioplatense: arte nuevo tema teatro (hoja 4x3 de ChatGPT recortada por cajas en assets/mimica/: logo, como, facil, media, dificil, accion, aplausos, pasar, foco, telon, trofeo, fondo). Inicio con logo + dibujo de cómo se juega y las cartas de dificultad con su dibujo (mate y cepillo / claqueta y pelota / ornitorrinco). Las pantallas del juego usan el escenario con telones de fondo (se ocultan las tiras CSS del telón ahí); foco sobre "Sube al escenario", claqueta en ¡Acción!, flecha en Pasar, aplausos en ¡Adivinaron!, telón cerrándose al fin del turno y trofeo con máscaras al ganador. Ojo: la imagen de cómo se juega usa la clase mim-como-img porque .mim-como ya es el texto desplegable. Ícono en Extensiones: assets/mimica/icono.webp. mimica.js v6, extensiones.js v51, extensiones.css v107, sw v369.
```

```text
Fecha: 23/10/2026 — Tutti Frutti: categorías como tarjetas ilustradas (hoja 4x3 de ChatGPT recortada en assets/tutti/k_<id>.webp, 300x368; la elegida brilla con ✓ verde, la no elegida queda gris; contador "N de 12"). Logo chico arriba y popup de bienvenida (#tfBienvenida) con el logo grande, el dibujo de los amigos (assets/tutti/como.webp, con una letra al azar escrita en la ficha) y la explicación (letra, ¡BASTA!, puntos 10/5/20, mejor de 3). Sale solo la primera vez (gya_tutti_bienvenida) y se reabre con "❓ Cómo se juega". tutti-frutti.js v66, extensiones.css v108, sw v370.
```

```text
Fecha: 23/10/2026 — Tutti Frutti: se sacó el logo chico de la pantalla de inicio (Gonzalo: ya está en el popup de bienvenida). Arriba queda solo "❓ Cómo se juega". tutti-frutti.js v67, sw v371.
```

```text
Fecha: 23/10/2026 — Regla de Gonzalo: el popup de inicio que explica el juego sale SIEMPRE al entrar al juego (no solo la primera vez). Se cambió Tutti Frutti (bienvPendiente: sale al abrir, no al volver de una partida; ya no usa gya_tutti_bienvenida) y Palabra Secreta (abrir() llama siempre a ayuda()). 100 Rioplatenses, Ahorcado, Frases y Memoria ya lo hacían así. tutti-frutti.js v68, palabra-secreta.js v18, sw v372.
Pendiente: la conductora de 100 Rioplatenses (assets/cien/personaje.webp) vino cortada arriba de la frente en la hoja original; se le pasó a Gonzalo un prompt para regenerarla sola.
```

```text
Fecha: 23/10/2026 — 100 Rioplatenses: conductora nueva y completa (Gonzalo la regeneró sola en ChatGPT; assets/cien/personaje.webp, 207x520, reemplaza la que venía cortada en la frente) y un poco más grande en el popup de bienvenida. Resuelve el pendiente anterior. extensiones.css v109, sw v373.
```

```text
Fecha: 23/10/2026 — Tutti Frutti: la pantalla de inicio entra entera sin scroll en cualquier celular (iPhone incluido). Categorías en 4 columnas x 3 filas con ancho que se achica según la altura de pantalla (calc con 100dvh - 340px), nombres cortos en las tarjetas (País / ciudad, Fruta/verdura, Peli / serie, Animal, Famoso), "Cómo se juega" al lado del título de categorías, Tiempo en una fila, y "Crear sala" + código + Unirme en una sola fila. No se tocó el deslizado: solo se achicó el contenido. Probado en 320x568, 360x640, 360x740, 375x548, 390x664, 414x715 y 430x750. tutti-frutti.js v69, extensiones.css v110, sw v374.
```

```text
Fecha: 23/10/2026 — Tutti Frutti ya no pide pantalla completa (PantallaFija.activar({completa:false}) y sin PantallaFija.entrar() al abrir): así no sale el aviso de Chrome "Para salir de la pantalla completa, arrastrá desde arriba…" que tapaba el botón ¡A jugar!. Sigue sin apagarse la pantalla y con el "atrás" bloqueado durante la partida. Ese aviso es de Chrome/Android, no depende del dominio. Los demás juegos de previa (Quién soy, Qué número, Bomba, Mímica, etc.) siguen con pantalla completa. pantalla-fija.js v6, tutti-frutti.js v70, sw v375.
Pendiente (para una próxima versión de la app en Play, v18): poner la TWA en modo "fullscreen" (display fullscreen en la config de Bubblewrap/manifest) para que la app sea pantalla completa siempre y el aviso no aparezca en ningún juego.
```

```text
Fecha: 23/10/2026 — Tutti Frutti vuelve a pantalla completa (Gonzalo la prefiere). Para que el aviso de Chrome no tape ¡A jugar!, la pantalla completa se pide al cerrar el popup de bienvenida (o al volver a la pantalla de inicio sin popup), no al abrir el juego. Queda en pantalla-fija.js la opción activar({completa:false}) por si se necesita en otro juego. tutti-frutti.js v71, sw v376.
```

```text
Fecha: 23/10/2026 — PantallaFija.entrar() ya no pide pantalla completa si la app abre en modo fullscreen (display-mode: fullscreen). Preparado para la v18 de Play: al generar el paquete en PWABuilder elegir Display mode "Fullscreen" (o "Fullscreen sticky"); así toda la app es pantalla completa y el aviso de Chrome "Para salir de la pantalla completa…" no aparece en ningún juego. Mientras tanto (v16/v17) el aviso sigue saliendo unos segundos al entrar a los juegos de previa. pantalla-fija.js v7, sw v377.
```

```text
Fecha: 23/10/2026 — Juegos de previa (¿Quién soy?, ¿Qué número soy?, Bomba, Mímica, Canta la Canción, Impostor) igual que Tutti Frutti: al entrar sale un popup de bienvenida (PantallaFija.bienvenida(contenedor,{logo,alt,items})) con el logo grande y 4 renglones de cómo se juega + "¡A jugar!". La pantalla completa se pide al cerrarlo (no al abrir), así el aviso de Chrome no tapa botones. Se sacó el logo de las pantallas de inicio (ya está en el popup). PantallaFija.salir() borra el popup si quedó abierto. Contra Reloj (solo Gonzalo) sigue como estaba. pantalla-fija.js v8, quien-soy v11, que-numero-soy v8, bomba v14, mimica v7, canta-la-cancion v13, impostor v8, extensiones.css v111, sw v378.
```

```text
Fecha: 23/10/2026 — Trailer promocional de prueba: promo/trailer.html (girayadivina.com/promo/trailer.html, noindex). Video en HTML 9:16 de ~87 s, estilo trailer, con ▶/⏸, ⏹, saltar escenas, barra de tiempo, sonido sintetizado + música de partida, y botón ⛶ para ocultar controles y grabar la pantalla. Escenas: 1 Intro "Tipooo… un juego bien rioplatense", 2 Ruleta (gira, cae $800, consonantes, comprar vocal, QUIEBRA, pierde el turno), 3 Vencé al Tío del Asado + coleccionable + sello, 4 Recorré Uruguay (mapa con ruta), 5 Extensión Argentina, 6 Puzzle en vivo de a dos, 7 Ahorcado de a dos, 8 Tutti Frutti con BASTA y puntaje, 9 Más de 18 extensiones, 10 Final con logo, Google Play y web. Todo se dibuja desde el tiempo T (se puede pausar/saltar); ?e=N abre en la escena N. Gonzalo lo revisa y marca qué cambiar.
```

```text
Fecha: 23/10/2026 — Trailer (promo/trailer.html): se sacó la música de partida (a Gonzalo le molestaba) y se puso una banda de suspenso sintetizada estilo trailer de juego: zumbido grave de fondo, latidos en la intro, bombo + bajo + hi-hat (progresión Am-F-C-G a 100 bpm), arpegio que sube la tensión desde la escena 3 y acorde grande en el final. Va sincronizada con el tiempo T (pausa/saltos).
```

```text
Fecha: 23/10/2026 — Trailer escena 2 (Ruleta) rehecha como copia de una partida real: tarjetas Vos/Sofi con ronda/total y "turno", tablero con el marco fondo-lab-toxico y las fichas del juego, aviso, reloj, botones Girar/Comprar vocal/Resolver y teclado A-Z. La ruleta aparece encima como en el juego ("Girando…" y lo que salió). Secuencia: $800 → L → compra E → QUIEBRA → turno de Sofi → PIERDE TURNO → Vos resuelve y se ve DULCE DE LECHE completa con "¡RESUELTO!". Escena de 20 s.
```

```text
Fecha: 23/10/2026 — Tutti Frutti: resultados de la ronda en grilla tipo planilla (pedido de Gonzalo con imagen de referencia). Título "RESULTADOS · RONDA X DE Y"; cada casilla = palabra + puntos; ⚠️ dudosa en amarillo (tocarla explica por qué), salvada en verde, anulada tachada en rojo; la tuya dudosa tiene botón verde "🙋 Apelar"; las de otros dudosas tienen el sumador −/+ (0·5·10·20); las ✓ de otros tienen un botoncito ❌ en la esquina para anular; columna/fila TOTAL rosa (dorada la del que más sumó, con 🏆 en el nombre; 🏁 al que cantó BASTA). Frase abajo: "X va ganando… y tu «Y» salió en amarillo." Celular parado: hacia abajo (categorías en filas, jugadores en columnas) — Gonzalo lo prefiere así; acostado/pantalla ancha: jugadores en filas como la imagen. Se mantiene la tabla de puntos acumulados. tutti-frutti.js v72, extensiones.css v112, sw v379.
```

```text
Fecha: 23/10/2026 — Tutti Frutti resultados: con 4 o más jugadores las columnas se achican (56px mínimo) para que entren sin cortarse en el celular parado. Recordatorio: "🙋 Apelar" sale en tu palabra amarilla solo en partidas con amigos; contra bots, en tu amarilla sale el sumador −/+ (vos decidís). tutti-frutti.js v73, sw v380.
```

```text
Fecha: 23/10/2026 — Tutti Frutti contra bots: arreglo de "los bots quedan todos en 0". Los bots entregaban sus respuestas con 0,4–1,1 s de demora después del BASTA; si se tocaba "▶ Continuar" rápido (o el anfitrión publicaba antes), los resultados salían sin sus palabras. Ahora respuestasBots() las entrega al instante. Además, con 4+ jugadores la letra de las casillas es más chica y las palabras largas se cortan con guion en vez de por la mitad. tutti-frutti.js v74, extensiones.css v113, sw v381.
```

```text
Fecha: 23/10/2026 — Lobby de Extensiones: Tutti Frutti y Puzzle pasan a ser los dos primeros de "Más juegos" (intercambiados en el catálogo de extensiones.js con Sopa Fugaz y Rueda de Letras, que quedan donde estaban ellos). extensiones.js v52, sw v382.
```

```text
Fecha: 23/10/2026 — Popup "¡Llevá el juego en tu celular!" (#capaPlayWeb en index.html, funciones esAndroidNavegador() y avisoPlayWeb()). Solo en el navegador de un celular Android, en la pantalla de inicio limpia (sin ?parámetros de invitación, sin extensión abierta ni otra ventana), una sola vez por visitante (gya_aviso_play_web en localStorage = descargar/navegador/cerrado; sessionStorage evita repetirlo en la misma sesión). Sale al terminar la carga, antes del tutorial de bienvenida; al cerrarlo sigue el flujo normal (tutChequearBienvenida). Botón dorado → ficha de Play (nueva pestaña, sin redirección automática); "Continuar jugando en el navegador", ✕, Escape o tocar afuera lo cierran.
Detección de la app (TWA) — alcanza con una señal para NO mostrarlo: referrer android-app://, gya_origen_app="playstore", gya_app_version>0 (?app=N o ?comprobar_partida=1 del start_url, también lo marca la PWA instalada), llegada desde gvelazcamp.github.io (puente de la v16), o display-mode standalone/fullscreen/minimal-ui. ?probarplay=1 lo fuerza para probar. No requiere actualizar la app de Play. sw v383.
```

```text
Fecha: 23/10/2026 — Carga más rápida de imágenes (Gonzalo: "los íconos tardan un poquito en Social, Tienda y Extensiones" y "no carga todo de arranque").
- Inicio: los adornos eran PNG enormes (banderas 1 MB, mate 0,8 MB, pequeños desafíos 0,9 MB, tagline 0,7 MB, más para disfrutar 0,4 MB). Ahora usa assets/decor/*.webp al tamaño que se ven (~160 KB en total) y assets/logo-inicio.webp (840 px) para el logo del inicio. Los PNG originales quedan en el repo. Las imágenes de Sala TV y de la expansión (pantallas ocultas) bajan con fetchpriority="low" para no competir con el inicio. Con internet lento (4 Mbps) la carga pasó de ~18 s a ~12 s.
- Tienda: las grillas usan miniaturas en assets/mini/ (tableros 480 px, ruedas/marcos/sobres/shop 300 px, fichas 260 px; 17,7 MB → 3,2 MB). Si se agrega un tablero, rueda, ficha, marco, sobre o ítem de shop nuevo, HAY QUE generar también su miniatura en assets/mini/<carpeta>/<nombre>.webp (mismo nombre, siempre .webp; los marcos frame-x.png → mini/frames/frame-x.webp).
- precargarPantallas(): 3,5 s después del load, en un momento libre, baja de a poco las imágenes de la Tienda, los íconos de Extensiones y la imagen de Social (no lo hace con ahorro de datos). Extensiones ya no usa loading="lazy" en los íconos.
- assets/social/promo-redes.webp achicada a 720 px (355 → 155 KB). sw v384, extensiones.js v53.
```

```text
Fecha: 23/10/2026 — Puzzle: arte nuevo (hoja 4x3 de ChatGPT recortada en assets/puzzle-arte/: logo, como, solo, vivo, c_dibujo, c_aventura, c_heroe, c_gigante, c_ciudad, c_p3d, completo, fondo; icono.webp para el lobby). "Cómo jugar" ahora tiene logo + dibujo de los dos amigos armando en vivo y sale SIEMPRE al entrar (salvo si se entra con invitación a una sala). En "Elegí el puzzle" las categorías son tarjetas con dibujo (el select #elCat queda oculto y sigue mandando; la tarjeta 3D hace clic en #el3d, que queda oculto). El tablero tiene de fondo la mesa de madera (fondoMesa(): patrón del canvas, oscurecido; si no carga, el degradé violeta de antes). Trofeo arriba de "¡Puzzle completo!". puzzle.html v44, puzzle.js v44, extensiones.js v54, sw v385.
```

```text
Fecha: 23/10/2026 — Puzzle "Cómo jugar" entra sin scroll en cualquier celular: 6 renglones cortos (En vivo resaltado primero, arrastrar/girar/pellizcar, se pega sola, imagen chiquita y Guía, qué hay en Elegir, se guarda solo) en vez de 11, y logo/dibujo/letra que se achican según la altura (dvh + media queries de 700 y 600 px). Probado en 320x568, 360x640, 375x667, 390x740 y 412x800. puzzle.html v45, puzzle.js v45, sw v386.
```

```text
Fecha: 23/10/2026 — Fichas ⚡ de las extensiones, EN PRUEBA SOLO PARA GONZALO (Fichas en extensiones.js; activo() = esGonzalo(); para el resto todo sigue gratis). Cada juego tiene sus fichas: 3, +1 cada 30 min (gya_fichas_ext en localStorage). Se gasta 1 al empezar partida/nivel en solitario en: Sopa Fugaz (iniciarRonda), Rueda de Letras, Frases en Giro, Memoria en Giro (comenzar), El Rosco, Silabario, Ahorcado (iniciar), 100 Rioplatenses (iniciar, salvo duelo) y Moon Tap (jugar): una línea `if(window.Fichas&&!Fichas.usar(id,fn))return;` al principio de cada una. NO cobran: duelos con amigos, juegos de previa, Tutti Frutti, Puzzle, Palabra Secreta. Se ven: chip "⚡⚡⚡ +1 en mm:ss" arriba a la derecha dentro del juego (con animación "−1 ⚡" al gastar) y en cada tarjeta de la lista. Sin fichas: cartel con cuenta regresiva, "Recargar 3 fichas · 🪙150" (gastarMonedas), "Probá <otro juego> · tiene ⚡⚡⚡" y "Esperar". Las vidas del juego principal no se tocan. Pendiente si gusta: abrirlo a todos (cambiar activo()), y "Fichas infinitas 1 h" en la Tienda.
Nota: hay un error viejo (no de las fichas) en Ahorcado: si se sale y se vuelve a entrar mientras gira la ruleta, el giro anterior tira un error en consola (línea 116, $("#ahPregunta") del juego viejo). No afecta lo que se ve.
```

```text
Fecha: 23/10/2026 — Tutti Frutti: las categorías del campo, revisión y resultados muestran texto sin íconos; las tarjetas ilustradas para elegir categorías se conservan. Contra bots, la propia respuesta dudosa muestra «🙋 Apelar» y abre una revisión donde quien juega elige 0, 5, 10 o 20 puntos; se pueden cambiar mientras siga en resultados. Con amigos, Apelar sigue pidiendo revisión a los demás. En Tutti Frutti ya no se solicita Fullscreen API al cerrar el popup ni al entrar a una partida; así el navegador no muestra el aviso «Para salir de la pantalla completa…» con el dominio. La app conserva su presentación según la configuración de Android. Los bots conservan la probabilidad existente de error de tipeo del 5 % para respuestas de más de 6 caracteres. tutti-frutti.js v75, pantalla-fija.js v9, extensiones.css v115, sw v388.
```

```text
Fecha: 23/10/2026 — Tutti Frutti: por pedido de Gonzalo se retiró la ❌ roja que aparecía en las respuestas válidas de otros jugadores. Nadie puede anular una respuesta validada ni quitarle los puntos mediante votos u objeciones; los mensajes de ese tipo de clientes viejos se ignoran. La apelación de respuestas dudosas se conserva (contra amigos deciden los demás; contra bots el jugador elige los puntos). tutti-frutti.js v76, sw v389.
```

```text
Fecha: 23/10/2026 — Lobby de Extensiones: el chip de rayitos ⚡ en las tarjetas que cobran fichas usa margin-top:auto para quedar alineado al pie de cada tarjeta dentro de su fila, incluso cuando el título o la descripción ocupan distinta cantidad de renglones. No cambia las fichas ni la altura de los textos. extensiones.css v116, sw v390.
```

```text
Fecha: 23/10/2026 — Fichas ⚡ de las extensiones: se habilitaron para todos los perfiles salvo los testers Andrés, Flor, Grace, Juan E, Mari, Romina, Rubén y Vale. La comparación del nombre del perfil ignora mayúsculas, tildes y espacios repetidos. Esos perfiles no ven rayitos ni gastan fichas en los 9 juegos que cobran; el resto mantiene 3 fichas por juego, +1 cada 30 minutos. No se cambian vidas de la ruleta ni juegos que ya eran libres. La identidad actual es el nombre del perfil local (el juego no tiene cuentas autenticadas). extensiones.js v56, sw v391.
```

```text
Fecha: 23/10/2026 — Palabra Secreta también usa fichas ⚡: [CORREGIDO más abajo: ya no hay palabra gratis] cada "Jugar otra palabra" (iniciarPractica) gasta 1 ficha de Palabra Secreta (3, +1 cada 30 min, como las demás). Los testers libres no gastan. Se agregó "palabra-secreta" a JUEGOS en Fichas. palabra-secreta.js v19, extensiones.js v57, sw v392.
```

```text
Fecha: 23/10/2026 — Palabra Secreta es un juego normal como los demás: TODA palabra gasta 1 ficha ⚡, también la primera (antes la del día era gratis). Se cobra en enviar() al primer intento de cada palabra (marca partida.cobrada, así no cobra dos veces); los duelos no gastan. Al entrar, si la palabra guardada ya terminó, arranca una nueva directo; el final siempre ofrece "Jugar otra palabra" (se sacó "Volver a la palabra de hoy") y no se muestran textos de "Palabra de hoy"/"Palabra extra". Regla de Gonzalo: no volver a hablarle de "palabra gratis del día". Probado con usuario común: el 1er intento descuenta, el 2do no. palabra-secreta.js v20, sw v393.
```

```text
Fecha: 23/10/2026 — Recargar 3 fichas ⚡ de una extensión sale 🪙 400 fijo (antes 150), decisión de Gonzalo. PRECIO en Fichas (extensiones.js v58), sw v394.
```

```text
Fecha: 23/10/2026 — PASE DE EXTENSIONES (suscripción de Google Play). Gonzalo creó en Play Console la suscripción `pase_extensiones` (plan `mensual`, US$ 2,99, retrocompatible). Como la app (TWA / Digital Goods API) compra mandando solo el ID de producto y no puede elegir el plan, el anual va en una suscripción APARTE: `pase_extensiones_anual` (plan `anual`, US$ 14,99); el plan `anual` que quedó dentro de `pase_extensiones` hay que desactivarlo. Código: TN_PRODUCTOS_REALES (paseExtDias 31/366, noConsumible) → meta.paseExtHasta; paseExtActivo(); tnRestaurarCompras extiende +3 días mientras Play liste la suscripción vigente (si cancela, se vence solo). Fichas.cobra() no cobra con el pase; el cartel "sin fichas" ofrece el pase (solo dentro de la app de Play). El popup diario capaPromoTienda (antes "Escudos de la ruleta") ahora ofrece el pase Mensual/Anual y solo sale dentro de la app de Play y si no tiene el pase. Tienda: 2 tarjetas nuevas en dinero real. Falta probar una compra real en Android. extensiones.js v59, sw v395.
```

```text
Fecha: 23/10/2026 — Los testers libres de fichas (Juan E, Vale, Andrés, Flor, Grace, Mari, Romina, Rubén: Fichas.libre()) NO ven nada del Pase de extensiones: les sigue saliendo el popup viejo de "Escudos de la ruleta" (#ptEscudos dentro de capaPromoTienda; ptPrepararPopup() elige cuál mostrar), no ven las tarjetas .tn-pase de la Tienda ni el botón del pase en el cartel de fichas. extensiones.js v60, sw v396.
```

```text
Fecha: 23/10/2026 — CORRECCIÓN del popup del pase: Gonzalo quería reemplazar el popup de la PARTIDA DIARIA (el de "premio chico: coleccionable, marco o puntero"), NO el de los Escudos. El de "Escudos de la ruleta" (capaPromoTienda) volvió a estar igual que antes para todos y sigue saliendo segundo. El pase tiene su propio popup #capaPase: sale en lugar del de la Partida Diaria (paseOfrecerHoy: 1 vez por día, gya_promo_pase, solo en la app de Play, sin pase y no tester); la Partida Diaria queda "pospuesta" en Objetivos; "Más tarde" sigue con el de los Escudos. Los testers libres siguen viendo el de la Partida Diaria. Las entradas anteriores de hoy que dicen que el pase reemplazó a capaPromoTienda quedaron viejas. extensiones.js v61, sw v397.
```

```text
Fecha: 23/10/2026 — Video corto promo/video-extensiones.html (~17 s, 9:16, mismo motor que trailer.html): gancho de 3 s "¿Solo jugás a la ruleta? → el tablero RULETA se rompe → HAY 18 JUEGOS MÁS" + desfile de 8 extensiones + puzzle en vivo de a dos (Vos/Sofi con marcador) + "Entrá a Extensiones". Idea de Gonzalo: mostrarlo después de jugar 3 partidas del juego principal. PENDIENTE: NO está en el juego todavía; primero lo revisa Gonzalo.
```

```text
Fecha: 23/10/2026 — Video de Extensiones con la música que eligió Gonzalo ("Grand Prize Fanfare", hecha con Gemini): promo/video-extensiones-musica.mp3 = 0:00.55–0:13.55 + final 0:53.1–0:58.6 con fundido (≈18 s; el golpe final cae cuando aparece el logo). El video toca el mp3 sincronizado con T y los sonidos sintetizados quedan apagados (SINTE=false). A Gonzalo no le gustan los efectos tipo "psh psh" en la música. Versión para ver también en el artifact https://claude.ai/artifact/Y1c7QfJV91NKAqcCyiK3eb.
```

```text
Fecha: 23/10/2026 — El video de Extensiones ya está EN EL JUEGO: sale UNA sola vez (gya_video_ext_visto) cuando el jugador gana por primera vez el 3er paso de una ciudad (pasoActual===2: le faltan 2 partidas para el desafío del rival, tipo El Tío del Asado). Aparece al tocar "Siguiente →" / "Volver al mapa" (videoExtTalVez envuelve la acción que sigue). Pantalla completa negra con iframe promo/video-extensiones.html?embed=1 (sin controles, arranca solo, avisa al terminar con postMessage); "Saltar en 5…" → "Saltar video ⏭" a los 5 s; al final: "Ver Extensiones" (abre el lobby) o "Seguir jugando" (sigue con el paso/mapa). En embed se oculta el botón dibujado del video. Vista previa para Gonzalo en Pruebas: "Vista previa Video Extensiones". sw v398.
```

```text
Fecha: 23/10/2026 — Video de Extensiones: el celular de Gonzalo mostraba el botón dibujado del video y además los botones reales (versión vieja del video en caché). Se subió el iframe a ?embed=1&v=2: al cambiar el video hay que subir ese v. sw v399.
```

```text
Fecha: 23/10/2026 — Tutti Frutti: recuperado el aviso fuerte de ¡BASTA! al cortar una ronda. Ahora sonidoErrorExt suena de inmediato para todos los participantes cuando cualquiera canta BASTA, incluido quien lo canta; antes solo sonaba (450 ms tarde) para los rivales y quien terminaba oía solo los bips suaves. Se conservan los tonos y la revisión de respuestas previa al botón ¡BASTA!. Si se agota el tiempo sin que nadie cante, no se reproduce el aviso. tutti-frutti.js v77, sw v400.
```

```text
Fecha: 23/10/2026 — Inicio y lobby de Extensiones: el título "Extensiones Girá y Adiviná" pasa a "Jugá a las extensiones de Girá y Adiviná" tanto en el botón del inicio como dentro del lobby. El título del lobby puede ocupar varias líneas para no cortarse en teléfonos chicos y se actualizó la traducción al inglés. extensiones.js v62, extensiones.css v117, i18n.js v2, sw v400.
```

```text
Fecha: 23/10/2026 — Video de Extensiones: se trababa un poquito al arrancar. Ahora (1) se empieza a cargar invisible apenas gana el 3er paso (videoExtPrecargar, clase .precarga opacity .01, se limpia sola a los 3 min), mientras mira el cartel de fin; (2) en ?embed=1 el video decodifica todas las imágenes, espera fuentes y música, pinta cada escena una vez tapada con negro, avisa "video-ext-listo" y arranca recién con el mensaje "play" del juego (o solo con &auto=1, como en la vista previa); (3) el "Saltar en 5" cuenta desde que el video empieza de verdad ("video-ext-empezo"). Iframe v=3, sw v400.
```

```text
Fecha: 23/10/2026 — Barra con la dirección (girayadivina.com) que aparece 1–2 s al abrir la app de Play "en frío" (después de mucho rato sin usarla; en caliente no sale). Revisado: Play Console → Enlaces profundos de la v17 (1.0.0.17) tiene girayadivina.com y gvelazcamp.github.io verificados ✓; el juego no usa www. Causa: error de Chrome desde la versión 152 en TODAS las TWA (GoogleChrome/android-browser-helper#624, abierto, sin arreglo; pasa aunque la app sea pantalla completa). No se arregla desde el código del juego ni con la v18.
PENDIENTE (Gonzalo dijo que sí, para más adelante): si Google no lo arregla o le molesta mucho, pasar la app de TWA a Capacitor (el juego adentro de la app, sin Chrome: la barra no puede salir nunca). Costos: nueva mudanza de partidas (el progreso está en el almacenamiento de Chrome), reconectar los pagos de Play (monedas, vidas, sin publicidad, pase de extensiones) con un complemento nativo y armar el paquete con Android Studio. Antes, revisar si una versión nueva de Chrome ya lo arregló.
```

```text
Fecha: 23/10/2026 — Íconos de Extensiones que tardaban en aparecer al entrar. Causa: los logos de la raíz (logo-*.svg/.webp/.png) no están en assets/, así que el service worker los trataba como "red primero, sin caché" y los volvía a bajar cada vez. Arreglo: sw.js ahora sirve de la caché primero TODA imagen/audio del sitio (svg, webp, png, jpg, gif, mp3), esté o no en assets/ (ojo: si se cambia el contenido de un logo con el mismo nombre, subir CACHE_NAME). Además extensiones.js precarga y decodifica los logos del lobby al cargar el juego y los guarda (iconosListos), y las tarjetas usan decoding="sync". Prueba con red lenta: antes 7 pedidos a internet al abrir Extensiones, ahora 0. extensiones.js v63, sw v401.
```

```text
Fecha: 23/10/2026 — REEL para Instagram (lanzamiento en redes): promo/reel.html (~25 s, 9:16). Gancho de 3 s: "SI LA SACÁS EN 3 SEGUNDOS… SOS MÁS RIOPLATENSE QUE EL MATE 🧉" con tablero D_LC_ D_ L_CH_ + cuenta 3-2-1 → "¡DULCE DE LECHE!". Después cortes rápidos reusando las escenas del trailer aceleradas (clip(id,desde,hasta,vel)): Quiebra, Tío del Asado, Uruguay, Argentina, Puzzle de a dos, Tutti Frutti, 18 extensiones, final con logo y Google Play. Música: promo/reel-musica.mp3 (Grand Prize Fanfare 0:00.55–0:20.55 + final 0:53.1–0:58.6; el golpe final cae con el logo). Sin sonidos sintetizados. Para grabar: ⛶ y grabar pantalla. También publicado como artifact para verlo desde el celular.
```

```text
Fecha: 23/10/2026 — Reel: el título del gancho se cortaba a los costados (ahora 7.6cqw y sin zoom de entrada). Después de QUIEBRA se agregó "Pierde turno" (clip e2 14.1–17.6 ×2) y una escena nueva "¿Te tocó PIERDE TURNO? 🛡️ USÁ UN ESCUDO y seguí jugando · Escudos en la Tienda" (e0esc, 2.2 s). Reel ≈ 29 s; música recortada de nuevo (0:00.55–0:24.3 + final 0:53.1–0:58.6) para que el golpe final siga cayendo con el logo.
```

```text
Fecha: 23/10/2026 — Reel con música nueva de Gonzalo ("The Big Reveal", Gemini, 40 s): promo/reel-musica.mp3 = 0:05.05–0:08.25 (suspenso del gancho; el golpe de 0:07.5 cae justo en "¡DULCE DE LECHE!") + 0:14.4–0:39.6 (desde el golpe de 0:15 sube hasta el final; el golpe grande de 0:37 cae con el logo), cruce de 0,3 s. Reemplaza a Grand Prize Fanfare en el Reel (el video de Extensiones sigue con Grand Prize Fanfare).
```

```text
Fecha: 23/10/2026 — Reel auditado: entre 0:03 y 0:05 se veía negro porque los dos clips de la ruleta usan la misma escena (e2) y pintar() la volvía a ocultar; ahora oculta todas las escenas y muestra la actual. La ruleta se va con corte seco antes de QUIEBRA / PIERDE TURNO (no quedan capas encimadas), QUIEBRA más chico (16cqw) para que no se corte. Clips: Quiebra 9.9–13.7, Pierde turno 14.1–16.7; música The Big Reveal recortada 0:05.05–0:08.25 + 0:14.9–0:39.6.
```

```text
Fecha: 23/10/2026 — Reel: el cierre dura 4,8 s para que girayadivina.com se lea bien (≈30 s en total). Se exportó a MP4 1080×1920 (30 fps, H.264 + AAC) cuadro por cuadro con Playwright (T fijo por cuadro, body.limpio) + ffmpeg con promo/reel-musica.mp3, para pasarlo por WhatsApp o subirlo a Instagram. El MP4 no se guarda en el repo (pesa ~18 MB).
```

```text
Fecha: 23/10/2026 — Reel más lento (a Gonzalo le dijeron que iba demasiado rápido): Quiebra/Pierde turno ×1.6, Tío del Asado ×1.9, Uruguay/Argentina ×2.2, Puzzle/Tutti ×2, Extensiones ×1.7, escena Escudo 3 s → ≈36,5 s. Música: The Big Reveal seguida desde 0:05.05 (sin cortes): el golpe de 0:07.5 cae en "¡DULCE DE LECHE!" y el de 0:37 cuando aparece el logo.
```

```text
Fecha: 23/10/2026 — Reel: QUIEBRA casi no se veía. Nuevo tramos(id,nombre,[[desde,hasta,dur]…]) en promo/reel.html: la ruleta gira rápido, QUIEBRA entra a velocidad normal y queda quieta ~1,3 s; lo mismo PIERDE EL TURNO (~0,9 s). Reel ≈38,4 s. Música: The Big Reveal 0:05.05–0:30 + 0:28.125–final (se repite un compás de 1,875 s a 128 BPM para que el golpe de 0:37 siga cayendo con el logo).
```

```text
Fecha: 23/10/2026 — Videos del mapa (ciudades con loop: Durazno, Montevideo, Salto, Tacuarembó, Cabo Polonio) quedaban en NEGRO un rato al entrar. Causas y arreglos:
1) El navegador pide los .mp4 "por partes" (Range → respuesta 206) y el service worker no guardaba las parciales: se bajaban de nuevo cada vez. Ahora sw.js (videoDesdeCache) baja el .mp4 entero una vez, lo guarda (clave sin ?query) y responde las partes (206 con Content-Range) desde lo guardado.
2) En la pantalla de la ciudad, el <video> reemplazaba al dibujo y hasta tener imagen se veía negro. Ahora el dibujo (duraznoImg) queda siempre abajo y da el tamaño; el video va encima (absolute) y aparece con un fundido recién al evento "playing" (clase .listo). Lo mismo en el mapa general (.region video).
3) El <video id="duraznoVideo"> ya no baja durazno-loop.mp4 al abrir el juego (sin src/autoplay; se pone al entrar a la ciudad).
4) precargarVideosMapa(): al abrir el mapa baja de a uno los videos de todas las ciudades (una vez por sesión, no con ahorro de datos) para que queden guardados.
Probado: Range 0-99 / 1000- / -500 responden 206 correcto; un video servido desde la caché arranca en ~60 ms. (El Chromium de pruebas no tiene H.264, se probó con una copia en VP9.) sw v402.
```

```text
Fecha: 24/10/2026 — Al compartir girayadivina.com (Instagram, WhatsApp) la vista previa mostraba el logo cortado: og:image era el ícono cuadrado (icono-512.png) y las redes lo recortan horizontal. Nueva imagen para compartir assets/compartir/og-girayadivina.jpg (1200×630: logo al centro, ruleta a la izquierda, banderas a la derecha, fondo de Montevideo desenfocado); og:image/twitter:image apuntan ahí. Las redes guardan la vista previa vieja un tiempo (Facebook/Instagram: se puede refrescar en developers.facebook.com/tools/debug). sw v403.
```

```text
Fecha: 24/10/2026 — Auditoría de carga ("otra vez algo negro"). CAUSA DE FONDO: cada vez que se publicaba un cambio se subía CACHE_NAME y el service worker borraba TODA la caché, incluidas imágenes de mapas (200–650 KB c/u), videos de ciudades e íconos → después de cada actualización el celular bajaba todo de nuevo y se veía negro/lento. ARREGLO: sw.js ahora tiene una caché aparte y fija para imágenes/audios/videos, CACHE_ASSETS="gya-assets-v1", que NO se borra al subir CACHE_NAME (al activarse, las imágenes/videos de las cachés viejas se pasan a la nueva, así no se baja nada de nuevo). Los .txt/.json de assets (diccionario) siguen en la caché versionada. REGLA NUEVA: subir CACHE_NAME en cada cambio de código como siempre; si se reemplaza una imagen/video con el MISMO nombre, subir CACHE_ASSETS (o mejor, usar otro nombre o ?v=). Además el mapa general pide los dibujos de las ciudades a medida que se acercan a la pantalla (antes los ~19 de golpe, compitiendo) y la precarga de videos del mapa arranca a los 8 s. Probado simulando una actualización: la caché de assets (169 archivos) sobrevive. sw v404. CLAUDE.md actualizado.
```

```text
Fecha: 24/10/2026 — Mapa: al entrar se veía un instante la primera ciudad (Durazno, arriba de todo y a medio cargar, con negro abajo) y después saltaba a la ciudad actual (video de Gonzalo). El scroll a la ciudad actual se hacía en un setTimeout de 80 ms; ahora se hace en el momento, antes de que se pinte (queda el setTimeout como corrección). Así además se piden primero los dibujos de la ciudad donde estás. sw v405.
```

```text
Fecha: 24/10/2026 — CORRECCIÓN (video de Gonzalo: "nunca hacía esto, entraba y estaba todo impecable"): se SACÓ la carga "a medida que te acercás" de los dibujos del mapa (mapaFondoObs, del 24/10) porque al entrar mostraba un cuadro negro y el dibujo se pintaba de a pedazos. Vuelve a ponerse el fondo de todas las ciudades al instante, como antes (ahora salen de la caché fija de assets). Además precargarMapaActual(): al abrir el juego deja bajados y decodificados los dibujos de tu ciudad actual y las de al lado, así el mapa aparece completo desde el primer cuadro (probado: el primer cuadro ya tiene el dibujo). REGLA: el mapa tiene que aparecer completo al entrar; no volver a cargar sus dibujos de forma diferida. sw v406.
```

```text
Fecha: 24/10/2026 — Ciudades con video: al empezar el video la imagen "se agrandaba" (de chico a grande). Causa: el dibujo original (ej. salto.webp, 941×1672) está más alejado que el video (salto-loop.mp4, 886×1552, más cerca). Arreglo: para las ciudades con video se usa como dibujo de fondo el PRIMER CUADRO del video (assets/worlds/<ciudad>-loop-poster.webp, sacado con ffmpeg), mismo encuadre y medida → el fundido al video no cambia nada. fondoCiudad(d) lo elige (mapa general, pantalla de la ciudad y precarga). Si se cambia un video *-loop.mp4, regenerar su poster: ffmpeg -i X-loop.mp4 -frames:v 1 -c:v libwebp -quality 82 X-loop-poster.webp. sw v407.
```

```text
Fecha: 24/10/2026 — Pedido de Gonzalo: "¿no puede ser solo el video, como antes?". En la pantalla de la ciudad vuelve a estar SOLO el video (el dibujo queda oculto, como siempre), sin capas ni fundido. Al video se le pone como poster el primer cuadro del mismo video (fondoCiudad → *-loop-poster.webp): mientras arranca se ve esa imagen dentro del mismo video, del mismo tamaño, nunca negro. En el mapa general también sin fundido (video encima del fondo, con el mismo poster). Al abrir el juego se guarda en el celular el video de tu ciudad actual. sw v408.
```

```text
Fecha: 24/10/2026 — iPhone: cada ícono agregado a inicio tiene su propia memoria; al pasar de la dirección vieja a girayadivina.com (o al reinstalar) arrancaba vacío y pedía registrarse: parecía que se perdía todo (caso Valentina). Nuevo: RECUPERAR PARTIDA POR NOMBRE. En un celular SIN perfil, si escribís un nombre que ya tiene partida guardada (respaldo estado_juego en gya_ranking, grupo usuarios o global), sale "¿Sos vos, NOMBRE?" con 6 avatares; si tocás el que usabas (gya_avatar del respaldo), se copia todo el respaldo (claves gya_/larueda_, menos ESTADO_JUEGO_EXCLUIR) y recarga. Si te equivocás, pide otro nombre. Si el celular ya tiene perfil, sigue el aviso de siempre "ese nombre ya lo usa otro jugador". Funciones: filaPartidaGuardada, mostrarRecuperar, recuperarPartida (#capaRecuperar). La barra arriba en iPhone para los que tenían el ícono viejo no se puede sacar desde el código: tienen que agregar girayadivina.com a inicio de nuevo (Gonzalo les avisa); con esto no pierden la partida. sw v409.
```

```text
Fecha: 24/10/2026 — El Rosco en una sola pantalla (pedido de jugadores: había que deslizar para ver la pista y donde se escribe). ajustarPantalla() usa visualViewport (el alto real con el teclado abierto): con teclado → clase .rr-compacto (se ocultan "⟵ Extensiones" y el logo, HUD y pista más chicos) y la rueda se achica sola para que entren rueda + pista + respuesta; sin teclado, la rueda también se achica si la pantalla es baja. Se recalcula al abrir la ronda, al enfocar/salir del campo y al cambiar el visualViewport. Probado: Pixel 7 con teclado (alto 430) entra todo (respuesta termina en 420); sin teclado igual que antes. En un iPhone SE de 1ª generación (4") con teclado queda ~20 px justo. No se tocó el deslizado (sin overflow/touch-action). rosco v16, extensiones.css v118, sw v410.
```

```text
Fecha: 24/10/2026 — CORRECCIÓN Rosco (Gonzalo: "que vuelva a normal; el problema es que el teclado tapa donde se escribe"; en su Android se tapaba un poquito). Se sacó el modo compacto (.rr-compacto: ocultar logo, achicar rueda/HUD). Ahora el Rosco se ve igual que siempre y ajustarPantalla() solo hace que la ventana del juego (#extShell) mida exactamente lo que queda arriba del teclado (visualViewport.height y offsetTop, sirve para Android que achica la pantalla y para iPhone que pone el teclado encima) y, si el campo de respuesta queda abajo, corre la ventana lo justo para que se vea. Al salir se limpian height/top/bottom del shell. Probado: Android con pantalla de 500 → respuesta termina en 490; iPhone simulado de 430 → 420; logo visible. rosco v17, extensiones.css v119, sw v411.
```

```text
Fecha: 24/10/2026 — Los personajes/logos de los popups de inicio de cada juego tardaban en aparecer. Ahora extensiones.js (precargarIconos → ARTE_POPUPS) baja y decodifica al abrir el juego, 1,5 s después de los íconos, los personaje.webp de los 8 juegos que lo tienen, los logo.webp de 17 juegos y tutti/como.webp + ficha.webp (~0,8 MB, quedan guardados en la caché fija de assets). Probado: 27 imágenes precargadas sin fallos. Sobre "algo verde y azul abajo de las palabras al escribir en el Rosco": el campo ya tiene autocompletar/corrector/ortografía apagados; lo más probable es la manijita del cursor o el subrayado del teclado del celular (no es del juego) — se pidió captura. extensiones.js v64, sw v412.
```

```text
Fecha: 24/10/2026 — Tutti Frutti, "Famoso / banda": "Emanero" salió como mal escrita y sugería "Enero". Arreglos: (1) nueva lista window.TUTTI_BANDAS en tutti-frutti-datos.js (~375 bandas y artistas, sobre todo rioplatenses: cumbia, cuarteto, rock nacional, urbano/trap, folclore, murga/candombe, tango, más bandas internacionales conocidas). Se acepta el nombre completo y sin el artículo inicial ("Vela Puerca", "Piojos"), pero NO la última palabra sola (para que "Los Palmeras" no habilite cualquier palabra). Se sacaron nombres sueltos que son palabras o nombres comunes (Soledad, Rodrigo, Chocolate, Virus…). (2) La sugerencia "Lo correcto es…" en Famoso/Marca/Película ahora solo aparece si Wikipedia confirma que la sugerencia ES de esa categoría (antes alcanzaba con que no dijera que no: por eso "Enero"). Auditoría de palabras OK. tutti-frutti.js v78, tutti-frutti-datos.js v35, sw v413.
```

```text
Fecha: 24/10/2026 — Ruleta de la partida (a Gonzalo, jugando en una sala de a dos, le salió PIERDE TURNO de entrada y dos veces seguido; "era regla"). Antes solo se protegía el primerísimo giro de un usuario nuevo en ¡Jugar ahora! y se permitían hasta 2 PIERDE seguidos. Ahora en hostGirar() — por donde pasan TODOS los giros (anfitrión, invitado vía mensaje "girar", bots, Sala TV, local) — el primer giro de la partida nunca es PIERDE/QUIEBRA y después de un PIERDE o QUIEBRA el siguiente nunca es otro malo (S.girosHechos, S.ultimoMalo; S se crea de nuevo en cada partida). Simulación de 20.000 partidas: 0 primeros giros malos, 0 malos seguidos, ~13% de giros malos. Regla anotada en "Reglas de contenido y visuales". sw v414.
```

```text
Fecha: 24/10/2026 — Sala de a dos: en el turno de un jugador SIN tablero (Vale) el tablero pasaba a liso y las letras se agrandaban; en el turno de Gonzalo (con tablero) se achicaban. aplicarTableroSegunTurno(): en host/guest, si al que le toca no tiene tablero, se usa el tuyo equipado o, si tampoco tenés, el de otro jugador de la sala. Así el tablero y el tamaño de las letras quedan iguales toda la partida. Probado los 4 casos (vos con/sin tablero × turno de cada uno): siempre con marco. sw v415.
```

```text
Fecha: 25/10/2026 — Puzzle (Gonzalo: "una persona nueva o mayor, ¿cómo se da cuenta de que hay puzzle cooperativo?"). El popup de inicio ahora termina con dos botones: "🧩 Armar solo" y "👥 Armar con un amigo" (turquesa, abre directo la pantalla de sala: crear sala / unirse con código). El renglón destacado dice "¿Con alguien? Tocá 👥 Armar con un amigo…". En el selector de arriba "👥 Cooperativo" pasó a "👥 Con un amigo". puzzle.html/puzzle.js v46, sw v416.
```

```text
Fecha: 25/10/2026 — Puzzle (Gonzalo: "lo primero después del popup tiene que ser elegir qué puzzle y cuántas piezas, como en la sala; si no entra directo a un puzzle"). Ahora "🧩 Armar solo" abre "🧩 Elegí tu puzzle" (si no hay uno a medio armar para seguir) y "Empezar otro" también. En esa pantalla, jugando solo, hay botones de piezas: 12, 25, 49, 70, 100, 150, 300 (Aventuras desde 49; Gigantes siguen con 500/1000). En la sala sigue igual ("Elijan el puzzle"). pintarPiezasSolo() en puzzle.html. Probado: elegir 70 → arma 72 piezas (grilla más cercana). puzzle v47, sw v417.
```

```text
Fecha: 25/10/2026 — Puzzles 3D OCULTOS (Gonzalo: "ocultarlo porque tenemos que armarlo bien"). En puzzle.html ver3D() (true solo si el juego de afuera es Gonzalo: parent.esGonzalo()) controla: la tarjeta "3D" y el botón "🧊 Puzzles 3D" de Elegir, y la opción "🧊 3D" del selector de imagen (se quita). En el popup "Cómo jugar" se sacó la mención a los estadios 3D. Para volver a mostrarlos a todos: que ver3D() devuelva true y volver a poner el texto. puzzle v48, sw v418.
```

```text
Fecha: 25/10/2026 — Fichas ⚡ también en Tutti Frutti y Puzzle (pedido de Gonzalo). Mismas reglas que el resto (3 por juego, +1 cada 30 min, recarga 🪙 400, testers libres no gastan). Tutti Frutti: 1 ficha por PARTIDA contra la máquina (una partida = 3 rondas/letras; se cobra en jugarBots y en cada "Revancha" contra bots); con amigos no gasta. Puzzle: 1 ficha por cada puzzle NUEVO que empezás solo (armarElegidoSolo, desde puzzle.html vía parent.Fichas); seguir uno guardado o armar con un amigo no gasta. El cartel "sin fichas" sale arriba del iframe del Puzzle. Probado: 3 puzzles → 0 fichas, el 4.º muestra el cartel. extensiones.js v65, tutti-frutti.js v79, puzzle v49, sw v419.
```

```text
Fecha: 25/10/2026 — Texto: "Jugá a las extensiones de Girá y Adiviná" pasa a "Jugá más juegos de Girá y Adiviná" (botón del menú principal y título del lobby de Extensiones; en inglés "Play more Girá y Adiviná games"). i18n v3, extensiones.js v66, sw v420.
```

```text
Fecha: 25/10/2026 — Tutti Frutti contra la máquina: los bots "Normal" eran muy lentos (Gonzalo completó todo y ellos tenían 2). Nuevos tiempos por categoría (MODOS_BOT): Normal 3,5–5 s (antes 6–9), Difícil 2–3 s (antes 3–4,5), Persona mayor 9–14 s (antes 15–25); siguen +25% en categorías/letras difíciles. También saben un poco más (hab Normal .90–.97, Mayor .75–.90). tutti-frutti.js v80, sw v421.
```

```text
Fecha: 25/10/2026 — Tutti Frutti: el modo Difícil vuelve a como estaba (3–4,5 s por categoría; Gonzalo: "el difícil está bien, como estaba"). Normal (3,5–5 s) y Persona mayor (9–14 s) quedan con los tiempos nuevos. tutti-frutti.js v81, sw v422.
```

```text
Fecha: 25/10/2026 — Tutti Frutti: "Anterior" y "Siguiente" recorren libre todas las categorías en orden (dan la vuelta), estén vacías o completas. Anterior ya no queda gris al principio; Siguiente con el campo vacío pasa a la que sigue en vez de trabar (si hay algo escrito sigue validando la letra). Lo escrito queda guardado. tutti-frutti.js v82, sw v423.
```

```text
Fecha: 25/10/2026 — Tutti Frutti: botón "🚫 Anular una respuesta" arriba de "Puntos (con esta ronda)". Abre la lista de respuestas que suman; tocás la que está mal (aunque el juego la diera por buena, ej. «una» como película) y pasa a 0, tachada en rojo; los puntos se recalculan (el otro puede pasar a 20 si queda único). Cualquiera puede anular; se avisa a todos y queda en el chat; se puede "↩️ Devolver". tutti-frutti.js v83, extensiones.css v120, sw v424.
```

```text
Fecha: 25/10/2026 — Tutti Frutti: "Anular una respuesta" ya no anula directo con amigos: es como Apelar al revés. Al que la pide le sale "Les preguntamos a los demás" y a los demás un popup "X quiere anular «palabra» ¿Vale o no vale?". Con que uno diga ❌ No vale, pasa a 0 y se recalculan los puntos; si dice ✅ Sí vale, queda como estaba y se avisa. Contra bots y "↩️ Devolver" siguen siendo directos. tutti-frutti.js v84, sw v425.
```

```text
Fecha: 25/10/2026 — Tutti Frutti: el botón "🚫 Anular una respuesta" ahora es chico, tipo pastilla como "🙋 Apelar" (rojo), en vez del botón grande. tutti-frutti.js v85, extensiones.css v121, sw v426.
```

```text
Fecha: 25/10/2026 — Tutti Frutti: el popup del pedido de anular ahora pregunta "¿La anulamos?" con botones "🚫 Anular (pasa a 0)" y "✅ No anular" (antes "Sí, vale / No vale" confundía). tutti-frutti.js v86, sw v427.
```

```text
Fecha: 25/10/2026 — REEL del Tutti Frutti: promo/reel-tutti.html (≈29 s, 9:16, mismo motor que reel.html). Gancho de 3 s: "NOMBRE, ANIMAL Y PAÍS CON U… ¿EN 3 SEGUNDOS?" con cuenta 3-2-1 → ULISES / URUBÚ / URUGUAY + ¡BASTA! (cae con el golpe de la música). Después: papelito de la escuela → "ahora es online" (como.webp), sale la letra M, copia de la pantalla de juego (Anterior/Después/Siguiente), ¡BASTA!, grilla de puntos Vos/Sofi (10 única · 5 repetida · 20 si sos el único), "¿Te quieren hacer trampa?" con el Anular de «UNA» (popup ¿La anulamos?, el otro pasa a 20), al mejor de 3 rondas, amigos o bots, y cierre Tutti Frutti + Girá y Adiviná + Google Play + girayadivina.com. Música: promo/reel-tutti-musica.mp3 (The Big Reveal 0:05.05–0:08.25 + 0:14.4–final; el golpe de 0:37 cae con el logo). MP4 1080×1920 exportado cuadro por cuadro (no se guarda en el repo).
```

```text
Fecha: 25/10/2026 — Reel del Tutti Frutti, ajustes de Gonzalo: el gancho ahora dice "ELEGÍ TUS CATEGORÍAS… ¿LAS COMPLETÁS EN 3 SEGUNDOS?" con 6 categorías que entran una por una (Nombre ULISES, Animal URUBÚ, País URUGUAY, Fruta UVA, Marca UMBRO, Profesión UTILERO) y la ficha U. El papelito dura más (4 s) y se escribe a mano palabra por palabra. Reel ≈30,4 s; música The Big Reveal 0:05.05–0:08.25 + 0:13.2–final. Gonzalo va a pedir otra música a Gemini (prompt con los segundos de cada golpe).
```

```text
Fecha: 25/10/2026 — Reel del Tutti Frutti: el botón "🚫 Anular una respuesta" del video salía corrido a la derecha y cortado (la animación pisaba el centrado); ahora queda centrado completo.
```

```text
Fecha: 25/10/2026 — Reel del Tutti Frutti con la música que eligió Gonzalo ("Sudden Victory Lap", desde el segundo 24): promo/reel-tutti-musica.mp3 = 0:23.65–0:54.1 con fundido final de 1,9 s (empieza en 23,65 para que el golpe de 0:26.1 caiga justo en el ¡BASTA! del gancho). Reemplaza a The Big Reveal en este reel.
```

```text
Fecha: 25/10/2026 — Rosco: las palabras se repetían entre partidas (había ~8 por letra y solo ~6 del nivel). Banco ampliado de 203 a 521 definiciones (≈13 a 30 por letra; todas chequeadas con tests/auditar-palabras.cjs: 0 errores, ninguna choca con otro juego). Nueva elección: por letra salen primero TODAS las que no viste (de cualquier nivel, prefiriendo el tuyo) y recién cuando se agotan esa letra vuelve a empezar (Vistas "rosco" en localStorage). Simulado: ~24 partidas seguidas sin repetir ninguna palabra en nivel 1 y ~13 en nivel 4 (24 letras; la K es la que limita). rosco-rioplatense.js v18, datos v5, sw v428.
```

```text
Fecha: 25/10/2026 — Tutti Frutti: se sacó el botón "Después" (si completabas todo con Después nunca llegaba al ¡BASTA!). Quedan solo "⟵ Anterior" y "Siguiente ➜": Siguiente con el campo vacío pasa a la que sigue; con algo escrito valida la letra. Apenas TODAS las categorías tienen una palabra válida (completadas en cualquier orden, con Siguiente o con Anterior) aparece la revisión con el botón ¡BASTA!. Probado con Playwright: saltear las 6 con Siguiente y completarlas solo con Anterior → aparece ¡BASTA!. tutti-frutti.js v87, sw v429.
```

```text
Fecha: 25/10/2026 — Reel del Tutti Frutti: nueva escena "Apelar" antes de "Anular": "¿EL JUEGO NO TE LA RECONOCIÓ?" → MATAMBRE en amarillo ⚠️ +0 → 🙋 Apelar → popup en el celu de Sofi "¿Le sumás los puntos?" → ✅ Sí, vale → pasa a verde +10 → "APELÁ Y SUMÁ TUS PUNTOS · tus amigos deciden si vale". Reel ≈34,4 s; música Sudden Victory Lap 0:23.65 hasta el final del tema (termina natural, fundido de 1 s).
```

```text
Fecha: 25/10/2026 — Reel del Tutti Frutti: la escena de Anular ya no dice "¿Te quieren hacer trampa?" (no es trampa) ni nada que haga pensar que el juego falla; ahora: "¿UNA RESPUESTA NO TE CONVENCE? 🤨" → Anulala y listo.
```

```text
Fecha: 25/10/2026 — Tutti Frutti online: aviso de salida. Si alguien sale de la app en plena ronda (por ej. a buscar en internet), a todos les aparece un aviso chico (el toast de arriba, no frena el juego): "Pepito: ¡no vale hacer trampa! Aviso 1 de 3", y al que salió "Saliste del juego. Aviso 1 de 3". A la 3ª salida en la MISMA ronda pierde los puntos de esa ronda (todo a 0, con 🚫 al lado del nombre en la grilla, y los demás se recalculan: si quedan únicos suman 20). Se cuenta con visibilitychange solo en fase "jugando" (antes del BASTA) y contra bots no cuenta. El aviso se manda al salir y se repite al volver (por si el celu cortó la conexión). Se reinicia en cada ronda. También queda anotado en el chat. Probado con Playwright (simulando salidas propias y de otro jugador). tutti-frutti.js v88, sw v430.
```

```text
Fecha: 25/10/2026 — Tutti Frutti: al sacar "Después" los botones quedaban corridos a la izquierda con un hueco; ahora "⟵ Anterior" y "Siguiente ➜" ocupan todo el ancho (2 columnas). extensiones.css v122, sw v431.
```

```text
Fecha: 25/10/2026 — Tutti Frutti, pantalla de escribir (capturas de Gonzalo en iPhone y Samsung): en iPhone, al abrirse el teclado la página se corría para arriba y el reloj/"Letra"/Salir quedaban tapados por la barra de arriba. Ahora la pantalla del Tutti ocupa solo la parte visible (visualViewport: top=offsetTop, height=vv.height, como el Rosco) y el bloque ficha + categoría + caja + botones queda centrado entre el reloj y el teclado (margin auto). El reloj ahora está centrado de verdad (antes corrido a la derecha). No se tocó el deslizado. tutti-frutti.js v89, extensiones.css v123, sw v432.
```

```text
Fecha: 25/10/2026 — Tutti Frutti, aviso de salida (Gonzalo jugó contra un iPhone y no le apareció nada): al salir de la app el celu corta la conexión y el aviso se perdía; además al volver solo se reenviaba si la ronda seguía. Ahora al volver se reenvía 5 veces (0; 1,5; 4; 8 y 15 s) aunque la ronda ya haya terminado (los demás no lo cuentan dos veces). Nuevo: si alguien toca Salir y abandona la sala, a los demás les aparece "🚪 Pepito salió de la partida". OJO: los dos celulares tienen que tener la versión nueva (cerrar y abrir el juego). tutti-frutti.js v90, sw v433.
```

```text
Fecha: 25/10/2026 — REEL del Puzzle: promo/reel-puzzle.html (≈34,4 s, 9:16, mismo motor y misma música que el del Tutti: reel-tutti-musica.mp3, mismos golpes). Las piezas se dibujan en un canvas con forma de rompecabezas de verdad (pestañas). Escenas: gancho "¿TE ANIMÁS A ARMARLO? 🧩" (piezas del dragón volando a su lugar → ¡COMPLETO! en el golpe) · Más de 40 puzzles para elegir (miniaturas + Dibujos/Aventuras/Héroes/Ciudades/Gigantes) · De 12 a 1000 piezas · Arrastrá la pieza… ¡y se pega sola! 🧲 · ¿Y de a dos? (vivo.webp) · Armalo en vivo con un amigo (dos celulares, lo que pone uno aparece en el otro) · Chat · Se guarda solo (lunes 25% → miércoles 60% → sábado 100%) · ¡Puzzle completo! + Compartí la foto · cierre Puzzle + Girá y Adiviná + Google Play + girayadivina.com.
REGLA de Gonzalo para los videos: los "3 segundos" son el tiempo del gancho para atrapar, NO se escriben en el video ("en 3 segundos", cuenta 3-2-1). Se sacaron del Tutti (ahora "¿LAS COMPLETÁS ANTES QUE TODOS?") y del Puzzle.
```

```text
Fecha: 26/10/2026 — Reel del Puzzle: el gancho tenía un puzzle de 9 piezas ("van a decir qué fácil"). Ahora son 100 piezas (10×10, ciudad-vapor) desparramadas por toda la pantalla con "🧩 100 PIEZAS", que vuelan a su lugar en ola y en el golpe de la música queda ¡COMPLETO! con el marco dorado.
```

```text
Fecha: 26/10/2026 — Inicio: el botón "¡Jugar ahora!" ahora dice abajo "Girá, resolvé y recorré Uruguay y Argentina" (antes "Uruguay, vos contra la máquina", que no contaba de qué se trata). Elegido por Gonzalo. En celulares chicos (360 px) baja a 2 líneas. También en inglés (i18n.js v4). sw v434.
```

```text
Fecha: 26/10/2026 — REEL del Rosco: promo/reel-rosco.html (≈34,4 s, 9:16, mismo motor y misma música que los de Tutti y Puzzle). Gancho: "SI SOS URUGUAYO, ESTA LA SABÉS 🧉" con la B en el rosco y la pista real "Forma uruguaya de llamar a un niño" → se escribe BOTIJA y en el golpe queda verde + ¡BOTIJA!. Después: logo + personaje "Una letra, una pista, una palabra · bien rioplatense", el rosco gira y te toca la C, jugando con pistas reales (CHAMUYO, YAPA, QUINCHO), ¡Pasapalabra!, completá todo el rosco (letras verdes/rojas + reloj), 1 vs 1 con un amigo, más de 500 definiciones (palabras nuevas en cada partida), ¡Rosco perfecto! y cierre. Ojo: no poner "el Pasapalabra rioplatense" (es marca de un programa de TV).
```

```text
Fecha: 26/10/2026 — Reel del Rosco con música propia para adultos ("Velvet and Steel", tango electrónico, Gemini): promo/reel-rosco-musica.mp3 = 0:13.65–0:48.15 con fundido final (Gonzalo pidió desde el 16; arranca 2,35 s antes para que el primer golpe del tema, 0:16.1, caiga justo en ¡BOTIJA!). Los reels de Tutti y Puzzle siguen con reel-tutti-musica.mp3.
```

```text
Fecha: 26/10/2026 — REEL de 100 Rioplatenses Dicen: promo/reel-cien.html (≈34,4 s, 9:16, mismo motor; música reel-rosco-musica.mp3, la de tango para adultos). Gancho: "100 RIOPLATENSES DICEN: Algo que ponés en la mesa cuando hay asado 🥩" con el panel de 6 barras del juego y "¿Qué dirías vos? 👇"; en el golpe se da vuelta PAN · 30 → ¡LA MÁS DICHA!. Después: logo + conductora "¿Pensás como la mayoría?", girá la rueda de temas → Costumbres, jugando el panel del mate (YERBA 32, AGUA 23, TERMO 9), "Mate cocido"… ¡NO ESTÁ! (cruz), 3 errores y afuera + rondas ×1 ×2 ×3, desafiá a un amigo 1 vs 1, temas bien nuestros (sin número, por si se agregan más), ¡Nuevo récord! y cierre. OJO: los puntajes del juego son de práctica (no encuestas reales): NO decir "le preguntamos a 100 uruguayos".
```

```text
Fecha: 26/10/2026 — Reel de 100 Rioplatenses con música propia ("The Winner's Ascent", Gemini, estilo programa de concursos): promo/reel-cien-musica.mp3 = 0:25.05–0:59.65 con fundido final. Se eligió ese tramo porque 0:25–0:27 es un corte en silencio (suspenso del gancho) y el golpe de 0:27.5 cae justo en PAN · 30.
```

```text
Fecha: 26/10/2026 — REEL del Ahorcado: promo/reel-ahorcado.html (≈34,4 s, 9:16, mismo motor; música reel-rosco-musica.mp3, tango). Gancho: "TE QUEDA UNA VIDA… 😰" con el muñeco casi completo en rojo, 1 corazón, tema Comida y MA_AMBRE → "¿QUÉ LETRA FALTA?" (para que comenten); en el golpe entra la T: MATAMBRE, el muñeco se pone verde y ¡SALVADO! 😮‍💨. Después: logo + gaucho "El clásico de siempre… pero bien nuestro 🧉", la ruleta elige el tema (Lunfardo), jugando CHAMUYERO con el teclado (una letra mala dibuja una parte), ¡AHORCADO!, palabras difíciles de verdad (MARACANAZO, GRAPAMIEL, CUPLETISTA, MISHIADURA, CEBOLLATI, reales del juego), de a dos por turnos (cada uno con su muñeco, si errás pasa el turno), temas bien nuestros, ¡Las sacaste todas! y cierre.
```

```text
Fecha: 26/10/2026 — Reel del Ahorcado con música propia ("Before the Blade Falls", Gemini): promo/reel-ahorcado-musica.mp3 armado con 3 tramos del tema para que los golpes caigan en su lugar: 0:09.05–0:22.0 (intro bajita de suspenso y el golpe de 0:11.5 cae en ¡SALVADO!) + 0:25.68–0:29.95 (1 s de silencio y el golpe de 0:26.8 cae en ¡AHORCADO!) + 0:34.88–0:52.4 (el de 0:40.7 cae en ¡GANASTE! y el de 0:48.6 en el logo), cruces de 0,12 s y fundido final. Se saltean los silencios largos del tema (0:22–0:26 y 0:30–0:31).
```

```text
Fecha: 26/10/2026 — REEL de Palabra Secreta: promo/reel-palabra.html (≈34,4 s, 9:16, mismo motor; música reel-cien-musica.mp3). Gancho: "ÚLTIMO INTENTO… 😬" con 4 filas jugadas (PLAYA, TERMO, CERDA, PERLA) → "¿CUÁL ES?" (para que comenten); en el golpe se escribe YERBA y queda toda verde → ¡YERBA! 🧉. Después: logo + personaje "Una palabra de 5 letras · 6 intentos", los colores (verde/amarilla/gris), jugando MURGA en 3 (CARTA, PURGA, MURGA), ¡EN 3! 🔥, compartilo por WhatsApp ("la saqué en 3/6") y Sofi contesta, más de 600 palabras y no se repiten, 1 vs 1 con la misma palabra (TANGO: Vos en 3, Sofi en 4 → ¡Ganaste en 3!), ¡La sacaste! y cierre. Todas las palabras del tablero son válidas en el juego. NO se habla de "palabra del día" (Gonzalo: es un juego normal con fichas).
```

```text
REGLA de Gonzalo (26/10/2026) para los videos: con CADA video nuevo, darle SIEMPRE el prompt para Gemini de la música (estilo para adultos, sin sonidos infantiles, con los segundos exactos de cada golpe del video), sin que lo pida. Claude no compone música: las pistas las hace Gonzalo con Gemini y Claude las corta y acomoda a los golpes.
```

```text
Fecha: 26/10/2026 — REEL de Sopa Fugaz: promo/reel-sopa.html (≈34,4 s, 9:16, mismo motor; por ahora con reel-tutti-musica.mp3). Gancho: "¿ENCONTRÁS BONDI? 👀" con la sopa de 10×10 y el tiempo bajando → en el golpe las fichas vuelan y se revuelven con el remolino: ¡SE MUDÓ! 🌪️ (la gracia del juego). Después: logo + mascota "Una sopa de letras… pero las palabras se mueven", encontralas antes de que se muden (reloj de arena), jugando PATIO/CIELO/BONDI arrastrando el dedo, ¡SE MUDARON!, cada nivel más difícil (MATEADA en diagonal y ZORRO al revés, como desde el nivel 3), 1 vs 1, temas bien nuestros (categorías reales), ¡Nivel superado! y cierre.
```

```text
Fecha: 26/10/2026 — Reel de Sopa Fugaz con música propia ("Before the Last Gear Turns", Gemini): promo/reel-sopa-musica.mp3 = 0:37.35–0:71.95 con fundido. Arranca en la parte bajita y el golpe de 0:39.8 cae en ¡SE MUDÓ!; además 0:51.1 cae en ¡SE MUDARON! y 0:60.1 en ¡GANASTE!.
```

```text
Fecha: 26/10/2026 — REEL de Frases en Giro: promo/reel-frases.html (≈34,4 s, 9:16, mismo motor; música reel-frases-musica.mp3 = "The Midnight Swagger" 0:19.45–0:54.05 (el golpe más fuerte del tema, 0:21.9, cae en ¡ARMADA!)). Gancho: "¿QUÉ DICE? 🤔" con la pista "Partido de potrero" y las palabras desordenadas (frase real: El árbitro cobró un penal fantasma) → en el golpe vuelan a su lugar: ¡ARMADA! ✅. Después: logo + personaje "Ordená la frase… antes del giro 🌀", ¡las palabras giran!, jugando "El termo se quedó sin agua" tocando en orden (con la barra del próximo giro), ¡GIRO!, ojo con las trampas ("La murga cantó bajo la lluvia" con la trampa real "bailó": pierde un corazón), 1 vs 1, frases bien nuestras (pistas reales), ¡Frase armada! con racha y cierre.
```

```text
Fecha: 26/10/2026 — REEL de Memoria en Giro: promo/reel-memoria.html (≈34,4 s, 9:16, mismo motor; música provisoria reel-tutti-musica.mp3). Gancho: "MEMORIZALAS 👀" con 12 cartas a la vista → se dan vuelta y en el golpe "¿DÓNDE ESTÁ LA 🍓?" + "contestá abajo 👇" (para que comenten). Después: logo + personaje "Encontrá los pares… pero el tablero gira 🌀", las cartas cambian de lugar, jugando de a dos (🍓🍓 bien, 🦋🌈 mal, 🦋🦋 bien), ¡GIRÓ!, otra miradita (la fase "recuerdo" del juego: memorizá en 3 s), 1 vs 1, cada nivel más cartas (3, 4, 6 y 8 pares como el juego), ¡Todos los pares! y cierre.
```

```text
Fecha: 26/10/2026 — Reel de Memoria en Giro: el tablero era chico (12 cartas, "van a pensar que es fácil"). Ahora todas las escenas usan 16 cartas grandes (4×4, 8 pares, como los niveles más altos del juego); el gancho pregunta "¿DÓNDE ESTÁN LAS 🍓?".
```

```text
Fecha: 26/10/2026 — Reel de Memoria en Giro con música propia ("Sleight of Thought", Gemini, 62 s): promo/reel-memoria-musica.mp3 armado con 3 tramos para que caigan los golpes: 0:12.75–0:21.85 (el de 0:15.2 cae en el gancho y el de 0:20.7 en el giro) + 0:20.58–0:28.9 (el de 0:25.4 cae en ¡GIRÓ!) + 0:41.48–0:58.75 (parte tranquila para "memorizá", el de 0:46.7 en ¡GANASTE! y termina con el final natural del tema). Cruces de 0,12 s.
```

```text
Fecha: 26/10/2026 — REEL del Silabario Rioplatense: promo/reel-silabario.html (≈34,4 s, 9:16, mismo motor; música provisoria reel-tutti-musica.mp3). Gancho: "¿QUÉ PALABRA ES? 🤔" con la pista real "Mate frío de verano que se prepara con agua helada o jugo." y un tablero de 36 sílabas → en el golpe se arma TERERÉ: ¡TERERÉ! 🧉. Después: logo + personaje "Leé la pista… y armá la palabra con sílabas", un solo tablero con las sílabas de todas las respuestas, jugando PONCHO y PICADA (pistas reales; las usadas quedan apagadas), ¡SE MEZCLA!, cada nivel más sílabas (25, 36 y 49 como el juego), 1 vs 1, palabras bien nuestras (respuestas reales), ¡Perfecto! y cierre.
```

```text
Fecha: 26/10/2026 — Reel de Silabario con música propia ("Victory in the Plaza", Gemini, 66,7 s): promo/reel-silabario-musica.mp3 armado con 2 tramos sin el silencio del medio: 0:05.25–0:23.0 (el golpe de 0:07.7 cae en el gancho TERERÉ y el de 0:18.8 en ¡SE MEZCLA!) + 0:35.43–0:52.25 (el de 0:38.4 cae en ¡GANASTE! y la parte fuerte en el cierre). Cruce de 0,12 s y fundido final.
```

```text
Fecha: 26/10/2026 — REEL de Rueda de Letras: promo/reel-rueda.html (≈34,4 s, 9:16, mismo motor; música provisoria reel-tutti-musica.mp3). Gancho: "¿QUÉ PALABRA DE 7 LETRAS ES? 🤔" con la rueda desordenada (J A R L O F A) y el crucigrama vacío de ALFAJOR (10 palabras) → el dedo traza y en el golpe ¡ALFAJOR! 🍪. Después: logo + personaje "Deslizá el dedo… y armá palabras con la rueda", crucigrama escondido, jugando MILONGA (AMIGO, LINO y la base +170), ¡GIRÁ! (las letras cambian de lugar), niveles (6 letras · letra del medio · 7 letras, como RUEDA_CONFIG), 1 vs 1 contra reloj, cajón de extras (cada 3 una pista), ¡Rueda completada! y cierre. Crucigramas armados con la misma armarCruz del juego.
```

```text
Fecha: 26/10/2026 — Carga con señal floja (Gonzalo: "que no se vea" la pantalla de Android con el ícono). Auditoría de la carga (refrescos, app, después de 1 h sin abrir, sin internet): todo bien, sin ruedita del juego. El problema era la señal floja: el service worker pedía index.html/JS a la red y esperaba SIN tope aunque tuviera copia guardada, y mientras tanto quedaba la pantalla de Android (ícono sobre violeta). Ahora sw.js espera como máximo ESPERA_RED_MS = 2000 ms; si no llegó y hay copia, abre con la copia y la descarga sigue atrás (la versión nueva entra en la próxima apertura). Sin copia, espera a la red como antes. Probado con un servidor que tarda 8 s: antes 8 s de espera, ahora 2 s; con red normal no cambia nada. sw v435.
PENDIENTE (próxima versión de la app en Play): la pantalla de Android con el ícono la pone el sistema (Android 12+ siempre muestra una) y viene del paquete de la app, no del juego. Para que sea solo violeta, sin ícono, hay que cambiar el ícono de la pantalla de inicio por uno transparente al armar el paquete (Android Studio / Bubblewrap). Con buena señal ya dura un instante.
PENDIENTE (Gonzalo no confirmó todavía): el aviso de racha diaria (con su bip) sale a los 0,7 s, todavía con la pantalla de carga; moverlo a después de la carga.
```

```text
Fecha: 26/10/2026 — Reel de Rueda de Letras con música propia ("Sharp Turn at Midnight", Gemini, 67 s): promo/reel-rueda-musica.mp3 con 2 tramos de frase entera: 0:04.88–0:23.3 (los tics del comienzo acompañan el gancho y la entrada fuerte de 0:07.3 cae justo en ¡ALFAJOR!) + 0:47.3–0:63.95 (el golpe de 0:51.6 cae en ¡GANASTE!). Cruce de 0,12 s y fundido final.
```

```text
Fecha: 26/10/2026 — REEL de los juegos de previa: promo/reel-previa.html (≈34,4 s, 9:16, mismo motor; música provisoria reel-tutti-musica.mp3). Gancho: "¿NO SABÉS A QUÉ JUGAR EN LA PREVIA? 🍻" con el grupo aburrido (impostor/ronda en gris) → en el golpe salen los íconos de los juegos y "¡ARMÁ LA PREVIA! 🔥". Después: un solo celular ¡y juegan todos!, Impostor (cartas PIZZA / impostor / PIZZA), Bomba (sílaba CHA, la bomba acelera) → ¡BOOM! en el golpe de 13,8 s, ¿Quién soy? (PINGÜINO en la frente), Mímica (CEBAR UN MATE), Canta la Canción (LUNA, jurado 👍👍👎 → ¡VALE! en el golpe de 22,6 s), ¿Qué número soy? (37 con pistas), "Juegos de previa" con todos los íconos y cierre "¿Quién se suma? 🍻". Contra Reloj no aparece (oculto para todos menos Gonzalo).
```

```text
Fecha: 26/10/2026 — Reel de los juegos de previa con música propia ("Brass After the Tick", Gemini, 108 s): promo/reel-previa-musica.mp3 con 3 tramos cortados en el pulso (128 BPM): 0:27.67–0:37.29 (la entrada fuerte de 0:30.1 cae en el gancho) + 0:40.92–0:51.38 (el corte y el golpe de 0:45.15 caen en ¡BOOM!) + 1:27.42–1:43.0 (el golpe de 1:30.15 cae en ¡VALE!). Cruces de 0,12 s y fundido final.
```

```text
Fecha: 26/10/2026 — Sopa Fugaz rehecha (Gonzalo: "que no gire, mucho más cuadraditos y más palabras, nada fácil"; eligió el estilo B de los bocetos y le encantaron los tableros con forma). (1) Sin giro: se sacaron la mudanza, el remolino y el aviso "Las letras se mudan en…". (2) Estilo B: tablero liso crema de 14×14 DESDE EL NIVEL 1 (no hay tablero chico), palabras en las 8 direcciones y al revés, cada palabra encontrada queda marcada con una cápsula de color (SVG), lista en 3 columnas tachando las encontradas, reloj en mm:ss (6 s + 1,3 s por letra por palabra, margen 1 → baja 0,03 por nivel, piso 0,75). 12 palabras en el nivel 1, +1 cada 3 niveles, tope 16. Botones 💡 Pista (3 por ronda: titila la primera letra de una que falta), ⏸ Pausa (para el reloj y tapa el tablero) y ¿Cómo se juega?. (3) Cada 3 niveles el tablero tiene forma (SOPA_FORMAS en sopa-fugaz.js: Corazón→Amor y amigos, Mate→Ritual del mate, Sol de Mayo→Playa y balneario, Mapa de Uruguay→Ciudades del mapa, Pelota→Fútbol de potrero, Estrella→Noche y espacio); las palabras van solo adentro de la forma; si no entran, se cambia por el cuadrado. (4) Banco de 142 a 1.510 palabras en 67 temas (sopa-fugaz-datos.js; se permite Ñ). Cada palabra sale UNA sola vez en todo el juego (Vistas "sopa", gya_vistas_sopa); cuando se agotan todas, vuelven. Auditoría 0 errores: se descartaron ~530 que ya estaban en otros juegos. En el 1 vs 1 el anfitrión manda el tablero armado (los dos juegan la misma sopa). tests/sopa-fugaz.cjs reescrito (PASS 360 y 1280). sopa-fugaz.js v11, datos v4, extensiones.css v124, extensiones.js v67, sw v436.
PENDIENTE: el reel promo/reel-sopa.html muestra la mudanza vieja (las letras que se mudan); rehacerlo si Gonzalo lo pide.
```

```text
Fecha: 26/10/2026 — Sopa Fugaz: dos modos, escaleritas y dibujos (Gonzalo: "sí, todo me encantó"; el nombre queda Sopa Fugaz). (1) Al entrar SIEMPRE se elige el modo: 🔎 Sopa clásica (la nueva) o 🌀 Sopa giratoria (vuelve la de antes con el remolino, el aviso "Las letras se mudan en…" y la barra; ahora en 14×14, 8 a 12 palabras, mudanza de 10 s que baja a 5 s, espera 2,5 s si estás marcando). El 1 vs 1 es siempre clásica. Al terminar hay "Cambiar de modo". (2) Escalerita (clásica): desde el nivel 4 una palabra por tablero, desde el 10 dos, va en escalones (un paso al costado y uno arriba/abajo). Se marca siguiendo el camino con el dedo (se guarda el rastro del dedo; vale si empieza y termina en las puntas y no se sale de la escalera). +50 puntos extra. La primera vez sale un aviso. (3) Dibujos (clásica): SOPA_DIBUJOS en sopa-fugaz-datos.js (145 palabras del banco con un emoji claro). Desde el nivel 2 hasta 3 palabras por tablero se muestran como dibujo con un cuadradito por letra; cada 4 niveles (si no toca forma) un "Nivel con dibujos" entero. Al encontrarla aparece escrita. sopa-fugaz.js v12, datos v5, extensiones.css v125, sw v437. Test PASS.
```

```text
Fecha: 26/10/2026 — Sopa Fugaz, ventana de elegir modo (Gonzalo): los tres botones uno abajo del otro, mismo tamaño y alineados: 🔎 Sopa clásica (magenta), 🌀 Sopa giratoria (violeta), Jugar con un amigo (turquesa, con el dibujo chico). extensiones.css v126, sopa-fugaz.js v13, sw v438.
```

```text
Fecha: 26/10/2026 — Sopa Fugaz: se sacó el logo grande de arriba del tablero (Gonzalo: "no es necesario y así entra sin scroll"). En un celular de 412×870 el tablero, la lista y los botones Pista/Pausa entran sin deslizar. sopa-fugaz.js v14, sw v439.
```

```text
Fecha: 26/10/2026 — Sopa Fugaz, arrastre con el dedo (Gonzalo: "a veces al dedo le cuesta, se mueve a lo último"). Auditoría con toques reales simulados y temblor de mano: (1) la marca recta solo avanzaba si el dedo caía EXACTO en la diagonal; si no, quedaba trabada y saltaba al final; (2) en todas las diagonales la marca rosa se dibujaba en zigzag (se mostraba el rastro del dedo pensando que era una escalerita). Arreglo: la marca se "pega" a la dirección más cercana de las 8 (ángulo redondeado a 45°) y el rastro solo se dibuja si de verdad es una escalerita (pasos que alternan costado y arriba/abajo, y solo si en el tablero hay escaleritas). Resultado: 0 zigzags (antes 4 a 14 por partida), todas las palabras acertadas con temblor de ±50% de casilla, escaleritas OK, test PASS. sopa-fugaz.js v15, sw v440.
```

```text
Fecha: 26/10/2026 — Frases en Giro: ninguna frase se repite (Gonzalo: "todo distinto siempre"). Había solo 50 frases (12 de nivel 1, 12 de nivel 2, 26 de nivel 3) y el juego "olvidaba" las vistas apenas se agotaban las del nivel: jugando nivel 1 se repetía a las 12 partidas. Ahora: (1) 243 frases (+193 nuevas, todas con pista propia y señuelos que no están en la frase; auditoría 0 errores); (2) elegir(): primero una nueva del nivel; si ya viste todas las de ese nivel, una nueva del nivel más cercano; recién cuando viste las 243 vuelven a salir (Vistas "frases"). Simulado: 243 partidas seguidas en nivel 1 = 243 frases distintas. Nota: tests/frases-en-giro.cjs ya fallaba antes de este cambio (espera 8 tarjetas de extensiones y hay 18). frases-en-giro.js v11, datos v2, sw v441.
```

```text
Fecha: 26/10/2026 — Silabario y Ahorcado: que no se repitan (Gonzalo, "lo mismo que en Frases en Giro"). (1) Silabario: de 54 a 203 pistas (+149 nuevas; cada partida de 3 niveles usa ~40 respuestas porque el tablero lleva todas las sílabas). Antes se "olvidaba" de las vistas apenas se agotaban las del nivel y además completaba el cuadrado con ya vistas aunque hubiera nuevas. Ahora armarRonda(): nuevas del nivel → cualquier nueva → todas las nuevas que queden + completar con vistas → recién cuando viste TODAS vuelven. Simulado: 203 respuestas distintas antes de la primera repetición (≈5 partidas completas de 3 niveles). (2) Ahorcado: de 60 a 227 palabras (+167); ya elegía sin repetir en todo el juego. Simulado: 227 distintas = 45 partidas de 5. (3) Por la prioridad Rosco > Silabario > Ahorcado > Sopa Fugaz, 101 palabras que ahora son de Silabario/Ahorcado se sacaron de la Sopa (queda en 1.409; también de SOPA_DIBUJOS). Auditoría 0 errores; test de la Sopa PASS. silabario.js v17, silabario-datos v4, ahorcado-datos v2, sopa-datos v6, sw v442.
PENDIENTE (si Gonzalo quiere que el Silabario dure más): sumar otra tanda grande de pistas; con 203 la primera repetición llega a las ~5 partidas completas.
```

```text
Fecha: 26/10/2026 — REGLA de Gonzalo: "no quiero que nada se repita en ningún juego". Revisión de TODOS los juegos con contenido: cada uno tiene que elegir primero lo que nunca salió (en todo el juego, no por nivel ni por categoría) y recién cuando se vio TODO puede volver a salir; y el banco tiene que ser grande. Cambios: (1) Impostor y ¿Quién soy?: llevaban la memoria por categoría (impostor_comidas, quien_soy_mezcla…) y una palabra vista en "Mezcla" podía volver en su categoría: ahora una sola memoria por juego (Vistas.unir() junta lo ya visto de las claves viejas). (2) Bomba: la sílaba solo evitaba repetir la anterior; ahora no repite hasta que salieron las 80. (3) ¿Qué número soy?: no repite número dentro del rango (1-10, 1-50, 1-100) hasta que salieron todos. (4) Bancos: 100 Rioplatenses 36→86 preguntas (cada partida usa 3), Impostor 150→250, ¿Quién soy? 200→266, Canta la Canción 100→228. Ya estaban bien: Rosco, Frases en Giro, Silabario, Ahorcado, Sopa, Palabra Secreta (622), Mímica, Contra Reloj (oculto, 30 tarjetas), Rueda de Letras (35 ruedas de 6 letras y 68 de 7), Tutti Frutti (letras sin repetir), juego principal (larueda_vistas). Sin contenido que repetir: Memoria, Puzzle, Moon Tap, Mahjong. Auditoría 0 errores. duelo-extensiones v17, bomba v15, que-numero-soy v9, impostor v9 (datos v2), quien-soy v12 (datos v2), canta datos v2, cien datos v2, sw v443.
```

```text
Fecha: 26/10/2026 — PENDIENTE (para después, no implementar todavía): JUEGOS EN LA TELE. Gonzalo contó toda la idea; quedó guardada en SALA_TV_PLAN.md (nuevo). Resumen: entrada única con código y menú de juegos en la tele; Ruleta (ya existe), Tutti Frutti (reloj gigante y letra, NUNCA mostrar respuestas, al final puntajes y podio), 100 Rioplatenses (un solo celular, el grupo juega junto, respuestas que se dan vuelta y 3 cruces), Ahorcado (la partida igual que en el celular, en grande; el celular es el teclado), Rosco (como programa de tele: uno juega, rosco girando, definición y reloj; botón "Pasar", no "Pasapalabra"), Puzzle (de a uno o cooperativo, la tele muestra el puzzle). Versión para la Play Store de la tele: aparte, por la vía "Android TV", sin tocar la de celular (la publicada sigue andando mientras Google revisa). SALA_TV_PRUEBA.md actualizado con las direcciones de girayadivina.com (sin probar todavía con el dominio nuevo).
```

```text
Fecha: 26/10/2026 — JUEGOS EN LA TELE, primera parte (Gonzalo: "programá lo de la tele"). Nuevo tele.js + tele.css + tele/index.html, aparte de la Sala TV de la Ruleta (sala-tv.js no se tocó). La tele (index.html?tele=1) es la que manda: muestra código de 5 letras, la URL girayadivina.com/tele, los jugadores y el menú de juegos (se elige desde el celular del que tiene el control 🎮 o con las flechas/Enter del control remoto; Atrás/Esc vuelve al menú). Los celulares (index.html?telecel=CÓDIGO, o girayadivina.com/tele con nombre y código) solo responden; el primero que entra tiene el control y cualquiera puede "Tomar el control". Conexión: MultiBroker de los duelos (4 MQTT + Supabase), tema gya/tele/<código>; la tele manda el estado cada 2,5 s. ?telered=local usa BroadcastChannel entre pestañas (pruebas). Juegos: Rosco (20 letras, 160 s, rosco que gira hasta la letra del turno, definición grande; celular: Enviar y "Pasar", no "Pasapalabra"), Ahorcado (5 palabras, ruleta de categorías, muñeco grande; el celular es el teclado), 100 Rioplatenses (3 preguntas x1/x2/x3, 3 cruces, ✘ gigante al errar; un celular, juega el grupo). Usan los mismos bancos y la misma memoria que los juegos del celular (Vistas rosco/ahorcado, gya_cien_rioplatenses.usadas): no se repiten. Récords del grupo en gya_tele_records. "La Ruleta" del menú lleva la tele a ?tvhost=1 y avisa a los celulares que entren por tv.html. Tutti Frutti y Puzzle aparecen como "Próximamente". Entrada en Extensiones (Juegos de previa): tarjeta "Juegos en la tele", soloGonzalo. Clases todas con prefijo tl- (una clase "ok" chocaba con un estilo global). Probado con Playwright (tele 1920×1080 + celular): menú, Rosco (acierto, error, pasar), Ahorcado (letras), 100 (aciertos con plural y error), 0 errores JS. Falta probar en una tele real. extensiones.js v68, sw v444.
```

```text
Fecha: 26/10/2026 — Juegos en la tele, Tutti Frutti. tele.js v2, tele.css v2, tutti-frutti.js v91, sw v445. Cada celular escribe y guarda sus respuestas localmente; la TV solo ve la letra, el reloj y cuáles completaron. Al tocar ¡BASTA! con todas las categorías completas, el primero envía sus palabras y corta la ronda; los demás envían lo que tenían. La TV nunca muestra palabras, ni siquiera durante la revisión: muestra los puntajes de la letra en vivo, el total y al final las tres letras, rondas ganadas y podio. La revisión, apelación, anulación y votos se hacen en los celulares; usa la validación y palabras aprobadas del Tutti Frutti original. Se conserva el mismo código de sala y PID por pestaña al recargar. Probado con Playwright en tele y dos celulares simulados: Basta, privacidad de palabras, apelación, anulación, tres rondas y resultado final. Pendiente: probar en una tele real. Puzzle sigue pendiente.
```

```text
Fecha: 26/10/2026 — Corrección de Gonzalo sobre Tutti Frutti en TV: sí quiere ver la grilla completa al terminar cada letra, como en el celular. Durante la ronda y el corte la TV no muestra lo escrito; una vez reunidas y validadas las respuestas, muestra categorías, palabra de cada jugador, puntos por palabra, estado de apelaciones/anulaciones, total de la letra y acumulado. Los votos y decisiones siguen en los celulares; la grilla de TV actualiza los puntos al resolverse. La entrada anterior describe la primera versión y queda superada por esta corrección. tele.js v3, tele.css v3, sw v446.
```

```text
Fecha: 26/10/2026 — Puzzle terminado en Juegos en la tele. tele.js v4, tele.css v4, puzzle.html v50, puzzle.js v50, sw v447. La tele abre el motor real de puzzle.html en un marco sin menús táctiles; el celular con control elige categoría, imagen exacta, cantidad de piezas y si giran. Todos los celulares de la sala pueden usar la superficie táctil para arrastrar piezas en el mismo tablero, con exclusión de un solo arrastre activo para que no choquen. Hay controles de giro, zoom, ver todo, guía e imagen. El tablero sigue usando el encastre y progreso originales; la TV muestra quién está moviendo. El guardado de TV usa pz_tv_partida, separado de pz_partida del Puzzle normal, y se puede continuar al volver al menú. Probado en Playwright con Puzzle normal, tele 1920×1080, un celular que empieza solo y otro que se suma después, elección de imagen, controles de zoom y guía, encastre, progreso, pausa, vuelta al menú, continuación guardada y victoria al completar las 12 piezas. Falta probar en tele real.
```

```text
Fecha: 26/10/2026 — Acceso a Sala TV para cuatro perfiles. El botón "Sala TV / Familia" del inicio se muestra solo a Andrés, Romina, Gonzalo y Vale y abre el menú nuevo "Juegos en la tele" (con Ruleta, Tutti Frutti, Puzzle, etc.). La tarjeta correspondiente en Extensiones usa la misma lista. Los nombres se comparan sin distinguir tildes y el botón se actualiza al editar el perfil. extensiones.js v69, sw v448. La Sala TV vieja de la Ruleta sigue siendo el juego Ruleta dentro del menú nuevo.
```

```text
Fecha: 27/10/2026 — Menú de los cuatro perfiles de prueba y envoltorio Android TV. Para Andrés, Romina, Gonzalo y Vale, el inicio oculta la tarjeta Torneos y Eventos ocupa su lugar; los demás perfiles no cambian. tele.js v5 expone gyaTVRemote y gyaTVBack para flechas, Enter y Atrás del mando Android, sin sacar el control desde el celular. sw v449. En el repo gira-y-adivina-tv, el proyecto Android WebView abre index.html?tele=1 en girayadivina.com, usa el mismo applicationId que Play (io.github.gvelazcamp.twa), versión 18, Leanback requerido y la clave de subida comprobada contra el AAB v17. Se compiló y firmó un AAB de TV; Android Lint, bundletool validate y pruebas de navegador pasaron. Pendientes: publicar la web antes de probar la app, prueba en tele física, ficha y prueba interna de Android TV en Play Console, revisión de Google. No se subió todavía el AAB a Play Console.
```

```text
Fecha: 27/10/2026 — Pantalla negra con música en navegadores de TV sin HTMLImageElement.decode(). Se reprodujo en Chromium anulando esa función: la Sala TV creaba su código pero el splash permanecía visible porque el script fallaba antes de registrar el límite de 8 s. index.html ahora espera load/error cuando decode no existe y registra el límite antes de procesar imágenes. sw.js pasa a v450. La reproducción volvió a mostrar el menú de TV sin errores y pasó la partida simulada de Tutti Frutti con dos celulares. La prueba real en Apple TV sigue pendiente; un navegador tvOS también puede tener otras limitaciones.
```

```text
Fecha: 27/10/2026 — Colores y dibujos de los juegos en la tele. Pedido de Gonzalo: que se vean como en el celular. tele.css v5 usa en el Rosco las fichas crema, turquesa, rosa y magenta de la versión móvil; en Ahorcado, las casillas originales; en 100 Rioplatenses, las placas azules con borde dorado. tele.js v6 usa el dibujo original de la horca y conserva las seis partes del muñeco. index.html y el shell de sw.js cargan esas versiones; sw v451. Se compararon capturas de Rosco, Ahorcado y 100 Rioplatenses a 1920×1080 con sus recursos reales cargados, sin errores JavaScript. Falta verificar la imagen y los colores en una tele física.
```

```text
Fecha: 27/10/2026 — Acceso corto y vinculación de Sala TV. Pedido de Gonzalo: entrar desde girayadivina.com o la app, crear la sala en el celular y verla en la tele sin escribir ?tele=1 cada vez. El botón «Sala TV / Familia» del inicio ahora es público y lleva a /tele/; allí la tele abre su modo desde un botón y conserva un código en gya_tele_codigo. El celular guarda gya_tele_vinculada solo tras recibir un estado válido de la tele, y en visitas posteriores muestra «Crear sala en mi tele»; puede cambiar la tele o el nombre. El enlace ?tele=1 sigue funcionando. tele.js v7, sw.js v452. Prueba local con TV y celular simulados: entrada desde el inicio sin perfil, vinculación, mismo código tras recarga, nueva entrada con un toque, juego iniciado, sin errores JS. Pendiente: probar en una tele física y confirmar el comportamiento de almacenamiento del navegador de esa tele.
```

```text
Fecha: 27/10/2026 — Palabra Secreta por niveles. Pedido de Gonzalo: el nivel 1 empieza con una palabra nueva; cada acierto sube un nivel, y las palabras no se repiten hasta agotar el banco de 622. Nivel 1 = 6 intentos, 2 = 5, 3 = 4, 4 en adelante = 3; cada tercer nivel propone «Escribí la primera palabra que pensás». Una derrota mantiene el nivel y ofrece otra palabra. La partida y los intentos se guardan en gya_palabra_secreta.partidaNivel y sobreviven a recargas y al cambio de día. En la migración se conserva el historial de victorias/racha y se marca la antigua palabra diaria como vista; los objetivos ya anotados en gya_vistas_palabra también se respetan. Las fichas siguen cobrando una vez por palabra al primer intento; los duelos mantienen 6 intentos y no gastan ficha. palabra-secreta.js v21, extensiones.js v70, extensiones.css v127, sw v453. Prueba de navegador: migración, guardado, progresión 1–4, derrota, no repetición y vista móvil.
```

```text
Fecha: 27/10/2026 — Corrección del reto de Palabra Secreta a pedido de Gonzalo: el texto anterior no obligaba a repetir. Cada tercer nivel ahora requiere escribir manualmente la primera palabra 3 veces (niveles 3, 9…) o 4 veces (6, 12…) antes de probar otra. Cada envío ocupa una de 6 filas, por lo que quedan 3 o 2 oportunidades reales para adivinar. El juego bloquea otra palabra durante las repeticiones y muestra cuántas faltan y cuántos intentos quedan. Si la primera palabra acierta, gana de inmediato. Duelos sin retos. Se conserva una ronda anterior ya empezada con más de un intento para no cambiarle las reglas a mitad de juego. palabra-secreta.js v22, sw v454. Prueba de navegador incluye repeticiones 3/4, palabra bloqueada, oportunidades restantes y niveles normales.
```

```text
Fecha: 27/10/2026 — Cuenta opcional para continuar la misma partida entre Play Store y web. Implementación preparada en cuenta.js/cuenta.css y supabase/cuentas.sql; la UI se habilita solo cuando Supabase tiene Google Auth activado y la tabla gya_cuentas disponible. Actualmente Google Auth está desactivado en el proyecto, por lo que no se muestra el botón. El nombre visible no autentica; el progreso se asocia a auth.uid(), con RLS y revisión para detectar cambios de dos dispositivos. Si hay dos partidas, la persona elige cuál usar y la otra queda como copia local; no se fusionan monedas o compras automáticamente ni se borran filas antiguas de Social (por ejemplo dos Meg/Rubén). capturarEstadoJuego omite las claves gya_cuenta_* para que el respaldo público no lleve metadatos de la cuenta. Ver CUENTAS_SETUP.md para activar y probar Google OAuth; falta una prueba real desde la TWA. sw v455.
```

```text
Fecha: 27/10/2026 — Prueba de partida horizontal al duplicar el celular en la tele, solo para el perfil Gonzalo. Menús y demás perfiles conservan su presentación. Dentro de la partida de Ruleta aparece «Probar en horizontal»: intenta pantalla completa y giro automático si el navegador lo permite; si no, indica desbloquear la rotación y girar el celular. Al volver al menú se apaga. La partida horizontal ordena tablero/jugadores y controles en dos columnas, con ruleta ajustada a la altura. Probado en Chromium móvil simulado a 390×844 y 844×390, y con perfil Vale como control. La prueba en Chromium no establecía cómo se comportaba la app instalada; después Gonzalo confirmó que ya giraba en su Redmi con Mirror. sw v456.
```

```text
Fecha: 28/10/2026 — El giro horizontal pasa a ser automático para todos los perfiles al rotar el celular (hasta 1024×600), sin botón ni pantalla completa. Ruleta y extensiones usan el ancho disponible; Rosco, Ahorcado y demás juegos conservan sus controles en dos columnas o compactos. Los formularios se ajustan al área visible sobre el teclado. `manifest.json` declara `orientation: any`; versiones CSS/JS y caché actualizadas a sw v467. Pruebas de Chromium móvil: ruleta para Gonzalo y Vale, apertura de 20 extensiones sin desborde horizontal, ronda de 100 Rioplatenses con respuesta visible, Rosco con voz y teclado simulado, Ahorcado. Gonzalo confirmó que la app instalada en su Redmi ya giraba al desbloquear la rotación y usar Mirror. Esta tarea continúa en la web: no se cambió la app instalada ni se publicó otra versión.
```

```text
Fecha: 28/10/2026 — Seguimiento del giro horizontal web: auditadas las 20 extensiones al entrar en juego a 844×390. Se compactaron las pantallas activas de Silabario, Memoria, Tutti Frutti y Contra Reloj; se reorganizaron los controles de Rueda de Letras y 100 Rioplatenses para mantener pregunta y respuesta visibles con el teclado del celular. Se evita un callback tardío de Ahorcado al cambiar de juego. Versiones de recursos actualizadas y caché sw v468. Sin cambios en Play Store ni en el proyecto Android.
```

```text
Fecha: 28/10/2026 — Corrección urgente: la actualización web anterior había eliminado de Extensiones la petición de pantalla completa y screen.orientation.lock("landscape") al abrir un juego con el perfil Gonzalo. La captura de la app instalada mostraba el control «Horizontal: sí» de la implementación anterior. Se restauró el control y la petición de orientación para todos los juegos de Extensiones de Gonzalo, con liberación al salir. La Ruleta principal recuperó la petición al iniciar partida y su control manual de respaldo. No se modificó Android ni Play Store. Caché sw v469.
```

```text
Fecha: 28/10/2026 — Fichas de Extensiones para el creador Gonzalo: los tres rayitos siguen visibles en el encabezado y las tarjetas, pero no se consumen ni muestran espera. Se puede iniciar un juego aunque el almacenamiento previo tenga cero fichas. Los demás perfiles mantienen sus reglas. extensiones.js v76; sw v470.
```

```text
Fecha: 28/10/2026 — Piloto de presentación de Giro en El Rosco, solicitado exclusivamente para el perfil local "Gonzalo". Los 17 assets opcionales y escenarios oficiales están en main, en presentacion-y-locucion-extensiones/Giro/. Se agregaron giro-rosco-piloto.js y giro-rosco-piloto.css: escena visual del estudio Rosco con atril, poses de Giro, destellos/confeti, voz opcional mediante speechSynthesis (es-UY), botón "Ir al Rosco", y escena de cierre "Ver resultados". Al cerrar la escena se conserva el panel, tiempo, niveles, teclado, reconocimiento y duelo originales. rosco-rioplatense.js v26 solo carga el piloto cuando esGonzalo() y ventana.GIRO_ROSCO_PILOTO !== false; la música existente del Rosco queda desactivada para Gonzalo mientras el piloto está activo, sin cambiar la música de otros perfiles. El piloto se puede apagar poniendo window.GIRO_ROSCO_PILOTO = false antes de abrir El Rosco. Actualización de caché sw v495. tests/giro-rosco-piloto.cjs comprueba acceso por perfil, limpieza, bandera, rutas y referencias del shell. Se realizó verificación estática de sintaxis y una prueba simulada del DOM; prueba visual real en Redmi/TV y locución del navegador pendientes. No se alteraron otros juegos ni se incorporaron MP3 nuevos. Es una prueba aislada por nombre de perfil, no autenticación de cuenta.
```

```text
Fecha: 28/10/2026 — Corrección de presentación de Giro en El Rosco tras captura del Redmi de Gonzalo: el escenario oficial ya incluye un atril en la imagen, y el piloto añadía otro PNG de atril delante de Giro. Se eliminó solamente el elemento HTML superpuesto en giro-rosco-piloto.js (sin sustituir escenario, conductor ni gestos). La carga se versionó a giro-rosco-piloto.js v2 y rosco-rioplatense.js v27; la caché sw pasó a v496 y se ajustó tests/giro-rosco-piloto.cjs. Comprobaciones estáticas de sintaxis y referencias correctas; prueba visual física pendiente. Solo aplica al piloto Gonzalo, sin música.
```

```text
Fecha: 28/10/2026 — Giro/El Rosco: etapa 1 de animaciones fluidas, únicamente para perfil Gonzalo y sin música. Se mantiene el estudio/atril y el diseño actual. giro-rosco-piloto.js v3 y giro-rosco-piloto.css v2 ahora usan dos capas de imagen con fundido de opacidad (~0,8 s) tras cargar el fotograma y una oscilación CSS muy pequeña para simular respiración. La secuencia alterna saludo, neutral, respiración, escucha y gestos aprobados; al cerrar la escena se limpian intervalos y se ignoran cambios pendientes. No se anima cuando la pestaña está oculta; se respeta prefers-reduced-motion. No se usan los PNG de parpadeo en el plano de cuerpo entero porque su encuadre original difiere (quedan para futura integración adecuada). Solo se modificó el piloto y sus referencias de caché (Rosco v28, PWA sw v497), sin tocar reglas, puntos, teclado, salas o controles. Ver tests/giro-rosco-piloto.cjs y tests/giro-rosco-animaciones.cjs. Verificación estática de sintaxis y prueba simulada de DOM/cambio de capas pasaron; queda pendiente verificación visual en el celular de Gonzalo.
```

```text
Fecha: 28/10/2026 — Giro / Rosco, etapa 2 de boca con locución (implementación preparada): se aprobaron siete nuevos PNG transparentes de 200×100 en la conversación, pero el conector de GitHub disponible aún no ha podido transferir sus archivos binarios. El paquete aprobado es Giro_bocas.zip; su carpeta destino es presentacion-y-locucion-extensiones/Giro/bocas-v2/, cuyo README ya tiene los siete nombres y SHA-256 de los originales. giro-rosco-piloto.js v4 y giro-rosco-piloto.css v3: mientras funciona speechSynthesis se muestra una pose frontal fija de Giro con un overlay de boca calibrado al sprite 1024×1536; el cambio de boca sigue aproximadamente el ritmo de voz y eventos de límite de palabras cuando el navegador los proporciona. Al terminar/cancelar se limpia el temporizador y vuelve a las animaciones de espera. Antes de activar el overlay se comprueba la descarga de los siete PNG, si falta alguno la voz sigue funcionando con el rostro original, sin imágenes rotas. Solo esGonzalo(); sin música, sin modificar reglas, puntajes, controles, estudio ni atril. Rosco v29, caché sw v498, pruebas tests/giro-rosco-bocas.cjs. Verificación simulada de DOM/voz, límites, parada, cierre, usuario distinto y fallo de recursos: correcta. PENDIENTE: subir los siete binarios originales a bocas-v2, comprobar checksums, después prueba real en celular antes de considerar la etapa finalizada.
```

```text
Fecha: 28/10/2026 — A pedido del usuario, el selector «Pantallas / Celular / TV» de Extensiones queda habilitado únicamente para los perfiles «Gonzalo» y «Vale». Se modificó el control visible en extensiones.js y la autorización de GyaTV.alternar("ext") en index.html; «TV» de la Ruleta principal y las funciones de administrador siguen exclusivas de Gonzalo. Al seleccionar TV en el lobby, la solicitud de orientación se mantiene al entrar a una extensión, como antes. Se desactivó por completo la superposición/animación de las siete bocas de Giro en el piloto del Rosco restaurando la escena animada anterior a ese cambio; se conservan voz sintetizada, respiración, fundidos, estudio y atril. No se borraron los PNG de boca de la carpeta del proyecto. No se alteraron reglas, puntajes, teclados ni otras extensiones. Referencias: extensiones.js v88, rosco-rioplatense.js v30, giro-rosco-piloto.js v5, giro-rosco-piloto.css v4, caché sw v499. Se ajustaron pruebas existentes y se agregó tests/extensiones-vale-tv.cjs; verificadas sintaxis, autorizaciones de los perfiles y ausencia de overlays de boca mediante simulación. Queda por comprobar el aspecto en móvil real.
```

```text
Fecha: 29/10/2026
Pedido de Gonzalo: habilitar el selector «Pantallas / Celular / TV» y el modo TV horizontal de Extensiones para todos los perfiles; comprobar si Duelo de Conocimiento está disponible para todos.
Referencia/commit del cambio: 75f6611f09269346228b9a89b1a16dbf3d22fbdd (main, gira-y-adivina-web).
Archivos y símbolos: index.html, puedeModoTVExtensiones() y versión de extensiones.js; extensiones.js, modoTVDisponible(), selector y activación de GyaTV; sw.js (APP_SHELL y versión de caché); tests/extensiones-vale-tv.cjs (expectativas de acceso).
Comportamiento final: todos los perfiles pueden elegir Celular o TV en Más juegos; el giro horizontal sigue siendo opcional y solo se solicita al entrar a un juego (en Duelo de Conocimiento, después de configurar nombres). «Duelo de Conocimiento» ya estaba en el catálogo como disponible sin soloUsuarios/soloGonzalo y se dejó intacto. «Juegos en la tele» (sala por celular/tele) conserva su fase de prueba y su lista de perfiles permitidos. La Ruleta principal y las funciones de administración de Gonzalo mantienen sus permisos originales.
Decisión y motivo: quitar solo la restricción de perfil de puedeModoTVExtensiones(), sin alterar reglas, estilos ni otras modalidades. Versionar extensiones.js a v100 y la PWA a gya-cache-v524 para evitar servir una copia anterior.
Comprobación realizada y resultado: revisión del catálogo y de las autorizaciones de GyaTV; validación de sintaxis JavaScript de extensiones.js, sw.js y del test modificado; cambios publicados en main. 
Pendiente o limitación: ejecutar tests/extensiones-vale-tv.cjs y probar el bloqueo horizontal en un celular real, donde depende del navegador y de los permisos de orientación.
```


```text
Fecha: 29/10/2026
Pedido de Gonzalo: auditar El Rosco, porque escuchaba desde lejos pero pedía decir la respuesta dos veces, a diferencia de Duelo de Conocimiento.
Referencia/commit del cambio: f399a27e5331bd58d6e70def076fee66c84fcb8a (main); test completado en 5ab1584a2d632e88f38baefa86790c8eefb9e45b.
Archivos y símbolos: rosco-rioplatense.js, procesarResultadoVozG(), arrancarEscuchaG(), cancelarPaseVozG(), leerPistaG(), transiciones y visibilidad; index.html (Rosco v37), sw.js (gya-cache-v525), tests/rosco-tv-voz.cjs y tests/rosco-voz-compartir.cjs.
Comportamiento final: el acierto por voz se procesa incluso con transcripción parcial, sin Enviar; los resultados finales que NO coinciden se muestran para reintentar o confirmar manualmente, evitando penalizar errores de transcripción; «Pasapalabra» final sigue siendo instantáneo y su parcial exacto se confirma tras 500 ms si no cambia; la reconexión tras reconocimiento es más rápida (200 ms tras resultados y tope de 700 ms en reinicios sin audio) y se muestra cuando detecta habla. Continúan la lectura de pistas, el audio original, los teclados, los puntos, los tiempos, el piloto de Giro exclusivo de Gonzalo y la opción del modo TV. No se añade una segunda captura getUserMedia.
Decisión y motivo: acercar el reconocimiento al comportamiento ya probado de Duelo de Conocimiento sin cambiar las reglas ni las demás extensiones.
Comprobación realizada y resultado: sintaxis JavaScript validada, simulaciones directas del reconocimiento para acierto parcial, frases naturales, «Pasapalabra» final/parcial y transcripción dudosa; ambas pruebas existentes tests/rosco-voz-compartir.cjs y tests/rosco-tv-voz.cjs ejecutadas con lectura de archivos simulada: PASS. Git main actualizado.
Pendiente o limitación: verificar la respuesta al primer intento en un celular real usando micrófono Chrome/TWA, en especial la latencia de onend/onaudiostart de la Web Speech API. No se probó un micrófono físico.
```

```text
Fecha: 29/10/2026 — El Rosco con voz de hombre (Gonzalo: "todo tiene audio femenino; probá en Gonzalo si podemos cambiar a masculino el Rosco"). La lectura de voz es la del celular (Web Speech API), que no dice el género de cada voz. Cambios: (1) obtenerVozMasculina() (extensiones.js) ahora también reconoce la marca "#male" que pone el motor de Google en Android y más nombres de hombre (Mateo de Uruguay y Tomás de Argentina de Windows/Edge; Eddy, Reed, Rocko y Grandpa de iPhone). (2) El Rosco en modo voz (leerPistaG) leía la pista con la voz común (femenina): ahora, solo para Gonzalo, usa la voz de hombre o, si el celular no tiene, la común más grave. (3) Giro (piloto del Rosco, solo Gonzalo) también. (4) Solo para Gonzalo, una vez por apertura aparece un aviso con el nombre de la voz que usó el juego (o que el celular no ofrece voz de hombre), para saber qué tiene su celular. Si Chrome de Android solo ofrece una voz por idioma, la web no puede elegir: se cambia en el celular (Ajustes → Salida de texto a voz → Google → Español → una voz de hombre). Pendiente según el aviso: si no hay voz de hombre, opción de audios grabados con voz de hombre (ElevenLabs) para las pistas del Rosco. extensiones.js v106, rosco v38, giro-rosco-piloto v8, sw v531.
```

```text
Fecha: 29/10/2026 — Giro (piloto del Rosco, solo Gonzalo) habla con voz de hombre GRABADA. Gonzalo: "le doy a Escuchar a Giro y sale mujer": la voz del celular (Web Speech) en su Android solo ofrece voz de mujer, así que el juego no puede elegir una de hombre. Solución: frases grabadas en ElevenLabs con la voz "Cesar Rodriguez – Young and Energetic" (la eligió y generó Gonzalo): presentacion-y-locucion-extensiones/Giro/voz/giro-rosco-inicio.mp3 (bienvenida, 8,9 s) y giro-rosco-perfecto.mp3 ("¡Espectacular! ¡Completaste el Rosco sin errores!", 3,5 s). "Escuchar a Giro" reproduce la grabación; si falla, vuelve a la voz del celular. También se cambió "usá Pasapalabra" por "usá Pasar" en la presentación (regla: no decir Pasapalabra). PENDIENTE: grabar con la misma voz "¡Muy buena partida! ¡Vamos por más!" (hoy dice además "Lograste N aciertos" con la voz del celular) y "¡No pasa nada! Una nueva vuelta nos espera. ¡Vamos por la revancha!". giro-rosco-piloto v9, rosco v39, sw v532.
```

```text
Fecha: 29/10/2026 — Giro: tercera frase grabada (Cesar Rodriguez, ElevenLabs): giro-rosco-buena.mp3, "¡Muy buena partida! ¡Vamos por más!" (2,6 s), suena al terminar el Rosco con aciertos pero no perfecto. Queda con voz del celular solo la de revancha (0 aciertos): falta grabar "¡No pasa nada! Una nueva vuelta nos espera. ¡Vamos por la revancha!". giro-rosco-piloto v10, rosco v40, sw v533.
```
