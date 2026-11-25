# D. Mapa de aprendizaje de Jezero

**Estado:** propuesta. Principio: **se aprende haciendo, y se comprueba mirando lo que el niño hace**, no preguntando. La pregunta final de Iris existe y nunca bloquea; aquí no se añade ningún examen.

## 1. Qué aprende, en qué momento y con qué acción

| Mecánica | Qué debe aprender | Cómo se introduce | Cómo practica | Cómo demuestra que entendió |
|---|---|---|---|---|
| **Explorar un entorno** | Que los lugares son distintos y cada uno sirve para algo | A: satélite con 3 voces. B1: mapa con 4 sitios. B2: `[E]` en la base | Visita taller, hábitat, sensor y mesa por su cuenta | Va solo al lugar correcto para su pregunta (taller para energía, sensor para el Sol) sin mirar el objetivo de Iris |
| **Interpretar datos** | Que un número tiene lugar, fecha y fuente | Tarjeta de sitio (criterios), tarjeta de fuente (DONKI/RAD), glosario | Abre "Check the source" | Abre una fuente por su cuenta; usa un término del glosario |
| **Leer los 3 medidores** | Qué mide cada uno y que están ligados | Viñeta 4 de la intro; briefing de Iris | Cada acción mueve ≥ 2 medidores y lo ve | Antes de confirmar una acción mira el `CostRow` (se puede medir: tiempo en el panel de confirmación) |
| **Costo ahora, beneficio después** | Que lo bueno tarda 1–2 turnos y lo malo es inmediato | C: Ingeniera ("watch the meters"), "Costs now / Helps later" | Coloca módulos y ve los medidores moverse más tarde | Elige un módulo "caro ahora" sabiendo que paga después (ej. panel antes de la tormenta) |
| **Construir y preparar una base** | Que lo que construyes decide lo que puedes hacer después | C, justo después de saber de la tormenta (D) | 2 módulos | Si tiene panel, elige escudo en E; si no, elige refugio (decisión coherente con sus recursos) |
| **Energía, soporte vital, blindaje** | Qué protege qué | Cada módulo con su experta; tarjeta de ciencia con fuente | Recibe el beneficio retrasado | Explica (en el chip "Why?") o usa el módulo adecuado para el problema |
| **Consultar especialistas** | Quién sabe de qué | Objetivo de Iris al taller / sensor / hábitat | Pregunta a cada una al menos una vez | Pregunta **antes** de decidir en la tormenta; usa a la experta correcta |
| **Radiación y dosis** | La radiación no se ve pero se cuenta; se acumula; se reduce con masa y refugio | D5–D7 de la Doctora + dosímetro (**NUEVO**) | Ve subir la dosis en E y bajar al refugiarse | Elige una opción que baja la dosis; no deja que pase de 4 en una repetición |
| **Anticipar peligros** | Que un aviso a tiempo da opciones | D: la Meteoróloga avisa antes de arrancar el reloj | Prepara (módulos, plan) antes del turno 3 | Habló con la Meteoróloga antes de la tormenta, o llegó con panel y escudo |
| **Decidir con consecuencias** | Que cada opción cuesta y que no hay una gratis | E: comparar plan, costos del motor, "Decision recorded" | 3 opciones con costos visibles | Dice cuál fue la causa de su resultado (cadena de causas) o cambia de estrategia al repetir |
| **Verificar a Iris** | Que una fuente confiable puede equivocarse y se verifica con otra | D9 (lectura cierta), E8 (lectura falsa), E9 (verificación) | Compara el número con el medidor; llama a la Ingeniera | **Señal de dominio:** pregunta a la Ingeniera **antes** de que la lleven; o ignora el consejo falso; o repara a Iris |
| **Telemetría y retraso** | Que los mensajes tardan y por eso se envían a tiempo | Panel de consola + retraso con fuente NSSDC | Envía telemetría y espera 2 turnos | La envía antes del último turno sin quedarse sin energía |
| **Leer los resultados** | Qué fue decisión y qué mala suerte | Final: causas separadas | Lee las causas y la pista de reintento | Repite y cambia una decisión concreta (F9) |

## 2. Los tres rangos de edad: una experiencia, tres profundidades

Misma partida, mismas tres capas (B §7). Lo que varía es **hasta dónde abre el niño**, no lo que ve.

| Idea | 7–8 años (ver y hacer) | 9–10 años (entender por qué) | 11–12 años (comprobar y nombrar) |
|---|---|---|---|
| Costo ahora / después | Ve el medidor bajar ahora y subir luego | "¿Por qué tarda?" → lo bueno de un módulo llega después de armarlo | Lee "Costs now / Helps later" con números y compara dos módulos |
| Radiación | "No se ve, se cuenta": el dosímetro sube y baja | "¿Por qué el refugio ayuda?" → muros gruesos paran partículas | Compara la dosis de fondo y la de la tormenta; abre la tarjeta RAD; usa *dosis* y *blindaje* del glosario |
| Tormenta solar | "Una nube del Sol viene" | "¿Cuánto tarda?" → puede tardar días | Fuente DONKI, fecha real, "datos curados, no en vivo" |
| Iris se equivoca | "Su número no es igual al medidor" | "¿Por qué se equivocó?" → la radiación puede confundir los chips (pregunta final) | Explica qué haría un astronauta real: verificar con otra fuente |
| Elegir sitio | "Este tiene más sol" | "Este protege más pero cuesta energía" | Compara tres criterios y el costo; justifica |

**Vocabulario en contexto:** cada palabra técnica (*radiación, dosis, blindaje, nube solar, delta, pendiente, modelo*) se explica **donde aparece** con su definición del glosario (`data/i18n`), nunca en una pantalla aparte. Una palabra por intervención.

## 3. Lo que se enseña una vez y debe reutilizarse en las otras misiones

Los **fundamentos** de Jezero son las habilidades que las otras cuatro misiones suponen, sin cambiar sus reglas:

1. Leer tres medidores y ver costos antes de confirmar.
2. Beneficios retrasados.
3. Preguntar a la experta correcta antes de decidir.
4. Comprobar un dato con su fuente.
5. Verificar a Iris con un medidor.
6. Que enviar el mensaje a la Tierra tarda.
7. Leer la cadena de causas y repetir con otra decisión.

Cada misión posterior solo **cambia el contexto** (sin Sol, sin hielo, noche larga, sin suelo). Detalle en [README §Identidad de las 5 misiones](README.md#identidad-de-las-cinco-misiones).

## 4. Qué se mide para saber si funcionó (sin invadir al niño)

Todo sale del estado del juego o de eventos de la interfaz que ya existen; **no se guarda audio ni datos personales** (regla del proyecto).

| Señal | De dónde sale | Qué dice |
|---|---|---|
| Habló con alguien antes del turno 3 | `progreso.conversado`, evento de conversación | Aprendió a consultar |
| Construyó panel y luego eligió escudo | `causas` (`colocar_modulo` y `subir_escudo`) | Entendió que la preparación abre opciones |
| Verificó a Iris antes de que se lo propusieran | Orden de eventos de conversación | Entendió el hábito |
| Terminó dentro del presupuesto de dosis | `dosisMaximaTripulacion`, `causa.limite_radiacion` | Entendió la radiación |
| Repitió y cambió una decisión | `semilla`, `causas` comparadas entre intentos | Aprendió de la derrota |

Estas señales son para el QA de Codex y para Santiago. **No hay ningún sistema de puntos nuevo ni nada que se muestre al niño como nota.**
