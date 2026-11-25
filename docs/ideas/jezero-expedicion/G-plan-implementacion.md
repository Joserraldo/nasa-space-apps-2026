# G. Plan de implementación

**Estado:** propuesta. **No se ejecuta nada hasta que Santiago apruebe** (CLAUDE.md fase 1; brief §11). Entregas pequeñas (< ~300 líneas cada una), verificables, cada una útil por sí sola y reversible.

**Reglas que aplican a todas:** ramas `feat/<slug>-<tema>`; las de frontend v8 salen de `feat/ui-escenarios` y van hacia esa rama (excepción de CLAUDE.md); commits en español sin atribución a IA; sin merge ni push a `develop`/`main`; cada PR con captura si cambia algo visible (skill `solar-shield-pr-visual`); verificación con `solar-shield-qa` antes de abrir el PR. Quién implementa: lo decide Santiago; yo diseño y audito. DeepSeek puede revisar las propuestas y escribir pruebas mecánicas e i18n repetitivo (CLAUDE.local.md); Codex valida con Playwright (entrega 8).

## Entrega 0 — Decisiones y base (sin código)
- **Objetivo:** que nada se construya sobre arena.
- **Alcance:** (a) decisiones D1–D6 del README; (b) fusionar la pila P0 (#443–#450 y QA-445) a donde corresponda; (c) barrido de equilibrio del dilema (10 parejas × 4 sitios × 3 opciones) con el motor de la pila.
- **Archivos:** ninguno propio. El barrido es una prueba descartable (yo ya corrí una versión pequeña: A §6).
- **Dependencias:** decisión de Santiago sobre el orden de fusión.
- **Pruebas:** el barrido reporta qué opciones ganan por combinación. 
- **Criterio de aceptación:** una tabla firmada por Camilo y Santiago que diga "ninguna opción gana siempre" o "el refugio gana siempre; ajustar así…". **Si gana siempre, el Momento E necesita revisión de equilibrio antes de la entrega 5.**
- **Riesgo:** descubrir que el dilema no es genuino.

## Entrega 1 — Arreglos de lo ya existente (los más baratos y seguros)
- **Objetivo:** quitar spoilers y piezas muertas.
- **Alcance:** C3 (el panel Crew no revela la avería de Iris antes de tiempo). Verificar con Codex los otros dos supuestos del diagnóstico (Crew oculto; dosis invisible).
- **Archivos:** `ui/src/pantallas/PantallaBase.tsx` (una línea), `ui/src/pantallas/lugares.ts` si hace falta; prueba en `ui/`.
- **Dependencias:** ninguna. Paula debe estar de acuerdo.
- **Pruebas:** vitest de componente: antes del paso de revelación, el panel no dice "damaged"; después, sí. E2E de Codex.
- **Aceptación:** captura antes/después; la ruta dorada sigue pasando.
- **Riesgo:** casi nulo; la ruta dorada e2e verifica "Iris is damaged" en su paso, hay que mantener ese texto **después** de la revelación.

## Entrega 2 — Momento D: el círculo de la tripulación (la entrega clave)
- **Objetivo:** que la tormenta tenga preparación narrativa y el niño decida cuándo empieza el reloj.
- **Alcance:** C1 (alerta de la Meteoróloga al empezar el paso 4), C2 (la fase `base` empieza en pausa hasta "Start the clock"), C5 (insistencia única de Iris). Las líneas D1–D3, D10–D11 y A1–A3 (N2 parcial).
- **Archivos:** `ui/src/juego/reductor.ts`, `ui/src/App.tsx`, `ui/src/pantallas/PantallaModulos.tsx`, `agents/src/conversar.ts` (solo lectura/uso), `agents/i18n/en.json` y `es.json`. Prueba en `ui/src/juego/reductor.test.ts`.
- **Dependencias:** entrega 0 (pila P0 fusionada, para que `pronostico.viene` exista); aprobación de Paula (toca el orden de las fases).
- **Pruebas:** reductor: entrar a `base` deja `pausado: true`; "Start the clock" lo pone en `false`; el estado del motor no cambia. Agentes: el aviso sale una sola vez, con `prioridad: "alerta"` y fuente.
- **Aceptación:** con Playwright, la tormenta llega después de ≥ N segundos de juego real (se fija con Codex; meta de diseño: el niño tiene ~60–90 s para preparar). La ruta dorada se actualiza para pulsar "Start the clock".
- **Riesgo:** la ruta dorada e2e hoy asume que el reloj corre solo (`page.clock`); hay que actualizarla. Riesgo de que el niño no encuentre el botón: el HUD ya tiene la píldora de pausa/reanudar y el patrón "Start the clock" existe en `ui.paso.4.listo`.

## Entrega 3 — Iris gana la confianza antes de fallar
- **Objetivo:** que la avería enseñe en vez de sorprender.
- **Alcance:** C4 (lectura cierta de Iris antes de la revelación), líneas D9 y E12. La falla y la verificación (P0.5) no se tocan.
- **Archivos:** `agents/src/iris.ts` (`lecturaIris` o una función hermana), `agents/src/conversar.ts`, `agents/i18n/*`. Pruebas en `agents/src/iris-mision.test.ts`.
- **Dependencias:** entrega 0.
- **Pruebas:** con `averiaRevelada=false`, Iris da la lectura cierta (valor = medidor); con `true`, la falsa (error 20). Determinista, sin azar.
- **Aceptación:** la lectura cierta nunca cambia el estado del juego ni propone acciones.
- **Riesgo:** que Iris suene a "robot de lecturas" aburrido. Mitigación: una sola línea, en D9, con su voz.

## Entrega 4 — Dosímetro
- **Objetivo:** que la regla de radiación sea visible antes de perder (criterio 8).
- **Alcance:** N1 (componente), presentación por la Doctora (D5–D7, E11), tarjeta de ciencia aparte si datos aporta fuente.
- **Archivos:** `ui/src/componentes/` (componente nuevo), `ui/src/componentes/HudBase.tsx` (progreso), `ui/i18n/*`, `agents/i18n/*`.
- **Dependencias:** entrega 2 (el dosímetro entra en el círculo); aprobación explícita de Santiago (D1); Paula define la forma visual.
- **Pruebas:** componente: muestra dosis y límite; cambia a "peligro" por encima de un umbral de **presentación** (no regla); `aria-live` educado.
- **Aceptación:** captura en 4 tamaños; valor siempre en texto; no se agrega ningún número que no salga del motor.
- **Riesgo:** añadir una cuarta "barra" confunde a los de 7 años. Mitigación: aparece **solo** cuando la Doctora lo presenta y solo en Jezero la primera vez; si Paula prefiere, empieza como un icono ☢ con número.

## Entrega 5 — Tormenta con dosis visible
- **Objetivo:** que la decisión de E se vea reflejada en el dosímetro.
- **Alcance:** que el panel de comparar plan y "Decision recorded" muestren el cambio de dosis esperado/real; líneas E11.
- **Archivos:** `ui/src/pantallas/PantallaTormenta.tsx`, `DecisionRegistrada.tsx`.
- **Dependencias:** entregas 0 y 4. **Y** el resultado del barrido de la entrega 0.
- **Pruebas:** que `DecisionRegistrada` muestre dosis antes/después con el estado real.
- **Aceptación:** el niño puede ver que el refugio bajó el ritmo de dosis.
- **Riesgo:** un "¿y si…?" implícito sin Matemático: no se muestra dosis futura estimada; solo la real. Evitar prometer lo que el motor no calcula en vivo.

## Entrega 6 — Final con pista de reintento
- **Objetivo:** que la derrota enseñe y el reintento sea concreto.
- **Alcance:** N3 (`pistaDeReintento`), F1–F10 y pintarla en `PantallaFinal`.
- **Archivos:** `agents/src/` (función nueva y prueba), `agents/i18n/*`, `ui/src/pantallas/PantallaFinal.tsx`.
- **Dependencias:** `causaTerminal` (QA-445) fusionada.
- **Pruebas:** una prueba por causa terminal → clave esperada; si no hay causa, `null`.
- **Aceptación:** cada derrota muestra la causa y exactamente una pista; la victoria muestra el cierre por decisión.
- **Riesgo:** pista que parezca regaño. Mitigación: tono del guion F (rescate de entrenamiento).

## Entrega 7 — Guion completo y español
- **Objetivo:** cerrar todas las líneas de C en inglés y luego en español.
- **Alcance:** i18n de las claves nuevas; revisión de paridad EN/ES; revisión de nivel de lectura (7–12).
- **Archivos:** `agents/i18n/*`, `ui/i18n/*`.
- **Dependencias:** inglés aprobado por Santiago.
- **Pruebas:** pruebas de paridad ya existentes; DeepSeek puede revisar longitud y vocabulario.
- **Aceptación:** ninguna cadena visible fuera de i18n; cada línea de capa 1 ≤ 12 palabras (se mide con un script).
- **Riesgo:** traducir antes de aprobar el contenido (se evita por orden de entregas).

## Entrega 8 — QA completo con Playwright
- **Objetivo:** validar de principio a fin los seis perfiles de H.
- **Alcance:** Codex implementa los escenarios de H sobre la ruta nueva.
- **Archivos:** `tests/e2e/*`.
- **Dependencias:** entregas 1–6.
- **Aceptación:** los 6 escenarios pasan en inglés, en español y sin WebGL.

## Orden y dependencias

```
0 ──► 1
0 ──► 2 ──► 4 ──► 5
0 ──► 3 ───────────┤
0 ──► 6 ───────────┤
          7 ◄──────┘ ──► 8
```
Las entregas 1, 3 y 6 son independientes entre sí y pueden ir en paralelo. La 2 es la que cambia la experiencia; las demás la completan.

## Lo que no está en este plan
Matemático en Jezero, "dibujar ruta", evento de polvo en la semilla dorada, cambios de balance, campaña con desbloqueos. Cada uno requiere una decisión de Santiago (README).
