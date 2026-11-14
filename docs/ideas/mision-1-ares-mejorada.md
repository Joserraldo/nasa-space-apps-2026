# Misión 1 mejorada: Jezero, a partir del prototipo ARES de Camilo

**Rol que propone:** agentes (José) · **Dueños de la misión:** diseño (Santiago y Camilo) · **Estado:** propuesta · **Fecha:** 2026-11-14
**Base:** [CamiloM21/ares-mission-trainer](https://github.com/CamiloM21/ares-mission-trainer) (MIT). Cuando lo escribimos todavía no conocíamos el dataset ni el juego final.
**Destino:** `missions/src/jezero.ts` + `design/src/recursos.ts` (issue #56). Este documento no toca esas carpetas: allí lo implementa diseño.

## 1. Qué tiene ARES y qué hacemos con eso

| ARES (prototipo) | Qué se rescata | Qué cambia en Solar Shield |
|---|---|---|
| 6 tareas en orden: limpiar paneles → hielo → oxígeno → cultivar → blindaje de regolito → simulacro | El orden tiene lógica de ingeniería: primero energía, luego agua, aire, comida y protección | Se comprime en los **8 pasos de la ruta dorada** (#41). Las tareas pasan a ser módulos con costo y se eligen 2 |
| Energía compartida como cuello de botella (`balance()`: polvo, limpieza, capacidad) | Todo compite por la electricidad | ⚡ Energía sigue siendo el recurso central. El **polvo en los paneles** pasa a ser un evento de mala suerte |
| 4 medidores (O2, agua, alimento, batería), traje aparte, radiación 0-100 | Costos cruzados: el hielo gasta batería, el oxígeno gasta agua y batería | Solo **3 medidores** (PLAN §2.1): O2, agua y comida se juntan en 🫁 soporte vital. No hay traje como medidor |
| Simulacro: 15 s estables con refugio + escudo + oxígeno ON + invernadero OFF | **El mejor dilema de ARES:** apagar el invernadero para aguantar la tormenta | Lo reemplaza la **tormenta real del 20 may 2024** (paso 5). La receta no aparece en un texto de ayuda: la discuten los expertos (paso 6) |
| Quiz de 3 opciones que nunca bloquea, +XP una vez, siempre explica | Aprender sin castigo | Se convierte en la **tarjeta de ciencia** del paso 8 y en la pregunta de Iris en el nivel 2 (pistas) |
| Dato pegado a cada misión ("no crea recursos de la nada") | Cada acción enseña algo | Cada módulo tiene su `cienciaKey` con fuente (rol datos) |
| Gravedad 3.73 / 1.62 m/s² e irradiancia 586 / 1361 W/m² (NSSDCA) | Son las únicas cifras reales de ARES | Se citan en la tarjeta de fuente del sitio. Todo lo demás se declara "valor de juego" |
| `model.js` puro, serializable, con tests de secuencia completa | Arquitectura | Ya lo hacemos así (`engine/` + `missions/` como datos) |
| 10 modelos `.glb` MIT (hábitat, paneles, invernadero, rover…) | Arte gratis y con licencia | Opcional para ui (`assets/`), con atribución. La decisión de 2D/3D es de ui (D6) |

**Lo que no se rescata:** textos quemados en español (aquí el inglés es la base y todo pasa por i18n), mundo 3D para caminar (demasiado para 48 h y para niños de 7 años), 14 atajos de teclado, palabras como "electrólisis" y "regolito" sin explicar, y las tareas gratis (limpiar paneles daba +7 sin costo).

## 2. La misión, paso a paso (8 pasos, ~2-3 min)

Recursos en escala 0-100 (`design/src/recursos.ts`). Jezero arranca con ⚡70 🫁80 🛡️60.

| Paso | Qué pasa | Decisión del niño (con costo) | Quién habla | Lo que viene de ARES |
|---|---|---|---|---|
| 1 | La nave suelta el satélite | — | Iris (nivel 1) presenta a la tripulación | — |
| 2 | Dibuja la ruta sobre Jezero | Ruta corta (menos señal) o larga (más batería) | Meteoróloga | — |
| 3 | 3 sitios candidatos, cada uno con 3 criterios: **luz**, **hielo cerca**, **terreno plano** | Ninguno gana en los tres | Ingeniera (luz), Doctora (refugio natural), Meteoróloga (polvo) | El hielo de ARES pasa a ser un criterio del sitio |
| 4 | Aterriza y elige **2 de 5 módulos** | Ver tabla §3; cada uno mueve 2 medidores | Ingeniera recomienda panel; Doctora, escudo | Las tareas 1-5 de ARES son los módulos |
| 4b | *Mala suerte (30 %):* polvo en los paneles, la energía rinde la mitad | **Limpiar** (salida exterior: cuesta 🛡️ y 🫁) o aguantar | Ingeniera | La tarea "limpiar paneles", ahora con costo |
| 5 | Llega la tormenta real del 20 may 2024 → pausa + tarjeta de fuente | — | Meteoróloga lee el evento de DONKI | Reemplaza el simulacro |
| 6 | **Dilema del refugio**: Doctora: "¡todos al refugio y apaguen el invernadero!"; Ingeniera: "si apagamos el invernadero perdemos la comida de mañana". Iris (dañada) da un número que no coincide con el medidor | Refugiarse + apagar invernadero / subir escudo (mucha ⚡) / aguantar | Doctora vs Ingeniera; Iris equivocada | El simulacro de ARES, ahora como trade-off real y sin receta |
| 7 | Verifica con un experto y envía telemetría; la respuesta tarda 2 ticks (Marte–Tierra 3–22 min reales, #66) | Enviar ahora (cuesta ⚡) o esperar | Control de Misión (con retraso) | La antena de ARES |
| 8 | Cadena de causas (decisión vs. mala suerte) + 1 tarjeta de ciencia con 3 opciones que nunca bloquea | — | Iris resume | El quiz de ARES |

**Fin:** gana si llega al paso 8 con los 3 medidores > 0. Si algo llega a 0 no hay "Game Over": se llama **rescate de entrenamiento** (idea de ARES), se muestra la cadena de causas y se reintenta el día.

## 3. Tabla de módulos propuesta (para que diseño ajuste)

Montar cualquier módulo cuesta lo de `COSTOS_ACCION.colocar_modulo` (⚡-6 🫁-3). El beneficio llega con retraso (1-2 ticks).

| Módulo (`Equipment`) | Beneficio | Costo extra por tick | Equivalente ARES | Lección |
|---|---|---|---|---|
| `panel_solar` | ⚡ +14 | rinde la mitad con polvo o con tormenta | Ampliación solar | En Marte llega menos luz que a la Tierra (586 vs 1361 W/m², NSSDCA) |
| `reciclador_agua` | 🫁 +12 | ⚡ -2 | Hielo + reciclador | El agua se recicla, no aparece de la nada |
| `invernadero` | 🫁 +10 | ⚡ -2; en el paso 6 se apaga o se protege | Cultivar | Las plantas necesitan luz y agua |
| `escudo` | 🛡️ +14 | ⚡ -3 | Blindaje de regolito | La tierra de Marte bloquea radiación |
| `antena` | 🛡️ +4 🫁 +3 (aviso temprano) | ⚡ -1 | Antena | Los mensajes a la Tierra tardan minutos |

Prueba que diseño debe pasar: con 2 módulos **ninguna pareja gana sin perder algo** en la tormenta del paso 5 (simular las 10 parejas con la semilla dorada; con Jaime).

## 4. Qué le toca a cada rol

- **diseño (Santiago, Camilo):** pasar §2 y §3 a `missions/src/jezero.ts` (sitios con 3 criterios, `eventoPolvo`, `dilemaPaso6`) y a `design/src/recursos.ts`; textos `en`/`es` de la cadena de causas y de las tarjetas de ciencia; cerrar #77 (cuánto es poco, medio y mucho).
- **motor (Jaime):** leer los nuevos campos de la misión; evento de polvo (multiplica el rendimiento de `panel_solar`); acción "apagar invernadero" si diseño la pide (es un cambio de contrato: issue `contrato`).
- **agentes (José):** líneas de los expertos para el paso 3 (criterios), el polvo (4b) y el dilema del refugio (6); pregunta de Iris nivel 2 basada en los quizzes de ARES; todo con fuente.
- **datos (Daniel):** tarjeta de fuente de las constantes NSSDCA (gravedad, irradiancia) y de la tormenta (#61).
- **ui (María Paula):** decidir si reutiliza los `.glb` de ARES (licencia MIT, con atribución) o se queda en 2D.

## 5. Riesgos

- Agregar "apagar invernadero" cambia `Action` en `contracts/`. Si no se aprueba a tiempo, el paso 6 usa `refugiarse` y el invernadero se apaga como efecto dentro de esa acción, definido en la tabla.
- 2-3 minutos de demo: el paso 4b solo sale en semillas no doradas; la semilla dorada no lo incluye, para que el video sea estable.
