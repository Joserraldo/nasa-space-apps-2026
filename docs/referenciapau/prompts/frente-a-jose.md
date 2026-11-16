# Frente A — José: misiones, mecánicas, movimiento y animación

Trabajás en Solar Shield, un juego educativo bilingüe (inglés primero) sobre Marte para chicos de 7 a 10
años. Hoy el juego tiene interfaz pero no se juega en el mundo. Tu frente es el más difícil y el que define
la experiencia: que la misión de Jezero se juegue caminando por la base, con una tripulación que reacciona,
saltos con la gravedad real de Marte y animaciones que no se sienten genéricas. Otras cinco personas trabajan
en paralelo; vos sos dueño del archivo central de la escena.

## Leé antes de tocar código
1. `CLAUDE.md` (raíz).
2. `docs/referenciapau/PLAN-JUGABILIDAD.md`: §0, §1, §2, §3, tu frente en §4, §5 (dependencias) y §6.
3. `docs/referenciapau/MECANICAS.md` (§3.4 Iris compañera, §4 ciclo de decisión, §5 el motor manda).
4. `docs/referenciapau/ESCENAS.md` §3 (mundo abierto, controles) y §4 (estaciones).
5. `ui/src/escena/frontera.ts` (el contrato con la pantalla: ahora sos su dueño).

## Tus archivos (solo vos los editás)
`engine/`, `missions/`, `ui/src/juego/**`, `ui/src/pantallas/lugares.ts`, y en `ui/src/escena/`:
`escena3d.ts`, `EscenaBase.tsx`, `frontera.ts`, `movimientoBase.ts`, `fisica.ts`, `navegacion.ts`,
`entradaTactil.ts`, `tripulacionBase.ts`, `coreografia.ts` y `salas.ts` (nuevos), `personajes/animaciones.ts`.

## Tus tareas, en orden
- **A0 (primero, hoy):** ganchos de sistemas en `escena3d.ts` (`montar`, `actualizar(dt)`, `dispose`), mover
  `AJUSTE_CALIDAD` a `escena/calidad.ts`, dueños en el encabezado de `frontera.ts`. PR chico: Santiago lo
  fusiona primero porque C y D esperan esto.
- **A1:** Iris aparece averiada en el turno 0 (los datos del caso están en el plan, A1). Encontrá la causa.
- **A2:** cadena de objetivos: `guiaIrisLugar` y `briefingIris` → `objetivo`, `iris` y `globo`; el globo
  anclado sobre quien habla; Iris que avanza y señala.
- **A3:** propuesta de misión interactiva en `docs/referenciapau/MISION-INTERACTIVA.md` (una página: qué
  hace, qué lo sorprende y qué aprende el niño en cada paso). La aprueban Santiago y María Paula.
- **A4:** caminar fluido. Primero medí (`medir: true`, `escena3d.ts:45`); después aceleración, frenado,
  giro suave y pasos según la velocidad.
- **A5:** salto con `GRAVEDAD_MARTE` (3,73 m/s², fuente NASA NSSDC en `fisica.ts`). Velocidad de despegue
  declarada como suposición de juego. Pruebas con `h = v²/2g` y `t = 2v/g`. **Esto lo van a revisar.**
- **A12:** mirar con el mouse sin arrastrar (Pointer Lock tras un clic; se suelta solo cuando `bloqueado`).
- **A13:** los zooms raros de la cámara al caminar o al usar el mapa.
- Después: A6 (Doctora y Meteoróloga en escena), A7 (coreografía con los 14 gestos), A8 (entrar a las
  salas), A9 (paso 4 caminando), A10 (cámara en celular vertical), A11 (P2).

## Qué esperás y qué entregás
- Esperás: A7 → A6; A8 → C2, D5, E2; A9 → A3 aprobada y E1. Mientras tanto, la columna "mientras tanto"
  del plan §5.
- Entregás: A0 a C y D; A2 a C, B y E; A5 a E (botón táctil); A6 a B. Avisá en el PR a quién desbloquea.

## Reglas
- El motor manda: caminar, saltar, entrar o terminar una animación nunca da ni quita recursos.
- Sin GLB ni librerías nuevas además de three. Presupuesto por vista: 80 draw calls y 80 000 triángulos.
- Textos por i18n, inglés primero. Sin emojis. Commits chicos en español, sin atribución a IA.
- Rama por tarea desde `origin/develop`; PR hacia `develop`; nunca empujes a `develop` ni a `main`.
- Antes de cada PR: typecheck, vitest, build, e2e (pausar el reloj antes de caminar: en CI no hay GPU) y
  capturas en 1440x900, 1024x683, 844x390 y 390x844.

## Cómo informar cada tarea
Qué verificaste (comando y resultado), qué no verificaste y qué está bloqueado. "Las pruebas pasan" no es
"se juega": abrí el juego y comprobalo.
