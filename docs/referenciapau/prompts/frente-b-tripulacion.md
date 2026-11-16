# Frente B — tripulación viva, IA y jugador de prueba

Trabajás en Solar Shield, un juego educativo bilingüe (inglés primero) sobre Marte para chicos de 7 a 10
años. Tu frente hace que hablar con la tripulación se sienta como hablar con personas que recuerdan lo que
hiciste, y que todo se conecte. Además, en cada encuentro **jugás en el lugar del niño** y contás dónde se
pierde, se aburre o se sorprende. Otras cinco personas trabajan en paralelo.

## Leé antes de tocar código
1. `CLAUDE.md` (raíz): el modelo nunca inventa números ni ve el estado completo; clasifica en JSON estricto y
   el código responde. No se guarda audio de menores.
2. `docs/referenciapau/PLAN-JUGABILIDAD.md`: §0, §1, §2, §3, tu frente en §4, §5 y §6.
3. `docs/referenciapau/MECANICAS.md` §3.4 (Iris), §4 (ciclo de decisión) y §9 (ciencia).
4. `docs/referenciapau/HISTORIA.md` y `AUDIO.md` §5 y §6 (voz).
5. `agents/src/iris-acompana.ts` y `agents/src/index.ts`.

## Tus archivos (solo vos los editás)
`agents/**`, `infra/worker/**`. En `ui/i18n/*.json` agregás claves con prefijo `agentes.*` (no borres
claves ajenas).

## Tus tareas, en orden
- **B0 (bloque 0, con José):** el contrato de conversación con la tripulación en `agents/`, con tipos y
  pruebas.
- **B1:** líneas cortas para el globo: bienvenida de Iris y 1 o 2 líneas por paso y por nivel de Iris
  (`tutorial`, `pistas`, `danada`, `offline`). Inglés primero; nada de miedo; como mucho 2 renglones en 390 px.
- **B2:** la tripulación recuerda y reacciona a lo que eligió el niño (las causas del motor). Personalidades:
  la Ingeniera práctica, la Doctora tranquila, la Meteoróloga curiosa.
- **B5 (en cada encuentro):** jugá 10 minutos como un niño de 7 a 10 años con un guion y escribí
  `docs/referenciapau/DIARIO-JUGADOR.md`. Abrí un issue al dueño de cada problema.
- Después: B3 (conversación en el mundo: texto o voz → clasificador → respuesta con datos del motor; si el
  modelo cae, quedan los botones), B4 (8 a 10 datos reales de Marte, cada uno con fuente verificada) y B6
  (los niveles de Iris se notan en su comportamiento).

## Qué esperás y qué entregás
- Esperás: B2 y B3 → B0; B3 en el mundo → A6 y E2; B4 → cada fuente verificada. Mientras tanto, el plan §5.
- Entregás: B1 a A (líneas del globo); B4 a D (fenómenos de ambiente con fuente).

## Datos de Marte ya verificados (NASA NSSDC, Mars Fact Sheet, 16 nov 2026)
Gravedad media 3,73 m/s² (0,380 de la terrestre); día de 24,6597 h; temperatura media de unos −59 °C. Todo
lo demás se muestra solo con una fuente que verifiques vos o el rol de datos.

## Reglas
- Sin cifras inventadas: los números salen del motor o de diseño, nunca del modelo.
- Textos por i18n, inglés primero. Sin emojis. Commits chicos en español, sin atribución a IA.
- Rama por tarea desde `origin/develop`; PR hacia `develop`; nunca empujes a `develop` ni a `main`.
- Antes de cada PR: typecheck, vitest y build.

## Cómo informar cada tarea
Qué verificaste (comando y resultado), qué no verificaste y qué está bloqueado.
