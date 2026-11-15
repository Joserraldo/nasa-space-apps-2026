# Cómo construir la referencia: capas, piezas, animaciones y Marte realista

**Vigente · María Paula (`Paulasaah`) · Atlas v8 + [`ATLAS-V8.md`](ATLAS-V8.md) · Construcción por código con Three.js `^0.160.0` (`WebGLRenderer`) y React 18.**

El inicio, los personajes, las estaciones y los controles ya están curados en [`referencias/`](referencias/) y resumidos en [`ATLAS-V8.md`](ATLAS-V8.md). Este documento especifica cómo llevar esa dirección visual a `ui/src/`, unifica su índice directo con las imágenes optimizadas y fija los criterios de **animación fluida**, **adaptación realista de Marte (NASA)** y **cero herencia de Plan B**.

## 1. Índice visual de entregas y uso correcto en código

| Categoría | Archivos en [`referencias/`](referencias/) | Uso correcto en `ui/src/` |
| --- | --- | --- |
| Inicio e intro | [`inicio/01-inicio-actualizado.png`](referencias/inicio/01-inicio-actualizado.png), [`00-inicio-original.png`](referencias/inicio/00-inicio-original.png), [`02-intro-cuatro-momentos.png`](referencias/inicio/02-intro-cuatro-momentos.png), [`03-panel-carga.png`](referencias/inicio/03-panel-carga.png) | Composición de referencia. UI y botones reales van siempre en DOM traducible EN/ES sobre render WebGL. |
| Capas orbitales | [`inicio/capas/astronauta.png`](referencias/inicio/capas/astronauta.png), [`nave.png`](referencias/inicio/capas/nave.png), [`planeta.png`](referencias/inicio/capas/planeta.png), [`asteroide.png`](referencias/inicio/capas/asteroide.png) | Guías alpha de silueta y anclaje (`Socket_Tether`); se reconstruyen en Three.js con geometría y pivotes. |
| Sistema UI y logo | [`ui/00-logo-actual.png`](referencias/ui/00-logo-actual.png), [`01-dialogo-decision.png`](referencias/ui/01-dialogo-decision.png), [`02-botones-crew-map.png`](referencias/ui/02-botones-crew-map.png), [`03-variantes-facetadas.png`](referencias/ui/03-variantes-facetadas.png), [`04-consulta-comparacion-fuente.png`](referencias/ui/04-consulta-comparacion-fuente.png) | Familia única de tarjetas marfil facetadas, variantes de estado, consulta y comparación `Costs now / Later`. |
| Personajes humanos | [`personajes/00-familia-trajes.png`](referencias/personajes/00-familia-trajes.png), [`01–02 ingeniera`](referencias/personajes/01-ingeniera-poses.png), [`03–04 doctora`](referencias/personajes/03-doctora-poses.png), [`05–06 meteorologa`](referencias/personajes/05-meteorologa-poses.png), [`07-tripulacion-mecanicas.png`](referencias/personajes/07-tripulacion-mecanicas.png) | Niños y adultas siempre humanos (nunca robots). En `00-familia-trajes.png` ignorar el emblema repetido por error y respetar el distintivo individual de `01`–`06`. |
| Estaciones (`8` + `04B`) | [`estaciones/00-panorama-estaciones-y-piezas.png`](referencias/estaciones/00-panorama-estaciones-y-piezas.png), [`01-esclusa.png`](referencias/estaciones/01-esclusa.png) a [`08-refugio.png`](referencias/estaciones/08-refugio.png) + ampliaciones `02b`–`07c` | Cortes abiertos por familia modular sobre los `LugarId` actuales de `mundo.ts`; sin candado secuencial. |
| Piezas y kits | [`piezas/01-puerta-marco.png`](referencias/piezas/01-puerta-marco.png) a [`10-kit-exterior-modular.png`](referencias/piezas/10-kit-exterior-modular.png) | Catálogo de átomos e instancias compartidas; coincide con [`catalogo-assets.json`](catalogo-assets.json) y [`piezas-procedurales.js`](piezas-procedurales.js) (como base estructural, nunca como bisel final). |
| Exteriores y corredores | [`exterior/01-corredores-conexiones.png`](referencias/exterior/01-corredores-conexiones.png), [`02-kit-entorno-cultivos.png`](referencias/exterior/02-kit-entorno-cultivos.png), [`03-exterior-organizacion.png`](referencias/exterior/03-exterior-organizacion.png) | Dos circuitos en bucle, atajos y entorno árido marciano separado de cultivos protegidos. |

> **Aclaración técnica:** [`piezas-procedurales.js`](piezas-procedurales.js) exporta fábricas geométricas iniciales de referencia (`door`, `consoleUnit`, `crate`, `solarPanel`, `planter`, `tank`, `bench`, `antenna`, `rock`, `plant`, `station`, `astronaut`), pero su acabado es de bloques iniciales y no iguala por sí solo las siluetas y chaflanes curados de [`referencias/`](referencias/). En producción (`ui/src/escena/`), usar TypeScript + caché de geometrías/materiales de `assets/GUIA-FABLE-V8.md`.

### Ruta principal: mundo abierto y adaptación realista de Marte (NASA + estética v8)

Three.js `0.160.0` construye toda la geometría y renderiza con `WebGLRenderer`: `BufferGeometry` para facetas nítidas, `Shape` + `ExtrudeGeometry` para marcos y chaflanes, grupos con pivotes para articulación y `InstancedMesh` para repetidos estáticos. GLB/Blender no son requisitos.

| Elemento abierto | Receta procedural y adaptación científica NASA |
| --- | --- |
| Terreno de Jezero | Triángulos `BufferGeometry` facetados coherentes con el DEM real de NASA Mars Trek (`data/terreno/jezero/elevacion.bin`, `280 x 280`, `-3093 m` a `-501 m`). Semilla decorativa separada del RNG de misión; distinguir altura real medida de micro-relieve decorativo. |
| Rocas y bordes de cráter | `IcosahedronGeometry` / buffers deformados con normales facetadas (`flatShading: true`) representando regolito férrico oxidado y basaltos de Jezero, nunca ruinas ni estatuas. |
| Atmósfera y luz diurna | Luz direccional cálida superior izquierda (`shadow.mapSize <= 1024`) + hemisférica + cielo diurno marciano cálido polvoriento en la gama pastel v8 y sombras suaves lila/ciruela; calibrar `ACESFilmicToneMapping` y exposición para que marfil `#F3EEE5` no se vuelva gris oscuro. |
| Gravedad y física | Separada de las mallas en `ui/src/escena/fisica.ts` con `GRAVEDAD_MARTE = 3.73` m/s² (NASA NSSDC Mars Fact Sheet) y colliders simples base-centro. |
| Caminos y conexiones | Baldosas, rampas bajas y pasillos modulares sobre anclajes `mundo.ts`; dos bucles navegables sin progresión lineal bloqueada. |
| Paneles solares | Base, soporte, eje separado (`head_axis_separate`), bastidor y celdas repetidas. Rotar el eje físico sin reconstruir geometría por frame ni atribuir generación eléctrica fuera de `engine/`. |
| Cultivos protegidos | Tallo, hoja maestra con volumen facetado, jardinera y frutos exclusivamente dentro del `Invernadero` presurizado. Cero plantas o pasto al aire libre en Marte. |
| Habitáculos | Suelo módulo `1 m`, paredes múltiplo de `1 m`, marco `ExtrudeGeometry` con bisel, puerta deslizante y cúpula triangulada compartidos con props por estación. |
| Astronauta e Iris | Niño con proporciones infantiles propias; expertas adultas humanas con rasgos propios; **Iris** como rover solar de 4 ruedas que evidencia falla visual al dañarse por radiación (`ia_base === "danada"`). |
| Cables / tuberías | Curvas o buffers segmentados sobre canaletas fuera del paso peatonal; extremos anclados sin crear geometrías nuevas por frame. |

El protagonista recorre libremente las estaciones con teclado (WASD/flechas), clic o lista accesible, alterna cámara tercera/primera persona (`KeyV`) y conserva el respaldo 2D accesible en todo momento sin perder `GameState`.

## 2. División del inicio en capas (`1536 x 1024`, relación `3:2`)

Preservar margen de lectura a la izquierda y personaje a la derecha. Coordenadas expresadas en porcentaje aproximado del lienzo de [`01-inicio-actualizado.png`](referencias/inicio/01-inicio-actualizado.png):

| Orden / capa | Caja objetivo `x,y,w,h` | Implementación y movimiento |
| --- | --- | --- |
| 0. Fondo | `0,0,100,100` | Gradiente índigo y estrellas discretas sin UI horneada. Quieto por defecto. |
| 1. Decoración lejana | Asteroide `39,7,10,13`; planeta `79,15,16,14` | Mallas o capas ligeras; deriva de hasta `4 px` en `8 s` (desactivada con `prefers-reduced-motion`). No pulsar estrellas en bucle. |
| 2. Nave | `78,63,22,37` | Anclada abajo/derecha con recorte intencional de borde y pivote fijo. |
| 3. Cable (tether) | Entre mochila y conector | Curva detrás del cuerpo y delante del fondo con extremos unidos a `Socket_Tether`. Solo en escena orbital inicial. |
| 4. Niño | `49,18,31,57` | Cabeza y rostro visibles a través de visor transparente, mano levantada, flotación `6 px / 6 s` y giro máximo `1°`. |
| 5. Marca y subtítulo | `5,5,31,31`; subtítulo `6,32,29,5` | Logo oficial ([`referencias/ui/00-logo-actual.png`](referencias/ui/00-logo-actual.png)) sin reescribir lettering ni tapar escena. |
| 6. Menú | `5,40,36,36` | Botones DOM facetados marfil: iniciar, continuar (si hay guardado válido) y ajustes. |
| 7. Preferencias / créditos | Arriba derecha / abajo izquierda | Idioma `EN/ES`, acceso opcional cuenta/invitado, sonido, atribución NASA y respaldo 2D; orden de foco independiente. |
| 8. Ventanas y foco | Sobre controles | Ajustes y fuentes con foco atrapado y restaurado; capas decorativas `aria-hidden="true"` sin capturar puntero. |

En `16:9` preservar toda la altura del diseño redistribuyendo espacio lateral sin estirar niño ni logo. En móvil pasar el menú a columna vertical legible (`>= 44 x 44 CSS px`). Entrada única del inicio: fondo en `180 ms`, marca en `240 ms`, niño en `320 ms`; menú desde `200 ms` con `45 ms` de escalonamiento y `220 ms` por control; todo botón responde desde que es visible y volver desde ajustes no repite la intro.

## 3. Atomicidad: qué se comparte y qué cambia

| Nivel | Piezas | Reutilización |
| --- | --- | --- |
| Tokens | Color (`#F3EEE5`, `#EEE5F1`, `#53306D`, `#73D4E1`), chaflán, sombra, tipografía (`18–20 px`), duración y easing | Un solo sistema para inicio, HUD, consulta, comparación y cierre. |
| Átomos UI | `FacetButton`, icono, etiqueta i18n, valor, keycap, anillo de foco exterior | Variantes por propiedad; prohibido diseñar botones distintos por pantalla. |
| Compuestos UI | `ResourcePlaque`, `ExpertPortrait`, `CostRow`, `PendingEffect`, mensaje, tarjeta de fuente | Separa dato real, apariencia y feedback; icono nunca es única etiqueta. |
| Paneles | `DialogueCard`, `DecisionCard`, ajustes, fuentes, resultado | Mismo contrato de apertura, foco y cierre por `Escape`. |
| Piezas 3D comunes | Suelo, pared `1 m`, marco, puerta deslizante, ventana, lámpara, consola, caja, banco, tanque | Caché compartida en `materiales.ts` y ensamblaje por tabla de configuración. |
| Módulos semánticos | Esclusa, control, invernadero, laboratorio, ingeniería, enfermería, comedor/descanso, refugio | Composición reutilizable de piezas; identidad visual sin duplicar mallas base. |

### Familia de astronautas y rover Iris

Jerarquía compartida para personajes: `Root -> Rig -> Hips/Spine/Head/Arms/Legs`, `Socket_Hand_R`, `Socket_Back`, `Socket_Tether`. Slots de materiales: `SuitBase`, `Accent`, `Boots`, `Skin`, `Hair`, `Glass`, `Emissive`, `Rock`, `Plant`. Visor como superficie transparente separada sin doble capa coincidente. Clonar solo `Accent` por personaje al cambiar de rol.

| Personaje | Referencias en [`referencias/personajes/`](referencias/personajes/) | Identidad y accesorios |
| --- | --- | --- |
| Niño | [`inicio/capas/astronauta.png`](referencias/inicio/capas/astronauta.png) | Proporciones infantiles propias (nunca adulto reescalado), marfil, collar/guantes teal, botas índigo, tether solo en inicio. |
| Ingeniera | [`01-ingeniera-poses.png`](referencias/personajes/01-ingeniera-poses.png), [`02-ingeniera-rostros.png`](referencias/personajes/02-ingeniera-rostros.png) | Adulta humana, cabello castaño rojizo, acentos naranja, herramienta/tableta. |
| Doctora | [`03-doctora-poses.png`](referencias/personajes/03-doctora-poses.png), [`04-doctora-rostros.png`](referencias/personajes/04-doctora-rostros.png) | Adulta humana morena, gafas octagonales, acentos teal, bolso con escudo propio (sin cruz roja). |
| Meteoróloga | [`05-meteorologa-poses.png`](referencias/personajes/05-meteorologa-poses.png), [`06-meteorologa-rostros.png`](referencias/personajes/06-meteorologa-rostros.png) | Adulta humana, cabello plateado, acentos ciruela, instrumento de lectura solar. |
| Iris | En escena (`ui/src/escena/activos/iris.ts`) | Rover solar de 4 ruedas con pivotes independientes, panel solar y canvas frontal animado (solo re-sube textura cuando cambia). Muestra daño visual cuando `ia_base === "danada"`. |

Gestos requeridos para rig/pivotes: reposo (`idle`), caminar, mirar/interesar, explicar/señalar, inspeccionar, reparar, confirmar y recuperación.

### Ensamblaje de las ocho estaciones

| Estación y referencia | Piezas comunes | Identidad específica | Animación funcional |
| --- | --- | --- | --- |
| [Esclusa](referencias/estaciones/01-esclusa.png) | Marco, puerta, pared, caja, luz, rejilla | Rack de cascos, presión, rampa | Hojas deslizan por pivotes; indicador según estado. |
| [Control](referencias/estaciones/02-control-mision.png) / [Op.](referencias/estaciones/02b-control-operaciones.png) | Marco, consola, banco, lámpara, caja | Mesa de terreno y cúpula panorámica | Enlace y respuesta pendiente real; sin telemetría falsa. |
| [Invernadero](referencias/estaciones/03-invernadero.png) / [Cult.](referencias/estaciones/03b-invernadero-cultivos.png) | Consola, tanque, lámpara, marco | Ventanas trianguladas, jardineras, semilleros | Caudal y estado de equipo; crecimiento solo desde motor. |
| [Laboratorio](referencias/estaciones/04-laboratorio.png) / [Inv.](referencias/estaciones/04b-laboratorio-investigacion.png) | Mesa, caja, consola, tanque, banco | Muestras de planta/roca, vitrina, microscopio | Tapa/enfoque visual; no otorga recursos por inspección. |
| [Ingeniería](referencias/estaciones/05-ingenieria.png) / [Alm.](referencias/estaciones/05b-almacen-logistica.png) | Consola, mesa, caja, marco | Panel solar, batería, dock Iris, estantería bahías | Panel gira en eje `head_axis_separate`; instalando vs operativo. |
| [Enfermería](referencias/estaciones/06-enfermeria.png) / [At.](referencias/estaciones/06b-enfermeria-atencion.png) | Tanque, consola, banco, marco | Camilla, botiquín con escudo, lavamanos | Gestos tranquilos; sin barra de salud inventada. |
| [Comedor/descanso](referencias/estaciones/07-descanso-comedor.png) / [Marte](referencias/estaciones/07b-comedor-descanso-marte.png) / [Común](referencias/estaciones/07c-espacio-comun.png) | Mesa, banco, caja, lámpara, rejilla | Literas, dispensador, jardinera interior | Sentarse es gesto; exterior siempre árido sin árboles. |
| [Refugio](referencias/estaciones/08-refugio.png) | Puerta, banco, tanque, consola, caja | Cubierta de regolito y acento ámbar puntual | Puerta y estado de protección; entrar no blinda automáticamente. |

## 4. Tabla de animaciones y condiciones

Easing estándar: entrada `cubic-bezier(.2,.8,.2,1)` · salida `cubic-bezier(.4,0,1,1)`. Evitar rebote excesivo y movimiento perpetuo en controles de lectura.

| Disparador | Movimiento y duración | Resultado, interrupción y accesibilidad |
| --- | --- | --- |
| Botón aparece | Opacidad `0 -> 1`, `Y 8 -> 0 px`, `220 ms` | No repetir en cada rerender; cancelar al desmontar. |
| Hover (puntero fino) | `Y -2 px`, tinte/sombra leve, `120 ms` | Revierte en `100 ms`; no marca selección. |
| Presionar | `Y +1 px`, escala `.985`, sombra menor, `70 ms` | Soltar fuera cancela; teclado activa una vez. |
| Foco | Anillo oscuro + cian inmediato | Visible sin animación ni recorte por `clip-path`. |
| Seleccionar opción | Check y borde persistentes, `140 ms` | Distinto de hover/foco; nunca gasta recursos. |
| Deshabilitar / procesar | Color y etiqueta, `100 ms` | Tamaño estable, sin pulsos infinitos ni porcentajes ficticios. |
| Abrir diálogo / comparación | Opacidad + `Y 12 -> 0 px`, `220 ms` | Pausa y foco entran al instante de abrir. |
| Cerrar panel | Opacidad + `Y 0 -> 8 px`, `140 ms` | Bloquear clic al fondo durante salida y restaurar foco; `Escape` cancela. |
| Nueva línea de diálogo | Fundido `120 ms` | Texto completo inmediato; parpadeo retrato `100 ms` cada `4–7 s`. |
| Gasto confirmado | Saldo cambia al instante; delta sube `10 px` en `700 ms`; relleno `280 ms` | Número y `aria-valuenow` reales siempre. |
| Daño por evento | Delta con causa, realce `180 ms`, rastro `450 ms` | Sin sacudir pantalla ni flash rojo repetido. |
| Beneficio recibido | Delta `+` `700 ms`, check `160 ms`, relleno `280 ms` | Disparar únicamente al aplicar el efecto en `engine/`. |
| Recurso bajo | Icono + texto persistente al cruzar umbral | Señal única al cruce, no cada tick. |
| Pendiente | Reloj estático + ticks restantes en `120 ms` | No girar en bucle ni simular segundos reales. |
| Módulo instalando / operativo | Instalando `400 ms`; operativo luz/check `240 ms` | Reconciliar siempre desde `GameState`. |
| Fuente / tooltip | Fundido `120 ms` | Teclado y restauración de foco; pausado mientras lee. |
| Cambiar cámara (`KeyV`) | Interpolación `300 ms` sin atravesar paredes | Corte directo con `prefers-reduced-motion`. |
| Tormenta / resultado | Alerta `240 ms` + música opcional | Solo tras evento real de motor; sin estrobo. |

**Reglas de sincronización UI/animación:** usar nodos wrapper separados (`position-wrapper` y `feedback-wrapper`) para no competir en `transform` con Web Animations API; agrupar causas por tick e identificador derivado de secuencia/tick sin animar historia al cargar guardado; cancelar animaciones activas ante `prefers-reduced-motion: reduce` y pausar loops cuando `document.hidden` sea verdadero (`visibilitychange`).

## 5. Mapeo al código actual de `ui/src/`

`@solar-shield/engine` ya está conectado de punta a punta (`reductor.ts`, `App.tsx`, `Base3D.tsx`, `vista.ts`). La escena 3D es puramente presentacional y determinista sobre `EntradaEscena.vista`:

| Parte actual | Responsabilidad limpia |
| --- | --- |
| `ui/src/componentes/Hud.tsx` | Tres placas `ResourcePlaque` separadas (energía, soporte vital, blindaje) con delta/causa por tick; oculto en `fase === "inicio"`. |
| `Dialogos.tsx`, `Tripulacion.tsx` | `ExpertPortrait` (retratos humanos), `DialogueCard` y consulta/verificación de Iris sin aplicar acciones en selección. |
| `ColocarModulos.tsx`, `Tormenta.tsx`, `Acciones.tsx` | `CostRow`, `PendingEffect`, `DecisionCard` y `FacetButton` sobre un único flujo de comparación y confirmación. |
| `Base3D.tsx` | Coordina panel, pausa, foco y salidas sin calcular costos ni saldos. |
| `escena/vista.ts` | Deriva presencia, instalación, funcionamiento y fallo de Iris desde `GameState`. |
| `escena/materiales.ts` y `liberar.ts` | Caché compartida de geometrías base, slots `SuitBase/Accent/Boots/Skin/Hair/Glass/Emissive/Rock/Plant` y limpieza segura frente a `StrictMode`. |
| `escena/modelos.ts` y `escena/activos/` | Conservar interfaces `ModeloAstronauta`, `ModeloExperto`, `ModeloIris`, `ModeloModulo` detrás de fábricas modulares nuevas (cero mallas del prototipo Plan B). |
| `escena/escena3d.ts` y `EscenaBase.tsx` | Un único `WebGLRenderer`, `ACESFilmicToneMapping`, DPR `1.5` (`1` en baja), `< 80` draw calls, `< 80 000` triángulos, degradación `3D completo -> 3D liviano -> respaldo 2D` y cero asignaciones en `requestAnimationFrame`. |
| `escena/mundo.ts` y `fisica.ts` | Anclajes reales (`1 u = 1 m`), gravedad marciana `3.73 m/s²` y colisiones desacopladas de la malla artística. |

### Secuencia de estado obligatoria

```text
Entrada -> intención -> propuesta -> comparación -> confirmar
  -> motor valida y aplica una sola vez -> snapshot + causa/efecto
    -> HUD actualiza valor real inmediatamente
    -> adaptador visual emite gasto/daño/beneficio una vez por tick
    -> escena y UI animan presentación
```

## 6. Orden de producción en 10 pasos (por bloques y `/loop` sin colisión)

1. Fijar referencia canónica: [`01-inicio-actualizado.png`](referencias/inicio/01-inicio-actualizado.png), UI [`referencias/ui/`](referencias/ui/03-variantes-facetadas.png) y personajes [`referencias/personajes/`](referencias/personajes/01-ingeniera-poses.png).
2. Reproducir encuadre piloto en `Invernadero` con niño astronauta e Iris rover 3D antes de expandir a las ocho estaciones.
3. Congelar medidas base (`1 u = 1 m`, ancho de puerta, altura del niño y de adultas).
4. Construir una pieza maestra por familia (`door`, `consoleUnit`, `crate`, `solarPanel`, `planter`, `tank`, `bench`, `antenna`) antes de instanciar con `InstancedMesh`.
5. Calibrar materiales, luz diurna cálida y exposición `ACESFilmicToneMapping` en cámara real de juego.
6. Unificar tokens, `FacetButton` y `ResourcePlaque` con EN por defecto (`ui/i18n/en.json`) y ES completo (`es.json`).
7. Articular pivotes de puertas, paneles, ruedas de Iris y extremidades de personajes sin reconstruir geometría.
8. Conectar animaciones a transiciones ya confirmadas por el motor y verificar `prefers-reduced-motion`.
9. Expandir la base abierta de Jezero (`Bloque 2`) y completar UI v8 (`Bloque 3`) antes de ampliar a las 8 estaciones completas y expertas 3D (`Bloque 4`).
10. Verificar en navegador en escritorio y móvil/PC limitado: `< 80` draw calls, `< 80 000` triángulos, teclado, contraste, atribución NASA y cero errores WebGL.
