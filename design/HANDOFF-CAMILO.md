# Traspaso a Camilo: mazo de eventos y mejoras de módulos

## ACTUALIZACIÓN 13 nov, 23:15 — empieza por aquí

Después de escribir este traspaso, Santiago avanzó la misión 1 (propuesta de José, PR #88) en el **PR #89**, apilado sobre tu #86. Lo que ya está hecho ahí y **no tienes que rehacer**:
- `eventoPolvo` (paso 4b: panel al 50 % hasta limpiarlo con salida al exterior; no sale en la semilla dorada) y `dilemaPaso6` (refugio + apagar invernadero / subir escudo nivel 2 / aguantar) en `missions/src/jezero.ts`, con textos en/es en tu `missions/src/textos.ts`.
- `MODULOS` con consumo de ⚡ como costo único: reciclador −1, invernadero −3, escudo −3, antena −1 (orden por kW de ARES). El consumo por tick está pedido a Jaime en #90.
- 7 tarjetas de ciencia y la pregunta final del paso 8. Las que no tienen fuente no se muestran; fuentes pedidas a Daniel en #93.
- `missions/test/parejas.test.ts`: las 10 parejas de módulos con la semilla dorada. **Hallazgo:** si el niño no actúa en la tormenta, el blindaje llega a 0 en 7 de 10 parejas (fin en el tick 5–6).
- Estado detallado y números de ARES: `design/ESTADO.md` en la rama `feat/diseno-mision1`.

**Orden de fusión:** tu #86 → #89. Este #85 va aparte. Hay textos duplicados entre #86 (tu `textos.ts`) y #85 (`missions/i18n/`): se queda tu versión y Santiago quita la suya del #85.

**Lo que sigue siendo tuyo:** los cuatro eventos del mazo como tabla de diseño (hoy están quemados en `engine/src/acciones.ts`), los tres niveles de los módulos (necesitan issue `contrato`) y las decisiones de la sección 4. Nuevas decisiones abiertas: criterio "hielo" (no hay dato en Jezero) y si se baja el daño de la tormenta.

---

Para empezar lee solo esto, [DECISIONES.md](DECISIONES.md), tu issue (#56) y los archivos que se nombran abajo. No hace falta auditar el repo otra vez. Si algo de aquí contradice el código o los contratos, **mandan el código y los contratos**: anótalo y pregunta antes de asumir.

## Estado de partida

- **Commit base:** `2ef136b` de `develop` (13 nov, 17:50).
- **Rama de la Fase A:** `feat/diseno-fase-a`. Hasta que se fusione, parte de ella.
- **Qué quedó hecho en la Fase A:**
  - Textos en inglés (base) y español: `design/i18n/{en,es}.json` (58 claves: causas, mala suerte, Iris, rangos, insignias, rangos de sitio; título y descripción) y `missions/i18n/{en,es}.json` (17 claves: nombre y los 8 pasos de Jezero).
  - Prueba `missions/src/i18n.test.ts`: busca en `design/src`, `missions/src` y `engine/src` toda clave `causa.*`, `mala_suerte.*`, `ia.*`, `rango.*`, `insignia.*`, `sitio.rango.*` y `mision.*`, y falla si a alguna le falta texto en un idioma.
  - Comentario del retraso de comunicaciones corregido a 3–22 min (issue #66) en `design/src/recursos.ts`.
  - Comentario del criterio "plano" aclarado en `design/src/sitio.ts`.
- **Pruebas ejecutadas:** `npm run typecheck` sin errores; `npx vitest run missions engine/src/dorada`: 10 de 10 (3 de textos, 7 de la semilla dorada).
- **Otros PRs de diseño abiertos:** #84 (`ENERGIA_POR_CANTIDAD`). Toca el final de `design/src/recursos.ts`: si editas ese archivo antes de que se fusione, habrá conflicto.

## 1. Mazo de eventos

### Lo que existe hoy

Los eventos de mala suerte están quemados en el motor, en `engine/src/acciones.ts` (`MALA_SUERTE`), no en diseño:

| Clave | Efecto inmediato | Módulo afectado |
|---|---|---|
| `mala_suerte.micrometeorito` | blindaje −10 | ninguno |
| `mala_suerte.fallo_panel` | energía −12 | ninguno |
| `mala_suerte.fuga_agua` | soporte vital −8 | ninguno |
| `mala_suerte.tormenta_polvo` | energía −8, blindaje −3 | ninguno |

- **Cuándo salen:** en cada tick se tira un número con la semilla; si es menor que `MALA_SUERTE_POR_DIFICULTAD` (fácil 0,05 · media 0,10 · difícil 0,18 · hardcore 0,25) sale uno al azar. Es determinista: misma semilla, mismos eventos.
- **Tormenta solar:** no pasa por ese sorteo. En cada tick con tormenta activa el motor calcula una señal (`senalDeDano`, en `engine/src/orbita.ts`) y aplica blindaje −round(señal × 10) y la mitad en energía, con la causa `causa.tormenta`. En Jezero la tormenta es `2024-05-20-marte` y se activa en el tick 3 (`missions/src/jezero.ts`).
- **Ningún evento avería un módulo.** `GameState.equipos` guarda `ok / averiado / destruido`, pero solo lo cambia la avería inicial (`engine/src/escenario.ts`).
- **Ningún evento tiene efecto retrasado.**

### Lo que pide el plan

| Evento | Id propuesto | Módulo afectado (plan) | Recursos | Estado |
|---|---|---|---|---|
| Tormenta de polvo | `tormenta_polvo` | panel solar (lo tapa) | energía | Existe sin módulo. **Pendiente:** si avería el panel o solo baja su aporte, y por cuántos ticks |
| Micrometeorito / fuga de aire | `micrometeorito` | por decidir (escudo o hábitat) | blindaje y soporte vital | Hoy son dos eventos distintos (`micrometeorito` y `fuga_agua`) y la fuga es de agua, no de aire. **Pendiente:** unirlos o dejarlos separados |
| Falla del invernadero | `falla_invernadero` | invernadero | soporte vital | **No existe.** Pendiente todo: causa (plaga o falta de agua), números, texto |
| Tormenta solar real | `tormenta_solar` | Iris (`ia_base`) y escudo | blindaje, energía | Existe por la regla de señal. Los datos vienen de `data/curated/`. No inventar números: usar los del evento curado |

- `fallo_panel` existe y no está en el plan: decidir si se queda.
- **Proporción decidida:** ~70 % de los problemas por decisiones, ~30 % por mala suerte. **Retraso decidido:** 1–3 ticks (`RETRASO_POR_DIFICULTAD`).
- **Números:** ninguno de los nuevos está decidido. Los de la tabla de arriba son los que hay hoy, puestos por Jaime como borrador.

### Textos

Ya hay título y descripción, en inglés y español, para `micrometeorito`, `fallo_panel`, `fuga_agua`, `tormenta_polvo` y `causa.tormenta` (`design/i18n/`). Falta `falla_invernadero`, y cualquier clave nueva: si la añades al código sin texto, `missions/src/i18n.test.ts` falla.

### Fuentes científicas

- Tormenta solar y dosis: `docs/science/fuentes.md` y `docs/science/intensidad.md`. Solo cifras marcadas [V].
- Polvo, micrometeoritos e invernadero: **no hay fuente verificada en el repo.** Antes de escribir una cifra o una afirmación científica en un texto, pídesela a Daniel (issue `bloquea:datos`).

## 2. Mejoras de módulos

### Lo que existe hoy

`design/src/recursos.ts`, tabla `MODULOS`: lo que aporta cada módulo al colocarlo (un solo nivel, efecto retrasado). Colocar cualquiera cuesta energía −6 y soporte vital −3 (`COSTOS_ACCION.colocar_modulo`).

| Módulo (clave) | Aporte actual | En el plan |
|---|---|---|
| `panel_solar` | energía +14 | ☀️ Panel solar |
| `bateria` | energía +8, blindaje +2 | 🔋 Batería |
| `reciclador_agua` | soporte vital +12 | 💨 Generador de aire/agua |
| `invernadero` | soporte vital +10, energía −2 | 🌱 Invernadero |
| `escudo` | blindaje +14, energía −3 | 🛡️ Escudo |
| `antena` | blindaje +4, soporte vital +3 | Siempre presente (no es uno de los cinco) |
| `ia_base` | energía −2, blindaje +5 | Iris (no es un módulo que se construya) |

- **Batería con +2 de blindaje:** no tiene sentido físico. Probablemente está para cumplir la regla "cada acción mueve al menos dos medidores". No se cambió; es la decisión DD-07.
- **Misión de Jezero:** ofrece `panel_solar`, `reciclador_agua`, `escudo`, `invernadero` y `antena`, y se colocan 2. La batería no está en la lista.

### Lo que pide el plan

Cinco módulos con **tres niveles de mejora** cada uno. Nada de esto está decidido: ni el costo de mejorar, ni cuánto aporta cada nivel, ni si un módulo depende de otro.

### Por qué no se puede hacer solo desde diseño

- **El contrato no guarda niveles.** `GameState.equipos` es un mapa módulo → estado (`ok / averiado / destruido`). No hay campo de nivel.
- **No existe la acción de mejorar.** `colocar_modulo` solo lleva `{ modulo }`. Existe `subir_escudo` con `nivel` de 1 a 3, pero es un multiplicador de costo y beneficio de una sola vez, no un nivel que se guarde.
- **Consecuencia:** hace falta un issue `contrato` aprobado por motor, agentes y datos antes de implementar. No edites `contracts/` ni `engine/` por tu cuenta.

Camino sugerido: primero escribe la tabla de niveles en diseño como datos (por ejemplo `MODULOS_NIVELES`), sin que nadie la use; con esa tabla abres el issue `contrato` y Jaime conecta el motor.

## 3. Contratos e integración

| Qué | Dónde | Quién lo cambia |
|---|---|---|
| Tablas de balance | `design/src/recursos.ts` | Tú |
| Misión de Jezero | `missions/src/jezero.ts` | Tú. Ojo: `engine/src/dorada.ts` la importa y `engine/src/dorada.test.ts` congela la partida de la demo |
| Textos | `design/i18n/`, `missions/i18n/` | Tú |
| `Equipment`, `Action`, `GameState` | `contracts/src/action.ts`, `contracts/src/game-state.ts` | Solo con issue `contrato` |
| Sorteo de mala suerte, tormenta, aplicar acciones | `engine/src/acciones.ts` | Jaime (pide con `bloquea:motor`) |
| Frases de los expertos sobre eventos y módulos | `agents/` | José |

Pruebas que deberían existir cuando termines:
- Cada evento mueve al menos un recurso y tiene texto en los dos idiomas.
- Cada nivel de cada módulo cuesta algo (ninguna mejora gratis) y el nivel 3 no domina a todo lo demás.
- La semilla dorada sigue pasando (`npx vitest run engine/src/dorada`).

Riesgos:
- **La semilla dorada.** Cualquier cambio en `MODULOS`, `COSTOS_ACCION`, `CONSUMO_POR_TICK` o `jezero.ts` puede romper `dorada.test.ts`, que es la partida del video. Si cambia, coordínalo con Jaime.
- **Las pruebas de diseño.** `vitest.config.ts` no incluye `design/**`: una prueba puesta en `design/` no corre. Ponla en `missions/src/` o pide a José (infra) que añada la carpeta.
- **Textos duplicados.** El borrador de pantalla (PR #68) tiene sus propias traducciones con prefijo `ui.`. Si cambias un texto aquí, allá no cambia hasta que ui importe los de diseño (DD-03).

## 4. Decisiones que necesitan aprobación de Santiago

1. Batería: ¿qué segundo efecto tiene en vez del blindaje? (DD-07)
2. Micrometeorito y fuga: ¿un evento o dos? ¿De aire o de agua?
3. ¿Los eventos averían módulos, o solo bajan recursos?
4. ¿`fallo_panel` se queda?
5. Duración de la partida (DD-06).

## Prompt para tu sesión

```
Eres el agente de Camilo, rol diseño (carpetas design/ y missions/) de Solar Shield.
Lee solo: design/HANDOFF-CAMILO.md, design/DECISIONES.md, el issue #56 y los archivos
que el traspaso nombra. No audites el repo de nuevo.
Tarea: (1) proponer en design/ la tabla del mazo de eventos y la tabla de tres niveles
por módulo, como datos y con pruebas; (2) abrir el issue `contrato` que haga falta para
niveles y averías, sin tocar contracts/ ni engine/.
Antes de escribir cualquier número de balance, lístame las decisiones pendientes del
traspaso (sección 4) y espera mi respuesta. Rama: feat/diseno-<tema> desde develop
(o desde feat/diseno-fase-a si aún no se fusionó). PRs pequeños; no hagas merge.
Dime cuántos subagentes vas a usar y para qué antes de lanzarlos.
```
