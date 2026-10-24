# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Cerebro del proyecto (leer siempre)
Antes de cualquier trabajo, leer `CEREBRO_DEL_PROYECTO.md` (memoria del proyecto que dejó Gonzalo) y respetar sus reglas. Después de cada cambio confirmado (mergeado), agregar una entrada en su sección "Registro de cambios" con la plantilla que trae, y corregir los hechos que hayan quedado viejos. Las cosas que Gonzalo pida guardar "para después" se anotan ahí como pendientes, no se implementan.

## Overview

"Girá y Adiviná Rioplatense" is a Río de la Plata–themed wheel-of-fortune / word-guessing trivia game. It is a **single-file vanilla HTML/CSS/JS app**: almost all game logic, styles, and markup live in `index.html` (thousands of lines, inline `<style>` and `<script>`). There is no build tooling, no bundler, no package.json, no framework, and no test suite.

The game is deployed two ways from the same code:
- **Web / PWA**: served as a static site via GitHub Pages at `https://girayadivina.com` from THIS repo (`gvelazcamp/gira-y-adivina-web`, `CNAME`). The old repo `gvelazcamp/gira-y-adivina-rioplatense` (old URL `gvelazcamp.github.io/gira-y-adivina-rioplatense/`) now only serves the migration bridge that moves players' saved progress to the new domain — don't ship game changes there. `manifest.json` makes it installable (`start_url: "./index.html"`, standalone, portrait, `lang: "es-UY"`).
- **Android**: wrapped as a TWA (Trusted Web Activity) — `.well-known/assetlinks.json` declares the Android package `io.github.gvelazcamp.twa`. Because the TWA just loads the live web app, **most gameplay/content changes ship instantly to Android users on next launch with no new APK build.**

A sibling standalone page, `mahjong-rioplatense.html`, is a separate self-contained mini-game (not part of the `index.html` SPA or its Extensiones lobby) that links back to the main game. See `mahjong-rioplatense.md` for its own design notes and working rules — they're specific to that file and don't apply to the rest of the repo.

## Commands

There is no build, lint, or test step. To preview locally, serve the directory as static files, e.g.:

```
python3 -m http.server
```

then open `index.html` in a browser. Verify UI changes manually (or with Playwright) in a real browser — there is no automated test suite to run.

## Service worker (`sw.js`)

Split strategy, not uniformly network-first anymore:
- `index.html`/JS/manifest: **network-first**, falling back to cache only when offline. This was a conscious fix for a real bug — a cache-first strategy left phones (especially the TWA) stuck on stale versions after deploys.
- Anything under `assets/`: **cache-first** (added later to stop the shop re-fetching every icon over the network on each open).

Images, audio and video (svg/webp/png/jpg/gif/mp3/mp4…) live in a separate persistent cache, `CACHE_ASSETS` (`gya-assets-v1`), that is **not** wiped when `CACHE_NAME` is bumped (bumping `CACHE_NAME` on every deploy used to wipe every map, video and icon, so phones re-downloaded everything and saw black/slow screens after each update). Bump `CACHE_NAME` for code changes as usual; **replacing the content of an existing media file with the same filename will not reach phones** unless you bump `CACHE_ASSETS` — prefer a new filename or a `?v=` query instead. `.mp4` requests are served from the cache with proper 206 range responses (`videoDesdeCache`).

## Architecture inside `index.html`

### State model: `S` vs `V`
- `S` is the host's authoritative, mutable game state.
- `V` is a render-facing snapshot broadcast to all clients, produced by `publicar()`.
- `pintar()` / `pintarTodo()` render from `V`, never directly from `S`, so guests and the host render identically.

### Mode dispatch: `modo`
Game behavior branches throughout the code on a `modo` string:
- `"local"` — same-device, no network.
- `"bot"` — vs AI (covers both world-map matches and the "Jugar online" fake matchmaking flow).
- `"host"` / `"guest"` — real multiplayer with a friend.
- `"tvhost"` / `"tvguest"` — "Sala TV" family mode.

Anything involving per-player display (e.g. which tablero/board background to show) needs to check `modo` and handle each branch — `aplicarTableroSegunTurno()` is the reference example: `"host"/"guest"` swap board art per `V.jug[V.turno].tab` (turn-based), while `"bot"/"local"` always show the local player's own `tableroEquipado` (no swapping, since there's no real opponent turn to reflect).

### Multiplayer transport
Real-time sync uses **public MQTT brokers over WebSocket** (e.g. `wss://broker.emqx.io:8084/mqtt`) — there is no custom backend/server. Treat message payloads over MQTT as the only channel between host and guest(s).

**Salas de extensiones (duelos 1 vs 1 y Tutti Frutti) — no tocar sin motivo, funciona así desde el 4/10/2026:**
- `MultiBroker.conectar(alConectar, alFallar, asignar)` (en `duelo-extensiones.js`) se conecta **a la vez** a los 4 brokers públicos (emqx, hivemq, mosquitto, eclipse:443) **y** a Supabase Realtime (broadcast, mismo proyecto del Ranking). Publica y escucha en todos; los duplicados (mismo texto en <1,5 s) se descartan. Antes se probaba un broker por vez y, si uno fallaba para un solo celular, los dos quedaban en servidores distintos y no se encontraban.
- `mqtt.js` está **guardado en el repo** (`lib/mqtt.min.js`, v5.10.1), no se depende de unpkg (cuando unpkg falló, todas las salas dieron error).
- El mensaje de error muestra el estado de cada servidor y `GYA_VERSION_SALAS`: pedir esa captura al dueño antes de adivinar.
- El juego principal (rueda host/guest, Sala TV) y Contra Reloj online siguen con su conexión propia (`conectar()` / la de `contra-reloj-rioplatense-online.js`).

### Shop (`Tienda`)
CSS/JS use a `tn-` prefix convention. Purchases go through a generic pipeline dispatched by string-prefix on an item "tipo": `tnPuedeComprar(tipo)` → `tnRazonBloqueo(tipo)` → `tnEjecutarCompra(tipo, precio)`. Known tipo prefixes: `sobre_<cityId>` (collectible pack), `marco_<frameId>` (avatar frame), `oferta_gratis`, `vida`, `recarga`, `ruleta`. A shared confirmation modal (`#confirmCompra`) is reused for all purchase types; `#capaSeccionTienda` is a shared full-screen sub-modal used to show a section's full catalog when its title is tapped (pattern: a few items shown inline, the rest only visible via this "ver todos" view).

`ruleta` (Giro extra) is special-cased: it does not purchase directly — it shows a confirm dialog and, on confirm, navigates to the Ruleta screen instead.

Real-money purchases (`.tn-comprar-mini`, `.tn-item.tn-real`, and the "Paquetes con dinero real" section) are fully built in the UI but currently **hidden via a single CSS block** (search for "PAUSA DE DINERO REAL") pending Google Play Billing integration — not deleted, just hidden, meant to be reactivated later. The real-money buttons that are reachable are stubbed to show a "coming soon" toast; there is no real payment integration yet.

Ownership state for shop items (`tablerosComprados`, `framesComprados`, equipped selections) is tracked in in-memory Sets/strings and persisted to `localStorage`; always check ownership via the existing `*Poseido`/`*Disponibles` helpers rather than assuming an item is free.

### Daily rotation
`ofertaDiaIdx()` derives a deterministic index from `Math.floor(Date.now()/86400000)` (days since epoch) — this drives which items appear in "Ofertas diarias" (daily frame deal, daily collectible pack) without needing localStorage or server coordination; every client computes the same day index independently.

### Collections
`COLECCIONES` is keyed by city id (e.g. `montevideo`, `punta`, `colonia`, etc.) and defines each city's collectible-pack art and item list; `Object.keys(COLECCIONES)` is the canonical ordered list of city ids used both by the shop grid and the daily pack rotation.

### Persistence
Game/profile/shop state persists via `localStorage` under `gya_`-prefixed keys (e.g. `gya_tablero_equipado`). Player identity is a simple typed-in profile name (`perfil.nombre`), not an auth system — do not assume it's unique or stable across devices.

### Asset pipeline
Images under `assets/` (avatars, frames, tableros, per-city collectibles, shop art) are generated externally (ChatGPT image prompts) then processed locally with Python/PIL (resize/crop, convert to `.webp`) before being committed. The board-art generation prompt template is kept at `assets/tableros/PROMPT.md` for regenerating that specific style; the passport-stamp style template lives at `assets/passport/PROMPT.md`.

### Supabase (Ranking, backup, profile-name uniqueness)
Despite the "no backend" framing above, the game does talk to one real backend: Supabase (`SUPA_URL`/`SUPA_KEY` constants, client loaded via `@supabase/supabase-js` from a CDN `<script defer>`). Everything goes through a single table, `gya_ranking`, reused for three unrelated purposes distinguished only by the `grupo` column:
- `grupo:"global"` (`RK_GRUPO`) — the opt-in "Ranking de amigos" leaderboard. Player picks an `apodo` (separate from `perfil.nombre`, stored in `gya_ranking_perfil`).
- `grupo:"usuarios"` (`USR_GRUPO`) — a shadow registry written automatically (`empujarUsuario()`) for every player who has a profile (`perfil.nombre` used as the row's `apodo`), independent of whether they ever opt into Ranking. Powers cross-device restore via `?restaurar_apodo=<nombre>` in the URL.
- Both rows carry a full `estado_juego` JSON blob (`capturarEstadoJuego()`, everything in `localStorage` under `gya_`/`larueda_` prefixes) as a complete backup, synced on a debounce whenever local state changes (`chequearCambioEstadoJuego`/`programarSyncEstadoJuego`).
- Upserts use `onConflict:"grupo,apodo"` — meaning `(grupo, apodo)` is treated as unique. Two different players choosing the same `apodo`/`perfil.nombre` within the same `grupo` silently overwrite each other's row. `nombrePerfilDisponible()` guards against this at profile creation/edit time (checks `gya_ranking` across both `grupo`s before allowing a name), but it's a best-effort client-side check, not a DB constraint — Supabase calls are wrapped in `try/catch` and swallow errors everywhere in this file (offline should never hard-block the game).

### Juegos de previa (`grupo:"previa"`)
Los juegos de grupo con un solo celular (Contra Reloj —oculto para todos menos Gonzalo desde el 18/10/2026 con soloGonzalo:true—, Impostor, Mímica, Canta la Canción, ¿Quién soy?, Bomba, ¿Qué número soy?) van en su propia sección del lobby. Tutti Frutti (cada uno con su celular, online) está en "Más juegos" desde el 17/10/2026, aunque sigue usando PantallaFija y el editor compartido. Los que muestran algo a pantalla completa usan `PantallaFija` (`pantalla-fija.js`): pantalla completa, Wake Lock para que no se apague, el "atrás" bloqueado y un botón "✕ Salir" que pide confirmación (`PantallaFija.confirmar`). `PantallaFija.invitar(id,nombre)` arma la invitación de WhatsApp con `?ext=<id>`, y `PantallaFija.editorJugadores` / `nombreJugador` dan el editor de jugadores compartido. Tutti Frutti es al mejor de 3 rondas (gana quien gana más rondas; empate → más puntos) y se juega por puntos como el real (10 única, 5 repetida, 20 si es el único, 0 si no vale; ⚠️ vale 0 salvo que la salven con votos ✔, y una ✓ se anula con votos ❌; el anfitrión revisa y manda las marcas): listas propias en `tutti-frutti-datos.js`, Wikipedia para Famoso/Marca/Película y el diccionario por letra `assets/diccionario/es-<l>.txt` (an-array-of-spanish-words, MIT) para Cosa.

### Deslizado (scroll): no se toca
Regla del dueño (19/10/2026): el deslizar de las pantallas del juego **nunca se toca** — nada de `overscroll-behavior`, `touch-action`, `scroll-snap`, `scroll-behavior`, `overflow` en html/body ni listeners de touch/wheel que lo frenen. Una regla así (`overscroll-behavior-y:none`, 17/10) le dejó el inicio trabado y hubo que sacarla. Si algo parece pedirlo, preguntarle antes a Gonzalo.

### Bug-hunting agent on demand
There is no test suite (see Commands above), so correctness relies on manual QA and periodic review. When the project owner says **"despertar agente"** (or an obvious variant, e.g. "despertá el agente"), spend a while doing a thorough correctness-focused review of `index.html` — use the `code-review` skill at `high` or `max` effort targeting the file (not just the current diff), since the goal is to surface latent bugs across the whole single-file codebase, not just recent changes. Report findings concisely in Spanish; don't silently apply fixes unless the owner (Gonzalo, non-technical) asks you to.

### Palabras de las extensiones (no repetir)
Regla del dueño: una respuesta no puede aparecer en dos juegos de respuesta única (Ahorcado, Contra Reloj, Impostor, Mímica, Quién soy, Rosco, Silabario, Sopa Fugaz), ni repetirse dentro del mismo juego (entre niveles o categorías), y ninguna pista/definición/pregunta/frase puede repetirse entre juegos. 100 Rioplatenses (respuestas de encuesta), Canta la Canción, Palabra Secreta y Rueda de Letras (palabras comunes) solo dan aviso. **Después de agregar o cambiar palabras en cualquier `*-datos.js`, correr `node tests/auditar-palabras.cjs --md`** (actualiza `AUDITORIA_PALABRAS.md`; sale con código 1 si hay errores) y corregir antes de subir. Si hay que elegir qué juego conserva una palabra repetida, prioridad: Rosco > Silabario > Ahorcado > Sopa Fugaz > Contra Reloj (los más restringidos la conservan).
