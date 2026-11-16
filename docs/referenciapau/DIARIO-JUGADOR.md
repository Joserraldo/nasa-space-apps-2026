# Diario del jugador — Frente B

## Encuentro del 15 de noviembre de 2026

**Responsable:** Jaime. **Estado:** bloqueado antes de jugar. **Tiempo real jugado:** 0 minutos.
No es una prueba con un menor ni se grabó audio. No se inventan observaciones de diversión o confusión.

### Guion de diez minutos preparado

| Minuto | Como jugador de 7–10 años | Qué observar |
| --- | --- | --- |
| 0–2 | Empezar en inglés, omitir intro si se desea, seguir a Iris. | ¿Sé adónde ir sin ayuda externa? ¿El saludo cabe en el globo? |
| 2–4 | Consultar a la Ingeniera, comparar módulos, decidir. | ¿Entiendo costo ahora y beneficio después? ¿Confirmo yo? |
| 4–6 | Volver a hablar después de elegir. Consultar a la Doctora. | ¿Recuerdan mi elección? ¿Hablan distinto? ¿Repiten siempre? |
| 6–8 | Consultar a la Meteoróloga, abrir la fuente y verificar a Iris dañada. | ¿Distingo dato NASA y medidor del juego? ¿Puedo verificar? |
| 8–10 | Continuar sin modelo, usar botones, cambiar a español y revisar el resultado. | ¿Puedo avanzar? ¿El final explica las causas? ¿Qué me sorprendió? |

### Lo que sí se verificó

- B1: 94 globos EN/ES medidos con el CSS real de F4 a 390 px; ninguno supera dos renglones.
- B2: pruebas con decisiones distintas, memoria sin repeticiones y sin atribuir azar al niño.
- B3: texto y transcripción con modelo simulado; errores de red/HTTP/JSON conservan botones.
- B4: fuentes primarias NASA leídas; tabla en agents/DATOS-MARTE.md del PR #357.
- B6: resultados distintos para cuatro niveles y avería inicial oculta hasta revelarse.
Estas comprobaciones no sustituyen jugar diez minutos.

### Bloqueo observado

El navegador rechazó abrir `http://localhost:5210`. Tras autorización explícita del usuario,
el segundo intento informó que un permiso guardado o una política administrada sigue denegando acceso.
No se intentaron rutas alternativas para eludirlo. La sesión B5 queda pendiente hasta habilitar ese acceso.

### Dónde se perdió, se aburrió o se sorprendió

**No observado:** no se abrió la partida. No hay hallazgos de jugador que justifiquen inventar bugs.
Por lectura de código sí se comprobó que PantallaBase aún usa conversación síncrona sin la memoria nueva.
La integración se entrega a A/E mediante issue; no se etiqueta como hallazgo de una partida.
