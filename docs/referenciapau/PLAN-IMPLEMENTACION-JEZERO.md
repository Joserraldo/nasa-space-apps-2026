# Jezero: assets principales y plan de implementación

> Para ejecutar: una entrega pequeña por vez, sobre la aplicación existente y con revisión visual antes de continuar. Mantener un único escritor por archivo; no lanzar subagentes ni modificar carpetas de otros roles desde este plan.

**Objetivo:** tener un escenario principal de Jezero reconocible, transitable y conectado a sus ocho pasos, antes de ampliar el resto de destinos o fabricar todos los interiores del atlas.

**Arquitectura:** React conserva interfaz y coordinación; el motor conserva estado, costos, ticks y resultado; Three.js representa el mundo mediante fábricas procedurales compartidas. Lugares, proximidad y lista accesible usan `LUGARES`; las vistas se derivan de `GameState` y de los módulos realmente colocados.

**Tecnologías:** React 18, TypeScript, Three.js 0.160.x, CSS/Web Animations y npm workspaces existentes. Sin añadir framework, cargador externo o simulación paralela.

**Especificación:** [APLICACION.md](APLICACION.md), [ampliación de espacios](AMPLIACION-ESPACIOS.md), [atlas v8](Solar-Shield-Atlas-integral-v8.pdf), `MISION_JEZERO` y handoff de misiones aportado por María Paula en este chat.

**Fecha y alcance de evidencia:** 14 nov 2026, rama local `feat/ui-escena-3d`. Lectura estática; no se ejecutaron aplicación, build o pruebas en esta tarea. Estado de PR/issue remoto y contenido actual de `develop` no comprobados. El código local puede contener trabajo aún no publicado: no afirmar que un paso funciona en navegador por estar escrito.

## 1. Qué cambia al considerar las misiones

El atlas es una biblioteca de dirección artística, no una lista de edificios que haya que implementar de una vez. La primera entrega es una base compacta de Jezero: un centro de planificación, mantenimiento, consulta, cinco anclajes posibles de módulos y acceso a comunicaciones/protección. El niño puede recorrerla libremente; las fases ordenan decisiones de misión, no bloquean habitaciones en una secuencia.

Los otros cuatro destinos no se presentan como misiones completas: el `index.ts` local de `missions` exporta Jezero y sus textos. Se pueden preparar familias de geometría reutilizables para esos destinos sin implementar reglas o menús de misión ficticios.

### Estado local frente al handoff

| Paso | Ya representado en el árbol local | Pendiente para aceptarlo como terminado |
| --- | --- | --- |
| 1. Satélite | `Satelite.tsx` muestra órbita y medidores; el motor tiene estado orbital. | La vista 2D ofrece continuar, no una liberación interactiva. El flujo 3D agrupa planificación en la mesa; precisar la transición canónica. |
| 2. Ruta | Existe planificación y selección de sitio en mesa. | No encontré un trazado/selección de ruta con costo y aceptación propios conectado a este flujo. Acordar alcance con Camilo/Jaime; no confundir una línea decorativa con acción. |
| 3. Aterrizaje | `ElegirSitio.tsx` muestra los sitios del dataset y sus criterios. La misión declara cuatro costos de aterrizaje. | El caso `sitio` del reductor solo guarda la selección y avanza de fase; no aplica esos deltas. Mostrar costo y conectar su aplicación aceptada. |
| 4. Dos módulos | Lista de cinco, límite de dos y exclusión de duplicados en `puedeColocar`; comparación y construcción presentes. | Verificar aceptación antes de marcar colocado; estados visuales y permisos coherentes en ambas vistas. El motor no rechaza por recursos insuficientes en la función leída. |
| 5. Tormenta | Aviso y tarjeta de fuente; transición a alerta al tick de la misión. | El daño llama a `senalDeDano` sin ventana temporal; esa función no recibe tick. La regla de daño solo en ticks 3, 4 y 5 del handoff no está conectada en el código leído. |
| 6. Dilema | La UI ya consume `MISION_JEZERO.dilemaPaso6.opciones`: refugio, escudo nivel 2 y aguantar. | La advertencia del handoff sobre alternativa antigua no coincide con esta copia local. El efecto extra condicionado al invernadero se rotula pendiente y no se envía como efecto aplicado. |
| 7. Telemetría | Acción, efecto pendiente y ticks restantes; se reconoce una causa positiva al recibir respuesta. | La llegada no determina la victoria en el motor leído. No representar solo un mensaje como misión ganada. |
| 8. Final | Resultado, causas, insignias y fuente de tormenta mediante `resumenPartida`. | El motor gana por días, no por `fin.exitoCuando`; tampoco consume `tickLimite` de Jezero. Falta integrar pregunta final y tarjetas verificadas por misión. |

Evidencia: [reductor UI](../../ui/src/juego/reductor.ts), [pantallas](../../ui/src/pantallas/Base3D.tsx), [misión](../../missions/src/jezero.ts), [acciones y final del motor](../../engine/src/acciones.ts), [señal de daño](../../engine/src/orbita.ts), [resultado UI](../../ui/src/pantallas/Final.tsx). El handoff informa una duración aprobada de tres ticks; su aprobación remota y fusión quedan por confirmar con responsables.

## 2. Escenario principal: organizar lo existente

Usar los anclajes actuales antes de mover todo el mapa. `x,z` indica dónde se para el jugador; `mx,mz` indica el centro visual. Son unidades del escenario, no coordenadas geográficas de Jezero. Si cambia una envolvente, actualizar su colisión y comprobar que no tape esos puntos.

| Sector | `LugarId` existente | Propósito en la misión | Primera representación |
| --- | --- | --- | --- |
| Centro | `mesa` | Planificar órbita/ruta/sitio y acceder a gestión/comunicaciones | Mesa de relieve y consola con espacio libre alrededor. |
| Servicio izquierdo | `taller` | Ingeniera, energía, reparación de Iris | Pupitre compartido, herramientas y pequeño armario. Almacén es anexo visual de este sector. |
| Observación derecha | `sensor` | Meteoróloga, lectura y fuente de evento | Instrumento, consola y señal de estado. |
| Hábitat del fondo | `habitat` | Doctora, soporte vital y consulta de protección | Casco con acceso claro; interior completo después de cerrar la ruta principal. |
| Solar | `panel_solar` | Módulo opcional y consulta sobre energía | Plataforma, bastidor, celdas y controlador. |
| Protección | `escudo` | Módulo opcional de blindaje | Carcasa/refuerzo con señal de estado; distinguirlo de la acción de refugiarse. |
| Agua | `reciclador_agua` | Módulo opcional de soporte vital | Dos depósitos y conexiones como familia repetida. |
| Cultivo | `invernadero` | Módulo opcional y explicación de alimentos | Domo, bandejas y tres siluetas vegetales dentro del cerramiento. |
| Enlace exterior | `antena` | Módulo opcional relacionado con comunicaciones | Base, mástil y plato, con representación de pendiente/recepción. |
| Experimento secundario | `banco` | Rampa y caja de caída ya existentes | Conservar como actividad opcional; no exigirla para completar Jezero. |

La distribución exterior del atlas v8 guía relaciones y estilo; no reemplaza automáticamente `mundo.ts`. Mantener dos circuitos y atajos, con acceso desde el centro a ambos lados. Caminar sigue siendo libre durante las fases de consulta y gestión; las acciones habilitadas dependen de las reglas de misión.

### Dos precauciones de integración

1. **Cinco opciones, dos construidas.** Preparar los cinco modelos maestros, pero mostrar los no elegidos como anclaje/propuesta, no como equipos funcionales. `equipos[id] === "ok"` no prueba que el jugador construyó ese módulo: la partida inicializa varios equipos así. Usar también `j.colocados` y la cola real de efectos.
2. **No inventar requisitos para ganar.** La telemetría y refugiarse están disponibles en las reglas locales sin exigir que antena o escudo sean los dos módulos elegidos. No bloquearlas porque una malla opcional esté ausente. La consola de enlace base y el espacio de protección del hábitat deben distinguirse del módulo opcional; Camilo confirma esa representación si cambia la interpretación visual.

## 3. Qué es estático, interactivo o animado

Clasificar por función, no por si el objeto se mueve. Una consola quieta es interactiva; una luz decorativa que pulsa no se vuelve jugable. Cada módulo combina geometría estática, punto de interacción y representación de estado.

### Estáticos del primer lote

| Familia | Piezas maestras | Reutilización y límite |
| --- | --- | --- |
| Terreno | Suelo facetado transitable, pequeños montículos y rocas | Variaciones de tamaño/giro con semilla decorativa; no alterar RNG de misión ni presentar relieve inventado como dato NASA. |
| Circulación | Baldosa, rampa baja, borde y poste | Caminos claros y dos circuitos; sin obstáculos que conviertan la base en laberinto. |
| Envolvente | Casco, pared, marco, hoja y ventana | Compartir proporciones de puerta y altura. Abrir una hoja es mejora posterior, no cambiar permisos de misión. |
| Mobiliario | Caja, balda, mesa, banco y gabinete | Anexo de almacén compacto dentro de taller; sin sistema de inventario nuevo. |
| Cultivo visual | Hoja, tallo, fruto y bandeja | Repetir plantas dentro de espacios protegidos; no permitir cosecha ni crecimiento funcional sin regla del motor. |
| Servicios | Tubo recto/codo/T, canaleta y lámpara | Cables fuera de rutas; luces de ambiente no se confunden con estado de equipo. |

No incluir estatuas, ruinas, portales o construcciones de piedra. Los primeros modelos se hacen con Three.js; imágenes y catálogos son referencias de silueta/material, no texturas para pintar una sala completa.

### Interactivos principales

| Prioridad / asset | Interacción del niño | Efecto autorizado | Feedback y estados |
| --- | --- | --- | --- |
| P0 Mesa/consola de misión | Inspeccionar, comparar sitios y confirmar | Selección y aplicación de aterrizaje cuando esté conectada con el motor | Disponible, enfocado, panel abierto, selección, aceptación/rechazo. |
| P0 Panel y controlador solar | Consultar, comparar, construir | `colocar_modulo` con `panel_solar`; limpieza es extensión posterior, fuera de semilla dorada | Ausente, instalando, operativo; avería solo desde estado real. |
| P0 Reciclador | Consultar y construir | `colocar_modulo` con `reciclador_agua` | Depósitos presentes al aceptar, beneficio pendiente; caudal solo como representación. |
| P0 Invernadero | Consultar y construir | `colocar_modulo` con `invernadero`; efecto del dilema pendiente de motor | Presencia y estado del equipo; nunca acreditar comida por animación. |
| P0 Blindaje/hábitat | Comparar refugio, escudo nivel 2 o aguantar | Opciones canónicas del dilema y acciones ya existentes | Protección/costo/pending legibles; entrar caminando no aplica la acción. |
| P0 Consola de enlace/antena | Enviar y observar respuesta | `enviar_telemetria`; demora del motor | Disponible, envío aceptado, pendiente con ticks, recibido; no cerrar misión desde animación. |
| P0 Tres expertas | Consultar y contrastar consejos | `conversar`/plantillas; confirmar aparte si se propone acción | Retrato, rol, consejo, fuente y foco; seleccionar no ejecuta. |
| P0 Iris y punto de reparación | Seguir guía, verificar error y reparar con Ingeniera | `verificarIris` y `reparar` con `ia_base` según APIs existentes | Dañada/verificada/reparada desde estado; conservar mismo rover y rostro. |
| P0 Sensor de tormenta | Consultar lectura y abrir fuente | Lectura de evento; sin mutación por inspección | Alerta solo cuando corresponde a la misión; fuente histórica identificable. |
| P1 Caja/rampa | Tomar, predecir, soltar y observar | Experimento local ya existente; no toca recursos de gestión | En mano, caída y resultado medido; opcional para la misión principal. |
| P2 Muebles/cajas decorativas | Ninguna en primera entrega | Ninguno | No mostrar marcador de interacción en cada taza o contenedor. |

### Animados por estado

Paneles/puertas usan grupos con pivote; Iris y personajes, jerarquía compartida por proporción; depósito, luz y pantalla leen vista. Estados de módulo actuales: `ausente`, `instalando`, `funcionando`. Extender la presentación de `averiado/destruido` desde `GameState.equipos` respetando presencia real y sin modificar el contrato.

Un cambio de material, pose o animación no gasta ni entrega recursos. Aplicar gasto al aceptar la acción; representar pendiente hasta su tick; comunicar daño y beneficio cuando el motor los registre. Movimiento reducido conserva información y elimina desplazamientos no esenciales.

## 4. Primer lote que conviene producir ahora

**Lote A: suelo con rocas, caminos, casco del hábitat, marco/puerta, consola maestra y panel solar.** Es suficiente para comprobar escala, recorrido y familia de materiales. No empezar por ocho interiores terminados.

Entregables de ese lote: una pieza maestra por familia, colocada sobre los anclajes actuales; una captura con la cámara de juego y otra cercana; acceso por teclado a mesa y taller; lectura en EN/ES; y representación de módulo ausente/instalando/operativo mediante estados de desarrollo que no alteren la partida real.

La mesa y los módulos ya tienen fábricas en `modelos.ts`; revisar y adaptar esas piezas primero. No copiarlas desde el laboratorio HTML ni producir otra escena independiente. La paleta definitiva se valida sobre la aplicación real servida con Vite: no sobre una maqueta que solo muestra botones HTML.

## 5. Restricciones globales del plan

- Una simulación y un renderer; usar `EscenaBase` y `crearEscena`, no crear otra aplicación.
- Conservar firmas públicas actuales; introducir archivos pequeños detrás de ellas solo donde reduzca trabajo real.
- Tres medidores, cinco módulos candidatos, dos colocados; cifras desde diseño/motor.
- Idioma base inglés y español completo; textos por i18n.
- Mundo abierto, mismos lugares en escena/lista accesible y en ambas cámaras.
- Tick actual de UI: 4000 ms. No cambiarlo para disimular duración de animaciones o falta de tiempo sin decisión de diseño.
- Ningún cambio a engine/design/missions/agents/data/contracts desde UI. Dependencias se registran para sus dueños.
- Conservar el trabajo local; cada entrega revisa su diff. Commits/PR solo con autorización de publicación vigente y sin incorporar archivos ajenos.

## 6. Cinco casos que no pueden romper la integración

1. Doble clic o tecla más botón: una confirmación no cobra ni construye dos veces.
2. Dos módulos elegidos que no incluyan antena o escudo: no inventar una nueva puerta de victoria/protección.
3. Abrir/cerrar consulta durante pausa o tormenta: conservar pausa previa y devolver foco.
4. Cambiar cámara o perder WebGL: mantener el mismo estado y una alternativa accesible; no reiniciar la misión.
5. Recibir efecto y daño en un mismo tick: mostrar saldo real y causas separadas, sin repetir feedback al rerenderizar o cargar estado.

## 7. Plan por entregas verificables

### Entrega 0: comprobar el punto de partida y acordar bloqueos

**Archivos a leer:** `ui/src/App.tsx`, `ui/src/pantallas/Base3D.tsx`, `ui/src/juego/reductor.ts`, `missions/src/jezero.ts`, `engine/src/acciones.ts`, `engine/src/orbita.ts`.

- [ ] Abrir la aplicación existente con `npm run dev` por HTTP; comprobar mundo, fallback y consola. Si no aparece 3D, registrar el error real antes de ajustar arte.
- [ ] Confirmar con Jaime la API de aterrizaje, validación de acción, ventana de tormenta, efecto del dilema y fin por telemetría/tick 10. El handoff refiere #113/#114; no se da por hecho su estado remoto.
- [ ] Confirmar con Camilo cómo se representa el tramo orbital/ruta y qué separa protección/enlace base de sus módulos opcionales.
- [ ] Guardar un recorrido de referencia de los ocho pasos con qué transiciones están conectadas y cuáles no, sin marcar la misión ganable antes de resolverlas.

**Cierra cuando:** existe un estado de partida reproducible y una lista de dependencias con dueño; no se rehicieron pantallas por desconocer lo que ya existe.

### Entrega 1: escenario principal y kit estático del lote A

**Modificar:** `ui/src/escena/modelos.ts`, `ui/src/escena/mundo.ts`, `ui/src/escena/escena3d.ts` solo si la nueva envolvente requiere ajustar colisión/anclajes.

**Crear si hace falta separar piezas compartidas:** `ui/src/escena/activos/piezasComunes.ts`. Responsabilidad: geometrías reutilizables, no lógica de misión. Mantener `crearTerreno`, `crearHabitat`, `crearMesa` y `crearTaller` como entradas consumidas por la escena.

- [ ] Revisar las fábricas existentes y fijar ancho de marco, altura de consola y escala del niño con la cámara actual.
- [ ] Construir/reutilizar terreno/roca, baldosa, casco, marco y consola; mantener materiales compartidos y RNG decorativo propio.
- [ ] Componer mesa, taller y hábitat sobre `LUGARES`; añadir solo el anexo de almacén que no bloquee accesos.
- [ ] Recorrer ambos circuitos con teclado/cámara; corregir la pareja geometría-colisión cuando cambie un volumen.

**Cierra cuando:** el escenario abre en la aplicación real, la identidad visual es reconocible y todos los puntos de interacción existentes siguen alcanzables. No requiere que Jaime termine la victoria.

### Entrega 2: cinco modelos de módulo con presencia correcta

**Modificar:** `ui/src/escena/modelos.ts`, `ui/src/escena/vista.ts` y el montaje en `ui/src/escena/escena3d.ts`. Archivo opcional por tamaño: `ui/src/escena/activos/modulosJezero.ts`, conservando el adaptador `crearModulo`.

**Consume:** `crearModulo(modulo, m, celdas): ModeloModulo`, `j.colocados`, `estado.efectosPendientes`, `estado.equipos` y `MODULOS`.

```ts
// Firma existente que debe conservar el modelo producido.
import type * as THREE from "three";

interface ModeloModulo {
  anclaje: THREE.Group;
  solido: THREE.Group;
  andamio: THREE.Object3D;
  reposo: THREE.Object3D[];
  vivos: THREE.Object3D[];
}
```

- [ ] Afinar primero panel/controlador; después duplicar la familia de depósito para agua, hoja/bandeja para invernadero, refuerzo de escudo y plato de antena.
- [ ] Mantener anclaje para lo ausente y sólido/indicador para lo instalado; no mostrar las cinco opciones operativas desde el inicio.
- [ ] Derivar operación de presencia, pendientes y equipo; no sumar beneficios desde el clip de construcción.
- [ ] Revisar las diez parejas posibles de dos módulos en estado de desarrollo, especialmente parejas sin antena/escudo. La producción usa semilla/acciones reales; la vista de desarrollo no altera esos recursos.

**Cierra cuando:** los cinco modelos existen, pero únicamente los módulos aceptados se representan construidos; estados se distinguen sin depender solo de color.

### Entrega 3: una interacción común y una primera decisión completa

**Modificar:** `ui/src/pantallas/Base3D.tsx`, `ui/src/componentes/Dialogos.tsx`, `ui/src/componentes/Acciones.tsx`, `ui/src/pantallas/ColocarModulos.tsx`, `ui/src/i18n.ts`, `ui/i18n/en.json`, `ui/i18n/es.json` según el cambio real.

**Crear:** `ui/src/componentes/ConfirmarAccion.tsx` solo si permite reutilizar la comparación actualmente contenida en `PanelModulo`; consumir `costoDe` y los datos del motor, no nuevas tablas de costos en UI.

```ts
// Contrato propuesto para un único panel de confirmación compartido.
import type { BaseAction, GameState } from "@solar-shield/contracts";

interface ConfirmarAccionProps {
  estado: GameState;
  accion: BaseAction;
  onCancelar(): void;
  onConfirmar(accion: BaseAction): void;
}
```

- [ ] Mantener `onUsar(LugarId)` como apertura de consulta; `onConfirmar` es el único punto que solicita ejecutar la acción.
- [ ] Mostrar costo, efecto esperado, motivo de bloqueo y fuente; implementar cancelación sin gasto.
- [ ] Conectar aceptación/rechazo con la API acordada en entrega 0; no marcar `colocados` por haber recibido un clic.
- [ ] Verificar doble activación, foco, pausa previa y equivalencia 3D/fallback para construir un panel solar.

**Cierra cuando:** se puede consultar, comparar, cancelar o confirmar un módulo y observar costo/pendiente correctos, sin cobro duplicado.

### Entrega 4: personajes y feedback funcional

**Modificar:** `ui/src/escena/modelos.ts`, `ui/src/escena/escena3d.ts`, `ui/src/escena/vista.ts`, `ui/src/componentes/Hud.tsx`, `ui/src/componentes/Tripulacion.tsx`, `ui/src/componentes/RetratoIris.tsx` y estilos existentes.

- [ ] Afinar un traje maestro por proporción y conservar interfaces `ModeloAstronauta`, `ModeloExperto` y `ModeloIris`; variar identidad y accesorios sin duplicar todas las piezas.
- [ ] Conectar consulta de Ingeniera/Doctora/Meteoróloga y verificación/reparación de Iris con las APIs de agentes existentes.
- [ ] Implementar entrada de panel/botón, foco y presión; después gasto/daño/beneficio/pending usando la tabla de tiempos del atlas.
- [ ] Distinguir gasto voluntario y daño por evento; agrupar feedback del mismo tick sin modificar `GameState` desde la animación.
- [ ] Revisar los casos 3, 4 y 5 de la sección anterior, incluido movimiento reducido y cambio de cámara.

**Cierra cuando:** la interacción se entiende tanto por texto como por imagen y los personajes responden sin decidir por el jugador.

### Entrega 5: ocho pasos completos y cierre correcto de Jezero

**Modificar en UI:** `ui/src/pantallas/Satelite.tsx`, `ui/src/pantallas/ElegirSitio.tsx`, `ui/src/juego/reductor.ts`, `ui/src/pantallas/Tormenta.tsx`, `ui/src/pantallas/Final.tsx` y coordinación en `Base3D.tsx`/`App.tsx`. Los cambios de motor/misión los entregan sus dueños.

- [ ] Conectar tramo orbital/ruta acordado y costo aceptado de sitio; mantener cuatro candidatos desde misión/dataset.
- [ ] Integrar opciones canónicas sin reconstruirlas en UI y representar el efecto extra del invernadero solo cuando lo aplique el motor.
- [ ] Aplicar la ventana de tormenta confirmada por Jaime y conservar alerta/fuente coherentes con el daño real.
- [ ] Enviar telemetría y esperar ticks de motor; mostrar éxito/fallo únicamente desde `resultado` y la regla acordada de fin.
- [ ] Mostrar cadena de causas, tarjetas con fuente disponible y pregunta educativa cuando corresponda. No presentar contenido sin fuente como verificado.

**Cierra cuando:** una secuencia acordada termina por telemetría con recursos positivos; una secuencia de fallo termina por recurso cero; las dos muestran causa y salida accesible. El mínimo jugable es este recorrido, no completar todos los interiores del atlas.

### Entrega 6: completar interiores y otras misiones por reutilización

- [ ] Terminar primero interior compartido de control/hábitat y equipamiento del invernadero que ya tiene función en Jezero.
- [ ] Añadir almacén, comedor, laboratorio y enfermería como ampliaciones de la misma familia, sin interacciones nuevas en cada prop.
- [ ] Incorporar polvo/limpieza solo después de que su estado y rendimiento estén implementados por diseño/motor; no forzarlo en la semilla dorada.
- [ ] Evaluar destinos restantes cuando exporten misión jugable y sus responsables confirmen integración. Reutilizar piezas; no reutilizar supuestos de tormenta, datos o balance de Jezero.

**Cierra por cada ampliación:** aporta una función clara, conserva el recorrido anterior y no exige duplicar simulación ni controles.

## 8. Comprobaciones de implementación, cuando se ejecute

Para el kit visual: comprobación de tipos de UI, captura con cámara fijada y recorrido manual de anclajes. Para reglas y confirmaciones: ampliar los casos conductuales existentes en `ui/src/juego/reductor.test.ts` y `ui/src/escena/escena.test.ts`; no añadir pruebas de que una caja tenga cierto número de hijos.

```powershell
# Solo al implementar los cambios correspondientes; no ejecutados en esta planificación.
npm exec tsc -- -b ui --pretty false
npm test -- ui/src/juego/reductor.test.ts ui/src/escena/escena.test.ts
```

Los bloqueos de motor necesitan sus propias regresiones de aterrizaje, ticks 3/4/5 frente a 6, final por telemetría y efecto condicionado a invernadero. UI no se adjudica esa corrección ni sustituye el motor con una bandera de victoria local.

## 9. Dependencias y próximo trabajo concreto

| Responsable | Confirmación/entrega que desbloquea | Qué puede avanzar Paula mientras tanto |
| --- | --- | --- |
| Jaime | Aterrizaje, aceptación/rechazo, tormenta de tres ticks, extra del dilema y fin de Jezero | Kit estático, modelos/pivotes y representación visual sin cambiar reglas. |
| Camilo | Ruta orbital, relación entre módulos opcionales y servicios base, semántica final y fuentes de aprendizaje | Ensamblaje sobre anclajes actuales y paneles que leen los datos ya acordados. |
| José | Consejos/escena de dilema, verificación y reparación con APIs coherentes | Retratos, traje compartido e interacción de consulta/confirmación. |
| Daniel | Fuentes de terreno/evento y tarjetas científicas verificadas | Contenedores de fuente y distinción dato real/regla educativa. |
| Paula | Escena, assets procedurales, UI, cámara y accesibilidad | **Primero lote A; después los cinco módulos, una confirmación completa y el resto de feedback.** |

El estado de este documento es un plan propuesto, no implementación realizada. Revisión propia: los ocho pasos tienen entrega; hay un inventario estático/interactivo; el primer lote no depende de ampliar misiones; firmas y nombres se apoyan en el árbol local; bloqueos no se resuelven desde carpetas ajenas. Publicación y ejecución del plan completo quedan sujetas a la revisión acordada con María Paula.
