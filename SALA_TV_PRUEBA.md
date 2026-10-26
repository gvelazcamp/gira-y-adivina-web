# Sala TV — prueba de septiembre de 2026

> Plan completo de juegos en la tele (Tutti Frutti, 100 Rioplatenses, Ahorcado, Rosco, Puzzle) y de la versión para la Play Store de la tele: ver `SALA_TV_PLAN.md`.

Sala TV ya es parte del juego. La pantalla de TV mantiene la partida; los celulares
envían acciones y escriben las respuestas. No hay que instalar otra app en los celulares.
La tarjeta del menú normal permanece oculta mientras se prueba.

## Abrir

- TV o computadora: https://girayadivina.com/index.html?tvhost=1 (antes: gvelazcamp.github.io/gira-y-adivina-rioplatense/…; con el dominio nuevo todavía no se probó)
- Celulares: https://girayadivina.com/tv.html
- APK para Android TV: https://github.com/gvelazcamp/gira-y-adivina-tv/releases

En la TV, elegir «Mostrar código de sala». En cada celular escribir nombre y código.
Con 2 a 6 jugadores, comenzar y sortear quién arranca. Las respuestas se escriben
en el celular. En la TV se puede navegar con flechas y Enter/control remoto.
La dirección se calcula desde el origen actual; un dominio futuro necesitará además
configurar DNS/hosting y actualizar la URL permitida de la aplicación Android TV.
No se ha configurado un dominio personalizado.

## Cambios

- Entrada web dedicada sin exigir el alta de un perfil nuevo para cada invitado.
- Código de seis caracteres: identifica también el broker elegido por la TV,
  evitando que el fallback conecte celulares y pantalla a servidores diferentes.
- Inicialización después de cargar MQTT; reconexión sin duplicar los listeners.
- Recuperación del mismo jugador al recargar la pestaña del celular, mediante su
  identificador de sesión y consultas periódicas al anfitrión.
- Mensajes para sala llena, partida empezada, falta de conexión y TV que no responde.
- Bloqueo de respuestas repetidas durante el resultado de una ronda.
- Navegación con mando y separación de controles: tablero en TV, respuestas en celular.
- Sin tutoriales/promociones del modo individual encima de la sesión TV.

## Verificación

Pruebas automatizadas de navegador con transporte simulado y una prueba con los
brokers MQTT reales: entrada de dos jugadores, rechazo de acciones fuera de turno,
resolución desde celular, protección frente a respuesta duplicada, recuperación
tras recarga, rechazo de nuevos jugadores con partida iniciada y respuesta bonus.
Con transporte simulado se verifica también la partida completa hasta resultados
y revancha. Los tests no sustituyen una TV física.

Pendiente para el fin de semana: imagen/sonido a distancia, control remoto real,
suspensión de los celulares, Wi-Fi doméstico, desconexión prolongada y partida con
más jugadores. Cerrar o recargar la TV cierra la partida; no hay recuperación de
una partida tras cerrar el anfitrión. Recargar el mismo celular sí recupera su plaza;
abrir otro navegador o borrar su sesión crea otro jugador.

Se mantienen los brokers públicos existentes. Es una prueba, no un servicio con
garantía de disponibilidad o salas privadas autenticadas. Para lanzamiento amplio
conviene un transporte administrado con autenticación y control de acceso.

## Repetir las pruebas

`npm install` y `npx playwright install chromium`, luego `npm run test:tv`.
Opcional: `BROWSER_EXECUTABLE` permite usar un Chrome instalado.
`REAL_MQTT=1 npm run test:tv` usa la biblioteca MQTT del CDN y la red pública.
El resto de servicios/recursos externos se simula; no escribe perfiles en Supabase.
