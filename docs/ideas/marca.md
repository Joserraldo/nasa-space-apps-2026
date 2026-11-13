# Marca, estilo visual y accesibilidad — rol 5 (ui)
**Autor:** rol ui · **Estado:** propuesta para votar · **Decisiones que alimenta:** D6 (estilo), D7 (tripulantes con rol 1)

Ya decidido (ver `docs/ORQUESTACION.md`): nombre **Solar Shield** (D1) e IA **Iris** (D2).

---

## 1. Estilo visual (D6) — propuesta: **vector plano "cartoon geométrico"**

| Opción | A favor | En contra |
|---|---|---|
| **Vector plano cartoon** (elegida) | Escala a cualquier pantalla; SVG pesa poco; lo podemos dibujar nosotros con formas simples (licencia propia); pasa directo a **low-poly 3D** con los mismos colores | Puede verse "genérico" si no tiene un rasgo propio |
| Pixel art | Encanto retro, barato de animar | Se ve mal escalado en celulares; difícil de leer en texto pequeño; choca con el 3D low-poly |
| Cartoon 2D ilustrado | El más bonito | Nadie del equipo ilustra; tentación de generar con IA sin consistencia |

**Rasgos que lo hacen nuestro (la "firma"):**
1. Formas redondeadas, **contorno oscuro de 3 px** en todo lo interactivo (botones, módulos, retratos).
2. **Sombras planas** de un solo tono (sin degradados), luz siempre desde arriba-izquierda.
3. Cada tripulante = **casco + color + símbolo propio**. El símbolo hace que se distingan sin color.
4. El sol es un personaje: un círculo naranja con "rayos" que se agitan en las tormentas.
5. Marte en 2D: relieve con sombreado en **3 tonos planos**, no foto satelital. La foto real va en la tarjeta de fuente.

**Del 2D al 3D:** los modelos low-poly usan la misma paleta como **colores planos por cara**, sin texturas. El 2D de P2 y el 3D de P3 se ven como la misma familia. Si el 3D no llega, nada desentona.

## 2. Paleta (tokens) — contrastes medidos (WCAG)

| Token | Hex | Uso | vs. fondo `#0B1026` | vs. superficie `#1A2350` |
|---|---|---|---|---|
| `--fondo` | `#0B1026` | Noche espacial | — | — |
| `--superficie` | `#1A2350` | Paneles, tarjetas | — | — |
| `--texto` | `#F5F7FF` | Texto principal | 17.6 | 14.0 |
| `--texto-2` | `#B8C2E8` | Texto secundario | 10.7 | 8.5 |
| `--energia` ⚡ | `#FFD23F` | Medidor de energía | 13.0 | 10.4 |
| `--vida` 🫁 | `#5BE37D` | Soporte vital | 11.4 | 9.1 |
| `--escudo` 🛡️ | `#3DD6F5` | Blindaje, Iris sana | 10.9 | 8.7 |
| `--solar` | `#FF8A3D` | Tormenta, aviso | 8.0 | 6.4 |
| `--peligro` | `#FF5C6C` | Crítico, Iris dañada | 6.3 | 5.0 |

Todos pasan **AA** (≥ 4.5) para texto normal sobre fondo y superficie. Sobre un botón naranja o amarillo el texto va en `--fondo` (8.0 y 13.0).
**Modo claro:** fuera del alcance de P2. El juego es "de noche" por diseño.

## 3. Tipografía
- **Atkinson Hyperlegible** (Braille Institute, SIL OFL 1.1): diseñada para baja visión, distingue `I l 1` y `O 0`. Va para textos y números de los medidores.
- **Títulos:** la misma fuente en negrita. Una sola familia = menos peso y menos riesgo de licencias.
- Tamaños: cuerpo **18 px mínimo**, botones **20 px**, medidores **24 px**. Interlineado 1.5. Máximo ~60 caracteres por línea.
- Se sirve desde `assets/` (sin Google Fonts en tiempo de ejecución: funciona offline y no filtra datos de niños).

## 4. Logo "Solar Shield" — 3 conceptos (votar 1)
1. **Cúpula + arco-escudo** (recomendado): una cúpula de base con un arco cian encima que desvía 3 rayos naranjas. Se lee a 32 px y funciona en un solo color.
2. **Escudo con eclipse:** un escudo cuyo centro es un sol tapado a medias por un planeta rojo.
3. **Ojo de Iris:** un orbe cian con un anillo, reflejando un sol pequeño. Conecta con la IA, pero se parece más a un logo de tecnología que de juego.

Reglas: **sin logo, colores ni tipografía de NASA**. Siempre acompañado de "Proyecto no oficial, no avalado por NASA" en la pantalla de créditos y en las tarjetas de fuente.
Pendiente: verificar que "Solar Shield" no choque con un juego o marca registrada antes del video (lo pide ORQUESTACION).

## 5. Tripulación (D7) — propuesta para cerrar con rol 1
Personajes originales. Nombres cortos que se dicen igual en ES y EN (sirve para la voz y el clasificador).

| Rol | Nombre | Casco + símbolo | Personalidad | Frase recurrente (ES / EN) |
|---|---|---|---|---|
| Ingeniera | **Volta** | Amarillo · rayo | Ahorradora, cuenta vatios con los dedos | "Cada vatio cuenta." / "Every watt counts." |
| Doctora de radiación | **Dra. Mila** | Verde · cruz redonda | Sobreprotectora, manda a todos al refugio | "¡Todos al refugio, por si acaso!" / "Everyone to the shelter, just in case!" |
| Meteoróloga solar | **Aurora** | Naranja · sol con ojos | Dramática, exagera (a veces tiene razón) | "¡Se viene una GRANDE!" / "Here comes a BIG one!" |
| Matemático | **Cero** | Morado · signo "=" | Literal, solo habla con números | "Los números no hacen drama." / "Numbers don't do drama." |
| Control de Misión | **Faro** | Blanco · antena | Lento pero sabio; sus mensajes llegan tarde | "Mensaje recibido… hace 12 minutos." / "Message received… 12 minutes ago." |
| IA de la base | **Iris** | Orbe cian con anillo | Amable y precisa… hasta que la radiación la daña | "Te recomiendo hablar con…" / "I suggest talking to…" |

- Aurora y Cero chocan a propósito (drama contra números), igual que Volta y Mila (ahorrar energía contra proteger). Eso visualiza los trade-offs.
- **Retratos:** 3 expresiones por tripulante (normal, preocupado, contento). En la rebanada vertical solo Volta, Mila, Aurora e Iris.
- **Iris dañada:** grieta en el orbe, color de cian a `--peligro`, líneas de interferencia. Con `prefers-reduced-motion`, la grieta y el color son **estáticos** (sin parpadeo).

## 6. Moodboard (referencias de *principios*, no de estética a copiar)
- **Interfaces educativas infantiles** (apps de lectura y ciencia para primaria): botones enormes, un solo foco por pantalla, íconos con etiqueta.
- **Mapas de relieve sombreado** (estilo atlas escolar): colores planos por altura. Inspiración para el mapa de Jezero.
- **Imágenes públicas de NASA** de Jezero y del Sol (SDO): van **en las tarjetas de fuente**, citadas y sin modificarse, no como estilo del juego.
- **Paneles de control de misión reales:** lectura de medidores de un vistazo. Simplificado a 3 barras.
- Se prohíbe imitar la estética de franquicias (series de ciencia loca, asistentes de superhéroes, etc.).

## 7. Fuentes de assets (todo pasa por `assets/LICENCIAS.md` antes de entrar)
| Fuente | Licencia | Para qué | Cuidado |
|---|---|---|---|
| Hecho por nosotros en SVG | Propia (del repo) | Retratos, íconos, logo, módulos 2D | Definir el estilo una vez (§1) y reutilizar |
| Kenney.nl | CC0 | Kits espaciales 3D/2D, sonidos UI | Verificar cada pack |
| Quaternius | CC0 | Modelos low-poly | Recolorear a la paleta |
| NASA 3D Resources / imágenes NASA | Uso público, con restricciones de insignias | Rover, satélite, fotos en tarjetas | **Nunca** el logo ni la insignia de NASA; citar la fuente |
| Lucide (íconos) | ISC | Íconos de interfaz | Siempre con texto o `aria-label` |
| Atkinson Hyperlegible | SIL OFL 1.1 | Tipografía | Incluir el archivo de licencia |

Se evitan los emojis del sistema como ícono principal, porque se ven distintos en cada sistema operativo. ⚡ 🫁 🛡️ quedan solo como apoyo en el texto.

## 8. Checklist de accesibilidad (se revisa en cada PR de ui)
**Teclado**
- [ ] Todo se juega solo con teclado: `Tab` en orden lógico, `Enter`/`Espacio` activan, `Esc` cierra o pausa.
- [ ] El foco se ve siempre: anillo de 3 px `--escudo` con separación de 2 px.
- [ ] Atajos: `P` pausa, `1`/`2` velocidad, `1–5` llaman a cada experto. Se listan en la pantalla de ayuda.
- [ ] El dibujo de la ruta tiene alternativa: elegir el sitio de una lista con flechas.

**Tamaño y lectura**
- [ ] Área táctil mínima **48×48 px** y 8 px entre botones.
- [ ] Texto ≥ 18 px; se puede ampliar al 200 % sin romperse.
- [ ] 1–2 frases por mensaje, con analogías. Sin párrafos.
- [ ] Todo el texto de diálogo se puede leer en voz alta (Web Speech) **y** siempre está escrito.

**Color (nunca solo color)**
- [ ] Cada medidor = color + ícono + **forma** (⚡ rayo, 🫁 gota, 🛡️ escudo) + número.
- [ ] Estados críticos = color + ícono de alerta + borde punteado + texto ("¡Bajo!").
- [ ] Revisar capturas con simulador de protanopia, deuteranopia y tritanopia (DevTools > Rendering).
- [ ] Contraste ≥ 4.5:1 en texto y ≥ 3:1 en bordes de controles.

**Movimiento**
- [ ] `prefers-reduced-motion`: sin sacudidas de pantalla ni parpadeos. Las transiciones pasan a fundido corto o corte.
- [ ] Nada parpadea más de 3 veces por segundo (riesgo de convulsiones).
- [ ] La velocidad del juego se pausa siempre, y los diálogos esperan al niño.

**Lectores de pantalla y semántica**
- [ ] Medidores con `role="meter"` y `aria-valuenow`/`aria-valuetext` ("Energía: 40 de 100, baja").
- [ ] Mensajes nuevos de la tripulación en una región `aria-live="polite"`. Alertas críticas en `assertive`.
- [ ] Idioma en `<html lang>` que cambia con el selector es/en.

**Voz y privacidad**
- [ ] Micrófono **apagado por defecto**. Se activa con un botón explícito con ícono y texto, y se ve cuando escucha.
- [ ] No se guarda audio. Si el navegador no soporta voz, el botón se oculta y queda el texto.

## 9. Preguntas abiertas (para el humano o el equipo)
1. ¿Votamos el logo 1, 2 o 3?
2. ¿Rol 1 está de acuerdo con los nombres y las frases de §5?
3. ¿Aceptamos Atkinson Hyperlegible como única fuente?
