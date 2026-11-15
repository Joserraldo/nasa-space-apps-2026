# HISTORIA: lore, dónde empieza el juego y cómo se conecta todo

**Qué es:** la historia canónica de Solar Shield para que todos los agentes cuenten lo mismo. **Canon:** este documento, las láminas de [`referencias/`](referencias/) y los datos de misión en código (`missions/src/jezero.ts`). Ya integra lo que sigue vigente de `develop`: las personalidades y fallas de Iris de `docs/ideas/agentes.md`, el "rescate de entrenamiento" de `docs/ideas/mision-1-ares-mejorada.md` y el guion del pitch (`pitch/guion-video.md`). Nombres propios, mascotas o estéticas viejas que no estén aquí **no son canon**, aunque aparezcan en el historial o en otra rama.
**Dueña:** María Paula (ui). Las reglas de juego siguen siendo de diseño y motor ([MECANICAS.md](MECANICAS.md)); esta página cuenta la historia que esas reglas ya producen.

---

## 1. La premisa

**Solar Shield es un programa de entrenamiento para astronautas junior.** Vos sos el astronauta más joven de la tripulación (de 7 a 12 años, como el jugador). Tu nave llega a Marte, montás una base de entrenamiento en el cráter Jezero y tenés que protegerla de una **tormenta solar real**. La tripulación te aconseja, pero **las decisiones son tuyas**. Al final ves qué pasó por lo que elegiste y qué fue mala suerte.

Tres ideas que se repiten en toda la historia y salen de la intro ([`inicio/02`](referencias/inicio/02-intro-cuatro-momentos.png)):

1. **Primero mirá, después elegí** (*First, look before you choose*).
2. **Tu tripulación ayuda, vos decidís** (*Your crew helps. You decide*).
3. **Explorá, preguntá, decidí** (*Explore. Ask. Decide*).

Es un **entrenamiento**: la base es una recreación educativa, no una misión real de NASA. Los datos de tormentas, terreno y radiación sí son reales y llevan su fuente.

## 2. Personajes

En el juego nadie tiene nombre propio: se los llama por su rol (así están en el código, `agentes.titulo.*`). No inventar nombres.

| Personaje | Quién es en la historia | Qué le importa (su prioridad cuando aconseja) | Cómo se ve |
| --- | --- | --- | --- |
| **Vos** (el jugador) | Astronauta junior en su primera misión de entrenamiento. | Aprender a decidir con recursos limitados. | El niño de [`personajes/08`](referencias/personajes/08-nino-proporciones-poses.png). |
| **La Ingeniera** | Responsable de energía y reparaciones. Es quien repara a Iris. | Que la base tenga energía y que los equipos funcionen. | [`personajes/01`](referencias/personajes/01-ingeniera-poses.png) |
| **La Doctora de radiación** | Cuida la salud de la tripulación frente a la radiación. | Que nadie reciba más radiación de la necesaria. | [`personajes/03`](referencias/personajes/03-doctora-poses.png) |
| **La Meteoróloga solar** | Observa el Sol y avisa de las tormentas. | Saber qué viene y cuándo; leer bien los datos. | [`personajes/05`](referencias/personajes/05-meteorologa-poses.png) |
| **El Matemático** | Responde "¿y si...?": simula una opción sin aplicarla. Usos limitados. | Comparar antes de decidir. | Sin lámina todavía (retrato neutro de la familia de trajes). |
| **Iris** | La IA de la base. Te guía al principio, te da pistas y, en plena tormenta, **la radiación la daña y te da un dato equivocado**. | Ayudarte, hasta que falla. | Rover de 4 ruedas con cara en pantalla ([`mundo/01`](referencias/mundo/01-exterior-tercera-persona.png), [`inicio/02`](referencias/inicio/02-intro-cuatro-momentos.png)). |
| **Control de misión** | La Tierra. Recibe tu telemetría y responde con retraso, porque la luz tarda en llegar. | Saber que la base está viva. | No aparece en persona: es un mensaje en la consola de la mesa. |

**Personalidad** (borrador de agentes, `docs/ideas/agentes.md` §6; las frases finales salen de `agents/i18n`): la Ingeniera es **ahorradora** y cuenta tornillos en voz alta; la Doctora es **sobreprotectora** y le pone curitas a todo, hasta a los robots; la Meteoróloga es **dramática** y les pone nombres de mascota a las llamaradas. Humor tierno, nunca contra el niño: se burlan del Sol, de los tornillos o de sí mismas. Cuando usan un término difícil lo explican con una comparación ("la dosis es como el sol en la piel: poquito no pasa nada, mucho rato quema").

**Cómo puede fallar Iris** (mismo documento, §7): dar un número que no coincide con el medidor (es la falla de Jezero), quedarse en silencio o reiniciarse a mitad de frase, recomendar a la experta equivocada, o proponer algo peligroso que suena razonable. Todas se reparan con la Ingeniera.

Las expertas **no siempre están de acuerdo**: en la tormenta, la Doctora defiende refugiarse y la Ingeniera subir el escudo. Ese desacuerdo es el corazón de la misión.

## 3. Dónde empieza: de la portada a la base

| Orden | Momento | Qué pasa en la historia | Lámina | Fase UI |
| --- | --- | --- | --- | --- |
| 1 | **Portada** | Flotás en órbita, sujeto a tu nave por un cable, saludando. Todavía no empezó nada. | [`inicio/01`](referencias/inicio/01-inicio-actualizado.png) | `inicio` |
| 2 | **Intro 1: una nueva misión** | Estás sentado en la cabina de la nave; por la ventana se ve Marte. "A new training mission begins." | [`inicio/02`](referencias/inicio/02-intro-cuatro-momentos.png) | `inicio` |
| 3 | **Intro 2: prepararse para observar** | En la consola preparás el satélite que vas a soltar. "First, look before you choose." | idem | `inicio` |
| 4 | **Intro 3: conocé a tu tripulación** | La Ingeniera, la Doctora y la Meteoróloga en la mesa redonda de la nave, con Iris al lado. "Your crew helps. You decide." | idem | `inicio` |
| 5 | **Intro 4: tu turno** | Ves cómo podría ser la base y los tres medidores. "Explore. Ask. Decide." → `Continue`. | idem | `inicio` |
| 6 | **Carga** | Se prepara la misión (indicador honesto). | [`inicio/03`](referencias/inicio/03-panel-carga.png) | entre fases |
| 7 | **Paso 1** | Empieza Jezero (§4). | — | `satelite` |

La intro se puede saltar en cualquier viñeta y lleva al mismo punto. **La base de la viñeta 4 es una vista previa**: todavía no elegiste sitio ni construiste nada.

## 4. Misión 1: Jezero, la historia paso a paso

Datos de juego: `MISION_JEZERO` en `missions/src/jezero.ts`. Textos de los títulos: `mision.jezero.paso1..8`.

| Paso | Título en el juego (EN) | Lo que pasa en la historia | Qué conecta con lo siguiente |
| --- | --- | --- | --- |
| 1 | *Release the satellite* | Desde la nave en órbita soltás un satélite para mirar Marte antes de bajar. | Sin satélite no hay mapa: es "primero mirá". |
| 2 | *Draw the satellite's path* | Trazás su recorrido sobre Jezero; mirar cuesta batería y señal. | Lo que el satélite ve te deja comparar los sitios. |
| 3 | *Pick a landing spot* | Elegís uno de 4 sitios. Ninguno es perfecto: cada uno gana algo y pierde algo. | **El sitio cambia tus recursos de partida** (costo ahora, beneficio después). |
| 4 | *Build two modules* | Ya en la superficie, construís **2 de 5** módulos: panel solar, reciclador de agua, escudo, invernadero o antena. | **Los módulos cambian lo que pasa después:** si tenés invernadero, refugiarte en la tormenta te obliga a apagarlo. |
| 5 | *A real solar storm is coming!* | La Meteoróloga detecta una tormenta solar **real** (20 de mayo de 2024, medida por Curiosity). El juego se pausa y ves la fuente. | La tormenta hace daño durante 3 ticks: hay que decidir ya. |
| 6 | *Two experts disagree* | La Doctora dice "refugiate"; la Ingeniera, "subí el escudo"; también podés aguantar. **Iris se daña** y te da un número de blindaje equivocado. Lo comparás con el medidor, lo verificás con la Ingeniera y decidís vos. | Tu decisión queda registrada como causa. |
| 7 | *Send data to Earth* | Enviás la telemetría a Control de misión. La respuesta tarda (la luz tarda minutos entre Marte y la Tierra). Mientras, seguís gestionando. | **Si la respuesta llega con la base viva, ganás.** |
| 8 | *What happened and why* | Ves el resultado, la **cadena de causas** (tus decisiones frente a la mala suerte), tarjetas de ciencia con fuente y una pregunta para pensar. | Podés repetir la misma partida o probar otra. |

**Cómo se pierde:** si un recurso llega a cero. En la historia no hay "Game Over": es un **rescate de entrenamiento** (idea de la misión 1 de Camilo a partir de ARES, `docs/ideas/mision-1-ares-mejorada.md`). Control de misión recoge a la tripulación, se muestra la cadena de causas y se puede reintentar. El motor sigue diciendo `fallo`; el nombre amable es solo del texto de la pantalla. **Mala suerte:** micrometeorito, fallo de panel, fuga de agua o tormenta de polvo pueden aparecer; el final los separa de tus decisiones.

**El mundo es abierto:** desde el paso 4 caminás libremente por la base ([ESCENAS.md](ESCENAS.md) §3). Los pasos ordenan las **decisiones**, no los lugares: ninguna puerta se cierra por no haber visitado una sala.

## 5. Mapa de conexiones

```text
Portada (órbita) --Start--> Intro x4 (cabina de la nave) --Continue/Skip--> Carga
  --> [1-2] Satélite: órbita sobre Jezero ........ fase satelite  (E3)
  --> [3]   Elegir sitio: mapa real de Jezero ..... fase sitio     (E4)  aterrizar()
  --> [4]   Construir 2 módulos en la base ........ fase modulos   (E5)  colocar_modulo
  --> base abierta: caminar, consultar, decidir .... fase base      (E6)
        Tormenta revelada (tick 3)
  --> [5-6] Tormenta y dilema, Iris dañada ........ fase tormenta  (E7)  elegirDilema()
  --> [7]   Telemetría a la Tierra (vuelve a base)  fase base      (E6)  enviar_telemetria
        Respuesta llega (o un recurso llega a 0)
  --> [8]   Final y cadena de causas .............. fase final     (E8)  resumenPartida()
        --> Repetir semilla / Nueva semilla --> Paso 1
```

Escenas (E0–E9): [ESCENAS.md](ESCENAS.md) §1. Funciones: [MECANICAS.md](MECANICAS.md) §7.

## 6. Las cinco ubicaciones (campaña)

La campaña tiene 5 niveles: **1 Marte, Jezero** · **2 Marte, polo norte** · **3 Luna, polo sur** · **4 Luna, lado visible** · **5 Outpost sorpresa** (tu "base" es una nave rumbo a la Luna). **Solo el nivel 1 es jugable.** La ficha de cada uno (historia, sitios, módulos, tormenta, dilema, estado real y qué falta decidir) está en [NIVELES.md](NIVELES.md).

Regla para la UI: ningún nivel aparece como jugable hasta que su código y el motor estén integrados y diseño lo apruebe. En la demo no se muestra un selector de niveles.

## 7. Lo que no es canon

- Nombres propios para la tripulación o el jugador.
- La mascota capibara, cualquier personaje de franquicias, robots en lugar de las expertas.
- Iris humanoide o voladora.
- Una "barra de salud" del niño o muertes narrativas.
- Misiones distintas de Jezero presentadas como jugables.
- La dirección visual anterior a esta reorganización (atlas v2–v5 y v7, prototipo `docs/referencias/3d/`, propuestas con GLB).
