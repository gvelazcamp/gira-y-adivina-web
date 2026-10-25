const CACHE_NAME = "gya-cache-v425";
// Imágenes, audios y videos van en una caché APARTE que NO se borra cuando se
// sube CACHE_NAME. Antes cada actualización del juego (CACHE_NAME nuevo) borraba
// todo y el celular volvía a bajar mapas, videos e íconos: se veía negro/lento
// después de cada cambio. Subir CACHE_ASSETS solo si se reemplaza el CONTENIDO
// de una imagen/video con el mismo nombre (o mejor: usar otro nombre o ?v=).
const CACHE_ASSETS = "gya-assets-v1";
const esArchivoAsset = (u) => /\.(svg|webp|png|jpe?g|gif|mp3|mp4|wav|ogg)$/i.test(u.pathname);
const APP_SHELL = ["./", "./index.html", "./manifest.json", "./i18n.js?v=3", "./lib/mqtt.min.js?v=5.10.1", "./lib/supabase.min.js?v=2.45.4", "./icono-192.png", "./icono-512.png", "./assets/logo.webp", "./assets/splash.webp?v=4", "./assets/splash-tv.webp?v=1", "./assets/social/online-icono.webp", "./assets/social/social-icono.webp", "./assets/social/amigos-icono.webp", "./assets/social/tienda-icono.webp", "./assets/eventos/icono-evento.webp", "./ui-icons.js?v=1", "./assets/ui/coin.svg", "./assets/ui/shield.svg", "./extensiones.css?v=120", "./extensiones.js?v=66", "./duelo-extensiones.js?v=16", "./sopa-fugaz-datos.js?v=3", "./sopa-fugaz.js?v=10", "./logo-sopa-fugaz.svg", "./rueda-de-letras-datos.js?v=4", "./rueda-de-letras-diccionario.js?v=1", "./rueda-de-letras.js?v=17", "./logo-rueda-de-letras.svg", "./palabra-secreta-datos.js?v=2", "./palabra-secreta.js?v=20", "./logo-palabra-secreta.svg", "./frases-en-giro-datos.js?v=1", "./frases-en-giro.js?v=10", "./logo-frases-en-giro.svg", "./memoria-en-giro.js?v=9", "./logo-memoria-en-giro.svg", "./rosco-rioplatense-datos.js?v=4", "./rosco-rioplatense.js?v=17", "./logo-rosco-rioplatense.svg", "./silabario-rioplatense-datos.js?v=3", "./silabario-rioplatense.js?v=16", "./logo-silabario-rioplatense.svg", "./cien-rioplatenses-datos.js?v=1", "./cien-rioplatenses.js?v=10", "./logo-cien-rioplatenses.svg", "./ahorcado-rioplatense-datos.js?v=1", "./ahorcado-rioplatense.js?v=13", "./logo-ahorcado-rioplatense.svg", "./contra-reloj-rioplatense-datos.js?v=2", "./contra-reloj-rioplatense-voz.js?v=3", "./contra-reloj-rioplatense-online.js?v=12", "./contra-reloj-rioplatense.js?v=12", "./logo-contra-reloj-rioplatense.svg", "./assets/extensiones/contra-reloj/dado-0.png", "./assets/extensiones/contra-reloj/dado-1.png", "./assets/extensiones/contra-reloj/dado-2.png", "./moon-tap.js?v=6", "./puzzle.js?v=49", "./puzzle.html?v=49", "./logo-puzzle.svg", "./pantalla-fija.js?v=9", "./que-numero-soy.js?v=8", "./logo-que-numero-soy.svg", "./quien-soy-datos.js?v=1", "./quien-soy.js?v=11", "./logo-quien-soy.svg", "./bomba.js?v=14", "./logo-bomba.svg", "./impostor-datos.js?v=1", "./impostor.js?v=8", "./logo-impostor.svg", "./mimica-datos.js?v=2", "./mimica.js?v=7", "./canta-la-cancion-datos.js?v=1", "./canta-la-cancion.js?v=13", "./tutti-frutti-datos.js?v=35", "./tutti-frutti.js?v=84", "./logo-mimica.svg", "./logo-canta-la-cancion.svg", "./logo-tutti-frutti.svg", "./logo-moon-tap.webp", "./assets/audio/error-extensiones.mp3", "./assets/extensiones/moon-tap/fondo.webp", "./mahjong-rioplatense.html", "./logo-mahjong.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((c) => c.addAll(APP_SHELL))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      const assets = await caches.open(CACHE_ASSETS);
      for (const k of keys) {
        if (k === CACHE_NAME || k === CACHE_ASSETS) continue;
        // antes de borrar una caché vieja, se pasan sus imágenes/videos a la de assets (así no se bajan de nuevo)
        try {
          const vieja = await caches.open(k);
          for (const req of await vieja.keys()) {
            const u = new URL(req.url);
            if (u.origin === self.location.origin && esArchivoAsset(u) && !(await assets.match(req))) {
              const r = await vieja.match(req);
              if (r && r.status === 200) await assets.put(req, r);
            }
          }
        } catch (err) {}
        await caches.delete(k);
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);
  // Imágenes y audios también cuentan como "asset" aunque estén en la raíz
  // (los logos de Extensiones: logo-*.svg/.webp/.png). Antes iban por "red
  // primero, sin caché" y cada vez que se abría Extensiones se volvían a
  // bajar todos, por eso tardaban en aparecer.
  const esAssetLocal = url.pathname.includes("/assets/") ||
    (url.origin === self.location.origin && /\.(svg|webp|png|jpe?g|gif|mp3)$/i.test(url.pathname));
  const esLibreriaExterna = url.origin !== self.location.origin;

  // Las imágenes de assets/ Y las librerías/fuentes externas (Google
  // Fonts, mqtt.js, supabase-js desde sus CDN) se sirven de la caché
  // primero: son archivos que casi nunca cambian, no tiene sentido
  // volver a pedirlos por red en CADA apertura del juego. Antes esto
  // pasaba (caían en la regla de abajo, "red primero, sin caché") y
  // sumaba segundos muertos de pantalla en blanco al abrir la app,
  // sobre todo con mala señal. IMPORTANTE: si se reemplaza el
  // CONTENIDO de un archivo ya existente en assets/ (mismo nombre,
  // distinta imagen), hay que subir CACHE_ASSETS (no CACHE_NAME), si no
  // los celulares que ya lo cachearon nunca ven el cambio.
  // Videos (.mp4): el navegador los pide "por partes" (Range) y esas respuestas
  // parciales no se pueden guardar, así que antes se bajaban de nuevo cada vez
  // (pantalla negra en el mapa). Ahora se baja el archivo entero una vez, se
  // guarda, y las partes se sirven desde lo guardado.
  if (url.origin === self.location.origin && /\.mp4$/i.test(url.pathname)) {
    e.respondWith(videoDesdeCache(e.request, url));
    return;
  }

  if (esAssetLocal || esLibreriaExterna) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((resp) => {
          if (resp && resp.status === 200 && resp.type !== "opaque") {
            const clone = resp.clone();
            caches.open(esLibreriaExterna || !esArchivoAsset(url) ? CACHE_NAME : CACHE_ASSETS).then((c) => c.put(e.request, clone));
          }
          return resp;
        }).catch(() => cached);
      })
    );
    return;
  }

  // Red primero para todo lo demás (HTML/JS/manifest): siempre trae la
  // versión más nueva del juego cuando hay internet (antes era
  // cache-primero y por eso el celular seguía viendo versiones viejas
  // aunque ya se hubiera subido un arreglo). Si no hay conexión, usa lo
  // cacheado. cache:"no-store" es clave acá: sin esto, el fetch podía
  // resolverse con la caché HTTP propia del navegador (por los headers
  // que manda GitHub Pages) sin ir realmente a la red, y el celular
  // seguía viendo una versión vieja aunque "network-first" pareciera
  // estar andando.
  e.respondWith(
    fetch(e.request, { cache: "no-store" })
      .then((resp) => {
        if (resp && resp.status === 200 && resp.type === "basic") {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(e.request).then((cached) =>
        cached || (e.request.mode === "navigate" ? caches.match("./index.html") : undefined)))
  );
});



async function videoDesdeCache(req, url) {
  const clave = url.origin + url.pathname;
  try {
    const cache = await caches.open(CACHE_ASSETS);
    let entero = await cache.match(clave);
    if (!entero) {
      const r = await fetch(clave);
      if (!r || r.status !== 200) return fetch(req);
      await cache.put(clave, r.clone());
      entero = r;
    }
    const rango = req.headers.get("range");
    if (!rango) return entero;
    const blob = await entero.blob();
    const m = /bytes=(\d*)-(\d*)/.exec(rango) || [];
    const total = blob.size;
    let ini = m[1] ? parseInt(m[1], 10) : 0;
    let fin = m[2] ? parseInt(m[2], 10) : total - 1;
    if (!m[1] && m[2]) { ini = Math.max(0, total - parseInt(m[2], 10)); fin = total - 1; }
    fin = Math.min(fin, total - 1);
    if (ini > fin) return new Response(null, { status: 416, headers: { "Content-Range": "bytes */" + total } });
    return new Response(blob.slice(ini, fin + 1), {
      status: 206,
      headers: {
        "Content-Type": entero.headers.get("Content-Type") || "video/mp4",
        "Content-Range": "bytes " + ini + "-" + fin + "/" + total,
        "Content-Length": String(fin - ini + 1),
        "Accept-Ranges": "bytes"
      }
    });
  } catch (err) {
    return fetch(req);
  }
}
