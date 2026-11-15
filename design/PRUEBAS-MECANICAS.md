# Mecánicas: alcance verificable y pendientes

Base recuperada: `f63ee4c`; actualizada a `4a9d77e` sin reescribir historial.
No se cambian costos ni límites. Los 10 ticks de Marte norte y Luna visible son provisionales.
[Aprobación #196](https://github.com/Joserraldo/nasa-space-apps-2026/issues/196#issuecomment-6889442656).

## Datos corregidos en esta rama
- Escudo neutral en Marte norte y Luna visible; se mantienen Doctora/refugio e Ingeniera/batería.
- `Mision.eventoPolvo` opcional; Luna visible compatible sin inventar polvo lunar.
- Luna sur y Outpost identifican micrometeorito; Outpost no declara un terreno inexistente.
- Ningún dato de la ruta dorada ni cifra de balance cambia.

## Pruebas del motor, en rama separada
`feat/motor-fin-misiones`: plazo efectivo, compensación atómica del hielo y `engine/src/misiones-reales.test.ts`.
Las rutas usan la misión real, semilla `jezero-2024-05-20` y API pública; nunca fuerzan recursos ni resultado.
Las nuevas rutas fijas de referencia, sin módulos ni dilemas, son:

| Misión | Lugar | Victoria | Derrota |
|---|---|---|---|
| Jezero | llanura-central | Telemetría en 3, llega en 5 | Sin enviar; vence en 10, recursos positivos |
| Marte norte | crater-louth | Telemetría en 3, llega en 5 | Envío en 8; energía 0 en 10 |
| Luna sur | nobile | Telemetría en 3, llega en 4 | Sin enviar; blindaje 0 en 8 |
| Outpost | cabina | Telemetría en 3, llega en 6 | Sin enviar; blindaje 0 en 8 |

Estas rutas comprueban las reglas disponibles; NO certifican las mecánicas especiales pendientes.
La ruta dorada oficial con panel/escudo, refugio, victoria en 6 y derrota en 7 sigue en `ganable.test.ts`.
QA también comprueba determinismo, costos de todos los lugares, retrasos, dos módulos y consecuencias de dilemas.

## Bloqueos para certificar las cinco misiones
- **Santiago:** tick de amanecer, inicio de noche polar, almacenamiento/carga/descarga y protección por zona. #196 no los define.
- **Luna visible:** `telemetria_llega` contradice #196; falta amanecer aprobado y su prueba real. No equivale al límite de 10 ni al paso narrativo 8.
- **Jaime/Camilo:** eventos sobre equipos y producción, escarcha, panel sin producción nocturna y reparación/bloqueo de antena; definir cuándo se dispara cada evento.
- **Outpost:** protección y comunicación por zona; hoy solo hay costos/beneficios de selección, sin persistencia de la zona ni protección continua.
- **Contratos:** almacenamiento nuevo de batería o zona necesita issue `contrato` aprobado; esta entrega no modifica `contracts/`.
- **José:** conectar recomendaciones neutrales y mecanismos aprobados a voces y flujo, sin presentar datos preparatorios como jugabilidad completa.
- **Daniel:** comprobar fuentes de efectos por sitio; las cifras físicas no son automáticamente reglas de balance.

El QA original y los registros se conservan localmente en `build/recuperacion-mecanicas-20261115` y los `build/constructor-logs` respectivos.
Solo Santiago fusiona; las pruebas verdes de estos arreglos no cierran #196 ni la campaña completa.
