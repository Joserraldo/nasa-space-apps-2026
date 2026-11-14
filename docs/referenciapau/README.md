# Solar Shield — referencias de Pau, dirección v8 y guía de construcción

**14 de noviembre de 2026 · Responsable: María Paula (`Paulasaah`) · Fuente única vigente: Atlas v8.**

> **Aviso para agentes y Fable 5.2:** las versiones previas (`v2`–`v5.pdf`, `v7.pdf`), las entradas sin filtrar (`ampliacion-v8/entradas/`), los `.glb` sin uso y el prototipo oscuro "Plan B" fueron archivados fuera del repositorio. Para mantener el repositorio liviano, `.gitignore` excluye las láminas PNG sueltas y el laboratorio HTML local: en GitHub se publica únicamente la referencia principal ([Solar-Shield-Atlas-integral-v8.pdf](Solar-Shield-Atlas-integral-v8.pdf), [Solar-Shield-Plan-Jezero.pdf](Solar-Shield-Plan-Jezero.pdf), guías `.md`, `catalogo-assets.json` y `piezas-procedurales.js`), que contiene todas las láminas curadas. Para construir en Three.js 0.160.0 (`WebGLRenderer`), seguir estrictamente la [Guía maestra de construcción 3D procedural](../../assets/GUIA-FABLE-V8.md) (disponible en la rama de implementación `feat/ui-escena-3d`) junto con los documentos de esta carpeta.

## Orden de lectura recomendado

1. **Encargo técnico modular y buenas prácticas 3D/UI:** [GUIA-FABLE-V8.md](../../assets/GUIA-FABLE-V8.md).
2. **Biblia visual única vigente:** [Atlas integral v8 en PDF](Solar-Shield-Atlas-integral-v8.pdf). Reúne el contenido curado y las doce láminas de interiores completos, kits modulares y organización exterior ([ampliación explicada](AMPLIACION-ESPACIOS.md), [informe del PDF](revision-pdf-v8.json)).
3. **Reglas de aplicación, piezas y animación:** [APLICACION.md](APLICACION.md) (aclarando que `piezas-procedurales.js` y el [laboratorio técnico](index.html) son únicamente ensamblajes iniciales de medidas/arquitectura y no reproducen las siluetas ni biseles finales del atlas).
4. **Priorización jugable y conexión con Jezero:** [PLAN-IMPLEMENTACION-JEZERO.md](PLAN-IMPLEMENTACION-JEZERO.md) ([versión PDF](Solar-Shield-Plan-Jezero.pdf)).
5. **Láminas gráficas organizadas en esta carpeta:**
   - [Seleccionadas UI y logo](seleccion/) (`00-logo-actual.png`, `02-dialogo-decision.png`, `03-botones-crew-map.png`, `04-variantes-facetadas.png`, `05-consulta-comparacion-fuente.png`).
   - [Estaciones principales](estaciones/) (`10-esclusa.png` a `17-refugio.png`).
   - [Ampliación exterior, logística y kits v8](ampliacion-v8/laminas/) (`01-almacen-logistica.png` a `12-exterior-organizacion.png`).
   - [Recortes conceptuales individuales](individuales/), [inicio en capas](inicio/) y [láminas de despiece modular](laminas/).

## 1. Catálogo de referencias y autoridad

| Archivo | Función y estado |
| --- | --- |
| [Logo actual](seleccion/00-logo-actual.png) | Marca oficial vigente; prevalece sobre logos generados anteriores. |
| [Botones Crew/Map](seleccion/03-botones-crew-map.png) | Referencia de geometría facetada, marfil y profundidad de controles. |
| [Diálogo y decisión](seleccion/02-dialogo-decision.png) | Aplicación de la familia v8 al encuentro con la Ingeniera. |
| [Variantes facetadas](seleccion/04-variantes-facetadas.png) | Lámina completa de variantes de botones y estados. |
| [Consulta, comparación y fuente](seleccion/05-consulta-comparacion-fuente.png) | Organización de los pasos consulta, comparación (`Costs now / Later`), fuente y confirmación. |
| [Inicio actualizado](inicio/01-inicio-actualizado.png) y [original](inicio/00-inicio-original.png) | Composición orbital con botones facetados y niño astronauta humano. |
| [Estaciones modulares](laminas/01-estaciones-y-piezas.png) y [trajes reutilizables](laminas/02-personajes-modulares.png) | Despiece conceptual por familias; las identidades definitivas de las tres expertas se detallan además en `assets/direccion-arte-v5/30-35` y `APLICACION.md`. |
| [Catálogo de piezas](catalogo-assets.json), [fábricas base](piezas-procedurales.js) y [prompts v8](prompts-produccion.json) | Inventario modular base y prompts de referencia. |

Orden de autoridad para construir la UI y la escena 3D: decisiones explícitas de María Paula, [GUIA-FABLE-V8.md](../../assets/GUIA-FABLE-V8.md), especificaciones escritas (`APLICACION.md`, `AMPLIACION-ESPACIOS.md`, `PLAN-IMPLEMENTACION-JEZERO.md`), láminas seleccionadas y [Atlas integral v8](Solar-Shield-Atlas-integral-v8.pdf). Ante contradicción visual manda el texto técnico; ante reglas o balance manda `design/`, `engine/` y `missions/`. Los PNG son referencias de diseño, no mallas exportadas ni capturas finales.

## 2. Sistema visual propuesto

Familia única: tarjetas de marfil con esquinas recortadas, bisel bajo, sombra suave ciruela y texto índigo. Tres medidores separados. Diálogo ancho lila claro con retrato facetado. Costos y efectos posteriores en bloques diferentes. La forma ayuda a reconocer controles sin tapar el mundo.

| Elemento | Variante y conducta |
| --- | --- |
| Acción principal | Marfil, mayor peso de texto y tamaño, relieve moderado, verbo específico: `Place panel`. Una principal por decisión. |
| Acción secundaria | Misma familia, menor peso: `Back`, `Ask another expert`, `Crew`, `Map`. Cancelar tiene superficie visible. |
| Normal / hover / pressed | Normal marfil; hover lila tenue; pressed reduce sombra y relieve. No desplaza otros elementos. |
| Foco de teclado | Contorno exterior cian y trazo interior oscuro; no se comunica únicamente por color. No recortar el foco con la máscara de esquinas. |
| No disponible | Atenuado pero legible, sin activación. Explicar motivo cerca: energía insuficiente, ya instalado o requisito pendiente. |
| Selección persistente | Marca de verificación y texto de seleccionado; diferente de hover, foco o botón presionado. |
| Procesando | Misma anchura, texto de estado, bloqueo de repetición; terminar en resultado o error recuperable. No simular porcentajes. |
| Confirmación de acción | Verbo concreto, recurso que se gasta ahora y beneficio esperado. Pulsar retrato o `Continue` no cobra recursos. |
| Mensajes | Éxito con check, advertencia con triángulo, error con cruz, pendiente con reloj; texto además del color. No son botones. |
| Fuente | Tarjeta pequeña, tipo de evidencia, fecha e identificador reales cuando existan, enlace descriptivo. No inventar valores para completar diseño. |
| Entrada / voz | Campo con etiqueta persistente; enviar no equivale a ejecutar consejo. Voz opcional con estados apagada/escuchando/procesando/error. Texto y botones disponibles. |
| Superficie oscura | Alternativa ciruela para énfasis; no reemplaza la versión clara por defecto. Misma jerarquía y contraste por comprobar. |

Paleta de referencia: marfil `#F3EEE5`, lila `#EEE5F1`, ciruela `#53306D`, cian `#73D4E1`. Son objetivos de diseño, no certificación de contraste. Los colores exactos de una imagen generada pueden variar. El foco dibujado es demostrativo; su grosor final se ajusta con UI real.

Propuesta de dimensiones: controles táctiles de al menos 44 × 44 CSS px; texto principal de lectura alrededor de 18–20 px, escalable; etiquetas con espacio para EN/ES. En pantalla estrecha apilar diálogo y comparación, mantener costos visibles y evitar reducir toda la lámina como imagen. Usar teclado, foco visible, lector de pantalla, movimiento reducido y cámara asistida. Estos son criterios de aceptación propuestos; no se midieron en esta tarea.

### Textos y números canónicos

| EN (idioma base) | ES | Significado |
| --- | --- | --- |
| Continue | Continuar | Avanza explicación o abre comparación; no ejecuta el plan. |
| Ask another expert | Consultar a otra experta | Conserva propuesta y permite contrastar prioridades. |
| Costs now / Later | Costo ahora / Después | Diferencia débito inmediato y efecto pendiente. |
| Place panel / Back | Instalar panel / Volver | Confirma una vez / cancela sin gasto. |
| Benefit pending | Beneficio pendiente | No sumar antes del tick del motor. |
| Reply pending | Respuesta pendiente | Mensaje ya enviado; mostrar ticks restantes reales. |
| Archived data / View source | Datos históricos / Ver fuente | Procedencia disponible sin aparentar datos en vivo. |

Los ejemplos `70/80/60` y `28/20/12` representan estados distintos. No describen una transición. El panel cuesta `−6 energía` y `−3 soporte vital`; aporta `+14 energía` después, según las tablas locales actuales de diseño. Son puntos educativos, no vatios ni dosis NASA. Sin consumo intermedio ni límites, `28/20/12` pasaría a `22/17/12` al confirmar y a `36/17/12` al llegar el beneficio; la partida real puede variar por consumo y eventos. El momento exacto lo informa el motor: el rótulo genérico “Later” debe sustituirse por el plazo real cuando esté disponible.

## 3. Recorrido completo antes de ajustar el juego

El mundo es abierto. Esta tabla expresa dependencias de gestión y aprendizaje; no obliga a visitar habitaciones en ese orden. Las estaciones, plantas, piedras y paneles coexisten en un mapa transitable. Consultar y explorar siguen disponibles sin una cadena de puertas bloqueadas; las condiciones de misión las define el motor.

| Paso | Lo que ve y hace el niño | Transición y criterio de aceptación |
| --- | --- | --- |
| 0. Inicio | Logo actual, iniciar, ajustes EN/ES, sonido, fuentes y créditos. Continuar solo con guardado válido. | Elegir iniciar abre presentación; continuar restaura estado completo, no solo medidores. Persistencia aún por confirmar. |
| 1. Intro y carga | Presentación breve omitible: base de entrenamiento, tripulación, observar y decidir. | Omitir lleva al mismo briefing. Carga solo durante preparación real; error ofrece reintentar o volver conservando guardado. |
| 2. Briefing | Objetivo claro en Jezero, controles básicos, tres recursos; Iris acompaña. | Niño identifica qué debe lograr y dónde consultar sin leer un manual. Base humana es recreación educativa. |
| 3. Órbita y mapa | Suelta satélite, traza ruta y ve costos; compara sitios y sus criterios. | Cada confirmación corresponde a una acción admitida. No saltar decisiones para mostrar el interior antes de establecer base. |
| 4. Llegada y módulos | Coloca los dos módulos definidos por misión; ve costo y beneficio antes de confirmar. | Comparar al menos dos opciones plausibles. Invernadero explica comida dentro de soporte vital y su costo energético. |
| 5. Explorar e inspeccionar | Camina o usa lista de lugares, cambia cámara e inspecciona controlador/invernadero/refugio. | Mismas reglas en ambas cámaras y alternativa sin 3D. Inspeccionar no construye ni concede protección por proximidad. |
| 6. Consultar | Elige experta o pregunta con texto; explicación breve, prioridad y fuente. | Retrato solo selecciona/consulta. Continúa hacia comparación o pregunta a otra experta. |
| 7. Comparar y verificar | Ve ahora/después, alternativas y fuente; detecta discrepancia guionada de Iris. | Puede volver sin gasto. El medidor y el motor son autoridad; la IA no inventa cifras. |
| 8. Confirmar y observar | Confirma acción concreta; aparece costo aplicado y efecto pendiente. | Validar estado al ejecutar, aplicar una vez y registrar causa. Al llegar el efecto, mostrar qué decisión lo produjo. |
| 9. Tormenta | Evento histórico con procedencia; expertas expresan prioridades distintas; pausa para leer. | Elegir protección implica costo. No hay opción universalmente segura y gratuita. Resolver sin urgencia de lectura artificial. |
| 10. Comunicaciones | Envía telemetría, paga costo y ve respuesta pendiente. | Espera con decisiones locales disponibles; contador en ticks, no espera real de minutos. No resolver respuesta al instante. |
| 11. Cierre | Objetivo conseguido o problema recuperable, cadena decisión → efecto y tarjeta científica. | Separar decisión y azar, explicar qué ganó/perdió. Niño responde qué haría distinto; otra partida permite comparar. |

Las ocho salas del atlas son oportunidades de interacción, no ocho misiones obligatorias. Enfermería/refugio explican protección; ingeniería energía; invernadero alimentación; control comunicaciones. Laboratorio, comedor y esclusa completan contexto. Mantener acceso directo a acciones esenciales para que explorar no esconda las decisiones de gestión.

### Flujo detallado de diálogo y decisión

`Explorar → inspeccionar → consultar → comparar → verificar fuente (opcional) → confirmar → costo aplicado → beneficio pendiente → efecto observado → cadena de causas`.

1. Abrir consulta conserva la pausa previa y suspende la gestión durante lectura. El foco entra al título/control inicial; cerrar devuelve foco al origen y restaura la pausa anterior, sin reanudar otra alerta pendiente.
2. Elegir Ingeniera muestra su especialidad y explicación. `Continue` abre comparación. `Ask another expert` conserva la acción candidata y cambia la consulta. Ninguno aplica una `Action`.
3. Comparación muestra acción, dos costos, beneficio, plazo, alternativa y motivo si no puede ejecutarse. Fuente vuelve a la misma comparación sin alterar el estado.
4. `Place panel` valida contra el estado vigente. Si falla, explica y permite cambiar opción. Si acepta, registra una sola acción; entradas simultáneas no repiten el cobro.
5. Mostrar “Panel instalado; beneficio pendiente” únicamente si la acción fue aceptada. No confundir animación terminada con beneficio otorgado. Mostrar gasto y saldo real, no aritmética ilustrativa congelada.
6. Reanudar solo por transición definida. Al vencer el retraso, actualizar desde motor y relacionar efecto con decisión. `Back` antes de confirmar no cambia recursos; después de confirmar no funciona como deshacer gratuito.

Casos adicionales: fuente no disponible muestra procedencia local y aviso; voz denegada vuelve a texto; clasificador incierto repregunta; caída del modelo mantiene atajos y botones; pérdida de gráficos permite continuar la misma simulación en alternativa accesible. Guardado, restauración exacta y reintento desde punto de control son propuestas hasta comprobar su soporte.

## 4. Revisión del reto: qué podemos afirmar

El [resumen oficial indexado del reto](https://www.spaceappschallenge.org/2026/challenges/junior-astronaut-mission-trainer/) pide una experiencia interactiva donde estudiantes administren una base lunar o marciana, equilibren necesidades como soporte vital, protección, energía y alimentos, y experimenten cómo las decisiones afectan la misión. La idea de Solar Shield está alineada con ese objetivo; un moodboard no demuestra su cumplimiento.

**Límite de consulta, 14 nov:** la apertura directa del sitio devolvió 502; las variantes de acceso tampoco permitieron leer Details/Resources completos. La búsqueda recuperó el resumen oficial. Las precisiones sobre edades, comunicación, recursos de datos y consideraciones ampliadas provienen del registro previo del equipo en [reglas](../reglas.md#sobre-el-reto); requieren reconfirmación del texto completo. No se usan reglas de otros retos o proyectos como evidencia oficial.

La revisión de implementación es lectura estática del árbol local `feat/ui-escena-3d`, que ya contiene modificaciones y archivos sin seguimiento. No representa lo que está publicado en `develop`; no se ejecutó el juego, pruebas, build ni APIs NASA. “Existe” significa encontrado en archivo, no conducta demostrada en navegador. Los enlaces siguientes permiten revisar esa evidencia local.

| Aspecto | Evidencia local | Evaluación y pendiente |
| --- | --- | --- |
| Base gestionable y recursos competidores | [Tablas](../../design/src/recursos.ts), [misión Jezero](../../missions/src/jezero.ts), [Base3D](../../ui/src/pantallas/Base3D.tsx). | Alineación de diseño y rutas de código. Falta observar misión completa con decisiones comprensibles. |
| Alimentación | `MODULOS.invernadero` aporta soporte vital y consume energía; misión incluye dilema de invernadero. | Cobertura parcial. El comentario de las tablas declara aplicación única, no producción continua. Hacer visible comida y costo; no prometer cosecha dinámica inexistente. |
| Protección y energía | Acciones de refugio/escudo con costos en tablas; [pantalla de tormenta](../../ui/src/pantallas/Tormenta.tsx). | Existen alternativas. Esa pantalla marca efectos extra pendientes; no describirlos como resueltos. Diseño/motor deben cerrar semántica. |
| Comparación antes de ejecutar | [Diálogos](../../ui/src/componentes/Dialogos.tsx) y [acciones](../../ui/src/componentes/Acciones.tsx) llaman `onAccion` desde botones; construcción y tormenta tienen otras rutas. | Brecha concreta de coherencia: aplicar el mismo paso de costo/confirmación a toda acción relevante. No alcanza cambiar el aspecto del botón. |
| Costo y efecto diferido | [Colocar módulos](../../ui/src/pantallas/ColocarModulos.tsx), tablas y [reductor](../../ui/src/juego/reductor.ts). | Hay separación en código. Falta mostrar plazo real y comprobar aceptación antes de marcar módulo colocado: el reductor local actualiza `colocados` tras llamar al motor sin comprobación explícita del resultado. |
| Retraso de comunicaciones | Tabla `RETRASO_COMUNICACIONES`, `telemetriaPendiente` en panel de acciones. | Existe representación por ticks. Demostrar costo, espera y decisión durante espera; reconfirmar alcance oficial ampliado. |
| Clima espacial y datos reales | [Datos usados](../science/datos-usados.md), [fuentes](../science/fuentes.md), tarjetas en tormenta y cierre. | Inventario documental sólido; no se revalidaron datasets. Revisión del responsable de datos antes de afirmar medición/modelo/causalidad. |
| Consecuencias y aprendizaje | [Final](../../ui/src/pantallas/Final.tsx) usa `resumenPartida` y causas con origen. | Existe pantalla. Falta demostrar que el niño relaciona su elección con el efecto; agregar pregunta breve de reflexión como propuesta, sin afirmar aprendizaje medido. |
| Rejugabilidad | Semilla y reinicio; `inicial()` usa `partidaDorada()`. | Reiniciar demo fija no demuestra variabilidad. Separar repetir misma misión de nueva semilla; probar cuando se implemente/apruebe. |
| Accesibilidad y EN/ES | i18n y alternativa sin gráficos; criterios visuales propuestos arriba. | No se auditó contraste, teclado, lector, móvil ni comprensión infantil. Voz es mejora opcional. |
| Inicio/continuar/intro/carga | Referencias curadas en Atlas v8 y `APLICACION.md`. | Intención visual; no asumir guardado válido, restauración o todas las pantallas implementadas. |
| Entrega pública | [Orquestación](../ORQUESTACION.md) conserva estado fechado; [reglas](../reglas.md) lista dudas. | Verificar demo pública, guía vigente, licencia, créditos, IA y formulario con infra/orquestación. El registro antiguo no demuestra estado actual externo. |

### Precisión científica que debe conservar la UI

- Distinguir evento observado, predicción ENLIL, medición instrumental y regla de juego. Ninguna cifra del balance se etiqueta “según NASA”.
- La documentación sitúa RAD/Curiosity en Gale; la base se ambienta en Jezero. Explicitar que se usa un evento medido en Marte para un entrenamiento en otra ubicación, sin afirmar medición local en Jezero.
- Kp corresponde al entorno terrestre; no usarlo como dosis medida en Marte. No mezclar dosis absorbida y equivalente sin modelo y fuente del responsable de datos.
- Un invernadero ilustrado no prueba producción científica realista. Explicar la simplificación de alimentos dentro de soporte vital y el costo del sistema.
- La protección otorgada por el juego es una regla educativa. Evitar confundir una barra de blindaje o una caminata hasta un edificio con una dosis humana validada.

## 5. Qué falta y en qué orden

| Prioridad | Trabajo concreto | Responsables | Evidencia de cierre |
| --- | --- | --- | --- |
| P0 | Confirmar Details/Resources y guía de entrega vigentes. | Datos + orquestación/infra | Registro con fecha y enlaces accesibles; clasificar requisito frente a sugerencia. |
| P0 | Unificar consulta/comparación/confirmación y aceptación de acciones. | UI + motor/agentes | Una decisión completa con cancelación, rechazo y cobro único visible. |
| P0 | Cerrar efecto de invernadero y extras del dilema; comunicar comida. | Diseño + motor + datos | Tabla acordada, efecto real y explicación coherente; no nuevas fórmulas en UI. |
| P0 | Mostrar retrasos, costo, efecto pendiente y cadena de causas. | UI + motor | Misma acción identificable antes/después y comunicación pendiente real. |
| P0 | Validar contexto científico y fuentes de la demo. | Datos + UI | Identificador, fecha, instrumento/lugar y distinción observado/modelado/juego. |
| P0 | Observar recorrido completo con alguien ajeno al equipo. | UI + infra + diseño | Persona explica qué sacrificó y por qué; problemas de comprensión registrados sin datos personales de menores. |
| P1 | Comprobar teclado, contraste, EN/ES, móvil y respaldo gráfico. | UI + infra | Recorrido equivalente con foco/restauración y texto legible. |
| P1 | Diferenciar demo fija, nueva semilla y continuación guardada. | Motor + UI | Repetición reproducible y variación demostrada; restauración íntegra si se ofrece. |
| P1 | Preparar demo pública, créditos, declaración de IA y entrega. | Infra + orquestación | Enlace y requisitos de guía vigentes revisados por responsables. |
| P2 | Ampliar animaciones, salas, campaña, voz y variantes oscuras. | UI + diseño/agentes | Solo después de cerrar ruta central; alcance nuevo requiere decisión del equipo. |

P0/P1/P2 expresan recomendación de esta revisión, no cambio del tablero o de los hitos aprobados. El mundo y los personajes aportan contexto; el criterio central de aceptación sigue siendo que el niño decide con recursos limitados y entiende una consecuencia. No hay evidencia suficiente para declarar cumplimiento integral ni eficacia educativa medida.

## 6. Aprobación y publicación posterior

Para revisar ahora: geometría y estados de la lámina 04; separación consulta/confirmación; representación de alimentos y plazos; recorrido central y prioridades. Marcar selección humana sin convertir pendientes técnicos en promesas terminadas.

Tras aprobación explícita de María Paula: publicar en rama aislada desde `origin/develop` (`feat/ui-referencias-v8`), incorporando únicamente la referencia principal de esta carpeta (~`18.0 MB`: `Solar-Shield-Atlas-integral-v8.pdf`, `Solar-Shield-Plan-Jezero.pdf`, `README.md`, `APLICACION.md`, `AMPLIACION-ESPACIOS.md`, `PLAN-IMPLEMENTACION-JEZERO.md`, `catalogo-assets.json`, `piezas-procedurales.js` y `.gitignore`). Las láminas PNG sueltas (`~64 MB`), los renders `revision-pdf-*` y el laboratorio HTML local quedan excluidos vía `.gitignore` porque toda la obra visual curada ya forma parte del PDF v8. No mezclar cambios de aplicación ni dependencias en esa PR.

Título sugerido: `docs: organizar referencias visuales de Pau y revisión del reto`. Descripción: “Reúne referencias seleccionadas, variantes facetadas, flujo de interacción y brechas del reto. Alcance exclusivo: docs/referenciapau/. Revisión documental y visual; no cambia comportamiento del juego”. Fusión a cargo del humano responsable según reglas del repo.

## 7. Procedencia y estado de esta tarea

Herramienta integrada `image_gen.imagegen`; primera lámina con los tres adjuntos de María Paula y ampliación posterior de quince imágenes (inicio, dos láminas de despiece y doce recortes alpha). Prompts exactos adjuntos, sin API alternativa. Atlas, logo, inicio y ocho estaciones copiados de referencias locales; originales preservados. El manifiesto conserva origen relativo, tamaño y SHA-256. La muestra procedural es código fuente propio de referencia y utiliza copia de Three.js 0.160.0 con licencia MIT.

La primera revisión comprobó 23 enlaces y siete medios. La ampliación incorpora inventario, metadatos de transparencia, sintaxis JS y comprobación de geometrías; el resultado actualizado queda en `revision.json`. El navegador integrado no pudo acceder al servidor localhost, por lo que la inspección visual/funcional de la muestra interactiva sigue pendiente. Estas comprobaciones no validan el juego ni implican aprobación humana.

Uso de IA para trasladar al registro del equipo: organización de referencias, edición conceptual de estados/controles y análisis documental del reto y árbol local; selección humana y ejecución funcional pendientes. No se edita el registro de otro rol en esta tarea. Tokens: consumo moderado; estado del rol previo conservado por alcance exclusivo en docs.
