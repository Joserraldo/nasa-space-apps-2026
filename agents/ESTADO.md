# Estado — rol 3 (Agentes expertos)
**Actualizado:** 13 nov 2026 · **Rama:** feat/agentes-que-pasa-si · **PR:** abriendo (issue #59, tarea 5)

## Hecho (últimas iteraciones)
- Fusionados: #43 regex · #44 3 expertos con fuente · #47 escena 6 · #49 avería de Iris · #52 satélite · #67 aterrizaje/director · #70 títulos · #71 Iris 1-2.
- #72 abierto (verde, limpio): `conversar()` para el panel de ui; espera merge de Santiago (#73: solo él fusiona).
- Ahora: `queSiMatematico(accion, antes, despues)`; ui simula con `aplicarAccion` sobre una copia y el Matemático solo lee la diferencia.
- Iteración 1 del loop del Matemático: `compararOpciones(antes, opciones)` compara lado a lado lo inmediato y lo pendiente (ticks). Sigue: aviso de usos restantes.
- Iteración 2: `avisoUsos` / `conAvisoUsos` / `sinUsosMatematico` (pocos, último, ninguno) en en/es. Goal del Matemático completo; loop detenido. 89 tests.

## Qué sigue (issue #41)
- Usar `fuenteTerreno()` (#69, datos) en los consejos de aterrizaje cuando entre.
- Acortar frases > 25 palabras. Evals con modelo después de P2 (D4/D10).

## Bloqueos
- `ENERGIA_POR_CANTIDAD` provisional (debe vivir en design/). Merges dependen de Santiago.

Evals: sin red en verde (30 frases) · Tokens: 🟢
