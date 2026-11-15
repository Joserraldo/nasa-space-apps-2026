# Pruebas integradas de la ruta dorada — issue #114

Las pruebas ya existen en [`engine/src/ganable.test.ts`](../engine/src/ganable.test.ts), incorporadas por [#134](https://github.com/Joserraldo/nasa-space-apps-2026/pull/134). Este documento referencia esa implementación; no crea otra suite en `missions/test/`.

Santiago [aprobó](https://github.com/Joserraldo/nasa-space-apps-2026/issues/114#issuecomment-6884368837) tres ticks. La declaración única de `DURACION_TORMENTA_TICKS = 3` se conserva al final de `design/src/recursos.ts`, tal como entró con #134. El motor usa la ventana 3–5, sin daño antes ni desde 6.

## Preparación y API reales

La suite usa `partidaDorada`, `aterrizar`, `aplicarAccion` y `avanzarTick`, sin editar recursos a mano ni forzar resultados:

1. Crear la semilla dorada `jezero-2024-05-20` y aterrizar en `llanura-central`.
2. Colocar panel solar y después escudo en tick 0, sin ticks intermedios.
3. Comprobar el estado de preparación: energía 55, soporte vital 74 y blindaje 52.
4. Avanzar hasta tick 3, reparar Iris y aplicar la decisión del jugador.

`aterrizar(estado, sitioId)` ya cobra el aterrizaje una sola vez. Los intentos de colocar módulos ajenos a la misión, repetidos o un tercero devuelven el mismo estado sin cobrar.

## Casos implementados

| Caso | Decisión en tick 3 | Envío | Resultado |
|---|---|---|---|
| Victoria | Reparar Iris y refugiarse | Tick 4 | Éxito en tick 6, con los tres recursos positivos |
| Derrota explicable | Reparar Iris y subir escudo a nivel 2 | Tick 5 | Fallo por energía en cero al llegar la telemetría |

La suite también verifica daño solo durante tres ticks desde `tickTormenta`, retraso de comunicaciones, igualdad del estado completo con la misma semilla y acciones, aterrizaje único y límites de módulos. #139 añadió la comprobación del rechazo limpio mediante `puedeAplicar`.

Estas pruebas comprueban el motor integrado. No son una prueba E2E del navegador. Su eventual traslado o copia a `missions/test/` es opcional: debe coordinarse con Santiago y Jaime para evitar duplicarlas.

## Compatibilidad con las tarjetas de ciencia

[#138](https://github.com/Joserraldo/nasa-space-apps-2026/pull/138) ya está en `develop`: incorpora fuentes y textos revisados de las tarjetas de Jezero y comprueba que no queden tarjetas ni pregunta final sin fuente. Este PR conserva esos tres archivos de `missions/` intactos respecto de `origin/develop`.

## Pendientes reales, fuera de esta conciliación

- `MISION_JEZERO.fin.tickLimite` sigue en 10, pero el motor actual no evalúa ese límite; conserva la condición de días como respaldo. Diseño debe acordar el cierre por tiempo y su prioridad frente a la llegada de telemetría. No se cambia ningún número aquí.
- #139 implementa `puedeAplicar`: rechaza un costo inmediato que dejaría un recurso en cero. La confirmación de ese umbral por Diseño sigue abierta.
- Hay una discrepancia entre [el cierre de #140](https://github.com/Joserraldo/nasa-space-apps-2026/pull/140#issuecomment-6885603361) y lo fusionado en #139: su descripción dice expresamente que retiró el dilema para dejarlo en #140. En `develop` no existen `engine/src/dilema.ts` ni la exportación `elegirDilema`, y `aplicarAccion` no consume el efecto extra del invernadero de la misión. El README del motor sí menciona esa API como pendiente de #140. Requiere coordinación con motor; no se corrige `engine/` en este PR.

## Validación

Desde la raíz del repositorio:

- `npm.cmd run typecheck`
- `npm.cmd test` (incluye `engine/src/ganable.test.ts`)
- `npx.cmd vitest run engine/src/dorada missions`
- `git diff --check`

El CI remoto y E2E se revisan por separado. Quitar la declaración duplicada solo elimina ese error de tipos; no demuestra por sí mismo que E2E pase.
