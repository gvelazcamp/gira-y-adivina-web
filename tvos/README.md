# Girá y Adiviná para Apple TV (tvOS)

Proyecto **nativo tvOS**, separado del APK/AAB de Android TV. La televisión es la anfitriona: conserva el código de sala, recibe acciones de los celulares y muestra el juego. Los celulares entran desde `girayadivina.com/tele` o desde la app de Play Store. Requiere internet.

## Estado

Se prepara la primera prueba nativa con Sala TV, mando de Apple TV y el protocolo `gya/tele/<código>` del sitio. Por ahora **100 Rioplatenses, Ahorcado, El Rosco y Tutti Frutti son jugables en el código fuente**; **Puzzle** también tiene un primer prototipo nativo para tvOS: tablero de fichas rectangulares (no las piezas curvas encastrables del Puzzle web), de a uno o colaborativo desde varios celulares, arrastre para intercambiar fichas, giro, zoom, guía, imagen original y guardado local para continuar. Se incorporan 15 imágenes originales de cinco categorías (Dibujos, Aventuras, Héroes, Ciudades y Gigantes) y tamaños de 12 a 1.000 piezas; los tamaños altos requieren pruebas de rendimiento en Apple TV real. Se conservan los controles existentes de `tele.js`, sin otro PR web. Para compilar localmente, antes de `xcodegen generate` ejecutar `bash scripts/prepare-puzzle-images.sh` desde la carpeta `tvos`, que convierte los archivos WebP originales a PNG y los incorpora al paquete. La Ruleta nativa incluye la rueda original de 24 gajos, 3 rondas normales, Prueba de Velocidad, Ronda Bonus, compra de vocales, resolución, Quiebra, Pierde turno, Comodín y x2. No incluye todavía poderes comprados, personalizaciones ni monedas de la cuenta web. Requiere un controlador web compatible con `ruleta_nativa`. Tutti Frutti admite varios celulares y tres rondas de palabras, reloj, BASTA, revisión local, apelaciones y anulaciones. Las palabras ausentes del banco local se marcan como dudosas para apelar, porque la consulta externa de la versión web todavía no está disponible en tvOS. GitHub Actions compiló una primera versión y generó un IPA sin firma. **No hay todavía un IPA firmado ni probado en Apple TV.**

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
