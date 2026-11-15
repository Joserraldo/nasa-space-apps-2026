# APLICACION: cómo se construye en código

**Qué es:** el encargo técnico para llevar [DISEÑO.md](DISEÑO.md), [MARTE.md](MARTE.md) y [ESCENAS.md](ESCENAS.md) a `ui/`. **Pila fija:** React 18 + TypeScript + Three.js `^0.160.0` (`WebGLRenderer`) + CSS / Web Animations API. `three` (y `@types/three`) es la única dependencia que se agrega ([D6](../decisiones/D6-estilo-visual.md)); llega a `develop` con #142. Sin otros frameworks, sin GLB, sin WebGPU.
**Alcance de carpetas del rol ui:** solo `ui/` y `assets/`. Lo que haga falta de `engine/`, `design/`, `missions/`, `data/`, `agents/` o `contracts/` se pide con un issue `bloquea:<rol>`.

---

## 1. Punto de partida: qué se conserva y qué se reemplaza

**Se reemplaza por completo (prototipo descartado, "Plan B"):**
- Geometría, proporciones, cielo `#323272`, iluminación, paneles oscuros y visores opacos de `ui/src/escena/modelos.ts` y `escena3d.ts`.
- Paleta oscura de `ui/src/estilos.css` (`#0b1026`, `#1a2350`, `color-scheme: dark`) y `ui/src/mision.css` (`--hud: #141a2b`, `--hud-edge: #2c3550`, `--life: #9be15d`).
- Bienvenida de `Base3D.tsx` (`.vineta-mundo`, `.bienvenida-mision`, `.boton-despegar` verde, `.comunicador-iris` oscura).
- `<Hud />` mostrado en la fase `inicio`.
- `escena/polyfork.ts` (clona y reemplaza materiales por vertex colors: rompe visor, tela y acentos). Ya archivado; no vuelve.

**Se conserva (contratos internos que consume la escena):** `Materiales`, `ModeloModulo`, `ModeloAstronauta`, `ModeloExperto`, `ModeloIris`, `GestoIris`, `crearMateriales`, `crearTerreno`, `crearModulo`, `crearAstronauta`, `crearExpertos`, `crearIris`, `crearDecorado`, `activarSombras`, `liberarEscena`, `LUGARES` y `LugarId` de `mundo.ts`, `GRAVEDAD_MARTE` de `fisica.ts`, i18n, el reductor y el respaldo 2D. Se reemplaza la implementación detrás de esas firmas, por fases.

```ts
// Firma existente que el modelo nuevo debe conservar (ui/src/escena/modelos.ts).
interface ModeloModulo {
  anclaje: THREE.Group;   // siempre visible: base del anclaje vacío
  solido: THREE.Group;    // el módulo construido
  andamio: THREE.Object3D; // estado "instalando"
  reposo: THREE.Object3D[];
  vivos: THREE.Object3D[];
}
```

## 2. Arquitectura de archivos

| Archivo | Responsabilidad única |
| --- | --- |
| `ui/src/escena/materiales.ts` | Caché de geometrías base inmutables (`Map<string, BufferGeometry>`) y materiales por slot. |
| `ui/src/escena/liberar.ts` | Liberación con dueño explícito; no borra recursos compartidos al quitar una copia; resistente al doble montaje de `StrictMode`. |
| `ui/src/escena/activos/piezasComunes.ts` | Fábricas del kit (§4): marco, puerta, pared, suelo, consola, caja, banco, tanque, panel, antena, jardinera, roca, baliza. |
| `ui/src/escena/activos/instancias.ts` | `InstancedMesh` para repetidos estáticos con mapa `instanceId -> assetId / lugar`. |
| `ui/src/escena/activos/astronautas.ts` | Familia de trajes: `crearCascoBase`, `crearVisorTransparente`, `crearTorsoYCollar`, `crearMochilaModular`, `crearExtremidadesConBotaYGuante`; niño y adultas por configuración. |
| `ui/src/escena/activos/iris.ts` | Rover de 4 ruedas con pivotes por rueda, panel en techo y pantalla de ojos en canvas. |
| `ui/src/escena/activos/modulos.ts` | Los 5 módulos de Jezero detrás de `crearModulo`. |
| `ui/src/escena/activos/estaciones.ts` | Estaciones ensambladas por tabla de configuración (ampliación). |
| `ui/src/escena/cielo.ts` | Cielo, niebla y luces por ambiente ([MARTE.md](MARTE.md) §4–5). |
| `ui/src/escena/vista.ts` | Derivador puro `GameState -> estado visual` (presencia, instalando, funcionando, avería de Iris). Nunca calcula costos ni ticks. |
| `ui/src/escena/mundo.ts`, `fisica.ts` | Anclajes `1 u = 1 m`, colisiones simples separadas de la malla artística, gravedad de Marte. |
| `ui/src/escena/escena3d.ts`, `EscenaBase.tsx` | Un solo `WebGLRenderer`, ciclo de vida, calidad adaptativa, recuperación de contexto. |
| `ui/src/componentes/` | Átomos y compuestos UI (§5). |
| `ui/src/pantallas/` | Pantallas que componen los compuestos y coordinan con el reductor. `Base3D.tsx` coordina panel, pausa, foco y acciones; no es dueño de costos. |

## 3. Contrato procedural

- `1 u = 1 m`, `Y` arriba, frente acordado. Escala aplicada antes de registrar colliders.
- Nombres estables: `Station_Greenhouse`, `Door_Frame_A`, `Door_Leaf_L` / `Door_Leaf_R`, `Socket_Entry`, `Socket_Console`, `Collider_*`.
- Pivote **base-centro** para props; **bisagra o eje real** para lo que se mueve (`head_axis_separate` en paneles, hojas de puerta, ruedas, extremidades).
- Cada pieza maestra tiene: fábrica editable, configuración o semilla, pivotes, slots de material, dimensiones de producción y miniatura de revisión.
- Slots de material: `SuitBase`, `Accent`, `Boots`, `Skin`, `Hair`, `Glass`, `Emissive`, `Rock`, `Plant`. Cambiar el rol de un personaje **clona solo `Accent`** de esa instancia; nunca se modifica el material compartido.
- Herramientas de forma: `Shape` + `ExtrudeGeometry` con bisel para marcos y chaflanes; `BufferGeometry` propia para facetas, hojas y terreno; `IcosahedronGeometry` no indexada con desplazamiento determinista y `computeVertexNormals()` para rocas; `Group` con pivotes para articular.
- Semilla decorativa **separada** del RNG de la misión. Nunca `Math.random` en algo que afecte la partida.
- Personajes: jerarquía `Root > Rig > Hips / Spine / Head / Arms / Legs` con `Socket_Hand_R`, `Socket_Back`, `Socket_Tether`. Visor como superficie transparente separada, sin doble capa coincidente. Cada personaje con su propio estado de animación aunque comparta curvas.
- Rostros: ojos y boca intercambiables (o morph targets) para las 8 expresiones; el retrato UI sale de la misma identidad.

## 4. Kit de piezas: nueve familias

| Familia | Piezas reutilizables | Qué cambia por configuración |
| --- | --- | --- |
| Estantería | Montante, travesaño, balda, fondo opcional | Altura, bahías y ocupación, mismo paso modular |
| Contenedor | Caja base, tapa, asa o cierre, canister | Tamaño, proporción, acento y pictograma |
| Puesto de trabajo | Mesa, pantalla, soporte, silla | Composición; los datos visibles salen del motor |
| Corredor | Suelo de 1 m, costilla, pared, cristal, puerta, conector T o cruce | Recto, T, cruce, longitud en módulos |
| Cultivo | Hoja maestra, tallo, fruto, plántula, bandeja | Especie visual y distribución con semilla decorativa |
| Mobiliario | Banco, mesa, armario, camilla, carrito | Accesorios y acentos; partes móviles con pivote propio |
| Servicios | Tubo, codo, T, canaleta, enchufe, luminaria | Conexión sobre anclajes; se actualizan buffers, no se reconstruyen |
| Envolvente exterior | Casco modular, puerta, rampa, techo, ventana, cúpula | Silueta de estación con piezas compatibles |
| Terreno | Suelo, rocas pequeñas, montículos, camino, baliza | Semilla, escala y giro |

Piezas maestras con lámina individual (detalle legible por máquina en [`catalogo-assets.json`](catalogo-assets.json)):

| Pieza | Lámina | Fábrica | Pivote | Regla |
| --- | --- | --- | --- | --- |
| Puerta y marco | [`piezas/01`](referencias/piezas/01-puerta-marco.png) | `door` | base-centro | Hueco y biseles compartidos; hoja móvil aparte. |
| Consola | [`piezas/02`](referencias/piezas/02-consola.png) | `consoleUnit` | suelo-centro | Carcasa y pantalla separadas; la pantalla dibuja datos reales, sin texto horneado. |
| Caja | [`piezas/03`](referencias/piezas/03-caja.png) | `crate` | suelo-centro | Una maestra con variantes de tamaño, giro y acento; instanciada. |
| Panel solar | [`piezas/04`](referencias/piezas/04-panel-solar.png) | `solarPanel` | base-centro + eje de cabeza | Gira en su eje; no "genera" energía visualmente. |
| Jardinera | [`piezas/05`](referencias/piezas/05-jardinera.png) | `planter` / `plant` / `leaf` | base-centro | Maceta compartida; variación por semilla decorativa. Solo interiores. |
| Depósito | [`piezas/06`](referencias/piezas/06-deposito.png) | `tank` | base-centro | Cuerpo, tapas y fluido; el nivel cambia solo con estado autorizado. |
| Banco | [`piezas/07`](referencias/piezas/07-banco.png) | `bench` | suelo-centro | Base y cojines repetibles; sentarse no toca recursos. |
| Antena | [`piezas/08`](referencias/piezas/08-antena.png) | `antenna` | base-centro | Base, mástil, plato y eje; la respuesta depende de ticks. |

[`piezas-procedurales.js`](piezas-procedurales.js) exporta fábricas de bloque inicial (`door`, `consoleUnit`, `crate`, `solarPanel`, `planter`, `tank`, `bench`, `antenna`, `rock`, `plant`, `station`, `astronaut`). Sirve para medidas y arquitectura de caché; **sus siluetas no son arte aprobado** y no se copia su simulación.

## 5. Interfaz: átomos y compuestos

| Nivel | Piezas | Regla |
| --- | --- | --- |
| Tokens | Color, chaflán, grosor, sombra, espaciado, tipografía, duración, easing | Un solo conjunto (variables CSS) para portada, HUD, consulta, comparación, pausa y final. |
| Átomos | `FacetButton`, icono, etiqueta i18n, valor, keycap, anillo de foco | Variantes por propiedad; prohibido un botón distinto por pantalla. |
| Compuestos | `ResourcePlaque`, `ExpertPortrait`, `CostRow`, `PendingEffect`, mensaje, entrada, `TarjetaFuente` | Separar dato, aspecto y evento; un icono nunca es la única etiqueta. |
| Paneles | `DialogueCard`, `DecisionCard`, ajustes, fuentes, resultado | Mismo contrato de apertura, foco, `Escape` y cierre. |

Formas propuestas:

```ts
interface FacetButtonProps {
  variant: "primary" | "secondary";
  labelKey: string;          // clave i18n, nunca texto literal
  disabled?: boolean;
  disabledReasonKey?: string;
  busy?: boolean;
  selected?: boolean;
  onClick(): void;
}
// Botón nativo; superficie recortada INTERIOR y wrapper de foco EXTERIOR:
// el chaflán nunca recorta la caja táctil ni el anillo de foco.

interface ResourcePlaqueProps {
  recurso: "energia" | "soporte_vital" | "blindaje";
  value: number;             // valor real del motor, siempre
  pending: PendingEffect[];  // de estado.efectosPendientes
  feedback: { id: string; delta: number; causaKey: string }[];
}
// La etiqueta del lector de pantalla se actualiza por grupo de cambios, no por fotograma.

// Un único panel de confirmación para toda acción (construir, dilema, telemetría):
interface ConfirmarAccionProps {
  estado: GameState;
  accion: BaseAction;
  onCancelar(): void;
  onConfirmar(accion: BaseAction): void; // único punto que pide ejecutar
}
```

Reutilizar `CostRow`, `PendingEffect`, `DecisionCard` y `FacetButton` en `ColocarModulos.tsx`, `Tormenta.tsx` y `Acciones.tsx`: **un solo camino de confirmación y rechazo**.

## 6. Conexión con el motor

- La escena es presentacional y determinista: lee `vista.ts`, nunca calcula reglas.
- `requestAnimationFrame` para dibujar; ticks del motor para la gestión. `animationend`, un clip terminado o un temporizador visual **nunca** dan recursos ni avanzan la misión.
- Después de llamar al motor, comprobar que el estado cambió (acción aceptada) antes de marcar algo como colocado. Hoy el reductor actualiza `colocados` tras llamar al motor: debe verificar el resultado.
- Identificador visual de cada feedback derivado de secuencia + tick + índice de causa en el adaptador de UI (sin añadir campos al contrato). Mismo snapshot no repite animación; un evento nuevo con igual delta sí.
- Al cargar un guardado: construir la línea base sin animar las causas históricas.
- Detalle de funciones y del ciclo de decisión: [MECANICAS.md](MECANICAS.md) §4 y §7.

## 7. Animación

Curvas: entrada `cubic-bezier(.2,.8,.2,1)`, salida `cubic-bezier(.4,0,1,1)`. CSS para estados; Web Animations API para efectos de una vez; rotación de `Group` con pivote para 3D (`AnimationMixer` solo si hubiera clips). Dos wrappers por elemento animado (`position-wrapper` para posición, `feedback-wrapper` para pulso): nunca dos animadores sobre el `transform` del mismo nodo; cancelar la animación anterior antes de iniciar otra sobre la misma propiedad.

| Disparador | Movimiento y duración | Regla |
| --- | --- | --- |
| Entrada de portada | Fondo 180 ms, marca 240 ms, niño 320 ms, menú desde 200 ms con 45 ms entre botones y 220 ms cada uno | Todo es clicable desde que aparece; volver de ajustes no repite. |
| Botón aparece | Opacidad 0 a 1, Y 8 a 0 px, 220 ms | Una vez; cancelar al desmontar. |
| Hover (puntero fino) | Y −2 px, tinte y sombra leve, 120 ms (sale en 100 ms) | No es selección. |
| Presionar | Y +1 px, escala .985, menos sombra, 70 ms | Soltar fuera cancela; teclado activa una vez. |
| Foco | Anillo oscuro + cian, inmediato | Visible, fuera del recorte. |
| Seleccionar | Check y borde persistentes, 140 ms | No gasta. |
| Deshabilitar / procesar | Color y etiqueta, 100 ms | Tamaño estable, sin pulsos infinitos. |
| Abrir diálogo o comparación | Opacidad + Y 12 a 0 px, 220 ms | **Pausa y foco se aplican al abrir**, no al terminar. |
| Cerrar panel | Opacidad + Y 0 a 8 px, 140 ms | Bloquear clic al fondo; devolver foco; `Escape` cancela. |
| Línea de diálogo | Fundido 120 ms | Texto completo inmediato; parpadeo de retrato 100 ms cada 4–7 s. |
| Gasto confirmado | Valor real al instante; delta sube 10 px en 700 ms; relleno 280 ms | Número y `aria-valuenow` reales siempre. |
| Daño por evento | Delta con causa, realce 180 ms, rastro del valor anterior 450 ms | Sin sacudidas ni destellos rojos. |
| Beneficio recibido | Delta positivo 700 ms, check 160 ms, relleno 280 ms | Solo cuando el motor aplica el efecto. |
| Recurso bajo | Icono + texto persistente al cruzar el umbral | Una señal por cruce, no cada tick. |
| Pendiente | Reloj estático + ticks restantes; texto cambia en 120 ms al tick | No gira ni cuenta segundos. |
| Módulo instalando / operativo | Instalando 400 ms; luz o check 240 ms | Siempre reconciliado desde el estado. |
| Fuente / tooltip | Fundido 120 ms | Abre por teclado; restaura foco. |
| Cambiar cámara (`KeyV`) | Interpolación 300 ms sin atravesar paredes | Con movimiento reducido: corte directo. |
| Tormenta / resultado | Alerta 240 ms; sonido según [AUDIO.md](AUDIO.md) | Solo tras evento real del motor. |
| Portada: deriva lejana | Hasta 4 px en 8 s | Se elimina con movimiento reducido. |
| Portada: niño flotando | 6 px en 6 s, giro máximo 1° | Se elimina con movimiento reducido. |

Con `prefers-reduced-motion: reduce` (CSS y JS): sin deriva, giros, desplazamientos de cámara ni escalados; fundidos instantáneos; se conservan cambios de valor, etiquetas y foco. Si la preferencia cambia con una animación activa, se cancela y se fija el estado final. Con `document.hidden`: pausar bucle y audio. Al desmontar: limpiar timers, listeners y animaciones.

## 8. Rendimiento y ciclo de vida

- **Por vista:** menos de 80 draw calls y menos de 80 000 triángulos. `renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5))`, y `1` en calidad baja.
- **Degradación automática:** 3D completo, luego 3D liviano (sin sombras, menos instancias), luego respaldo 2D. Probado en un celular y un PC viejo desde el bloque 1.
- **Luces:** 1 direccional + 1 hemisférica + máximo 1–2 puntuales. Sombras por calidad: completa `mapSize` 1024, liviana 512, baja **sin sombras** (igual que `docs/ORQUESTACION.md` y [MARTE.md](MARTE.md) §5). `castShadow` solo en piezas grandes, nunca en gravilla ni partículas.
- **Cero asignaciones por fotograma:** nada de `new Vector3`, `Matrix4`, geometrías, materiales ni texturas dentro del bucle. Temporales prealojados.
- **Cero reconstrucción por estado:** rotar o escalar pivotes existentes; matrices de `InstancedMesh` solo cuando cambia el mundo. La textura de los ojos de Iris se re-sube solo si cambió.
- `InstancedMesh` para estáticos idénticos (rocas, cajas, balizas, baldosas). No para personajes animados (esos: esqueleto clonado y estado propio, geometría compartida).
- `webglcontextlost` / `restored` manejados; la partida sigue en 2D si no vuelve.
- Un solo canvas para todo; nunca un canvas por objeto.

## 9. Bloques de entrega (alineados con `docs/ORQUESTACION.md`)

Las fases y pistas que ejecutan estos bloques están en [FLUJO.md](FLUJO.md) §4: fase 0 = bloque 0; fase 2 = bloques 1 y 2; fase 3 = bloque 4; el bloque 3 va después de la entrega.

| Bloque | Qué entra | Hasta | Cierra cuando |
| --- | --- | --- | --- |
| **0** | Subir el trabajo local; ruta dorada conectada al motor con lo visual existente: `aterrizar()`, `elegirDilema()`, telemetría con retraso visible, `estado.resultado` + causas + tarjetas con fuente, cuenta / invitado | sáb 14, 22:00 (P2) | Los 8 pasos se juegan de punta a punta en `develop` y el e2e de la ruta dorada pasa. |
| **1** | `materiales.ts`, `liberar.ts`, `cielo.ts` (luz y cielo de Marte), niño astronauta, portada v8 (sin HUD en `inicio`), presupuesto medido y degradación | dom 15, 09:00 | Portada y niño fieles a `inicio/01` y `personajes/08`; medidos en celular y PC viejo. |
| **2** | Terreno de Jezero, kit común (§4), base compacta sobre `LUGARES`, los 5 módulos con presencia correcta, **Iris rover 3D** y **la Ingeniera en 3D** (los dos están en `mundo/01`) | dom 15, 11:00 (P3: se decide 3D o 2D) | Captura de juego comparable con `mundo/01`; solo los 2 módulos construidos se ven construidos. |
| **4** | HUD y CSS v8 completos (tokens, `FacetButton`, `ResourcePlaque`, consulta, comparación, tormenta, final), verificación final | dom 15, 13:00 (congelamiento) | Puerta de aceptación (§10) completa. |
| **3** | 8 estaciones interiores; Doctora y Meteoróloga 3D si no entraron en el bloque 2 | Después del congelamiento, solo si sobra tiempo | Cada ampliación aporta una función y no rompe el recorrido. |

Primer lote de piezas (bloque 2): suelo con rocas, caminos, casco del hábitat, marco y puerta, consola maestra y panel solar. Con eso se comprueba escala, recorrido y familia de materiales. **No empezar por ocho interiores.**

Orden interno de producción para cualquier pieza o escena:
1. Fijar la lámina canónica.
2. Reproducir el encuadre con bloques (misma cámara que la lámina), sin detalle.
3. Congelar medidas y siluetas (ancho de puerta, altura del niño y de las adultas).
4. Una pieza maestra por familia; aprobar contacto con el suelo, grosor y lectura a escala de juego; después instanciar.
5. Materiales y luz en la cámara del juego.
6. UI real con tokens antes de replicar por pantallas.
7. Pivotes, gestos y estados.
8. Conectar interacción y datos; después animar según §7.
9. Expandir desde configuración.
10. Revisión de fidelidad y funcionamiento (§10).

## 10. Puerta de aceptación (cada PR visual)

**Comandos (todos en verde):**

```bash
npm run typecheck
npm test
npm run build
```

Y el e2e de la ruta dorada que corre la CI en cada PR.

**Fidelidad visual:**
- Captura en `http://localhost:5173/` con la misma cámara y proporción que la lámina, puesta al lado de la lámina en el PR.
- Objetivo de trabajo: contornos y posiciones principales dentro del **2 % del lienzo** de la lámina en el mismo encuadre (tolerancia propuesta, no medida conseguida). Texto legible y control funcional mandan sobre glifos imperfectos de la imagen.
- Diferencias anotadas por separado: silueta, layout, material, conducta.
- Revisión contra [DISEÑO.md](DISEÑO.md) §8 (prohibido) y [MARTE.md](MARTE.md) §6.

**Funcionamiento:**
- Teclado completo, foco visible, EN y ES sin cortes, móvil, `prefers-reduced-motion`, respaldo 2D equivalente.
- Cero errores o advertencias de WebGL en consola.
- Draw calls y triángulos medidos (`renderer.info`) y escritos en el PR.
- Los cinco invariantes de [MECANICAS.md](MECANICAS.md) §6 con prueba.
- Atribución NASA visible donde haya datos.

## 11. Trabajo en paralelo

Quién escribe cada archivo, cómo se reparten las pistas (integración de misiones, escenario, interfaz y audio), los contratos entre ellas y el orden de fusión: [FLUJO.md](FLUJO.md). Pruebas conductuales en `ui/src/juego/reductor.test.ts` y `ui/src/escena/escena.test.ts`; no pruebas de "esta caja tiene N hijos".
