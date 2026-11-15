# AUDIO: música, efectos y voces

**Cuándo:** es la **última fase** ([FLUJO.md](FLUJO.md) §4, fase 4), cuando el juego ya está completo, integrado y validado en silencio. **Quién:** la pista A de ui. **Regla de oro:** el juego se entiende y se juega entero **sin sonido**. El audio acompaña, nunca es la única señal.

---

## 1. Tres cosas distintas que se llaman "voz"

Para que nadie las confunda:

| Término | Qué es | Dueño |
| --- | --- | --- |
| **Voces de la misión** | Los **textos** que dicen la tripulación e Iris (consejos, escenas, avisos). Ya existen en `agents/` (ejemplo: "voces de la misión Marte polo norte", PR #127). | Agentes (José) |
| **Lectura en voz alta** | El navegador lee en voz alta esos mismos textos (`speechSynthesis`). | ui, pista A |
| **Entrada de voz** | El niño habla en lugar de escribir; el navegador lo transcribe (`SpeechRecognition`). | ui, pista A |

La UI nunca escribe frases de la tripulación: las toma de `agents/` y de `missions/` por clave i18n.

## 2. Principios

1. **Silencio por defecto hasta que el jugador toque algo.** Los navegadores bloquean el sonido antes del primer gesto; el audio se inicia con el primer clic o tecla (por ejemplo, `Start mission`).
2. **Tres volúmenes separados** en `Settings`: música, efectos y voz, cada uno con apagado. Se guardan en `localStorage`.
3. **Nunca la única señal:** todo lo que suena también se ve (texto, icono, cambio en el medidor).
4. **Ligado al motor, no a las animaciones:** un sonido de gasto, daño o beneficio se dispara con el mismo evento de feedback que la animación ([FLUJO.md](FLUJO.md) §2), una vez por tick y por causa. Ningún sonido se dispara por un clip terminado.
5. **Pausa real:** con `document.hidden`, el juego en pausa o al desmontar, se silencia y se liberan los recursos de audio.
6. **Sin miedo:** niños de 7 a 12 años. La tormenta da tensión moderada, nunca terror, alarmas estridentes ni sirenas en bucle.
7. **Liviano:** presupuesto total de archivos de audio de ~2 MB; los efectos se generan con código siempre que se pueda.
8. **Licencias claras:** todo archivo de audio con licencia abierta verificable (CC0 o CC-BY) registrado en `assets/LICENCIAS.md` (archivo, autor, licencia, enlace). Sin licencia verificable, no entra.

## 3. Música

| Momento | Carácter | Duración | Volumen relativo |
| --- | --- | --- | --- |
| Portada e intro | Calma espacial, cálida, sintetizadores suaves (acompaña la paleta pastel) | Bucle de 45–60 s | Medio |
| Base (explorar, consultar) | Ambiente tranquilo y curioso, sin melodía que distraiga de leer | Bucle de 60 s | Bajo |
| Tormenta y dilema | Pulso más rápido y tensión moderada; sin percusión agresiva | Bucle de 30–45 s | Medio |
| Final | Breve y amable; igual si se gana o se pierde (perder también enseña) | 10–20 s, sin bucle | Medio |

- Cambios entre pistas con fundido de 1–2 s; nunca cortes.
- La música baja de volumen mientras suena la lectura en voz alta (ducking).
- Origen: archivos con licencia (§2.8) o un colchón generado con Web Audio si no se consigue licencia a tiempo. Sin música es aceptable: el juego se entrega igual.

## 4. Efectos de sonido

Cortos (menos de 300 ms), suaves y generados con Web Audio API cuando sea posible (osciladores y envolventes, sin archivos). Cada uno corresponde a un evento ya definido en [APLICACION.md](APLICACION.md) §7:

| Evento | Sonido | Regla |
| --- | --- | --- |
| Presionar un botón | Clic suave | No en hover. Teclado igual que mouse. |
| Confirmar una acción | Tono afirmativo corto | Solo si el motor aceptó la acción. |
| Acción rechazada | Tono neutro bajo | Con el motivo escrito en pantalla. |
| Gasto confirmado | Descenso suave | Uno por grupo de cambios del tick. |
| Beneficio recibido | Ascenso suave | Cuando el motor aplica el efecto, no al confirmar. |
| Daño por evento | Golpe sordo breve | Distinto del gasto voluntario. Sin estridencia. |
| Recurso bajo | Aviso único | Una vez al cruzar el umbral, no cada tick. |
| Alerta de tormenta | Aviso de dos notas, una sola vez | Solo con el evento real del motor. |
| Iris dañada | Interferencia corta (glitch) | Al revelarse la avería en el paso 6. |
| Módulo instalado / operativo | Clic mecánico / tono de encendido | Reconciliado con el estado del motor. |
| Telemetría enviada / respuesta recibida | Pulso de envío / tono de llegada | La llegada solo cuando el motor la aplica. |
| Pasos del niño | Pisadas suaves sobre regolito | Opcional; en Marte el aire fino apaga el sonido: muy bajo. |

Máximo 3 efectos sonando a la vez; si llegan más en el mismo tick, se agrupan.

## 5. Lectura en voz alta (`speechSynthesis`)

- Interruptor `Read aloud` / `Leer en voz alta` en `Settings` y en el panel de diálogo. Apagado por defecto.
- Lee **exactamente** el texto visible, en el idioma elegido (`en-US` o `es`), usando la voz que tenga el navegador para ese idioma.
- Cada personaje con una variación leve de tono y velocidad para distinguirlos (nunca imitando a una persona real o a un personaje conocido). Iris dañada: velocidad un poco irregular, sin volverse ininteligible.
- El texto completo aparece siempre de inmediato; la lectura no obliga a esperar. Saltar o cerrar el diálogo corta la lectura.
- Si el navegador no tiene voz para ese idioma, el interruptor se muestra deshabilitado con el motivo.
- **Sin voces grabadas de niños.** Las bases de Space Apps piden no incluir voz ni imagen reconocible de menores de 18 años ([docs/reglas.md](../reglas.md)). Si alguna vez se graban voces, solo de adultos y con licencia.

## 6. Entrada de voz (`SpeechRecognition`)

- Solo con **gesto explícito**: botón de micrófono que se mantiene presionado o se toca para empezar y para terminar. Nunca escucha sola.
- Antes del primer uso, aviso corto: el navegador puede enviar el audio a su fabricante para transcribirlo.
- **No se guarda audio.** Se transcribe y se descarta (regla del producto en `CLAUDE.md`). Solo el texto entra al juego.
- El texto transcrito sigue **el mismo camino que lo escrito**: se muestra en el campo `Ask your crew...`, el niño lo puede corregir y se envía por `conversar` de `agents/`. La voz nunca ejecuta una acción sola: igual hay que confirmar.
- Estados visibles: apagada, escuchando, procesando, error (con texto). Si el permiso se niega o el navegador no la soporta, vuelve a texto sin perder nada.
- Funciona bien en Chrome y Edge; en otros navegadores el botón se oculta o se deshabilita con el motivo.

## 7. Implementación

| Archivo | Responsabilidad |
| --- | --- |
| `ui/src/audio/motor.ts` | Un único `AudioContext` creado con el primer gesto; canales música, efectos y voz con su volumen. |
| `ui/src/audio/efectos.ts` | Efectos generados con Web Audio (osciladores, envolventes). Tabla evento a sonido. |
| `ui/src/audio/musica.ts` | Carga diferida de los bucles, fundidos y ducking. |
| `ui/src/audio/voz.ts` | Lectura en voz alta y entrada de voz detrás de interruptores. |
| `ui/src/audio/useSonidos.ts` | Hook que escucha los eventos de feedback de M y dispara efectos. |
| `assets/audio/` | Archivos de música con licencia (ogg y mp3 de respaldo). |
| `assets/LICENCIAS.md` | Registro de licencias de todo asset de terceros. |

La pista A no edita pantallas ni componentes: M monta los interruptores en `Settings` con los componentes de I y conecta el hook.

## 8. Validación

- Recorrido completo de la ruta dorada **con todo el sonido apagado**: se entiende igual.
- Recorrido con sonido: cada efecto corresponde a un evento real del motor, sin repeticiones al volver a renderizar.
- Pestaña oculta: silencio inmediato. Al volver: se reanuda solo si el juego no está en pausa.
- Entrada de voz con permiso negado: vuelve a texto sin errores.
- Cero errores de audio en consola en Chrome, Edge y Firefox.
- `assets/LICENCIAS.md` con una fila por archivo de audio.
