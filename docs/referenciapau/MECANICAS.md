# MECANICAS: jugabilidad y cómo la UI la representa

**Qué es:** qué hace el jugador, qué responde el juego y qué tiene que mostrar la UI en cada momento. **Quién decide las reglas:** `engine/` (Jaime), `design/` y `missions/` (Camilo), `agents/` (José), `data/` (Daniel). Este documento **describe** esas reglas para construir la pantalla; no las cambia. Si algo de aquí choca con el código de esos roles, manda el código y se avisa con un issue.

Fuentes leídas en `origin/develop` (`c8c7247`, 14 nov 2026): `contracts/src/`, `engine/src/acciones.ts`, `engine/src/dilema.ts`, `engine/src/dorada.ts`, `design/src/recursos.ts`, `missions/src/jezero.ts`, `agents/src/index.ts`. Las cifras citadas son de juego (no de NASA) y **la UI las lee del motor y de diseño, nunca las copia**.

---

## 1. El juego en un párrafo

El niño es un astronauta junior entrenando en una base en el cráter Jezero. Administra **tres recursos** que compiten entre sí (energía, soporte vital, blindaje), consulta a tres **expertas humanas** y a **Iris** (la IA de la base), y toma decisiones que **cuestan ahora y rinden después**. Llega una **tormenta solar real**, Iris se daña y da un número falso, y el niño tiene que verificar antes de decidir. Gana si la telemetría llega a la Tierra con la base viva; pierde si un recurso llega a cero. Al final ve la **cadena de causas**: qué fue decisión suya y qué fue mala suerte.

## 2. Recursos

| Recurso | Clave | Icono | Inicio en Jezero |
| --- | --- | --- | --- |
| Energía | `energia` | Rayo | 70 |
| Soporte vital | `soporte_vital` | Pulmones / hoja | 80 |
| Blindaje | `blindaje` | Escudo | 60 |

- Escala de 0 a 100 (`RECURSO_MAX`). Consumo pasivo en Jezero por tick: energía −3, soporte vital −2, blindaje −1.
- **Regla de oro de diseño:** toda acción mueve al menos dos medidores, uno para bien y otro para mal. Ninguna es gratis.
- La comida está **dentro** de soporte vital (simplificación educativa; el invernadero no simula cosechas).
- No existe barra de salud del niño. Si el diseño la aprobara algún día, requiere contrato antes que UI.

## 3. Misión 1: Jezero en 8 pasos (`MISION_JEZERO`)

| Paso | Meta | Qué hace el niño | Qué responde el juego | Fase UI | Escena |
| --- | --- | --- | --- | --- | --- |
| 1 | `satelite_suelto` | Suelta el satélite desde la nave | Aparece `GameState.orbita` (altura, franja, batería, señal, escudo) | `satelite` | E3 |
| 2 | `ruta_dibujada` | Traza la ruta sobre Jezero | Bajan batería y señal de la órbita | `satelite` | E3 |
| 3 | `sitio_elegido` | Compara 4 sitios y elige uno | `aterrizar(estado, sitioId)` aplica el costo inmediato y deja el beneficio pendiente | `sitio` | E4 |
| 4 | `modulos_colocados` | Coloca **2 de 5** módulos viendo costo y beneficio | `colocar_modulo`: cuesta energía −6 y soporte vital −3; el aporte del módulo llega después | `modulos` | E5 |
| 5 | `tormenta_llega` | Ve la alerta y la tarjeta de fuente | Tormenta real (`2024-05-20-marte`), revelada en el tick 3, hace daño durante 3 ticks; pausa automática | `tormenta` | E7 |
| 6 | `consejo_opuesto` | Escucha consejos opuestos, nota que Iris miente, verifica, elige | `elegirDilema(estado, opcionId)` | `tormenta` | E7 |
| 7 | `telemetria_enviada` | Envía telemetría a la Tierra | Cuesta ahora; la respuesta llega con retraso (2 ticks en Jezero), visible con `telemetriaPendiente(estado)` | `base` | E6 |
| 8 | `fin` | Lee el resultado | `estado.resultado` = `exito` (llegó la telemetría) o `fallo` (recurso en cero); `resumenPartida(estado)` para la cadena de causas; tarjetas de ciencia y pregunta final desde `MISION_JEZERO` | `final` | E8 |

Límite de la misión: tick 10. Semilla de demo fija: `SEMILLA_DORADA = "jezero-2024-05-20"` (`partidaDorada()`).

### 3.1 Los cuatro sitios (paso 3)

Ningún sitio es gratis ni domina a los demás:

| Sitio | Ventaja | Desventaja |
| --- | --- | --- |
| `llanura-central` | Aterrizaje más barato | A campo abierto: pierde blindaje |
| `cerca-de-perseverance` | El rover hace de relevo (soporte vital después) | Término medio en costos |
| `pie-de-la-pared-sur` | Las paredes protegen (blindaje después) | Aterrizaje caro en energía |
| `sobre-el-borde-oeste` | Sol sin sombras (energía después) | El más caro de alcanzar |

### 3.2 Los cinco módulos (paso 4)

`panel_solar`, `reciclador_agua`, `escudo`, `invernadero`, `antena`. Se colocan exactamente 2 y sin repetir (`puedeColocar`, `puedeAplicar`). Cada uno aporta a un recurso y consume energía (tabla `MODULOS` de diseño). **La UI muestra el costo y el beneficio leídos de `costoDe` y `MODULOS` antes de confirmar.**

Cuidado de representación: `estado.equipos[id] === "ok"` **no** prueba que el niño construyó ese módulo (la partida arranca con varios equipos en `ok`). Para saber qué se construyó se usa `modulosColocados(estado)`.

### 3.3 El dilema del paso 6

| Opción | Acción | Quién la defiende | Detalle |
| --- | --- | --- | --- |
| `refugio_y_apagar_invernadero` | `refugiarse` | Doctora | Si se construyó el invernadero, además pierde soporte vital después (se apaga). |
| `subir_escudo` | `subir_escudo` nivel 2 | Ingeniera | Gasta energía ahora, blindaje después. |
| `aguantar` | `esperar` | Nadie | Cuesta poco, protege poco. |

No hay opción segura y gratuita. Las expertas expresan prioridades distintas; la UI las contrasta sin urgencia artificial de lectura.

### 3.4 Iris dañada (paso 6)

Iris (`ia_base`) acompaña desde el inicio en modo `tutorial` y va soltando ayuda (`pistas`) según el rendimiento del niño. En el paso 6 se revela su avería: **lee mal el blindaje por 20 puntos** y recomienda algo equivocado. El medidor del HUD muestra el valor real; el niño detecta la diferencia y la verifica con la Ingeniera (`verificarIris` de `agents/`), que es quien la repara. Desde ahí la misión depende de las decisiones del niño, no de obedecer a la IA.

### 3.5 Mala suerte

En cada tick el motor puede sortear un evento (micrometeorito, fallo de panel, fuga de agua, tormenta de polvo) según la dificultad. Se registra con origen `mala_suerte` y en el final se separa de las decisiones.

## 4. El ciclo de cada decisión

Las cuatro tarjetas de [`personajes/07-tripulacion-mecanicas.png`](referencias/personajes/07-tripulacion-mecanicas.png) son el ciclo completo:

1. **Choose who to ask:** retratos de las tres expertas (seleccionar solo consulta), campo `Ask your crew...`, voz opcional, accesos rápidos por recurso.
2. **Compare a plan:** la experta propone; `Costs now` y `Later` en bloques separados; `Place panel` (confirma) y `Back` (cancela sin gasto); `Ask another expert` conserva la propuesta.
3. **Verify the warning:** tarjeta de fuente (`Archived solar event`, `View source`), preguntas guiadas.
4. **Your decision counts:** `Action confirmed`, `Cost applied`, `Benefit pending`, `Return to exploration`, `You chose the plan`.

Secuencia obligatoria en código:

```text
explorar -> inspeccionar -> consultar -> comparar -> verificar fuente (opcional) -> confirmar
  -> el motor valida y aplica UNA vez -> nuevo GameState con causa
    -> el HUD muestra el valor real al instante
    -> el adaptador visual emite gasto / daño / beneficio una sola vez por tick
      -> escena y UI animan
```

Detalles que no se pueden romper:
- Abrir una consulta conserva la pausa previa; el foco entra al panel y vuelve al origen al cerrar.
- `Continue` y pulsar un retrato **nunca** cobran.
- `Place panel` valida contra el estado vigente: si el motor rechaza (`puedeAplicar` da el motivo), se explica y se puede elegir otra cosa.
- `Back` antes de confirmar no cambia nada; después de confirmar no es un deshacer gratis.
- "Panel instalado, beneficio pendiente" solo se muestra si la acción fue aceptada. Terminar una animación no es haber recibido el beneficio.
- El rótulo genérico `Later` se reemplaza por el plazo real cuando el motor lo informa.

Casos extra: fuente no disponible muestra procedencia local y aviso; voz denegada vuelve a texto; clasificador incierto vuelve a preguntar; si el modelo cae, quedan los botones; si se pierde WebGL, la misma partida sigue en el respaldo 2D.

## 5. El motor manda: qué puede y qué no puede hacer la escena

| La escena / UI puede | La escena / UI no puede |
| --- | --- |
| Leer `GameState` y derivar presencia, instalación y estado visual (`escena/vista.ts`). | Calcular costos, deltas, ticks, victoria o daño. |
| Llamar funciones públicas de `engine/`, `missions/` y `agents/`. | Crear tablas de costos o reglas propias. |
| Animar después de que el motor aplicó un cambio. | Dar o quitar recursos al terminar una animación, al caminar o al entrar a una malla. |
| Mostrar "pendiente" con los ticks restantes reales. | Inventar cuentas regresivas por segundos o porcentajes. |
| Agrupar varios cambios del mismo tick en un resumen legible. | Repetir el feedback al volver a renderizar o al cargar un guardado. |

Ejemplos concretos: entrar al refugio caminando **no** blinda (la protección es la acción `refugiarse`); sentarse en el comedor **no** recupera soporte vital; el panel que gira **no** genera energía; la antena que gira **no** adelanta la respuesta.

## 6. Cinco invariantes (pruebas obligatorias)

1. Doble clic, o tecla más botón, nunca cobra ni construye dos veces.
2. Dos módulos elegidos sin antena ni escudo no inventan bloqueos: la telemetría y refugiarse siguen disponibles.
3. Abrir y cerrar una consulta durante pausa o tormenta conserva la pausa previa y devuelve el foco.
4. Cambiar de cámara (`KeyV`) o perder WebGL conserva el mismo `GameState` y ofrece la alternativa accesible sin reiniciar.
5. Efecto y daño en el mismo tick muestran el saldo real y causas separadas, sin repetir feedback al renderizar o cargar.

## 7. Qué llama la UI (resumen)

| Momento | Función | Paquete |
| --- | --- | --- |
| Partida de demo | `partidaDorada()` | engine |
| Avanzar el reloj | `avanzarTick(estado)` / `paso(estado, accion?)` | engine |
| Pausa | `pausar(estado, bool)`, `conPausaAutomatica(antes, despues)` | engine |
| Qué cambió entre ticks | `novedades(antes, despues)` | engine |
| Aterrizar (paso 3) | `aterrizar(estado, sitioId)` | engine |
| Costo de una acción | `costoDe(accion)` | engine |
| ¿Se puede? | `puedeAplicar(estado, accion)`, `puedeColocar(estado, modulo)` | engine |
| Aplicar acción | `aplicarAccion(estado, accion)` | engine |
| Módulos construidos | `modulosColocados(estado)` | engine |
| Tormenta activa | `tormentaActiva(estado)` | engine |
| Dilema (paso 6) | `elegirDilema(estado, opcionId)` | engine |
| Telemetría pendiente | `telemetriaPendiente(estado)` | engine |
| Final | `resumenPartida(estado)` | engine |
| Datos de la misión | `MISION_JEZERO`, `TEXTOS_JEZERO` | missions |
| Conversar / consejos | `conversar`, `responder`, `consejosSatelite`, `consejosAterrizaje`, `escenaTormenta` | agents |
| Iris | `irisDanada`, `verificarIris`, `guiaIris`, `preguntaIris` | agents |
| ¿Y si...? (Matemático) | `queEsSi` (engine), `queSiMatematico`, `compararOpciones` (agents) | engine / agents |

Detalle de qué pantalla llama qué: guía del rol agentes (PR #119 en `develop`).

## 8. Ciencia que la UI debe respetar

1. Separar **evento observado**, **predicción** (ENLIL), **medición** y **regla de juego**. Ninguna cifra del balance se etiqueta "según NASA".
2. La dosis de tormenta usada (RAD/Curiosity, mayo 2024) se midió en el cráter **Gale**; el juego la usa como referencia en un entrenamiento en Jezero. No se afirma medición en Jezero.
3. El índice `Kp` es terrestre: no es dosis en Marte. No mezclar Gy y Sv sin fuente del rol datos.
4. El invernadero es una simplificación: comida dentro de soporte vital y su costo eléctrico.
5. El blindaje del juego es una regla educativa, no una dosis humana validada.
6. Siempre visible: fuente, fecha de consulta, "datos reales, no en vivo" y "proyecto no oficial, no avalado por NASA" (`ui.aviso.nasa`, `<TarjetaFuente />`).
