# Controles táctiles: evidencia de cierre

Estado: entrada y componente se revisan juntos en #298 hacia develop. El código original está preservado en `respaldo/ui-ubicacion-tactiles-1511`.

## Referencia y alcance
Fuente de la geometría del joystick y de los gestos: ESCENAS §3.5; familia de `ui/03`. El HUD final se compara con `mundo/01` y sus botones Crew/Map con `ui/02`.
El componente usa exclusivamente Nunito/tokens y FacetButton existentes. No se edita App, PantallaBase, renderer ni modelos.
La capa no intercepta eventos; solo los botones son interactivos. Los gestos se escuchan en el contenedor y excluyen controles/diálogos. Se restaura touchAction al desactivar/desmontar.
`mostrarBotones=false` permite que José conserve los E/V del HUD y evita duplicarlos. Joystick y mirada siguen activos.

## Validación
- Entrada pura: 13 pruebas; componente SSR: 5 pruebas. SSR no comprueba el efecto DOM.
- `node ui/evidencias/tactiles/verificar.mjs`: EXIT0, multitáctil emulado en1024x683,844x390,390x844.
- Comprobados: mover+mirar simultáneos, HUD clicable detrás, doble toque, E/V y callbacks, ocultación de botones, teclado, pointercancel/limpieza, visibilitychange simulado, restauración de touchAction, EN/ES y movimiento reducido.
- Sobre develop a674508: typecheck0,785 pruebas/104archivos,build0 y E2E1/1 en el conjunto completo.
- E2E reintento1/1,exit0. El primer intento agotó90s en page.goto; no se atribuye su resolución a un cambio de código, y se conserva log/trace en build/cierre-ubicacion.
- Resultados y capturas generados por el script de esta carpeta.

## Ficha de fidelidad (pendiente de Paula)
Pieza: controles táctiles aislados, no pantalla de juego integrada.
Lámina: familia ui/03, mundo/01 y ui/02 para su futuro montaje; joystick descrito en ESCENAS3.5 (sin lámina propia).
Capturas: captura-1024x683.png, captura-844x390.png, captura-390x844.png.
Silueta: base octogonal112px/perilla48px y FacetButton existentes; sin arte nuevo.
Layout: NO certificado en el HUD3D; la captura muestra solo el componente sobre fondo de token para probar gestos.
Material: tokens lila/marfil/cian y Nunito; sin colores literales.
Conducta: gestos/estados probados en emulación; móvil físico pendiente.
Desviaciones: montaje3D ausente y posición definitiva del joystick esperando coordinación de José/Paula.
Prohibidos: sin emojis, activos de otro estilo ni tema oscuro.

## Bloqueos reales
1. José/Daniel: consumir vectores por frame y cámara/posición real; el renderer de esta base sigue con foco fijo.
2. José: conectar onUsar/onCamara/onPausar y mantener Crew/Map/E/V sin taparse, según #269 comentario6898047254.
3. Celular/tablet físico y aprobación visual de Paula; la emulación no los sustituye.
No se declara base recorrible ni controles móviles integrados por tener estas pruebas verdes.
