# Estado — rol 3 (Agentes expertos)
**Actualizado:** 13 nov 2026 · **Rama:** feat/agentes-expertos · **PR:** abriendo

## Hecho (últimas iteraciones)
- Paquete `@solar-shield/agents` (workspace, typecheck y vitest en CI).
- Capa 1 sin modelo (#43, fusionado): regex en/es + `aAccion`. 30/30 frases pasan.
- 3 expertos en código (`responder`) con plantillas en/es, `Dialogo` con fuente y acción propuesta. Aplica la revisión científica de datos (#40).
- `ClassifierOutput` ya está en contracts v0.2.0. D4 con IDs de b.ai (#33). Secreto `BAI_API_KEY` en el repo.

## Qué sigue (issue #41, ruta dorada)
- `Dialogo` pendiente de que ui lo confirme (abrir issue bloquea:ui si cambia).
- Escena del paso 6: dos expertos que se contradicen ante 2024-05-20-marte.
- Avería de Iris (número que no coincide): espera el OK de José para el guion.

## Bloqueos
- `ENERGIA_POR_CANTIDAD` (10/25/45) es provisional: debe vivir en design/ (motor).

Evals con modelo: sin correr (falta OK de gasto) · Tokens: 🟢
