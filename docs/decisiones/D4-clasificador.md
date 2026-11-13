# D4 — Modelo del clasificador
**Dueño:** Rol 3 (José) · **Fecha:** 13 nov 2026 · **Estado:** propuesta (sin evals corridas)

## Opciones
| Opción | A favor | En contra |
|---|---|---|
| `qwen3.8-flash` (b.ai) | Barato, buen español, salida JSON | Latencia sin medir |
| `deepseek-v4.1-flash` (b.ai) | Barato, bueno siguiendo formato | Latencia y español infantil sin medir |
| Sin modelo (solo atajos/regex/botones) | Costo 0, nunca falla en la demo | Entiende menos frases libres |

## Proveedor y modo de uso
- b.ai, API compatible con OpenAI (`https://api.b.ai/v1`). IDs confirmados con `GET /v1/models` el 13 nov: `qwen3.8-flash` y `deepseek-v4.1-flash`.
- **Decodificación restringida:** el modelo se usa solo como clasificador, con `response_format` de JSON schema (generado desde `ClassifierOutputSchema` de `contracts/`) y `max_tokens` bajo (~80), para que no pueda "hablar de más" y su salida siempre tenga el formato. Si b.ai no respeta el schema, el Zod de todos modos rechaza y se usa `CLASSIFIER_FALLBACK`. Que b.ai soporte `json_schema` en estos modelos: NO VERIFICADO.

## Método de comparación (14 nov, máx. 45 min, requiere OK de gasto)
1. Mismo prompt de sistema corto: lista de enums + "responde SOLO JSON", con el schema como restricción.
2. Las 30 frases de `docs/ideas/agentes.md` §5 (luego `agents/evals/frases.json`), 1 pasada por modelo = 60 llamadas.
3. Llamadas desde el serverless de infra (o script local con la clave en variable de entorno, nunca en el repo).
4. Medir: JSON válido (Zod), experto ok, accion ok, parámetros exactos, fuera_de_tema en 18-19, latencia p50/p95, tokens.
5. Criterio: gana el que tenga más `accion` correcta con p95 < 1,5 s. Empate o diferencia < 5 puntos → el más barato.
6. Si ninguno pasa 80 % de `accion` correcta → se sigue **sin clasificador** y se decide tras P2.

## Resultados
_Sin correr todavía. No se rellena con estimaciones._

## Elegida
_Pendiente._

## Consecuencias para cada rol
- Infra: endpoint `POST /api/clasificar` con la clave en Cloudflare, timeout 1,5 s y límite por IP.
- Motor y UI: ninguna; el juego funciona igual sin modelo.
