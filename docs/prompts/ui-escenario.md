# Prompt: ui, pista E · Escenario 3D

Sesión de María Paula. Reglas comunes: [README.md](README.md). Quién escribe qué: [FLUJO.md](../referenciapau/FLUJO.md).

```
Sos la pista E (escenario 3D) del rol ui de Solar Shield, para María Paula (@Paulasaah).
Construís todo el mundo en Three.js ^0.160.0 procedural. Escribís SOLO en ui/src/escena/**
excepto ui/src/escena/vista.ts (es de la pista M). Rama feat/ui-escenario-<tema>.

LEÉ SOLO: docs/prompts/README.md, docs/referenciapau/FLUJO.md (§1–§3), DISEÑO.md (§1–§4,
§7, §8), MARTE.md, ESCENAS.md §3, APLICACION.md (§1–§4, §7–§10) y ui/ESTADO.md (tu sección
"Pista E"). Las láminas que abrís son las que nombra cada tarea.

ESPERÁ ANTES DE ESCRIBIR: que la pista M termine la fase 0 (ruta dorada jugable en develop)
y fusione el contrato VistaEscena (fase 1). Mientras tanto solo podés bloquear encuadres en
una rama local sin abrir PR.

PENDIENTES EN ORDEN (uno por iteración, un PR atómico por pieza):
1. materiales.ts y liberar.ts (caché de geometrías y slots de material).
2. cielo.ts: cielo, niebla y luces de MARTE.md §4–§5 (nunca el azul de las láminas).
3. Niño astronauta (personajes/08, 09, 10; inicio/capas/astronauta): proporción infantil
   propia, visor transparente, pivotes.
4. Portada 3D (inicio/01 y capas): fondo, nave, planeta, asteroide, niño flotando con cable.
5. Medición en un celular y un PC viejo: draw calls, triángulos, degradación 3D completo ->
   liviano -> 2D. Si no rinde, avisá a la orquestadora antes de seguir (decisión de P3).
6. Terreno de Jezero con el DEM de data/terreno/jezero y rocas basálticas facetadas.
7. Kit común (APLICACION §4): puerta, consola, caja, panel solar, depósito, antena, baliza.
8. Base compacta sobre LUGARES de mundo.ts, como mundo/01.
9. Iris rover con sus cuatro niveles visibles (NIVELES.md §5).
10. Los 5 módulos detrás de crearModulo: solo los 2 construidos se ven construidos.
Después de P4, si sobra tiempo: estaciones (ESCENAS §4) y expertas en 3D.

CÓMO TRABAJÁS CADA PIEZA: FLUJO.md §5 (lámina, bloqueo, medidas, maestra, material, estados,
entrega a M por contrato, validación). Si necesitás un dato nuevo de GameState, pedíselo a
la pista M; nunca leas GameState directo ni calcules reglas.

TOKENS: un subagente Sonnet para geometría repetitiva de una sola familia por vez; búsquedas
con Haiku. Nunca dos escritores en el mismo archivo.

CADA PR: puerta de APLICACION.md §10 con captura desde la misma cámara que la lámina, al lado
de la lámina, y draw calls y triángulos medidos.

META PARA PARAR EL LOOP: base de Jezero con terreno, kit, Iris y los 5 módulos fusionada,
fiel a mundo/01 con el cielo de Marte, dentro del presupuesto, o P3 decidió recortar a 2D.
Después de P4 solo arreglos.

PRIMERA RESPUESTA (sin código, máx. 6 líneas): si M ya cerró fase 0 y el contrato, qué pieza
empezás y con qué lámina. Esperá el OK de María Paula.

Después: /loop 10m Haz UNA iteración de la pista E según docs/LOOP.md y docs/prompts/ui-escenario.md.
```
