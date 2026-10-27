# Girá y Adiviná para Apple TV (tvOS)

Proyecto **nativo tvOS**, separado del APK/AAB de Android TV. La televisión es la anfitriona: conserva el código de sala, recibe acciones de los celulares y muestra el juego. Los celulares entran desde `girayadivina.com/tele` o desde la app de Play Store. Requiere internet.

## Estado

Se prepara la primera prueba nativa con Sala TV, mando de Apple TV y el protocolo `gya/tele/<código>` del sitio. Por ahora **100 Rioplatenses y Ahorcado son jugables en el código fuente**; Ruleta, Tutti Frutti, Rosco y Puzzle siguen pendientes de portar a tvOS. **No hay todavía un IPA compilado, firmado ni probado en Apple TV.** La app `sideloadATV` instalada por Gonzalo no se ha verificado como método de instalación; no afirmar que acepte un IPA sin firma.

## Compilación

Hace falta macOS con Xcode y XcodeGen (`brew install xcodegen`):

```sh
cd tvos
xcodegen generate
xcodebuild -project GiraYAdivinaTV.xcodeproj -scheme GiraYAdivinaTV -sdk appletvos -configuration Release build
```

Para instalar en una Apple TV real se necesita una firma y un perfil de aprovisionamiento compatibles con esa televisión. Los certificados y claves no se guardan en este repositorio. Antes de distribuir a otros usuarios, probar el mando, sonido, conexión real con un Redmi y los juegos en una Apple TV física.

El workflow `build-tvos.yml` compila en un runner macOS si este repositorio se publica en GitHub. Su artefacto `GiraYAdivinaTV-unsigned.ipa` **no es instalable directamente** hasta que se firme mediante un método válido; tampoco sustituye la prueba en un dispositivo real. El workflow no usa ninguna credencial de Apple.
