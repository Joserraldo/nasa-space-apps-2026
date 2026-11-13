# Estado — rol 3 (Agentes expertos)
**Actualizado:** 13 nov 2026 · **Rama:** feat/agentes-atajos · **PR:** abriendo

## Hecho (últimas iteraciones)
- Paquete `@solar-shield/agents` (workspace, typecheck y vitest en CI).
- Capa 1 sin modelo: `clasificarConAtajos` (regex en/es) y `aAccion` (intención → Action del motor). 30/30 frases de eval pasan.
- `ClassifierOutput` ya está en contracts v0.2.0. D4 con IDs de b.ai (#33). Secreto `BAI_API_KEY` en el repo.

## Qué sigue (issue #41, ruta dorada)
- 3 expertos como código con plantillas `en` + `es` y la fuente del dato en cada respuesta.
- Escena del paso 6: dos expertos que se contradicen ante 2024-05-20-marte.
- Avería de Iris (número que no coincide): espera el OK de José para el guion.

## Bloqueos
- `ENERGIA_POR_CANTIDAD` (10/25/45) es provisional: debe vivir en design/ (motor).

Evals con modelo: sin correr (falta OK de gasto) · Tokens: 🟢
