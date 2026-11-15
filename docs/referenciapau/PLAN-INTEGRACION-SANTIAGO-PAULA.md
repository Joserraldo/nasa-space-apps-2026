# Integración del escenario vigente: Santiago y María Paula

**Base única:** `origin/develop` (`def6e77` al preparar este plan, 15 nov 2026). **Objetivo:** jugar el escenario completo primero y corregir su fidelidad mediante cambios acotados después. **Stack:** React, TypeScript y Three.js 0.160 procedural ya instalados; sin nuevas librerías.
**Especificación:** [ESCENAS.md](ESCENAS.md), [MECANICAS.md](MECANICAS.md), [DISEÑO.md](DISEÑO.md), [MARTE.md](MARTE.md) y las imágenes originales de `Documents/santiago`.
Este plan reemplaza el reparto entre cinco personas para esta integración temporal de dos personas, por instrucción de María Paula. No modifica el balance ni los contratos de otros paquetes.

## 1. Reparto obligatorio de modelos y autoridad

**Haiku lee. Opus implementa. Fable audita.** Confirmado por María Paula; no intercambiar estas funciones.

| Modelo | Hace | No hace | Entrega |
| --- | --- | --- | --- |
| Haiku | Lecturas acotadas, búsqueda de símbolos, firmas reales, estado de PRs, inventario de referencias y comandos de prueba. | No escribe implementación ni aprueba fidelidad. No interpreta un archivo completo si basta una función. | Rutas, líneas, firmas, SHA base y hechos separados de hipótesis. |
| Opus | Implementación, pruebas y correcciones a los hallazgos de Fable, un responsable por archivo. | No se autoaprueba, no modifica motor/contratos ni copia prototipos descartados. | Diff, pruebas ejecutadas y capturas del juego real. |
| Fable | Auditoría de integración, código y comparación visual con las imágenes de `santiago`; prioriza bloqueos. | No escribe arreglos mientras Opus edita; devuelve hallazgos al implementador. No hace merge. | Aceptación o hallazgos con archivo/línea, síntoma, referencia y prueba faltante. |

Usar los alias que la instalación del equipo ya reconoce para esos tres modelos. No inventar IDs o versiones, ni cambiar el modelo/esfuerzo global de una sesión. Si falta un alias, reportarlo y continuar los frentes disponibles; no sustituirlo silenciosamente. Este documento prescribe ejecución futura en Claude: no afirma que esos modelos hayan ejecutado este PR de Codex.
Santiago coordina y fusiona PRs a `develop`; María Paula valida las referencias y el resultado visible. Ningún lote espera una respuesta de José, Daniel, Camilo o Jaime: sus avances ya publicados se revisan y aprovechan desde estas dos sesiones.

## 2. Qué está y qué falta, comprobado sobre develop

| Pieza | Estado comprobado | Acción inmediata |
| --- | --- | --- |
| Escenario exterior | `armado.ts` monta terreno, edificios, caminos y módulos; `EscenaBase` ya se usa en E5 y E7. | Mantenerlo; no reemplazar por otra escena. |
| E6 Base | `PantallaBase.tsx` tiene un contenedor vacío. #247 agrega el canvas con cambios en tres archivos, hacia `develop`, mergeable y con CI verde al consultar. | Revisar y fusionar #247 primero. Tiene cámara fija y callbacks incompletos: no confundirlo con navegación terminada. |
| Personajes | Fábricas definitivas en `escena/personajes/` (#316 y #321); no montadas en la escena base de develop. | Este PR monta niño, Ingeniera e Iris, sin rediseñar sus geometrías. |
| Movimiento | `fisica.ts`, `guia.ts`, `navegacion.ts` y `entradaTactil.ts` existen. `escena3d.ts` conserva `FOCO` fijo. | Conectar esas piezas sobre las firmas reales, después del montaje. |
| UI y tormenta | #309 tiene conflictos; #269 usa otra base y también tiene conflictos. | Recuperar solo su cambio útil contra el develop actualizado; no fusionar su pila antigua completa. |
| Inicio/carga/intro | #326 → #320 → #319; intro #318 → #325 (este último apunta a la rama de #318). | Auditar en serie después del recorrido base. Retarget a develop cuando entre el padre. |

Estado de PRs es una fotografía, no autorización de fusión: Haiku lo vuelve a consultar justo antes de aplicar. #323 apunta a la integración antigua y toca pantallas borradas: no entra en esta cola; sustituir solo una necesidad todavía vigente, si aparece.
**Fuera de la base:** `localhost:5199/activos.html`, `personajes-b` sin commitear, `fix/ui-fidelidad-activos` y el prototipo `localhost:5200`. No portar su código, sus interiores, su portada ni su visor. Las imágenes de `santiago` son referencias; esta exclusión no las descarta.

## 3. Orden para juntar y probar ahora

- [ ] Santiago revisa #247 contra develop y lo fusiona solo con checks correctos. Alternativa si queda obsoleto: Opus recupera exclusivamente su montaje de `EscenaBase`, `colocados` y estilos del contenedor en una rama nueva; no espera al autor.
- [ ] Actualizar y revisar este PR de tripulación contra ese develop; fusionarlo después de #247. Sus archivos de escena son distintos de los tres de #247. No hacer merge automático desde un agente.
- [ ] En el juego, recorrer portada → intro → carga → órbita → sitio → colocar dos módulos → E6 → tormenta → resultado. Comprobar canvas en E5/E6/E7, modelos visibles y sin duplicaciones al cambiar de fase.
- [ ] Tomar una captura base a 1024×683 con el panel cerrado y otra con él abierto. Esa es la referencia de regresión técnica; la aprobación artística sigue contra `santiago`.
- [ ] Recién con ese montaje probado, iniciar en paralelo A y B. No esperar a que los interiores estén terminados para probar el recorrido.

Este PR incorpora cuerpos y animación de reposo; **no implementa caminar, joystick, seguimiento de Iris ni E6 por sí solo**. #247 y este PR se prueban también combinados antes de la fusión; la evidencia lo identifica expresamente.

## 4. Paralelismo sin pisarse

Dos implementadores Opus como máximo, uno por frente, en worktrees externos al checkout principal. Una lectura Haiku puede adelantarse al siguiente lote; Fable audita el SHA terminado mientras el otro frente sigue en sus archivos. Un archivo tiene un solo escritor. No activar bucles de agentes sin límite.

| Frente | Responsable humano / modelo | Archivos exclusivos | Entregable |
| --- | --- | --- | --- |
| A: recorrido y UI real | Santiago / Opus | `App.tsx`, `pantallas/`, `componentes/ControlesTactiles.tsx`, `componentes/Mapa.tsx`, estilos de pantallas e i18n de sus controles. | E6 conectado, una confirmación de acción, mapa utilizable, HUD sin duplicados y controles visibles en los cuatro tamaños. |
| B: mundo y actores | María Paula / Opus | `escena/escena3d.ts`, `EscenaBase.tsx`, `tripulacionBase.ts`, nuevo `movimientoBase.ts` y sus pruebas; consume física, guía, entrada táctil y mapa vigentes. | Niño recorrible, cámara 1.ª/3.ª, Iris acompañante y proximidad real. |
| F: fidelidad después de B | María Paula / Opus | `escena/activos/` y geometría de `escena/personajes/`, un maestro por lote. | Corregir forma/material del objeto ya montado, sin cambiar pantalla o física en ese mismo lote. |

**Frontera A/B:** B conserva las props actuales de `EscenaBase`; cualquier extensión de destinos/entrada se escribe primero como interfaz aditiva en ese archivo y se comunica con diff exacto a A. A implementa DOM sin inventar métodos del renderer. Solo B edita `EscenaBase.tsx`. Cualquier cambio de `mundo.ts`/huellas se integra en una tarea serial de B y se revisa con sus colisiones; no se ajustan coordenadas desde un componente visual.

### A. Conectar la experiencia (Opus)

- [ ] E6: partir del montaje de #247; `vistaEscena(estado, {fase, colocados, averiaRevelada})` y `eventosDeTick` alimentan la escena. `onUsar` abre conversación/plan mediante los mismos controladores de la UI. Nunca aplicar una acción solo al acercarse.
- [ ] Mapa: un botón elige destino; B consume destino y calcula ruta. Teclado manual cancela el destino; diálogo, campo de texto o panel de confirmación bloquean movimiento/uso del mundo. Mantener un único `ConfirmarAccion` y un solo despacho de motor por confirmación.
- [ ] E7: rescatar de #309/#269 únicamente HUD y paneles que faltan, comparándolos con el código actual. Costos/beneficios salen del motor; una avería cambia la vista y la malla por el mismo evento.
- [ ] Móvil: probar 844×390 y 390×844; mundo y panel no desbordan el documento, scroll dentro del panel y acción/cancelar alcanzables. No usar un aviso de rotación como sustituto del diseño vertical. Control táctil de al menos 48 px, safe area y foco visible.
Prueba de salida de A: ruta dorada en EN y ES, ratón/teclado y toque; confirmar una vez, volver a explorar, cambiar fase, perder/restaurar WebGL sin reiniciar la partida. No declarar móvil físico probado usando solo emulación.

### B. Movimiento sobre las firmas actuales (Opus)

- [ ] Extraer estado de movimiento a `movimientoBase.ts`; consume `INICIO_JUGADOR`, `TERRENO`, anclajes y `Cuerpo`. Por frame: acumular dt → `subpasos` → `moverPersonaje(c,vx,vz,dt,TERRENO,radio,extra)` → copiar posición al `tripulacion.jugador.grupo`. No reconstruir mallas.
- [ ] Resolver colisiones con edificios, módulos, rocas y rampas reales. `extra` admite círculos; no convertir una huella rectangular en un círculo arbitrario: probar límites, esquinas y deslizamiento. Si una geometría cambia de huella, actualizar también colisión y ruta en ese lote.
- [ ] `planearRuta(inicio,destino,terreno,radio)` viene de `navegacion.ts`; `pasoGuia` viene de `guia.ts`. Actualizar Iris, ruedas y orientación desde su velocidad real. No moverla directamente a través de sólidos.
- [ ] Reemplazar el foco fijo por la posición del jugador; conservar desfases de cámara y transición reducida. Ocultar cuerpo en primera persona, mostrarlo al volver. `lugarCercano()` debe consultar la posición actual y emitir callback cuando cambia, no solo al montar.
- [ ] `WASD`/flechas, `E` y `V`, más `EntradaTactil`: limpiar teclas al perder foco; al ocultar pestaña no acumular un salto al regresar. Frenar al abrir panel y al escribir. Mantener un único bucle de animación.
Prueba de salida de B: visitar mesa, taller y panel sin atravesar sólidos; rampa y borde alto; cancelar ruta con teclado; abrir diálogo mientras camina; dos cambios de cámara; pérdida de foco; movimiento reducido y doble montaje sin fugas. El motor no debe cobrar por caminar.

## 5. Fidelidad del develop vigente frente a santiago

No reutilizar el inventario de 74 vistas del visor descartado: parte de esas piezas no pertenece a develop. Comparar el objeto que aparece en el **juego integrado**, con misma cámara y proporción, antes de adjudicar causa.

**Evidencia de esta pasada:** [E6 escritorio](../../ui/capturas/integracion-develop/e6-1024x683.png), [E6 vertical](../../ui/capturas/integracion-develop/e6-390x844.png) y [E7](../../ui/capturas/integracion-develop/e7-1024x683.png). Son el juego de `develop` + este PR + #247 aplicado temporalmente solo para QA; #247 no se incluye en este diff. Se probaron cuatro tamaños, un canvas y cero errores. En vertical se observa HUD muy alto, niño cortado y acciones fuera del primer cuadro; ausencia de desborde horizontal no significa diseño móvil aprobado. En E7 el panel domina el mundo y duplica visualmente los recursos. La cámara fija hace que el montaje conjunto todavía difiera de `santiago`. Corregir A/B antes de pulir muebles.
**Presupuesto:** prueba sin WebGL de cinco módulos: 80 llamadas/69951 triángulos. Render real automatizado en la vista diagnóstica de esos mismos modelos: 51/52615 en el encuadre capturado. La muestra corta dio 13 FPS promedio en Chromium headless; no acredita rendimiento en dispositivo real ni permite aprobarlo. Ver [registro](../../ui/capturas/integracion-develop/verificacion.json). No subir complejidad hasta medir en el equipo de Santiago y en celular.
**Ciclo de vida GPU:** dos montajes de la escena armada dieron 50 llamadas/52519 triángulos, 49 geometrías y 4 texturas; tras cada desmontaje, 0 geometrías/0 texturas. La diferencia con la vista diagnóstica es su contorno adicional. Cámara: primera persona oculta el cuerpo y al volver se recupera el conteo anterior. [Medición](../../ui/capturas/integracion-develop/gpu-ciclo-vida.json). Validación local del PR limpio: 831 pruebas, tipos, build y ruta dorada correctos; advertencia de chunk grande aún presente. El FPS físico y la fidelidad final siguen pendientes.

| Referencia original de santiago | Equivalente del repo | Diferencia / comprobación y arreglo |
| --- | --- | --- |
| `04_Jugabilidad/01_Web/01_tercera_persona.png` | `mundo/01-exterior-tercera-persona.png` | Faltaban los tres actores; este PR los monta en anclajes vigentes, todavía quietos. Calibrar distancia, altura y escala conjunta; no deformar personajes para llenar la pantalla. |
| `01_Escenario/03_Elementos/01_marco_puerta.png` | `piezas/01-puerta-marco.png` | #315 ya engrosó el marco. Revisar dintel, zócalos y luces encastradas antes de volver a tocarlo; no recuperar la puerta estrecha del borrador. |
| `01_Escenario/03_Elementos/02_consola.png` | `piezas/02-consola.png` | Contrastar espesor del tablero, apoyos y oscuridad de pantalla. El controlador solar puede usar icono solar de mundo/01; no tratar un icono contextual como dato NASA real. |
| `01_Escenario/03_Elementos/04_panel_solar.png` | `piezas/04-panel-solar.png` | Calibrar inclinación/soporte con el panel maestro real y su montaje; no mezclar la pieza individual con el módulo de varias placas. |
| `01_Escenario/03_Elementos/05_deposito.png` | `piezas/06-deposito.png` | Revisar transparencia y nivel de líquido bajo luz del juego. Si la luz lo lava, corregir cámara/luz antes de cambiar globalmente la paleta. |
| `01_Escenario/03_Elementos/07_banco.png` | `piezas/07-banco.png` | La lámina tiene brazos, respaldo y cojines teal; la fábrica actual tiene banco bajo sin ellos y cojines oscuros. Separar banco logístico y sofá, compartiendo piezas. |
| `01_Escenario/03_Elementos/11_terreno_cultivos_servicios.png` | `exterior/02-kit-entorno-cultivos.png` | Los cultivos detallados/servicios del borrador no se portan. Construir maestros hoja/tallo/fruto cuando entren; plantas solo dentro del invernadero. Revisar bridas ámbar por slot específico, sin recolorear todo `Accent`. |
| `01_Escenario/02_Exteriores/01_familia_estaciones.png` | `estaciones/00-panorama-estaciones-y-piezas.png` | El casco genérico no sustituye la silueta de cada estación. Primero exteriores realmente usados; después variantes alargadas y accesos. Toda huella nueva exige prueba de recorrido. |
| `01_Escenario/01_Interiores/` | `estaciones/` | Los interiores recuperados de Claude no entran. Diseñar una estación funcional por vez tras el recorrido: protagonista, acceso y utilidad; nunca nueve cuartos iguales con otros muebles. |
| Inicio / celular / tableta / UI | `inicio/`, `ui/` y equivalencias del registro adjunto | Entrada: usar la pila #326/#320/#319 y #318/#325, no `activos/portada.ts` del borrador. Las imágenes son guía de forma y layout, no fondos que sustituyen el mundo 3D. |

Toda diferencia pendiente se registra como geometría, montaje, cámara, luz, material, UI o interacción. No se aprueba un render por pasar tests. Cielo caramelo de Marte y valores reales del motor reemplazan el cielo azul y números ilustrativos.

## 6. Fable: auditoría de cada lote y puerta conjunta

Fable recibe SHA base/head, archivos propios del lote, lámina original/equivalente, captura completa y salida de pruebas. No relee todo el repo: Haiku entrega las firmas y los diffs precisos. Audita mientras el otro Opus trabaja en su frente; sus hallazgos vuelven al Opus autor.
- [ ] Silueta, posición, material y cámara cotejados por separado; no inventar porcentajes de similitud. Una reducción de referencia a 1024 px no significa que falte del repo por tener distinto hash.
- [ ] Estados reales: solo módulos colocados son sólidos, costo coincide con UI, tormenta/avería/Iris siguen `VistaEscena`, una confirmación cobra una vez y pausa conserva partida.
- [ ] Ciclo de vida: crear/destruir dos veces, esqueletos y materiales liberados sin romper copias, sin RAF/listeners huérfanos. Primera persona sin cuerpo tapando cámara.
- [ ] Cuatro tamaños: 1440×900, 1024×683, 844×390 y 390×844; teclado, EN/ES, toque emulado y después un celular físico. No duplicar medidores ni cortar confirmar/cancelar.
- [ ] `renderer.info` después del render: calls ≤80 y triángulos ≤80000. Medir también cinco módulos, sombras y personajes; el presupuesto no autoriza borrar siluetas necesarias. Celular físico/PC viejo se reportan aparte de Chromium automatizado.
- [ ] Ejecutar `npm run typecheck`, pruebas de la tarea y `npm run build`; antes de fusionar, `npm test` y `npm run e2e`. Fallo reproducible se corrige en su frente; un bloqueo visual se enumera aunque CI esté verde.
Salida de Fable: `apto para integrar` o `requiere cambios`, con hallazgos concretos. Santiago hace la fusión humana; después ambos prueban el develop desplegado, no una página de muestras.

## 7. Prompts de ejecución

**Haiku:** «Lee este plan, el SHA actual de develop y solo los archivos del próximo lote A o B. No edites. Devuelve firmas y rutas reales, diferencias de PRs abiertos, referencias de santiago/equivalentes y comandos de prueba. Marca lo que no comprobaste. No uses el código de 5199 ni el prototipo 5200».

**Opus A/B:** «Implementa únicamente el lote A/B de este plan, desde origin/develop actualizado. Eres el único escritor de tus archivos; hay otro Opus en paralelo: conserva su trabajo. Usa el informe de Haiku, verifica firmas antes de llamar métodos y entrega diff, pruebas y captura del juego. No hagas merge ni rediseñes otro frente. Fable revisará tu SHA».

**Fable:** «Audita en solo lectura el lote y SHA recibidos contra este plan y las imágenes de santiago. Revisa integración real en E5/E6/E7, identidad visual, estado, controles, rendimiento y liberación. No implementes cambios. Devuelve hallazgos accionables a Opus; si está apto, indícalo sin hacer merge. La versión de 5199 está descartada».

Cada PR tiene rollback propio mediante revert del commit de integración, sin reset ni force-push a develop. Un cambio de fidelidad se puede revertir sin quitar la navegación; por eso no se mezclan ambos en el mismo lote.
