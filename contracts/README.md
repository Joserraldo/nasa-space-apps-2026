# contracts/

Único origen de los tipos compartidos. **Dueños: roles 2 (motor), 3 (agentes) y 4 (datos).**
Cualquier cambio necesita un issue `contrato` aprobado por los tres.

## Tipos previstos (se escriben en Fase 1, no antes)

| Tipo | Produce | Consumen | Idea (en papel) |
|---|---|---|---|
| `Seed` | motor | todos | Texto/número que determina sitio, tormenta, averías, objetivo y sesgos |
| `GameState` | motor | ui, agentes (recortado) | Día/turno, 3 recursos (0-100), tripulación, nivel de la IA, cola de efectos pendientes, registro de causas |
| `Action` | motor | ui, agentes | Enum cerrado de acciones con parámetros; cada una mueve ≥ 2 recursos |
| `ClassifierOutput` | agentes | motor, ui | `{ experto, accion, parametros, confianza }` en JSON estricto |
| `SpaceWeatherEvent` | datos | motor, agentes, ui | Evento real de DONKI normalizado + tarjeta de fuente (es/en) |

Reglas: nada de lógica aquí, solo tipos y esquemas de validación. Versión visible en cada cambio.
