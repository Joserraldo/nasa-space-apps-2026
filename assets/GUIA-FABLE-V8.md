# Guía maestra de construcción 3D procedural (Atlas v8 + WebGL Three.js 0.160)

Documento de encargo técnico y dirección visual para construir desde cero el escenario 3D y los personajes de Solar Shield en código TypeScript + Three.js (`^0.160.0`, `WebGLRenderer`).

## 1. Regla de cero herencia del código 3D actual

- **Prohibido derivar diseño de la UI/escena actual:** las mallas, proporciones, cielo oscuro `#323272`, iluminación, paneles oscuros y visores opacos presentes actualmente en `ui/src/escena/modelos.ts`, `ui/src/escena/escena3d.ts`, `ui/src/estilos.css` y `ui/src/mision.css` corresponden al prototipo descartado ("Plan B"). No se toma nada visual de esos archivos ni de capturas actuales de `localhost:5173`.
- **Compatibilidad de contratos TypeScript:** únicamente se conservan o adaptan de forma compatible los tipos e interfaces exportados que consume `ui/src/escena/escena3d.ts` (`Materiales`, `ModeloModulo`, `ModeloAstronauta`, `ModeloExperto`, `ModeloIris`, `GestoIris`, `crearMateriales`, `crearTerreno`, `crearModulo`, `crearAstronauta`, `crearExpertos`, `crearIris`, `crearDecorado`, `activarSombras`, `liberarEscena`) mientras se reemplaza la implementación por fases.

### 1B. Reemplazo total de Inicio, HUD y CSS (Cero Plan B en la capa 2D)

Aunque la geometría 3D anterior ya fue neutralizada, **la capa HTML/CSS actual sigue siendo Plan B** y debe reemplazarse desde cero en lugar de "adaptarse":

- **Lo que queda prohibido copiar o reutilizar de la UI actual:**
  - La paleta y variables oscuras de `ui/src/estilos.css` (`#0b1026`, `#1a2350`, `color-scheme: dark`) y `ui/src/mision.css` (`--hud: #141a2b`, `--hud-edge: #2c3550`, `--life: #9be15d`), cuya cabecera aún referencia archivos descartados (`base-marte-jugable.html`, `solarshield-base-concepto.png`).
  - La pantalla de bienvenida actual en `ui/src/pantallas/Base3D.tsx`: el velo oscuro izquierdo `.vineta-mundo`, el bloque `.bienvenida-mision` (`ui.bienvenida.*`), el botón verde `.boton-despegar` y la tarjeta oscura `.comunicador-iris` mostrada en `"inicio"`.
  - El componente `<Hud estado={j.estado} />` renderizado incondicionalmente en `ui/src/App.tsx` cuando `puede3D` es `true`, incluyendo la fase `"inicio"`.
- **Única fuente visual autorizada para reemplazar esa interfaz:**
  - Portada / Inicio: `docs/referenciapau/referencias/inicio/01-inicio-actualizado.png` junto con las reglas de `docs/referenciapau/APLICACION.md`.
  - Sistema UI, logo, diálogos, botones y variantes: `docs/referenciapau/referencias/ui/00-logo-actual.png`, `01-dialogo-decision.png`, `02-botones-crew-map.png`, `03-variantes-facetadas.png` y `04-consulta-comparacion-fuente.png`.
  - Universo visual y paleta integral: `docs/referenciapau/ATLAS-V8.md` (texto completo curado) y `docs/referenciapau/Solar-Shield-Atlas-integral-v8.pdf`.
- **Regla operativa por bloques:** conservar la lógica `i18n`, los contratos con `engine/` y el respaldo 2D funcional en todo momento; la pantalla de **Inicio v8** entra temprano en el **Bloque 1** (primera impresión de 60 s para el jurado y ocultando `<Hud />` en `"inicio"`), y el reemplazo total de HUD, estilos (`estilos.css`, `mision.css`) y tarjetas facetadas v8 cierra en el **Bloque 3** (antes del congelamiento).
- **Alcance de carpetas:** editar solo dentro de `ui/` y `assets/`. No modificar `engine/`, `design/`, `missions/`, `data/`, `contracts/` ni `agents/`.

## 2. Fuentes visuales autorizadas (única verdad)

1. **Biblia técnica y visual v8 en Markdown (lectura principal rápida):** `docs/referenciapau/ATLAS-V8.md` (consolida los Capítulos 01–11 de las 68 páginas de `Solar-Shield-Atlas-integral-v8.pdf` e indexa las 50 láminas en `docs/referenciapau/referencias/`):
   - **Cap. 02:** pantalla de inicio única, intro y carga (`referencias/inicio/`).
   - **Cap. 03:** mundo abierto construido por código y adaptación realista de Marte (NASA Mars Trek).
   - **Cap. 04 y 04B:** familia de 8 estaciones, ampliación v8 y organización exterior (`referencias/estaciones/`, `referencias/exterior/`).
   - **Cap. 05:** assets individuales y nueve familias reutilizables (`referencias/piezas/`).
   - **Cap. 06:** personajes humanos e Iris rover (`referencias/personajes/`).
   - **Cap. 07, 08 y 09:** UI facetada (`referencias/ui/`), animaciones y arquitectura Three.js/React.
2. **Especificaciones de arquitectura, reutilización y UI:** `docs/referenciapau/README.md`, `docs/referenciapau/APLICACION.md`, `docs/referenciapau/AMPLIACION-ESPACIOS.md`, `docs/referenciapau/PLAN-IMPLEMENTACION-JEZERO.md`, `docs/referenciapau/catalogo-assets.json` y los PDFs de archivo (`Solar-Shield-Atlas-integral-v8.pdf`, `Solar-Shield-Plan-Jezero.pdf`).
3. **Galería indexada y deduplicada en GitHub (`50` PNGs optimizados):** `docs/referenciapau/referencias/` dividida en `inicio/`, `inicio/capas/`, `ui/`, `personajes/`, `estaciones/`, `piezas/` y `exterior/`. Todas las láminas curadas viven directamente en GitHub bajo esa carpeta; no asumir rutas antiguas (`inicio/`, `seleccion/`, `estaciones/`, `individuales/` o `laminas/`).
4. **Identidades detalladas de las 3 expertas y logo oficial:** definidas en `docs/referenciapau/referencias/personajes/` (`01`–`06`), `referencias/ui/00-logo-actual.png`, `ATLAS-V8.md` Cap. 06 y `APLICACION.md` §3.
5. **Esqueleto de medidas base (solo referencia inicial):** `docs/referenciapau/piezas-procedurales.js` sirve como punto de partida para unidades (`1 u = 1 m`), caché geométrica y `ExtrudeGeometry` con chaflán, teniendo presente la advertencia de `APLICACION.md`: ese archivo es solo un ensamblaje de bloque inicial y requiere biseles y siluetas más precisos para igualar las láminas.

### Exclusiones estrictas
- No reintroducir la mascota capibara, estatuas, humanoides de piedra, ruinas, templos, arcos pétreos ni árboles/pasto creciendo al aire libre en Marte.
- No crear GLBs externos ni importar Blender/GLTFLoader.
- No usar `WebGPURenderer` ni TSL ni librerías npm nuevas: todo debe correr sobre `three ^0.160.0` (`WebGLRenderer`) compatible con PCs antiguos y móviles (`docs/ORQUESTACION.md`).
- No usar cruces rojas en enfermería ni logos inventados de NASA.

## 3. Estándar de acabado procedural y adaptación realista de Marte (NASA + estética v8)

Tomar la **calidad de modelado e iluminación procedural**, conservando la estética low-poly v8 sobre una representación científicamente coherente del entorno marciano en **Jezero**:
- **Siluetas esculpidas, no primitivas crudas:** evitar cajas y esferas sin carácter. Construir capuchas/cascos facetados con bisel, cabellos asimétricos en planos low-poly, botas anchas, pliegues de traje, puertas/marcos con `Shape` + `ExtrudeGeometry` biselado, rocas basálticas irregulares (`IcosahedronGeometry` no indexada con desplazamiento determinista de vértices y `computeVertexNormals()`) y hojas facetadas con `BufferGeometry` propia (`flatShading: true`) únicamente dentro de hábitats o invernadero presurizado.
- **Geología y cielo marciano con base NASA:** ambientar el relieve y la topografía exterior de acuerdo con el DEM real de NASA Mars Trek para Jezero (`data/terreno/jezero/elevacion.bin`, `280 x 280`, `-3093 m` a `-501 m`, distinguiendo en UI lo medido de lo derivado), regolito oxidado facetado, horizonte craterizado y cielo diurno marciano cálido polvoriento dentro de la paleta pastel v8 (prohibido cielo azul nocturno de fantasía o vegetación/ruinas al aire libre). Mantener gravedad física real `GRAVEDAD_MARTE = 3.73` m/s² (NASA NSSDC) en `ui/src/escena/fisica.ts`.
- **Iluminación y lectura del Atlas v8:** luz amplia diurna superior izquierda cálida, sombras suaves en tonos lila/ciruela, niebla atmosférica marciana sutil y `PointLight` locales contenidos solo en faros, consolas activas o puntos de atención. Ajustar exposición y `ACESFilmicToneMapping` en conjunto con la paleta para que `#F3EEE5` / `#F3E3D9` no se torne gris oscuro.

## 4. Arquitectura modular estricta y reutilización (obligatorio)

Está prohibido duplicar mallas, materiales o código por cada edificio o personaje. Construir fábricas parametrizadas y cachés compartidas bajo `ui/src/escena/`:

1. **`ui/src/escena/materiales.ts` y `ui/src/escena/liberar.ts`**
   - Caché central de geometrías base inmutables (`Map<string, THREE.BufferGeometry>`) y slots de material definidos: `SuitBase`, `Accent`, `Boots`, `Skin`, `Hair`, `Glass`, `Emissive`, `Rock`, `Plant`.
   - Clonar únicamente el material `Accent` por instancia cuando cambie el rol; nunca reescribir el material compartido global ni borrar recursos compartidos al desmontar una sola instancia (compatible con doble mount de React 18 `StrictMode`).

2. **`ui/src/escena/activos/astronautas.ts` (familia modular de trajes y visores — leer `ATLAS-V8.md` Cap. 06 + `APLICACION.md` "Familia de astronautas y rover Iris" + `catalogo-assets.json` + `referencias/personajes/00-familia-trajes.png`)**
   - Jerarquía base y piezas compartidas parametrizables (`Root → Rig → Hips/Spine/Head/Arms/Legs`, `Socket_Hand_R`, `Socket_Back`, `Socket_Tether`): `crearCascoBase`, `crearVisorTransparente` (superficie transparente separada con `Glass`, sin doble capa coincidente ni visor opaco que tape la cara), `crearTorsoYCollar`, `crearMochilaModular`, `crearExtremidadesConBotaYGuante`.
   - Aplicar la corrección de `APLICACION.md`: la lámina `02-personajes-modulares.png` repitió por error el emblema de herramienta en otros trajes; conservar el distintivo propio de cada rol, el escudo de enfermería y el logo oficial sin copiar emblemas equivocados.
   - **Niño astronauta:** proporciones infantiles propias (cabeza/cuerpo y longitud de extremidades propias; prohibido reescalar uniformemente al adulto), traje marfil, collar/guantes teal/cian, botas índigo, rostro/cabello visibles del inicio; tether solo en escena orbital inicial, nunca sobre Marte.
   - **Tres expertas humanas adultas (`ingeniera`, `doctora`, `meteorologa`, más el rol `matematico`):** aunque las respuestas están respaldadas por agentes IA (`@solar-shield/agents`), **en pantalla y en arte 3D son personajes humanos** tal como quedaron definidas en `APLICACION.md`, el Cap. 06 y `assets/direccion-arte-v5/` (nunca convertir a los especialistas en robots). Comparten arquitectura base de traje adulto, casco/visor y mochila, pero conservando su cabeza, cabello, rostro, accesorios y silueta propios (no recolorear un mismo cuerpo):
     - `ingeniera`: cabello castaño rojizo, acentos naranja, tableta/herramienta en `Socket_Hand_R`.
     - `doctora`: piel morena, gafas octagonales, acentos teal, bolso lateral con emblema de escudo propio.
     - `meteorologa`: cabello plateado, acentos ciruela, instrumento de lectura solar.

3. **`ui/src/escena/activos/iris.ts`**
   - **Rol narrativo e interactivo (enrutador que falla al momento de decidir):** Iris (`ia_base`) es el robot guía y enrutador de la base (`tutorial` → `pistas` → `offline` según el rendimiento en `engine/src/ia.ts`), y **se daña por radiación (`danada`, paso 6) justo cuando el jugador ya es capaz de tomar decisiones**. Al dañarse, el jugador no puede obedecerla a ciegas: debe verificar con la Ingeniera (`verificarIris`) y la misión pasa a depender de las decisiones reales del jugador.
   - **Forma visual 3D:** rover solar compacto de 4 ruedas con pivotes independientes por rueda, panel solar en techo y pantalla frontal con ojos animados en canvas sin re-subir texturas cada frame cuando no hay cambio (mostrando de forma clara la falla visual cuando `iaBase === "danada"` / `irisRevision`). Nunca rig humano ni dron volador.

4. **`ui/src/escena/activos/piezasComunes.ts` y `ui/src/escena/activos/instancias.ts` (kit modular — leer Cap. 05 pág. 37 y Caps. 04/04B págs. 12 y 22 del PDF v8 + `AMPLIACION-ESPACIOS.md` §5 + `PLAN-IMPLEMENTACION-JEZERO.md` §3 + `APLICACION.md` §3 + `catalogo-assets.json`)**
   - Usar exactamente las familias reutilizables definidas en esos documentos (en lugar de inventar mallas únicas por sala):
     - **Envolvente exterior y conectores:** casco modular, panel de pared modulada (múltiplo de `1 m`), suelo modular/baldosas, ventana, cúpula facetada con aristas marcadas, rampa, **marco + puerta deslizante/corrediza** (con bisagras/pivotes laterales) y **corredores modulares con vigas/travesaños, montantes y costillas** en tramos rectos o uniones.
     - **Almacenaje, mobiliario y cultivos:** **estantería modular** (montante, travesaño, balda y fondo opcional), consola/mesa/silla, caja/contenedor y canisters, banco, armario/camilla/carrito, tanque, jardinera + hoja maestra de cultivo, tallo y fruto dentro de espacios protegidos.
     - **Servicios y energía exterior:** tubería modular (`recto`, `codo`, `T`), canaleta, luminaria, panel solar orientable sobre eje físico (`head_axis_separate`) y antena.
   - Agrupar estáticos idénticos repetidos (rocas menores, cajas, luminarias, baldosas) mediante `InstancedMesh` con mapa `instanceId -> assetId/lugar`. Mantener pivote base-centro para props y pivote de bisagra/eje para partes móviles o interactivas (`head_axis_separate`, hojas de puerta).

5. **`ui/src/escena/activos/estaciones.ts` y `ui/src/escena/activos/modulos.ts`**
   - Ensamblar las 8 estaciones abiertas en corte legible (`esclusa`, `control`, `invernadero`, `laboratorio`, `ingenieria`, `enfermeria`, `comedor`, `refugio`) conectadas por 2 circuitos transitables sobre anclajes `mundo.ts`, respetando los `LugarId` actuales y manteniendo colisiones separadas en `fisica.ts`.
   - Mapear los módulos construibles de Jezero (`panel_solar`, `invernadero`, `reciclador_agua`, `escudo`, `antena`) con `escena3d.ts` corrigiendo visibilidad: un módulo en estado `"ausente"` permanece oculto hasta que el motor confirme su construcción, diferenciando estado instalando vs. operativo.

## 5. Orden obligatorio de entrega (alineado con `docs/ORQUESTACION.md` P2, P3 y congelamiento; PRs < ~300 líneas)

0. **Bloque 0 — Conexión real al juego y `origin/develop` (`f8d5dec`, meta: `P2` hoy `22:00`):** rama `feat/ui-escena-3d` ya rebasada sobre `origin/develop` (`f8d5dec`), con `aterrizar()` (paso 3 + deltas por candidato en `ElegirSitio.tsx`), `puedeAplicar()` / `modulosColocados()` (módulos), `elegirDilema()` (`#144` en paso 6), tarjetas de ciencia con fuente y pregunta final (`Final.tsx`), y acceso opcional / invitado (`#109` en `Cuenta.tsx` sin bloquear el juego); mantener esos contratos intactos al construir los bloques 3D.
1. **Bloque 1 — Piloto 3D v8, Iris rover enrutador, Inicio v8 y prueba en celular/PC viejo (meta: dom `09:00`):** `materiales.ts`, `liberar.ts`, iluminación diurna pastel v8, presupuesto medible (`< 80` draw calls, `< 80 000` triángulos, DPR `1.5` / `1` en baja) + degradación automática (`3D completo → 3D liviano → respaldo 2D`) + **Niño astronauta** + **Iris rover 3D con estado dañado visible (`iaBase === "danada"`)** + **estación/piloto `Invernadero`** + **Pantalla de Inicio v8** (Cap. 02 / `01-inicio-actualizado.png`, quitando portada oscura y `<Hud />` en `"inicio"`, conservando el acceso opcional cuenta/invitado en barra), validados en `http://localhost:5173/`, celular y PC viejo antes de ampliar arte.
2. **Bloque 2 — Base compacta de Jezero, kit modular y 5 módulos (meta: `P3` dom `11:00`):** `piezasComunes.ts` (Cap. 05), `instancias.ts`, terreno facetado de Jezero, núcleo jugable (`mesa`, `habitat`, `taller`/anexo almacén, `sensor`) y los 5 módulos del motor (`panel_solar`, `invernadero`, `reciclador_agua`, `escudo`, `antena`). En `P3` (`11:00`) se aprueba fluidez 3D o conmutación al respaldo 2D.
3. **Bloque 3 — UI v8 completa y verificación integral (meta: dom `13:00` congelamiento; equivale al bloque pre-congelamiento de `docs/ORQUESTACION.md`):** reemplazar por completo `estilos.css`, `mision.css`, HUD de misión y tarjetas facetadas v8 (consulta con retratos humanos de las 3 expertas, comparación `Costs now / Later`, tormenta con `elegirDilema()`, cuenta/invitado, fuente NASA y pantalla final; Caps. 07–08); comprobar tercera/primera persona (`KeyV`), teclado, EN/ES, `npm run typecheck`, `npm test`, `npm run build` y E2E.
4. **Bloque 4 — Ampliación post-congelamiento (solo si sobra tiempo tras el congelamiento):** modelar cuerpos 3D de las 3 expertas humanas (`astronautas.ts`, Cap. 06) y ampliar interiores hacia las 8 estaciones completas con dos circuitos (`estaciones.ts`, Caps. 04 y 04B).

## 6. Buenas prácticas técnicas obligatorias (explícitas, nunca asumidas)

### Rendimiento WebGL y ciclo de vida (`three ^0.160.0`)
- **Presupuesto medible y calidad adaptativa:** topar **`< 80` draw calls** y **`< 80 000` triángulos** por vista; fijar **`renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))`** (y **`1`** en calidad baja); implementar degradación automática **`3D completo → 3D liviano → respaldo 2D`** y probar en celular y PC viejo desde el Bloque 1.
- **Cero asignaciones en el bucle `requestAnimationFrame`:** no instanciar `new THREE.Vector3()`, `Matrix4`, `BoxGeometry`, `Material` ni crear texturas dentro de `render` / `update`. Reutilizar variables temporales prealojadas fuera del bucle.
- **Luces y sombras contenidas:** máximo 1 luz direccional con `shadow.mapSize` de `1024x1024` (o menor en calidad baja) + 1 hemisférica + máximo 1–2 `PointLight` locales contenidos; activar `castShadow` solo en piezas heroicas/estructurales, nunca en gravilla ni partículas.
- **Cero reconstrucción de geometría por estado o frame:** rotar o escalar pivotes existentes (`solarPanel.head`, puertas, ruedas de Iris, extremidades) en lugar de regenerar buffers; actualizar matrices de `InstancedMesh` únicamente cuando cambie el estado del mundo.
- **Pausa y limpieza reales:** suspender actualización cuando `document.hidden` sea verdadero (`visibilitychange`), cancelar listeners, timers y `requestAnimationFrame` al desmontar, y liberar GPU con dueño explícito en `liberar.ts` sin romper cachés compartidas bajo doble montaje de React `StrictMode`.

### Arquitectura, invariantes jugables y calidad de código (Clean / DRY / SOLID)
- **Separación estricta de capas:** `ui/src/escena/` es puramente presentacional y determinista; lee el estado de `vista.ts` y jamás calcula costos, deltas, balance ni reglas del motor (`engine/`). Mantener la gravedad verificada en `ui/src/escena/fisica.ts` (`3.73 m/s²`, NASA NSSDC Mars Fact Sheet).
- **Los 5 invariantes integrados (`PLAN-IMPLEMENTACION-JEZERO.md` §6):**
  1. Doble clic o tecla + botón nunca cobra ni construye dos veces.
  2. Dos módulos elegidos sin antena/escudo no inventan bloqueos ni puertas nuevas de victoria/protección.
  3. Abrir/cerrar consulta conserva la pausa previa y devuelve foco al origen.
  4. Cambiar cámara (`KeyV`) o perder WebGL (`webglcontextlost`) conserva `GameState` y ofrece alternativa accesible sin reiniciar la misión.
  5. Efecto y daño en un mismo tick muestran saldo real y causas separadas sin repetir feedback al rerenderizar.
- **Funciones cortas y tablas de configuración:** cada fábrica de pieza debe tener una responsabilidad única, anidamiento superficial, retornos tempranos y parametrización mediante tablas/objetos de datos en lugar de cadenas `if/else` repetidas por módulo o especialista.
- **Física separada del arte:** mantener colisiones simples (cajas 2D/cápsula) y alturas en `ui/src/escena/fisica.ts` desacopladas de las mallas decorativas; aplicar escala real (`1 u = 1 m`) antes de registrar colliders e interactuables en `mundo.ts`.
- **Resiliencia WebGL:** conservar intacto el respaldo 2D ante ausencia o pérdida de contexto (`webglcontextlost`).

### Atribución NASA, accesibilidad, i18n y puerta de bloque
- **Atribución visible obligatoria:** conservar siempre en pantalla fuente, fecha de consulta, `"datos reales, no en vivo"` y `"proyecto no oficial, no avalado por NASA"` (`ui.aviso.nasa` y `<TarjetaFuente />`).
- **Textos 100% vía i18n (inglés por defecto y español):** cero literales visibles quemados en componentes ni horneados dentro de texturas 3D.
- **Controles y movimiento:** respetar `prefers-reduced-motion`, asegurar navegación completa por teclado (foco visible cian sin recortar por `clip-path`), áreas táctiles mínimas de `44 x 44 px`, equivalencia total entre cámara en tercera y primera persona (`KeyV`) y cero errores o advertencias WebGL en consola.
- **Puerta de aceptación por bloque:** ejecutar `npm run typecheck`, `npm test` y `npm run build`, y comparar captura en `http://localhost:5173/` contra la lámina v8 correspondiente antes de pasar al bloque siguiente.

## 7. Animaciones 3D/UI y coordinación paralela por `/loop`

- **Animaciones fluidas y accesibles (`ATLAS-V8.md` Cap. 08):**
  - Articular únicamente pivotes y grupos existentes en Three.js (ruedas independientes de Iris, eje `head_axis_separate` de paneles solares, hojas deslizantes de puerta, extremidades en `Root -> Rig`) y usar CSS / Web Animations API sobre nodos wrapper separados en UI (`cubic-bezier(.2,.8,.2,1)` / `(.4,0,1,1)`, `120–320 ms`).
  - Toda animación respeta `prefers-reduced-motion` (cancela derivas, giros y transiciones de cámara, conservando cambios reales de estado y foco visible) y se suspende con `document.hidden` (`visibilitychange`). Ninguna animación acredita recursos ni supera el tope de `< 80` draw calls y `< 80 000` triángulos.
- **Protocolo para delegar con `/loop` (`docs/LOOP.md` + `docs/ORQUESTACION.md`):**
  - `@solar-shield/engine` ya está conectado de punta a punta; las iteraciones ejecutan bloques secuenciales sin reescribir reglas del motor ni duplicar lógica.
  - Trabajar con **un coordinador principal y máximo 2–3 subagentes con propiedad de archivos estrictamente disjunta** (por ejemplo: geometría/activos en `ui/src/escena/`, componentes de pantalla/UI en `ui/src/pantallas/` y `ui/src/componentes/`, y verificación `typecheck` + `test` + `build` + captura visual), integrando cada bloque con su puerta de pruebas antes de abrir el siguiente.
