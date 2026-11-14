# Ampliación v8: espacios completos, objetos y organización exterior

**14 nov 2026 · María Paula · feat/ui-escena-3d · propuesta visual para revisión.**

La nueva serie complementa el atlas: aporta densidad funcional, variedad de objetos y conexiones entre espacios. El mundo sigue abierto y construido por código con Three.js/WebGL. Estas láminas no incorporan automáticamente misiones, recursos ni mecánicas al juego.

## 1. Qué se toma de los doce adjuntos

| Referencia del mensaje | Aporte que se adapta | Límite de la adaptación |
| --- | --- | --- |
| 1: operaciones | Consolas en módulos, asientos y circulación detrás de puestos | Pantallas con datos reales del juego al implementar; no copiar texto/telemetría del ejemplo. |
| 2: investigación | Bancos, cámara de muestras, depósito y relación entre aparatos | La nueva cámara contiene un experimento de planta/roca, no esqueleto ni humano encapsulado. |
| 3: cultivo | Bandejas repetibles, filas, cultivos con distintas siluetas y cultivo vertical | Plantas dentro de un invernadero protegido; crecimiento y comida no se inventan desde el render. |
| 4 y 5: conexiones | Pasillos, uniones, marcos, puertas, paneles de servicio y cambios de dirección | Varias salidas y accesos despejados; no recorrido lineal obligatorio ni cables sueltos que bloqueen el piso. |
| 6: espacio común | Orientación central, bancos y pequeña vegetación interior | El centro debe permitir circulación alrededor; no árbol monumental ni nueva estación sagrada. |
| 7: comedor | Mesas/bancos compartidos, bandejas, dispensador y guardado | Objetos ordenados; sentarse o comer una ilustración no modifica reservas por sí solo. |
| 8: atención | Camillas, equipos y armarios con espacio entre ellos | Atención tranquila y escudo como distintivo; no añadir salud independiente ni cápsula humana ominosa. |
| **9: almacén** | **Referencia principal de organización de objetos: estanterías por bahías, cajas de tamaños distintos, canisters, recepción y puesto de registro** | **Compartir familias de objetos con variaciones controladas, mantener pasillos y acceso a los elementos.** |
| 10: edificios modulares | Variedad de envolventes, conectores, puertas, rampas y sistemas exteriores | Reinterpretar con la familia del atlas, sin adoptar como identidad principal amarillo/negro. |
| 11: catálogo de elementos | Props útiles: transporte, instrumentos, muebles, cultivos, cajas y servicios | Excluir estatuas, humanoides de piedra, arcos, templos, ruinas y estructuras pétreas. La lámina original se conserva solo como procedencia. |
| **12: base exterior** | **Referencia principal de distribución: edificios relacionados, áreas de servicio y conexiones visibles** | **Mundo transitable con espacio abierto; sin estatuas, monumentos o construcciones de piedra, ni árboles creciendo sobre Marte abierto.** |

La numeración corresponde exactamente al orden de los adjuntos originales (hoy archivados fuera del repositorio activo para evitar que se copien estatuas, ruinas o árboles exteriores; únicamente las 12 láminas curadas en `ampliacion-v8/laminas/` son referencia válida).

## 2. Continuidad de la dirección visual

- Envolventes y muebles: marfil cálido con esquinas recortadas y bisel contenido.
- Sombras y estructura: lila/ciruela e índigo; luz amplia que permita leer el espacio.
- Cian/teal: estado o lectura de equipo, no contorno luminoso de todos los objetos.
- Ámbar: acento puntual de mantenimiento/señalización; no reemplaza la paleta por amarillo industrial.
- Facetas grandes visibles, plantas con hojas de planos claros y rocas naturales irregulares. Evitar microdetalle fotográfico y superficies indistintas.
- Conservar las identidades de personajes y la UI curadas del atlas (ahora consolidadas en `Solar-Shield-Atlas-integral-v8.pdf`); esta serie se concentra en entornos y objetos y no define rostros nuevos.

Se toman la lógica espacial y el inventario de las referencias nuevas. La apariencia se apoya en las estaciones low poly ya trabajadas. Los renders son conceptos de una familia común, no vistas sincronizadas de una escena 3D única.

## 3. Las doce láminas nuevas

| Archivo en `ampliacion-v8/laminas/` | Función y piezas principales | Aplicación en el mundo abierto |
| --- | --- | --- |
| `01-almacen-logistica.png` | Bahía de estantería, cajas, canisters, carro, mesa de recepción y conductos | Anexo de servicio de ingeniería, usando sobre todo la organización de la referencia 9. No añade un recurso de inventario al contrato. |
| `02-control-operaciones.png` | Consolas, asiento, mesa de inspección, armarios y acceso a mantenimiento | Lugar de consulta y planificación; dejar espacio detrás de sillas y rutas alternativas. |
| `03-laboratorio-investigacion.png` | Bancos de muestras, vitrina/cámara de experimento, microscopio y lectura | Inspección y contexto científico sin otorgar recursos por tocar decorado. |
| `04-invernadero-cultivos.png` | Jardineras en filas, hojas de cultivo, frutos, semilleros, estantes, agua e iluminación | Hacer comprensible la producción de comida dentro de soporte vital y su relación con energía. |
| `05-corredores-conexiones.png` | Unión de pasillos, marcos, puertas, ventanas y canales de servicio | Conexión entre salas con decisiones de rumbo; varias salidas, sin progreso por puertas bloqueadas. |
| `06-espacio-comun.png` | Centro de orientación, jardinera interior, bancos y consola | Referencia para el área común del hábitat/descanso; mantiene un circuito de circulación libre. |
| `07-comedor-descanso-v2.png` | Mesas, bancos, raciones, tazas, agua y armarios | Referencia del espacio de descanso existente, no una misión obligatoria de alimentación nueva. |
| `08-enfermeria-atencion.png` | Camillas, carrito de instrumentos, lavamanos y suministros | Ampliación visual de la estación de la Doctora; no define una barra clínica nueva. |
| `09-kit-interior-logistica.png` | Familia de muebles, recipientes, herramientas, equipos y servicios | Biblioteca para reutilizar en varias salas, con especial atención al almacén. |
| `10-kit-exterior-modular.png` | Envolventes, corredor, unión, esclusa, paneles, tanques, rampa y transporte | Conectores compatibles y piezas de servicio, en lugar de una malla distinta para cada edificio. |
| `11-kit-entorno-cultivos.png` | Rocas pequeñas naturales, suelo/camino, cultivos, hojas, semilleros y tuberías | Separar decoración geológica exterior de vegetación que solo aparece en espacios protegidos. |
| `12-exterior-organizacion.png` | Vista elevada de distribución, conexiones, sectores y recorridos | Principal referencia nueva del exterior. No es un mapa topográfico de Jezero ni un render del juego existente. |

Son doce PNG de láminas: los objetos dentro de un catálogo no se declaran PNG individuales exportados. Los recortes individuales siguen disponibles en `individuales/`. La implementación procedural utilizará fábricas por familia, no estas láminas como texturas del mundo.

## 4. Organización exterior: relaciones antes de coordenadas

| Sector | Relación propuesta | Regla de recorrido |
| --- | --- | --- |
| Centro | Control y espacio común como referencias fáciles de reconocer | Claro central que conecte al menos dos circuitos; orientación sin obligar a pasar por él cada vez. |
| Energía y servicio | Ingeniería, anexo de almacén y paneles próximos | Acceso a controladores y mantenimiento sin atravesar cultivos o mobiliario. |
| Cultivo | Invernadero y depósito de agua reconocibles | Cultivos detrás del cerramiento; entrada y conexión de servicio despejadas. |
| Ciencia y atención | Laboratorio y enfermería cercanos, con accesos distinguibles | Consultas disponibles desde el mundo; cerrar un diálogo devuelve al mismo contexto. |
| Descanso | Hábitat/comedor comunicado con área común | Espacio tranquilo con salida clara hacia servicios y refugio. |
| Protección | Refugio identificable y alcanzable por más de una ruta | La protección la decide la simulación, no el hecho de atravesar un arco. |
| Llegada | Esclusa y plataforma de entrenamiento en borde exterior | Separación visual del cultivo, camino peatonal y acceso de vehículo legibles. |

Objetivo espacial: dos recorridos en bucle y atajos, además de un claro que deje ver otros destinos. El diseño debe permitir cambiar de decisión y volver a otra estación sin reiniciar un nivel. La ilustración expresa relaciones; coordenadas, distancias, colisiones y rutas definitivas se fijan en la escena y se revisan con ambas cámaras. No se atribuyen medidas de seguridad o ingeniería NASA a estas separaciones visuales.

El almacén se propone como anexo de servicio dentro del área de ingeniería. El espacio común amplía hábitat/descanso. Si el equipo decidiera convertirlos en nuevas mecánicas o `LugarId`, habría que acordar el cambio de alcance y sus contratos; los renders no lo hacen por sí solos.

## 5. Atomicidad y construcción por código

| Familia | Piezas reutilizables | Qué cambia por configuración |
| --- | --- | --- |
| Estantería | Montante, travesaño, balda, fondo opcional | Altura/bahías y ocupación; mantener el mismo paso modular. |
| Contenedor | Caja base, tapa, asa/cierre, canister | Tamaño, proporción, acento y pictograma; no microdetalle único por copia. |
| Puesto de trabajo | Mesa, pantalla, soporte, silla | Composición y datos visibles; lectura de gestión sale del motor. |
| Corredor | Suelo, costilla, pared, cristal, puerta y conector | Recto, unión T/cruce y longitud por módulos. No generar obstáculos decorativos en la ruta. |
| Cultivo | Hoja maestra, tallo, fruto, plántula y bandeja | Especie visual, edad ilustrativa y distribución con semilla decorativa. Crecimiento funcional requiere estado real. |
| Mobiliario | Banco, mesa, armario, camilla y carrito | Accesorios de sala y acentos; pivotes de partes móviles separados. |
| Servicios | Tubo, codo, T, canaleta, enchufe y luminaria | Conexión sobre anclajes; actualizar buffers si se animan, no reconstruir todo en cada frame. |
| Envolvente exterior | Casco modular, puerta, rampa, techo, ventana, cúpula | Silueta de estación y montaje; una familia compatible, no edificios inconexos. |
| Terreno | Rocas pequeñas, suelo, pequeños montículos y camino | Semilla de decorado, escala y giro; no ruinas o monumentos pétreos. |

En Three.js: `Shape`/`ExtrudeGeometry` para marcos y chaflanes; `BufferGeometry` para hojas, facetas y terreno; grupos con pivotes para puertas/paneles; caché de geometría/material e instancias para repetidos estáticos. La jerarquía de objetos debe conservar piezas que se animan, reciben interacción o representan estado.

Orden propuesto: una bahía de almacén y una jardinera maestras; luego un tramo de corredor con conexiones; después distribuir una estación y comprobar escala/circulación; finalmente replicar familias y ajustar composición exterior. Los catálogos no autorizan cargar un canvas por objeto ni duplicar el estado de gestión.

## 6. Qué debe validarse al integrar

1. Que la paleta y las facetas correspondan al atlas, incluso al cambiar luz o cámara.
2. Que todas las entradas, pasillos y controles esenciales sean alcanzables y legibles.
3. Que muebles, sillas, roca y tubería no invadan la circulación o la cámara.
4. Que el niño pueda consultar, salir y elegir otra estación sin seguir un circuito obligatorio.
5. Que la abundancia de decorado no vuelva confuso qué objeto es interactivo.
6. Que vegetación protegida, dato científico y simplificación de juego se distingan claramente.
7. Que ninguna estatua, ruina, portal o construcción de piedra reaparezca al trasladar la referencia.

La ampliación se integra en el PDF v8 para revisión visual; aplicación, motor y prototipo técnico anterior no se ajustan en esta tarea. Generación con herramienta integrada de imágenes; prompts e inventario se conservan en `ampliacion-v8/prompts.json`. Rama local, sin commit, push o PR hasta aprobación.
