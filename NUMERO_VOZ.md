# ¿Qué número soy? — preguntas por voz

Disponible para todos en la extensión ¿Qué número soy?, directamente con un celular, y también en Juegos en la tele. No hay filtro por nombre ni lista de testers. Se reemplazaron las opciones de números de 1 a 10, 1 a 50 y 1 a 100 por preguntas con respuestas numéricas.

Con un celular, se preparan los nombres y el permiso del micrófono. Al comenzar hay tres segundos para darlo vuelta antes de mostrar la respuesta. Los demás ven el número gigante; quien adivina escucha la pregunta y responde hablando. Después de cada turno se pasa el celular al siguiente. Pausar oculta el número antes de volver a mirar la pantalla; continuar vuelve a dar tres segundos. También se puede jugar marcando los aciertos desde la pantalla que ven los demás.

Con tele, el grupo ve allí la respuesta numérica gigante. Quien adivina se coloca de espaldas y responde al micrófono del celular. La voz lee únicamente la pregunta; los controles de esta modalidad reciben la pregunta, el reloj y los puntos, sin el número correcto. Ambos formatos comparten el banco inicial de 50 preguntas en español y el historial Vistas.

El control prepara hasta ocho nombres. Cada persona usa su celular si su nombre coincide con uno conectado; con un solo celular, se lo pasan. Cada turno dispone de 30 segundos totales, desde que termina la primera lectura y se abre el audio. Las preguntas siguientes consumen ese mismo reloj. Acierto: un punto y nueva pregunta; error: otro intento; «paso»: pregunta siguiente sin punto. Al terminar todos, gana quien tiene más puntos; se admiten empates y otra ronda.

Web Speech API realiza la lectura y el reconocimiento en español. El permiso del micrófono se activa mediante un toque. Durante cada lectura se apaga el reconocimiento para evitar capturar la voz de la pregunta. Los demás pueden marcar «Lo dijo bien»; el control de la tele admite también respuesta escrita. Una denegación de permiso, desconexión o segundo plano pausa el turno. El modo manual conserva la lectura y permite marcar aciertos en pantalla.

Archivos: `numero-voz-datos.js`, `numero-voz.js`, `numero-voz.css`; integración puntual en `tele.js` y `que-numero-soy.js`. No se altera el transporte MQTT/Supabase ni los recursos de las cuentas. No se necesita una clave de API nueva.

Validación:

- `node tests/numero-voz-core.cjs`: interpretación de números en español, reloj único, lectura, puntuación, mensajes viejos/tardíos, pausa y clasificación.
- `node tests/numero-voz-celular.cjs`: partida completa con un celular para dos personas, ausencia de rangos, cuenta previa sin revelar la respuesta, respuestas habladas, cuatro tamaños, pausa y salida, nombres y rondas históricas conservadas.
- `node tests/numero-voz-tv.cjs`: Chromium con TV y dos controles por BroadcastChannel, voz simulada, privacidad del número, turno de cada jugador, corrección, permisos y limpieza. Capturas en `/tmp/numero-voz-tv.png` y `/tmp/numero-voz-cel.png`.
- `BROWSER_EXECUTABLE=/usr/bin/chromium node tests/tele-rosco-giro-microfono.cjs`: regresión del Rosco compartido.
- `node tests/auditar-palabras.cjs --md`: preguntas sin duplicados en el contenido compartido.

La prueba de navegador utiliza voz simulada; la calidad del reconocimiento y la locución en un celular o tele físicos requiere una prueba en esos dispositivos.

La regresión de avisos iniciales de 18 juegos en dos tamaños horizontales también pasó. La prueba amplia de avisos durante partidas supera el nuevo flujo de números y luego se detiene en el Rosco porque su presentación de Giro intercepta el botón que esa prueba antigua intenta pulsar; no se modificó esa presentación.
