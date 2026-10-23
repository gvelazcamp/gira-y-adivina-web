const CACHE_NAME = "gya-cache-v380";
const APP_SHELL = ["./", "./index.html", "./manifest.json", "./i18n.js?v=1", "./lib/mqtt.min.js?v=5.10.1", "./lib/supabase.min.js?v=2.45.4", "./icono-192.png", "./icono-512.png", "./assets/logo.webp", "./assets/splash.webp?v=4", "./assets/splash-tv.webp?v=1", "./assets/social/online-icono.webp", "./assets/social/social-icono.webp", "./assets/social/amigos-icono.webp", "./assets/social/tienda-icono.webp", "./assets/eventos/icono-evento.webp", "./ui-icons.js?v=1", "./assets/ui/coin.svg", "./assets/ui/shield.svg", "./extensiones.css?v=112", "./extensiones.js?v=51", "./duelo-extensiones.js?v=16", "./sopa-fugaz-datos.js?v=3", "./sopa-fugaz.js?v=9", "./logo-sopa-fugaz.svg", "./rueda-de-letras-datos.js?v=4", "./rueda-de-letras-diccionario.js?v=1", "./rueda-de-letras.js?v=16", "./logo-rueda-de-letras.svg", "./palabra-secreta-datos.js?v=2", "./palabra-secreta.js?v=18", "./logo-palabra-secreta.svg", "./frases-en-giro-datos.js?v=1", "./frases-en-giro.js?v=9", "./logo-frases-en-giro.svg", "./memoria-en-giro.js?v=8", "./logo-memoria-en-giro.svg", "./rosco-rioplatense-datos.js?v=4", "./rosco-rioplatense.js?v=14", "./logo-rosco-rioplatense.svg", "./silabario-rioplatense-datos.js?v=3", "./silabario-rioplatense.js?v=15", "./logo-silabario-rioplatense.svg", "./cien-rioplatenses-datos.js?v=1", "./cien-rioplatenses.js?v=9", "./logo-cien-rioplatenses.svg", "./ahorcado-rioplatense-datos.js?v=1", "./ahorcado-rioplatense.js?v=12", "./logo-ahorcado-rioplatense.svg", "./contra-reloj-rioplatense-datos.js?v=2", "./contra-reloj-rioplatense-voz.js?v=3", "./contra-reloj-rioplatense-online.js?v=12", "./contra-reloj-rioplatense.js?v=12", "./logo-contra-reloj-rioplatense.svg", "./assets/extensiones/contra-reloj/dado-0.png", "./assets/extensiones/contra-reloj/dado-1.png", "./assets/extensiones/contra-reloj/dado-2.png", "./moon-tap.js?v=5", "./puzzle.js?v=43", "./puzzle.html?v=43", "./logo-puzzle.svg", "./pantalla-fija.js?v=8", "./que-numero-soy.js?v=8", "./logo-que-numero-soy.svg", "./quien-soy-datos.js?v=1", "./quien-soy.js?v=11", "./logo-quien-soy.svg", "./bomba.js?v=14", "./logo-bomba.svg", "./impostor-datos.js?v=1", "./impostor.js?v=8", "./logo-impostor.svg", "./mimica-datos.js?v=2", "./mimica.js?v=7", "./canta-la-cancion-datos.js?v=1", "./canta-la-cancion.js?v=13", "./tutti-frutti-datos.js?v=34", "./tutti-frutti.js?v=73", "./logo-mimica.svg", "./logo-canta-la-cancion.svg", "./logo-tutti-frutti.svg", "./logo-moon-tap.webp", "./assets/audio/error-extensiones.mp3", "./assets/extensiones/moon-tap/fondo.webp", "./mahjong-rioplatense.html", "./logo-mahjong.png"];

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
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const url = new URL(e.request.url);
  const esAssetLocal = url.pathname.includes("/assets/");
  const esLibreriaExterna = url.origin !== self.location.origin;

  // Las imágenes de assets/ Y las librerías/fuentes externas (Google
  // Fonts, mqtt.js, supabase-js desde sus CDN) se sirven de la caché
  // primero: son archivos que casi nunca cambian, no tiene sentido
  // volver a pedirlos por red en CADA apertura del juego. Antes esto
  // pasaba (caían en la regla de abajo, "red primero, sin caché") y
  // sumaba segundos muertos de pantalla en blanco al abrir la app,
  // sobre todo con mala señal. IMPORTANTE: si se reemplaza el
  // CONTENIDO de un archivo ya existente en assets/ (mismo nombre,
  // distinta imagen), hay que subir el CACHE_NAME de acá arriba, si no
  // los celulares que ya lo cachearon nunca ven el cambio.
  if (esAssetLocal || esLibreriaExterna) {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((resp) => {
          if (resp && resp.status === 200 && resp.type !== "opaque") {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
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


