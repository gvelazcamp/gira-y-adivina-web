# Serie para Instagram y TikTok: «El almacén de Doña Rosa»

> Reglas generales para cualquier promoción: `../REGLAS-PROMOCION.md`.

Plan de Gonzalo (06/11/2026). Serie diaria donde los seguidores adivinan, en los comentarios, palabras de Palabra Secreta para salvar el almacén de Doña Rosa. Inspirada en el formato de series interactivas tipo «La estación de Vera»: historia con meta, cuenta regresiva, la gente decide en comentarios y su nombre aparece en el video. Historia y arte propios.

## Historia
- Doña Rosa (82 años) tiene un almacén en el barrio hace 40 años. Cierra en 6 días: debe 3 meses de alquiler.
- Los vecinos le deben fiado y está todo anotado en su **libreta**, que tiene un **candado** con una palabra de 5 letras que ella no recuerda.
- Cada intento lo hace un vecino (nombre en la fila de la libreta). La más votada en los comentarios es el intento del día siguiente.

## Capítulo 1 (publicado/listo)
- Clave: **TERMO** (el termo que tiene siempre en el mostrador). Es la única palabra posible con las pistas mostradas (verificado con el diccionario del juego).
- Intentos mostrados: Pepito MATES (M, T, E amarillas), Marta PERRO (E, R, O verdes), Juanchi VERDE (nada nuevo). Quedan 3 días / 3 intentos.
- Texto grabado (ElevenLabs, voz CESAR RODRIGUEZ, id 4GeB1bS2GAHAsGRM0eeU): ver `capitulo-1.html` (SUBS con los tiempos de la voz).
- Video: escena `capitulo-1.html` + voz + música de fondo bajita (`assets/audio/palabra-secreta-musica.mp3` a volumen 0.10) + cierre de 4 s «¿Te animás a jugar vos? Jugá a Palabra Secreta en www.girayadivina.com» con Giro de cuerpo entero (`presentacion-y-locucion-extensiones/Giro/Giro_festejando_cuerpo.webp`; usar siempre los Giro de esa carpeta, sin recorte).

## Capítulo 2 (video listo, 07/11/2026; en la página del juego se publica solo cuando Gonzalo lo pida: `CAPITULO_2` en rosa.js)
- Historia (idea de Gonzalo): «Es el día dos». Doña Rosa abre la puerta y entra al almacén; en la barra está la libreta con el candado (igual que en el capítulo 1: el candado es de la libreta, no de la puerta). En la libreta está el tablero del capítulo 1 tal cual (Pepito MATES, Marta PERRO, Juanchi VERDE) y en la 4.ª fila Doña Rosa escribe T… E… R… M… O… (letra por letra con la voz), se pone verde y se abre. Está llena de polvo. Página 1: **Chelo** le debe $ 30.000 de… (tapado por el polvo). Cartel: «DÍA 2 · CIERRA EN 2 DÍAS» (el capítulo 1 terminaba con 3 días).
- Palabra: **YERBA**. Pistas (pedidas por Gonzalo): Don Tito PASTA (A verde al final), Nelly TRIGO (R amarilla), Pepito TERMA (E, R y A verdes; antes MENTA, cambiado por Gonzalo el 08/11). Queda _E__A con R. (TERMA no vale: T y M grises.)
- Pizarra «VOTARON TERMO» con los que comentaron (sin cantidad): @silvina.martinezok, @matipienia, @santii.yz. Se cambian en `VOTARON` de `capitulo-2.html` sin regrabar la voz (la voz no dice nombres).
- Si cobra, Doña Rosa paga parte de su primer mes de alquiler.
- Pizarra «LOS QUE AYUDARON» (todos los que comentaron, voten lo que voten): hasta 6 nombres en 2 columnas de 3; con más de 6 la lista se desliza sola dentro de la pizarra (el cuadro no crece). Voz final (08/11, 45,6 s): «La mayoría comentó TERMO… Pepito probó terma… paga más de la mitad de su deuda. Jugá en girá y adiviná punto com», sin música de fondo; la última frase suena sobre el cierre (la escena dura 42,2 s y el cierre 4,4 s). Cierre de 4 s: `cierre.html`.
- Final del capítulo 2 (08/11, voz de 54,9 s): «Cada vecino que se suma a seguir la historia la ayuda a cubrir la deuda más rápido, y después empezamos a arreglar su almacén. Seguí las historias de Doña Rosa.» En pantalla, una barra «DEUDA DE DOÑA ROSA» que se llena (más de la mitad con lo de Chelo y un poco más con cada 👤 vecino) y el botón «👤 Seguí la historia». No se piden «me gusta»: Instagram baja el alcance de lo que pide interacción directa; pedir que sigan la historia está bien.
- Escena `capitulo-2.html` (voz de 45 s + cierre de 4 s = 49 s).

## Lo que sigue (plan acordado)
1. **Capítulo 2:** «¡La descubrieron! Era TERMO». Se abre el candado 🔓 y la libreta muestra la primera página: «Me debe: _ _ _ _ _».
2. **Cada página de la libreta es un deudor del barrio**; la palabra secreta es su apodo u oficio (FLACO, RUBIA, BOCHA, CHAPA, PINTOR, MODISTA…; el juego acepta 5, 6 y 7 letras). Ej.: «el Flaco le debe $3.000 desde el Mundial».
3. Al descubrirla, Doña Rosa cobra y sube el contador «Juntado: $X de $20.000».
4. Con la plata, los seguidores votan qué se arregla («¿El toldo o la heladera?»). El almacén va cambiando en cada capítulo (toldo nuevo, heladera, pintura, cartel luminoso, vidriera).
5. Cada video arranca con «Ayer ustedes dijeron…» y los nombres de los que comentaron en la libreta. Una palabra cada 2 o 3 capítulos. Mismo video para Instagram y TikTok.
6. Para que una palabra dure hasta el último intento, elegir pistas que dejen tantas opciones como intentos (ej.: con _ARRO quedan BARRO, CARRO, JARRO).

## Cómo se hace cada capítulo
- Gonzalo pasa: la palabra más votada, 3 o 4 nombres de los que comentaron y el audio grabado en ElevenLabs (voz César Rodríguez) con el texto que le pasa Claude (texto plano, sin etiquetas).
- Claude ajusta la escena (`capitulo-N.html`, mismo motor: `T`, `pintar()`, `SUBS`, `TIEMPOS`), toma los tiempos de la voz con `ffmpeg silencedetect`, graba cuadros con Playwright (1080×1920, 30 fps), une voz + música bajita + cierre, y verifica que los colores de cada intento coincidan con la clave.
- Desde la sesión de Claude ElevenLabs genera pero no deja bajar los audios (Forbidden): por eso Gonzalo graba y manda el mp3.

## Página de llegada (rosa.js)
- Quien toca el link del anuncio (Meta le agrega fbclid) ve la libreta del último capítulo y juega los intentos que quedan; después crea su perfil y entra a Palabra Secreta. Para la bio usar `https://girayadivina.com/?rosa=1`.
- La página del anuncio es `rosa.html` (liviana, aparece en ~1 s); `index.html` redirige ahí al que viene de Instagram/Facebook. **Al cambiar de capítulo, subir también `ROSA_CAP` en el script del principio de index.html.**
- **Cada capítulo nuevo:** actualizar `CAPITULO` en `rosa.js` (id nuevo para que la vean de nuevo, clave, intentos, `hoja`/`sub`/`icono` de la libreta y textos) y subir `rosa.js?v=` en index.html y sw.js. Cada capítulo es una fila nueva por visitante en el embudo (🧪 Pruebas → 📣 Anuncio Doña Rosa muestra «Cap. N»).
- Embudo: 👥 Usuarios (solo Gonzalo) muestra llegaron / jugaron / la sacaron / quieren seguir / se registraron / entraron a Palabra Secreta.
