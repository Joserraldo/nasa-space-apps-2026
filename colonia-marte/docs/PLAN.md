# Plan de implementación: Colonia en Marte (capa visual)

Documento de traspaso para los agentes ejecutores (Codex y Carbon).
Autocontenido: no requiere leer la conversación de origen.

## Documentos del proyecto (leer en este orden)

1. `docs/PLAN.md`: este archivo. Qué se hace, quién y en qué orden.
2. `docs/DECISIONES.md`: decisiones tomadas (campaña, nombres, stack híbrido, modularidad, referencias).
3. `docs/DISENO-JUEGO.md`: público, historia, intro, campaña de 5 capítulos, salas por capítulo y ambientes.
4. `docs/ESPECIFICACION-TECNICA.md`: reglas duras de stack, arquitectura modular,
   topología, materiales, luz, rendimiento, validación y cámara.
5. `docs/INVENTARIO.md`: catálogo de todo lo que se construye, con IDs.
6. `docs/restricciones-visuales.md`: lo que el usuario rechazó. Releer antes de cada ronda visual.
7. `docs/referencias/v1|v2|v3/`: fotogramas de referencia. **Se conservan; nadie los borra** (DV-05).

Contexto externo (solo lectura):
- Repo del juego, `https://github.com/Joserraldo/nasa-space-apps-2026` rama
  `develop`: motor, misiones y agentes. Esta capa **no lo modifica**. Su
  `docs/referenciapau/MARTE.md` es obligatorio: cielo caramelo de día, nada de
  vegetación ni agua afuera, nieve solo en el polo.
- Prototipo `C:\Users\mpaul\Documents\mars-base-three`: se reutilizan ideas y
  algunos módulos (DV-03), **no se edita**.

---

## Estado de los gates

| Gate | Estado | Fecha | Evidencia |
|---|---|---|---|
| Prueba del comedor | Aprobada por María Paula | 2026-11-25 | `docs/capturas/spike-comedor-*.jpg` |
| WS0 | Aprobado con correcciones (D1-D3 resueltas en WS1) | 2026-11-25 | `docs/capturas/ws0-revision.md` |
| WS1 | **Aprobado por María Paula** | 2026-11-25 | `docs/capturas/ws1-revision.md`; suelo de Jezero provisional hasta el gate de WS2 |
| T4.2 + WS2 | **Aprobado por María Paula**, con ajuste menor: hielo polar en tono frío y bordes suaves | 2026-11-25 | `docs/capturas/correcciones-2-revision.md` |
| T6.1 (personaje base) | **Aprobado por María Paula**, con ajuste menor: botas oscuras, torso que se estrecha, piernas algo más cortas | 2026-11-25 | `docs/capturas/correcciones-2-revision.md` |
| Carbon T4.1, T2.4, T4.3 | Aprobado con correcciones (K1 antes de T5.1) | 2026-11-25 | worktree Carbon: `docs/capturas/carbon-t41-revision.md` |
| T5.2 parcial (NW-05 esclusa, NW-01 servidores) | **Aprobado por María Paula** con correcciones de contraste (cian integrado, zonas oscuras de piso, marcos oscuros) | 2026-11-25 | worktree Carbon: `t52-nw-05.jpg`, `t52-nw-01.jpg`; encargo `carbon-t52-continuar.md` |
| Tripulación Q3 (Tess, Nia, Vera, Teo) | Construida desde Quaternius sin editar la malla (decisión de María Paula) | 2026-11-25 | `docs/capturas/q3-tripulacion.jpg`, commit `0eb29a0` |

Ramas: `main` (snapshot inicial) → `ws0-kit` → `ws7-camera` → `ws1-palette`.
Carbon trabaja en un worktree aparte (ver `docs/prompts/carbon-arranque.md`).

## Prueba previa aprobada (2026-11-25)

`spikes/comedor/` demostró la dirección visual con Three.js puro y fue aprobada
por María Paula. Capturas: `docs/capturas/spike-comedor-*.jpg`.

- **Base para WS0:** `spikes/comedor/src/kit/` (registro por ID, `chamferBox` por
  envolvente convexa con chaflán plano, `extrudeProfile`, `polygonRing`,
  `chamferRect`, `block`, `led`), `src/room.ts` (sala desde JSON y fusión estática
  por material) y `src/main.ts` (bloom, `n8ao`, SMAA, ACES, HUD de métricas).
  T0.2, T0.3 y T0.5 parten de ese código, lo pasan a la estructura de la
  sección 3 y le agregan tests. `spikes/` no se modifica: queda como evidencia.
- **Medido:** 136 piezas, 45 draw calls, ~29.000 triángulos, 15 materiales.
- **Pendientes de la prueba que resuelve T5.1:** dispensadores con más detalle
  (carcasa gruesa, arco cian, pantalla grande con ilustración), blancos más
  cálidos y sombras de contacto más marcadas, incrustaciones curvas en el piso,
  y medir FPS con la ventana visible.
- **Gotcha:** el atlas de paleta todavía no existe; la prueba usa un material por
  color (15). WS1 lo reemplaza por el atlas sin cambiar las piezas.
- **Observación de María Paula (2026-11-25):** "las luces fallan un poquito,
  pero lo veo muy muy bien". Para revisar en T5.1: la lámpara anular está
  sobreexpuesta, faltan sombras de contacto bajo mesas y sillas, el tono es frío
  y uniforme, y las tiras LED se ven con poco halo. Precisar con ella en el gate
  de T5.1 qué parte falla.

---

## 0. Reglas de ejecución

1. **Alcance: solo lo visual.** Piezas, salas, colonia, personajes, ambientes y
   **recorridos de cámara listos**. La lógica de misiones queda en el repo del juego.
2. **Misma estética, no copia** de los asset packs de referencia.
3. **Todo por código.** Three.js procedural para todo; Blender headless solo para
   personajes humanos (DV-03). Nada se edita a mano en un editor 3D.
4. **Todo modular** (DV-04): primitivas → piezas → conjuntos → layouts (JSON) → escenas.
5. **Gates**: en un gate `[APROBACIÓN]` el agente se detiene, entrega capturas
   lado a lado con la referencia y espera el visto bueno. Nada se produce en
   lote sobre una dirección visual no aprobada.
6. Todo rechazo va a `docs/restricciones-visuales.md`. Dos rechazos por el
   mismo motivo: parar y proponer otra estrategia.
7. **Reportes**: separar VERIFICADO (comando y salida, o captura) de NO VERIFICADO.
8. **Propiedad de archivos**: cada frente escribe solo en sus carpetas (sección 3).
9. **Dependencias**: solo las de la especificación, con versiones fijadas.
10. **Git local**, una rama por frente, commits convencionales, sin push.

---

## 1. Ejecutores, modelos y esfuerzo

| Ejecutor | Modelo | Estado | Rol |
|---|---|---|---|
| **Codex** (`codex-cli` 0.166.0) | `gpt-6.1-sol`, esfuerzo por defecto `high` (de `~/.codex/config.toml`) | VERIFICADO | Infraestructura del kit, shaders, terreno, ambientes, cámara, personajes en Blender, ensamblado, rendimiento |
| **Carbon** (en Antigravity IDE) | Gemini "Carbon", según el usuario | Antigravity instalado (VERIFICADO); nombre exacto del modelo y niveles de esfuerzo **no verificados** | Piezas procedurales del inventario (arquitectura, mobiliario, edificios, vehículos) y layouts de salas |
| Revisor (Claude) | el de la sesión | disponible | Revisa cada gate contra la especificación y las referencias |

| Esfuerzo | Cuándo |
|---|---|
| `xhigh` | Difícil de revertir: arquitectura del kit, rig y topología de personajes |
| `high` | Primitivas, shaders, ambientes, cámara, AO, rendimiento |
| `medium` | Piezas con receta clara en el inventario |
| `low` | Variantes de una pieza ya aprobada |

Si Carbon no está disponible, sus tareas pasan a Codex sin cambiar el orden.

---

## 2. Frentes de trabajo

```
WS0 Kit e infraestructura ──┬─> WS1 Paleta y materiales ──┬─> WS2 Terreno, cielo y ambientes ──> WS3 Piezas exteriores ─┐
                            │                             ├─> WS4 Piezas interiores ──> WS5 Salas (layouts) ───────────┤
                            │                             └─> WS6 Personajes (Blender) e Iris ─────────────────────────┤
                            └─> WS7 Cámara (en paralelo desde el inicio) ──────────────────────────────────────────────┤
                                                                                                                       v
                                                                                     WS8 Ensamblado, recorridos y rendimiento
```

| Frente | Ejecutor | En paralelo con |
|---|---|---|
| WS0 Kit e infraestructura | Codex | WS7 |
| WS1 Paleta y materiales | Codex | WS7 |
| WS2 Terreno, cielo y ambientes | Codex | WS4, WS6, WS7 |
| WS3 Piezas exteriores | Carbon | WS5, WS6 |
| WS4 Piezas interiores | Carbon | WS2, WS6 |
| WS5 Salas por layout | Carbon | WS3, WS6 |
| WS6 Personajes e Iris | Codex | WS2 a WS5 |
| WS7 Cámara | Codex | todos |
| WS8 Ensamblado y rendimiento | Codex | al final |

---

## 3. Estructura del repo y propiedad

```
/
├─ docs/                              todos (solo lectura salvo capturas/ y restricciones)
├─ palette.json                       WS1
├─ data/
│  ├─ layouts/rooms/                  WS5  una sala por JSON
│  ├─ layouts/colony/                 WS5  colonia por capítulo (c1.json ... final.json)
│  └─ shots/                          WS7  tomas y secuencias
├─ src/
│  ├─ core/                           WS0  renderer, composer, loop, carga, visibilidad por salas
│  ├─ kit/
│  │  ├─ registry.ts                  WS0
│  │  ├─ primitives/                  WS0  chamferBox, extrudeProfile, panelInset, ledStrip, pipeRun...
│  │  ├─ pieces/station/              WS4  ST-*, DN-*, NW-* y demás interiores
│  │  ├─ pieces/mars/                 WS3  MB-*, MI-*, MV-*, NX-*
│  │  ├─ pieces/crew/                 WS6  CH-09 Iris y cargador de personajes GLB
│  │  └─ sets/                        WS4/WS3
│  ├─ materials/                      WS1
│  ├─ environment/                    WS2  terreno, cielo, presets AMB-*
│  ├─ camera/                         WS7
│  ├─ navigation/                     WS0  migrado de mars-base-three (modos, joystick)
│  ├─ ui/                             WS7  etiquetas de zona
│  ├─ scenes/                         WS8
│  └─ catalog/                        WS0  página /catalog con todas las piezas
├─ tools/
│  ├─ validate-pieces.ts              WS0
│  ├─ bake-vertex-ao.ts               WS4  AO por vértice con three-mesh-bvh
│  └─ blender/                        WS6  scripts bpy de personajes, validate.py, run.ps1
├─ public/models/characters/          WS6  GLB generados (nadie los edita a mano)
└─ tests/ unit/ visual/ perf/
```

---

## 4. Tareas

### WS0. Kit e infraestructura

| ID | Tarea | Ejec. | Esf. | Dep. | Aceptación |
|---|---|---|---|---|---|
| T0.1 | Git, Vite + TS, dependencias con versiones fijadas | Codex | medium | — | `npm run build` sin errores; `three` en `0.187.0` exacto |
| T0.2 | Registro de piezas por ID con tipos de parámetros y caché de geometría | Codex | xhigh | T0.1 | Tests: registrar, construir, cachear, rechazar IDs que no están en el inventario |
| T0.3 | Primitivas biseladas: `chamferBox`, `extrudeProfile` (perfil 2D con bisel), `panelInset`, `ledStrip`, `pipeRun`, `truncatedIcosa`, `geodesicHalf` | Codex | high | T0.2 | Hoja de primitivas en `/catalog`; pasan `validate-pieces` |
| T0.4 | `validate-pieces.ts` con todos los chequeos de la especificación 8.1 | Codex | high | T0.3 | Una pieza rota a propósito falla cada chequeo |
| T0.5 | Escena base: renderer, `postprocessing`, bloom, `n8ao`, SMAA, `stats-gl`, overlay de draw calls y triángulos | Codex | high | T0.1 | Captura con métricas visibles |
| T0.6 | Página `/catalog`: cada pieza registrada con sus variantes y su conteo de triángulos | Codex | medium | T0.2, T0.5 | Captura |
| T0.7 | Migrar de `mars-base-three` la navegación (modos, joystick virtual) y el optimizador de celular, adaptados a TS y al kit | Codex | medium | T0.5 | Caminar con teclado y joystick en la escena base |

**GATE WS0** (automático): T0.1 a T0.7 con evidencia.

### WS1. Paleta y materiales

| ID | Tarea | Ejec. | Esf. | Dep. | Aceptación |
|---|---|---|---|---|---|
| T1.1 | Medir colores sobre los fotogramas y escribir `palette.json` (incluye `INVENTARIO.md` 6.5) | Codex | medium | — | Tabla de color medido por fotograma y coordenada |
| T1.2 | Atlas de paleta de 256x256 con fila de emisivos, generado desde `palette.json` | Codex | high | T1.1 | Atlas en `/catalog` |
| T1.3 | Los 6 materiales de la especificación 5.2 | Codex | high | T1.2 | Esfera por material en `/catalog` |
| T1.4 | Texturas de UI de pantallas (máximo 8) en canvas | Codex | medium | T1.3 | Hoja de las 8 UI |

**GATE WS1** `[APROBACIÓN]`: materiales y atlas junto a referencias.

### WS2. Terreno, cielo y ambientes

| ID | Tarea | Ejec. | Esf. | Dep. | Aceptación |
|---|---|---|---|---|---|
| T2.1 | Terreno bioma `jezero` (óxido, relieve del DEM real del repo del juego) con LOD y como máximo 150.000 triángulos visibles | Codex | high | WS1 | Métricas en captura |
| T2.2 | Bioma `polar` con hielo de borde duro (solo C5) | Codex | high | T2.1 | Captura junto a `v3/v3-t034.80.jpg` |
| T2.3 | Montañas de fondo y cielo caramelo de día, sin anillo planetario | Codex | medium | T2.1 | Captura revisada contra `MARTE.md` |
| T2.4 | Rocas, pilares y meseta `MT-T04/05/06` | Carbon | medium | T0.3 | Pasan `validate-pieces` |
| T2.5 | Presets `AMB-01` a `AMB-08` | Codex | high | T2.3, T1.3 | Una captura por preset desde la misma vista |

**GATE WS2** `[APROBACIÓN]`: Jezero a nivel del suelo y el polo, con sus presets.

### WS3. Piezas exteriores

| ID | Tarea | Ejec. | Esf. | Dep. | Aceptación |
|---|---|---|---|---|---|
| T3.1 | **Piloto exterior**: `MB-01` x4 + `MB-02` + `MB-03` + `MB-04` + `MB-07` + `MI-03/04/06` sobre el bioma `jezero` | Carbon | high | WS1, WS2 | Captura junto a `v3/v3-t054.60.jpg`; pasan `validate-pieces` |
| T3.2 | Edificios P2 (`MB-05`, `MB-08` a `MB-11`) con 3 LOD | Carbon | medium | GATE T3.1 | LOD revisados en captura |
| T3.3 | Infraestructura P2 (`MI-01/02/05/07/09/10`) y `NX-01/02/04` | Carbon | medium | GATE T3.1 | Pasan `validate-pieces` |
| T3.4 | Vehículos `MV-01/02/03` con ruedas como hijos y 3 LOD | Carbon | medium | GATE T3.1 | Ruedas giran sobre su eje |
| T3.5 | Naves `MV-09` y `MV-10`; rover varado `MV-11` | Carbon | medium | GATE T3.1 | Captura en la toma de la intro |
| T3.6 | P3 (`MB-06`, `MB-12` a `MB-14`, `MV-04` a `MV-08`, `MI-08/11`, `NX-03`) | Carbon | low | T3.2 | Solo si sobra tiempo |

**GATE T3.1** `[APROBACIÓN]`: define la dirección de todo el exterior.

### WS4. Piezas interiores

| ID | Tarea | Ejec. | Esf. | Dep. | Aceptación |
|---|---|---|---|---|---|
| T4.1 | Arquitectura P1 sobre la rejilla de 2 m (`ST-W01/02/03/07`, `ST-C01`, `ST-D01/03`, `ST-F01/04`, `ST-R01/02/04`) | Carbon | high | T0.3, WS1 | Pasa el chequeo de rejilla; hoja en `/catalog` |
| T4.2 | `bake-vertex-ao.ts`: AO por vértice con `three-mesh-bvh` para salas fusionadas | Codex | high | T4.1 | Sala de prueba de 3 módulos con y sin AO, lado a lado; tiempo de cálculo medido |
| T4.3 | Mobiliario y props P1 de las salas de la rebanada vertical (`DN-*`, `PR-*`, `NW-01-*`, `NW-02-*`, `NX-05`, `NW-05-*`) | Carbon | medium | T4.1 | Pasan `validate-pieces` |
| T4.4 | Arquitectura P2 restante (`ST-*`) | Carbon | medium | GATE T5.1 | Pasan `validate-pieces` |
| T4.5 | Mobiliario P2 del resto de salas (`AT-*`, `BR-*`, `CF-*`, `CR-*`, `GY-*`, `EN-*`, `AP-*`, `BT-*`, `LD-*`, `BA-*`, `NW-*`) | Carbon | medium | GATE T5.1 | Pasan `validate-pieces` |

### WS5. Salas por layout

| ID | Tarea | Ejec. | Esf. | Dep. | Aceptación |
|---|---|---|---|---|---|
| T5.0 | Esquema JSON de layout de sala (celdas, piezas por ID, rotación, parámetros, puertas) con validación | Codex | high | T0.2 | Tests de esquema; un layout con un ID inválido falla |
| T5.1 | **Sala piloto: comedor** con layout JSON, AO por vértice y `AMB-02` | Carbon | high | T4.1 a T4.3, T5.0 | Captura junto a `v2/v2-t017.10.jpg` y `v1/v1-t021.50.jpg` |
| T5.2 | Salas de la rebanada vertical (intro + C2 + C3): `NW-15/16/17`, `NW-05`, `NW-12`, `NW-14`, `NW-09`, `NW-01`, `NW-13`, `NW-02`, `NW-08` | Carbon | medium | GATE T5.1 | Una captura por sala |
| T5.3 | Salas de C4 y C5: `NW-03`, `NW-04`, `NW-06`, `NW-07`, `NW-10`, `NW-18`, `NW-19` | Carbon | medium | T5.2 | Una captura por sala |
| T5.4 | Salas de V1 que entran en la colonia: atrio con balcón, gimnasio, entretenimiento, departamentos, baño, lavandería, bar | Carbon | medium | T5.2 | Una captura por sala junto a su referencia |
| T5.5 | Layout de la colonia por capítulo (`c1` a `final`): qué salas existen y cómo se conectan; toda salida al exterior pasa por `NW-05` | Codex | high | T5.2 | Test del grafo: sin salas aisladas |

**GATE T5.1** `[APROBACIÓN]`: define la dirección de todo el interior. Si la AO
en tiempo real no alcanza, aquí se decide si se activan lightmaps de Blender.

### WS6. Personajes e Iris

| ID | Tarea | Ejec. | Esf. | Dep. | Aceptación |
|---|---|---|---|---|---|
| T6.0 | Revisar `mars-base-three/assets/blender/kid_astronaut.blend` y decidir qué se aprovecha; montar `tools/blender/run.ps1` y `validate.py` | Codex | high | T0.1 | Informe corto; exporta un GLB de prueba |
| T6.1 | Malla base estilo A con topología de deformación y esqueleto de 20 a 24 huesos (`bpy`) | Codex | xhigh | T6.0, WS1 | Pasa `validate.py`; captura en A-pose junto a `v1/v1-t039.90.jpg` |
| T6.2 | Variantes: vestuario, peinado, piel, accesorios (`CH-01` a `CH-04`) y los 4 personajes con nombre: Tess, Nia, Vera, Teo | Codex | high | GATE T6.1 | Hoja de los 4 + 8 variantes |
| T6.3 | Poses y animaciones (idle, caminar, sentarse, gestos de personalidad de la intro) por keyframes desde código | Codex | high | T6.2 | Secuencia de capturas |
| T6.4 | Jugador `CH-10` (proporción infantil, personalizable) y EVA `CH-06`; `CH-07/08` | Codex | high | T6.2 | Hoja de combinaciones |
| T6.5 | **Iris** `CH-09` en Three.js: rover rígido con pantalla de cara y 5 expresiones | Codex | high | T0.3, WS1 | Hoja de expresiones; pasa `validate-pieces` |

**GATE T6.1** `[APROBACIÓN]`: el personaje base define todo el elenco.

### WS7. Cámara

| ID | Tarea | Ejec. | Esf. | Dep. | Aceptación |
|---|---|---|---|---|---|
| T7.1 | Formato JSON de toma y secuencia con validación | Codex | high | T0.1 | Tests de esquema |
| T7.2 | Reproductor: Catmull-Rom centrípeta, velocidad constante, easing, cortes y fundidos | Codex | high | T7.1 | Tests de continuidad de velocidad |
| T7.3 | Herramienta de autor: cámara libre que graba puntos y exporta JSON | Codex | high | T7.2 | Demo grabada |
| T7.4 | Colisión con `three-mesh-bvh` y regla de "entrar a una sala mirando hacia adentro" | Codex | medium | T7.2 | Test con una toma que atraviesa una pared y falla |
| T7.5 | Etiquetas de zona HUD | Codex | medium | T7.2 | Captura junto a `v1/v1-t021.50.jpg` |
| T7.6 | Profundidad de campo por toma | Codex | medium | T7.2 | Captura junto a `v3/v3-t016.40.jpg` |
| T7.7 | Intro: 7 tomas de `DISENO-JUEGO.md` 3.3 en `data/shots/intro.json` | Codex | high | T7.2, T2.5, T5.2, T6.3 | Secuencia de capturas de la intro completa |

### WS8. Ensamblado, recorridos y rendimiento

| ID | Tarea | Ejec. | Esf. | Dep. | Aceptación |
|---|---|---|---|---|---|
| T8.1 | Escena exterior por capítulo desde `data/layouts/colony/` (instancias, LOD) | Codex | high | WS2, WS3, T5.5 | Dentro de presupuesto |
| T8.2 | Escena interior: carga de layouts y visibilidad por salas | Codex | high | WS5 | Draw calls por sala dentro de presupuesto |
| T8.3 | Transición exterior a interior por la esclusa | Codex | high | T8.1, T8.2 | Recorrido sin cortes de carga visibles |
| T8.4 | Secuencias showcase por zona y por sala | Codex | medium | WS7, T8.1, T8.2 | Una captura por toma |
| T8.5 | Secuencias por capítulo (C1 a C5 y final) | Codex | medium | T8.4, T7.7 | Una secuencia por capítulo |
| T8.6 | Test de rendimiento Playwright con la ventana visible | Codex | high | T8.4 | p50/p95; falla si supera la especificación 7.3 |
| T8.7 | README: regenerar personajes, correr la escena y los tests | Codex | low | T8.6 | Regeneración completa con un comando |

**GATE FINAL** `[APROBACIÓN]`.

---

## 5. Orden de arranque

1. Codex: WS0 y T7.1-T7.2 en paralelo.
2. Codex: WS1. **Gate.**
3. En paralelo: Codex en WS2, T6.0-T6.1 y T6.5; Carbon en T4.1 y T2.4.
4. Pilotos: T3.1 (exterior), T5.1 (comedor), T6.1 (personaje). **Nada en lote antes de aprobarlos.**
5. Producción: Carbon en WS3, WS4 y WS5; Codex en WS6 y WS7.
6. Codex: WS8. **Gate final.**

---

## 6. Pendientes

| Pendiente | Bloquea | Quién |
|---|---|---|
| Comunicar al equipo del juego las decisiones DV-01 a DV-03 | La integración posterior, no esta producción | María Paula |
| Búsqueda de marcas de los nombres Tess, Nia, Vera y Teo | Publicación | María Paula |
| Hardware objetivo real | Ajuste de presupuestos (especificación 7.1) | María Paula |
