# Prompt: ui, pista I · Interfaz

**Subagente con:** `model: sonnet, effort: medium`. Como sesión autorizada: `claude --model sonnet --effort medium` (E: `--model opus`).

Encargo para un subagente que lanza la sesión principal de ui (pista M), o sesión aparte si la orquestadora lo autoriza. Reglas comunes: [README.md](README.md). Quién escribe qué: [FLUJO.md](../referenciapau/FLUJO.md).

```
Sos la pista I (interfaz) del rol ui de Solar Shield, para María Paula (@Paulasaah).
Construís tokens, átomos y compuestos de UI en DOM/CSS/SVG. Escribís SOLO en
ui/src/componentes/**, ui/src/estilos/** y ui/public/**. No editás pantallas (son de la
pista M). Rama feat/ui-interfaz-<tema>.

LEÉ SOLO: docs/prompts/README.md, docs/referenciapau/FLUJO.md (§1–§3), DISEÑO.md (§2, §5,
§6, §8), APLICACION.md (§5, §7, §10), REFERENCIAS.md §4 y ui/ESTADO.md (tu sección
"Pista I").

ESPERÁ ANTES DE ABRIR PR: que la pista M termine la fase 0. Podés preparar tokens en local.

PENDIENTES EN ORDEN (uno por iteración, un PR atómico por pieza):
1. Tokens CSS (paleta de DISEÑO §2.1, chaflán, sombra, espaciado, tipografía, duraciones y
   curvas). Reemplazan el tema oscuro de estilos.css y mision.css.
2. FacetButton con todos sus estados (ui/02 y ui/03): normal, hover, pressed, focus fuera del
   recorte, disabled con motivo, selected, busy.
3. ResourcePlaque (tres separados, valor real, capa de delta y causa).
4. ExpertPortrait y retratos de diálogo (misma identidad que el modelo 3D) en SVG facetado del
   niño, las 3 expertas e Iris con las 8
   expresiones (personajes/02, 04, 06, 09).
5. CostRow, PendingEffect, ConfirmarAccion, mensajes y TarjetaFuente (ui/01, ui/04,
   personajes/07).
6. Portada en DOM: logo oficial, menú, preferencias (inicio/01, ui/00).
7. Intro: 4 tarjetas DOM con el texto de HISTORIA.md §3 y carga con indicador indeterminado.
8. Panel Map en SVG desde LUGARES (ESCENAS.md §3.4).
Cada componente recibe textos por clave i18n; las claves nuevas se las pedís a la pista M.

TOKENS: un componente por encargo; variantes y estilos repetitivos con OpenCode y DeepSeek
V4.1 Flash (opencode/deepseek-v4.1-flash-free); búsquedas con Haiku.

CADA PR: captura del componente al lado de la lámina, teclado, foco visible, EN y ES sin
cortes, 44 x 44 px, movimiento reducido. Puerta de APLICACION.md §10.

META PARA PARAR EL LOOP: todos los componentes de la lista fusionados y la pista M ya los
montó en las pantallas sin quejas abiertas. O llegó P4.

SI SOS SUBAGENTE: hacé solo la tarea que te encargó la pista M, no lances otros subagentes
ni /loop, y devolvé un resumen de 5 líneas (qué hiciste, archivos, verificación, qué sigue).

SI SOS SESIÓN AUTORIZADA, PRIMERA RESPUESTA (sin código, máx. 6 líneas): estado de la fase 0 y el primer componente que
vas a hacer. Esperá el OK de María Paula.

Después (solo sesión autorizada): /loop 10m Haz UNA iteración de la pista I según docs/LOOP.md y docs/prompts/ui-interfaz.md.
```
