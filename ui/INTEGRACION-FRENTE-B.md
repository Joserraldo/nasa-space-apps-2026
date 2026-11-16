# Integración del Frente B — borrador, no orden de fusión

Solicitada por Jaime con autorización para conectar UI y agentes. No incluye #363 ni recogida de correos/cuentas.
La política de acceso de menores se discute por separado; el login permanece en su propio PR borrador.

## Dependencias incluidas para probar en una sola rama

- B0 #334 (contrato único, ahora Ready for review).
- B1 #354, B2 #355, B3 #356, B4 #357 y B6 #358.
- Código de A2 #345 para proyectar el globo y llevar el pedido de Iris a la escena.

Esta rama NO fusiona esos PR ni autoriza su publicación. Tras su integración en develop, rebasar y revisar solo el pegamento.
Respetar el orden de Santiago: #335 antes de E2 #346; no pasar los demás borradores a listo sin cerrar sus condiciones.

## Qué conecta

- Ask your crew… llama al adaptador asíncrono. Solo sale texto; estado y memoria se quedan en el juego.
- Botones y atajos funcionan sin modelo. HTTP o JSON fallidos conservan preguntas de respaldo.
- Elegir, acercarse y conversar no aplican acciones: el niño confirma en el panel de decisiones.
- Los recuerdos y las curiosidades vistas viajan en el guardado existente; partidas anteriores siguen siendo válidas.
- Globos B1 (uno a la vez) usan el CSS F4 y la proyección de A2; diálogo completo permanece en la tarjeta.
- Las expertas tienen cuerpo en sus anclajes canónicos. El detalle de rostro, vidrio y sombra se reserva a la más cercana.
- Datos B4 accesibles desde preguntas de curiosidad con tarjeta NASA. RAD, polvo y retraso se ofrecen con eventos reales del motor.
- Preguntar por un fenómeno no afirma que esté representado físicamente en el ambiente: D conserva sus mallas y eventos.

## Validación

Pruebas de serialización de recuerdos, datos manipulados, conversión modelo→experta, respaldo y presupuesto gráfico.
E2E nueva de la conversación completa con modelo simulado, fuente y fallo HTTP; CI debe confirmar el recorrido.
No verificado: proveedor real, micrófono, aprobación visual de Paula, cuatro capturas B6 y sesión B5 de diez minutos.
El navegador local mantiene un bloqueo guardado, tanto al abrir como al leer la pestaña; no se elude.
