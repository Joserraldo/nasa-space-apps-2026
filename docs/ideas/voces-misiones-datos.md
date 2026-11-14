# Voces de los expertos para las 4 misiones de datos

**Rol que propone:** agentes (José) · **Base:** propuestas de Daniel en #97 (Marte polo norte), #98 (Luna polo sur), #99 (outpost sorpresa), #100 (Luna lado visible) y los datos de CRaTER en #95 · **Estado:** plan, solo documento (FASE 0) · **Fecha:** 2026-11-14
**Cuándo se implementa:** cuando un humano pase `CLAUDE.md` a FASE 1 y diseño pase cada misión a `missions/`. Antes, nada de código.

## 1. Qué ya sirve y qué falta

Las 4 misiones usan la misma plantilla que Jezero: 8 pasos, elegir 2 de 5 módulos, un dilema sin receta (Doctora contra Ingeniera, con Iris dañada), mala suerte fuera de la semilla dorada y datos "curados, no en vivo". Por eso casi todo el código de agentes se reutiliza:

| Ya existe (develop o PR abierto) | Sirve tal cual para | Falta |
|---|---|---|
| `escenaTormenta(vista, dilema)` (#92) | Los 4 dilemas del paso 6: cada experto propone la acción que defiende en `dilemaPaso6.opciones` | Que la Doctora cite la medición **del lugar correcto** (ver §2) |
| `escenaPolvo` (#92) | Escarcha en Marte polo norte (misma decisión: salir a limpiar o aguantar) | Generalizarla a "panel tapado" con la causa como parámetro (polvo, escarcha) |
| `verificarIris` (#49) | Iris que lee mal el escudo (Luna polo sur, outpost, lado visible) o la energía (polo norte) | Nada: ya elige el recurso del medidor |
| `compararOpciones` (#74) | Los 4 dilemas, sin cambios | Nada |
| `preguntaIris` (#92) | Temas actuales | 2 temas nuevos: "¿por qué en la Luna no hay polvo que vuele?" y "¿cuánto tarda un mensaje a la Tierra desde la Luna?" |
| `consejosAterrizaje` (#67) | Luna polo sur y lado visible (tienen terreno) | Polo norte: zonas por latitud. Outpost: zonas de la nave (`cabina`, `centro`, `fondo`), sin terreno |

**Nuevo de verdad:** el micrometeorito (Luna polo sur, outpost) y la antena averiada (lado visible). Son escenas de dos opciones como el polvo: reparar con costo o aguantar.

## 2. Regla de oro: cada cifra con su lugar

Las 4 propuestas de Daniel insisten en esto y es lo que un jurado científico revisa primero:

| Dato | Se dice así | Nunca así |
|---|---|---|
| CRaTER (LRO, #95) | "cerca de la Luna, **en órbita**, un instrumento midió ×{factor} más radiación" | "en tu base" o "en tu nave" |
| RAD (Curiosity) en el polo norte | "Curiosity la midió en el cráter Gale, lejos de aquí" | "aquí en el polo" |
| Kp 9 (DONKI GST) | "**en la Tierra** hubo auroras muy fuertes" | Como medida de la Luna o de Marte |
| Chang'e-4 (LND) | "una sonda **china** (CNSA) midió…" | Atribuido a NASA |
| µGy/h vs. mSv/día | La Doctora usa factores ("×206") y analogías, nunca unidades durante la tormenta | Mezclar µGy con mSv |

En código: la Doctora ya no lee solo `tormenta.medicionMarte`. Recibe una `MedicionCitada { factor, lugar: "superficie_marte" | "orbita_luna" | "nave", fuente: SourceCard }` que arma quien integra con `medicionLuna(id)` y `fuenteCrater()` de `@solar-shield/data` (#95). El `lugar` elige la clave de i18n. Sin `fuente`, no hay cifra (igual que InSight en #92).

## 3. Líneas por misión (borrador en inglés base; el español va en i18n)

### Luna polo sur (#98) · tormenta `2017-09-10-x82`
- **Paso 3, Ingeniera:** "Near the pole the Sun stays low, so the panels need tall masts."
- **Paso 5, Meteoróloga:** "A real flare from September 2017. Not a drill!"
- **Paso 6, Doctora (refugio):** "Near the Moon, in orbit, an instrument measured about ×{factor} more radiation. The Moon has no air to protect us: shelter now!"
- **Paso 6, Ingeniera (seguir al hielo):** "If we turn back, we bring no ice. Less water tomorrow."
- **Mala suerte:** "A tiny space rock hit the panel! It makes half the energy now."
- Pendiente de fuente (Daniel): hielo en sombras permanentes. Sin tarjeta, la Ingeniera solo dice "there may be ice in the dark craters", sin cifra.

### Marte polo norte (#97) · tormenta `2024-05-20-marte`
- **Paso 3, Ingeniera:** "The farther north, the less sunlight in winter. Mars tilts, just like Earth."
- **Paso 6, Doctora (escudo):** "Curiosity measured this storm far away, in Gale crater: radiation about ×19 higher."
- **Paso 6, Ingeniera (guardar batería):** "The polar night is long. Use the battery now and we freeze later."
- **Escarcha:** "Frost on the panels! Like a frozen car window."
- Pendiente: duración de la noche polar (no verificada). No se dice ninguna cifra de días.

### Luna lado visible (#100) · tormenta `2024-05-10-gannon`
- **Paso 5, Meteoróloga:** "On Earth, people saw auroras very far south. Here we only see the danger."
- **Paso 6, Doctora:** "In orbit near the Moon, the radiation jumped about ×206." (CRaTER, #95)
- **Paso 6, Ingeniera:** "A lunar night lasts about two weeks. Without battery, no heating."
- **Control de Misión:** "Earth is close: our answer arrives in a few seconds." (≈1,3 s, NSSDC)
- **Antena averiada:** "No signal to Earth. We are on our own until we fix it."

### Outpost sorpresa (#99) · tormenta `2024-05-10-gannon`
- **Paso 3 (zonas de la nave):** la Doctora prefiere el `centro` ("more walls around us"); la Ingeniera, la `cabina` ("closer to the controls").
- **Paso 6, Doctora:** "An instrument orbiting the Moon, not our ship, saw radiation jump about ×206."
- **Micrometeorito:** mismo patrón que en el polo sur.
- Pendiente: dosis de viaje a Marte (Reitz 2016) y el pico de Artemis I (causa no verificada). No se usan hasta que Daniel los apruebe.

## 4. Orden de trabajo (en FASE 1)
1. `MedicionCitada` y la Doctora por lugar (§2), con tests de que nunca sale cifra sin fuente.
2. Generalizar `escenaPolvo` a `escenaPanelTapado(causa)` y crear `escenaAveria(equipo)` (micrometeorito, antena).
3. Líneas en/es de §3, misión por misión, en el orden en que diseño las pase a `missions/`.
4. 2 preguntas nuevas de Iris.

Cada punto es un PR pequeño en `agents/`. Lo que falte de datos va con issue `bloquea:datos`.

## 5. Lo que necesito de otros roles
- **datos (Daniel):** fusionar #95, y fuentes para hielo lunar, noche polar y dosis de viaje, o confirmar que se quedan fuera.
- **diseño (Camilo, Santiago):** decidir cuáles de las 4 misiones entran después de Jezero. Con 48 horas, recomiendo **una sola**: Luna lado visible, porque tiene los datos más fuertes (×206 de CRaTER y Kp 9) y la comunicación casi inmediata contrasta bien con Marte.
