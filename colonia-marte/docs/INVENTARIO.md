# Inventario de objetos, escenarios y personajes

Fuente: fotogramas nítidos extraídos de los videos originales en máxima
resolución (V1 y V2 a 2560x1440, V3 a 3840x2160), uno por toma, elegidos por
menor desenfoque medido con `ffmpeg blurdetect`. Están en
`docs/referencias/v1/`, `v2/`, `v3/`, nombrados `vN-tSSS.SS.jpg` (segundo del video).

Objetivo: **misma estética, no copia**. Cada ficha describe qué es y cómo se
construye con código; no se calcan proporciones ni siluetas exactas.

Prioridad: **P1** = necesario para las piezas representativas (Fase 1 y 3 del plan);
**P2** = kit completo; **P3** = ambientación opcional.

---

## 0. Hallazgos que condicionan todo

1. **V1 y V2 son la misma estación.** V2 la muestra vacía (sin personajes) e
   incluye el casco exterior (`v2-t076.30`) y un corte que deja ver los cuartos
   como módulos independientes (`v2-t079.40`). Conclusión: el interior es un
   **kit modular sobre rejilla**, no salas modeladas una por una.
2. **Hay dos estilos de personaje en V1** (ver sección 3):
   - **Estilo A** (`v1-t039.90`, `v1-t041.30`, fondos de casi todas las tomas):
     low-poly facetado real, cara sin nariz ni boca, ojos como franja oscura,
     ropa en bloques de color plano. Es el estilo del asset.
   - **Estilo B** (`v1-t033.40`, `v1-t029.50`, `v1-t000.50`): caras con labios,
     maquillaje, pestañas y gafas detalladas, con manchas típicas de
     post-proceso generativo. Probablemente retocado con IA (NO VERIFICADO).
   - Decisión propuesta: **el estilo A es el objetivo base**; el B se trata como
     variante "héroe" opcional con más detalle de cara.
3. **El terreno de V3 no es facetado** como se dijo en la primera versión del
   plan: es **suave** con manchas de nieve de **borde duro** (casi estilo
   cartoon/toon), sobre roca rojo óxido. Solo el suelo cercano tiene ondulaciones
   leves (`v3-t079.90`, `v3-t104.90`).
4. V3 usa **profundidad de campo** en planos cercanos (`v3-t016.40`) y un
   **anillo planetario** en el cielo (`v3-t065.50`, `v3-t099.50`). **Corregido en 7.1:** no se usa, Marte no tiene anillos.
5. Etiqueta de zona (HUD) en V1: panel oscuro con borde cian, icono a la
   izquierda, texto en mayúsculas, barra naranja a la derecha (`v1-t021.50`).

---

## 1. Estación espacial (V1 + V2)

### 1.1 Arquitectura modular

| ID | Objeto | Referencias | Construcción por código | Prior. |
|---|---|---|---|---|
| ST-W01 | Pared lisa con panel en relieve | v2-t048.10, v2-t057.60 | Caja + inset biselado; variantes de 1, 2 y 4 m | P1 |
| ST-W02 | Pared con tira LED vertical/horizontal | v1-t016.10, v2-t053.50 | Pared + ranura con material emisivo cian | P1 |
| ST-W03 | Pared con ventana octogonal (estrellas) | v1-t037.50, v2-t052.40 | Marco octogonal biselado + plano con cielo estrellado | P1 |
| ST-W04 | Ventanal panorámico | v1-t012.40, v2-t039.70, v2-t042.60 | Marco ancho con esquinas achaflanadas + cielo | P2 |
| ST-W05 | Pared con rejilla de ventilación | v2-t053.50, v2-t067.70 | Caja con extrusiones en serie | P2 |
| ST-W06 | Panel con emblema hexagonal | v2-t013.10, v2-t059.80 | Hexágono en relieve oscuro | P2 |
| ST-W07 | Moldura angular decorativa (líneas quebradas) | v2-t013.10, v2-t048.10 | Perfil 2D extruido como cinta oscura sobre pared | P1 |
| ST-C01 | Columna achaflanada con LED vertical | v1-t004.60, v2-t010.40 | Prisma octogonal + ranura emisiva | P1 |
| ST-D01 | Marco de puerta sci-fi (achaflanado) | v2-t035.00, v2-t049.20 | Perfil extruido en arco con chaflanes | P1 |
| ST-D02 | Hoja de puerta con patrón diagonal | v2-t049.20, v2-t063.30 | Panel con incrustaciones en diagonal + luz indicadora | P2 |
| ST-D03 | Arco de paso / umbral entre salas | v2-t065.90, v1-t043.50 | Marco grueso con chaflán | P1 |
| ST-F01 | Baldosa grande con junta oscura | v1-t019.90, v2-t072.50 | Rejilla de quads + líneas de junta | P1 |
| ST-F02 | Incrustación de suelo (rectángulo redondeado) | v1-t041.30 | Curva 2D desplazada, relieve leve, color secundario | P2 |
| ST-F03 | Suelo con patrón angular gris/blanco | v2-t063.30 | Polígonos 2D en dos tonos | P2 |
| ST-F04 | Plataforma circular emisiva (anillo) | v1-t004.60, v2-t008.20 | Disco + anillos emisivos + escalón | P1 |
| ST-F05 | Escalera con LED en el borde | v1-t027.70, v2-t013.10 | Peldaños en serie + franja emisiva | P2 |
| ST-R01 | Techo con paneles y LED lineal | v2-t042.60, v2-t052.40 | Rejilla de cajas + franjas emisivas | P1 |
| ST-R02 | Lámpara anular de techo | v1-t021.50, v2-t017.10 | Toro o anillo poligonal emisivo + aro gris | P1 |
| ST-R03 | Artesonado octogonal con luz | v2-t003.00 | Anillos octogonales escalonados | P2 |
| ST-R04 | Plafón circular (downlight) | v2-t057.60, v2-t063.30 | Cilindro bajo + cara emisiva | P1 |
| ST-R05 | Disco de ventilación con luz cian | v1-t023.60, v2-t070.70 | Disco con aspas + aro emisivo | P2 |
| ST-R06 | Claraboya con estrellas (atrio) | v2-t008.20 | Anillo de vigas radiales + cielo | P3 |
| ST-B01 | Balcón de dos niveles con baranda | v1-t045.20, v2-t008.20 | Losa curva + baranda de postes y riel | P2 |
| ST-X01 | Casco exterior (módulos azul marino con ranuras cian) | v2-t076.30, v2-t081.90 | Cajas biseladas con ranuras emisivas en serie | P3 |
| ST-X02 | Cúpula observatorio exterior | v2-t076.30 | Media esfera de vigas + vidrio | P3 |

### 1.2 Mobiliario por zona

**Atrio** (`v1-t004.60`, `v1-t007.60`, `v2-t008.20`)

| ID | Objeto | Construcción | Prior. |
|---|---|---|---|
| AT-01 | Estatua abstracta (figuras estilizadas sosteniendo un orbe con anillos) | Diseño propio: formas torsionadas por curvas + esfera emisiva + anillos | P2 |
| AT-02 | Terminal/quiosco de información con pantalla | Caja inclinada + pantalla emisiva con UI generada en canvas | P1 |
| AT-03 | Holograma de persona (cian translúcido) | Personaje con material aditivo + ruido de líneas | P3 |
| AT-04 | Sofá modular bajo | Cajas biseladas, cojines grises | P1 |
| AT-05 | Jardinera rectangular con plantas | Caja + plantas low-poly (ver PR-01) | P1 |

**Sala de briefing** (`v1-t008.90`, `v1-t011.40`, `v2-t003.00`)

| ID | Objeto | Construcción | Prior. |
|---|---|---|---|
| BR-01 | Butaca de auditorio con LED lateral | Respaldo alto biselado + franja emisiva | P2 |
| BR-02 | Gradas escalonadas | Escalones con borde emisivo | P2 |
| BR-03 | Atril | Prisma trapezoidal | P2 |
| BR-04 | Pantalla mural gigante con UI | Plano emisivo + UI en canvas | P2 |

**Sala de conferencias** (`v1-t012.40`, `v1-t014.80`, `v2-t042.60`)

| ID | Objeto | Construcción | Prior. |
|---|---|---|---|
| CF-01 | Mesa larga facetada con pantallas embutidas | Losa con chaflanes + insets oscuros + borde LED | P2 |
| CF-02 | Silla de oficina con ruedas | Asiento + respaldo biselados, base en estrella | P1 |
| CF-03 | Aparador bajo con cajones | Caja + insets + tiradores emisivos | P1 |

**Sala de control** (`v1-t016.10`, `v1-t018.50`, `v2-t039.70`)

| ID | Objeto | Construcción | Prior. |
|---|---|---|---|
| CR-01 | Consola curva con pantallas | Segmento de anillo extruido + pantallas inclinadas | P2 |
| CR-02 | Silla de piloto voluminosa | Bloques biselados, apoyabrazos con LED | P2 |
| CR-03 | Escritorio con monitor | Losa + monitor emisivo | P1 |

**Comedor** (`v1-t019.90`, `v1-t021.50`, `v2-t013.10`, `v2-t017.10`)

| ID | Objeto | Construcción | Prior. |
|---|---|---|---|
| DN-01 | Mesa de comedor | Losa biselada + pie central | P1 |
| DN-02 | Silla con cojín azul | Bloques biselados, color secundario azul | P1 |
| DN-03 | Reservado (banco en U) | Perfil extruido | P2 |
| DN-04 | Dispensador de comida con pantalla (iconos de comida) | Caja con nicho + pantalla con icono generado en canvas | P1 |
| DN-05 | Barra con taburetes | Mostrador extruido + borde LED + taburetes | P2 |
| DN-06 | Farol de mesa | Prisma con caras emisivas | P1 |
| DN-07 | Set de condimentos / servilletero | Cilindros y cajas pequeñas | P3 |
| DN-08 | Estante de cubículos en pared | Rejilla de cajas huecas | P2 |
| DN-09 | Papelera | Cilindro con tapa | P3 |

**Gimnasio** (`v1-t023.60`, `v2-t071.00`, `v2-t072.50`)

| ID | Objeto | Construcción | Prior. |
|---|---|---|---|
| GY-01 | Cinta de correr con pantalla | Base + banda + barra + pantalla | P2 |
| GY-02 | Rack de press con barra y discos | Postes + barra + cilindros | P2 |
| GY-03 | Rack de mancuernas | Estante inclinado + pares de cilindros | P2 |
| GY-04 | Bicicleta estática | Marco simple + volante | P3 |
| GY-05 | Banco de pesas | Caja acolchada sobre patas | P2 |
| GY-06 | Árbol de discos | Poste + discos apilados | P3 |

**Zona de entretenimiento** (`v1-t027.70`, `v1-t029.50`, `v1-t033.40`, `v2-t022.80`, `v2-t024.70`, `v2-t028.90`)

| ID | Objeto | Construcción | Prior. |
|---|---|---|---|
| EN-01 | Mesa de billar (paño azul) | Caja biselada + paño + bolas + tacos | P2 |
| EN-02 | Mesa de póker (paño teal, fichas, cartas) | Óvalo extruido + pilas de cilindros + planos | P2 |
| EN-03 | TV grande + sofá gamer | Pantalla emisiva + sofá modular | P2 |
| EN-04 | Pista de bolos (pista, bolos, retorno de bolas) | Plano de madera + bolos por torno + caja de retorno | P3 |
| EN-05 | Pantalla mural con icono temático | Plano emisivo con icono en canvas | P2 |

**Departamentos** (`v1-t036.00`, `v1-t037.50`, `v2-t048.10` a `v2-t065.90`)

| ID | Objeto | Construcción | Prior. |
|---|---|---|---|
| AP-01 | Cama con base LED | Base + colchón + almohada biselados | P2 |
| AP-02 | Litera | Dos camas + estructura + escalera | P2 |
| AP-03 | Escritorio con monitor y silla | Losa + monitor + CF-02 | P1 |
| AP-04 | Sofá y mesa de centro | Bloques biselados | P2 |
| AP-05 | Cuadro (paisaje desértico con atardecer, diseño propio) | Plano con ilustración generada por código | P3 |
| AP-06 | Armario / casillero alto con hexágono | Caja alta + emblema | P2 |
| AP-07 | Repisa con LED inferior | Losas + emisivo | P2 |
| AP-08 | Lata, libro, lámpara de escritorio | Cilindro / caja / brazo articulado | P3 |

**Baño** (`v2-t053.50`, `v2-t055.20`, `v2-t067.70`)

| ID | Objeto | Construcción | Prior. |
|---|---|---|---|
| BT-01 | Ducha en cabina con LED | Marco achaflanado + paneles | P2 |
| BT-02 | Lavabo con espejo de marco LED | Mostrador extruido + espejo + marco emisivo | P2 |
| BT-03 | Inodoro | Bloques biselados | P3 |
| BT-04 | Dispensador de jabón, vaso con cepillos | Piezas pequeñas | P3 |

**Lavandería** (`v1-t043.50`, `v2-t057.00`)

| ID | Objeto | Construcción | Prior. |
|---|---|---|---|
| LD-01 | Lavadora apilable (columna) | Caja + puerta circular | P2 |
| LD-02 | Mesa de doblar | Losa + patas | P3 |
| LD-03 | Estantería abierta | Rejilla de losas | P2 |
| LD-04 | Canasto de ropa | Caja abierta | P3 |

**Bar / lounge** (`v1-t039.90`, `v1-t041.30`)

| ID | Objeto | Construcción | Prior. |
|---|---|---|---|
| BA-01 | Estantería de botellas retroiluminada | Rejilla + botellas por torno | P2 |
| BA-02 | Sofá lounge con respaldo alto | Perfil extruido | P2 |
| BA-03 | Aplique de pared | Cápsula emisiva | P2 |

### 1.3 Props transversales

| ID | Objeto | Referencias | Construcción | Prior. |
|---|---|---|---|---|
| PR-01 | Planta low-poly (hojas anchas) | v2-t010.40, v2-t031.80 | Hojas como planos doblados instanciados en espiral | P1 |
| PR-02 | Maceta blanca con aro LED | v2-t031.80 | Cilindro achaflanado + aro emisivo | P1 |
| PR-03 | Tablet / pantalla de mano | v1-t016.10 | Caja fina + pantalla | P3 |
| PR-04 | Pantalla holográfica flotante | v1-t029.50 | Plano aditivo cian con UI | P3 |
| PR-05 | UI de pantallas (gráficos, mapas, iconos) | v2-t031.80 | Generada en canvas 2D por código, reutilizable | P1 |

---

## 2. Colonia en Marte (V3)

### 2.1 Entorno

| ID | Objeto | Referencias | Construcción | Prior. |
|---|---|---|---|---|
| MT-T01 | Terreno ondulado suave rojo óxido | v3-t079.90, v3-t104.90 | Plano subdividido + ruido fBm, sombreado suave | P1 |
| MT-T02 | Manchas de nieve de borde duro | v3-t006.70, v3-t034.80 | Shader: umbral sobre ruido + pendiente + altura, sin degradé | P1 |
| MT-T03 | Montañas de fondo con nieve | v3-t065.50, v3-t099.50 | Anillo de terreno lejano con más amplitud | P1 |
| MT-T04 | Pilar rocoso (hoodoo) con nieve encima | v3-t010.60, v3-t112.30 | Cilindro deformado + casquete blanco | P1 |
| MT-T05 | Rocas pequeñas | v3-t079.90 | Icosfera deformada | P1 |
| MT-T06 | Meseta circular elevada | v3-t099.50 | Cilindro achatado con nieve | P3 |
| MT-S01 | Cielo (observado: lavanda con anillo; **corregido en 7.1: caramelo, sin anillo**) | v3-t065.50 | Domo con shader de degradé caramelo y halo azul junto al Sol al atardecer | P1 |
| MT-S02 | Naves lejanas con luces | v3-t099.50 | Siluetas simples + puntos emisivos | P3 |

### 2.2 Hábitats y edificios

| ID | Objeto | Referencias | Construcción | Prior. |
|---|---|---|---|---|
| MB-01 | Cápsula de paneles hexagonales (tipo balón) con hex emisivo amarillo | v3-t054.60, v3-t104.90 | Icosaedro truncado (caras hex/pent), cada cara con inset y centro emisivo | P1 |
| MB-02 | Hub octogonal central | v3-t054.60 | Prisma octogonal + tapa + equipos laterales | P1 |
| MB-03 | Túnel conector entre módulos | v3-t054.60, v3-t021.30 | Cilindro con anillos | P1 |
| MB-04 | Domo geodésico grande | v3-t079.90, v3-t089.70 | Icosfera subdividida, media esfera, aristas en relieve | P1 |
| MB-05 | Domo de estructura (marco abierto) con vidrio | v3-t026.40 | Mismo domo con caras en vidrio y aristas en vigas | P2 |
| MB-06 | Biodomo de vidrio con árbol dentro | v3-t095.40 | Esfera de vidrio + estructura de patas | P3 |
| MB-07 | Torre de vidrio teal | v3-t029.40 | Prisma de sección redondeada + frente de vidrio con franjas | P1 |
| MB-08 | Bloque residencial de módulos apilados | v3-t109.20, v3-t112.30 | Cajas apiladas con ventanas LED en serie | P2 |
| MB-09 | Torre de mando circular con anillo y base de vidrio | v3-t060.40, v3-t070.20 | Cilindros escalonados + paneles + antena | P2 |
| MB-10 | Hangar / garaje con portón y ventiladores en techo | v3-t050.10, v3-t074.80 | Caja + chaflán + portón + discos de ventilador | P2 |
| MB-11 | Invernadero largo (techo de vidrio) | v3-t050.10, v3-t029.40 | Prisma con techo a dos aguas de vidrio | P2 |
| MB-12 | Estructura circular de pasillo alrededor de un hub | v3-t044.90 | Toroide segmentado + hub central | P3 |
| MB-13 | Edificio industrial alto con número pintado | v3-t010.60, v3-t044.90 | Bloques escalonados + decal numérico | P3 |
| MB-14 | Torre de control | v3-t060.40 | Fuste + cabina poligonal con vidrio | P3 |

### 2.3 Infraestructura y props

| ID | Objeto | Referencias | Construcción | Prior. |
|---|---|---|---|---|
| MI-01 | Calle pavimentada con línea LED discontinua | v3-t026.40, v3-t074.80 | Losas + rectángulos emisivos en serie | P2 |
| MI-02 | Poste de luz con LED | v3-t026.40 | Cilindro + franjas emisivas | P2 |
| MI-03 | Tubería con codos y anillos cian | v3-t054.60, v3-t089.70 | Curva + tubo + anillos emisivos | P1 |
| MI-04 | Panel solar en mástil orientable | v3-t079.90 | Mástil + rejilla de celdas | P1 |
| MI-05 | Antena parabólica de celdas hexagonales | v3-t016.40, v3-t074.80 | Disco de hexágonos + soporte | P2 |
| MI-06 | Baliza / cápsula con ventanas cian | v3-t054.60, v3-t040.00 | Cápsula + paneles emisivos | P1 |
| MI-07 | Plataforma de aterrizaje octogonal con escalera | v3-t016.40, v3-t089.70 | Prisma octogonal sobre estructura + escalera | P2 |
| MI-08 | Torreta defensiva sobre base circular | v3-t089.70 | Base + torreta + cañones | P3 |
| MI-09 | Contenedores de carga gris/amarillo | v3-t040.00 | Cajas biseladas con franjas | P2 |
| MI-10 | Tanque de combustible horizontal | v3-t050.10 | Cápsula + soportes | P2 |
| MI-11 | Cubo de suministros con luz roja | v3-t104.90 | Caja + emisivo rojo | P3 |

### 2.4 Vehículos

| ID | Objeto | Referencias | Construcción | Prior. |
|---|---|---|---|---|
| MV-01 | Camión rover 6 ruedas (amarillo/gris) | v3-t079.90 | Cabina + caja biseladas + 6 ruedas | P2 |
| MV-02 | Blindado 6x6 | v3-t026.40 | Casco facetado + ruedas | P2 |
| MV-03 | Buggy 4x4 con luces cian | v3-t040.00, v3-t104.90 | Chasis + jaula + ruedas grandes | P2 |
| MV-04 | Caza con franjas amarillas | v3-t005.10 | Fuselaje facetado + alas | P3 |
| MV-05 | Nave pequeña azul/blanca | v3-t089.70 | Fuselaje + alas en flecha | P3 |
| MV-06 | VTOL con turbinas anulares | v3-t065.50 | Cuerpo + 4 anillos emisivos | P3 |
| MV-07 | Carguero pesado | v3-t016.40 | Cuerpo modular + motores emisivos | P3 |
| MV-08 | Mech con lanzamisiles | v3-t099.50 | Patas articuladas + torso + pods | P3 |

---

## 3. Personajes (V1)

### 3.1 Construcción del estilo A (objetivo base)

Observado en `v1-t039.90` y `v1-t041.30` a resolución completa:

- **Proporciones:** cabeza grande (~1/5 de la altura), cuerpo estilizado, manos
  simples en bloque.
- **Cabeza:** volumen facetado tipo "caja con chaflanes" estrechándose hacia la
  barbilla. **Sin nariz ni boca**; ojos como **franja oscura horizontal**
  (cejas + ojos fusionados en una sola banda). Orejas como cuña simple.
- **Pelo:** masa de bloques facetados con mechones grandes (coleta, moño,
  despeinado, flequillo, rapado). Color plano.
- **Ropa:** uniformes con paneles de color planos (negro + rojo, azul, teal,
  morado, abrigo blanco con ribete dorado), cuello alto, insignia en chevron
  en el pecho. Botas en bloque.
- **Material:** color plano por zona, sin texturas; sombreado suave con AO.

### 3.2 Variante estilo B (opcional, "héroe")

`v1-t033.40`: mismo cuerpo, cara con rasgos dibujados (ojos, cejas, labios),
accesorios (gafas, auriculares, aros, muñequeras con LED). Implementable como
**textura de cara generada en canvas** sobre la cabeza del estilo A.

### 3.3 Catálogo de variantes observadas

| ID | Eje | Valores vistos |
|---|---|---|
| CH-01 | Vestuario | Uniforme rojo/negro, azul/negro, teal/negro, morado; abrigo de oficial blanco/dorado; ropa casual (chaqueta, top); deportiva; bata (lavandería) |
| CH-02 | Peinado | Coleta alta, moño, despeinado corto, flequillo largo, rapado, rizado/afro, melena corta |
| CH-03 | Tono de piel | Al menos 5 tonos, de claro a oscuro |
| CH-04 | Accesorios | Gafas, auriculares, aros, muñequeras, insignia chevron, tablet |
| CH-05 | Poses | De pie, brazos cruzados, manos en la cadera, sentado, tecleando, comiendo, sosteniendo cartas, jugando billar, levantando pesas, corriendo, cargando canasto, recostado en cama |

### 3.4 Cómo se construye por código

- Malla base generada con `bpy` desde primitivas biseladas y fusionadas.
- **Esqueleto** (armature) de ~15 huesos para posar y animar; poses por datos (JSON de ángulos).
- Variantes por **parámetros**: alto, ancho de hombros, peinado (lista de mallas), paleta de uniforme.
- Exportación GLB con esqueleto; animaciones simples (idle, sentarse, caminar) generadas por keyframes desde código.

---

## 4. Iluminación y render (por video)

| Aspecto | V1/V2 (estación) | V3 (Marte) |
|---|---|---|
| Luz principal | Muchas fuentes de techo frías + emisivos cian | Sol frío lateral + cielo lavanda |
| Emisivos | Cian en todo, naranja en HUD | Amarillo cálido en cápsulas, cian en tecnología |
| Bloom | Alto en tiras LED y anillos | Medio, en hexágonos y balizas |
| AO | Marcada en uniones pared-suelo | Suave, bajo vehículos y edificios |
| Extras | Reflejos suaves en el suelo | Profundidad de campo en primeros planos, aberración cromática leve en bordes (NO VERIFICADO) |

---

## 5. Conteo

| Bloque | Objetos | P1 |
|---|---|---|
| Estación: arquitectura | 25 | 12 |
| Estación: mobiliario y props | 59 | 14 |
| Marte: entorno | 8 | 6 |
| Marte: edificios | 14 | 5 |
| Marte: infraestructura | 11 | 3 |
| Marte: vehículos | 8 | 0 |
| Personajes: ejes de variación | 5 | estilo A |

Los números de la tabla salen del conteo de filas de este documento.

---

## 6. Ampliación: salas y objetos que no están en los videos

Diseño propio, con la misma estética (paleta, bisel, LED cian, rejilla de 2 m).
No hay fotograma de referencia directo: la referencia de estilo es la sala más
parecida de V1/V2, indicada en cada caso. Las salas pedidas por el usuario
están marcadas con **(pedida)**; el resto son necesarias para que la colonia
tenga sentido funcional.

Pendiente: asignar cada sala a las 5 misiones cuando estén definidas.

### 6.1 Salas nuevas

| ID | Sala | Referencia de estilo | Contenido mínimo | Prior. |
|---|---|---|---|---|
| NW-01 | Sala de computadoras / servidores **(pedida)** | Sala de control `v1-t016.10` | Racks de servidores con LED, piso técnico elevado con rejillas, ductos de refrigeración en techo, fila de estaciones de trabajo, mesa holográfica central | P1 |
| NW-02 | Invernadero interior **(pedida)** | Comedor `v2-t017.10` + domo geodésico `v3-t079.90` | Racks hidropónicos de 3 niveles con luz de cultivo, bandejas de cultivos (lechuga, tomate, papa), tanques de agua, tuberías, techo vidriado o domo | P1 |
| NW-03 | Garaje / estacionamiento de vehículos **(pedida)** | Hangar exterior `v3-t050.10` | Bahías con marcas de piso, estaciones de carga, elevador de vehículos, pared de herramientas, portón presurizado, rovers de `MV-01/02/03` estacionados | P1 |
| NW-04 | Hangar de aterrizaje (interior) **(pedida)** | Plataforma `v3-t089.70` | Grúa pórtico, líneas de combustible, montacargas de carga, cabina de control vidriada, plataforma de aterrizaje `MI-07` conectada | P1 |
| NW-05 | Esclusa (airlock) | Baño `v2-t053.50` (cabina con LED) | Cámara con dos puertas presurizadas, luces de estado, panel de presión, rociadores de descontaminación | P1 |
| NW-06 | Vestidor de trajes EVA | Lavandería `v1-t043.50` | Racks de trajes, cascos en repisa, bancos, casilleros | P2 |
| NW-07 | Enfermería | Departamentos `v2-t057.60` | Camillas, escáner médico, gabinetes, monitores de signos vitales | P2 |
| NW-08 | Soporte vital (oxígeno y agua) | Control `v2-t039.70` + tuberías `v3-t054.60` | Tanques verticales, electrolizadores, recicladores de agua, tuberías con anillos cian, paneles de lectura | P2 |
| NW-09 | Sala de energía | Ídem | Bancos de baterías, núcleo de energía central emisivo, cuadros eléctricos | P2 |
| NW-10 | Laboratorio | Conferencias `v1-t012.40` | Mesadas, cámaras de muestras de suelo, microscopio, pantallas de análisis | P2 |
| NW-11 | Almacén | Lavandería (estanterías) | Estanterías altas, contenedores `MI-09`, montacargas pequeño | P3 |
| NW-12 | Centro de mando de la colonia | Control `v1-t016.10` | Reutiliza `CR-01/02/03` con mapa holográfico de la colonia | P2 |

### 6.2 Objetos nuevos por sala

| ID | Objeto | Sala | Construcción | Prior. |
|---|---|---|---|---|
| NW-01-A | Rack de servidores con LED parpadeante | NW-01 | Caja alta + filas de ranuras emisivas (animación por shader, no por luces) | P1 |
| NW-01-B | Baldosa de piso técnico con rejilla | NW-01 | Losa de 0,6 m con inset perforado | P1 |
| NW-01-C | Ducto de refrigeración | NW-01 | Prisma rectangular con codos | P2 |
| NW-01-D | Mesa holográfica | NW-01, NW-12 | Base octogonal + proyección `M_hologram` | P1 |
| NW-02-A | Rack hidropónico de 3 niveles | NW-02 | Estructura de perfiles + bandejas + barra de luz emisiva | P1 |
| NW-02-B | Cultivos low-poly (lechuga, tomate, papa) | NW-02 | Hojas instanciadas por tipo, 3 tamaños de crecimiento | P1 |
| NW-02-C | Tanque de agua con visor | NW-02, NW-08 | Cilindro + franja de vidrio | P2 |
| NW-03-A | Estación de carga para vehículos | NW-03 | Pilar con cable y pantalla | P1 |
| NW-03-B | Elevador de vehículos | NW-03 | Plataforma + 2 columnas | P2 |
| NW-03-C | Pared de herramientas | NW-03 | Panel perforado + herramientas simples | P3 |
| NW-03-D | Portón presurizado de garaje | NW-03, NW-04 | Hoja seccional + marco + luces de estado | P1 |
| NW-04-A | Grúa pórtico | NW-04 | Vigas + carro + gancho | P2 |
| NW-04-B | Línea de combustible con carrete | NW-04 | Carrete + manguera curva | P3 |
| NW-05-A | Puerta presurizada circular | NW-05 | Marco grueso + hoja con volante | P1 |
| NW-05-B | Panel de presión con indicadores | NW-05 | Caja + pantallas en canvas | P1 |
| NW-06-A | Rack de traje EVA | NW-06 | Soporte + traje (malla rígida del personaje EVA) | P2 |
| NW-07-A | Camilla médica con escáner | NW-07 | Base + colchón + arco escáner emisivo | P2 |
| NW-08-A | Electrolizador | NW-08 | Caja con tuberías y visor | P2 |
| NW-09-A | Núcleo de energía | NW-09 | Cilindro emisivo con anillos animados | P2 |
| NW-10-A | Cámara de muestras | NW-10 | Caja vidriada con guantes | P3 |

### 6.3 Exterior: objetos nuevos

| ID | Objeto | Construcción | Prior. |
|---|---|---|---|
| NX-01 | Estacionamiento exterior con bahías de carga | Losas + marcas emisivas + `NW-03-A` | P2 |
| NX-02 | Luces de borde de pista de aterrizaje | Balizas emisivas en serie | P2 |
| NX-03 | Huellas de rover en el terreno | Decal o ranura en el shader del terreno | P3 |
| NX-04 | Entrada de esclusa en fachada | Módulo de fachada con `NW-05-A` | P1 |

### 6.4 Personajes: variantes nuevas

| ID | Variante | Construcción | Prior. |
|---|---|---|---|
| CH-06 | Astronauta con traje EVA (para tomas exteriores) | Mismo esqueleto del estilo A; traje voluminoso, mochila de soporte vital, casco con visor reflectante (sin cara visible) | P1 |
| CH-07 | Técnico con overol y casco de trabajo | Variante de vestuario CH-01 | P2 |
| CH-08 | Personal médico y de laboratorio (bata) | Variante de vestuario CH-01 | P2 |

### 6.5 Paleta: colores nuevos

| Rol | Color aprox. | Uso |
|---|---|---|
| Luz de cultivo | `#FF5FD2` (emisivo) | Racks hidropónicos |
| Verde de cultivo | `#5DBB4C` / `#3E8E3A` | Plantas comestibles |
| Advertencia | `#FFB020` (emisivo) | Esclusas, marcas de garaje y hangar |
| Estado de puerta | `#3DFF8A` y `#FF4A4A` (emisivos) | Paneles de presión |

### 6.6 Conteo de la ampliación

| Bloque | Elementos | P1 |
|---|---|---|
| Salas nuevas | 12 | 5 |
| Objetos nuevos por sala | 20 | 9 |
| Exterior nuevo | 4 | 1 |
| Variantes de personaje | 3 | 1 |

---

## 7. Ampliación por la campaña (`docs/DISENO-JUEGO.md`)

Salas y assets que exige la campaña de 5 capítulos. Estado: PROPUESTA, sujeta a
las decisiones de `DISENO-JUEGO.md` sección 9.

### 7.1 Correcciones de ciencia sobre el inventario anterior

| ID afectado | Corrección | Fuente |
|---|---|---|
| MT-T02 (nieve de borde duro) | **Solo en el polo norte (capítulo C5).** En Jezero el suelo es óxido y polvo, sin nieve ni hielo | `MARTE.md` del repo; casquete norte de hielo de agua (NASA/Hubble) |
| MT-S01 (cielo lavanda) | El cielo de día es **caramelo**; el azul solo aparece como halo junto al Sol al atardecer. El anillo planetario se elimina (Marte no tiene) | NASA Science, atardeceres en Marte |
| MT-T01 | Dos biomas: `jezero` (óxido, relieve del DEM real de Mars Trek del repo) y `polar` (hielo con manchas de suelo y dunas oscuras) | `data/terreno/jezero/`, `data/terreno/marte-norte/` del repo |

### 7.2 Salas nuevas

| ID | Sala | Capítulos | Contenido mínimo | Prior. |
|---|---|---|---|---|
| NW-13 | Comunicaciones | C2, C5 | Consola de antena, plato orientable visible por ventana, pantalla con el mensaje viajando y el contador de espera | P1 |
| NW-14 | Refugio de radiación de la colonia | C2, C4 | Sala pequeña y gruesa (muros con tanques de agua como blindaje), literas plegables, luces ámbar, puerta pesada | P1 |
| NW-15 | Cabina y puente de la nave | C1, intro | Asientos de piloto, ventanal con Marte o estrellas, consolas | P1 |
| NW-16 | Sala común de la nave | C1, intro | Mesa redonda con proyector holográfico (`NW-01-D`), asientos, Iris acoplada | P1 |
| NW-17 | Refugio de la nave | C1, intro | Cápsula estrecha rodeada de depósitos de agua y víveres | P1 |
| NW-18 | Bahía del satélite | C1, C2 | Satélite en su soporte, compuerta al espacio, brazo robótico | P2 |
| NW-19 | Estación de hielo del polo | C5 | Taladro, depósitos de hielo, tubería hacia la colonia, módulo presurizado pequeño | P2 |

### 7.3 Personajes y vehículos nuevos

| ID | Asset | Construcción | Prior. |
|---|---|---|---|
| CH-09 | **Iris**, rover de 4 ruedas con pantalla de cara | Chasis biselado, 4 ruedas como hijos, mástil con pantalla; cara en textura generada por código con expresiones (feliz, curiosa, preocupada, dañada con glitch, apagada) | P1 |
| CH-10 | Jugador (niña o niño) estilo A, personalizable | Mismo esqueleto del estilo A, proporción infantil (cabeza mayor); casco y traje con colores elegibles | P1 |
| MV-09 | Orion acoplada al Deep Space Transport (exterior) | Reconstrucción del concepto DST: Orion con cuatro alas en X, hábitat fijo y módulo eléctrico con dos alas desplegables; para la intro y C1 | P1 |
| MV-10 | Nave de las familias (final) | Variante de MV-09 con más módulos y luces de aterrizaje | P2 |
| MV-11 | Rover varado para rescatar (C4) | Rover pequeño de 6 ruedas con paneles cubiertos de polvo (diseño propio) | P2 |
| MV-12 | Módulo de descenso de las familias (final) | Cápsula cónica ancha, escudo térmico, cuatro patas y retrocohetes. Inspirada en el concepto de baja sustentación de [NASA NTRS 20200002811, fig. 1](https://ntrs.nasa.gov/citations/20200002811) | P2 |
| NX-05 | Cultivos con estados de crecimiento visibles | Extiende `NW-02-B` a 4 etapas: semilla, brote, planta, cosecha | P1 |

### 7.4 Estados de ambiente (presets de luz y postproceso)

| ID | Preset | Uso |
|---|---|---|
| AMB-01 | Espacio | Intro, C1 exterior |
| AMB-02 | Interior normal | Todas las salas |
| AMB-03 | Interior en alerta (ámbar) | Tormenta solar, refugio |
| AMB-04 | Jezero de día (cielo caramelo) | C2 a C4 |
| AMB-05 | Atardecer marciano (halo azul junto al Sol) | Transiciones de sol |
| AMB-06 | Tormenta de polvo | C4 |
| AMB-07 | Polo norte | C5 |
| AMB-08 | Noche con la Tierra visible | Fin de capítulo, final |

Fondo de la primera toma (pieza independiente del preset):

| ID | Pieza | Uso |
|---|---|---|
| BG-01 | Tierra distante | Disco azul, continentes estilizados y nubes; fondo de la intro con AMB-01 |

### 7.5 Conteo de la ampliación por campaña

| Bloque | Elementos | P1 |
|---|---|---|
| Salas nuevas | 7 | 5 |
| Personajes y vehículos | 6 | 4 |
| Presets de ambiente | 8 | — |
