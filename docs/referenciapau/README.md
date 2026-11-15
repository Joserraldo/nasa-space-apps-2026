# Solar Shield — Referencias visuales v8 e índice maestro

**Responsable:** María Paula (`Paulasaah`) · **Versión vigente:** Atlas v8 (`50` láminas curadas en [`referencias/`](referencias/), `5,40 MB` optimizadas) · **Motor:** Three.js `^0.160.0` (`WebGLRenderer`) + React 18.

Esta carpeta centraliza en GitHub todas las referencias visuales curadas y guías técnicas aprobadas para el desarrollo por bloques y subagentes (`/loop`), eliminando duplicados y reduciendo el paquete gráfico de `77,35 MB` a `5,40 MB` sin perder nitidez ni transparencias.

## Documentos principales (orden de lectura)

| Documento | Qué contiene | Cuándo leerlo |
| --- | --- | --- |
| [Guía maestra procedural (`assets/GUIA-FABLE-V8.md`)](../../assets/GUIA-FABLE-V8.md) | Contrato técnico Three.js, regla cero Plan B, caché/materiales, Iris rover, Bloques 0–4, presupuesto WebGL y delegación `/loop`. | Antes de escribir o tocar cualquier archivo de `ui/` o `assets/`. |
| [Atlas integral v8 en Markdown (`ATLAS-V8.md`)](ATLAS-V8.md) | Extracción completa de las 68 páginas del PDF (Cap. 01–11) indexada con [`referencias/`](referencias/), paleta, tiempos de animación y precisión científica NASA. | Referencia diaria de desarrollo sin necesidad de abrir el PDF pesado. |
| [Aplicación técnica (`APLICACION.md`)](APLICACION.md) | Capas del inicio (`1536 x 1024`), atomicidad 3D/UI, familia de trajes, secuencia de estado, orden de producción en 10 pasos y adaptación realista de Marte. | Al implementar inicio, componentes UI v8, personajes y animaciones. |
| [Ampliación de espacios (`AMPLIACION-ESPACIOS.md`)](AMPLIACION-ESPACIOS.md) | Criterios de las 12 láminas de espacios interiores completos, almacén, conectores, cultivos protegidos y distribución exterior. | En Bloque 2 y Bloque 4 al ensamblar estaciones y circuitos. |
| [Plan de implementación Jezero (`PLAN-IMPLEMENTACION-JEZERO.md`)](PLAN-IMPLEMENTACION-JEZERO.md) | Conexión gradual sobre los `LugarId` actuales, cinco módulos de Jezero, cinco invariantes críticos y dependencias entre roles. | Para mantener coherencia con `@solar-shield/engine` y `@solar-shield/agents`. |
| Inventario y respaldo | [`catalogo-assets.json`](catalogo-assets.json), [`piezas-procedurales.js`](piezas-procedurales.js), [`revision-pdf-v8.json`](revision-pdf-v8.json), [`Solar-Shield-Atlas-integral-v8.pdf`](Solar-Shield-Atlas-integral-v8.pdf), [`Solar-Shield-Plan-Jezero.pdf`](Solar-Shield-Plan-Jezero.pdf). | Consulta de alta resolución o medidas base (`piezas-procedurales.js` no es arte final). |

> **Orden de autoridad:** ante contradicción visual, mandan los contratos reales del repositorio (`design/`, `engine/`, `missions/`, `data/`) y las guías técnicas (`.md`); las imágenes en [`referencias/`](referencias/) guían silueta, paleta, composición y proporciones, pero nunca sustituyen texto UI en DOM (`ui/i18n/`) ni mallas procedurales optimizadas.

---

## Índice visual curado en `referencias/` (`50` PNGs)

### 1. Inicio, intro, carga y capas orbitales (`referencias/inicio/` — 8 archivos)

| Archivo | Función |
| --- | --- |
| [`referencias/inicio/01-inicio-actualizado.png`](referencias/inicio/01-inicio-actualizado.png) | Portada canónica vigente: niño flotando, nave y botones facetados marfil a la izquierda. |
| [`referencias/inicio/00-inicio-original.png`](referencias/inicio/00-inicio-original.png) | Composición inicial de referencia (sin adoptar su placa cian grande en toda la UI). |
| [`referencias/inicio/02-intro-cuatro-momentos.png`](referencias/inicio/02-intro-cuatro-momentos.png) | Cuatro viñetas de introducción omitible hacia el briefing. |
| [`referencias/inicio/03-panel-carga.png`](referencias/inicio/03-panel-carga.png) | Pantalla de carga ámbar con indicador honesto de preparación real. |
| [`referencias/inicio/capas/astronauta.png`](referencias/inicio/capas/astronauta.png) | Recorte alpha de silueta y proporciones infantiles del niño astronauta. |
| [`referencias/inicio/capas/nave.png`](referencias/inicio/capas/nave.png) | Recorte alpha de nave orbital anclada abajo a la derecha. |
| [`referencias/inicio/capas/planeta.png`](referencias/inicio/capas/planeta.png) | Recorte alpha de planeta lejano. |
| [`referencias/inicio/capas/asteroide.png`](referencias/inicio/capas/asteroide.png) | Recorte alpha de asteroide lejano. |

### 2. Sistema UI, logo y flujo de decisión (`referencias/ui/` — 5 archivos)

| Archivo | Función |
| --- | --- |
| [`referencias/ui/00-logo-actual.png`](referencias/ui/00-logo-actual.png) | Logo oficial vigente (`Solar Shield`). |
| [`referencias/ui/01-dialogo-decision.png`](referencias/ui/01-dialogo-decision.png) | Aplicación v8 al encuentro con la Ingeniera y tres medidores separados. |
| [`referencias/ui/02-botones-crew-map.png`](referencias/ui/02-botones-crew-map.png) | Geometría facetada, grosor y relieve de botones marfil (`Crew`, `Map`). |
| [`referencias/ui/03-variantes-facetadas.png`](referencias/ui/03-variantes-facetadas.png) | Biblioteca completa de estados UI (`normal`, `hover`, `pressed`, `focus`, `disabled`, `selected`, `busy`, mensajes). |
| [`referencias/ui/04-consulta-comparacion-fuente.png`](referencias/ui/04-consulta-comparacion-fuente.png) | Patrón completo de consulta, comparación (`Costs now / Later`), fuente NASA y confirmación única. |

### 3. Personajes humanos y mecánicas de tripulación (`referencias/personajes/` — 8 archivos)

*(Recordatorio: las expertas y el protagonista son siempre **personas humanas** en 2D y 3D; **Iris** es el rover solar de 4 ruedas que falla por radiación cuando el jugador ya puede decidir y requiere verificar con la Ingeniera.)*

| Archivo | Función |
| --- | --- |
| [`referencias/personajes/00-familia-trajes.png`](referencias/personajes/00-familia-trajes.png) | Familia compartida de trajes (ignorar emblema repetido por error; conservar emblema de cada rol). |
| [`referencias/personajes/01-ingeniera-poses.png`](referencias/personajes/01-ingeniera-poses.png) | Ingeniera (`ingeniera`): cabello castaño rojizo, acentos naranja, poses y herramienta. |
| [`referencias/personajes/02-ingeniera-rostros.png`](referencias/personajes/02-ingeniera-rostros.png) | Ingeniera: expresiones faciales de diálogo. |
| [`referencias/personajes/03-doctora-poses.png`](referencias/personajes/03-doctora-poses.png) | Doctora (`doctora`): piel morena, gafas octagonales, acentos teal, bolso con escudo (sin cruz roja). |
| [`referencias/personajes/04-doctora-rostros.png`](referencias/personajes/04-doctora-rostros.png) | Doctora: expresiones faciales de diálogo. |
| [`referencias/personajes/05-meteorologa-poses.png`](referencias/personajes/05-meteorologa-poses.png) | Meteoróloga (`meteorologa`): cabello plateado, acentos ciruela, instrumento solar. |
| [`referencias/personajes/06-meteorologa-rostros.png`](referencias/personajes/06-meteorologa-rostros.png) | Meteoróloga: expresiones faciales de diálogo. |
| [`referencias/personajes/07-tripulacion-mecanicas.png`](referencias/personajes/07-tripulacion-mecanicas.png) | Lámina conceptual de roles e interacción en equipo. |

### 4. Estaciones modulares e interiores v8 (`referencias/estaciones/` — 16 archivos)

| Estación / vista | Base | Ampliación v8 |
| --- | --- | --- |
| Panorama general | [`00-panorama-estaciones-y-piezas.png`](referencias/estaciones/00-panorama-estaciones-y-piezas.png) | — |
| Esclusa | [`01-esclusa.png`](referencias/estaciones/01-esclusa.png) | — |
| Control de misión / operaciones | [`02-control-mision.png`](referencias/estaciones/02-control-mision.png) | [`02b-control-operaciones.png`](referencias/estaciones/02b-control-operaciones.png) |
| Invernadero e hidroponía / cultivos | [`03-invernadero.png`](referencias/estaciones/03-invernadero.png) | [`03b-invernadero-cultivos.png`](referencias/estaciones/03b-invernadero-cultivos.png) |
| Laboratorio / investigación | [`04-laboratorio.png`](referencias/estaciones/04-laboratorio.png) | [`04b-laboratorio-investigacion.png`](referencias/estaciones/04b-laboratorio-investigacion.png) |
| Ingeniería / anexo almacén | [`05-ingenieria.png`](referencias/estaciones/05-ingenieria.png) | [`05b-almacen-logistica.png`](referencias/estaciones/05b-almacen-logistica.png) |
| Enfermería / atención | [`06-enfermeria.png`](referencias/estaciones/06-enfermeria.png) | [`06b-enfermeria-atencion.png`](referencias/estaciones/06b-enfermeria-atencion.png) |
| Descanso, comedor y espacio común | [`07-descanso-comedor.png`](referencias/estaciones/07-descanso-comedor.png) | [`07b-comedor-descanso-marte.png`](referencias/estaciones/07b-comedor-descanso-marte.png) · [`07c-espacio-comun.png`](referencias/estaciones/07c-espacio-comun.png) |
| Refugio solar | [`08-refugio.png`](referencias/estaciones/08-refugio.png) | — |

### 5. Piezas individuales y kits compartidos (`referencias/piezas/` — 10 archivos)

[`01-puerta-marco.png`](referencias/piezas/01-puerta-marco.png) · [`02-consola.png`](referencias/piezas/02-consola.png) · [`03-caja.png`](referencias/piezas/03-caja.png) · [`04-panel-solar.png`](referencias/piezas/04-panel-solar.png) · [`05-jardinera.png`](referencias/piezas/05-jardinera.png) · [`06-deposito.png`](referencias/piezas/06-deposito.png) · [`07-banco.png`](referencias/piezas/07-banco.png) · [`08-antena.png`](referencias/piezas/08-antena.png) · [`09-kit-interior-logistica.png`](referencias/piezas/09-kit-interior-logistica.png) · [`10-kit-exterior-modular.png`](referencias/piezas/10-kit-exterior-modular.png)

### 6. Corredores y organización exterior (`referencias/exterior/` — 3 archivos)

- [`referencias/exterior/01-corredores-conexiones.png`](referencias/exterior/01-corredores-conexiones.png) — cruces con múltiples salidas y canales de servicio.
- [`referencias/exterior/02-kit-entorno-cultivos.png`](referencias/exterior/02-kit-entorno-cultivos.png) — geología marciana exterior (solo rocas pequeñas) separada de cultivos interiores.
- [`referencias/exterior/03-exterior-organizacion.png`](referencias/exterior/03-exterior-organizacion.png) — vista elevada de sectores, dos circuitos en bucle y atajos.

---

## Resumen rápido de paleta, UI y adaptación de Marte

- **Paleta oficial v8:** marfil `#F3EEE5`, lila `#EEE5F1`, ciruela `#53306D`, cian `#73D4E1` (respaldado por tres medidores separados: energía, soporte vital y blindaje).
- **Adaptación realista de Marte (NASA + estética v8):** entorno de cráter **Jezero** coherente con el DEM medido NASA Mars Trek (`data/terreno/jezero/elevacion.bin`), regolito oxidado y rocas basálticas facetadas, cielo diurno polvoriento cálido en tonos pastel del atlas, gravedad `3,73 m/s²` (`ui/src/escena/fisica.ts`, NASA NSSDC) y cero vegetación o ruinas fantásticas al aire libre.
- **Animación y accesibilidad:** movimientos fluidos con `cubic-bezier(.2,.8,.2,1)` / `(.4,0,1,1)` (`120–320 ms`), pivotes físicos en `Three.js` sin asignaciones por frame, pausa con `document.hidden`, áreas táctiles `>= 44 x 44 CSS px`, texto `18–20 px`, teclado + `prefers-reduced-motion` y respaldo 2D permanente.
