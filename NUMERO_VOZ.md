# ¿Qué número soy? — prueba por voz

Prueba en Juegos en la tele para las salas cuyo control inicial se llama Gonzalo o Vale. Se abre desde la tarjeta existente de ¿Qué número soy?; esos perfiles también tienen un acceso a las instrucciones de conexión dentro de la extensión. Los demás conservan el juego clásico con rangos.

El grupo ve la respuesta numérica gigante en la tele. Quien adivina se coloca de espaldas y responde al micrófono del celular. La voz lee únicamente la pregunta; los controles reciben la pregunta, el reloj y los puntos, sin el número correcto. El banco inicial tiene 50 preguntas en español y utiliza el historial Vistas.

El control prepara hasta ocho nombres. Cada persona usa su celular si su nombre coincide con uno conectado; con un solo celular, se lo pasan. Cada turno dispone de 30 segundos totales, desde que termina la primera lectura y se abre el audio. Las preguntas siguientes consumen ese mismo reloj. Acierto: un punto y nueva pregunta; error: otro intento; «paso»: pregunta siguiente sin punto. Al terminar todos, gana quien tiene más puntos; se admiten empates y otra ronda.

Web Speech API realiza la lectura y el reconocimiento en español. El permiso del micrófono se activa mediante un toque. Durante cada lectura se apaga el reconocimiento para evitar capturar la voz de la pregunta. El moderador y los espectadores pueden marcar «Lo dijo bien»; hay respuesta escrita y modo manual. Una denegación de permiso, desconexión o segundo plano pausa el turno. El modo manual conserva la lectura y permite marcar aciertos desde el control.

Archivos: `numero-voz-datos.js`, `numero-voz.js`, `numero-voz.css`; integración puntual en `tele.js` y `que-numero-soy.js`. No se altera el transporte MQTT/Supabase, los recursos de las cuentas ni la modalidad clásica. No se necesita una clave de API nueva.

Validación:

- `node tests/numero-voz-core.cjs`: interpretación de números en español, reloj único, lectura, puntuación, mensajes viejos/tardíos, pausa y clasificación.
- `node tests/numero-voz-tv.cjs`: Chromium con TV y dos controles por BroadcastChannel, voz simulada, privacidad del número, turno de cada jugador, corrección, permisos y limpieza. Capturas en `/tmp/numero-voz-tv.png` y `/tmp/numero-voz-cel.png`.
- `BROWSER_EXECUTABLE=/usr/bin/chromium node tests/tele-rosco-giro-microfono.cjs`: regresión del Rosco compartido.
- `node tests/auditar-palabras.cjs --md`: preguntas sin duplicados en el contenido compartido.

La prueba de navegador utiliza voz simulada; la calidad del reconocimiento y la locución en un celular o tele físicos requiere una prueba en esos dispositivos.
