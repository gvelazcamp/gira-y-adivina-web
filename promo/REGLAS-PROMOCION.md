# Reglas para todo lo que sea promoción (anuncios, links, páginas de llegada)

Regla de Gonzalo (08/11/2026): **perder la menor cantidad de jugadores posible**. Todo anuncio, link de bio,
historia o campaña nueva se arma así, como quedó la página de Doña Rosa (`rosa.html` + `rosa.js`,
ver `serie-dona-rosa/README.md`).

## 1. La página de llegada es liviana
- El que viene del anuncio NO carga el juego entero (~2,5 MB, 57 juegos, ~11 s en un celular con 4G):
  `index.html` lo redirige al principio (script en el `<head>`) a una página chica con solo el juego del anuncio.
- Tiene que aparecer en 1 o 2 segundos.
- Se reconoce al del anuncio por `fbclid`, `utm_source` de ig/fb, el navegador interno de Instagram/Facebook
  (Instagram no siempre agrega `fbclid`) o `?rosa=1`/link propio. El que entra normal no cambia nada.

## 2. Lo único que se puede hacer es jugar
- Sin botón «Saltar» al entrar. «Probar» arriba (al lado del título) y abajo en el teclado.
- «Saltar e ir al juego» aparece chico recién después del primer intento.
- Entra sin deslizar en pantallas bajas (el navegador de Instagram ocupa arriba y abajo): probar 360×600 y 390×680.

## 3. Mientras juega, el juego completo se baja atrás
- 1,5 s después de que carga la página liviana, se precargan `index.html` y sus scripts/estilos, así al seguir abre rápido.

## 4. Al terminar
- **Android:** botón principal «▶ Seguí jugando en la app» (intent:// que abre la app instalada directo en el juego, con su cuenta; si no la tiene, va a Google Play); abajo «Seguir en el navegador». En Android el registro no se pide en la página del anuncio (el camino principal es la app).
- **iPhone/compu:** «¡Sí, quiero jugar!».
- Al seguir en el navegador: **sin pedir el nombre**, directo al juego (ej. Palabra Secreta), sin tutorial.

## 5. El registro se pide después, en el mejor momento
- Al ganar el juego del anuncio (ej. sacar la palabra de Doña Rosa): «🎉 ¡Muy bien! ¿Guardamos tu racha?» con nombre +
  país + avatar en una sola ventana, una sola vez, con «Ahora no, sigo jugando». Nunca bloquea.
- Lo que ganó en el anuncio cuenta como avance en el juego (Doña Rosa = nivel 1 de Palabra Secreta: sigue en el nivel 2).

## 6. Se mide cada paso
- Embudo en Supabase (`gya_ranking`, un grupo por campaña, una fila por visitante y capítulo): llegó (solo si la página
  se ve: Instagram la carga a veces por adelantado), jugó, la sacó, quiere seguir, fue a Google Play, entró al juego,
  jugó, vio el registro, se registró; las palabras que puso y su nombre si después crea perfil.
- Gonzalo lo ve en 👥 Usuarios y en 🧪 Pruebas. Comparar con las «visitas al sitio web» del anuncio.
- Los que se registran en la app de Play no se pueden unir al embudo (son otra persona para el navegador).

## 7. Antes de publicar
- Probar como lo vería alguien desde Instagram: Playwright con user agent de Instagram Android, red 4G
  (150 ms, 4 Mbps), CPU ×2–4 y **un servidor que comprima (gzip) como GitHub Pages** (el `http.server` de Python
  sin comprimir exagera la carga). Medir cuándo aparece y grabar el recorrido completo.
- Revisar que la historia no contradiga los capítulos anteriores y avisarle a Gonzalo si un pedido lo hace.
- No publicar un capítulo/campaña nueva en la página sin que Gonzalo lo pida explícitamente.
- Respuestas en Instagram: distintas cada vez (las repetidas las oculta como spam), sin links.
