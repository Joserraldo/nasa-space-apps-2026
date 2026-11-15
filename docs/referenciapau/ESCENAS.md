# ESCENAS: pantallas, mundo abierto, mapa y estaciones

**Qué es:** el índice de cada lugar del juego con lo que contiene, qué lámina lo define y qué fase del juego lo muestra. **Cómo se ve** cada cosa está en [DISEÑO.md](DISEÑO.md); **qué hace** el jugador allí, en [MECANICAS.md](MECANICAS.md).

Fases reales de la UI (`ui/src/juego/reductor.ts`): `inicio` · `satelite` · `sitio` · `modulos` · `base` · `tormenta` · `final`. El tick de la UI es de 4000 ms (`ui/src/App.tsx`); no se cambia para acomodar animaciones.

---

## 1. Índice de escenas

| # | Escena | Fase UI | Paso de Jezero | Cámara | Lámina principal |
| --- | --- | --- | --- | --- | --- |
| E0 | Portada | `inicio` | — | Orbital fija | [`inicio/01`](referencias/inicio/01-inicio-actualizado.png) |
| E1 | Intro (4 viñetas, omitible) | `inicio` | — | 2D | [`inicio/02`](referencias/inicio/02-intro-cuatro-momentos.png) |
| E2 | Carga | entre fases | — | 2D | [`inicio/03`](referencias/inicio/03-panel-carga.png) |
| E3 | Órbita y satélite | `satelite` | 1 y 2 | Órbita | Pendiente de lámina (ver §2.4) |
| E4 | Elegir sitio de aterrizaje | `sitio` | 3 | Mapa de Jezero | Pendiente de lámina (ver §2.5) |
| E5 | Colocar módulos | `modulos` | 4 | Mundo abierto | [`mundo/01`](referencias/mundo/01-exterior-tercera-persona.png) + [`ui/04`](referencias/ui/04-consulta-comparacion-fuente.png) |
| E6 | Base abierta (explorar, consultar, decidir) | `base` | 4 a 7 | Tercera / primera persona (`KeyV`) | [`mundo/01`](referencias/mundo/01-exterior-tercera-persona.png), [`mundo/02`](referencias/mundo/02-exterior-primera-persona.png) |
| E7 | Tormenta y dilema | `tormenta` | 5 y 6 | Mundo abierto en pausa + panel | [`ui/01`](referencias/ui/01-dialogo-decision.png), [`personajes/07`](referencias/personajes/07-tripulacion-mecanicas.png) |
| E8 | Final y cadena de causas | `final` | 8 | 2D | Familia UI de [`ui/03`](referencias/ui/03-variantes-facetadas.png) |
| E9 | Interiores de estaciones | `base` (ampliación) | — | Tercera persona en corte | [`estaciones/`](referencias/estaciones/) |
| — | Respaldo 2D | todas | todos | Lista de lugares | Misma UI, sin canvas |

---

## 2. Pantallas

### 2.1 E0 Portada
Composición y capas en [DISEÑO.md](DISEÑO.md) §6. Contenido: logo oficial, `Start mission`, `Continue` (solo con guardado válido), `Settings`, selector EN/ES, acceso opcional de cuenta o invitado (`ui/src/componentes/Cuenta.tsx`), sonido, fuentes y créditos. **El HUD de recursos no se muestra en la portada.** El cable (tether) existe solo aquí.

### 2.2 E1 Intro
Cuatro viñetas: la misión, observar, la tripulación, decidir solo. Botón de omitir que lleva al mismo estado inicial. No vuelve a mostrar el menú.

### 2.3 E2 Carga
Ilustración ámbar, consejo corto, indicador indeterminado. Si falla: reintentar o volver sin perder estado.

### 2.4 E3 Órbita y satélite (pasos 1 y 2)
La nave suelta el satélite y el niño traza una ruta sobre Jezero viendo bajar batería y señal (`GameState.orbita`). **No hay lámina v8 de esta pantalla.** Mientras no exista: misma familia de tarjetas y placas de DISEÑO §5, fondo espacial de la portada y Marte facetado visto desde órbita con el sombreado real (`data/terreno/jezero/sombreado.jpg`) como guía de relieve. No inventar una estética nueva.

### 2.5 E4 Elegir sitio (paso 3)
Mapa de Jezero desde arriba con los **4 sitios candidatos** de `MISION_JEZERO.sitiosCandidatos` (llanura central, cerca de Perseverance, pie de la pared sur, sobre el borde oeste). Cada sitio muestra sus criterios y su costo de aterrizaje antes de confirmar. Relieve del DEM real con la fuente visible ("NASA Mars Trek, datos reales, no en vivo"). Tarjetas y botones de la familia v8. **Sin lámina propia:** la composición se valida con María Paula antes de cerrarla.

### 2.6 E8 Final
Resultado (`exito` o `fallo` desde `estado.resultado`), cadena de causas que separa **decisión** de **mala suerte**, tarjetas de ciencia con fuente y pregunta final. Botón para repetir la misma semilla o probar otra.

---

## 3. Mundo abierto: la base de Jezero (E5, E6, E7)

### 3.1 Qué se ve (de `mundo/01` y `mundo/02`)

Vista en tercera persona por detrás del niño, en un claro de regolito con camino de baldosas lila. Elementos de la lámina, de cerca a lejos:

- El **niño** de espaldas en primer plano; la **Ingeniera** frente a él explicando.
- **Consola del controlador solar** con pantalla (Sol y barras), resaltada con contorno cian porque es el objeto interactivo cercano.
- Dos **paneles solares** sobre pedestal junto a la consola; una fila de cuatro paneles más atrás a la izquierda.
- **Iris** (rover) a la derecha.
- **Balizas** cilíndricas con luz cian a los lados del camino.
- Rocas basálticas facetadas de varios tamaños, sueltas.
- Al fondo: **torre de control** con anillo de ventanas (centro), **antena parabólica** sobre un montículo (izquierda), **hábitat** alargado con puerta y ventanas cian, dos **cúpulas de invernadero** con plantas adentro, y un **refugio cubierto de regolito** (montículo con puerta) a la derecha.
- Horizonte con crestas lejanas (bajas y desaturadas según [MARTE.md](MARTE.md) §3).

En primera persona (`mundo/02`) se ve lo mismo desde los ojos del niño, con sus **guantes teal** visibles en las esquinas inferiores y el letrero de cámara cambiado a `Third person`. Las dos láminas no son el mismo render: al implementar se fijan posiciones y cámaras y se comprueban colisiones.

HUD sobre el mundo: ver [DISEÑO.md](DISEÑO.md) §5.2.

### 3.2 Mapa de la base (coordenadas reales del juego)

Plano: [`mapa-base-jezero.svg`](mapa-base-jezero.svg). Coordenadas en metros de juego, Y arriba, la cámara inicial mira hacia −Z. **No son coordenadas geográficas de Jezero.** Fuente: `LUGARES` en `ui/src/escena/mundo.ts` (la escena 3D y la lista accesible leen la misma tabla).

| `LugarId` | Jugador `x, z` | Modelo `mx, mz` | Quién atiende / qué módulo | Representación |
| --- | --- | --- | --- | --- |
| `mesa` | 0, 1.6 | 0, 0.2 | — | Centro: mesa de relieve y consola de misión, espacio libre alrededor. Aquí se planifica, se gestiona y se envía la telemetría. |
| `habitat` | 0, −4.3 | 0, −8 | Doctora | Hábitat del fondo: soporte vital y consulta de protección. Interior completo más adelante (comedor, descanso, enfermería). |
| `taller` | −4, 0.1 | −4.8, −1.4 | Ingeniera | Servicio izquierdo: energía, reparación de Iris. El almacén es un anexo visual de este sector. |
| `sensor` | 4.2, 0.6 | 4.8, −0.8 | Meteoróloga | Observación derecha: instrumento, consola y señal de evento. |
| `panel_solar` | −8, −0.5 | −8, −3.5 | módulo `panel_solar` | Plataforma, bastidor, celdas y controlador. |
| `escudo` | −4.5, −5.3 | −5.4, −7.2 | módulo `escudo` | Carcasa de refuerzo con señal de estado. Distinto de la acción de refugiarse. |
| `reciclador_agua` | 4.6, −4.2 | 5.4, −6.8 | módulo `reciclador_agua` | Dos depósitos y conexiones. |
| `invernadero` | 9, −0.4 | 9, −5 | módulo `invernadero` | Cúpula triangulada, bandejas y tres siluetas vegetales adentro. |
| `antena` | 9.6, 4.4 | 11, 5.6 | módulo `antena` | Base, mástil y plato. |
| `banco` | −4.6, 4.4 | −7.7, 6.7 | — | Experimento opcional de caída (rampa y caja). No es necesario para ganar. |

**Recorridos [propuesta de estilo]:** dos circuitos en bucle desde el centro: **A (oeste)** `mesa → taller → panel_solar → escudo → habitat → mesa` y **B (este)** `mesa → sensor → reciclador_agua → invernadero → antena → mesa`, más un atajo por `banco`. Se puede caminar libre por todo el mapa en cualquier fase; las fases ordenan decisiones, no bloquean lugares.

**Los cinco anclajes de módulo siempre existen**, pero solo los dos módulos que el jugador construyó se ven construidos. Los otros tres se muestran como anclaje o propuesta (base marcada en el suelo), nunca como equipo funcionando.

### 3.3 Organización de referencia de la base completa

[`exterior/03-exterior-organizacion.png`](referencias/exterior/03-exterior-organizacion.png) muestra la base completa vista desde arriba: claro central, plataforma de aterrizaje con nave arriba a la izquierda, grupo de energía (paneles, baterías, depósitos y almacén) a la izquierda, cúpula de control en el centro conectada por corredores, invernadero geodésico arriba a la derecha, laboratorio y enfermería a la derecha, comedor y descanso abajo, refugio cubierto de regolito abajo a la izquierda, y dos caminos en anillo con balizas.

Relación de sectores (atlas) con los lugares del juego (esto **no crea `LugarId` nuevos**; si el equipo quisiera más lugares, se decide con contrato):

| Sector del atlas | Lugar del juego que lo representa |
| --- | --- |
| Centro (control + espacio común) | `mesa` |
| Energía y servicio (ingeniería, almacén, paneles) | `taller`, `panel_solar` |
| Cultivo (invernadero, agua) | `invernadero`, `reciclador_agua` |
| Ciencia y atención (laboratorio, enfermería) | `sensor`, `habitat` |
| Descanso (hábitat, comedor) | `habitat` |
| Protección (refugio) | `escudo` y el espacio protegido del `habitat` |
| Llegada (esclusa, plataforma) | Borde exterior, decorado |

Reglas de recorrido: claro central que conecta los dos circuitos sin obligar a pasar siempre por él; energía accesible sin cruzar cultivos; cultivos detrás de su cerramiento; refugio alcanzable por más de una ruta; plataforma de llegada separada del cultivo.

### 3.4 Panel `Map` (botón de la UI)

**Propuesta de estilo, pendiente de aprobación de María Paula.** El botón `Map` abre un plano cenital simplificado de §3.2 dibujado con la familia v8 (tarjeta marfil, suelo `regolito`, caminos `camino`, lugares como placas facetadas con icono), con la posición del niño, el objetivo actual resaltado en cian y los módulos construidos frente a los anclajes vacíos. Es también la **lista accesible de lugares**: cada lugar es un botón que lleva al niño hasta allí, con el mismo resultado que caminar.

---

## 4. Estaciones (interiores, ampliación posterior)

Las ocho estaciones son **oportunidades de interacción, no ocho misiones obligatorias**. Se construyen después de cerrar la base compacta (ver [APLICACION.md](APLICACION.md) §8). Panorama del kit: [`estaciones/00-panorama-estaciones-y-piezas.png`](referencias/estaciones/00-panorama-estaciones-y-piezas.png).

| Estación | Láminas (base / ampliación) | Piezas comunes | Identidad propia | Animación funcional | Lugar del juego |
| --- | --- | --- | --- | --- | --- |
| **Esclusa y llegada** | [`01`](referencias/estaciones/01-esclusa.png) | Marco, puerta, pared, caja, luz, rejilla | Rack de cascos, indicador de presión, rampa | Hojas que deslizan con pivote lateral; indicador según estado | Borde exterior |
| **Control de misión** | [`02`](referencias/estaciones/02-control-mision.png) / [`02b`](referencias/estaciones/02b-control-operaciones.png) | Marco, consola, banco, lámpara, caja | Mesa de terreno central, cúpula panorámica, puestos en ángulo con paso por detrás | Enlace y "respuesta pendiente" con ticks reales; pantallas sin telemetría inventada | `mesa` |
| **Invernadero e hidroponía** | [`03`](referencias/estaciones/03-invernadero.png) / [`03b`](referencias/estaciones/03b-invernadero-cultivos.png) | Consola, tanque, lámpara, marco | Ventanas trianguladas, filas de bandejas, cultivos de hoja, fruto y grano, semilleros, cultivo vertical | Caudal y estado del equipo; las plantas no crecen sin estado del motor | `invernadero` |
| **Laboratorio de muestras** | [`04`](referencias/estaciones/04-laboratorio.png) / [`04b`](referencias/estaciones/04b-laboratorio-investigacion.png) | Mesa, caja, consola, tanque, banco | Cámara de experimento con **planta o roca** (nunca un esqueleto ni una persona), vitrinas, microscopio | Enfoque de muestra y tapa; inspeccionar no da recursos | `sensor` (ampliación) |
| **Ingeniería y energía** | [`05`](referencias/estaciones/05-ingenieria.png) / [`05b`](referencias/estaciones/05b-almacen-logistica.png) | Consola, mesa, caja, marco | Panel solar en eje, baterías, banco de trabajo, herramientas, dock de Iris; almacén con estanterías por bahías, cajas de tres tamaños, canisters, mesa de recepción y carrito | Panel que gira en su eje; instalando frente a funcionando | `taller` |
| **Enfermería y atención** | [`06`](referencias/estaciones/06-enfermeria.png) / [`06b`](referencias/estaciones/06b-enfermeria-atencion.png) | Tanque, consola, banco, marco | Camilla, carrito, armario, lavamanos, botiquín con **escudo** | Gestos tranquilos; ninguna lesión ni barra de salud | `habitat` |
| **Descanso, comedor y espacio común** | [`07`](referencias/estaciones/07-descanso-comedor.png) / [`07b`](referencias/estaciones/07b-comedor-descanso-marte.png) / [`07c`](referencias/estaciones/07c-espacio-comun.png) | Mesa, banco, caja, lámpara, rejilla | Literas, dispensador, raciones y tazas, mesa maestra repetida; espacio común circular con jardinera interior en el centro y circulación alrededor | Sentarse es un gesto: no recupera soporte vital | `habitat` |
| **Refugio solar** | [`08`](referencias/estaciones/08-refugio.png) | Puerta, banco, tanque, consola, caja, estantería | Cubierta de regolito, señalización ámbar puntual, antena | Puerta y estado de protección; entrar caminando no blinda | `escudo` / `habitat` |

### 4.1 Corredores y conectores
[`exterior/01-corredores-conexiones.png`](referencias/exterior/01-corredores-conexiones.png): cruces con varias salidas, costillas y paneles repetidos, ventanas y servicios empotrados. Piso despejado (los cables de la lámina se reemplazan por canaleta). Múltiples salidas para explorar y volver, nunca un túnel lineal.

### 4.2 Entorno exterior
[`exterior/02-kit-entorno-cultivos.png`](referencias/exterior/02-kit-entorno-cultivos.png): familias de suelo, rocas pequeñas, montículos y caminos para el exterior. Los cultivos aislados de esa lámina son piezas **para el invernadero**, no vegetación exterior.

### 4.3 Siete comprobaciones antes de integrar una estación o el exterior
1. Paleta y facetas fieles al atlas, también al cambiar luz o cámara.
2. Entradas, pasillos y controles esenciales alcanzables y legibles.
3. Muebles, sillas, rocas y tuberías fuera del paso y de la cámara.
4. El niño puede consultar, salir y elegir otra estación sin circuito obligatorio.
5. El decorado no vuelve confuso qué objeto es interactivo.
6. Se distingue cultivo protegido, dato científico y simplificación de juego.
7. Ninguna estatua, ruina, portal o construcción de piedra.
