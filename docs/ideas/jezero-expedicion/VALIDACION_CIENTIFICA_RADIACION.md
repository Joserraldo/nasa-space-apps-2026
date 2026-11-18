# Validación científica: factor ×19,4 y "límite de entrenamiento"

**Estado:** investigación. **No se cambió ningún número.** Revisión científica pedida al responsable de datos (issue **#456**, Daniel); **sin respuesta todavía**. Etiquetas: **VERIFICADO** (reproducido por mí en el repo o con fuente), **CALCULADO**, **NO VERIFICADO**. Un revisor externo (agente de solo lectura, con búsqueda web) hizo la reconstrucción; **yo reproduje los números clave** con el código y el archivo crudo del repo (marcados abajo).

## 1. Lo que el factor ×19,4 realmente es (corrige afirmaciones anteriores)
**Corrección de una afirmación mía y de varios documentos:** el factor **no es "pico/fondo"**. Es el cociente entre **dos medias**.

| Elemento | Valor | Estado |
|---|---|---|
| Fórmula (`data/scripts/curar.ts`, `medicionMarte`) | `fondo` = media de las muestras de los 5 días previos al inicio de la tormenta (05:36 UTC del 20 may 2024); `pico` = la **mayor media diaria UTC** de los 3 días siguientes; `factor = pico/fondo`; `picoMuestra` = el máximo de una sola muestra | **VERIFICADO** (leí el código) |
| Magnitud | **Tasa de dosis absorbida**, `absorbed_dose_rate`, en µGy/h, instrumento MSL-RAD-Surface (OSDR RadLab) | **VERIFICADO** |
| `fondo` | 4,10 µGy/h (413 muestras) | **VERIFICADO** (recalculado de `data/raw/2024-05/RAD.json`) |
| `pico` (en realidad, media del 20 may desde las 05:36) | 79,68 µGy/h (120 muestras) | **VERIFICADO** (recalculado) |
| Factor | 79,68 / 4,10 = 19,45 → 19,4 | **VERIFICADO** |
| Pico real de una muestra | 304 µGy/h (≈ 74 veces el fondo), a las 06:15 UTC | **VERIFICADO** (el JSON ya lo guarda como `picoMuestra`) |
| Dosis **absorbida** extra sobre el fondo en las primeras 12 h | ≈ 1.226 µGy (≈ 1,2 mGy), integración trapezoidal | **VERIFICADO** (recalculado) |
| Duración de la tasa elevada | decae durante más de 35 h (50× el fondo hasta las 07:46; 10× hasta las 16:33; 2× hasta el 21 may 16:43) | **CALCULADO** por el revisor, **no reproducido por mí** |

El campo `pico` del JSON **no es un pico**; `pitch/formulario/datos-nasa.md` lo llama "media diaria", que también es impreciso (es la media desde el inicio de la tormenta hasta medianoche UTC).

## 2. Qué calcula el motor (`engine/src/radiacion.ts`, **VERIFICADO**)
```
dosis_turno (mSv) = fondo_del_sitio (mSv/día) / 6 × factor_tormenta × (1 − 0,6 × blindaje/100) × refugio (×0,3) × escudo (1 − 0,25 × nivel)
```
- `fondo_del_sitio` para Marte: **0,64 mSv/día**, **dosis equivalente** (Reitz et al. 2016, ICES, según `data/ciencia/radiacion.json`). Un turno = 1/6 de día = 4 h.
- `factor_tormenta` en Marte: 19,4 (tasas **absorbidas** de 2024), aplicado a **3 turnos = 12 h**.
- `blindaje`, `refugio`, `escudo`: **parámetros educativos de juego**; el propio código dice que no son valores físicos.
- **CALCULADO:** con factor 19,4 y blindaje 57 el motor cobra ≈ 1,36 mSv por turno expuesto, ≈ 4,08 mSv en 3 turnos; sin blindaje, ≈ 6,2 mSv.

## 3. Ciencia real frente a simplificación de juego
| Aspecto | Realidad (según la serie RAD y fuentes) | Juego |
|---|---|---|
| Forma temporal | Subida en ~30 min, máximo a las ~40 min, cola de decenas de horas; la mayor parte de la dosis en las primeras horas | Un **bloque plano** de 12 h |
| Magnitud | Dosis absorbida (Gy) y dosis equivalente (Sv) son cosas distintas; dependen del tipo de partícula | Una sola magnitud ("mSv") |
| Mezcla de magnitudes | — | Se multiplica una **dosis equivalente** de fondo de 2012–13 por un **cociente de tasas absorbidas** de 2024 |
| Lugar | RAD midió en el cráter Gale | Se aplica a Jezero (y al polo norte) |
| Protección | No hay "blindaje" de juego equivalente en la medición | Parámetros educativos |

**Orden de magnitud (CALCULADO por el revisor; el rango de la conversión es NO VERIFICADO):** 1,2 mGy absorbidos en las 12 h más intensas, con un factor de calidad Q entre 1 y 3, equivale a ≈ 1,2–3,7 mSv, más ≈ 0,32 mSv de fondo. El motor cobra ≈ 6,2 mSv sin blindaje (≈ 1,5–4 veces esa banda). **Es una banda, no un dato.**

**Dos observaciones del revisor que requieren confirmación de datos (NO VERIFICADAS):**
1. El fondo absorbido de 2024 (4,1 µGy/h ≈ 98 µGy/día) parece **menos de la mitad** de la dosis absorbida de superficie citada de memoria de Hassler 2014 (≈ 0,21 mGy/día). Puede ser otro detector o material de referencia; **no se pudo abrir el PDF**.
2. El factor de calidad implícito del motor (≈ 4,8) es mayor que el medio del fondo de Marte (≈ 3), también **NO VERIFICADO**.
**Conclusión honesta:** la dosis que el juego cobra por la tormenta **probablemente es mayor** que la real medida en esas 12 h; el juego la simplifica con intención educativa. **No se cambia ningún valor** hasta que Daniel confirme las magnitudes.

## 4. Fuentes
| Fuente | Qué respalda | Estado |
|---|---|---|
| Hassler et al. 2014, *Science* 343(6169), 1244797, DOI 10.1126/science.1244797 | Existencia y contexto de la medición de RAD en superficie (300 días, máximo solar) | **VERIFICADO** título/autores/revista; **cifras de dosis NO VERIFICADAS** |
| Reitz et al. 2016, ICES #437 (https://elib.dlr.de/106090/) | Origen del 0,64 mSv/día del repo | **Cita del repo; no reabierta** |
| NASA/JPL PIA26302, "Curiosity Sees Streaks and Specks During 2024 Solar Storm" (10 jun 2024) | RAD midió "the biggest radiation surge since landing in 2012" | **VERIFICADO**; no da una dosis numérica |
| NASEM 2021, "Space Radiation and Astronaut Health" | Límite de carrera de NASA de 600 mSv de dosis efectiva (riesgo de cáncer a largo plazo) | **VERIFICADO** (según el revisor, en el resumen de la Academia); **no citar sin tarjeta de datos** |
| Cifras de prensa (≈ 8.100 µGy; "30 radiografías") | — | **NO VERIFICADO y no reconciliable** con la integral de la serie (≈ 1,6 mGy). **No usar** |
| Artículo revisado por pares específico del RAD en mayo 2024 | — | **No localizado** |

## 5. El "límite de entrenamiento" (4 mSv)
- **Qué es:** una **regla de juego**, `limiteDosisMSv: 4` en `missions/src/jezero.ts` ("valor de juego, NO un umbral de salud", dice el propio código). Sirve para que perder por radiación sea posible y enseñable.
- **Qué NO es:** **no es una recomendación médica ni un umbral real de seguridad para astronautas.** No se presenta como tal en ningún texto del juego.
- **Contexto (solo para el equipo, no para mostrar al niño sin tarjeta de datos):** 4 mSv equivalen a ≈ 6 días del fondo en superficie de Marte (4 / 0,64 = 6,25 días, **CALCULADO**); los límites reales de carrera son de cientos de mSv y se basan en riesgo de cáncer a largo plazo.
- **Término único:** "límite de entrenamiento" (D12) / "training limit". No "presupuesto", no "límite seguro".
- **Redacciones de referencia (EN base), para revisión de datos:**
  - "4 is our training rule. It is not a real safety number."
  - "In this game, the crew must stay under 4 radiation points. Real astronauts are watched by doctors, who decide with many more details."
  - "Radiation points are a game score. Don't use them to decide anything about real health."
- **Evitar:** "4 mSv is safe", "the real limit is 4", equivalencias con radiografías.

## 6. Cambios de TEXTO propuestos (no implementados; enviados a datos en #456)
| Clave | Texto actual | Propuesta (EN) |
|---|---|---|
| `mision.jezero.ciencia.tormenta` | "This storm is real. In May 2024 the Curiosity rover measured the radiation rising on the surface of Mars." | "This storm is real. On May 20, 2024, the Curiosity rover measured radiation rising on Mars, far away in Gale crater. In the game we use simple numbers, not real doses." |
| `agentes.meteorologa.pronostico.medida` | "That day, radiation on Mars went up about {factor} times compared to a normal day." | "On that day, the average radiation Curiosity measured was about {factor} times higher than on a calm day." |
| `agentes.escena6.doctora.medida` | "That day, Curiosity measured radiation about {factor} times higher than normal on Mars. Everyone to the shelter, now!" | "On the storm day, Curiosity measured radiation about {factor} times higher than usual in its crater. In our game that means: everyone to the shelter, now!" |
Se evita presentar "{factor} veces" como la dosis que recibe la tripulación; "measured" se reserva para lo que midió el rover.

## 7. Qué debe revisar el responsable de datos
1. Qué magnitud exacta es `absorbed_dose_rate` en RadLab `MSL-RAD-Surface` y la discrepancia de fondos (≈ 98 µGy/día frente a lo publicado).
2. Confirmar en Hassler 2014 y Reitz 2016 dosis absorbida, equivalente y factor de calidad en superficie.
3. Si el cociente de tasas absorbidas aplicado a un fondo equivalente es defendible y con qué rango de error.
4. Renombrar o documentar `pico` (es una media); `picoMuestra` ya es el máximo.
5. Los factores de los otros eventos (2,3; ≈ 1; 0,9): un 0,9 es ruido, no una tormenta medible.
6. Una tarjeta con fuente para cualquier referencia real de dosis que se quiera mostrar.
**Decisión de producto que no es de datos:** si los números del juego se calibran con la dosis real medida (≈ 1,2–1,6 mGy absorbidos). **No se propone ni se hace.**
