# Modelos y herramientas por tarea

Santiago decide qué modelo y herramienta usa cada persona; el orquestador prepara la recomendación y cada humano la aplica en su propia sesión. Cada cambio se avisa en Discord (`#decisiones`). Todo por CLI, con la suscripción o los créditos de cada persona; no se comparten claves ni cuentas.

## Inventario (paso 0b, por llenar)

No se supone nada: cada fila la dicta la persona.

Dicho por Santiago el 13 nov: **todos tienen OpenCode; Daniel tiene además Codex; la sesión principal de cada persona va con Opus**, y es Opus quien lanza los subagentes (ver [COMO-TRABAJAMOS.md](COMO-TRABAJAMOS.md) §4). Antes había dicho que los seis usan Claude y tres tienen además ChatGPT. Falta saber qué otros modelos tiene cada uno y cuánto límite le queda.

| Persona | Rol | Herramienta | Modelo principal | Límite aproximado |
|---|---|---|---|---|
| Santiago (`kcitas`) | orquestador, motor | Claude Code, OpenCode | Fable 5.2 para coordinar | por confirmar |
| Camilo (`CamiloM21`) | motor | OpenCode | Opus | por confirmar |
| María Paula (`Paulasaah`) | ui | OpenCode | Opus | por confirmar |
| José (`Joserraldo`) | agentes, infra | OpenCode | Opus | por confirmar |
| Daniel (`Daniverd15`) | datos | OpenCode, Codex | Opus | por confirmar |
| Jaime (`JaimeMrF`) | datos | OpenCode | Opus | por confirmar |

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

## Qué hace Opus y qué delega (por rol)

La sesión principal es Opus en todos los roles. Lo que cambia es qué se queda en Opus y qué manda a subagentes con un modelo más pequeño.

| Rol | Se queda en Opus | Delega a subagentes |
|---|---|---|
| `ui` (María Paula) | flujo de pantallas de la ruta dorada, conexión con el motor, accesibilidad | componentes repetitivos, textos `en`/`es`, estilos |
| `motor` (Santiago, Camilo) | contratos, cola de efectos, balance, misiones, depuración | tablas de datos, tests, simulaciones por semilla |
| `agentes` (José) | contrato `ClassifierOutput`, lógica de expertos, avería guionada de Iris | plantillas de frases, frases de eval, regex |
| `infra` (José) | integración, despliegue, guion del pitch | flujos de CI, pruebas e2e, documentación |
| `datos` (Daniel, Jaime) | qué dato respalda qué mecánica, verificación de cifras | JSON curados, glosario, tarjetas de fuente |

## Reglas de gasto

- Cada `ESTADO.md` lleva la línea `Tokens: 🟢 / 🟡 / 🔴` (🟡 ≈ mitad del límite, 🔴 ≈ 80 %).
- Leer solo lo necesario: búsquedas y rangos de líneas, no archivos completos.
- Contexto limpio entre tareas; `ESTADO.md` es la memoria.
- Loops de 10 min solo con trabajo claro; sin tarea o con el equipo dormido, 20–30 min o se paran.
- Quien se quede sin tokens avisa en `#bloqueos` y sus tareas se reasignan.
