# Adenda 3 a la especificación v2 (`SPEC_V2_JEZERO.md`)

**Estado:** propuesta. **Implementación NO autorizada.** `SPEC_V2_JEZERO.md` se conserva; esta adenda **sustituye** su §4 (tasa y proyección) y **añade** lo medido en esta ronda. Sin cambios de código, de balance ni de reglas.

## 1. Cuatro magnitudes distintas (D15 aprobado con condiciones)

Principio de las condiciones: **no duplicar lógica del motor en la interfaz y no presentar predicciones no verificadas.** Cada magnitud tiene una fuente única y un estado de verificación medido.

| # | Magnitud | Fuente (existente) | Verificación | Qué muestra la UI |
|---|---|---|---|---|
| 1 | **Tasa de radiación** (qué subió este turno) | Diferencia entre `dosisMaximaTripulacion` de dos estados consecutivos de la UI | **Exacta** por construcción (es lo que el motor acumuló) | "+1,4 este turno" |
| 2 | **Dosis proyectada a N turnos** | `dosisMaximaTripulacion(queEsSi(estado, accion, mision))` | **287 de 288** comparaciones iguales a la dosis real (6 semillas × 4 sitios × 4 pares × 3 opciones); 1 difiere en 0,04 | "Estimate for the next N turns: ☢ 2,2" |
| 3 | **Coste energético estimado** | `costoDe(accion, mision).inmediato.energia` (ya lo pinta `CostRow`) | **144 de 144**: coincide exactamente con el cambio real de energía al confirmar | "Costs now: ⚡−16" (ya existe) |
| 4 | **Protección del escudo** | Diferencia de dosis proyectada (magnitud 2) entre "subir escudo" y "aguantar"; blindaje retrasado de `costoDe(...).retrasado`; estado activo con `factorEscudo` y `enRefugio` (funciones puras exportadas) | Ver 3 | "Shield: −1,5 over the next 2 turns, +20 shielding later" |

### 1.1 Resultados medidos (partida dorada, turno 3, panel + escudo, `cerca-de-perseverance`)
| Opción | Dosis proyectada (2 turnos) | Frente a aguantar | Coste inmediato | Blindaje retrasado |
|---|---|---|---|---|
| Refugio y apagar invernadero | **2,20** | −2,04 mSv | ⚡−3 🫁−6 | +12 |
| Subir escudo nivel 2 | **2,70** | −1,54 mSv | ⚡−16 | +20 |
| Subir escudo nivel 1 (acción de Crew) | 3,45 | −0,79 mSv | ⚡−8 | +10 |
| Aguantar | **4,24** | — | ⚡−2 🫁−2 | +2 |

(La dosis proyectada del refugio y del escudo coincide exactamente con el resultado real tras 2 turnos: 2,20 y 2,70.)

### 1.2 Reglas derivadas de la medición (para no presentar predicciones no verificadas)
1. **El horizonte NO es siempre 2.** `queEsSi` avanza `RETRASO_POR_DIFICULTAD[dificultad].max` turnos: fácil 1, **media 2** (Jezero), difícil 3, hardcore 3. El rótulo debe decir "next {n} turns" con `n` leído de ese dato, no un 2 fijo.
2. **Mostrar solo dosis y costos; no mostrar energía, soporte y blindaje proyectados.** Medido: la proyección de `queEsSi` **no coincide** con el resultado real en el soporte vital (48 de 288, siempre −10: es el costo del invernadero apagado, `extra` del dilema, que `queEsSi` no aplica) ni, en 2 semillas con eventos de mala suerte, en energía (9) y blindaje (4): el `extra` consume sorteos del generador aleatorio y desplaza qué evento de mala suerte ocurre. **Mostrarlos sería presentar predicciones no verificadas, y además podría revelar de antemano un evento aleatorio.** La dosis no se ve afectada por eso (no la tocan los eventos de mala suerte; una diferencia aislada de 0,04 viene del blindaje).
3. **Para las opciones del dilema que tienen `extra` (refugio con invernadero) la dosis también es la de `queEsSi`**: coincide en 287/288, y se rotula siempre como **estimación**. Si se quisiera exactitud total hay una vía **sin duplicar lógica**: que el motor exporte una función hermana de `queEsSi` que aplique la opción del dilema completa (con su `extra`); componer `elegirDilema` + `avanzarTick` en la UI daría 144/144 iguales, pero **repite el bucle de `queEsSi`** y por eso no se propone. Es un cambio al motor (Jaime) y requiere aprobación; **no se hace ahora**.
4. **Protección activa:** usar `enRefugio(estado)` y `factorEscudo(estado)` (exportadas) para decir "Protected now: yes/no". **No** calcular "turnos que quedan" en la UI: el motor no lo expone y calcularlo copiaría su regla (`DURACION_*`, causas). Se puede decir de forma estática "Protects 2 turns, starting next turn" leyendo `DURACION_REFUGIO_TICKS` y `DURACION_ESCUDO_TICKS` de `design/` (constantes).
5. **No usar `dosisDelTurno` como "tasa"**: medido, difiere de lo realmente acumulado hasta 0,04 por turno (ej. segundo turno tras refugio: previsto 0,45, real 0,41), porque la función se evalúa sobre el estado antes de que entren los efectos pendientes. La tasa que se muestra es la **observada** (magnitud 1).

### 1.3 Rotulado y presentación
- Toda cifra proyectada lleva "Estimate for the next {n} turns" (EN base). Nunca sin rótulo.
- La tasa observada y la dosis actual **no** son estimaciones y no llevan el rótulo.
- El **límite de entrenamiento** (D12) se muestra junto a la dosis; no se llama "presupuesto", no se presenta como umbral de salud (ver `VALIDACION_CIENTIFICA_RADIACION.md`).
- Un decimal como máximo; valor siempre en texto además del color.

## 2. Revelación de Iris — actualización con el estudio de obediencia (`ESTUDIO_OBEDIENCIA_IRIS.md`)
- Las tres filtraciones (SPEC_V2 §3) se mantienen, con **sus condiciones de aparición**: L1 aparece cuando el niño abre **Crew** (visible tras la primera conversación); L2 aparece en cuanto el niño **llega al taller** (consulta y acción `reparar` desde el turno 0); L3 aparece cuando el niño **habla con Iris en la pantalla de tormenta**, aunque sea un saludo.
- Nuevo hallazgo: la propuesta `accion_peligrosa` de Iris **nunca es ejecutable** al llegar la tormenta (0/64: el motor la rechaza por energía). Obedecer a Iris no ejecuta nada; el daño por creerla es por omisión. D16 queda como **investigación completada, decisión pendiente**.

## 3. Aviso de la Meteoróloga (D14)
Solicitud enviada a José: issue **#455** (frase neutral para `agentes.meteorologa.pronostico.preparar`, sin recomendar refugio, escudo ni esperar; no se implementó ni se redactó el texto). **Estado: pendiente de respuesta.** La Fase 3 de la v2 depende de ella.

## 4. Textos científicos (propuestos por la revisión científica, sin implementar)
Tres cambios de **texto** (no de números) quedaron propuestos y enviados a Daniel para revisión (issue **#456**): `mision.jezero.ciencia.tormenta`, `agentes.meteorologa.pronostico.medida` y `agentes.escena6.doctora.medida`. Detalle y justificación en `VALIDACION_CIENTIFICA_RADIACION.md`. El nombre "límite de entrenamiento" y la frase "4 is our training rule. It is not a real safety number." son la redacción de referencia.

## 5. Integración y orden de fases (aprobados por Santiago)
`#454` → `#449` (con `#450`, **merge commit**) → `#410` por su propietario (propuesta en `PROPUESTA_RESOLUCION_410.md`) → fases de UI de la v2. Ninguna fase de UI empieza antes de que la pila esté integrada y auditada.
