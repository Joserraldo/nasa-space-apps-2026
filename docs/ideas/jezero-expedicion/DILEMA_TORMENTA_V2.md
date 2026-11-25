# Rediseño conceptual del dilema de la tormenta (paso 6)

**Estado:** propuesta conceptual para aprobación. **No cambia ningún valor numérico** (`design/`, `missions/`, `engine/` intactos). **No busca porcentajes parecidos**: busca que cada estrategia tenga una razón de ser verificable y que el niño pueda saberlo. Decisión D9 aprobada conceptualmente por Santiago; este documento no autoriza implementar nada.
**Evidencia:** dos barridos reproducibles míos sobre `origin/feat/agentes-p04-aviso-tormenta` (motor con P0.1–P0.6), un tercero independiente de DeepSeek que coincide con el primero. Archivos: `barrido-entrega0.csv` (640 corridas: sitio × par de módulos × decisión × tick de telemetría) y `barrido-tiempos-entrega0.csv` (312 corridas: sitio × 6 pares × 13 planes con momentos y combinaciones). Scripts adjuntos como `.test.ts.txt`.

## 1. Lo que dicen los datos hoy (sin maquillaje)

**Resultado de supervivencia, con las reglas actuales:**

| Plan (decidido en la pausa de la tormenta, turno 3) | Gana | Cómo pierde |
|---|---|---|
| Refugio | **24/24** y 37/40 en el barrido grande | Solo sin generación (`invernadero+antena`), por **energía** |
| Escudo nivel 2 | 12/24 (= exactamente los pares **con** `panel_solar`) | Por **energía a 0** si no hay panel |
| Escudo nivel 1 | 19/24 | Por energía; termina con dosis ≈ 3,5 (cerca del límite de 4) |
| Aguantar / no decidir | 4/24 | Por dosis; las pocas victorias terminan con dosis 3,7–3,9 |

- **No existe ningún escenario en que el escudo gane y el refugio pierda** (0 de 160 en el barrido grande; 0 de 24 en el de tiempos).
- **El refugio domina la supervivencia.** Además deja más energía y menos dosis que el escudo cuando ambos ganan (dosis media 2,52 vs 3,04; energía final 20,9 vs 8,5).
- **Pero el escudo gana en otra métrica, que hoy es invisible:** la **salud final de la base** (media de los tres medidores al cierre, que es lo que usa el puntaje de `resumen.ts`). Donde ambos ganan (con panel), `escudo2@3` supera a `refugio@3` en **12 de 12** escenarios; la combinación `escudo + refugio` tiene la **menor dosis (1,7–1,9) y el mayor blindaje (~63)**. La diferencia en puntaje es pequeña (`PESO_RESULTADO = 50`: unos 0,8 puntos), así que **no es una razón de peso hoy**, pero es una dirección real.
- **El tiempo importa y nadie lo muestra.** Cada protección dura 2 turnos desde el turno siguiente (`DURACION_REFUGIO_TICKS = 2`, `DURACION_ESCUDO_TICKS = 2`). Refugiarse un turno antes de la tormenta funciona igual que hacerlo al llegar (`refugio@2`: 24/24); **dos turnos antes la protección caduca antes de que empiece** (`refugio@1`: 4/24, igual que no hacer nada; `escudo2@1` también). Esta mecánica **ya existe** y es estratégica, pero la interfaz no la enseña.
- **Repetir refugio no es gratis:** `refugio@3 + refugio@5` gana 17/24 (peor que una vez, 24/24). No analicé la causa; queda como pregunta para el QA.
- **Lo que decide la partida hoy es tener un panel solar**, no la radiación (pares con panel: 28–35 victorias de 64; sin panel: 2–17 de 64).

**Por qué el refugio domina (hechos del motor):**
- Su costo inmediato es pequeño (🫁−6 ⚡−3) y su beneficio es grande (dosis ×0,3 durante 2 turnos, 🛡️+12 después).
- Su costo narrativo ("mientras nos escondemos nadie trabaja") **casi no está modelado**: solo existe a) −10 de soporte vital si hay invernadero, que **nunca decide** (soporte final 47–57 en los refugios con invernadero) y b) que una `salida_exterior` posterior **cancela** el refugio (`enRefugio`). En la partida dorada nadie necesita salir.
- El escudo tiene un costo real y grande (⚡−16 a nivel 2) que solo se puede pagar con generación.
- Aguantar no cuesta nada, pero **nada lo protege**: la dosis de la tormenta supera el límite.

## 2. Identidad estratégica propuesta de cada alternativa

Cada identidad se define con **costos y beneficios reales del motor** y con **la condición en que es razonable**. La columna "hoy" es honesta sobre si esa condición se da.

### Refugio — "La gente primero"
| | |
|---|---|
| Qué compra | La mayor reducción de dosis por unidad de energía (×0,3 durante 2 turnos) |
| Costos reales | 🫁−6 ⚡−3 ahora; −10 🫁 retrasado con invernadero; **cancela el trabajo exterior** (`salida_exterior` lo termina); caduca a los 2 turnos |
| Razonable cuando | La energía escasea (sin panel); el límite de dosis es la restricción que manda; la ventana de exposición es corta y conocida; no hay tarea exterior pendiente |
| Mala idea cuando | Hay que salir (reparar la antena, limpiar paneles) o la tormenta dura más que la protección |
| **Hoy** | **Se da casi siempre** → domina. Es la respuesta correcta de la partida dorada y la más fácil |

### Escudo — "Proteger la base y seguir trabajando"
| | |
|---|---|
| Qué compra | Dosis ×0,5 durante 2 turnos (nivel 2) **y** un blindaje +20 que **permanece**: baja la dosis de todos los turnos siguientes y protege a Iris y la electrónica (`BLINDAJE_DANA_IA`) |
| Costos reales | ⚡−16 a nivel 2 (⚡−8 a nivel 1); necesita generación (`panel_solar`) |
| Razonable cuando | Hay excedente de energía; importa la salud de la **base** (blindaje, electrónica, Iris) además de la de la gente; se quiere el mayor margen (combinado con refugio) |
| Mala idea cuando | No hay generación: se pierde por energía a 0 |
| **Hoy** | **Solo se da con panel**, y aun así no es necesario para ganar. Su ventaja (salud final de la base) no se ve |

### Aguantar — "Apostar a que no hace falta"
| | |
|---|---|
| Qué compra | Ahorra recursos: ⚡−2 🫁−2 (el costo más bajo) |
| Costos reales | Ninguna protección; la dosis de la tormenta pasa de largo |
| Razonable cuando | La dosis esperada **queda por debajo del límite**: tormenta débil (factor medido bajo), blindaje alto, ventana corta |
| **Hoy** | **Nunca es razonable en Jezero**: el factor medido es 19,4 y 3 turnos expuestos pasan de 4. Las pocas victorias (4/24) son por margen mínimo (dosis 3,7–3,9). Es una **trampa que enseña a leer el dato**, no una estrategia |

**Conclusión honesta de la identidad:** con las reglas y la partida actuales **solo el refugio es una estrategia plena**; el escudo es un "complemento caro" y aguantar es un "error instructivo". Tener identidad no es lo mismo que tener relevancia estratégica: hoy falta que las condiciones que hacen razonable cada una **ocurran en la partida y se vean**.

## 3. Qué hace falta para que el dilema sea genuino (palancas, no cambios)

Tres tipos de palanca. Solo la primera se puede hacer sin tocar reglas; la segunda y la tercera requieren decisiones explícitas.

### Palanca 1 — Información (sin cambiar ningún valor) · alineada con D8 (aprobada conceptualmente)
1. **Mostrar la dosis proyectada de cada opción** (estimación a 2 turnos con `queEsSi`, verificada exacta) junto a sus costos: el niño puede **ver** que aguantar pasa del límite y que refugio es la más segura.
2. **Mostrar también energía y blindaje proyectados** (el mismo `queEsSi` los devuelve): así el escudo muestra su ventaja (blindaje +20) y su costo (energía).
3. **Mostrar la duración de cada protección** ("Protects 2 turns, starting next turn"): vuelve estratégico el **momento** de actuar.
4. **Que la Meteoróloga diga el dato, no la receta.** El factor medido (×19,4) es lo que hace irrazonable aguantar; hoy `pronostico.preparar` ya recomienda el refugio (ver SPEC_V2 §1.3).
5. **Mostrar la salud final de la base** como criterio (el puntaje ya la usa): el escudo deja de verse como "peor refugio".
- **Efecto honesto esperado:** el niño decide con información completa. **No cambiará que el refugio gane en supervivencia**; sí hará visible por qué y qué cuesta lo demás. Con este solo paso, "no hay opción gratis" y "puede saber qué espera" se cumplen; "no siempre hay una respuesta obvia" **no**.

### Palanca 2 — Condiciones del escenario (mecánicas que ya existen, pero hoy no se activan) · requiere decisión de Camilo, Jaime y Santiago
- Que la tormenta **coincida con una necesidad exterior** (limpiar paneles tapados por polvo, reparar la antena). Con eso, el costo narrativo del refugio ("nadie trabaja") **muerde**, porque `salida_exterior` lo cancela y da ⚡+15 retrasado; y "escudo y seguir trabajando" cobra sentido.
- **Limitación verificada:** el evento de polvo existe como **datos** (`eventoPolvo`, `rendimientoPanel`), pero **no hay código en `engine/`, `agents/` ni `ui/` que aplique `rendimientoPanel`** (búsqueda en el árbol de #449). Esta palanca **necesita trabajo del motor** y quedó explícitamente fuera de la semilla dorada para que el video sea estable. **No se propone implementar ahora.**

### Palanca 3 — Valores de balance · NO autorizada
- Costo real del refugio, utilidad del escudo, duración de las protecciones, límite de dosis, factor de la tormenta. **No se cambia ninguno.** Solo si Santiago lo aprueba por escrito, después de la palanca 1, y **con la rejilla completa y criterios definidos antes de medir** (sección 4).

## 4. Criterio de éxito propuesto (para fijar antes de medir; no para ajustar los resultados)

El objetivo no es "porcentajes parecidos". Propongo criterios verificables que **no se pueden cumplir manipulando un número**:

| # | Criterio | Cómo se comprueba | Hoy |
|---|---|---|---|
| C1 | **No hay estrategia estrictamente dominada** en el conjunto de escenarios razonables: para cada una existe una combinación (sitio, módulos, momento) en que es la **mejor** según una métrica declarada de antemano | Barrido completo con los CSV adjuntos; una tabla "mejor por escenario" por métrica | **No** (con supervivencia: refugio siempre; con salud final: escudo gana donde es viable → existe una métrica en que el escudo es mejor, **pero no está declarada ni se ve**) |
| C2 | **La información alcanza para decidir:** cada opción muestra costo y efecto en dosis, energía y blindaje | Inspección del panel; coincidencia con `queEsSi` | **No** (el panel no muestra dosis) |
| C3 | **La decisión depende de lo preparado antes:** el menú de opciones cambia con los módulos | Barrido por pares de módulos | **Sí** (el escudo solo es viable con panel) |
| C4 | **Cada opción "mala" tiene una razón que el niño puede aprender**, no un castigo oculto | Revisión del final: causa exacta y pista accionable | **Parcial** (causa exacta solo con #454; la pista no existe) |
| C5 | **Ninguna opción se presenta como recomendación de una experta si no es una estrategia real** | Revisión de `defiende` y de `opcionDe` | **No** (a "aguantar" la defiende nadie, pero la interfaz se la asigna a la Meteoróloga por descarte: `PantallaTormenta.tsx`, `opcionDe`) |

C5 es un problema **de interfaz** (no de balance) y se puede corregir sin tocar números.

## 5. Recomendación

1. **Hacer la Palanca 1 completa** (es D8, ya aprobada conceptualmente) y **corregir C5** (que la Meteoróloga no "defienda" aguantar).
2. **Declarar la métrica antes de medir** (propuesta: supervivencia, salud final de la base, dosis, energía), y **volver a correr la rejilla** con los scripts adjuntos **después** de la Palanca 1, en un entorno donde las pruebas las ejecute alguien que no sea quien implementó (ver `PLAN_QA_INDEPENDIENTE.md`).
3. **Decidir con esos datos** si la Palanca 2 o 3 hacen falta. **No cambiar valores todavía.**
4. **Asumir sin vergüenza la alternativa:** puede ser aceptable que Jezero (la introducción) tenga una respuesta segura bien explicada ("el refugio protege; el escudo cuesta energía") y que los dilemas más ricos sean de las otras misiones. Eso es una decisión de producto de Santiago; **no está decidida y este documento no la toma**. Lo que sí debe cambiar es el texto: el brief y los documentos no pueden seguir diciendo que Jezero tiene decisiones "sin respuesta obvia" mientras el dato dice que sí la tiene.

## 6. Limitaciones de esta evidencia
- Una sola semilla (la dorada) y dificultad media; sin eventos de mala suerte aleatorios; sin la acción "reparar a Iris" ni "esperar" intercaladas.
- Los planes de tiempo usan acciones directas (`refugiarse`, `subir_escudo`), no el efecto extra del invernadero del dilema; la comparación con invernadero se hace con el barrido grande.
- Telemetría siempre enviada tras la tormenta en el barrido de tiempos.
- "Salud final" se calculó como la media de los tres medidores (proxy del puntaje, no el puntaje completo).
- **Estas mediciones las hizo el mismo agente que diseñó la propuesta**: no son una verificación independiente.
