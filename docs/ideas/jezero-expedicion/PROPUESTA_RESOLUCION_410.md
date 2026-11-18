# Propuesta de resolución de conflictos de #410 (Frente E)

**Estado:** propuesta para el **propietario de #410** (Santiago, Frente E). **No se rebasó, no se modificó la rama ni el PR.** Después de la resolución, la auditoría de abajo (sección 4) se ejecuta sobre el resultado.
**Evidencia:** `git merge-tree --write-tree origin/develop 834b055` (SHA de #410) → árbol de conflictos `b8246cb`; los dos archivos con marcadores se leyeron desde ese árbol sin tocar ninguna rama. Estado verificado el 18 nov: `origin/develop` = `cf48c72`; #410 = `834b055`, base `develop`, `CONFLICTING/DIRTY`, CI verde; el merge-base es `cefd3ab`.

## 1. Causa
Desde `cefd3ab`, `develop` incorporó #417 (Iris no se delata: `averiaRevelada`), #419 (datos de NASA en pantalla), #420 (login/cuentas) y #430 (portada/menú) sobre `App.tsx` y `PantallaBase.tsx`. **P0 (#443–#445, #449, #454) no añade ningún conflicto**: se comprobó con `(develop + #449 + #454) + #410`, que conflictúa en los mismos dos archivos y solo en ellos.

## 2. Conflictos y resolución propuesta, hunk por hunk

### `ui/src/App.tsx` — hunk 1 (imports)
| Lado | Contenido |
|---|---|
| `develop` | `MISION_JEZERO`, `Acceso`/`SesionJugador`, `cerrarSesionCuenta`, `useProgresoCuenta`, `FacetButton` |
| #410 | `fijarMision`, `misionPorId`, `semillaNueva`, `siguienteMision` desde `./juego/misiones.js` |

**Propuesta:** conservar **los dos conjuntos** (no se excluyen). Quitar `MISION_JEZERO` **solo si** tras la resolución ya no se usa en `App.tsx` (en `develop` se usa para `MISION_JEZERO.modulosAColocar` en el objetivo del HUD; #410 lo cambia por la misión activa). Verificarlo con el typecheck, no a ojo.

### `ui/src/App.tsx` — hunk 2 (estado de la partida y guardado)
| Lado | Contenido |
|---|---|
| `develop` | `useReducer(reducir, undefined, inicial)` + **guardado por cuenta** (`sesion.progreso`, `useProgresoCuenta`, aviso `beforeunload` del invitado, `salir`) |
| #410 | `useReducer(reducir, undefined, () => inicial())`, `const mision = misionPorId(j.misionId); fijarMision(mision);` y el **guardado local antiguo** (`cargarPartida`/`guardarPartida` en el navegador) |

**Propuesta:** tomar **el bloque de `develop`** (cuentas y guardado de #420, que sustituye al guardado local) y **añadir** las tres líneas propias de #410: el inicializador `() => inicial()`, `misionPorId(j.misionId)` y `fijarMision(mision)`. **Descartar** las líneas `cargarPartida`/`guardarPartida` locales: #420 las reemplazó. No es una elección de gusto: mantener ambos guardados duplicaría la persistencia.

### `ui/src/pantallas/PantallaBase.tsx` — hunk 1 (llamada a la conversación)
| Lado | Contenido |
|---|---|
| `develop` | `tormentaActiva(estado)`, y **`averiaRevelada: averiaIrisRevelada(estado)`** con su comentario de #401/#417 |
| #410 | `tormentaActiva(estado, misionActiva())`, sin `averiaRevelada` |

**Propuesta:** combinar: `tormentaActiva: tormentaActiva(estado, misionActiva())` **y conservar `averiaRevelada: averiaIrisRevelada(estado)`**. Perder esa línea reintroduciría el spoiler de Iris que #417 había cerrado en el diálogo.

## 3. Cosas que se resuelven solas pero hay que mirar (no son conflicto de texto)
- `ui/src/juego/cuenta.ts`: #410 lo modifica (guarda `misionId`) y `develop` lo modificó con #420; Git los fusionó sin conflicto, pero **semánticamente** el progreso de cuenta debe seguir guardando y restaurando `misionId`, y una partida guardada **sin** `misionId` debe seguir siendo Jezero.
- `ui/src/pantallas/lugares.ts`: `averiaIrisRevelada` usa `misionActiva()` en #410; **#410 conserva las tres filtraciones de Iris** (`PantallaBase` línea 421 y `lugares.ts` línea 38, verificado en su árbol). Corregirlas es trabajo de la fase 2 de la v2, **después** de #410.
- `misionActiva()` es una variable de módulo que `App` fija en cada render (el propio PR lo llama "atajo a revisar"). Un contexto de React sería lo limpio; **no se propone cambiarlo en esta integración** (aumentaría el alcance).

## 4. Auditoría posterior a la resolución (la hace otra persona/agente que no resolvió)
1. `git merge-base --is-ancestor 4a949ad origin/develop` y `798cd95` (P0 ya integrado antes).
2. `git diff --stat origin/develop...<rama resuelta>`: solo los archivos que #410 declara; ningún cambio en `design/`, `engine/`, `missions/`, `contracts/`.
3. `git grep -n "<<<<<<<\|>>>>>>>" -- ui` sin resultados.
4. `npm ci && npm run typecheck && npm test` (incluye `humo-misiones.test.ts`, `guardado.test.ts`, `cuenta.test.ts`, `reductor.test.ts`).
5. `npm run e2e -- --workers=1` completo (`ruta-dorada`, `acceso`, `derrota-repetir-continuar`).
6. Comprobación manual de **tres caminos**: invitado nuevo; cuenta con partida guardada de Jezero; partida guardada **sin** `misionId`.
7. Jugar las **5 misiones** por el reductor hasta el final (el PR ya trae `?mision=<id>&semilla=<x>`).
8. Comprobar que **no reaparece el spoiler** del diálogo de Iris en la base (`averiaRevelada` conservado).
9. Confirmar que `git grep "misionActiva()" -- ui` sigue siendo la **única** vía de lectura de la misión (para no mezclar dos mecanismos).

## 5. Qué NO hace esta propuesta
No resuelve nada por el propietario, no toca #411–#415 (apilados, `MERGEABLE/CLEAN` entre sí; no necesarios para la v2), y no decide si la rama experimental (selector, tarjeta guía, radio) entra al producto.
