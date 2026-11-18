# Dilema de la tormenta — escenarios para la Palanca 2 (D18, investigación)

**Estado:** investigación. **No se cambió ningún número, ni el motor, ni las misiones.** Los escenarios usan **eventos reales ya curados** en `data/curated/` y **acciones que ya existen** en el motor. Complementa `DILEMA_TORMENTA_V2.md` (que se conserva). Medición del autor (AUT), reproducible: `escenarios-palanca2-entrega0.test.ts.txt` → `escenarios-palanca2-entrega0.csv` (640 corridas).

## 1. Métrica de éxito (aprobada por Santiago)
1. **No** se exigen porcentajes de victoria iguales.
2. Se busca que **ninguna estrategia esté dominada** donde la decisión es relevante.
3. **Cada alternativa tiene una justificación comprensible** (qué compra, qué cuesta, cuándo conviene).
4. La **información previa** permite anticipar consecuencias.
5. **No hay derrotas inexplicables.**
Ninguno de estos criterios se ajusta tocando valores: se evalúan sobre lo que el juego ya hace.

## 2. Diseño de escenarios (todos con valores y reglas actuales)
Ejes: **fuerza de la tormenta** (los 8 eventos curados; 5 miden ×0,9 a ×2,3 en Marte y 3 se tratan como fuertes), **sitio** (llanura central, pie de la pared sur), **pares de módulos** (4), **necesidad exterior en el turno 4** (`salida_exterior`, acción existente; con o sin) y **plan** (aguantar, refugio, escudo 1, escudo 2, escudo 2 + refugio).

| ID | Escenario | Qué prueba |
|---|---|---|
| S1 | Tormenta **fuerte** (factor 19,4 y las dos sin medición) | La situación actual de Jezero |
| S2 | Tormenta **débil** (factor 0,9 a 2,3: 5 eventos reales) | ¿Cuándo es razonable aguantar? |
| S3 | **Sin generación** (pares sin `panel_solar`) | ¿Cuándo es inviable el escudo? |
| S4 | **Con generación** (pares con `panel_solar`) | ¿Cuándo el escudo es viable? |
| S5 | Necesidad exterior (salida en el turno 4) con tormenta fuerte y con panel | ¿El refugio deja de dominar si hay que salir? |
| S6 | Necesidad exterior sin panel | idem sin generación |
| S7 | Combinación escudo + refugio | ¿Aporta algo único? |
| S8 | Momento de actuar (medido en `barrido-tiempos-entrega0.csv`) | ¿Importa cuándo se protege? |

## 3. Resultados

### 3.1 Victorias por escenario (celdas = sitio × par)
| Escenario | Aguantar | Refugio | Escudo 1 | Escudo 2 | Escudo 2 + refugio |
|---|---|---|---|---|---|
| **S1 fuerte, sin salida** | 2/8 | **8/8** | 4/8 | 4/8 | 4/8 |
| **S2 débil** (5 eventos × 8 celdas) | **8/8** cada uno | 8/8 | 8/8 | 8/8 | 6–7/8 |
| S3 sin panel, fuerte, sin salida | 3/12 | **12/12** | 3/12 | 0/12 | 0/12 |
| S4 con panel, fuerte, sin salida | 3/12 | 12/12 | 9/12 | **12/12** | **12/12** |
| **S5 con panel, fuerte, con salida** | 0/12 | **9/12** | 6/12 | **12/12** | **12/12** |
| S6 sin panel, fuerte, con salida | 3/12 | **12/12** | 9/12 | 3/12 | 0/12 |

### 3.2 Lecturas, con la métrica de éxito
- **S2 (tormenta débil real): aguantar es razonable y deja la mayor energía.** En las 5 tormentas débiles ganan todos los planes; en las celdas ganadas, aguantar termina con **energía media 29,9** frente a 28,9 (refugio), 23,9 (escudo 1), 15,9 (escudo 2) y 15,0 (combo); el refugio deja la menor dosis entre los simples (0,33 vs 0,45); el escudo 2 deja más blindaje (81,8 vs 74,2 del refugio) y más soporte vital (69,2 vs 60,8). **Aquí las tres alternativas tienen ventajas y costos distintos y ninguna está dominada**: la elección es de costo, no de supervivencia. Es la única situación donde "aguantar" tiene justificación comprensible ("la tormenta es débil, no gastes en proteger"), y esa justificación **sale del dato que da la Meteoróloga (el factor)**.
- **S1 (la tormenta actual de Jezero, ×19,4): el refugio domina.** Es la única alternativa que gana siempre; aguantar es una trampa; el escudo solo gana si hay panel.
- **S4: con panel, el escudo nivel 2 y el combo ganan siempre**, igual que el refugio. Dos estrategias viables con costos distintos: esto es una decisión genuina **si** se muestra el costo.
- **S5 es el hallazgo central de la Palanca 2:** cuando hay una **necesidad exterior** durante la tormenta, el refugio **pierde su ventaja** (de 12/12 a **9/12**), porque `salida_exterior` **cancela** el refugio (`enRefugio`), y **el escudo nivel 2 y el combo ganan 12/12** con la menor dosis del combo (2,43). En las celdas con salida y panel hay **una sola situación en que el escudo gana y el refugio pierde**: sitio `llanura-central` con `panel_solar + reciclador_agua` (el refugio termina con dosis 4,01, en el límite). Aparece **3 veces en el CSV** porque se repite en las tres tormentas fuertes, que se comportan igual; **es una situación, no tres**. Es una evidencia estrecha y se debe leer así. **Con panel y una necesidad exterior, el escudo deja de ser un "refugio peor" y pasa a ser al menos tan bueno como el refugio y mejor en esa celda.** **Cautela de muestra:** las filas S3–S6 cuentan 12 celdas = 4 celdas distintas (2 sitios × los pares con o sin panel) repetidas en las 3 tormentas fuertes, que se comportan igual. La evidencia independiente de S5 son **4 celdas** (el refugio falla en 1, el escudo 2 gana las 4). Es suficiente para mostrar que la palanca existe, no para estimar con qué frecuencia ocurriría.
- **S6: sin panel, el refugio sigue dominando** aunque haya que salir; el escudo no es viable (sin energía). Es coherente: **la preparación del paso 4 decide qué estrategias existen**.
- **S7:** el combo da la **menor dosis** (1,7–2,4 según el caso) pero cuesta la mayor energía; es no-dominado en recursos y solo viable con panel.
- **S8 (medido antes):** actuar **demasiado pronto** desperdicia la protección (caduca a los 2 turnos): `refugio@1` 4/24 frente a `refugio@2` y `refugio@3` 24/24. Es una mecánica real que **nadie le enseña al niño**.

### 3.3 Análisis de dominancia sobre los 4 medidores
Entre los planes **ganadores**, ninguno está dominado en el sentido de Pareto (dosis, energía, soporte, blindaje) en ninguno de los escenarios: cada uno gana en algún medidor. **Esto es una condición débil y no la uso para afirmar equilibrio**: en S1 el refugio gana **siempre en el resultado** y los demás pierden con frecuencia, que es lo que importa al niño.

## 4. ¿Se puede lograr sin modificar el motor sustancialmente?
| Hallazgo | ¿Se puede en el juego con lo que hay? |
|---|---|
| Aguantar razonable con tormenta débil (S2) | El motor ya soporta eventos con factor bajo (`medicionMarte.factor`) y `crearPartida` admite un catálogo de tormentas; **pero** `partidaDeMision` fija `mision.tormentaId`, así que variar la tormenta por partida exige un **cambio pequeño en `engine/src/dorada.ts` y datos de misión**. Además cambia la demo dorada |
| Refugio pierde su ventaja si hay que salir (S5) | La acción `salida_exterior` y la regla `enRefugio` ya existen. **Falta que haya un motivo para salir**: el efecto del polvo (`eventoPolvo.rendimientoPanel`) **no está implementado en el motor** (no hay código que lo aplique; verificado por búsqueda). Un evento que obligue a salir durante la tormenta exige trabajo del motor |
| Mostrar el costo de cada opción antes de decidir | **Sí**, solo interfaz (SPEC_V2 §4 y Adenda 3 §1) |
| Enseñar el momento de protegerse | **Sí**, solo interfaz y texto (`DURACION_*` ya existen) |

**Conclusión:** la diferenciación estratégica real (S2 y S5) **existe en el motor, pero no se activa en Jezero** y activarla exige cambios **de datos y de motor**, que la métrica de éxito no autoriza hoy. **Lo que sí está al alcance sin tocar reglas** es la información (costo de cada opción, duración de las protecciones, momento de actuar, y lo que dice el factor de la Meteoróloga).

## 5. Alternativa: mantener una estrategia segura bien explicada
Si no se aprueba trabajo de motor, la alternativa honesta es que **Jezero, como introducción, tenga una respuesta segura** y que se explique como tal:
- *"El refugio es la respuesta segura cuando la tormenta es fuerte; el escudo es una mejora si tienes energía; aguantar solo es sensato cuando el dato dice que la tormenta es débil."*
- La preparación del paso 4 sigue decidiendo qué opciones tienes (verificado: sin panel el escudo no existe).
- Hay que **corregir el texto del brief y de los documentos**: dejar de afirmar "decisiones sin respuesta obvia" para Jezero.
- Los dilemas más ricos (S2, S5) quedan para **otras misiones** (la Luna sur ya usa una tormenta distinta) o para una fase posterior con aprobación.

## 6. Qué decidir y qué no
**Pendiente de Santiago:** (a) aceptar la alternativa segura bien explicada para Jezero, o (b) autorizar investigar **cambios de motor/datos** mínimos para S2 o S5 (con alcance y dueño: Jaime y Camilo). **No se cambia ningún valor** en ningún caso.

## 7. Limitaciones
Muestra efectiva pequeña en S3–S6 (4 celdas distintas, ver S5); 2 sitios y 4 pares de módulos solamente. Una sola semilla de partida; el "evento fuerte" 2024-10-03 y 2024-10-10 no tienen medición en Marte y el motor les aplica la fórmula de respaldo (se comportan como el de 2024-05-20); la salida exterior se impone por guion en el turno 4 y **no** representa un evento del juego; el soporte vital y el blindaje finales dependen de eventos aleatorios que no se probaron con otras semillas; las medias son sobre celdas ganadas. **Estas mediciones las hizo el mismo agente que diseñó la propuesta: no son una verificación independiente.**
