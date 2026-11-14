# D4 — Modelo del clasificador
**Dueño:** Rol 3 (José) · **Fecha:** 13 nov 2026 · **Estado:** evals corridas; sin clasificador por ahora

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
Corrida real del 13 nov 2026, 1 pasada por modelo (60 llamadas), `agents/evals/correr.ts` con `agents/evals/frases.json` (30 frases), `response_format` json_schema, `max_tokens` 80, `temperature` 0, timeout del script 15 s (para medir latencia sin recortar). Datos crudos sin claves: `agents/evals/resultados-2026-11-13.json`.

| Modelo | JSON válido | experto | accion | parametros | 18-19 fuera_de_tema | p50 ms | p95 ms | tokens prom |
|---|---|---|---|---|---|---|---|---|
| qwen3.8-flash | 86,7 % | 83,3 % | 80,0 % | 90,0 % | 2/2 | 6026 | 15012 | 596 |
| deepseek-v4.1-flash | 23,3 % | 23,3 % | 23,3 % | 66,7 % | 2/2 | 2865 | 3159 | 624 |

Observaciones:
- b.ai aceptó `json_schema` en ambos (ninguna llamada necesitó el reintento con `json_object`).
- **Los dos son modelos con razonamiento** (`reasoning_content`). En deepseek, con `max_tokens: 80` el razonamiento consume todo el presupuesto y `content` llega vacío (`finish_reason: length`, 80 de 80 tokens de razonamiento, comprobado con una llamada de diagnóstico): por eso solo 23,3 % de JSON válido. El 23,3 % de `accion` correcta en deepseek es casi todo el respaldo `fuera_de_tema` acertando por casualidad; no mide su capacidad real.
- qwen: 4 de 30 llamadas superaron los 15 s (timeout del script) y dos frases se clasificaron mal (28 y 29, `pronostico`/`explicar_evento` en vez de lo esperado).
- Ninguno cumple p95 < 1,5 s: qwen p50 ≈ 6 s, deepseek p50 ≈ 2,9 s (aun fallando).

## Elegida
**Sin clasificador por ahora.** Aplicando el criterio: qwen3.8-flash llega justo a 80,0 % de `accion` pero con p95 de 15 s (el criterio exige < 1,5 s, y el timeout en producción es 1,5 s, así que 4 de cada 30 frases caerían al respaldo igual); deepseek-v4.1-flash está en 23,3 %. El juego sigue con atajos/regex/botones (capa 1), que ya resuelven 28 de las 30 frases y dejan al modelo solo las abiertas.
Pendiente para reabrir tras P2 (no se gastó más): probar de nuevo con razonamiento desactivado o con un modelo sin razonamiento (los IDs `*-flash` de b.ai razonan por defecto) y un `max_tokens` que deje salida. Si la latencia baja de 1,5 s, qwen3.8-flash es el candidato.

## Consecuencias para cada rol
- Infra: endpoint `POST /api/clasificar` con la clave en Cloudflare, timeout 1,5 s y límite por IP.
- Motor y UI: ninguna; el juego funciona igual sin modelo.
