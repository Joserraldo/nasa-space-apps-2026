# Estado — rol 3 (Agentes expertos)
**Actualizado:** 13 nov 2026 · **Rama:** feat/agentes-iris · **PR:** #47 (escena 6), Iris abriendo

## Hecho (últimas iteraciones)
- #43 capa sin modelo (regex en/es, 30/30) · #44 tres expertos con plantillas en/es y fuente · #46 data/ en CI.
- Escena del paso 6 (#47): Doctora (refugio, factor medido por Curiosity) vs Ingeniera (escudo, energía del estado).
- Iris nivel 3: 4 formas de falla por semilla (la 1.ª siempre número falso) + verificación y reparación con la Ingeniera.

## Qué sigue (issue #41)
- Integrar con ui: cola de diálogos y quién llama a `escenaTormenta` / `irisDanada` (abrir issue bloquea:ui).
- Consejos en fase satélite y aterrizaje; tics en todas las respuestas; Matemático "¿Y si…?" con el simulador del motor.
- Evals con b.ai (subagente corriendo) → resultado en D4.

## Bloqueos
- `ENERGIA_POR_CANTIDAD` (10/25/45) provisional: debe vivir en design/.

Tokens: 🟢
