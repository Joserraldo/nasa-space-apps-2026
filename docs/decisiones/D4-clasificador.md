# D4 — Modelo del clasificador
**Dueño:** Rol 3 (José) · **Fecha:** 13 nov 2026 · **Estado:** propuesta (sin evals corridas)

## Opciones
| Opción | A favor | En contra |
|---|---|---|
| Qwen flash (vía b.ai) | Barato, buen español, salida JSON | Latencia sin medir |
| DeepSeek flash (vía b.ai) | Barato, bueno siguiendo formato | Latencia y español infantil sin medir |
| Sin modelo (solo atajos/regex/botones) | Costo 0, nunca falla en la demo | Entiende menos frases libres |

## Método de comparación (14 nov, máx. 45 min, requiere OK de gasto)
1. Mismo prompt de sistema corto: lista de enums + "responde SOLO JSON".
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
