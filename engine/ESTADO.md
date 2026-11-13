# Estado — rol 2 (Motor y simulación)
**Actualizado:** 2026-11-13 13:30 · **Rama:** feat/motor-escenario · **PR:** #18 (contratos, draft) + PR escenario

## Hecho (últimas iteraciones)
- Contratos v0.1.0 en Zod + RNG determinista (PR #18, issue contrato #17).
- `design/`: tablas borrador de recursos por sitio, consumo por tick, costo de cada acción, retrasos y mala suerte por dificultad.
- `engine/`: `crearPartida(seed)` sortea sitio, objetivo, avería, sesgos y órbita; `aplicarAccion` puro con cola de efectos 1–3 ticks; `avanzarTick` con consumo, tormenta, mala suerte y pausa; `queEsSi` para el Matemático.
- Registro de causas distingue decisión / mala_suerte / sistema. 27 tests en verde; semilla dorada corre de punta a punta.

## Qué sigue
- Aprobación de #17; ajustar contratos según agentes y datos.
- Puntaje de sitio con 3 criterios; modelo de órbita que mueva franja/señal/batería por tick.
- Niveles adaptativos de la IA de la base por reglas (P3).

## Bloqueos
- Números finales de design/ los debe revisar el rol diseño (hoy son borrador del motor). D9 duración de partida pendiente.

Tokens: 🟢
