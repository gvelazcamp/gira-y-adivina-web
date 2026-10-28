# Bocass v2 — Giro / Rosco

**Estado:** siete PNG aprobados, **aún pendientes de importar** como binarios a esta carpeta. No borrar ni reemplazar los sprites antiguos de `../bocas/`.

Se esperan exactamente estos archivos PNG transparentes, de 200 × 100 píxeles:

| Archivo | SHA-256 del original aprobado |
| --- | --- |
| `Giro_boca_01_cerrada.png` | `dd70fb7e4dd395bb8eece58b2896f7764ec8b369e532d8af26febe4de23021a4` |
| `Giro_boca_02_abierta.png` | `899883c85a015d837d1a96829f5954ca8884e1399511c7e682c9d1e12bf2a837` |
| `Giro_boca_03_vocal_o.png` | `08f32087aacadc370786d724b17e7d1507558e757692eda2d6639fe8b7226840` |
| `Giro_boca_04_dientes.png` | `c3e9649fd9cbed6925b702b54e52b88dcd7b3046997dd2c9f0b0c679fa70d3e7` |
| `Giro_boca_05_o_pequena.png` | `f225ce82b98767d2d1ead9a9dec03f7f3280802d0aee9698b8bbad0d14291e2e` |
| `Giro_boca_06_lengua.png` | `1b62aa966a72cb9e784355142711ac4e858d653192344ed54b299cd02818509f` |
| `Giro_boca_07_risa.png` | `7bfe9d4ba86f9008b25c800f2532ee8b4a3384ef8ae4b91b46d704aa88ed9623` |

El paquete fuente es `Giro_bocas.zip`, generado y aprobado en esta conversación. Solo descomprimir los siete PNG directamente aquí, sin añadir otra carpeta intermedia. No subir previews ni imágenes de prueba.

El piloto `giro-rosco-piloto.js` detecta si están disponibles las siete bocas. Si falta alguna, desactiva el movimiento de labios de forma segura, pero la voz y el Rosco siguen funcionando.

**Al subir:** comprobar URLs y SHA-256 de los siete originales; después probar con usuario `Gonzalo` en celular, sin música y sin afectar el resto de usuarios.
