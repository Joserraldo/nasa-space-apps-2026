# Especificación de pruebas integradas — issue #114

Pendientes de la corrección de Jaime en #113. Este documento no es una prueba ejecutada ni demuestra que el motor vigente pueda ganarse.

Santiago aprobó `DURACION_TORMENTA_TICKS = 3`: [aprobación](https://github.com/Joserraldo/nasa-space-apps-2026/issues/114#issuecomment-6884368837). La ventana de daño es 3, 4 y 5; desde 6 no hay daño. Se conserva `MISION_JEZERO.fin.tickLimite = 10`.

## Preparación común

- Usar `partidaDorada` y `paso` de `@solar-shield/engine`, semilla `jezero-2024-05-20`, dificultad media y sitio `llanura-central`.
- Aplicar el aterrizaje mediante la API real que confirme Jaime: cuesta 3 de energía y 8 de blindaje, una sola vez. No alterar recursos a mano en la prueba.
- En tick 0 colocar panel solar y después escudo, sin ticks entre colocaciones. Para varias acciones de una misma pausa existe `aplicarAccion`; `paso(estado, accion?)` admite una acción y avanza un tick.
- Referencia hipotética tras preparar: energía 55, soporte vital 74 y blindaje 52.

## Prueba ganadora propuesta

1. Avanzar con `paso` hasta tick 3.
2. En tick 3, reparar `ia_base` y refugiarse. Avanzar a 4.
3. Enviar telemetría en tick 4; comprobar llegada prevista en 6 y dos ticks de retraso.
4. Avanzar a 5 y 6. El motor debe devolver `exito` en 6, con los tres recursos positivos.

Referencia diagnóstica de energía/soporte vital/blindaje: `3:52/68/53 → 4:31/56/50 → 5:18/53/51 → 6:15/51/56`.

## Prueba perdedora propuesta

1. Repetir la preparación y avanzar hasta tick 3.
2. En tick 3, reparar `ia_base` y ejecutar `subir_escudo` con nivel 2.
3. Avanzar hasta 5 y enviar telemetría: llegada prevista en 7.
4. Avanzar a 6 y 7. La energía llega a cero; debe prevalecer `fallo` aunque llegue la telemetría.

Referencia diagnóstica: `3:52/68/53 → 4:18/62/50 → 5:10/60/59 → 6:2/57/58 → 7:0/55/63`. La causa es el gasto del escudo y el envío tardío; enviando en 4, la simulación terminaba con energía 2.

## Aserciones y dependencias

- Comprobar los tres recursos, daño solo en ticks 3–5, retraso de telemetría y condiciones reales de éxito/fallo.
- Verificar máximo dos módulos distintos y permitidos; acordar con Jaime si los intentos inválidos se rechazan con excepción o sin efecto.
- Repetir semilla y acciones y comparar el estado completo. No usar monkeypatches, stubs ni resultados forzados.
- Acordar el cierre sin telemetría en tick 10 y el orden de evaluación si la llegada coincide con el límite. No asumir victoria automática ni cambiar ese límite.
- Alinear misión, interfaz y agentes: el dilema canónico usa escudo nivel 2 (16 de energía), frente al fallback de redistribuir 45 (49 en total). El refugio pierde 10 de soporte vital con retraso solo si se construyó invernadero.
- Las cifras son referencias de [simulaciones hipotéticas sobre `932f51e`](https://github.com/Joserraldo/nasa-space-apps-2026/issues/114#issuecomment-6883910090), no snapshots aprobados del motor integrado. Si difieren tras #113, investigar con Jaime antes de congelarlas.

Implementar en `missions/test/` después de #113, con la API confirmada y CI verde. Validar con `npm.cmd run typecheck`, `npm.cmd test` y `npx.cmd vitest run engine/src/dorada missions`.
