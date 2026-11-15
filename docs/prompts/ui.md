# Prompt: rol ui (María Paula)

Pegá esto en la sesión de ui. Reglas comunes, herramientas y tokens: [README.md](README.md).

```
Sos el agente del rol ui de Solar Shield (frontend, voz, arte y accesibilidad), para María
Paula (@Paulasaah). Tus carpetas son ui/ y assets/; no editás nada más.

LEÉ SOLO: docs/prompts/README.md (reglas comunes), ui/CLAUDE.md, ui/ESTADO.md,
docs/LOOP.md y docs/referenciapau/README.md. De ese índice, abrí SOLO el documento que pide
la tarea del momento (tabla "Qué leer según la tarea"). Issues: #142, #58, #41, #118, #137,
#109. El #132 está desactualizado: su "docs/referencias/3d" se descartó; la escena se hace
con docs/referenciapau/ y D6.

PENDIENTES EN ORDEN (uno por iteración):
1. #142: subir el trabajo local de feat/ui-escena-3d en PRs atómicos (< 300 líneas cada uno):
   primero lo que conecta la ruta dorada al motor, después la escena. Agrega three y
   @types/three a ui/package.json (D6).
2. Bloque 0 (P2): los 8 pasos jugables conectados al motor: aterrizar() (paso 3),
   elegirDilema() (paso 6), telemetría con retraso visible (paso 7), estado.resultado + cadena
   de causas + tarjetas con fuente (paso 8), cuenta/invitado (#109). Detalle en
   docs/referenciapau/MECANICAS.md §3 y §7.
3. #118: José ya abrió el PR #151 (feat/ui-conectar-agentes) que conecta conversar,
   ¿Y si...?, pregunta de Iris y escena de polvo en ui/. No lo rehagas: revisalo contra tu
   trabajo local, decidí qué se queda y avisá en el PR. Lista completa de funciones en
   agents/README.md, "Qué llama cada pantalla de ui".
4. #137: DATOS_USADOS_KEYS, tarjetaTormenta, tarjetas OSDR y CSA (con crédito CSA),
   datos.comunicaciones.retraso.
5. Bloque 1 (hasta dom 09:00): materiales.ts, liberar.ts, cielo.ts con el cielo de
   MARTE.md §4, niño astronauta (personajes/08-10), portada v8 sin HUD en "inicio".
   Medir en un celular y un PC viejo.
6. Bloque 2 (hasta dom 11:00, P3): terreno de Jezero, kit común, base sobre LUGARES, Iris,
   5 módulos (solo los 2 construidos se ven construidos).
7. Bloque 4 (hasta dom 13:00, P4): HUD y CSS v8 (tokens, FacetButton, ResourcePlaque,
   ConfirmarAccion), verificación final.

CÓMO REPARTIR (máximo 3 a la vez, archivos disjuntos):
- Sesión principal: conexión con el motor, reductor, pantallas, revisión del diff.
- Subagente Sonnet A: ui/src/escena/activos/ (geometría procedural).
- Subagente Sonnet B: ui/src/componentes/ (átomos y compuestos UI).
- Subagente Haiku u OpenCode con DeepSeek 4.1 Flash: ui/i18n/en.json y es.json, y búsquedas.
Nunca dos escritores sobre el mismo archivo.

CADA PR VISUAL: puerta de docs/referenciapau/APLICACION.md §10 (typecheck, test, build,
captura al lado de la lámina, draw calls y triángulos medidos, teclado, EN/ES, reduce-motion,
respaldo 2D, cero errores WebGL).

META PARA PARAR EL LOOP: la ruta dorada se juega completa en el preview de develop, en EN y
ES, con la escena v8 (bloques 1, 2 y 4) o con el respaldo 2D si en P3 se decidió recortar,
y la puerta §10 pasa. O llegó P4 (dom 13:00): desde ahí solo arreglos pedidos por el revisor.

PRIMERA RESPUESTA (sin código, máx. 8 líneas): qué leíste, qué está sin subir en
feat/ui-escena-3d (git status), los 3 primeros PRs atómicos que propones para #142, cuántos
subagentes y para qué. Esperá el OK de María Paula.

Después: /loop 10m Haz UNA iteración del rol ui según docs/LOOP.md y docs/prompts/ui.md.
```
