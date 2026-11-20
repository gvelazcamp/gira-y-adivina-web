# Puente ChatGPT → GitHub → Claude Code

Este puente permite pedir desde ChatGPT: «Decile a Claude que haga X», registrar el trabajo en un Issue de GitHub y ejecutar Claude Code mediante GitHub Actions. Después ChatGPT podrá leer el Issue, los logs, la rama y los cambios, y crear las imágenes o videos que falten.

**Estado inicial:** preparado en una rama de revisión. No está activo hasta incorporar el workflow a `main` y configurar la autenticación. No toca la automatización privada de Instagram.

## Autorización y credenciales (solo una vez)

1. Generar una clave de API de Anthropic en la consola de Anthropic. La suscripción a Claude y el consumo de API pueden facturarse por separado.
2. Abrir este repositorio en GitHub → **Settings → Secrets and variables → Actions → New repository secret**.
3. Crear el secreto con:
   - **Name:** `ANTHROPIC_API_KEY`
   - **Value:** la clave de API generada en Anthropic. Pegarla **solo en GitHub**, nunca en ChatGPT, en Issues o en archivos del repositorio.
4. Instalar/autorizar la app oficial de Claude en GitHub para este repositorio: https://github.com/apps/claude
5. Revisar y aprobar el Pull Request de instalación cuando se desee activar el puente. Hasta entonces no ejecuta Claude.

No se necesita usuario ni contraseña de GitHub o de Claude en un script. `GITHUB_TOKEN` se genera automáticamente en cada ejecución de Actions.

## Pedir una tarea

Desde ChatGPT, crear un **Issue nuevo** en `gvelazcamp/gira-y-adivina-web`, con la descripción del pedido que incluya `@claude`. El Issue es el registro de la tarea.

Ejemplo de cuerpo del Issue:

```
@claude

Implementá [describir tarea precisa].

Reglas:
- No romper ni quitar funcionalidades existentes.
- Solo agregar o cambiar lo solicitado.
- Trabajar en una rama separada y dejar cambios pendientes de revisión.
- No hacer merge a main ni publicar versiones.
- Ejecutar pruebas disponibles y describir resultados.
- Listar los archivos alterados.
- Separar cualquier pendiente de logos, sprites, imágenes o videos para ChatGPT.
```

El workflow `.github/workflows/claude-desde-chatgpt.yml` escucha Issues nuevos y comentarios nuevos con `@claude` **creados por `gvelazcamp`**. No se activa para otros autores.

## Seguimiento

- El Issue conserva instrucciones, conversación y evolución del pedido.
- La ejecución de GitHub Actions conserva el log y el resultado.
- Claude Code puede crear una rama de trabajo y un enlace para proponer un Pull Request. No asumir que el PR aparece automáticamente.
- ChatGPT puede consultar el Issue, el log y la rama usando su conector GitHub; después preparar y subir los recursos autorizados.
- La aprobación y el merge a `main` quedan en manos de Gonzalo.

## Seguridad

- **El repositorio es público:** los Issues y sus descripciones también son públicos. No poner contraseñas, tokens, datos privados, información de pacientes o proveedores en los pedidos.
- El secreto `ANTHROPIC_API_KEY` es privado y no debe imprimirse en logs.
- Ejecutar el workflow solamente mediante pedidos nuevos explícitamente autorizados.
- No habilitar usuarios/bots ajenos sin una revisión de permisos.
- La ejecución puede consumir créditos de Anthropic y minutos de GitHub Actions. La clave queda bajo control del propietario de GitHub.
- Si hay dudas técnicas, preparar propuesta y pruebas en la rama; no tocar la versión publicada.

## Verificación inicial (cuando esté configurado)

Pedir una tarea no destructiva: «@claude Analizá la estructura del repositorio, explicá cómo ejecutar las pruebas y proponé un cambio mínimo sin editar código».

Confirmar que:
1. Se ejecutó el workflow desde un Issue del propietario.
2. La autenticación funcionó sin exponer secretos.
3. El resultado quedó en el Issue o los logs.
4. No se modificó `main`.
5. ChatGPT puede recuperar el resultado desde GitHub.

## Automatización de imágenes y videos

No crear imágenes por suposición. Claude debe dejar instrucciones o una lista de recursos pendientes; ChatGPT los producirá cuando lo solicite el usuario y los subirá a la rama correspondiente con revisión previa.

**Regla principal: no romper lo que funciona. Solo agregar lo pedido.**
