# B3 — conversación para A/E

Depende de B0 (#334) fusionado; en el mundo también de A6 y E2 (#346).
`conversarConRed(entrada, estado, memoria, opciones)` se puede usar desde el campo Ask your crew…:
- texto y voz (solo transcripción) usan la misma función;
- botones, acercarse y atajos no necesitan red;
- solo `{texto}` llega a `/api/clasificar`; nunca el estado, memoria ni audio;
- HTTP 429/500, red caída y JSON roto devuelven aclaración y opciones;
- el Worker rechaza cuerpos con campos adicionales;
- el modelo entrega JSON estricto: se fija el experto según intención y se descartan cifras o parámetros fuera del enum;
- la respuesta solo propone acciones. El niño debe confirmar para que el motor actúe.

Integración de A/E: conservar la memoria y pasar actor, globo, diálogo y opciones a la escena y la tarjeta.
En voz, la UI debe avisar antes del primer uso que el navegador puede enviar audio a su fabricante,
mostrar la transcripción para corregirla y enviarla solo al confirmar (AUDIO §6). No se implementa captura de audio aquí.

Verificado: npm ci, typecheck, vitest (956 pruebas), build. Modelo simulado para repetir fallos y comprobar privacidad.
No verificado: proveedor real (sin usar una clave), entrada de micrófono, flujo integrado en UI y e2e nuevos.
El navegador local sigue bloqueado por un permiso guardado incluso con autorización del usuario.
