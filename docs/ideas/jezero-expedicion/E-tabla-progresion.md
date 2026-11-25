# E. Tabla de progresión de Jezero

**Estado:** propuesta. Las columnas "Motor" describen lo que **hoy** hace el código (árbol `origin/feat/agentes-p04-aviso-tormenta`). Las columnas "Propuesta" describen lo que cambia en la interfaz, **sin tocar reglas**. Los números de la corrida de referencia salen de mi simulación del motor (ver A §6).

**Corrida de referencia:** semilla dorada, sitio `cerca-de-perseverance`, módulos `panel_solar` + `escudo`, dilema "refugio y apagar invernadero". ⚡ energía · 🫁 soporte vital · 🛡️ blindaje · ☢ dosis máxima (mSv).

## 1. Progresión paso a paso

| # | Momento | Fase UI | Evento (qué lo empuja) | Estado del motor | Decisión del niño | Consecuencia | Condición para avanzar |
|---|---|---|---|---|---|---|---|
| 1 | A Llegada | `satelite` | Iris dice el objetivo (**propuesta**) | ⚡70 🫁80 🛡️60, tick 0, Iris `danada` oculta | Mirar el satélite | Ninguna | *Continue* |
| 2 | A (cont.) | `satelite` | 3 consejos de las expertas | `orbita` cambia (batería, señal) | — (hoy no hay decisión; se mantiene) | Ninguna | *Continue* |
| 3 | B1 Sitios | `sitio` | Tarjetas con puntajes de Mars Trek | Sin aterrizar | Elegir 1 de 4 sitios | `aterrizar()`: cobra ya y paga luego (p. ej. perseverance: ⚡−6 🛡️−4 ya; 🫁+3 después) | `aterrizar()` ejecutado |
| 4 | Llegada | `modulos` | "Arriving at Jezero" (2,5 s) | Igual | — | — | Fin del temporizador o *Skip* |
| 5 | B2 Paseo | `modulos` | Tarjeta "Your crew is ready" | Igual, reloj **parado** | Explorar o abrir controles | — | *Explore the base* |
| 6 | **C Módulos** | `modulos` | **(propuesta) alerta de la Meteoróloga al empezar** | `tormenta` ya en el estado desde tick 0 | Colocar 2 de 5 | Cada módulo: ⚡−6 🫁−3 ya; panel ⚡+14 con retraso; escudo 🛡️+14 ⚡−3 con retraso | 2 módulos colocados (`puedeColocar`) |
| 7 | **D Círculo** | `base` **(propuesta: parada)** | Meteoróloga, Doctora, Ingeniera y lectura cierta de Iris | Reloj parado; dosímetro visible; ☢0 | Hablar; mirar el dosímetro; arrancar el reloj | Ninguna | "Start the clock" |
| 8 | Turnos 1–2 | `base` | Beneficios retrasados llegan | Efectos pendientes de módulos entran | Explorar | Panel +14 ⚡; escudo +14 🛡️ | Tick 3 |
| 9 | **E Tormenta (tick 3)** | `tormenta` | `novedades().tormentaLlego` → pausa | Ventana 3–5; ☢ sube ≈1,4/turno sin protección (🛡️57) | Elegir experta → comparar → verificar → confirmar | Ver sección 2 | Opción confirmada |
| 10 | E (reveal) | `tormenta` | Iris falla: lectura falsa de blindaje (+20) | Iris `danada` visible | Comparar con el medidor; preguntar a la Ingeniera; reparar (⚡−10 🫁−4) o ignorar | Reparar → Iris `pistas`, causa `ia.reparada` | Ninguna (opcional) |
| 11 | E → base | `base` | "Decision recorded" → *Return to exploration* | Ticks 4–5 con la opción activa | Seguir; enviar telemetría | Telemetría: ⚡−5 🫁−1 ya; llega en 2 turnos | Telemetría enviada |
| 12 | Espera | `base` | `telemetriaPendiente()` | Tick 4–6 | Esperar o actuar | — | Turno de llegada |
| 13 | **F Final** | `final` | Telemetría llegó **y** tormenta terminó | `resultado` = `exito` / `fallo` | — | `resumenPartida()` | — |

## 2. Qué pasa en la tormenta según la opción (medido en el motor)

Corrida de referencia (refugio): `t3 ⚡49 🫁71 🛡️57 ☢1,38 → t4 ⚡33 🫁62 🛡️46 ☢1,79 → t5 ⚡25 🫁60 🛡️53 ☢2,18 → t6 ⚡22 🫁58 🛡️52 ☢2,25 → éxito`.
Corrida de aguantar: `t3 ☢1,38 → t4 ☢2,75 → t5 ⚡26 🫁64 🛡️43 ☢4,17 → fallo` (supera 4).

| Opción | Costo inmediato (diseño) | Beneficio | Cuándo pierde | Qué aprende el niño |
|---|---|---|---|---|
| Refugio (+ apagar invernadero si lo tiene) | 🫁−6 ⚡−3 (+🫁−10 con invernadero) | 🛡️+12 con retraso; dosis ×0,3 durante 2 turnos | No perdió en 4 de 4 pares probados | Proteger a la gente baja la dosis; apagar lo que cuida las plantas cuesta comida mañana |
| Subir escudo nivel 2 | ⚡−16 | 🛡️+20 con retraso; dosis −50 % durante 2 turnos | Si no hay energía (sin panel): ⚡ llega a 0 | La protección cuesta energía; la preparación abre o cierra la opción |
| Aguantar | ⚡−2 🫁−2 | 🛡️+2 | Pasa de 4 mSv (turno 5) en las 4 combinaciones | No hacer nada también es una decisión, y cara |

> **Aviso de diseño:** el refugio ganó en todas mis corridas. Antes de declarar que el dilema es genuino hace falta el barrido completo (10 parejas × 4 sitios × 3 opciones). No toco números; lo señalo para Camilo y Codex (ver G, entrega 0).

## 3. Estados, victoria, derrota y recuperación

| Condición | Cómo se evalúa (`avanzarTick`) | Qué ve el niño | Recuperación |
|---|---|---|---|
| **Victoria** | Telemetría **ya llegó** y la tormenta **terminó** (`telemetria_tras_tormenta`), sin recurso en 0 ni dosis > 4 | "Mission complete!" + causas + ciencia | Jugar otra misión |
| **Derrota: recurso en 0** | Cualquier medidor ≤ 0 (manda sobre todo) | Causa exacta (`causa.recurso_agotado.*`, solo en `798cd95`) + pista de reintento (**propuesta**) | *Play again*: misma semilla |
| **Derrota: dosis** | `dosisMaximaTripulacion > 4` | `causa.limite_radiacion` + dosímetro en rojo (**propuesta**) | idem |
| **Derrota: plazo** | `tick ≥ 10` sin objetivo | `causa.plazo_agotado` | idem |
| **Recuperación dentro de la partida** | Reparar a Iris, limpiar paneles, esperar | Los medidores mejoran con retraso | Posible hasta el turno 10 |

**Pasivo:** el jugador que no decide **pierde** (verificado). Es intencional (P0.3) y se explica con la causa y la pista.

## 4. Qué enseña la tabla (coherencia con el diseño)

- **Ningún paso es arbitrario:** el 3 existe porque el sitio cambia el punto de partida; el 6 existe porque va a venir una tormenta; el 7 existe para que la tormenta no sorprenda; el 9 es la consecuencia de los anteriores; el 10 es la lección de verificar.
- **Tensión creciente:** 1–5 calma y curiosidad → 6–7 preparación con sentido de urgencia → 9–10 tensión máxima → 11–12 espera con ansiedad → 13 alivio o reflexión.
- **Momentos de descanso reales:** el paseo (5), la espera de la Tierra (12) y el final (13).
