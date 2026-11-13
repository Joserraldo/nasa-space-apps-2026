# Modelos y herramientas por tarea

Santiago decide qué modelo y herramienta usa cada persona; el orquestador prepara la recomendación y cada humano la aplica en su propia sesión. Cada cambio se avisa en Discord (`#decisiones`). Todo por CLI, con la suscripción o los créditos de cada persona; no se comparten claves ni cuentas.

## Inventario (paso 0b, por llenar)

No se supone nada: cada fila la dicta la persona.

Dicho por Santiago el 13 nov: **los seis usan Claude y tres tienen además ChatGPT.** Falta saber quiénes son esos tres, qué modelos tiene cada uno y cuánto límite le queda.

| Persona | Rol | Herramienta | Modelos disponibles | Límite aproximado |
|---|---|---|---|---|
| Santiago (`kcitas`) | infra | Claude Code | Fable 5.2 (resto por confirmar) | por confirmar |
| Jaime (`JaimeMrF`) | motor | por confirmar | por confirmar | por confirmar |
| María Paula (`Paulasaah`) | mecanicas | por confirmar | por confirmar | por confirmar |
| José (`Joserraldo`) | agentes | por confirmar | por confirmar | por confirmar |
| Daniel (`Daniverd15`) | datos | por confirmar | por confirmar | por confirmar |
| Camilo (`CamiloM21`) | ui | por confirmar | por confirmar | por confirmar |

## Escalera por demanda de la tarea

Se elige el modelo más pequeño que resuelva bien la tarea.

| Demanda | Ejemplos | Nivel |
|---|---|---|
| Baja | scaffolding, i18n, renombrar, JSON de datos, tests simples, documentación, búsquedas | Pequeño (Haiku 5.5 o equivalente rápido) |
| Estándar | componentes de UI, endpoints Hono, scripts de pipeline, tests unitarios, expertos como plantillas, bugs claros | Intermedio (Sonnet 5.5 o equivalente) |
| Alta | contratos, motor determinista y cola de efectos, balance adaptativo, modelo de órbita, depuración difícil, revisión de PRs críticos | Alto (Opus 5.5 o el mejor disponible) |
| Coordinación | desbloquear, integrar, semáforo, pitch, formulario | Fable (solo Santiago; se usa con parsimonia) |

Reglas de escalado:

1. Si un modelo falla dos veces en la misma tarea, se sube un nivel en lugar de reintentar.
2. Cuando la tarea difícil termina, se baja de nivel.
3. La exploración amplia del repo se hace con un modelo pequeño antes de que el alto lea archivos.
4. Ante la duda en contratos o motor, se sube el nivel: elegir mal es un riesgo de calendario.

## Matriz por persona (PROPUESTA, sin aprobar y sin inventario)

| Persona | Nivel base | Sube a alto para | Baja a pequeño para |
|---|---|---|---|
| Jaime (motor) | Alto | — | tablas de recursos, documentación |
| María Paula (mecanicas) | Intermedio | simulaciones masivas y balance | mazo de eventos como datos |
| José (agentes) | Intermedio | contrato `ClassifierOutput`, avería guionada de Iris | plantillas y frases de eval |
| Daniel (datos) | Intermedio | — | JSON curados, glosario, tarjetas de fuente |
| Camilo (ui) | Intermedio | degradación 3D → 2D | i18n es/en |
| Santiago (infra) | Fable solo para coordinar | — | CI y Workers van con intermedio |

## Reglas de gasto

- Cada `ESTADO.md` lleva la línea `Tokens: 🟢 / 🟡 / 🔴` (🟡 ≈ mitad del límite, 🔴 ≈ 80 %).
- Leer solo lo necesario: búsquedas y rangos de líneas, no archivos completos.
- Contexto limpio entre tareas; `ESTADO.md` es la memoria.
- Loops de 10 min solo con trabajo claro; sin tarea o con el equipo dormido, 20–30 min o se paran.
- Quien se quede sin tokens avisa en `#bloqueos` y sus tareas se reasignan.
