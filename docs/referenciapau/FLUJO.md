# FLUJO: orquestación, implementación y validación de la UI

**Qué es:** quién construye cada cosa, en qué orden, cómo se integra y cómo se valida. **Dueña:** María Paula (rol ui y orquestadora). Aplica a todo lo que entra en `ui/` y `assets/`.
**Regla base:** un dueño por carpeta y **un solo escritor por archivo**. Los otros roles entregan funciones y datos; solo las sesiones de ui editan `ui/`.

---

## 1. Quién hace qué

### 1.1 Roles que entregan a la UI (no editan `ui/`)

| Rol | Entrega | Cómo se pide |
| --- | --- | --- |
| Motor (Jaime) | Funciones de `engine/` (reglas, ticks, aceptación o rechazo de acciones) | Issue `bloquea:motor` |
| Diseño (Camilo) | Datos de misión en `missions/` y tablas en `design/` | Issue `bloquea:diseño` |
| Agentes (José) | Diálogos, consejos e Iris en `agents/` (las "voces de la misión" son textos) | Issue `bloquea:agentes` |
| Datos (Daniel) | Fuentes, terreno, tarjetas de ciencia en `data/` | Issue `bloquea:datos` |
| Infra (José) | CI, e2e de la ruta dorada, despliegue | Issue `bloquea:infra` |

Si una firma no le sirve a la pantalla, se cambia la API en su carpeta, no se rodea en `ui/`. El PR #151 (José, edita `ui/`) lo absorbe la pista de integración: no se amplía desde agentes.

### 1.2 Pistas de trabajo dentro de ui

Cuatro pistas con **archivos disjuntos** y una rama cada una. Prompts en `docs/prompts/ui-*.md`.

**Cómo se ejecutan (respeta `docs/COMO-TRABAJAMOS.md` §3, "una sola sesión principal por persona"):**
- **Modo por defecto:** una sola sesión principal de María Paula (Opus) que es la pista M. Ella lanza las pistas E, I y A como **subagentes**, pasándoles su prompt como encargo, con máximo 2–3 a la vez y nunca dos sobre el mismo archivo. Así una sola cabeza controla el consumo.
- **Cada pista trabaja en su propio worktree** para que las ramas no choquen en la misma carpeta: `git worktree add ../solar-shield-<pista> -b feat/ui-<pista>-<tema> origin/develop`. La sesión principal le pasa al subagente la ruta de su worktree; al terminar, revisa el diff, hace el commit y abre el PR.
- **Modo paralelo (excepción):** sesiones separadas para E o I solo si la orquestadora lo autoriza por escrito en `ui/ESTADO.md` (por ejemplo, para recuperar tiempo antes de P3). Las reglas de archivos y ramas son las mismas.

| Pista | Qué construye | Archivos que escribe (solo estos) | Rama |
| --- | --- | --- | --- |
| **M · Integración misiones ↔ UI** | Conecta motor, misiones, agentes y datos con las pantallas; flujo de fases; i18n; contratos internos entre pistas. **Es quien integra las misiones con la UI** y quien monta en pantalla lo que entregan E e I. | `ui/src/App.tsx`, `ui/src/main.tsx`, `ui/src/juego/**`, `ui/src/pantallas/**`, `ui/src/escena/vista.ts`, `ui/src/i18n.ts`, `ui/i18n/**`, `ui/package.json` | `feat/ui-integracion-<tema>` |
| **E · Escenario 3D** | Todo el mundo en Three.js: cielo, luz, terreno, rocas, base, módulos, estaciones, personajes 3D, Iris, cámaras. **Es quien integra el escenario.** | `ui/src/escena/**` excepto `vista.ts` | `feat/ui-escenario-<tema>` |
| **I · Interfaz** | Tokens CSS, átomos y compuestos (`FacetButton`, `ResourcePlaque`, `ExpertPortrait`, `CostRow`, `PendingEffect`, `ConfirmarAccion`, `TarjetaFuente`), retratos 2D, iconos, logo, portada en DOM. | `ui/src/componentes/**`, `ui/src/estilos/**` (reemplaza `estilos.css` y `mision.css`), `ui/public/**` | `feat/ui-interfaz-<tema>` |
| **A · Audio y voz** (al final) | Música, efectos, lectura en voz alta y entrada de voz ([AUDIO.md](AUDIO.md)). | `ui/src/audio/**`, `assets/audio/**`, `assets/LICENCIAS.md` | `feat/ui-audio-<tema>` |

Fuera de las pistas:
- **Validación:** la sesión revisora ([`docs/prompts/revisor.md`](../prompts/revisor.md)) revisa cada PR; no escribe código.
- **Orquestadora del desarrollo 3D y de la pantalla (María Paula; decisión de Santiago, 14 nov):** asigna, decide lo visual, aprueba la fidelidad contra la lámina y hace el primer recorrido de la ruta dorada. Santiago orquesta el equipo.
- **Fusión:** Santiago, con squash.

Si una pista necesita cambiar un archivo de otra, **no lo edita**: lo pide a esa pista con un comentario en su PR o en el issue (ejemplo: E necesita un dato nuevo en `vista.ts`, se lo pide a M).

## 2. Contratos internos entre pistas

Se fijan **antes** de trabajar en paralelo, en un PR corto de M (y de I para los props). Después no se cambian sin avisar a la pista que los consume.

| Contrato | Lo define | Lo consume | Qué es |
| --- | --- | --- | --- |
| `VistaEscena` (en `ui/src/escena/vista.ts`) | M | E | Derivado puro de `GameState`: módulos ausentes, instalando o funcionando; estado de Iris; tormenta activa; lugar objetivo; fase. E nunca lee `GameState` directo. |
| Props de `EscenaBase` | M y E juntos | M | Entrada: `vista`, calidad, cámara. Salida: `onLugarCercano(LugarId | null)`, `onUsar(LugarId)`, `onCalidad(nivel)`, `onWebGLPerdido()`. |
| Props de componentes | I | M | Formas de [APLICACION.md](APLICACION.md) §5 (`FacetButtonProps`, `ResourcePlaqueProps`, `ConfirmarAccionProps`). Textos por clave i18n. |
| Eventos de feedback | M | I, E, A | Lista de cambios por tick derivada de `novedades(antes, despues)` con id estable (secuencia + tick + índice). Es la **única** fuente para animar, sonar o mostrar deltas. |
| Ajustes del jugador | M | I, A | Idioma, sonido (música, efectos, voz), movimiento reducido, calidad gráfica. Persisten en `localStorage`. |

## 3. División de assets

Ningún asset es una imagen de las láminas, salvo el logo. Todo se reconstruye.

| Asset | Pista | Lámina | Se construye con | Destino |
| --- | --- | --- | --- | --- |
| Cielo, luz, niebla | E | [MARTE.md](MARTE.md) §4–5 | Three.js | `ui/src/escena/cielo.ts` |
| Terreno de Jezero y rocas | E | `mundo/01`, `exterior/02` | DEM de `data/terreno/jezero` + buffers facetados | `ui/src/escena/activos/` |
| Base compacta, kit, módulos | E | `mundo/01`, `piezas/01–10`, `exterior/03` | Fábricas procedurales | `ui/src/escena/activos/` |
| Estaciones (ampliación) | E | `estaciones/00–08` | Composición del kit | `ui/src/escena/activos/estaciones.ts` |
| Niño 3D | E | `personajes/08–10`, `inicio/capas/astronauta` | Grupos con pivotes | `ui/src/escena/activos/astronautas.ts` |
| Ingeniera 3D (bloque 2); Doctora y Meteoróloga 3D (bloque 2 si alcanza el presupuesto, si no después de P4) | E | `personajes/01, 03, 05`, `mundo/01` | Misma familia de traje que el niño: cambian cabeza, cabello, acento y accesorios | idem |
| Iris rover 3D (bloque 2) | E | `mundo/01`, `inicio/02`, `personajes/07` | Grupos con pivotes (4 ruedas), panel en el techo y pantalla con ojos en canvas; sus 4 niveles visibles (NIVELES §5) | `ui/src/escena/activos/iris.ts` |
| Portada: fondo, nave, planeta, asteroide, niño flotando | E | `inicio/01`, `inicio/capas/*` | Three.js en el mismo renderer | `ui/src/escena/` |
| Portada: logo, menú, preferencias | I | `inicio/01`, `ui/00`, `ui/02` | DOM, SVG; logo como imagen | `ui/src/componentes/` |
| Intro (4 viñetas) | I | `inicio/02` | Tarjetas DOM sobre el fondo de la portada, con iconos SVG y el texto de cada viñeta. Ilustración completa solo si sobra tiempo. | `ui/src/componentes/` |
| Carga | I | `inicio/03` | DOM + indicador indeterminado | `ui/src/componentes/` |
| HUD, diálogo, comparación, fuente, final | I (piezas) y M (montaje) | `ui/01–04`, `personajes/07`, `mundo/01` | DOM/CSS con tokens | `ui/src/componentes/`, `ui/src/pantallas/` |
| Retratos de diálogo (niño, 3 expertas, Iris) | I | `personajes/02, 04, 06, 09`, `ui/01`, `personajes/07` | Misma identidad que el modelo 3D. Primera versión en SVG facetado con las 8 expresiones; si E entrega un render del modelo, se usa ese. Solo para las tarjetas de diálogo, nunca en lugar del personaje en el mundo. | `ui/src/componentes/` |
| Iconos (recursos, mensajes, acciones) | I | `ui/03` | SVG | `ui/src/componentes/Iconos.tsx` |
| Mapa (panel `Map`) | I (vista) y M (datos) | [ESCENAS.md](ESCENAS.md) §3.4 | SVG desde `LUGARES` | `ui/src/componentes/` |
| Música, efectos, voz | A | [AUDIO.md](AUDIO.md) | Web Audio, archivos con licencia, Web Speech API | `ui/src/audio/`, `assets/audio/` |

## 4. Orden de trabajo (fases)

Cada fase termina en una **puerta**. No se abre la siguiente hasta pasarla.

| Fase | Quién | Qué | Puerta para avanzar | Hasta |
| --- | --- | --- | --- | --- |
| **Prioridad 1. Definir todos los niveles** | María Paula con diseño, motor y datos | [NIVELES.md](NIVELES.md) completo: las 5 misiones, dificultad y niveles de Iris; decisiones 1 a 6 de NIVELES §7 aprobadas por Camilo y Santiago. No bloquea la fase 0: corre en paralelo porque no toca `ui/`. | Santiago aprueba NIVELES §7. | lo antes posible |
| **0. Subir y conectar** | M | Subir el trabajo local (#142) en PRs atómicos; ruta dorada jugable con lo visual que ya existe; absorber #151; #118 y #137. E, I y A **no** empiezan a escribir. | Los 8 pasos se juegan en el preview de `develop` y el e2e pasa. | P2 (sáb 22:00) |
| **1. Contratos internos** | M, I | PR de `VistaEscena`, props de `EscenaBase` y eventos de feedback (M); tokens CSS y props de componentes (I). | Contratos fusionados; typecheck en verde. | dom temprano |
| **2. Paralelo** | E, I, M | E: bloque 1 (cielo, materiales, niño, portada 3D) y bloque 2 (terreno, kit, base, módulos, Iris rover e Ingeniera en 3D). I: átomos, compuestos, retratos, portada DOM, intro. M: pantallas, flujo de fases, i18n, respaldo 2D. | Cada PR pasa la puerta de [APLICACION.md](APLICACION.md) §10. En P3 se decide 3D o 2D. | P3 (dom 11:00) |
| **3. Integración** | M | Monta los componentes de I en todas las pantallas y la escena de E en `Base3D`; borra el tema oscuro; un solo camino de confirmación. | Recorrido completo de la ruta dorada en EN y ES con teclado, móvil, movimiento reducido y respaldo 2D; aprobado por la orquestadora. | antes de P4 |
| **4. Audio y voz** | A | Ajustes de sonido, efectos ligados a eventos, música, lectura en voz alta y entrada de voz. | El juego sigue completo en silencio; sin errores en consola; licencias registradas. | P4 (dom 13:00), si no entra, se entrega sin música |
| **5. Congelamiento** | todas | Solo arreglos pedidos por el revisor o la orquestadora. Bloque 3 (las 8 estaciones interiores; Doctora y Meteoróloga 3D si no entraron antes) solo después de la entrega. | — | P5 (dom 20:00) |

Las otras 4 misiones no entran en estas fases: M arma el selector de misiones y E sus escenarios **solo** cuando el motor lea varias misiones (#152), diseño las apruebe y exista lámina aprobada ([NIVELES.md](NIVELES.md) §8).

## 5. Cómo se construye cada pieza (implementación)

Para cualquier asset de E o I, siempre en este orden ([APLICACION.md](APLICACION.md) §9 tiene el detalle):

1. Abrir la lámina canónica y la sección de [DISEÑO.md](DISEÑO.md) que le corresponde.
2. Bloquear el encuadre con formas simples desde la misma cámara de la lámina.
3. Fijar medidas y silueta. Si no coincide la silueta, no se sigue.
4. Pieza maestra por familia; después instanciar.
5. Material y luz en la cámara del juego (con el cielo de MARTE.md, no el azul).
6. Estados y pivotes (instalando, funcionando, dañado; puertas, paneles, ruedas, extremidades).
7. Entregar a M por el contrato; M lo conecta.
8. Validar (§6) y abrir PR.

Buenas prácticas que todas las pistas cumplen: funciones cortas, tablas de configuración en lugar de cadenas de `if`, ningún número de juego en `ui/`, ningún texto quemado, cero asignaciones por fotograma, caché compartida de geometrías y materiales, liberación con dueño explícito, respaldo 2D siempre vivo.

## 6. Validación (tres niveles)

| Nivel | Quién | Qué comprueba | Cómo |
| --- | --- | --- | --- |
| 1. Autor | La pista que escribió | Puerta de [APLICACION.md](APLICACION.md) §10: typecheck, test, build, captura al lado de la lámina, draw calls y triángulos, teclado, EN/ES, movimiento reducido, respaldo 2D, cero errores WebGL. | Salida real pegada en el PR. |
| 2. Revisor | Sesión revisora | Alcance de carpeta y de pista, tamaño, commits atómicos, CI, reglas del producto, prohibidos de [DISEÑO.md](DISEÑO.md) §8, duplicados entre PRs. | `gh pr review` con lista numerada. |
| 3. Orquestadora del 3D y la pantalla | María Paula | Fidelidad visual contra la lámina y que la historia se entienda ([HISTORIA.md](HISTORIA.md)). | Aprueba o pide cambios en el PR. |

Después, Santiago fusiona con squash cuando la CI "Tipos y tests" y el e2e están en verde.

## 7. Orden de fusión entre pistas

1. M: subir y conectar (fase 0).
2. M e I: contratos internos y tokens (fase 1).
3. E e I en paralelo, cada PR por separado (fase 2). Si dos PRs chocan, primero el que desbloquea a otros.
4. M: integración (fase 3).
5. A: audio y voz (fase 4).

## 8. Coordinación diaria

- Cada pista escribe su avance en `ui/ESTADO.md` en **una sección propia** (`## Pista M`, `## Pista E`, `## Pista I`, `## Pista A`), máximo 5 líneas cada una. Nadie edita la sección de otra pista.
- La orquestadora revisa los semáforos cada 30 minutos ([`docs/prompts/orquestadora.md`](../prompts/orquestadora.md)).
- Un cambio de contrato interno se avisa en el PR de la pista consumidora antes de fusionarlo.
