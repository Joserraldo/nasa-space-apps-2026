# Estado — rol 3 (Agentes expertos)
**Actualizado:** 13 nov 2026 · **Rama:** feat/agentes-director · **PR:** #52, #63, director abriendo

## Hecho (últimas iteraciones)
- Fusionados: #43 regex en/es · #44 3 expertos en/es con fuente · #47 escena 6 · #49 avería de Iris · #50 README · #46 data/ en CI.
- Evals reales en b.ai (#51): qwen3.8-flash 80 % accion pero p95 15 s; deepseek 23 % (razonamiento sin tokens). D4: sin clasificador; reabrir tras P2.
- Fase satélite (#52) y aterrizaje: cada voz defiende su criterio (luz, blindaje, plano).

## Qué sigue (issue #41)
- Director (`dialogosDelPaso`, `encolar`): ui solo pinta la cola. Falta que ui lo conecte (María Paula).
- Matemático "¿Y si…?" con el simulador del motor; acortar frases > 25 palabras.

## Bloqueos
- `ENERGIA_POR_CANTIDAD` provisional (debe vivir en design/). ui/ aún vacío.

Evals: corridas (13 nov) · Tokens: 🟢
