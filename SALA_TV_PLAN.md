# Juegos en la tele — plan de Gonzalo (26/10/2026)

Idea: **la tele muestra el juego en grande y se responde desde el celular.**

**Hecho (26/10/2026, `tele.js` + `tele.css` + `tele/index.html`):** sala nueva con código y menú de juegos (también con el control remoto), **Rosco**, **Ahorcado**, **100 Rioplatenses**, **Tutti Frutti** y **Puzzle**. Entrada: tele `girayadivina.com/index.html?tele=1`; celulares `girayadivina.com/tele`. El botón "Sala TV / Familia" del inicio y la tarjeta "Juegos en la tele" de Extensiones se muestran a Andrés, Romina, Gonzalo y Vale y abren la sala nueva. Para estos cuatro perfiles, el inicio oculta Torneos y Eventos ocupa ese lugar; los demás perfiles mantienen su menú. Tutti Frutti se probó con tele y dos celulares simulados, incluidas tres rondas, apelación y anulación. Puzzle se probó con dos celulares, encastre, progreso y guardado; falta probar en una tele real.
Estado de la prueba actual de la Ruleta: ver `SALA_TV_PRUEBA.md`.

## Cómo se entra (igual para todos los juegos)

1. La tele abre el juego en modo tele y muestra un **código de sala**.
2. Los celulares entran con ese código desde `girayadivina.com/tele`, sin instalar nada. La Ruleta usa su propia entrada en `tv.html` después de elegirla en el menú.
3. **En la tele se elige a qué jugar** (menú de juegos de tele).

Se hace una sola vez y sirve para todos los juegos.

## Los juegos, tal como los pidió Gonzalo

| # | Juego | Cuántos celulares | Qué se ve en la tele | Qué se hace en el celular | Estado |
|---|---|---|---|---|---|
| 1 | **Ruleta** | Cada uno con el suyo (2 a 6) | Ruleta y tablero | Girar, elegir letras, resolver | ✅ Hecho (en prueba) |
| 2 | **Tutti Frutti** | Cada uno con el suyo | Letra y reloj durante la ronda; después grilla de palabras y puntos | Escribir, apelar, anular y votar | ✅ Hecho (tele.js; falta probar en tele real) |
| 3 | **100 Rioplatenses Dicen** | **Uno solo**, el grupo juega junto | Pregunta, 6 respuestas tapadas, 3 cruces | Escribe lo que el grupo dice | ✅ Hecho (tele.js) |
| 4 | **Ahorcado** | Uno (el grupo dice qué letra) | La partida igual que en el celular, en grande | Teclado de letras | ✅ Hecho (tele.js) |
| 5 | **Rosco** | **Uno juega**, los demás miran (como programa de tele) | Rosco girando, letra, definición, reloj | Escribir la respuesta, "Enviar" y "Pasar" | ✅ Hecho (tele.js) |
| 6 | **Puzzle** | De a uno **o cooperativo** (varios celulares) | El puzzle grande | Arrastrar, girar, acercar y ubicar piezas desde el control táctil | ✅ Hecho (tele.js + puzzle.html; falta probar en tele real) |

### 1. Ruleta
Ya existe ("Sala TV"). La tele muestra la ruleta y el tablero; cada jugador gira, elige letras y resuelve desde su celular.

### 2. Tutti Frutti
- **Mientras se juega:** la letra grande y el **reloj gigante ocupando casi toda la pantalla** (cambia de color cuando quedan pocos segundos). Abajo los nombres con una tilde ✓ cuando cada uno termina, **sin mostrar qué escribió**.
- **¡BASTA!:** en grande con el nombre de quién lo cantó.
- **Revisión y anulación:** los celulares deciden, como hoy. Mientras se juntan y validan respuestas, la tele dice "Revisando respuestas…". Después aparece la grilla en la tele: categorías, lo que escribió cada jugador, puntos por respuesta, dudas, apelaciones y anulaciones. Los puntos se actualizan al votar.
- **Final de cada ronda:** grilla de respuestas y puntos, total de la letra, acumulado y quién cantó basta.
- **Final de la partida:** podio con el ganador, puntos totales y rondas ganadas, con festejo.
- **Envío:** cada teléfono conserva las palabras mientras se escriben; el primero que termina y toca **¡BASTA!** envía sus respuestas y corta la ronda. Los demás envían lo que tenían al recibir el corte. La tele no muestra palabras hasta que estén juntas y validadas; entonces abre la grilla de resultados.

### 3. 100 Rioplatenses Dicen
- **Un solo celular**; el grupo del living juega junto ("¡poné chorizo!").
- **Tele:** la pregunta grande, el panel con las 6 respuestas tapadas y las **3 cruces** de errores.
- **Acierto:** la respuesta se da vuelta en la tele con sus puntos y sonido.
- **Error:** una ❌ grande en la tele. Con 3 errores termina la pregunta y se muestran las que faltaron.
- **3 preguntas** (por 1, por 2 y por 3) y al final el **puntaje del grupo**; se guarda el **récord del grupo** para intentar superarlo.
- Recordar: los puntajes son de práctica; nunca decir "le preguntamos a 100 uruguayos".

### 4. Ahorcado
- **Tele:** la partida **igual que en el celular**, en grande: ruleta de categorías, muñeco, palabra con sus espacios, letras usadas, puntos y "palabra 1 de 5".
- **Celular:** el teclado; el grupo va diciendo qué letra probar.
- Aciertos, palabra completa y muñeco completo se ven en grande con sonido.

### 5. Rosco
- **Como un programa de tele:** juega **una persona**, los demás miran.
- **Tele:** el rosco grande **girando** hasta poner adelante la letra del turno, la **definición** en grande, el reloj, aciertos y errores. Acierto en verde, error en rojo, la pasada queda para la vuelta siguiente.
- **Celular del que juega:** cuadro para escribir la respuesta y los botones **"Enviar"** y **"Pasar"** (en la tele NO usar "Pasapalabra", es marca registrada).
- **Final:** resultado en grande (aciertos, errores, tiempo). Si después juega otro, se compara quién hizo más.

### 6. Puzzle
- **De a uno o cooperativo:** todos los celulares conectados a la sala de la tele pueden mover piezas del mismo tablero; un dedo a la vez para evitar choques. El celular con el control elige la imagen, cantidad de piezas y giros.
- **Tele:** usa el motor original del Puzzle, con piezas, encastre, imagen de referencia, progreso y festejo al completarlo.
- **Celular(es):** superficie táctil que corresponde a la pantalla de la tele; arrastrar para mover, tocar para girar, y botones para girar, zoom, ver todo, guía e imagen.
- **Guardado:** separado del Puzzle normal del celular, en el navegador de esa tele. Se puede volver al menú y continuar la partida allí. Probar en una tele real antes de dar por terminado el ajuste de controles.

## Orden propuesto para hacerlos
1. Entrada única (código + menú de juegos en la tele).
2. Tutti Frutti → 100 Rioplatenses → Ahorcado → Rosco → Puzzle (del más fácil al más difícil).

## Play Store de la tele (Android TV)
- El proyecto `gira-y-adivina-tv` ya abre la sala nueva desde `girayadivina.com` en WebView, sin depender de Chrome. Incluye entrada Leanback, banner apaisado y mando. El AAB v18 está firmado con la misma clave de subida y usa el mismo identificador que la app de celular. No se ha subido a Play Console.
- **Seguridad (verificado 26/10):** mientras Google revisa una versión nueva, **la app publicada sigue funcionando y la gente sigue jugando** (ya pasó con la 16 publicada mientras se revisaba la 17). Además el juego se actualiza desde la web.
- **Subirla solo por la vía "Android TV"** de la misma app en Play Console, sin tocar la versión de celular publicada. Habilitar el tipo de dispositivo en Configuración avanzada → Tipos de dispositivo; completar banner y capturas de la ficha para TV.
- Primero probar el APK en una tele real y el AAB en la prueba interna de Android TV. Después enviar a producción para revisión de Google. Ver instrucciones de compilación y prueba en el README del repositorio `gira-y-adivina-tv`.

## Mientras tanto (para jugar ya)
- **Tele:** abrir el navegador de la tele (en Android/Google TV se puede instalar uno gratis de su Play Store, por ejemplo "TV Bro" o "Puffin TV Browser") y entrar a `girayadivina.com/index.html?tele=1`.
- **Celulares:** `girayadivina.com/tele` con nombre y código. La Ruleta da otro código y pasa a `tv.html` al elegirla.
- Rosco, Ahorcado, 100 Rioplatenses, Tutti Frutti y Puzzle están integrados al menú. Puzzle conserva su partida en el navegador de esa tele; los otros juegos se cortan al cerrar o recargar la tele. **Probarlo antes en casa**: las pruebas en código usaron navegadores simulados y todavía no se probó en una tele real.
- El botón "Sala TV / Familia" del inicio abre "Juegos en la tele" para Andrés, Romina, Gonzalo y Vale.
