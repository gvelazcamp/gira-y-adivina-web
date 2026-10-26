# Juegos en la tele — plan de Gonzalo (26/10/2026)

Idea: **la tele muestra el juego en grande y se responde desde el celular.**
Todavía es un plan: salvo la Ruleta, nada de esto está hecho.
Estado de la prueba actual de la Ruleta: ver `SALA_TV_PRUEBA.md`.

## Cómo se entra (igual para todos los juegos)

1. La tele abre el juego en modo tele y muestra un **código de sala**.
2. Los celulares entran con ese código (página `tv.html`, sin instalar nada).
3. **En la tele se elige a qué jugar** (menú de juegos de tele).

Se hace una sola vez y sirve para todos los juegos.

## Los juegos, tal como los pidió Gonzalo

| # | Juego | Cuántos celulares | Qué se ve en la tele | Qué se hace en el celular | Estado |
|---|---|---|---|---|---|
| 1 | **Ruleta** | Cada uno con el suyo (2 a 6) | Ruleta y tablero | Girar, elegir letras, resolver | ✅ Hecho (en prueba) |
| 2 | **Tutti Frutti** | Cada uno con el suyo | Ver abajo: **nunca muestra las respuestas** | Escribir las palabras, revisar y anular | Por hacer (fácil) |
| 3 | **100 Rioplatenses Dicen** | **Uno solo**, el grupo juega junto | Pregunta, 6 respuestas tapadas, 3 cruces | Escribe lo que el grupo dice | Por hacer |
| 4 | **Ahorcado** | Uno (el grupo dice qué letra) | La partida igual que en el celular, en grande | Teclado de letras | Por hacer |
| 5 | **Rosco** | **Uno juega**, los demás miran (como programa de tele) | Rosco girando, letra, definición, reloj | Escribir la respuesta, "Enviar" y "Pasar" | Por hacer |
| 6 | **Puzzle** | De a uno **o cooperativo** (varios celulares) | El puzzle grande | Elegir piezas y ubicarlas | Por hacer (el más difícil) |

### 1. Ruleta
Ya existe ("Sala TV"). La tele muestra la ruleta y el tablero; cada jugador gira, elige letras y resuelve desde su celular.

### 2. Tutti Frutti
- **Mientras se juega:** la letra grande y el **reloj gigante ocupando casi toda la pantalla** (cambia de color cuando quedan pocos segundos). Abajo los nombres con una tilde ✓ cuando cada uno termina, **sin mostrar qué escribió**.
- **¡BASTA!:** en grande con el nombre de quién lo cantó.
- **Revisión y anulación:** en los celulares, como hoy. La tele dice "Revisando respuestas…" y sigue sin mostrar respuestas.
- **Final de cada ronda:** puntajes de la ronda y quién la ganó.
- **Final de la partida:** podio con el ganador, puntos totales y rondas ganadas, con festejo.

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
- **De a uno o cooperativo** (ya existe el puzzle cooperativo online).
- **Tele:** el puzzle grande para que todos miren cómo se arma.
- **Celular(es):** elegir piezas y ubicarlas.

## Orden propuesto para hacerlos
1. Entrada única (código + menú de juegos en la tele).
2. Tutti Frutti → 100 Rioplatenses → Ahorcado → Rosco → Puzzle (del más fácil al más difícil).

## Play Store de la tele (Android TV)
- Hoy la app **no aparece** en la Play Store de la tele: está hecha para celulares.
- Hace falta una **versión para tele**: banner apaisado para el menú de la tele, manejo con el control remoto, capturas en formato tele. La app actual abre el juego con Chrome y las teles Android **no traen Chrome**, así que la versión de tele se arma distinta. Hubo una APK de prueba en el repo `gira-y-adivina-tv` (apuntaba a la dirección vieja).
- **Seguridad (verificado 26/10):** mientras Google revisa una versión nueva, **la app publicada sigue funcionando y la gente sigue jugando** (ya pasó con la 16 publicada mientras se revisaba la 17). Además el juego se actualiza desde la web.
- **Subirla solo por la vía "Android TV"** de Play Console (vía aparte de la de celulares), sin tocar la versión de celular publicada. Se habilita en Configuración avanzada → Tipos de dispositivo.
- Subirla cuando ya haya varios juegos de tele andando (una sola revisión de Google).

## Mientras tanto (para jugar ya)
- **Tele:** abrir el navegador de la tele (en Android/Google TV se puede instalar uno gratis de su Play Store, por ejemplo "TV Bro" o "Puffin TV Browser") y entrar a `girayadivina.com/index.html?tvhost=1` → "Mostrar código de sala".
- **Celulares:** `girayadivina.com/tv.html` con nombre y código.
- Solo está la Ruleta. Cerrar o recargar la tele corta la partida. **Probarlo antes en casa**: las pruebas de `SALA_TV_PRUEBA.md` se hicieron con la dirección vieja (gvelazcamp.github.io) y nunca en una tele real.
- Propuesto y no confirmado todavía por Gonzalo: un botón "Sala TV" en el menú que solo vea él.
