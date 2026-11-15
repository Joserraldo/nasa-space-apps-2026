# Ampliación v8: espacios completos, objetos y organización exterior

**María Paula (`Paulasaah`) · Propuesta visual v8 indexada directamente en [`referencias/`](referencias/).**

La serie ampliada complementa el atlas base aportando densidad funcional, variedad de mobiliario/logística y conexiones entre sectores en mundo abierto construido por código con Three.js/WebGL. Estas láminas no introducen nuevos `LugarId`, recursos ni reglas fuera de `engine/` y `design/`.

## 1. Qué se adapta y sus límites

| Referencia | Aporte que se adapta | Límite de la adaptación |
| --- | --- | --- |
| [`02b-control-operaciones.png`](referencias/estaciones/02b-control-operaciones.png) | Consolas en ángulo, asientos y circulación detrás de puestos | Pantallas muestran datos reales del juego; no copiar telemetría de ejemplo. |
| [`04b-laboratorio-investigacion.png`](referencias/estaciones/04b-laboratorio-investigacion.png) | Bancos, cámara de muestras y depósito ordenado | La cámara central contiene experimento de planta o roca, nunca esqueleto ni humano encapsulado. |
| [`03b-invernadero-cultivos.png`](referencias/estaciones/03b-invernadero-cultivos.png) | Bandejas repetibles, filas, cultivos de hoja/fruto y cultivo vertical | Plantas siempre dentro del cerramiento protegido; el render no inventa cosecha ni balance continuo. |
| [`01-corredores-conexiones.png`](referencias/exterior/01-corredores-conexiones.png) | Pasillos, uniones en T/cruce, marcos, ventanas y canales de servicio | Varias salidas despejadas sin recorrido lineal obligatorio ni cables sueltos en el piso. |
| [`07c-espacio-comun.png`](referencias/estaciones/07c-espacio-comun.png) | Centro de orientación, bancos y pequeña vegetación interior | Paso libre alrededor; no es un santuario nuevo ni un árbol monumental. |
| [`07b-comedor-descanso-marte.png`](referencias/estaciones/07b-comedor-descanso-marte.png) | Mesas/bancos compartidos, raciones, dispensador y suelo marciano árido exterior | Sentarse o comer es gesto visual; exterior sin árboles ni pasto en Marte. |
| [`06b-enfermeria-atencion.png`](referencias/estaciones/06b-enfermeria-atencion.png) | Camillas, carrito, lavamanos y suministros tranquilos | Doctora conserva identidad y escudo propios (prohibida cruz roja); sin barra clínica independiente. |
| [`05b-almacen-logistica.png`](referencias/estaciones/05b-almacen-logistica.png) | Estanterías por bahías, cajas de varios tamaños, canisters y recepción | Anexo visual de ingeniería/taller; no crea un inventario de recursos nuevo. |
| [`10-kit-exterior-modular.png`](referencias/piezas/10-kit-exterior-modular.png) | Envolventes, conectores, rampas, puertas y sistemas exteriores | Reinterpretar en marfil/lila/cian del atlas; no adoptar amarillo/negro industrial. |
| [`02-kit-entorno-cultivos.png`](referencias/exterior/02-kit-entorno-cultivos.png) | Rocas naturales pequeñas, suelo/camino, cultivos interiores y tuberías | Excluir estrictamente estatuas, humanoides de piedra, arcos, templos y ruinas. |
| [`03-exterior-organizacion.png`](referencias/exterior/03-exterior-organizacion.png) | Base abierta organizada por sectores, conexiones y bucles transitables | Mundo marciano transitable sin vegetación exterior ni monumentos pétreos. |

## 2. Continuidad visual y paleta v8

- **Envolventes y muebles:** marfil cálido `#F3EEE5` con esquinas recortadas y bisel contenido.
- **Sombras y estructura:** lila `#EEE5F1` y ciruela/índigo `#53306D`; luz diurna cálida amplia arriba izquierda.
- **Cian/teal (`#73D4E1`):** indicadores puntuales de lectura o estado, nunca contorno brillante uniforme en todo objeto.
- **Ámbar:** señalización puntual de mantenimiento/refugio; no reemplaza la paleta marfil.
- **Facetas limpias:** planos low-poly legibles, rocas basálticas irregulares acordes con Marte/Jezero y hojas protegidas por planos simples. Conservar las identidades de personajes de [`referencias/personajes/`](referencias/personajes/) y UI de [`referencias/ui/`](referencias/ui/).

## 3. Catálogo indexado de láminas ampliadas

| Lámina en `referencias/` | Función y piezas principales | Uso en mundo abierto |
| --- | --- | --- |
| [`estaciones/05b-almacen-logistica.png`](referencias/estaciones/05b-almacen-logistica.png) | Bahía de estantería, cajas, canisters, carro y recepción | Anexo de servicio en `taller` / ingeniería. |
| [`estaciones/02b-control-operaciones.png`](referencias/estaciones/02b-control-operaciones.png) | Consolas modulares, sillas, mesa de inspección y acceso trasero | Estación de consulta y planificación (`mesa`). |
| [`estaciones/04b-laboratorio-investigacion.png`](referencias/estaciones/04b-laboratorio-investigacion.png) | Bancos, vitrina de muestra planta/roca y microscopio | Inspección educativa sin modificar reservas. |
| [`estaciones/03b-invernadero-cultivos.png`](referencias/estaciones/03b-invernadero-cultivos.png) | Filas de jardineras, hojas, frutos, semilleros y riego | Visualización de alimentos dentro de soporte vital y su costo eléctrico. |
| [`exterior/01-corredores-conexiones.png`](referencias/exterior/01-corredores-conexiones.png) | Cruces de pasillos, costillas, ventanas y canaletas | Conectores multipunto con rutas alternativas. |
| [`estaciones/07c-espacio-comun.png`](referencias/estaciones/07c-espacio-comun.png) | Claro/espacio común con jardinera interior y bancos | Orientación central dentro de hábitat/descanso. |
| [`estaciones/07b-comedor-descanso-marte.png`](referencias/estaciones/07b-comedor-descanso-marte.png) | Mesas, bancos, raciones y exterior árido marciano | Contexto habitable; no añade mecánica obligatoria de comida. |
| [`estaciones/06b-enfermeria-atencion.png`](referencias/estaciones/06b-enfermeria-atencion.png) | Camillas, carrito de instrumentos y suministros | Ampliación visual de atención con la Doctora. |
| [`piezas/09-kit-interior-logistica.png`](referencias/piezas/09-kit-interior-logistica.png) | Mobiliario, recipientes, herramientas y servicios interiores | Familias reutilizables para instanciar en salas. |
| [`piezas/10-kit-exterior-modular.png`](referencias/piezas/10-kit-exterior-modular.png) | Envolventes, corredores, esclusa, paneles, tanques y rampa | Conectores compatibles entre módulos exteriores. |
| [`exterior/02-kit-entorno-cultivos.png`](referencias/exterior/02-kit-entorno-cultivos.png) | Suelo, rocas pequeñas naturales, cultivos protegidos y tubería | Separa geología marciana exterior de vegetación presurizada. |
| [`exterior/03-exterior-organizacion.png`](referencias/exterior/03-exterior-organizacion.png) | Vista elevada de sectores, conexiones y recorridos | Guía espacial de relaciones (no mapa topográfico literal de Jezero). |

## 4. Organización exterior: relaciones y sectores

| Sector | Relación propuesta | Regla de recorrido |
| --- | --- | --- |
| Centro | Control y espacio común como referencias fáciles de reconocer | Claro central que conecte al menos dos circuitos sin forzar paso obligatorio. |
| Energía y servicio | Ingeniería, anexo de almacén y paneles próximos | Acceso de mantenimiento sin atravesar cultivos ni mobiliario. |
| Cultivo | Invernadero y depósito de agua reconocibles | Cultivos detrás del cerramiento; entrada y conexión despejadas. |
| Ciencia y atención | Laboratorio y enfermería cercanos con accesos distinguibles | Consultas desde el mundo; cerrar diálogo devuelve al mismo contexto. |
| Descanso | Hábitat/comedor comunicado con espacio común | Salida clara hacia servicios y refugio. |
| Protección | Refugio identificable alcanzable por más de una ruta | La protección la decide `engine/`, no atravesar una malla. |
| Llegada | Esclusa y plataforma en borde exterior | Separar plataforma/camino peatonal del cultivo protegido. |

## 5. Atomicidad y las 9 familias compartidas

| Familia | Piezas reutilizables | Qué cambia por configuración |
| --- | --- | --- |
| Estantería | Montante, travesaño, balda, fondo opcional | Altura/bahías conservando el paso modular. |
| Contenedor | Caja base, tapa, asa/cierre, canister | Tamaño, proporción, acento e instanciación (`InstancedMesh`). |
| Puesto de trabajo | Mesa, pantalla, soporte, silla | Composición y lectura en vivo desde `vista.ts`. |
| Corredor | Suelo (`1 m`), costilla, pared, cristal, puerta y conector | Recto, T/cruce y longitud sin obstáculos en la ruta. |
| Cultivo | Hoja maestra, tallo, fruto, plántula, bandeja | Especie visual y distribución determinista dentro de domo. |
| Mobiliario | Banco, mesa, armario, camilla, carrito | Accesorios de sala con pivotes móviles separados. |
| Servicios | Tubo, codo, T, canaleta, enchufe, luminaria | Conexión sobre anclajes; cero reconstrucción de tubos por frame. |
| Envolvente exterior | Casco modular, puerta, rampa, techo, ventana, cúpula | Silueta compatible dentro de una sola familia v8. |
| Terreno | Suelo, rocas pequeñas basálticas, montículos y camino | Semilla decorativa separada del RNG de misión; cero ruinas. |

## 6. Siete validaciones antes de integrar

1. Paleta marfil/lila/ciruela/cian fiel bajo luz de cámara real.
2. Entradas, pasillos y controles esenciales alcanzables desde teclado y ambas cámaras (`KeyV`).
3. Muebles, sillas, rocas y tuberías fuera del paso de circulación o cámara.
4. Libertad total de consulta y cambio de estación sin pasillo bloqueado.
5. Objetos interactivos claramente distinguibles del decorado estático.
6. Distinción explícita entre vegetación protegida, dato NASA y regla de juego.
7. Ausencia total de estatuas, ruinas, templos, portales o vegetación al aire libre.
