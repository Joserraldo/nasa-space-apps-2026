# Decisiones de diseño

Registro breve del rol diseño (Santiago y Camilo). Una hipótesis no es una decisión: lo que no tenga dueño y aprobación queda **pendiente**.

| ID | Decisión | Justificación | Fuente | Estado | Responsable |
|---|---|---|---|---|---|
| DD-01 | "poco / medio / mucho" de energía = 10 / 25 / 45 | El contrato solo acepta 5–50 por acción; se conservan los valores que ya usaba agentes | Issue #77, PR #84, `contracts/src/action.ts` | Aprobado (Santiago, 13 nov) | Santiago |
| DD-02 | Inglés es el idioma base de los textos de diseño y misiones; español segundo | Decisión del equipo; la entrega global va en inglés | `CLAUDE.md` raíz | Aprobado | Santiago |
| DD-03 | Los textos de causas, rangos, insignias y pasos de Jezero viven en `design/i18n/` y `missions/i18n/` | Son texto de diseño; hoy la pantalla (PR #68) tiene copias propias con prefijo `ui.` | `missions/src/i18n.test.ts` | Aprobado en diseño; **pendiente** que ui los importe | Santiago → María Paula |
| DD-04 | El retraso Marte–Tierra real es de 3 a 22 min en un sentido (no 4–24) | Verificado por datos con NASA NSSDC | Issue #66, PR #65 | Aprobado (solo comentario; los ticks no cambian) | Daniel |
| DD-05 | El criterio "plano" de un sitio = 1 − inclinación / 10°, con la inclinación media en un radio de 1,5 km | Regla fijada por datos antes de ver resultados; la elevación es medida, la inclinación es derivada | `docs/science/terreno.md`, `data/terreno/jezero/jezero.json` | Aprobado (ya en uso por el motor) | Daniel |
| DD-06 | Duración de partida (D9): mantener 30 ticks de base y pedir a ui 12 s por tick a 1x | Ver cálculo abajo | `design/src/recursos.ts`, PR #68 | **Pendiente** (propuesta) | Santiago y Camilo, con Jaime y María Paula |
| DD-07 | La batería da +2 de blindaje | No tiene base física; parece puesta para cumplir "cada acción mueve dos medidores" | `design/src/recursos.ts` (`MODULOS.bateria`) | **Pendiente** (no se cambió) | Camilo |
| DD-08 | Los cuatro eventos del mazo y sus números | Hoy están quemados en el motor, no en diseño | `engine/src/acciones.ts` (`MALA_SUERTE`) | **Pendiente** | Camilo |
| DD-09 | Tres niveles de mejora por módulo | El contrato no guarda nivel de módulo: hace falta un issue `contrato` | `contracts/src/game-state.ts`, `contracts/src/action.ts` | **Pendiente** | Camilo, con Jaime |

## DD-06: cálculo de la duración (D9)

Meta decidida: ~12 min de partida = ~3 de satélite + ~9 de base.

Cómo corre hoy el reloj:
- La base se gana cuando `dia > DIAS_PARA_GANAR`. Con `TICKS_POR_DIA = 6` y `DIAS_PARA_GANAR = 5`, eso pasa en el **tick 30**.
- El borrador de pantalla (PR #68, `ui/src/App.tsx`) avanza un tick cada **4 s** a velocidad 1x.
- Resultado: 30 ticks × 4 s = **2 min** de base sin contar pausas. Faltan ~7 min.

Por qué no subir los ticks: el balance está hecho por tick. Jezero arranca con 70 de energía y gasta 3 por tick; con 135 ticks (9 min a 4 s) la base se quedaría sin energía decenas de veces y habría que rehacer todas las tablas y la semilla dorada.

Propuesta: dejar los 30 ticks y que cada tick dure **12 s** a 1x (30 × 12 s = 6 min), más las pausas automáticas (tormenta, avería, consejo, diálogo), que deberían sumar unos 3 min. Total ≈ 9 min de base. No toca el motor ni la semilla dorada.

Lo que falta para aprobarla:
- Medir cuánto duran de verdad las pausas en una partida con la pantalla (nadie lo ha medido).
- Medir la fase de satélite: su duración depende de cómo la pantalla recorre la ruta, no de estas tablas.
- Acordar con María Paula dónde vive el número (hoy está escrito a mano en `App.tsx`; debería exportarse desde diseño).
