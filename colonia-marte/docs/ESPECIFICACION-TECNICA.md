# Especificación técnica

Reglas duras para todo agente que produzca código o assets en este repo.
Si una regla impide cumplir un pedido, el agente se detiene y lo reporta;
no la relaja por su cuenta.

Estado de cada dato: **[V]** verificado en esta máquina (comando y salida en la
sección 10), **[S]** supuesto a confirmar por el usuario.
Decisiones que fundamentan este documento: `docs/DECISIONES.md` (DV-03 stack,
DV-04 modularidad).

---

## 1. Stack

| Capa | Herramienta | Versión | Estado |
|---|---|---|---|
| Runtime | Node | 24.14.1 | [V] |
| Bundler | Vite | 8.3.8 | [V] |
| Lenguaje | TypeScript | 7.0.2 | [V] |
| Motor 3D | `three` + `@types/three` | **fijar exactamente 0.187.0** | [V] |
| Addons de three usados | `RoundedBoxGeometry`, `BufferGeometryUtils`, `DecalGeometry`, `RectAreaLightUniformsLib` (incluidos en 0.187.0) | — | [V] |
| Postproceso | `postprocessing` (pmndrs) | 6.39.6 | [V] |
| AO en pantalla | `n8ao` | 2.1.0 | [V] |
| Raycast acelerado (AO por vértice, colisión de cámara) | `three-mesh-bvh` | 0.10.0 | [V] |
| Optimización de GLB (solo personajes) | `@gltf-transform/cli` | 4.5.1 | [V] |
| Métricas | `stats-gl` | 4.2.3 | [V] |
| Tests | `vitest` 5.1.2, `@playwright/test` 1.65.1 | — | [V] |
| Personajes humanos | Blender 5.3.0 headless (`bpy`), ruta `C:/Program Files/Blender Foundation/Blender 5.3/blender.exe` (no está en PATH) | 5.3.0 | [V] |

Decisiones y motivos:
- **Three.js procedural para todo excepto personajes humanos** (DV-03). La
  distancia con las referencias es de técnica (bisel, paleta, AO, bloom, kit
  modular), no de herramienta.
- **Blender solo para personajes deformables** (tripulación, jugador, EVA): pesos
  automáticos de piel, modificadores y animaciones. Iris es un rover rígido: va
  en Three.js.
- **`three` fijado en 0.187.0**: `postprocessing` 6.39.6 exige
  `three >=0.168.0 <0.188.0` [V].
- **WebGL2 (`WebGLRenderer`)**: el postproceso elegido es WebGL.
- **TypeScript sin framework de UI** en esta capa. Se integra después en el
  juego (React) como un módulo que recibe estado y dibuja.

---

## 2. Arquitectura modular (DV-04)

Cinco capas, de átomo a escena. Cada capa solo importa de las de abajo.

| Capa | Qué es | Ejemplos | Carpeta |
|---|---|---|---|
| 1. **Primitivas** | Generadores de geometría con bisel y normales correctas | `chamferBox`, `extrudeProfile`, `panelInset`, `ledStrip`, `pipeRun`, `truncatedIcosa` | `src/kit/primitives/` |
| 2. **Piezas** | Una pieza del inventario: función pura `build(params) → Object3D` | `ST-W01` pared, `DN-02` silla, `MB-01` cápsula, `CH-09` Iris | `src/kit/pieces/<familia>/` |
| 3. **Conjuntos** | Agrupaciones reutilizables de piezas | mesa con 4 sillas, rack hidropónico con cultivos, consola con monitor | `src/kit/sets/` |
| 4. **Layouts** | **Datos**, no código: qué piezas van en qué celda de la rejilla | `data/layouts/rooms/canteen.json`, `data/layouts/colony/c3.json` | `data/layouts/` |
| 5. **Escenas** | Cargan layouts, aplican ambiente, cámara y visibilidad | escena exterior, ala interior, nave | `src/scenes/` |

Reglas:
1. **Registro por ID**: toda pieza se registra con su ID de `INVENTARIO.md`
   (`registry.register("ST-W01", buildWall)`). Un layout solo puede usar IDs registrados.
2. **Funciones puras y deterministas**: mismos parámetros y misma semilla →
   misma geometría. Nada de `Math.random()` sin semilla.
3. **Parámetros tipados** por pieza (ancho en módulos, variante, estado), con valores por defecto.
4. **Materiales solo desde la paleta** (`src/materials/`); una pieza nunca crea un material propio.
5. **Geometría compartida**: una pieza construye su geometría una vez y la cachea
   por parámetros; las repeticiones se instancian.
6. **Tamaño de archivo**: máximo ~300 líneas por archivo. Si crece, se divide en piezas o primitivas.
7. **Sin estado del juego dentro de las piezas**: los estados visuales (luz
   encendida, invernadero apagado, Iris dañada) entran como parámetro.
8. **Catálogo visual**: una página de desarrollo (`/catalog`) muestra cada pieza
   registrada con sus variantes, para revisar sin armar una escena.

---

## 3. Unidades, ejes y rejilla

| Regla | Valor |
|---|---|
| Unidad | 1 = 1 metro |
| Ejes | Y arriba (convención de Three.js) |
| Rejilla de interiores | Módulo de **2 m** en planta; alto libre **3 m**; losa 0,2 m; plenum 0,6 m |
| Puertas | 1,2 x 2,4 m (servicio 1,0 x 2,2 m) |
| Pasillos | 2 m o 4 m |
| Escala humana | Adulto 1,75 m; jugador infantil 1,30 m |
| Exteriores | Rejilla de colocación de 4 m |

Toda pieza de arquitectura encaja en la rejilla sin huecos ni solapes (validación, sección 8).

---

## 4. Topología y geometría

### 4.1 Geometría procedural (Three.js)

1. **Low-poly intencional**: forma por silueta y bisel, no por densidad.
2. **Bisel en toda arista visible**: 1 o 2 segmentos; 1 a 4 cm en muebles, 4 a 10
   cm en arquitectura y edificios. La primitiva `chamferBox` reemplaza a
   `BoxGeometry` en todo lo visible. `BoxGeometry` sin bisel solo se permite en
   caras ocultas o colisionadores.
3. **Normales**: caras planas con normal plana; el bisel lleva normales
   interpoladas para atrapar la luz (equivalente a "weighted normals"). Las
   primitivas lo resuelven; ninguna pieza llama a `computeVertexNormals()` sobre
   una malla biselada sin pasar por la utilidad de normales del kit.
4. **Geometría indexada y soldada**: sin vértices duplicados en la misma
   posición con la misma normal y UV (`mergeVertices` de `BufferGeometryUtils`).
5. **Sin caras ocultas**: la base apoyada en el piso, la cara trasera adosada a la
   pared y las caras entre módulos que se tocan no se generan.
6. **Sin caras degeneradas** (área menor a 1e-6 m²).
7. **Pivote**: props en el centro de la base; arquitectura en la esquina
   inferior del módulo sobre la rejilla; puertas en la bisagra o eje de
   deslizamiento; vehículos en el centro entre ejes, con ruedas como hijos.
8. **Fusión**: las piezas estáticas de una sala se fusionan en una malla por
   material al cargar la sala (`mergeGeometries`).
9. **Nombres**: `ID_variante` en inglés (`ST-W01_2m`).

### 4.2 Personajes (Blender, mallas deformables)

1. Quads en todo el cuerpo; triángulos solo donde no deforman.
2. Al menos 3 bucles en hombro, codo, muñeca, cadera, rodilla y tobillo; 2 en cuello y cintura.
3. Malla base en espejo sobre X.
4. Pelo, accesorios y cabeza como piezas rígidas unidas a un solo hueso.
5. Esqueleto de 20 a 24 huesos con nombres estándar en inglés.
6. Máximo 4 influencias por vértice, pesos normalizados (pesos automáticos de Blender y revisión).
7. A-pose de referencia.
8. Estilo A: cabeza facetada sin nariz ni boca, franja de ojos como geometría o
   color de paleta. Variante B: textura de cara de 256x256 generada por código.

---

## 5. Materiales

1. **Atlas de paleta** de 256x256 generado desde `palette.json`, con fila de
   emisivos. Las UV de cada cara caen en el cuadro de su color. Un material para casi toda la escena.
2. **Materiales permitidos (máximo 6)**:
   - `M_palette` (opaco, atlas de color y emisivo)
   - `M_glass` (vidrio teal y ventanas)
   - `M_sky` (cielo y ventanas con estrellas)
   - `M_terrain` (shader del terreno: biomas `jezero` y `polar`)
   - `M_hologram` (aditivo)
   - `M_screen` (pantallas con UI generada en canvas, compartidas por tipo)
3. **Emisivos** por la fila emisiva del atlas, nunca una luz real por tira LED.
4. **UI de pantallas**: máximo 8 texturas de canvas compartidas.

---

## 6. Iluminación

| Contexto | Estrategia |
|---|---|
| Interiores | Luz ambiental + hemisférica fría, emisivos con bloom, **AO por vértice precalculada** (build con `three-mesh-bvh`) + `n8ao` en tiempo real. Sin sombras dinámicas. |
| Exterior | Un sol direccional con sombras de 2048 que cubren solo el área cercana; luz hemisférica caramelo/óxido; AO por vértice en edificios + `n8ao`. |
| Personajes | Reciben ambiente + `n8ao`; sombra de contacto simple bajo los pies. |
| Postproceso | AgX o ACES (se elige en la sala piloto), bloom con umbral sobre emisivos, `n8ao`, SMAA. Profundidad de campo solo en tomas cinemáticas. |
| Presets | `AMB-01` a `AMB-08` de `INVENTARIO.md` 7.4, cada uno con luz, cielo, niebla y parámetros de postproceso. |
| Lightmaps de Blender | **No** por defecto. Solo si la sala piloto no pasa su gate con AO en tiempo real. |

---

## 7. Presupuestos de rendimiento

### 7.1 Hardware objetivo [S]

Supuesto a confirmar: portátil de gama media, 1920x1080, Chromium actual.
Objetivo 60 fps en recorridos; mínimo 45 fps en el plano más pesado. Celular:
modo "balanced" con resolución dinámica (idea a migrar de `mars-base-three`).

### 7.2 Triángulos por pieza (máximos)

| Tipo | Triángulos |
|---|---|
| Prop pequeño | 50 a 400 |
| Mueble | 300 a 1.500 |
| Mueble grande | 1.500 a 4.000 |
| Módulo de arquitectura | 100 a 1.200 |
| Cápsula hexagonal `MB-01` | 1.000 a 2.500 |
| Edificio grande | 3.000 a 12.000 |
| Vehículo e Iris | 3.000 a 8.000 |
| Personaje humano | 2.500 a 5.000 |
| Terreno visible | hasta 150.000 |

### 7.3 Por fotograma

| Métrica | Objetivo | Máximo |
|---|---|---|
| Draw calls | 150 | 300 |
| Triángulos visibles | 800.000 | 1.500.000 |
| Materiales únicos | 6 | 8 |
| Texturas en VRAM | 128 MB | 256 MB |
| Personajes animados visibles | 20 | 40 |
| Luces con sombra | 1 | 1 |
| Descarga inicial (gzip) | 25 MB | 40 MB |

Referencia medida: `mars-base-three`, vista exterior: 263 draw calls y unos
530.000 triángulos por fotograma (2026-11-25).

### 7.4 Técnicas obligatorias

1. `InstancedMesh` o `BatchedMesh` para todo lo que se repite más de 3 veces.
2. Fusión por sala de lo estático.
3. `THREE.LOD` en edificios y vehículos (3 niveles).
4. **Visibilidad por salas**: solo la sala actual y sus vecinas por puertas.
5. Carga por escena con pantalla de carga.
6. GLB de personajes comprimidos con `gltf-transform` (meshopt, KTX2).

---

## 8. Validación automática

### 8.1 Piezas procedurales (`tools/validate-pieces.ts`, corre en `vitest`)

Recorre el registro, construye cada pieza con sus variantes y verifica:

| Chequeo | Criterio |
|---|---|
| Triángulos | Dentro del rango de 7.2 según el tipo declarado |
| Duplicados | 0 vértices duplicados tras `mergeVertices` |
| Degenerados | 0 caras de área menor a 1e-6 m² |
| Materiales | Solo de la lista de 5.2 |
| Rejilla | Arquitectura con medidas múltiplo de la rejilla (tolerancia 1 mm) |
| Pivote | Caja envolvente coherente con la regla de 4.1.7 |
| Determinismo | Dos construcciones con la misma semilla dan el mismo hash de geometría |
| Registro | El ID existe en `INVENTARIO.md` |

### 8.2 Personajes (`tools/blender/validate.py`)

Triángulos, manifold, transformaciones aplicadas, máximo 4 influencias,
bucles en articulaciones, nombres de huesos.

### 8.3 Runtime

- Playwright recorre cada toma de cámara: draw calls, triángulos y tiempo de
  fotograma (p50, p95). Falla si supera 7.3. **Se mide con la ventana visible**
  (un panel oculto frena el render y falsea los FPS).
- Captura de cada toma a `docs/capturas/` para comparar con referencias.

---

## 9. Sistema de cámara

1. Tomas como JSON: puntos de posición y objetivo, FOV, duración, easing,
   profundidad de campo opcional, preset de ambiente y etiqueta de zona.
2. Trayectoria `CatmullRomCurve3` centrípeta, parametrizada por longitud de arco.
3. Secuencias: intro, showcase por zona, una por capítulo.
4. Herramienta de autor: cámara libre que graba puntos con una tecla y exporta JSON.
5. Sin atravesar geometría (raycast con `three-mesh-bvh`) y con alto mínimo.
   **Toda toma que entra a una sala arranca dentro de ella y mirando hacia
   adentro** (corrige el problema de `mars-base-three`).
6. Tests `vitest`: interpolación, continuidad de velocidad, colisión.

---

## 10. Guías de plataforma web (`modern-web-guidance`)

Repo `GoogleChrome/modern-web-guidance` (Apache-2.0; mantenido por los equipos
de Chrome, Edge, Firefox y MDN). Ya está instalado como skill en esta máquina y
Codex lo consulta solo. Cubre HTML, CSS y JS del navegador; **no cubre WebGL ni Three.js**.

| Dónde aplica | Guías |
|---|---|
| HUD, etiquetas de zona, menús y diálogos (DOM sobre el canvas) | `accessibility`, `natural-interactions`, `html`, `menu` |
| Recorridos de cámara e intro | `motion`: con `prefers-reduced-motion`, los vuelos de cámara se reemplazan por cortes o fundidos |
| Pantallas de carga | `progress`, `spinner` |
| Pausar el render fuera de pantalla | `efficient-background-processing` |

**No se usa:** `interactive-content-in-3d-scenes` ni
`expose-canvas-content-to-browser-features`. Dependen de `canvas-html`, que la
propia herramienta marca como volátil (un solo motor de navegador). Nadie activa
`set-allow-volatile-features`. La accesibilidad se resuelve con el HUD en DOM
y la lista de lugares en 2D que exige el repo del juego.

---

## 11. Evidencia de verificación (2026-11-25)

- `npm view`: three 0.187.0, @types/three 0.187.0, postprocessing 6.39.6, n8ao
  2.1.0, three-mesh-bvh 0.10.0 (peer `three >=0.159.0`), @gltf-transform/cli 4.5.1,
  stats-gl 4.2.3, vite 8.3.8, typescript 7.0.2, vitest 5.1.2, @playwright/test 1.65.1.
- `npm view postprocessing peerDependencies`: `three >=0.168.0 <0.188.0`.
- `npm pack three@0.187.0 --dry-run`: incluye `BatchedMesh`, `InstancedMesh`,
  `LOD`, `RoundedBoxGeometry`, `BufferGeometryUtils`, `DecalGeometry`, `RectAreaLightUniformsLib`.
- Blender 5.3.0 headless: exportador glTF con `export_skins`, `export_animations`,
  `export_yup`, `export_apply`; modificadores `WEIGHTED_NORMAL` y `DECIMATE`.
- `mars-base-three` (2026-11-25): conteo de geometrías por `grep`, 263 draw calls
  y ~530.000 triángulos medidos interceptando las llamadas de WebGL2 durante 2 s.
- No verificado: hardware de esta máquina (lectura denegada) y FPS reales (panel oculto).
