# FLUJO: quién programa el frontend, en qué rama y cómo se valida

**Qué es:** el reparto del frontend entre las personas del equipo, los archivos de cada una, la rama donde se trabaja, el orden y la validación. **Orquesta:** María Paula, orquestadora del desarrollo 3D y de la pantalla (decisión de Santiago, 14 nov). Santiago orquesta el equipo y fusiona en `develop`.
**Regla base:** cada persona escribe **solo sus archivos** (§1). Si necesita algo de un archivo ajeno, se lo pide a su dueño en el PR o en un issue. Todo PR de `ui/` lo aprueba María Paula (CODEOWNERS).

---

## 1. Quién programa cada parte

| Parte del frontend | Quién | Qué programa | Archivos que escribe (solo esa persona) | Brief |
| --- | --- | --- | --- | --- |
| **Dirección visual y personajes** | **María Paula** | Niño astronauta, Ingeniera 3D, Iris rover (estados, ojos, gestos, movimiento de guía), Doctora y Meteoróloga si alcanza, niño flotando y nave de la portada. Aprueba la fidelidad de **todo** contra las láminas. | `ui/src/escena/activos/astronautas.ts`, `ui/src/escena/activos/iris.ts`, `ui/src/escena/activos/portada.ts`, `ui/src/escena/guia.ts` | [front-personajes.md](../prompts/front-personajes.md) |
| **Escenario 3D** | **Daniel** | Renderer y ciclo de vida, cielo y luz de Marte, terreno de Jezero desde el DEM, rocas, kit de piezas, base compacta, los 5 módulos, rendimiento y degradación (3D completo, liviano, 2D). | `ui/src/escena/escena3d.ts`, `EscenaBase.tsx`, `materiales.ts`, `liberar.ts`, `cielo.ts`, `soporte.ts`, `modelos.ts`, `escena.test.ts`, `activos/piezasComunes.ts`, `activos/instancias.ts`, `activos/terreno.ts`, `activos/modulos.ts`, `activos/estaciones.ts` | [front-escenario.md](../prompts/front-escenario.md) |
| **Ubicación y recorrido** | **Camilo** | Dónde va cada cosa (`LUGARES`, anclajes de módulos), colisiones, caminar, cámaras de 3.ª y 1.ª persona (`KeyV`), los dos circuitos, panel `Map` y lista accesible de lugares. Además prueba la ruta dorada. | `ui/src/escena/mundo.ts`, `fisica.ts`, `navegacion.ts`, `navegacion.test.ts`, `ui/src/componentes/Mapa.tsx` | [front-ubicacion.md](../prompts/front-ubicacion.md) |
| **Integración y pantallas** | **José** | Flujo de fases, conexión con motor, agentes y datos, reductor, `vista.ts`, i18n, un solo `ConfirmarAccion`, Iris compañera en pantalla, montaje de lo que entregan los demás. | `ui/src/App.tsx`, `main.tsx`, `i18n.ts`, `ui/src/juego/**`, `ui/src/pantallas/**`, `ui/src/escena/vista.ts`, `ui/i18n/**`, `ui/package.json`, y los componentes de comportamiento: `Tripulacion.tsx`, `Dialogos.tsx`, `Hud.tsx`, `Acciones.tsx`, `Cuenta.tsx`, `Polvo.tsx`, `PreguntaDeIris.tsx`, `QueSi.tsx` | [front-integracion.md](../prompts/front-integracion.md) |
| **Interfaz de las láminas v8** | **Jaime** | Desde cero, replicando `ui/00–04`, `inicio/01–03`, `personajes/07` y el HUD de `mundo/01`; nada visual del esqueleto actual. Tokens CSS, botones con todos sus estados, placas de recursos, retratos, costo y efecto pendiente, mensajes, tarjeta de fuente, menú y preferencias de la portada, intro, carga, "qué datos usamos", glosario en contexto, iconos y logo. | `ui/src/componentes/base/**`, `ui/src/estilos/**` (reemplaza `estilos.css` y `mision.css`), `ui/public/**`, `TarjetaFuente.tsx`, `Glosario.tsx`, `DatosUsados.tsx`, `Portada.tsx`, `Intro.tsx`, `Carga.tsx`, `Iconos.tsx`, `LogoSolarShield.tsx`, `RetratoIris.tsx` | [front-interfaz.md](../prompts/front-interfaz.md) |
| **Audio y voz** (al final) | **Jaime**, o quien termine primero con OK de María Paula | Música, efectos, lectura en voz alta, entrada de voz ([AUDIO.md](AUDIO.md)). | `ui/src/audio/**`, `assets/audio/**`, `assets/LICENCIAS.md` | [front-audio.md](../prompts/front-audio.md) |

Fuera del frontend:
- **Revisor (Claude):** revisa cada PR ([`revisor.md`](../prompts/revisor.md)); no escribe código.
- **Santiago:** fusiona en `develop` y decide recortes.
- Cada persona mantiene también las tareas de su rol (motor, diseño, agentes, datos): primero cierra lo de P2 y después pasa a su parte del frontend. Está en su prompt.

**Por qué así:** el escenario 3D es la parte con más trabajo y la más difícil, y va con Daniel, que además tiene Codex con GPT-6.1 como capacidad extra. Jaime toma la interfaz, que se construye **desde cero replicando las láminas de ui** (del esqueleto actual no se toma nada visual). Camilo diseña niveles y mapa. José ya integra pantallas (#151, #163). María Paula dirige el arte y toma los personajes, lo más sensible a la referencia.

Un archivo nuevo que no esté en la tabla pertenece a quien lo crea **dentro de su carpeta** (`activos/` de personajes, `componentes/base/`, etc.). Si no está claro, decide María Paula.

## 2. Rama de escenarios

El frontend v8 se construye en una **rama alterna**, para que `develop` siga siendo la demo estable (ruta dorada jugable, e2e en verde).

```text
develop  (demo estable; la fusiona Santiago)
  └── feat/ui-escenarios  (integración del frontend v8; la fusiona María Paula)
        ├── feat/ui-personajes-<tema>   María Paula
        ├── feat/ui-escenario-<tema>    Daniel
        ├── feat/ui-ubicacion-<tema>    Camilo
        ├── feat/ui-integracion-<tema>  José
        ├── feat/ui-interfaz-<tema>     Jaime
        └── feat/ui-audio-<tema>        Jaime (al final)
```

- Cada persona crea su rama **desde `feat/ui-escenarios`** y abre el PR **hacia `feat/ui-escenarios`**: `git fetch origin && git switch -c feat/ui-<parte>-<tema> origin/feat/ui-escenarios`. Antes de cada tarea: `git rebase origin/feat/ui-escenarios`.
- Los PRs hacia `feat/ui-escenarios` los revisa el revisor y **los fusiona María Paula** (squash).
- **CI:** hoy `.github/workflows/ci.yml` solo corre en PRs hacia `develop` y `main`. José agrega `feat/ui-escenarios` (tarea 1 de su prompt). Mientras tanto, cada PR pega la salida local de `npm run typecheck`, `npm test`, `npm run build` y `npm run e2e` (ruta dorada).
- **Vuelta a `develop`:** un PR `feat/ui-escenarios` → `develop` en dos puntos de control, solo con e2e y la puerta de [APLICACION.md](APLICACION.md) §10 en verde. Lo fusiona Santiago.
  1. **Antes de P3 (dom ~10:00):** para decidir 3D o 2D con el juego real.
  2. **Antes de P4 (dom ~12:30):** la versión final.
- Mientras tanto, `develop` sigue recibiendo arreglos chicos de la ruta dorada (por ejemplo #151). Quien trabaja en escenarios trae `develop` con `git merge origin/develop` dentro de `feat/ui-escenarios` cuando María Paula lo indica.
- Para medir en un celular sin despliegue: `npm run dev -w ui -- --host` y abrir la IP del equipo desde el celular en la misma red.

### 2.1 Qué se puede empezar ya y qué espera

- **Ya, sin esperar:** archivos **nuevos** de cada parte, en su rama desde `feat/ui-escenarios`. Daniel: `materiales.ts`, `liberar.ts`, `cielo.ts`, `activos/terreno.ts`, `activos/piezasComunes.ts`, `activos/instancias.ts`, `activos/modulos.ts`. Jaime: `componentes/base/`, `estilos/`, `Portada.tsx`, `Intro.tsx`, `Carga.tsx`, `Glosario.tsx`, `DatosUsados.tsx`. Camilo: `componentes/Mapa.tsx`. María Paula: `activos/astronautas.ts`, `activos/iris.ts`, `activos/portada.ts`.
- **Espera la subida de María Paula:** los archivos que **ya existen** en su trabajo local de `feat/ui-escena-3d`. En `ui/src/`: `App.tsx`, `main.tsx`, `i18n.ts`, `estilos.css`, `mision.css`; `componentes/Dialogos.tsx`, `Hud.tsx`, `Tripulacion.tsx`, `Acciones.tsx`, `Cuenta.tsx`, `Iconos.tsx`, `LogoSolarShield.tsx`, `RetratoIris.tsx`; `pantallas/ColocarModulos.tsx`, `ElegirSitio.tsx`, `Final.tsx`, `Satelite.tsx`, `Tormenta.tsx`, `Base3D.tsx`; `escena/escena3d.ts`, `EscenaBase.tsx`, `modelos.ts`, `soporte.ts`, `mundo.ts`, `fisica.ts`, `navegacion.ts`, `guia.ts`, `vista.ts` y sus tests; `juego/reductor.ts` y `cuenta.ts` con sus tests. Fuera de `src/`: `ui/index.html`, `ui/package.json`, `ui/i18n/en.json`, `ui/i18n/es.json` y `ui/public/icono.svg`. Tocarlos antes pisa su trabajo.
- **Esperan solo para no pisar la lógica** (motor, i18n, reductor, firmas de la escena, respaldo 2D). **Lo visual de esos archivos no es punto de partida de nada:** se borra en la fase 0b (§2.2) y se rehace desde las láminas. Nadie copia colores, formas, clases CSS ni geometría del trabajo anterior.

### 2.2 Borrar el diseño anterior (fase 0b)

El diseño que había antes del atlas v8 **se borra**, no se adapta. Lo borra cada dueño en sus archivos, en un PR atómico, apenas entra la subida de María Paula:

| Quién | Qué borra |
| --- | --- |
| **Jaime** | `ui/src/estilos.css` y `ui/src/mision.css` completos (tema oscuro, `#0b1026`, `#1a2350`, `--hud: #141a2b`, `--life: #9be15d`). Los reemplaza por `ui/src/estilos/` con los tokens v8 para que la app siga compilando. |
| **José** | En `App.tsx` y `pantallas/`: la bienvenida oscura de `Base3D.tsx` (`.vineta-mundo`, `.bienvenida-mision`, `.boton-despegar` verde, `.comunicador-iris`), el `<Hud />` en la fase `inicio` y toda clase o import del tema viejo. |
| **Daniel** | En `escena3d.ts`, `modelos.ts` y `EscenaBase.tsx`: el cielo `#323272`, los paneles oscuros, los visores opacos y cualquier geometría o material del prototipo. Quedan las firmas que consume la escena (APLICACION §1). |
| **María Paula** | Revisa que no quede nada y lo aprueba. |

Lo único que se conserva es la lógica: conexión con el motor, i18n, reductor, firmas de la escena y respaldo 2D.

## 3. Contratos entre partes

Se fijan **antes** de trabajar en paralelo, en PRs cortos. Después no se cambian sin avisar a quien los consume.

| Contrato | Lo define | Lo consume | Qué es |
| --- | --- | --- | --- |
| `VistaEscena` (en `ui/src/escena/vista.ts`) | José | Daniel, María Paula, Camilo | Derivado puro de `GameState`: módulos ausentes, instalando o funcionando; estado de Iris; tormenta activa; lugar objetivo; fase. Nadie en `escena/` lee `GameState` directo. |
| Props de `EscenaBase` | Daniel y José | José | Entrada: `vista`, calidad, cámara. Salida: `onLugarCercano(LugarId | null)`, `onUsar(LugarId)`, `onCalidad(nivel)`, `onWebGLPerdido()`. |
| `LUGARES` y anclajes (en `mundo.ts`) | Camilo | Daniel, María Paula, José | Posición de cada lugar, radio de interacción, anclajes de módulos y de personajes. |
| Fábricas de personajes (`crearAstronauta`, `crearExpertos`, `crearIris`) | María Paula | Daniel | Firmas que ya consume `escena3d.ts` (`ModeloAstronauta`, `ModeloExperto`, `ModeloIris`, `GestoIris`). |
| Materiales y slots (`materiales.ts`) | Daniel | María Paula | `SuitBase`, `Accent`, `Boots`, `Skin`, `Hair`, `Glass`, `Emissive`, `Rock`, `Plant`. |
| Props de componentes | Jaime | José | Formas de [APLICACION.md](APLICACION.md) §5 (`FacetButtonProps`, `ResourcePlaqueProps`, `ConfirmarAccionProps`). Textos por clave i18n. |
| Eventos de feedback | José | Jaime, Daniel, María Paula | Cambios por tick desde `novedades(antes, despues)` con id estable. Única fuente para animar, sonar o mostrar deltas. |
| Ajustes del jugador | José | Jaime | Idioma, sonido, movimiento reducido, calidad gráfica, en `localStorage`. |

## 4. División de assets

Ningún asset es una imagen de las láminas, salvo el logo. Todo se reconstruye.

| Asset | Quién | Lámina | Se construye con | Destino |
| --- | --- | --- | --- | --- |
| Cielo, luz, niebla | Daniel | [MARTE.md](MARTE.md) §4–5 | Three.js | `escena/cielo.ts` |
| Terreno de Jezero y rocas | Daniel | `mundo/01`, `exterior/02` | DEM de `data/terreno/jezero` + buffers facetados | `escena/activos/terreno.ts` |
| Kit de piezas, base compacta, 5 módulos | Daniel | `mundo/01`, `piezas/01–10`, `exterior/03` | Fábricas procedurales | `escena/activos/` |
| Estaciones (después de P4) | Daniel | `estaciones/00–08` | Composición del kit | `escena/activos/estaciones.ts` |
| Ubicación de lugares, anclajes, caminos y circuitos | Camilo | `exterior/03`, [`mapa-base-jezero.svg`](mapa-base-jezero.svg) | Tabla `LUGARES` y colisiones simples | `escena/mundo.ts`, `fisica.ts` |
| Cámaras 3.ª y 1.ª persona, caminar | Camilo | `mundo/01`, `mundo/02` | Navegación sin atravesar paredes | `escena/navegacion.ts` |
| Panel `Map` y lista de lugares | Camilo | [ESCENAS.md](ESCENAS.md) §3.4 | SVG desde `LUGARES` | `componentes/Mapa.tsx` |
| Niño 3D | María Paula | `personajes/08–10`, `inicio/capas/astronauta` | Grupos con pivotes | `escena/activos/astronautas.ts` |
| Ingeniera 3D (bloque 2); Doctora y Meteoróloga si alcanza | María Paula | `personajes/01, 03, 05`, `mundo/01` | Misma familia de traje que el niño | `escena/activos/astronautas.ts` |
| Iris rover 3D y su movimiento de guía | María Paula | `mundo/01`, `inicio/02`, `personajes/07` | 4 ruedas con pivote, panel, pantalla con ojos; niveles de NIVELES §5 | `escena/activos/iris.ts`, `escena/guia.ts` |
| Portada 3D: fondo, nave, planeta, asteroide, niño flotando | María Paula | `inicio/01`, `inicio/capas/*` | Three.js en el mismo renderer | `escena/activos/portada.ts` |
| Tokens, botones, placas, costo, mensajes | Jaime | `ui/02`, `ui/03` | DOM/CSS | `componentes/base/`, `estilos/` |
| Retratos de diálogo (niño, expertas, Iris) | Jaime | `personajes/02, 04, 06, 09`, `ui/01`, `personajes/07` | SVG facetado con las 8 expresiones; misma identidad que el modelo 3D | `componentes/base/` |
| Portada DOM (logo, menú, preferencias), intro, carga | Jaime | `inicio/01–03`, `ui/00` | DOM, SVG; logo como imagen | `componentes/Portada.tsx`, `Intro.tsx`, `Carga.tsx` |
| Tarjeta de fuente, "qué datos usamos", glosario | Jaime | `ui/04` | DOM con datos de `@solar-shield/data` | `componentes/` |
| HUD, diálogo, comparación, tormenta, final (montaje) | José | `ui/01`, `ui/04`, `personajes/07`, `mundo/01` | Pantallas que usan las piezas de Jaime | `pantallas/`, componentes de comportamiento |
| Música, efectos, voz | Jaime (al final) | [AUDIO.md](AUDIO.md) | Web Audio, archivos con licencia, Web Speech API | `audio/`, `assets/audio/` |

## 5. Orden de trabajo (fases)

| Fase | Quién | Qué | Puerta para avanzar | Hasta |
| --- | --- | --- | --- | --- |
| **0. Base de escenarios** | María Paula | Subir su trabajo local de `feat/ui-escena-3d` a `feat/ui-escenarios` en PRs atómicos. **Mientras tanto, los demás ya trabajan en archivos nuevos** (§2.1); los archivos que ya existen en ese trabajo esperan. | Trabajo local fusionado en `feat/ui-escenarios`. | sáb noche |
| **0b. Borrar el diseño anterior** | Cada dueño en sus archivos | Apenas entra la subida, se borra todo lo visual de antes (§2.2). Desde ahí la única guía visual son las láminas del atlas v8. | Ningún rastro del tema oscuro ni de la geometría del prototipo en `feat/ui-escenarios`. | sáb noche |
| **0b. P2 en develop** | Santiago, José | La ruta dorada sigue jugable en `develop` (#163 ya está; #151 rebasado sobre #163). | e2e verde en `develop`. | P2 (sáb 22:00) |
| **1. Contratos** | José, Daniel, Camilo, Jaime | `VistaEscena` y eventos (José), props de `EscenaBase` (Daniel y José), `LUGARES` (Camilo), tokens y props de componentes (Jaime). José agrega `feat/ui-escenarios` a la CI. | Contratos fusionados en `feat/ui-escenarios`. | dom temprano |
| **2. En paralelo** | Todos | Daniel: cielo, terreno, kit, base, módulos. María Paula: niño, Ingeniera, Iris, portada 3D. Camilo: lugares, colisiones, cámaras, mapa. Jaime: sistema facetado, portada DOM, intro, carga, datos. José: pantallas y flujo con las piezas que llegan. | Cada PR pasa la puerta de [APLICACION.md](APLICACION.md) §10. | dom ~10:00 |
| **Punto de control 1** | María Paula y Santiago | PR `feat/ui-escenarios` → `develop`; medir en celular y PC viejo. | P3: se decide 3D o respaldo 2D. | P3 (dom 11:00) |
| **3. Integración** | José (montaje), todos (arreglos) | Componentes de Jaime en todas las pantallas, escena en `Base3D`, tema oscuro borrado, un solo `ConfirmarAccion`, Iris compañera. | Recorrido completo en EN y ES, teclado, móvil, movimiento reducido y respaldo 2D, aprobado por María Paula. | dom ~12:30 |
| **Punto de control 2** | Santiago | PR final `feat/ui-escenarios` → `develop`. | e2e verde y puerta §10. | antes de P4 |
| **4. Audio** | Jaime | Solo si la fase 3 terminó antes de P4. | El juego sigue completo en silencio. | P4 (dom 13:00) |
| **5. Congelamiento** | Todos | Solo arreglos. Estaciones y Doctora y Meteoróloga 3D, después de la entrega. | — | P5 (dom 20:00) |

**Prioridad 1 en paralelo (no toca `ui/`):** definir y aprobar todos los niveles ([NIVELES.md](NIVELES.md) §7). Las otras 4 misiones no entran en el frontend hasta que el motor lea varias misiones (#152), diseño las apruebe y exista lámina ([NIVELES.md](NIVELES.md) §8).

## 6. Cómo se construye cada pieza

1. Abrir la lámina canónica y la sección de [DISEÑO.md](DISEÑO.md) que le corresponde.
2. Bloquear el encuadre con formas simples desde la misma cámara de la lámina.
3. Fijar medidas y silueta. Si no coincide la silueta, no se sigue.
4. Pieza maestra por familia; después instanciar.
5. Material y luz en la cámara del juego (con el cielo de MARTE.md, no el azul).
6. Estados y pivotes.
7. Entregar por el contrato (§3) y avisar a José si hay que montarlo.
8. Validar (§7) y abrir PR hacia `feat/ui-escenarios`.

Buenas prácticas para todos: funciones cortas, tablas de configuración en lugar de cadenas de `if`, ningún número de juego en `ui/`, ningún texto quemado, cero asignaciones por fotograma, caché compartida de geometrías y materiales, liberación con dueño explícito, respaldo 2D siempre vivo. Detalle técnico: [APLICACION.md](APLICACION.md).

## 7. Validación (tres niveles)

| Nivel | Quién | Qué comprueba | Cómo |
| --- | --- | --- | --- |
| 1. Autor | Quien escribió | Puerta de [APLICACION.md](APLICACION.md) §10: typecheck, test, build, e2e, captura al lado de la lámina, draw calls y triángulos, teclado, EN/ES, movimiento reducido, respaldo 2D, cero errores WebGL. | Salida real pegada en el PR. |
| 2. Revisor | Sesión revisora | Que solo toque sus archivos (§1), tamaño, commits atómicos, CI o salida local, reglas del producto, prohibidos de [DISEÑO.md](DISEÑO.md) §8, choques entre PRs. | `gh pr review` con lista numerada. |
| 3. Fidelidad | María Paula | Fidelidad visual contra la lámina y que la historia se entienda ([HISTORIA.md](HISTORIA.md)). | Aprueba o pide cambios; fusiona en `feat/ui-escenarios`. |

### 7.1 Ficha de fidelidad (obligatoria en todo PR visual)

Un PR que cambia algo visible sin esta ficha **no se revisa ni se fusiona**. El revisor pide cambios y la orquestación lo marca en rojo. Va en la descripción del PR:

```text
Lámina canónica: <carpeta/archivo de §4>  (y la sección de DISEÑO.md o ESCENAS.md)
Captura: localhost:5173, misma cámara y proporción que la lámina, una al lado de la otra
Silueta:   igual | difiere en ...
Layout:    igual | difiere en ...   (posiciones dentro del 2 % del lienzo, APLICACION §10)
Material:  tokens de DISEÑO §2 usados: ...   (ningún color suelto fuera de los tokens)
Conducta:  estados y animación como la lámina | difiere en ...
Desviación permitida usada: ninguna | cielo de Marte (MARTE.md) | otra anotada en REFERENCIAS.md
DISEÑO §8 (prohibidos): revisado, ninguno
Emojis y aspecto genérico/IA (DISEÑO §8): revisado, nada fuera de la lámina
```

Reglas de la ficha:
- **La estética es la de la lámina.** Low-poly facetado, paleta marfil, lila, ciruela y cian, sombras lilas y proporciones de los personajes como se ven. No se "mejora", no se reinterpreta, no se toma nada del diseño anterior.
- **La única desviación libre es el cielo:** el azul de `mundo/01` y `mundo/02` se cambia por el cielo de [MARTE.md](MARTE.md). Cualquier otra diferencia se anota en la ficha y la aprueba María Paula. Si la decisión es durable, va a [REFERENCIAS.md](REFERENCIAS.md).
- **Si la silueta no coincide, no se sigue** (§6, paso 3). Se corrige antes de pasar a materiales o estados.
- **Una lámina por pieza:** la columna "Lámina" de §4. Si una pieza no tiene lámina, no se inventa: se pregunta a María Paula.

## 8. Coordinación

- `ui/ESTADO.md` tiene **una sección por persona** (`## Personajes (María Paula)`, `## Escenario (Daniel)`, `## Ubicación (Camilo)`, `## Integración (José)`, `## Interfaz (Jaime)`), máximo 5 líneas cada una. Nadie edita la sección de otro.
- La orquestación del frontend revisa los semáforos cada 30 minutos ([`orquestadora.md`](../prompts/orquestadora.md)).
- Un cambio de contrato (§3) se avisa en el PR de quien lo consume antes de fusionarlo.
