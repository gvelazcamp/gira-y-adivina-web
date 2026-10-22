# App Android de Girá y Adiviná

Este proyecto mantiene el paquete de Play `io.github.gvelazcamp.twa`. La versión 17
conserva Play Billing y notificaciones de la versión 16.

## Arranque

- El fondo inicial es `#08070D`. Los cinco `res/drawable-*/splash.png` son imágenes
  transparentes de 1 píxel; el logo sigue siendo el icono de la aplicación.
- En una instalación nueva, `LauncherActivity` abre `/index.html` directamente.
  Una actualización conserva `?comprobar_partida=1` para recuperar la partida
  guardada en el dominio anterior.
- `gvelazcamp.github.io` es un origen confiable adicional para ese traslado.
  Tanto ese origen como `girayadivina.com` deben servir un `assetlinks.json` con
  el certificado de firma de Play.
- La barra con la dirección la decide el navegador de la TWA según la
  verificación del dominio. La prueba definitiva es una instalación nueva de
  Play en Android; una compilación local no prueba esa verificación.

## Compilación y firma

`./gradlew :app:bundleRelease` produce `app/build/outputs/bundle/release/app-release.aab`.
Sin la clave original, ese archivo queda **sin firmar y no se puede subir a Play**.
Para publicar, firmarlo con el mismo `signing.keystore`, alias y contraseñas del
paquete anterior. No generar una clave nueva ni guardar la clave o sus
contraseñas en Git.

El código y los recursos fueron generados con Bubblewrap 1.27.0 y luego
ajustados para este arranque. Regenerar el proyecto sobrescribe esos ajustes.
