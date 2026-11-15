# Estado — rol 2 (Motor y simulación)
**Actualizado:** 2026-11-15 · **Rama:** feat/motor-variabilidad · **PR:** variabilidad (P3) → develop

## Hecho
- Multi-misión (#152, parte motor, Daniel cubriendo a Jaime): la misión es el último parámetro opcional de todas las funciones públicas; `partidaDeMision(mision, semilla?)`. Revisado por Jaime.
- P3, variabilidad: `variabilidad.test.ts`. Con el catálogo curado, dos semillas arman escenarios distintos (sitio, objetivo, tormenta, avería, órbita). En la misma misión, otra semilla cambia la suerte y la tripulación, no las reglas. Con tres semillas, cuidar a la tripulación gana y descuidarla pierde. Misma semilla y mismas decisiones: misma partida.
- #90 consumo de módulos por tick (#143) y rechazo limpio `puedeAplicar` (#139), en develop.

## Qué sigue
- Propuesta (issue `contrato`, no hecho): guardar `misionId` en GameState para no pasar la misión en cada llamada.
- `MISION_JEZERO.fin.tickLimite` sin aplicar: falta que diseño diga qué pasa al vencer el tiempo sin telemetría.
- Revisar el uso del motor en los PRs de pantalla del frontend v8.

## Bloqueos
- ninguno
Tokens: verde
