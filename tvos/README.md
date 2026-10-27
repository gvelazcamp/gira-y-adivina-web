# Girá y Adiviná para Apple TV (tvOS)

Proyecto **nativo tvOS**, separado del APK/AAB de Android TV. La televisión es la anfitriona: conserva el código de sala, recibe acciones de los celulares y muestra el juego. Los celulares entran desde `girayadivina.com/tele` o desde la app de Play Store. Requiere internet.

## Estado

Se prepara la primera prueba nativa con Sala TV, mando de Apple TV y el protocolo `gya/tele/<código>` del sitio. Por ahora **100 Rioplatenses, Ahorcado, El Rosco y Tutti Frutti son jugables en el código fuente**; Ruleta y Puzzle siguen pendientes de portar a tvOS. Tutti Frutti admite varios celulares y tres rondas de palabras, reloj, BASTA, revisión local, apelaciones y anulaciones. Las palabras ausentes del banco local se marcan como dudosas para apelar, porque la consulta externa de la versión web todavía no está disponible en tvOS. GitHub Actions compiló una primera versión y generó un IPA sin firma. **No hay todavía un IPA firmado ni probado en Apple TV.**

## Compilación

Hace falta macOS con Xcode y XcodeGen (`brew install xcodegen`):

```sh
cd tvos
xcodegen generate
xcodebuild -project GiraYAdivinaTV.xcodeproj -scheme GiraYAdivinaTV -sdk appletvos -configuration Release build
```

Para instalar en una Apple TV real se necesita una firma y un perfil de aprovisionamiento compatibles con esa televisión. Los certificados y claves no se guardan en este repositorio. Antes de distribuir a otros usuarios, probar el mando, sonido, conexión real con un Redmi y los juegos en una Apple TV física.

El workflow `build-tvos.yml` compila en un runner macOS si este repositorio se publica en GitHub. Su artefacto `GiraYAdivinaTV-unsigned.ipa` **no es instalable directamente** hasta que se firme mediante un método válido; tampoco sustituye la prueba en un dispositivo real. El workflow no usa ninguna credencial de Apple.

El proyecto [sideloadATV](https://github.com/thangaraj26/sideloadATV) documenta que su app Android toma un IPA de tvOS, lo firma con la cuenta Apple del dueño del dispositivo y lo instala por Wi-Fi. Si la app instalada por Gonzalo corresponde a esa versión, se puede probar con el IPA sin firma de Actions: descargar el artefacto, extraer el `.ipa`, conectar Redmi y Apple TV a la misma red, iniciar sesión en sideloadATV, emparejar la televisión e instalar el archivo. **Todavía no se probó este flujo con Girá y Adiviná ni con su Apple TV.** En una cuenta Apple gratuita, la firma suele durar 7 días y sideloadATV ofrece renovarla.
