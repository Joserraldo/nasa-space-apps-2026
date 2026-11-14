# Cómo construir la referencia: capas, piezas y movimiento

**14 nov 2026 · Ampliación solicitada por María Paula · Propuesta para revisión.**

El inicio ya existe en el atlas: niño flotando, nave, fondo espacial y menú a la izquierda. Esta ampliación especifica cómo llevarlo a código, actualiza sus botones y descompone estaciones/personajes. No añade otra intro ni convierte las ocho salas en ocho misiones. La aplicación del repositorio continúa pendiente de aprobación; el [laboratorio HTML](index.html) es una referencia interactiva aislada con valores ilustrativos. **Aclaración posterior de María Paula: mundo abierto y construcción por código con Three.js/WebGL. Esa es la ruta principal.**

## 1. Qué se entrega y qué se necesita producir después

| Entrega | Uso correcto |
| --- | --- |
| [Inicio original](inicio/00-inicio-original.png) / [inicio con botones actualizados](inicio/01-inicio-actualizado.png) | Objetivo visual y comparación. La imagen completa no se usa como interfaz con texto pintado. |
| [Estaciones y piezas compartidas](laminas/01-estaciones-y-piezas.png) | Catálogo de ensamblaje. Los ocho originales completos están en `estaciones/`. |
| [Familia de trajes](laminas/02-personajes-modulares.png) | Una base de diseño, variantes de identidad y accesorios. No es un rig entregado. |
| `individuales/*.png` | Ocho recortes conceptuales con transparencia: marco, consola, caja, panel solar, jardinera, depósito, banco y antena. |
| `inicio/individuales/*.png` | Astronauta, nave, planeta y asteroide separados para composición por capas. |
| [Catálogo de producción](catalogo-assets.json) | IDs de piezas, reutilización y archivos; no confundir un PNG conceptual con su GLB todavía pendiente. |
| [Biblioteca de interacción](index.html#interaction) | Botones, entrada/salida de panel, consulta, confirmación, pérdida/recuperación y pendiente. No conecta con el motor del juego. |
| [Mundo abierto procedural](index.html#world) y [fábricas de piezas](piezas-procedurales.js) | Ocho estaciones sin orden obligatorio y diez tipos de pieza seleccionables; geometría creada por código, sin cargar GLB ni imágenes como mallas. |

Los recortes se derivan con generación de imágenes: pueden variar contorno o detalle frente al plano original y tener halo semitransparente. Son referencias individuales, no extracciones de píxeles ni vistas de una malla única. Para igualar el arte en 3D hay que construir piezas, materiales y cámara, y comparar renders. La lámina modular repite el emblema de herramienta en otros trajes: no trasladar ese detalle al código; conservar símbolos de rol y el distintivo de enfermería de su referencia original. El logo generado en la lámina tampoco sustituye la marca original.

### Ruta principal: el mundo se construye con código

Three.js puede crear toda la geometría y renderizarla con WebGL. `BufferGeometry` permite facetas propias; `Shape` y `ExtrudeGeometry`, marcos y biseles; grupos y pivotes, articulación. GLB/Blender no son requisitos. La referencia demanda trabajar siluetas, proporciones, material y cámara: unas primitivas genéricas no bastan para igualarla.

| Elemento abierto | Receta procedural y reutilización |
| --- | --- |
| Terreno | Triángulos con altura calculada y zonas transitables; la muestra usa suelo plano. Semilla decorativa separada del RNG de misión. No atribuir relieve inventado a Mars Trek. |
| Rocas y montañas | Icosaedros/buffers deformados con normales facetadas; geometría por familia y giro/escala/material por instancia. |
| Caminos | Baldosas/rampas/conexiones sobre anclajes; accesos libres, sin convertir senderos en progresión obligatoria. |
| Paneles | Base, soporte, eje, bastidor y celdas repetidas. Rotar el eje, sin reconstruir geometría por frame. |
| Plantas | Tallo, hoja maestra con volumen facetado, distribución radial y jardinera; frutos como props. Crecimiento solo con estado autorizado del motor. |
| Habitáculos | Suelo, paredes, puerta y techo/cúpula comunes, props exclusivos por configuración. |
| Astronauta | Casco/torso/cara facetados y extremidades con pivotes; familia por edad, variantes de identidad y color. |
| Cables/tuberías | Curvas o buffers segmentados, extremos anclados. Actualizar atributos existentes si se mueve; no crear tubos nuevos cada frame. |

La muestra exporta fábricas de rocas, plantas, jardineras, paneles, puertas, cajas, tanques, consolas, bancos, antenas, astronautas y estaciones. Reutiliza geometrías/materiales y conserva grupos articulados. Es un primer ensamblaje geométrico para revisar arquitectura, **no una reproducción final del arte**; requiere biseles y siluetas más precisos.

El niño recorre libremente ocho estaciones con WASD/flechas o clic en suelo, cambia cámara e inspecciona cerca. No hay índice que habilite salas en orden. Los pasos del README son dependencias pedagógicas/de gestión, no un pasillo de visitas. Las estaciones se muestran en corte abierto; hay colisión simple de paredes, pero el clic recorre una línea recta y no resuelve rutas alrededor de obstáculos. Interiores, puertas animadas, colisión completa y navegación final quedan para producción.

Para abrir desde la raíz: `python -m http.server 8768 --bind 127.0.0.1 --directory docs/referenciapau`, luego [localhost](http://127.0.0.1:8768/). Requiere HTTP para módulos ES. `vendor/` incluye Three.js 0.160.0 y licencia MIT, copiados de la dependencia local, sin CDN o instalación adicional. Un renderer sirve inicio, mundo y visor de pieza; la UI es DOM aparte. El logo original es la única imagen de marca del inicio interactivo; los PNG conceptuales solo aparecen en galería.

## 2. División del inicio en capas

Lienzo de referencia: **1536 × 1024, relación 3:2**, tomado del PNG original. Coordenadas siguientes son cajas de composición aproximadas en porcentaje de ese lienzo, no posiciones de la base ni tamaños físicos. Preservar margen de lectura a la izquierda y personaje a la derecha.

| Orden / capa | Caja objetivo `x,y,w,h` | Implementación y movimiento |
| --- | --- | --- |
| 0. Fondo | `0,0,100,100` | Gradiente índigo y estrellas discretas, sin UI horneada. Quieto por defecto. |
| 1. Decoración lejana | Asteroide `39,7,10,13`; planeta `79,15,16,14` | Imágenes alpha o mallas; deriva de hasta 4 px en 8 s, opcional. No pulsar estrellas continuamente. |
| 2. Nave | `78,63,22,37` | Anclada abajo/derecha; recorte de borde del lienzo intencional. Pivote fijo. |
| 3. Cable | Entre mochila y conector | Curva separada detrás del cuerpo y delante del fondo; extremos unidos a anclajes, no línea moviéndose por su cuenta. |
| 4. Niño | `49,18,31,57` | Cabeza visible, mano levantada, flotación 6 px / 6 s y giro máximo 1°. Cuerpo y cable coordinados. |
| 5. Marca y subtítulo | `5,5,31,31`; subtítulo `6,32,29,5` | Logo original como recurso, sin reescribirlo con una fuente parecida. Logo entregado tiene fondo: para producción pedir fuente alpha/vector fiel; no regenerar lettering. |
| 6. Menú | `5,40,36,36` | Botones DOM/SVG facetados: iniciar, continuar, ajustes. Marfil como diálogo; principal por escala/peso, no gran placa cian luminosa. |
| 7. Preferencias / créditos | Arriba derecha / abajo izquierda | Idioma EN/ES, sonido, fuentes y créditos. Orden de foco lógico independiente de capas decorativas. |
| 8. Ventanas y foco | Sobre controles | Ajustes y fuentes con foco gestionado; elementos decorativos `aria-hidden` y sin capturar puntero. |

En 16:9 preservar toda la altura del diseño y redistribuir espacio lateral; no estirar personaje ni logo. En móvil pasar menú a flujo vertical y reducir/recortar decoración; no escalar textos y controles por debajo del tamaño legible. `object-fit: contain` conserva proporciones; `cover` queda reservado para fondos cuya zona segura se haya definido. UI siempre DOM traducible, aun si el fondo se renderiza con Three.js.

Entrada única del inicio: fondo visible en 180 ms, marca en 240 ms, niño en 320 ms; menú desde 200 ms con 45 ms entre sus tres controles y 220 ms por control. Todas las acciones son utilizables desde que están visibles; no esperar una cinemática para aceptar clic. Reentrar desde ajustes no repite toda la presentación.

## 3. Atomicidad: qué se comparte y qué cambia

| Nivel | Piezas | Reutilización |
| --- | --- | --- |
| Tokens | Color, corte de esquina, espesor, sombra, espaciado, tipografía, duración y easing | Un solo conjunto para inicio, HUD, consulta, comparación y pausa. |
| Átomos UI | Botón facetado, icono, etiqueta, valor, keycap, indicador de foco | Variantes por propiedad; evitar un botón distinto por pantalla. |
| Compuestos UI | Medidor, retrato con nombre, fila costo/efecto, mensaje, entrada, tarjeta de fuente | Separar dato, aspecto y evento; icono no es única etiqueta. |
| Paneles | Diálogo, comparación, ajustes, fuentes, resultado | Componen átomos; apertura/salida y foco con el mismo contrato. |
| Piezas 3D comunes | Suelo, pared, marco, puerta, ventana, lámpara, consola, caja, banco, tanque | Mallas/materiales compartidos y configuración por estación. |
| Módulos semánticos | Invernadero, ingeniería, enfermería, control, esclusa, laboratorio, comedor, refugio | Composición de piezas con función propia; identidad de estación no exige duplicar todos sus modelos. |

No confundir atomicidad con partir cada tornillo en una petición o draw call: construir conjuntos que se usan juntos; separar aquello que cambia, se anima, recibe clic o se reutiliza. La estación procedural es un `Group` ensamblado por configuración. GLB queda como alternativa de intercambio, no requisito.

### Familia de astronautas

Compartir casco, visor, cuello, traje, guantes, botas, mochila y patrón de materiales. Tres adultas pueden compartir grupos/pivotes y geometrías base; si luego se usa skinning, compartir esqueleto y topología **si el modelado lo permite**. El niño usa proporciones propias (cabeza/cuerpo y longitud de extremidades): no basta escalar uniformemente el adulto. Cabeza, piel, cabello, gafas, acentos, emblema y accesorios dan identidad; no sustituir toda la persona por un cambio de color.

| Personaje | Identidad que se conserva | Variante de traje/accesorio |
| --- | --- | --- |
| Niño | Rostro/cabello del inicio, proporción infantil | Marfil, guantes/cuello teal, botas índigo; tether solo en inicio. |
| Ingeniera | Adulta, cabello castaño rojizo, rostro de v5 | Acentos naranja, herramienta/tableta; mantener mano libre y anclajes. |
| Doctora | Adulta morena, gafas octagonales | Teal, distintivo de su rol y equipo de consulta. |
| Meteoróloga | Adulta, cabello plateado | Ciruela, dispositivo de lectura; no reemplazar por silueta de la Ingeniera recoloreada. |
| Iris | Rover solar de cuatro ruedas | Ensamblaje propio, ojos y panel; no usa rig humano ni se convierte en robot volador. |

Jerarquía propuesta del personaje: `Root → Rig → Hips/Spine/Head/Arms/Legs`; traje ligado al rig; cabeza/cabello/casco ligados al hueso de cabeza; herramienta a `Socket_Hand_R`; mochila a `Socket_Back`; tether a `Socket_Tether`. Visor como superficie transparente separada, sin doble capa coincidente. Cada personaje tiene su mixer/estado aunque reutilice clips compatibles.

Gestos requeridos: idle respiración, caminar, mirar/interesar, explicar/señalar, inspeccionar, reparar, confirmar y recuperación. En la ruta procedural se animan rotaciones de grupos con pivote y curvas reutilizables. Si se eligiera skinning como alternativa, exportar clips en pose de enlace consistente y ajustar retargeting niño/adulto. Rostros con mallas de boca/ojos intercambiables o morph targets; retratos desde el mismo modelo/cámara.

### Ensamblaje de las ocho estaciones

| Estación y referencia | Piezas comunes | Identidad específica | Animación funcional |
| --- | --- | --- | --- |
| [Esclusa](estaciones/10-esclusa.png) | Marco, puerta, pared, caja, luz, rejilla | Rack de cascos, indicador de presión, rampa | Puertas deslizan con pivotes laterales; indicador responde a estado definido. |
| [Control](estaciones/11-control-mision.png) | Marco, consola, banco, lámpara, caja | Mesa de terreno y cúpula panorámica | Indicador de enlace y respuesta pendiente; pantallas no inventan telemetría. |
| [Invernadero](estaciones/12-invernadero.png) | Consola, tanque, lámpara, marco | Ventanas trianguladas, jardinera, semilleros | Caudal/estado de equipos; crecimiento solo si existe estado autorizado. |
| [Laboratorio](estaciones/13-laboratorio.png) | Mesa, caja, consola, tanque, banco | Muestras, vitrina, microscopio | Enfoque de muestra y tapa, sin recolectar recursos de gestión por decoración. |
| [Ingeniería](estaciones/14-ingenieria.png) | Consola, mesa, caja, marco | Panel solar, batería, herramientas, dock Iris | Panel gira en eje físico; herramientas en mano; estado instalando/funcionando. |
| [Enfermería](estaciones/15-enfermeria.png) | Tanque, consola, banco, marco | Camilla, botiquín, lavamanos, distintivo | Lectura instrumental y gestos tranquilos; sin simular daño médico no definido. |
| [Comedor/descanso](estaciones/16-descanso-comedor.png) | Mesa, banco, caja, lámpara, rejilla | Literas, dispensador, planta pequeña | Sentarse/levantarse por animación; no recuperar soporte vital sin acción del motor. |
| [Refugio](estaciones/17-refugio.png) | Puerta, banco, tanque, consola, caja | Cubierta de regolito, señalización ámbar | Puerta y estado de protección; entrar físicamente no concede blindaje por sí solo. |

Suelo con módulo base propuesto de 1 m, paredes de ancho múltiplo del módulo, pivote en base y conectores de puerta alineados; son medidas de producción, no mediciones NASA. Ajustar primero un módulo de prueba y la altura del jugador antes de fabricar todas las salas. Mantener los `LugarId` actuales: ocho salas visuales no se mapean automáticamente a ocho ubicaciones nuevas del contrato.

## 4. Tabla de animaciones y condiciones

Todos los tiempos siguientes son especificaciones propuestas para implementar y ajustar con revisión visual. Easing de entrada: `cubic-bezier(.2,.8,.2,1)`; salida: `cubic-bezier(.4,0,1,1)`. Evitar rebote grande y movimiento constante de controles de lectura.

| Disparador | Movimiento y duración | Resultado, interrupción y accesibilidad |
| --- | --- | --- |
| Botón aparece | Opacidad 0→1, Y 8→0 px, 220 ms | No repetir en cada render; cancelar al desmontar. |
| Hover (solo puntero preciso) | Y −2 px, tinte/sombra leve, 120 ms | Salir revierte en 100 ms; no marca selección. |
| Presionar | Y +1 px, escala .985, sombra menor, 70 ms | Soltar fuera cancela; teclado activa una vez con semántica nativa. |
| Foco | Anillo oscuro+cian inmediato | Visible sin movimiento; no sustituirlo por hover ni cortarlo con `clip-path`. |
| Seleccionar opción | Check y borde persistentes, 140 ms | Distinguir selección y confirmación; no gastar por seleccionar. |
| Deshabilitar / procesar | Color y etiqueta, 100 ms | Estado funcional inmediato; tamaño estable, sin pulsos infinitos. |
| Abrir diálogo/comparación | Opacidad + Y 12→0 px, 220 ms | Pausa y foco se aplican al abrir, no cuando termina la animación. |
| Cerrar panel | Opacidad + Y 0→8 px, 140 ms | Bloquear clic al fondo mientras sale, luego desmontar y devolver foco. Escape equivale a cancelar. |
| Nueva línea de diálogo | Fundido de 120 ms | Texto completo disponible; sin obligar a esperar letra por letra. Retrato blink 100 ms cada 4–7 s, fase decorativa por personaje. |
| Gasto confirmado | Valor real cambia inmediatamente; delta negativo sube 10 px y desvanece en 700 ms; relleno interpola 280 ms | Número y `aria-valuenow` siempre reales. No esperar animación para descontar. |
| Daño por evento | Delta con causa, realce local de 180 ms y rastro de valor anterior durante 450 ms | No sacudir toda la pantalla ni destellar rojo repetidamente. Distinguir daño de gasto voluntario. |
| Beneficio recibido | Delta positivo 700 ms, check 160 ms y relleno 280 ms | Disparar al aplicar efecto, no al pulsar confirmar o al acabar construcción visual. |
| Recurso bajo | Icono + texto persistentes al cruzar umbral existente | Una señal breve por cruce; no alarmar cada tick. Recomendación de UI, no cambiar umbral de balance. |
| Pendiente | Reloj estático, delta previsto y ticks restantes | Al tick cambia texto con 120 ms; no girar eternamente ni fingir cuenta en tiempo real. |
| Módulo instalando | Indicador local y piezas visibles según estado, 400 ms | No declarar operativo antes del motor. Si cola desaparece por rechazo/cancelación, reconciliar desde estado. |
| Módulo operativo | Luz de estado/check 240 ms | Evento visual único; recursos no los aplica esta animación. |
| Fuente / tooltip | Fundido 120 ms | Abrir por teclado también; cerrar restaura foco. Fuente pausada no avanza gestión. |
| Cambiar cámara | Interpolación 300 ms sin atravesar paredes | Reducir a corte cuando se prefiera menos movimiento; conservar orientación y simulación. |
| Tormenta / resultado | Alerta legible 240 ms, música opcional ya autorizada | No ejecutar transición hasta que exista evento de motor; sin estrobo o muerte narrativa. |

**“Perder vida”**: hoy `GameState` tiene energía, soporte vital y blindaje. No contiene una nueva barra de salud del niño. Mostrar caída del recurso afectado y su causa; si diseño aprueba salud independiente, requiere contrato y reglas antes de añadir UI. El traje puede reaccionar con gesto de atención, nunca atribuir lesión clínica a un punto de juego.

Si llegan varios cambios: agrupar por tick y origen, mantener saldos finales correctos y un resumen legible. Mismo snapshot/render no reproduce la animación. Un evento nuevo de igual delta sí debe hacerlo. Conservar un identificador visual derivado de secuencia/tick/índice de causa en el adaptador de UI; no añadir ID al contrato sin aprobación. Al cargar guardado, construir baseline sin animar todas las causas históricas.

Con `prefers-reduced-motion` o ajuste local: quitar deriva, giro, desplazamientos y escala; mantener etiquetas, foco y cambios de valor. Fundidos pueden ser instantáneos. Si cambia preferencia con animación activa, cancelarla y fijar estado final. Sonido opcional, corto y limitado por tick; no usarlo como único aviso. Pausar ambiente al ocultarse la pestaña y limpiar timers, listeners y animaciones al desmontar.

## 5. Cómo llevarlo al código actual

El proyecto usa React 18 y Three.js `^0.160.0`, sin Motion instalado. Usar CSS para estados, Web Animations para efectos de una vez y grupos/pivotes para personajes procedurales; `AnimationMixer` solo si se usan clips. No hace falta cambiar framework ni añadir una librería. Los ejemplos de APIs deben comprobarse con la versión instalada antes de integrar.

| Parte actual | Aplicación propuesta |
| --- | --- |
| `ui/src/componentes/Hud.tsx` | Componente `ResourcePlaque` compartido con valores reales y capa de delta/rastro; no sustituir etiquetas por números animados ficticios. |
| `Dialogos.tsx`, `Tripulacion.tsx` | `ExpertPortrait` y `DialogueCard`; selección consulta, propuesta abre comparación. |
| `ColocarModulos.tsx`, `Tormenta.tsx`, `Acciones.tsx` | Reutilizar `CostRow`, `PendingEffect`, `DecisionCard` y `FacetButton`; un solo camino de confirmación y rechazo. |
| `Base3D.tsx` | Coordinar panel, pausa, foco y acciones; no volverlo propietario de costos o balance. |
| `escena/vista.ts` | Derivar presencia/instalación/funcionamiento y pendientes desde estado; conectar animación a transiciones de vista. |
| `escena/modelos.ts` | Conservar interfaces `ModeloAstronauta`, `ModeloExperto`, `ModeloIris`, `ModeloModulo`; construir familia reusable detrás de esas interfaces. |
| `escena/escena3d.ts`, `EscenaBase.tsx` | Un renderer y ciclo de vida; actualizar mixers/vista, liberar recursos con dueño explícito. No crear un canvas por objeto. |
| `escena/polyfork.ts` (archivado) | El antiguo cargador GLB fue retirado fuera del repositorio. No usar `.glb` ni GLTFLoader; la ruta principal es geometría procedural parametrizada según `assets/GUIA-FABLE-V8.md`. |
| `escena/mundo.ts` | Mantener anclajes y zonas de interacción; cámaras y lista accesible consultan mismos lugares. Colisión simplificada separada de la malla artística. |

**Bloqueo concreto de fidelidad:** aplicar un único material genérico a todos los GLB elimina diferencias de visor/tejido/acento. Acordar slots `SuitBase`, `Accent`, `Boots`, `Skin`, `Hair`, `Glass`, `Emissive` y conservar esos materiales. Cambiar acento requiere clonar solamente el material de esa instancia; cambiar el material compartido recolorearía otros personajes.

Instanciar cajas, lámparas y baldosas estáticas idénticas cuando compartan geometría/material; guardar mapa `instanceId → assetId/lugar`. No usar `InstancedMesh` como sustituto general de personajes con esqueleto. Para personajes animados, clonar esqueleto con `SkeletonUtils.clone` y mixer individual; compartir geometría/textura inmutables. Recursos compartidos se liberan al terminar su dueño común, no al quitar una copia. El `liberarEscena` actual asume propiedad de lo que recorre: esa política debe adaptarse antes de introducir caché compartida. [InstancedMesh, documentación](https://threejs.org/docs/pages/InstancedMesh.html).

### Secuencia de estado: animar después de aceptar

```text
Entrada → intención → propuesta → comparación → confirmar
  → motor valida/aplica → snapshot + causa/efecto
    → HUD actualiza valor real
    → adaptador visual emite gasto/daño/beneficio una vez
    → escena y UI animan presentación
```

Mantener `requestAnimationFrame` para la representación y ticks del motor para gestión. CSS `animationend`, clip finalizado o timer visual nunca dan recursos ni adelantan misión. Si el niño cierra/reabre o cambia cámara durante un efecto, el snapshot sigue correcto. Si cancela antes de confirmar, no se emite acción.

Forma propuesta de `FacetButton`: `variant`, `disabled`, `busy`, `selected`, etiqueta i18n y `onClick`; botón nativo con superficie recortada interior y wrapper de foco exterior. Forma propuesta de `ResourcePlaque`: `value`, `pending[]`, `feedback[]`, icono y etiqueta; etiqueta de lector actualizada por grupo de cambios, no por cada fotograma. La geometría decorativa del botón no debe recortar su caja táctil o su anillo de foco.

La [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Element/animate) permite conservar/cancelar la animación activa. Cancelar una anterior antes de iniciar la siguiente sobre la misma propiedad, o usar capas distintas: `position-wrapper` controla posición, `feedback-wrapper` controla pulso. No escribir dos animadores sobre `transform` del mismo nodo. La preferencia de [movimiento reducido](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) se respeta en CSS y en efectos JavaScript.

## 6. Orden de producción para acercarse al arte

1. **Fijar referencia canónica.** Inicio v5 + botones facetados; las identidades v5 prevalecen sobre humanos antiguos de estaciones v4. Comparar original y actualización; aprobar objetivo y aceptar diferencias de generación antes de modelar.
2. **Reproducir encuadre con bloques.** Escoger una sala (invernadero) y mismo punto de cámara; colocar suelo, paredes, vano, mesas, niño e Iris sin detalle. No empezar por fabricar las ocho salas.
3. **Congelar medidas y siluetas.** Ancho de puerta, altura de personaje, bordes y proporciones. Geometría de facetas grandes antes de texturas o luces de adorno.
4. **Construir una pieza maestra por familia.** Marco/puerta/suelo/consola/caja/jardinera y traje adulto/niño. Aprobar contacto de pies, grosor de piezas y lectura en escala de juego; después instanciar.
5. **Materiales y luz.** Marfil cálido, sombras lilas, índigo/cian contenido; luz amplia arriba izquierda y relleno suave. Mantener normales facetadas donde corresponde. El código actual usa ACES, exposición 1.06 y cámara 42°: punto de partida existente, no prueba de coincidencia. Calibrar cámara y exposición juntas; un hex no garantiza el mismo color renderizado.
6. **UI real y composición.** Construir tokens/botones/medidores antes de replicarlos por pantallas. Texto EN/ES sobre arte separado. Alinear borde, proporción, distancia y sombra con referencia al mismo tamaño de captura.
7. **Rig, gestos y módulos.** Clips, retratos, sockets y estados; comprobar que el traje no se deforma al caminar y que puerta/panel usan pivotes correctos. Diferenciar instalación visual y operación.
8. **Conectar interacción y datos.** Consulta, comparación, confirmación, rechazo, costo, pendiente y resultado. Solo después añadir animaciones según tabla, con prioridades de alerta y menor movimiento.
9. **Expandir estaciones desde configuración.** Reusar fábricas procedurales aprobadas y añadir props exclusivos. No fabricar nuevas reglas por decoración. Exportación GLB queda opcional para intercambio, no para construir el mundo principal.
10. **Revisión de fidelidad y funcionamiento.** Captura misma cámara/viewport con overlays de referencia, luego teclado, móvil y menor movimiento. Registrar diferencias de silueta, layout, materiales y conductas por separado. Un recorte transparente correcto no certifica modelo 3D terminado.

Objetivo de fidelidad propuesto: mismas identidades, tres placas separadas, misma composición y jerarquía; contornos principales/posiciones dentro de 2 % del lienzo de referencia al comparar mismo encuadre, salvo adaptación móvil aprobada. Es tolerancia de trabajo a revisar, no medición ya conseguida. Texto legible y control funcional tienen prioridad ante glifos imperfectos de la imagen generada.

## 7. Contrato de entrega de assets 3D

Una unidad de escena equivale a un metro de producción; Y arriba y frente convenido; escala aplicada antes de exportar. Nombres estables `Station_Greenhouse`, `Door_Frame_A`, `Door_Leaf_L/R`, `Socket_Entry`, `Socket_Console`, `Collider_*`. Pivote base-centro para props, bisagra/eje real para objetos móviles. Incluí UV y slots de material; no hornear letras de UI en texturas.

Cada asset procedural necesita: fábrica editable, configuración/semilla, pivotes, materiales, dimensiones de producción y miniatura; estados/gestos cuando corresponda. El código es su fuente; GLB es opcional. Para modelos importados opcionales, exigir fuente/procedencia y revisar compresión/cargador. PNG generado aquí sigue siendo referencia, no modelo ni rig.

Presupuesto inicial sugerido para medir después: un conjunto pequeño de materiales comunes, variantes de acento controladas, objetos repetidos instanciados, texturas modestas y colisiones simples. Establecer presupuesto numérico de triángulos/memoria con el primer render en el dispositivo objetivo; no inventar rendimiento. Mover animación transform/opacidad, no relayout por fotograma; no reconstruir geometrías durante render React.

## 8. Estado y límites

El laboratorio ilustra timings y estados con datos de demostración; iniciar abre el mapa abierto de referencia, no una partida conectada al motor. Continuar está deshabilitado porque no hay guardado de motor. Inicio tiene composición reconstruida con geometría procedural: no se presenta como coincidencia de píxeles con el PNG. Mundo y visor tampoco representan implementación/validación del juego. Las referencias de estaciones muestran más props que los ocho átomos raster entregados: los demás se construyen por composición/configuración; no se declaran archivos individuales inexistentes.

Sigue pendiente aprobación humana de la referencia ampliada y posterior integración por etapas. El objetivo de la PR continúa limitado a `docs/referenciapau/`. Esta ampliación no aprueba cambios de contratos, balance o campaña.
