# Girá y encajá

Prototipo pedido por Gonzalo el 05/11/2026, integrado en Extensiones con `soloGonzalo: true` e insignia Prueba. No se agregó al menú Más / Pruebas ni se habilitó para Vale u otros perfiles.

Fondo de laboratorio ilustrado generado para la prueba. Cuatro aberturas simples en una base, sin puertas dibujadas. Categorías iniciales: Animales, Plantas, Espacio y Comidas. Se elige jugar con imágenes o palabras en español. Arrastrar mueve horizontalmente; tocar gira. También hay botones y controles de teclado (flechas, espacio para girar, abajo para soltar, P/Escape para pausa).

Cinco niveles de ocho fichas, tres vidas propias. La velocidad aumenta y las aberturas alternan orientación al cambiar de nivel; desde el tercero también giran a mitad de nivel. El récord se guarda únicamente en `gya_gira_encaja_record_v1`. No consume fichas, vidas o monedas del juego principal. El cierre cancela animación, observador y eventos.

Validación: `BROWSER_EXECUTABLE=/usr/bin/chromium node tests/gira-encaja.cjs`. Recorre los cinco niveles con controles reales, comprueba pausa, derrota, récord, reapertura, cuatro tamaños de pantalla y ocultamiento/bloqueo de apertura para Vale y Ana. `UI_SCREENSHOTS` permite guardar capturas.
