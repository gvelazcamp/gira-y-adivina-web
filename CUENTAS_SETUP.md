# Una partida en la app y la web

La vinculación es opcional. Los invitados siguen jugando como antes. La identidad verificada es el ID de Google en Supabase Auth; el nombre visible (Meg, Rubén, etc.) no identifica a una persona.

## Activación en Supabase

El frontend muestra «Guardar mi progreso» solo cuando **ambos** requisitos están activos. Actualmente la respuesta pública de `/auth/v1/settings` indica `external.google: false`, así que el botón permanece oculto.

1. En el proyecto Supabase `qfeubudlnoogwzozywph`, abrir **SQL Editor** y ejecutar [supabase/cuentas.sql](supabase/cuentas.sql). Crea `gya_cuentas` con una fila por ID verificado y políticas RLS. La clave pública del sitio solo puede leer o modificar la partida del usuario que inició sesión.
2. En Google Cloud, crear un cliente OAuth web. Agregar `https://qfeubudlnoogwzozywph.supabase.co/auth/v1/callback` como URI de redirección autorizada. Configurar la pantalla de consentimiento y publicar el cliente para los jugadores previstos.
3. En Supabase → Authentication → Providers → Google, activar Google e ingresar el client ID y el client secret del paso anterior. No guardar el secret en este repositorio ni enviarlo por chat.
4. En Supabase → Authentication → URL Configuration, establecer `https://girayadivina.com` como Site URL y permitir `https://girayadivina.com/**` en Redirect URLs. Si se prueba con otro dominio, añadir ese origen por separado.
5. Probar con dos navegadores o dispositivos reales que usan la misma cuenta de Google: guardar en la app, abrir la web, cargar el progreso; probar también el orden inverso, dos partidas diferentes, una conexión perdida y una recarga. Confirmar especialmente el retorno del OAuth dentro de la TWA de Play Store.

## Comportamiento

- El primer dispositivo vinculado sube su partida local. Un dispositivo sin partida descarga la guardada y recarga el juego.
- Si ambos lados tienen partidas, se muestran sus nombres y la persona elige una. La otra se conserva como copia local (`gya_cuenta_respaldo_local` o `gya_cuenta_respaldo_nube`). No se mezclan automáticamente monedas, niveles ni compras.
- Los guardados posteriores comprueban la revisión de la nube; ante cambios concurrentes se vuelve a pedir elección. El progreso del perfil de invitado permanece en el dispositivo cuando se cierra sesión.
- Los nombres duplicados ya presentes en Social no se fusionan ni se borran automáticamente. Solo después de que sus dueños vinculen la misma cuenta verificada se puede decidir qué partida conservar y limpiar las filas antiguas sin confundir personas distintas.
- El guardado antiguo de Social (`gya_ranking`) sigue existiendo para los invitados y su restauración histórica por apodo. Cuando hay una cuenta verificada, Social solo recibe el resumen para mostrar el mapa; el progreso completo se guarda en la tabla protegida. Las claves privadas de la cuenta no se incluyen en el respaldo público.
