# Estado del rescate: Solar Shield

**Checkpoint 1.** Domingo 15 nov 2026, 19:40 (hora local). Nada se ha publicado: todo vive en este
equipo, en ramas locales. `[V]` = comprobado ejecutando algo; `[NV]` = no comprobado.

Plan de trabajo: `docs/referenciapau/PLAN-INTEGRACION-SANTIAGO-PAULA.md` (Haiku lee, Opus implementa,
Fable integra y audita; un solo escritor por archivo; máximo dos Opus a la vez).

## Cómo retomar

| Qué | Dónde |
| --- | --- |
| Integración (lo que se entrega) | `C:/Users/mpaul/Documents/ss-rescue`, rama local `main`, etiqueta `rescate-checkpoint-1` |
| Flujo A, pantallas (ya integrado en `main`) | `C:/Users/mpaul/Documents/ss-rescue-a`, rama `rescate/a-pantallas` |
| Flujo B, movimiento y cámara (en curso, sin integrar) | `C:/Users/mpaul/Documents/ss-rescue-b`, rama `rescate/b-mundo` |
| Lote F, forma del escudo (en curso, sin integrar) | `C:/Users/mpaul/Documents/ss-rescue-f`, rama `rescate/f-fidelidad`; lo que había sin confirmar quedó en `checkpoint/1-f-wip` |
| Capturas de evidencia | carpeta `ui/capturas/rescate/` (sin rastrear) y copia en la rama local `rescate/evidencias` |
| Juego corriendo | configuración `rescue` de `.claude/launch.json` del checkout principal, puerto 5210 |

### Checkpoint 2 (15 nov 2026): B y F integrados en `main`

- `[V]` `2209757` integra B, `6276304` integra F, `e863f80` ajusta la ruta dorada: B quitó el jugador
  fijo en la mesa, ahora el niño llega a la consola eligiéndola en el mapa.
- `[V]` Sobre `main`: `npm run typecheck` ok; vitest 119 archivos / 897 pruebas ok; `npm run build -w ui` ok;
  `E2E_BASE_URL=http://localhost:5210 npx playwright test` 5/5 ok.
- `[V]` Capturas A+B+F: `ui/capturas/rescate/despues-abf` (68 imágenes, 0 errores).
- Problemas 2, 4, 6, 7 y 13: integrados, **a la espera de validación conjunta** con Santiago (no cerrados).
  Lectura propia de e6-base 1440 y 390: niño entero, cámara detrás, Iris y antena en cuadro. En 390x844
  la mitad superior es cielo: la cámara podría inclinarse más hacia abajo (menor).
- Las ramas `rescate/b-mundo` y `rescate/f-fidelidad` quedan integradas; `checkpoint/1-f-wip` NO se integró.

- `[V]` Segundo lote de A: `0a3db1a` (11, sitio apaisado en dos columnas), `448d2ad` (10, plan de tormenta
  apaisado en dos columnas, Confirm después de los costos), `5a15407` (9, E5 vertical con fichas en fila y hoja).
  Capturas en `ui/capturas/rescate/despues-a2` (844x390 y 390x844). Tras cada uno: vitest 897 ok, e2e 5/5, build ok.

Para seguir: validación conjunta de 1-11 y 13 con `despues-abf` y `despues-a2`; cámara de 390x844 algo
alta (mucho cielo); decidir el destino de la publicación (PR hacia `develop`).

## Problemas conocidos (siguen ABIERTOS hasta arreglarlos y validarlos en el juego real)

Ninguno se cierra por tener capturas, pruebas en verde o un componente montado: cada uno se cierra con
el par antes/después mirado junto a su lámina en 1440x900, 1024x683, 844x390 y 390x844.

| # | Problema | Estado | Evidencia |
| --- | --- | --- | --- |
| 1 | Celular vertical: HUD muy alto, niño cortado, acciones fuera de la primera pantalla | ABIERTO. HUD compacto y mundo a pantalla completa ya integrados `[V]`; el niño sigue en el borde inferior, tapado por los controles, hasta que entre la cámara de B | antes `antes/e6-base-390x844.png`; después `despues-a/e6-base-390x844.png` |
| 2 | Cámara fija: no sigue al jugador; sin cambio real entre primera y tercera persona | ABIERTO. B tiene 5 commits sin integrar ni auditar | antes `antes/e6-base-1024x683.png`; `despues-b/` sin revisar |
| 3 | E7: el panel tapaba cerca del 62 % x 62 % del mundo y repetía los tres recursos | ABIERTO, a la espera de la validación conjunta. Arreglo integrado: panel acoplado a la derecha (40 %) o hoja inferior; un solo juego de medidores. Mirado en 1024x683, 844x390 y 390x844 `[V]`; 1440x900 `[NV]` | antes `antes/e7-tormenta-1024x683.png`; después `despues-a/e7-tormenta-*.png` |
| 4 | El niño sale cortado en el borde inferior en todos los tamaños (encuadre fijo) | ABIERTO (B) | `antes/e6-base-*.png`, `despues-a/e6-base-*.png` |
| 5 | E6 no seguía la lámina (panel fijo del 40 %) | ABIERTO, a la espera de la validación conjunta. Integrado: mundo a pantalla completa con Crew, Map, `[E]` y `[V]`; panel solo al abrir | `despues-a/e6-base-1024x683.png` frente a `santiago/04_Jugabilidad/01_Web/01_tercera_persona.png` |
| 6 | El módulo escudo es una puerta de refugio en una roca; no se lee como escudo | ABIERTO (lote F en curso) | `antes/escena-recorte-escudo.png` |
| 7 | La tripulación está quieta; Iris no acompaña | ABIERTO (B) | mismas capturas |
| 8 | Tres escenas 3D distintas (módulos, base, tormenta): cada cambio de fase reiniciaba el mundo | ABIERTO, a la espera de la validación conjunta. Integrado: un solo `MundoBase`; la prueba e2e comprueba que el canvas es el mismo nodo `[V]` | `despues-a/registro.json` |
| 9 | E5 en celular vertical: las tarjetas tapan casi todo el mundo | Arreglado (`5a15407`), a la espera de validación conjunta | `despues-a/e5-modulos-390x844.png` |
| 10 | E7 en celular apaisado: para llegar a `Confirm` hay que desplazar dentro del panel | Arreglado (`448d2ad`), a la espera de validación conjunta | `despues-a/e7-plan-844x390.png` |
| 11 | E4 en 844x390: los botones `Land here` quedan fuera de pantalla (dicho por A, `[NV]`) | Confirmado y arreglado (`0a3db1a`), a la espera de validación conjunta | `despues-a/e4-sitio-844x390.png` |
| 12 | Motor: un recurso en 0 gana a la telemetría que llega en el mismo turno (`engine/src/acciones.ts:330`) | ABIERTO, decisión de diseño, no se tocó | informe de simulación (Sonnet) |
| 13 | El módulo antena queda fuera del encuadre fijo: su forma no se ha revisado | ABIERTO, depende de la cámara de B | — |

## Hecho e integrado en `main`

- `[V]` Base: `origin/main` era idéntico byte a byte al commit `32ab2e9` de `develop`; `main` local = `develop` (`def6e77`) más lo de abajo.
- `[V]` La base E6 monta la escena 3D (PR #247) y la tripulación está en la escena (PR #328).
- `[V]` Un solo reductor del juego (`ui/src/juego/reductor.ts`); `Continue` guarda y recupera la partida; idioma y sonido se recuerdan; el interruptor de sonido suena (Web Audio, sin archivos).
- `[V]` Flujo A: un solo mundo 3D para E5 a E7 (`ui/src/pantallas/MundoBase.tsx`), HUD de `mundo/01` con Crew, Map, `[E]` y `[V]`, panel de decisión solo al abrir, HUD compacto de una fila en celular, hoja inferior en vertical, mapa, controles táctiles, transición entre pantallas, pie fuera del juego, cada lugar con su acción (`ui/src/pantallas/lugares.ts`).
- `[V]` Pruebas e2e: ruta dorada, derrota y volver a jugar, continuar tras recargar, idioma recordado, pérdida de WebGL con respaldo 2D.

## Pruebas ejecutadas sobre `main` con el flujo A integrado

- `npm run typecheck`: salida 0. `npm test`: 116 archivos, 855 pruebas en verde. `npm run build`: bien.
- `npx playwright test`: 5 en verde (26,8 s).

## Sin comprobar todavía

- Todo lo que depende de la escena de B: caminar, que el mapa lleve al niño, la tecla V, el joystick, `bloqueado` deteniendo el mundo, el lugar cercano cambiando al moverse.
- La ruta dorada completa en español (solo dos capturas en ES).
- El fundido entre pantallas no se miró en movimiento; el foco se comprobó en un solo cambio.
- Ningún celular real ni PC viejo: todo lo de celular es emulación en Chromium sin GPU.

## Auditorías

- Motor (Sonnet, por simulación): los dos finales se alcanzan; el jugador pasivo pierde en el turno 10; la ruta dorada gana en el turno 5; 151 estados finales distintos en 160 combinaciones. `[NV]` por quien integra.
- Textos (Haiku): 795 claves por idioma, paridad completa, sin texto fijo en el código; 7 claves faltantes solo en el módulo de cuenta sin usar (`ui/src/juego/cuenta.ts`). `[NV]` por quien integra.

## Despliegue (solo lectura; no se desplegó nada)

- `[V]` Producción `nasa-space-apps-2026.santiago031541.workers.dev`: HTTP 200, paquete viejo (`main` de las 13:40); `/api/health` con modelo y base de datos bien.
- `[V]` `hackaton-nasa.trakatra.lat`: HTTP 200, sirve el mismo paquete que el preview (`develop`), no producción. `[NV]` a qué Worker está atado (no figura en `wrangler.jsonc`).
- `[V]` `wrangler` no tiene sesión en este equipo: solo se despliega por GitHub Actions al empujar a `develop` (preview) o a `main` (producción). La configuración del repositorio niega `gh pr merge`: la fusión la hace una persona desde la web.

## Bloqueos

- Publicar: empujar a `develop` o a `main` despliega. No se hizo; falta decidir el destino (lo previsto: un PR hacia `develop`).

## Próximas tres acciones

1. Auditar e integrar B (`rescate/b-mundo`) y F (`rescate/f-fidelidad`); probar A + B + F juntos en el juego.
2. Segundo lote de A (problemas 9, 10 y 11) y revisión de la forma de cada objeto con la cámara que camina.
3. Ruta dorada en inglés y español en los cuatro tamaños, capturas de después, y abrir el PR.
