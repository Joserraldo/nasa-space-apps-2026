# H. Plan de QA para Codex (Playwright)

**Estado:** propuesta. Codex valida **después** de que se implemente; no participa en la implementación (brief §8).
**Qué se verifica:** que la experiencia enseñe, no solo que "pase". Cada escenario dice **qué hace el perfil, qué debe ocurrir y qué se registra**.

## 0. Reglas comunes
- Idiomas: inglés (base), español y sin WebGL (respaldo 2D). Semilla dorada `jezero-2024-05-20`.
- Reloj: `page.clock` (4 s por turno) como en `tests/e2e/ruta-dorada.spec.ts`; **el reloj arranca parado** en la ruta nueva: los escenarios pulsan "Start the clock".
- Selectores por rol y texto de `ui/i18n/en.json`. Registrar errores de consola y de página como falla.
- Los resultados esperados de victoria y derrota salen de mi simulación del motor (A §6). **Codex debe volver a medirlos** con las pruebas del motor, no copiarlos de aquí.
- No se guarda audio ni datos personales: las pruebas con voz usan transcripción simulada.

## 1. Escenarios por perfil

### P1. Jugador de 7–8 años (lee poco, sigue lo brillante)
- **Comportamiento:** no abre "Why?" ni fuentes; solo sigue la píldora de objetivo de Iris; toca los botones grandes; cierra los textos largos.
- **Debe ocurrir:** llega al taller y a la Meteoróloga solo con el objetivo; recibe la alerta de D sin abrirla; ve el dosímetro aparecer; elige una opción con costos visibles.
- **Mide:** tiempo hasta el primer `[E]`; si termina la misión; si el texto de capa 1 fue suficiente (no hay un camino que exija capa 2 o 3).
- **Resultado esperado:** puede **ganar sin leer más de una línea por intervención** y sin abrir ninguna capa extra. Si pierde, la causa y la pista son visibles sin leer.

### P2. Jugador de 9–10 años (pregunta por qué)
- **Comportamiento:** abre "Why?" en radiación y en el escudo; habla con las 3 expertas antes del turno 3.
- **Debe ocurrir:** recibe razones con analogía; el dosímetro y la Doctora son coherentes (misma cifra).
- **Mide:** que la capa 2 no repite la capa 1; que no aparece una cifra sin fuente.
- **Resultado esperado:** gana si elige refugio o escudo con panel.

### P3. Jugador de 11–12 años (comprueba y nombra)
- **Comportamiento:** abre "Check the source" (DONKI, RAD), el glosario y la tarjeta final.
- **Debe ocurrir:** cada cifra de NASA tiene fuente, fecha de consulta y la etiqueta "curated, not live".
- **Mide:** ninguna cifra sin fuente (revisar el DOM); términos del glosario correctos.
- **Resultado esperado:** igual que P2, más acceso a todas las fuentes sin errores de consola.

### P4. Explorador (visita todo, tarda)
- **Comportamiento:** camina por todos los lugares, no arranca el reloj durante 3 minutos, habla con todos.
- **Debe ocurrir:** nada se rompe con el reloj parado; Iris insiste **una sola vez** (~20 s) y calla; el niño puede seguir explorando.
- **Mide:** que el reloj parado no consume turnos ni recursos; que el HUD no se desfasa; que `ticksSinAccion` no avanza.
- **Resultado esperado:** al arrancar el reloj, el estado es idéntico al de quien arrancó de inmediato (determinista).

### P5. Jugador que comete errores
Cuatro variantes, cada una debe terminar con **una causa clara y una pista**:

| Variante | Qué hace | Resultado esperado (según mis corridas) | Qué debe mostrar |
|---|---|---|---|
| **P5a** Pasivo | No decide nada en la tormenta | **Pierde** en el turno 5 por dosis (4,1–4,7) | `causa.limite_radiacion` + pista "shelter or stronger shield *before* the cloud" |
| **P5b** Aguantar | Elige "aguantar" | **Pierde** por dosis | Igual |
| **P5c** Escudo sin energía | Elige reciclador + invernadero, luego sube escudo | **Pierde** (⚡ llega a 0, turno 5) | `causa.recurso_agotado.energia` + pista "build a solar panel first" |
| **P5d** Cree a Iris | Sigue el consejo falso (p. ej. bajar el escudo / redistribuir 50 de energía a soporte vital) | **A medir** (no lo simulé): el motor decide | La cadena de causas debe nombrar que Iris estaba dañada; el panel de confirmación muestra costos antes de confirmar |

- **Qué se evalúa:** que la derrota sea comprensible, no humillante; que "Play again" vaya a la misma semilla; que la segunda vez el niño pueda cambiar una decisión concreta.

### P6. Jugador de decisiones eficientes
- **Comportamiento:** panel + escudo, habla con la Meteoróloga primero, verifica a Iris, refugio, telemetría a tiempo.
- **Resultado esperado:** **gana** (en mis corridas: refugio con panel + escudo termina en turno 6 con ⚡22 🫁58 🛡️52 ☢2,25).
- **Qué se evalúa:** que haya **sensación de satisfacción**: el final lo reconoce por decisión (F2–F4), no solo "Mission complete!".

## 2. Condiciones de victoria, derrota y recuperación (casos de prueba)

| Caso | Entrada | Esperado |
|---|---|---|
| V1 | Refugio, cualquier par de módulos | Victoria turno ~6, dosis < 4 |
| V2 | Escudo nivel 2 con panel | Victoria, dosis ~2,7–2,9 |
| V3 | Telemetría tardía (turno 6) con panel + escudo | Victoria turno ~8, ⚡ casi 0 (límite del margen) |
| D1 | Pasivo / aguantar | Derrota por dosis, turno 5 |
| D2 | Escudo sin energía | Derrota por energía a 0 |
| D3 | Plazo (no enviar telemetría) | Derrota por `causa.plazo_agotado` en turno 10 |
| R1 | Reparar a Iris (⚡−10 🫁−4) | Iris vuelve a "pistas"; causa `ia.reparada`; insignia "mecánica" |
| R2 | Derrota → *Play again* | Misma semilla, estado inicial idéntico |
| R3 | Derrota → otra misión | Entra en la misión elegida sin arrastrar estado |

## 3. Pruebas específicas de la experiencia nueva

| # | Qué | Cómo se comprueba |
|---|---|---|
| N-1 | La alerta de D llega sola | Entrar a `modulos`; esperar ≤ 3 s; ver el diálogo de la Meteoróloga con `prioridad alerta` y la tarjeta de fuente |
| N-2 | El reloj arranca parado | Entrar a `base`; esperar 10 s de reloj; el turno sigue en 0 |
| N-3 | "Start the clock" | Pulsarlo; en 4 s el turno pasa a 1 |
| N-4 | Dosímetro aparece al presentarlo la Doctora | No visible al inicio; visible tras D6 |
| N-5 | El dosímetro coincide con el motor | Comparar texto del DOM con `dosisMaximaTripulacion` |
| N-6 | Spoiler de Iris | Antes de la tormenta el panel Crew **no** dice "damaged" |
| N-7 | Iris da una lectura **cierta** antes de fallar | El valor dicho = el medidor; después de la revelación, difiere ≥ 20 |
| N-8 | Iris nunca ejecuta una acción sola | Con consejo falso, el estado del motor no cambia sin confirmación |
| N-9 | La verificación compara los dos números | El diálogo de la Ingeniera cita `dicho` y `real` |
| N-10 | La pista de reintento coincide con la causa | Una por derrota; ninguna en victoria |
| N-11 | Nada fuera de i18n | Ninguna cadena visible en inglés dentro del modo español |
| N-12 | Sin WebGL | La experiencia completa funciona en el respaldo 2D |
| N-13 | Tamaños | 1024×683, 1280×720, 1920×1080 y celular 390×844: sin scroll del documento, sin solapar el HUD |
| N-14 | Accesibilidad | Teclado: Esc, `[E]`; `aria-live` educado en dosímetro y diálogos; contraste |

## 4. Qué NO se prueba aquí
- Aprendizaje real de niños (hace falta sesión con niños; no se simula con Playwright). Los 6 perfiles son **conductas simuladas**, no medición pedagógica.
- Rendimiento 3D en celular físico (pendiente ya anotado por Daniel).
- Las otras cuatro misiones: solo que **no** se rompan al reutilizar piezas (casos R3 y una pasada de humo por misión).

## 5. Criterio de salida para QA
Los seis perfiles terminan, las nueve condiciones V/D/R se cumplen, los 14 casos N pasan, y no hay errores de consola ni de página.
