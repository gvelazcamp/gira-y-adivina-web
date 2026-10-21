# Traslado automático de `github.io` a `girayadivina.com`

La TWA instalada abre `https://gvelazcamp.github.io/gira-y-adivina-rioplatense/index.html`. GitHub Pages redirige esa URL a `girayadivina.com` mientras el dominio personalizado esté asociado al repositorio original. El navegador separa el `localStorage` de ambas direcciones. Por eso se necesitan dos sitios durante el traslado.

## Preparación sin cambiar el sitio público

1. Crear un segundo repositorio público de GitHub para la web nueva, con una copia limpia de los archivos del juego. Evitar copiar el historial de Git del repositorio original, que supera 2 GB.
2. En ese segundo repositorio, publicar `migracion/recibir.html` como `migrar.html` en la raíz. Publicar el juego normal como `index.html`. Probar la URL provisional de GitHub Pages y comprobar que las imágenes, los scripts y el manifiesto cargan.
3. En el repositorio original, preparar `juego-anterior.html` con una copia del juego actual y `index.html` con el contenido de `migracion/puente.html`. Mantener esta preparación en una rama hasta el momento de cambiar el dominio.
4. Verificar en el teléfono que todavía existe la partida en la dirección vieja. Abrir la app nueva antes del cambio no borra el almacenamiento de la vieja, pero nadie debe crear un perfil nuevo con el mismo nombre durante la migración.

## Cambio coordinado

1. Quitar `girayadivina.com` de **Settings → Pages → Custom domain** del repositorio original y eliminar su archivo `CNAME`. Publicar allí el puente preparado y comprobar que la URL `github.io` vuelve a abrir el puente. El juego antiguo queda en `juego-anterior.html` para cuando falle la conexión.
2. Configurar `girayadivina.com` como **Custom domain** del segundo repositorio. GitHub creará su archivo `CNAME`. Los cuatro A y el CNAME `www` de Sered siguen iguales porque ambos sitios son GitHub Pages de la misma cuenta.
3. Esperar a que el segundo sitio sirva **HTTPS** y permita activar **Enforce HTTPS**. Probar `https://girayadivina.com/index.html` y `https://girayadivina.com/migrar.html`.
4. Abrir la TWA instalada en un teléfono de prueba que conserve una partida en `github.io`. El puente cifra los datos en el teléfono, guarda una copia cifrada en Supabase y navega a `migrar.html` con la clave en el fragmento de la URL. La página nueva descifra, escribe el progreso y abre el juego. Si falla el envío, la partida vieja queda intacta y el puente muestra un enlace al juego anterior.
5. Verificar nombre, avatar, monedas, ciudades, compras, logros y Ranking antes de invitar a los demás. Luego preparar una versión nueva de la TWA con el nuevo origen y el mismo archivo `.well-known/assetlinks.json`, probarla y subirla a Play Store. Mientras tanto puede aparecer la barra del navegador al salir del origen viejo.

## Límites importantes

- La copia está cifrada con AES-GCM de 256 bits. Supabase solo recibe el texto cifrado; la clave va en el fragmento de URL y queda en el almacenamiento del origen viejo para reintentos. No enviar capturas ni copiar esa URL completa a otras personas.
- El puente transfiere claves `gya_*`, `larueda_*`, `mj_*`, `ps-*`, `dispositivo_gya`, `regllave_*`, la partida de Puzzle (`pz_partida`) y los récords de los minijuegos independientes. La página receptora impide reemplazar el perfil de otra persona y no inicia el juego hasta restaurar todo.
- El 21/10/2026 se comprobó que GitHub Pages sirve el repositorio nuevo y que Supabase permite insertar y leer una copia de prueba en `gya_ranking` con grupo `migra`. La política anónima no permitió borrar la fila ficticia de prueba. Todavía falta probar el recorrido completo con un teléfono real después del cambio de dominio.
- No publicar el puente en el repositorio original mientras el dominio personalizado siga allí: produciría un ciclo o dejaría la página receptora inaccesible.

## Prueba local

`node tests/migracion-dominio.cjs` comprueba el traspaso completo, la conservación de datos al fallar Supabase y la protección de un perfil distinto en el dominio nuevo.
