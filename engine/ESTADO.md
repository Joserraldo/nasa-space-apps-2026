# Estado — rol 2 (Motor y simulación)
**Actualizado:** 2026-11-14 18:05 · **Rama:** feat/motor-validacion-dilema · **PR:** #139 puedeAplicar → develop

## Hecho (últimas iteraciones)
- #134 (Santiago, revisado por motor): tormenta solo en ticks 3–5 (`tormentaEnCurso`), fin por telemetría, `aterrizar(estado, sitioId)`, `colocar_modulo` validado (`puedeColocar`, `modulosColocados`). Cierra #113 y #83.
- Pedido de ui: `puedeAplicar(estado, accion)` → `{ ok: true } | { ok: false, motivo, recurso? }`; una acción rechazada devuelve el mismo estado (no se puede pagar un costo que deje un medidor en 0).
- Dilema del paso 6 (extra del invernadero): lo cubre #140 de Santiago con `elegirDilema(estado, opcionId)`; se quitó de esta rama para no duplicar.

## Qué sigue
- #90 consumo por tick de los módulos (hoy costo único, plan B de diseño). No bloquea la demo.
- `MISION_JEZERO.fin.tickLimite` (10) no se aplica aún: falta que diseño diga si vencer el tiempo sin telemetría es fallo u otro cierre.
- Diseño debe confirmar el umbral del rechazo (hoy: el costo no puede dejar un medidor en 0).

## Bloqueos
- ninguno

Tokens: 🟢
