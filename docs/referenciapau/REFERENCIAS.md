# REFERENCIAS: catálogo de las 55 láminas

Todas en [`referencias/`](referencias/), PNG de 1024 px de lado mayor con paleta de 256 colores. Son **guías para reconstruir en código**, no assets del juego (excepción: el logo).
Columnas: **Tomar** = lo que se replica con fidelidad. **Ignorar** = lo que la lámina muestra pero no se adopta (y por qué manda el texto). **Doc** = dónde se usa.

Procedencia: generadas con IA a partir de referencias de María Paula (atlas v5, v7 y v8). Cinco se extrajeron del PDF del atlas v8 en esta reorganización porque faltaban: `mundo/01`, `mundo/02`, `personajes/08`, `09` y `10`. Las variantes repetidas (mismo contenido con otro fondo o compresión) se descartaron tras compararlas.

---

## 1. Mundo abierto (`mundo/`, 2)

| Lámina | Tomar | Ignorar | Doc |
| --- | --- | --- | --- |
| [`01-exterior-tercera-persona.png`](referencias/mundo/01-exterior-tercera-persona.png) | **La lámina más importante.** Cámara alta por detrás, escala niño/adulta/edificios, terreno de regolito y rocas, camino de baldosas con balizas, consola interactiva con contorno cian, paneles, Iris rover, torre de control, hábitat, cúpulas de invernadero, refugio cubierto de regolito, HUD completo. | **Cielo azul** (se usa el cielo de MARTE §4). Cordillera alta y cercana (se baja y aleja). La figura adulta tiene rasgos que no coinciden del todo con la Ingeniera de `personajes/01`: manda la ficha. | DISEÑO §1, §5.2 · ESCENAS §3.1 |
| [`02-exterior-primera-persona.png`](referencias/mundo/02-exterior-primera-persona.png) | Misma escena desde los ojos del niño; guantes teal en las esquinas inferiores; letrero `[V] Third person`. | Cielo azul. No es el mismo render que `01`: fijar posiciones y cámara al implementar. | ESCENAS §3.1 |

## 2. Portada, intro y carga (`inicio/`, 8)

| Lámina | Tomar | Ignorar | Doc |
| --- | --- | --- | --- |
| [`01-inicio-actualizado.png`](referencias/inicio/01-inicio-actualizado.png) | **Portada canónica.** Composición, capas, botones facetados marfil a la izquierda, niño a la derecha, nave abajo a la derecha. | Texto de los botones como imagen: va en DOM e i18n. | DISEÑO §6 |
| [`00-inicio-original.png`](referencias/inicio/00-inicio-original.png) | Composición base de la que salió la actualizada. | La gran placa cian luminosa como estilo de botones. | DISEÑO §6 |
| [`02-intro-cuatro-momentos.png`](referencias/inicio/02-intro-cuatro-momentos.png) | Cuatro viñetas de la intro (misión, observar, tripulación, decidir). | Las viñetas de la base no significan decisiones ya tomadas. | ESCENAS §2.2 |
| [`03-panel-carga.png`](referencias/inicio/03-panel-carga.png) | Ilustración ámbar, consejo corto, estado de preparación. | Cualquier porcentaje: el indicador es indeterminado si no hay progreso real. | ESCENAS §2.3 |
| [`capas/astronauta.png`](referencias/inicio/capas/astronauta.png) | Silueta y proporción del niño flotando, mano en saludo. | Halo del recorte; no es una extracción exacta. | DISEÑO §4.2, §6 |
| [`capas/nave.png`](referencias/inicio/capas/nave.png) | Silueta de la nave orbital facetada lila con ventanal índigo y luces cian. | — | DISEÑO §6 |
| [`capas/planeta.png`](referencias/inicio/capas/planeta.png) | Planeta facetado violeta con anillo. | — | DISEÑO §6 |
| [`capas/asteroide.png`](referencias/inicio/capas/asteroide.png) | Asteroide facetado índigo con cráteres y borde teal. | — | DISEÑO §6 |

## 3. Personajes (`personajes/`, 11)

| Lámina | Tomar | Ignorar | Doc |
| --- | --- | --- | --- |
| [`00-familia-trajes.png`](referencias/personajes/00-familia-trajes.png) | Las 7 piezas comunes del traje (traje, casco, visor, guantes, botas, mochila, accesorios), los 4 personajes juntos con proporciones relativas, muestras de color. | **El emblema de herramienta repetido en todos los trajes** (error): cada rol lleva el suyo. | DISEÑO §2.2, §4.1 |
| [`01-ingeniera-poses.png`](referencias/personajes/01-ingeniera-poses.png) | Frente, perfil, espalda; idle, walk, explain, inspect, repair, confirm. Acentos naranja, tableta y llave. | — | DISEÑO §4.2–4.3 |
| [`02-ingeniera-rostros.png`](referencias/personajes/02-ingeniera-rostros.png) | 8 expresiones de diálogo. | No son sprites para exportar: se reconstruyen. | DISEÑO §4.4 |
| [`03-doctora-poses.png`](referencias/personajes/03-doctora-poses.png) | Frente, perfil, espalda; idle, walk, listen, explain, check, reassure. Gafas octagonales, bolso con escudo. | — | DISEÑO §4.2–4.3 |
| [`04-doctora-rostros.png`](referencias/personajes/04-doctora-rostros.png) | 8 expresiones de diálogo. | — | DISEÑO §4.4 |
| [`05-meteorologa-poses.png`](referencias/personajes/05-meteorologa-poses.png) | Frente, perfil, espalda; idle, walk, observe, explain, alert, verify. Cabello plateado, acentos ciruela, catalejo, trípode, maletín. | — | DISEÑO §4.2–4.3 |
| [`06-meteorologa-rostros.png`](referencias/personajes/06-meteorologa-rostros.png) | 8 expresiones de diálogo. | — | DISEÑO §4.4 |
| [`07-tripulacion-mecanicas.png`](referencias/personajes/07-tripulacion-mecanicas.png) | Las 4 tarjetas del ciclo de decisión (elegir a quién preguntar, comparar un plan, verificar el aviso, tu decisión cuenta), retratos con nombre y especialidad, Iris como guía. | Valores numéricos de ejemplo (`−6`, `−3`, `+14`): la UI lee los reales. Vegetación del fondo difuminado. | DISEÑO §5 · MECANICAS §4 |
| [`08-nino-proporciones-poses.png`](referencias/personajes/08-nino-proporciones-poses.png) | Frente, perfil, espalda; idle, walk, wave, inspect, kneel, talk. **Proporción infantil propia.** | Las poses no son un rig listo. | DISEÑO §4.2–4.3 |
| [`09-nino-rostros.png`](referencias/personajes/09-nino-rostros.png) | 8 expresiones: neutral, happy, curious, concerned, talk closed, talk open, talk round, blink. | — | DISEÑO §4.4 |
| [`10-nino-luz-lectura.png`](referencias/personajes/10-nino-luz-lectura.png) | El mismo niño bajo 4 ambientes: día en Marte, interior/laboratorio, atardecer exterior, alerta/refugio. Base para validar materiales y luz. | El fondo azulado del ambiente "día en Marte" no fija el color del cielo (MARTE §4). | DISEÑO §3.3 · MARTE §4 |

## 4. Interfaz (`ui/`, 5)

| Lámina | Tomar | Ignorar | Doc |
| --- | --- | --- | --- |
| [`00-logo-actual.png`](referencias/ui/00-logo-actual.png) | **Logo oficial.** Único asset que se usa como imagen. | No redibujar el lettering con otra fuente. Para producción pedir versión con alfa o vector fiel. | DISEÑO §6 |
| [`01-dialogo-decision.png`](referencias/ui/01-dialogo-decision.png) | Diálogo con la Ingeniera, retrato facetado, tres medidores separados, comparación y confirmación aplicadas. | Valores `28/20/12` (estado ilustrativo). | DISEÑO §5 |
| [`02-botones-crew-map.png`](referencias/ui/02-botones-crew-map.png) | Geometría exacta del botón facetado: chaflán, grosor, relieve. | — | DISEÑO §5.3 |
| [`03-variantes-facetadas.png`](referencias/ui/03-variantes-facetadas.png) | Biblioteca completa: principal, secundario, normal, hover, pressed, focus, disabled, selected, busy, mensajes, entrada, voz, fuente, superficie oscura. | Valores `70/80/60`. El grosor del foco dibujado es demostrativo. | DISEÑO §5.3 |
| [`04-consulta-comparacion-fuente.png`](referencias/ui/04-consulta-comparacion-fuente.png) | Organización de consulta, comparación `Costs now / Later`, fuente y confirmación única. | No reemplaza todas las pantallas ni define balance. | DISEÑO §5 · MECANICAS §4 |

## 5. Estaciones (`estaciones/`, 16)

Las figuras humanas pequeñas de estas láminas no definen identidad: mandan las fichas de personajes. Ninguna es una sala ya implementada.

| Lámina | Tomar | Ignorar | Doc |
| --- | --- | --- | --- |
| [`00-panorama-estaciones-y-piezas.png`](referencias/estaciones/00-panorama-estaciones-y-piezas.png) | Las 8 estaciones como una familia y las piezas compartidas. | El pictograma genérico de enfermería: va el escudo. | ESCENAS §4 |
| [`01-esclusa.png`](referencias/estaciones/01-esclusa.png) | Marco y hojas, rack de cascos, indicador de presión, rampa. | — | ESCENAS §4 |
| [`02-control-mision.png`](referencias/estaciones/02-control-mision.png) | Consolas, mesa de terreno, cúpula, antena. | Telemetría dibujada en pantallas. | ESCENAS §4 |
| [`02b-control-operaciones.png`](referencias/estaciones/02b-control-operaciones.png) | Puestos modulares en ángulo con paso por detrás, asientos, mesa de inspección. | Texto y datos de las pantallas. | ESCENAS §4 |
| [`03-invernadero.png`](referencias/estaciones/03-invernadero.png) | Ventanas trianguladas, jardineras, semilleros, tanque, tuberías. | — | ESCENAS §4 |
| [`03b-invernadero-cultivos.png`](referencias/estaciones/03b-invernadero-cultivos.png) | Filas de bandejas, cultivos de hoja, fruto y grano, cultivo vertical, pasillos. | La idea de cosecha continua. | ESCENAS §4 |
| [`04-laboratorio.png`](referencias/estaciones/04-laboratorio.png) | Mesa compartida, vitrinas, muestras, microscopio. | — | ESCENAS §4 |
| [`04b-laboratorio-investigacion.png`](referencias/estaciones/04b-laboratorio-investigacion.png) | Cámara central de experimento, bancadas, armarios. | La cámara contiene planta o roca, nunca una persona o esqueleto. | ESCENAS §4 |
| [`05-ingenieria.png`](referencias/estaciones/05-ingenieria.png) | Baterías, panel en eje, banco de trabajo, herramientas, dock de Iris. | — | ESCENAS §4 |
| [`05b-almacen-logistica.png`](referencias/estaciones/05b-almacen-logistica.png) | **Referencia principal de organización de objetos:** estanterías por bahías, tres tamaños de caja, canisters, recepción, carrito. | No crea un inventario de recursos nuevo. | ESCENAS §4 |
| [`06-enfermeria.png`](referencias/estaciones/06-enfermeria.png) | Camilla, consola, tanque, armario, lavamanos, botiquín con escudo. | — | ESCENAS §4 |
| [`06b-enfermeria-atencion.png`](referencias/estaciones/06b-enfermeria-atencion.png) | Camillas con espacio entre ellas, carrito, suministros. | Barra de salud, cápsula humana. | ESCENAS §4 |
| [`07-descanso-comedor.png`](referencias/estaciones/07-descanso-comedor.png) | Mesa, bancos, raciones, literas, armarios, dispensador. | — | ESCENAS §4 |
| [`07b-comedor-descanso-marte.png`](referencias/estaciones/07b-comedor-descanso-marte.png) | Mesas repetidas, tazas, almacenamiento, ventanal a un exterior **árido** (versión corregida sin árboles). | — | ESCENAS §4 |
| [`07c-espacio-comun.png`](referencias/estaciones/07c-espacio-comun.png) | Centro circular de orientación, jardinera interior, bancos, puertas visibles. | No es un santuario ni un árbol monumental. | ESCENAS §4 |
| [`08-refugio.png`](referencias/estaciones/08-refugio.png) | Puerta, bancos, tanques, consolas, cubierta de regolito, ámbar puntual. | — | ESCENAS §4 |

## 6. Piezas (`piezas/`, 10)

| Lámina | Tomar | Ignorar | Doc |
| --- | --- | --- | --- |
| [`01-puerta-marco.png`](referencias/piezas/01-puerta-marco.png) | Arco facetado con chaflanes y franjas cian. | — | APLICACION §4 |
| [`02-consola.png`](referencias/piezas/02-consola.png) | Carcasa curva con pantalla inclinada y teclas. | El dibujo de la pantalla. | APLICACION §4 |
| [`03-caja.png`](referencias/piezas/03-caja.png) | Caja biselada con banda teal. | — | APLICACION §4 |
| [`04-panel-solar.png`](referencias/piezas/04-panel-solar.png) | Panel de 6 celdas sobre eje y pedestal octogonal. | — | APLICACION §4 |
| [`05-jardinera.png`](referencias/piezas/05-jardinera.png) | Jardinera alargada con franja cian y hojas facetadas. | Solo interiores. | APLICACION §4 |
| [`06-deposito.png`](referencias/piezas/06-deposito.png) | Cilindro facetado con fluido teal y tapas. | — | APLICACION §4 |
| [`07-banco.png`](referencias/piezas/07-banco.png) | Banco con tres cojines teal y franja cian. | — | APLICACION §4 |
| [`08-antena.png`](referencias/piezas/08-antena.png) | Plato facetado lila sobre mástil y base. | — | APLICACION §4 |
| [`09-kit-interior-logistica.png`](referencias/piezas/09-kit-interior-logistica.png) | Catálogo interior: estanterías, recipientes, herramientas, muebles. | No son PNG individuales ni mallas exportadas. | APLICACION §4 |
| [`10-kit-exterior-modular.png`](referencias/piezas/10-kit-exterior-modular.png) | Envolventes, conectores, esclusa, energía, agua, transporte. | **Amarillo y negro industrial**: se reinterpreta en marfil, lila y cian. Los vehículos no implican simulación de conducción. | APLICACION §4 · DISEÑO §7 |

## 7. Exterior (`exterior/`, 3)

| Lámina | Tomar | Ignorar | Doc |
| --- | --- | --- | --- |
| [`01-corredores-conexiones.png`](referencias/exterior/01-corredores-conexiones.png) | Cruces con varias salidas, costillas, ventanas, servicios empotrados. | Cables sueltos en el piso (van por canaleta). | ESCENAS §4.1 |
| [`02-kit-entorno-cultivos.png`](referencias/exterior/02-kit-entorno-cultivos.png) | Familias de suelo, rocas pequeñas, montículos, caminos. | Los cultivos sueltos son piezas para el invernadero, no para el exterior. | ESCENAS §4.2 · MARTE §3 |
| [`03-exterior-organizacion.png`](referencias/exterior/03-exterior-organizacion.png) | **Referencia principal de distribución:** claro central, sectores, corredores, dos anillos con balizas, plataforma con nave separada del cultivo, refugio de regolito. | El icono de **cruz** en la enfermería (va escudo). Las coordenadas exactas: mandan las de `mundo.ts`. | ESCENAS §3.3 |

---

## Descartados (no están en el repo y no vuelven)

| Material | Motivo |
| --- | --- |
| `ampliacion-v8/laminas/07-comedor-descanso.png` (v1) | Tenía árboles en el exterior; reemplazada por `07b`. |
| Captura del prototipo de laboratorio (pág. 3 del atlas) | Prototipo técnico descartado, no es dirección visual. |
| Variantes con fondo distinto de doctora, meteoróloga y carga | Mismo contenido que las curadas. |
| Recortes alfa de las 8 piezas y 4 capas en el PDF | Mismo contenido que `piezas/01–08` e `inicio/capas/`. |
| Atlas v2 (capibara), v3, v4, v5, v7 y entradas crudas de la ampliación | Direcciones anteriores reemplazadas por v8. |
