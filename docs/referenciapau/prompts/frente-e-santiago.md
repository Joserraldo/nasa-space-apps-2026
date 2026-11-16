# Frente E — Santiago: UI de flujo, tarjetas que aparecen, HUD y menú

Trabajás en Solar Shield, un juego educativo bilingüe (inglés primero) sobre Marte para chicos de 7 a 10
años. Tu frente elimina las tarjetas fijas: la interfaz aparece cuando el juego la necesita y se va al
decidir. También el `[E]` único, el HUD progresivo, el menú con la cámara y el flujo de entrada. Sos quien
fusiona los PR de todos. Otras cinco personas trabajan en paralelo.

## Leé antes de tocar código
1. `CLAUDE.md` (raíz).
2. `docs/referenciapau/PLAN-JUGABILIDAD.md`: completo (fusionás el trabajo de todos), sobre todo §1, §3,
   tu frente en §4 y §5 (dependencias y orden de fusión).
3. `docs/referenciapau/MECANICAS.md` §4 (ciclo de decisión y detalles que no se pueden romper) y §6
   (invariantes).
4. Láminas: `docs/referenciapau/referencias/inicio/04-flujo-entrada-carga-orbita-explorar.png`
   (composición; el personaje es el niño B, no la capibara), `inicio/01` a `03`, `ui/01`, `ui/04`.
5. `ui/src/escena/frontera.ts` (lo importás, no lo editás).

## Tus archivos (solo vos los editás)
`ui/src/App.tsx`, los `.tsx` de `ui/src/pantallas/` (salvo `lugares.ts` y `PantallaSitio.tsx`), los `.tsx`
de `ui/src/componentes/` (salvo `base/` y `Mapa.tsx`), `tests/e2e/**`, `.github/workflows/**`. Los `.css`
son de María Paula.

## Tus tareas, en orden
- **E0 (ya):** fusionar #332 y, en la primera hora, el A0 de José.
- **E1:** tarjetas contextuales: nacen de un evento del mundo, una a la vez, y se cierran al decidir. E5
  deja de tener la lista y el panel fijos.
- **E2:** una sola vía para el `[E]` con `onInteractivo` (`Talk`, `Build`, `Enter`/`Exit`, `Use`). Un solo
  manejador de teclado (hoy está en `PantallaBase.tsx`, cerca de las líneas 186 a 196).
- **E3:** HUD progresivo (tabla del plan §1).
- **E4:** menú con cámara 1.ª/3.ª persona (se guarda en ajustes), calidad, sonido e idioma.
- Después: E8 (flujo de entrada con "Ready to explore" y `Show controls`), E5 (conversación larga), E9
  (botón de salto táctil), E6 (e2e nuevas) y E7 (emojis de `Dialogos.tsx:7`).

## Qué esperás y qué entregás
- Esperás: E1 → F2 (estilo; mientras tanto, la estructura con el estilo actual); E5 → F4; E6 → A2, A5 y A9;
  E8 → F6, A5 y A12; E9 → A5.
- Entregás: E1 a José (A9); E2 a José (A8) y al frente B (B3).

## Cómo fusionar (sos el responsable)
1. Contratos y ganchos primero (A0, B0); después C2 (mueve la base: avisá a todos que hagan rebase); después
   el resto, en el orden en que pasen CI.
2. C2, C3 y D1 necesitan la aprobación de María Paula en el PR.
3. Solo con CI en verde, y siempre con squash.

## Reglas
- Ninguna tarjeta cobra al abrirse; `Back` antes de confirmar no cambia nada; abrir y cerrar conserva la
  pausa y devuelve el foco (MECANICAS §4 y §6).
- Textos por i18n, inglés primero. Sin emojis. Commits chicos en español, sin atribución a IA.
- Rama por tarea desde `origin/develop`; PR hacia `develop`; nunca empujes a `develop` ni a `main`.
- Antes de cada PR: typecheck, vitest, build, e2e (pausar el reloj antes de caminar) y capturas en los 4
  tamaños.

## Cómo informar cada tarea
Qué verificaste (comando y resultado), qué no verificaste y qué está bloqueado.
