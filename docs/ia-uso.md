# Registro de uso de IA

El formulario de entrega pide describir cómo se usaron herramientas de IA (texto exacto de la política: sin confirmar, ver [reglas.md](reglas.md)). Este registro es la fuente de esa descripción. Santiago lo revisa antes de enviar.

Cada persona añade una fila cuando empieza a usar una herramienta o un modelo para algo nuevo. Solo hechos: no se anota lo que no se sabe.

## Desarrollo (herramientas del equipo)

| Persona | Herramienta | Modelo | Para qué | Desde |
|---|---|---|---|---|
| Santiago (`kcitas`) | Claude Code | Fable 5.2 | Orquestación: leer el repo, documentos de coordinación de la víspera (roles, modelos, este registro, borrador de criterios del pitch) | 13 nov |
| Santiago (`kcitas`) | Claude Code | Fable 5.1 / 5.2 y Opus 5.5 (subagentes Haiku para lecturas) | Coordinación del 13 nov: roles y documentos, misión 1 de Jezero en `design/` y `missions/` (polvo, dilema, módulos, tarjetas de ciencia, prueba de parejas), textos en/es, revisión de PRs y resolución de conflictos | 13 nov |
| Santiago (`kcitas`) | Claude Code | Fable 5.2 | Prototipo 3D de Jezero fuera del repo (Blender, a partir del DEM de Mars Trek); no integrado | 13 nov |
| _(por confirmar con su autor)_ | por confirmar | por confirmar | Investigación del 2 nov en `docs/reglas.md` y `docs/science/fuentes.md` | 2 nov |

## Dentro del juego

| Uso | Modelo | Qué hace y qué no |
|---|---|---|
| Clasificador de órdenes | por decidir (Qwen flash vs DeepSeek flash, D4) | Solo clasifica la frase del niño en JSON estricto. No ve el estado del juego, no inventa números y no redacta respuestas: los expertos son código con plantillas. El juego funciona sin él. |

## Assets generados con IA

| Pieza | Herramienta | Licencia registrada en `assets/LICENCIAS.md` |
|---|---|---|
| _(ninguna todavía)_ | | |

## Lo que la IA no hace

- No presenta nada como "según NASA": los datos reales salen de las fuentes citadas en [science/fuentes.md](science/fuentes.md).
- Ningún agente hace merge: cada cambio lo revisa y lo fusiona un humano.
