# B2 — memoria de la tripulación

Depende de B0 (#334) fusionado. La rama parte de develop e incluye el contrato pendiente para compilar.
Al fusionar B0, rebasar esta rama y conservar solo el cambio de memoria.

Pasar `{ reaccion: reaccionTripulacion }` en opciones de `turno` o `conversarConRed`. El contrato de turno vive solo en B0.
`turno` incorpora el comentario más reciente de la experta cuando no hay una alerta prioritaria.
Solo usa `causas` del motor con origen `decision`; no atribuye azar ni simulaciones al niño.
Cada recuerdo se marca por índice, no por tick: dos módulos del mismo tick son recuerdos diferentes.
Los comentarios nombran elecciones, sin prometer que un beneficio pendiente ya ocurrió.
La memoria es JSON plano del llamador, no se envía al clasificador.

Verificado: npm ci; typecheck; suite completa 947 pruebas; tras simplificar el comentario de refugio,
178 pruebas de agents y build de ui. No se cambió el comportamiento de refugio ni se inspeccionan efectos ocultos.
No verificado: UI con memoria persistida, sesión de juego ni e2e nuevos.
Referencia: personajes/07 y rostros 02, 04, 06 de docs/referenciapau/referencias/.
