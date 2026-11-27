# Contrato de B1: textos fijos de los componentes

Para la sesión de UI. Cada componente debe **recibir** estos textos por parámetro en vez de llevarlos
escritos. Los valores viven en `data/story/i18n/{en,es}.json` y se obtienen con
`textosDeComponentes(idioma)` de `src/game/i18n.ts`, que devuelve un objeto `clave -> texto`.

- Inglés es el idioma base y el respaldo.
- `{name}`, `{label}`, `{value}`, `{title}` y `{author}` se reemplazan al mostrar.
- Donde el componente usa el mismo texto para pantalla y voz (`data-voice-line`), basta una clave; las que
  terminan en `.voz` son solo para la voz.
- **Idioma en Ajustes:** `SettingsState.language: "en" | "es"`, por defecto `"en"`. El juego ya lo lee si existe.
- Los textos de licencias de `src/ui/content/credits.ts` quedan en inglés; hay que decidir si se traducen.
- Las dos claves `componente.carga.*` son para las pantallas en curso, que aún no están en esta rama.

| Clave | Inglés | Español | Dónde |
|---|---|---|---|
| `componente.hud.region` | Game HUD | Pantalla del juego | game-hud |
| `componente.hud.pausa` | Pause | Pausa | game-hud |
| `componente.hud.pausa.voz` | Pause the game. | Pausar el juego. | game-hud |
| `componente.hud.objetivo` | Objective | Objetivo | hud-molecules |
| `componente.hud.estado` | {name} status | Estado de {name} | hud-molecules |
| `componente.hud.zona` | Current zone | Zona actual | hud-molecules |
| `componente.hud.mapa` | Map | Mapa | hud-molecules |
| `componente.dialogo.habla` | {name} is talking | {name} está hablando | crew-dialogue |
| `componente.dialogo.siguiente` | Next | Siguiente | crew-dialogue |
| `componente.dialogo.siguiente.voz` | Next. | Siguiente. | crew-dialogue |
| `componente.pausa.dialogo` | Game paused | Juego en pausa | pause-menu |
| `componente.pausa.opciones` | Options | Opciones | pause-menu |
| `componente.pausa.situacion` | Current status | Situación actual | pause-menu |
| `componente.pausa.pausado` | Paused | En pausa | pause-menu |
| `componente.pausa.mision` | Mission | Misión | pause-menu |
| `componente.ajustes.titulo` | Settings | Ajustes | settings-menu |
| `componente.ajustes.secciones` | Settings sections | Secciones de ajustes | settings-menu |
| `componente.ajustes.guardado` | Changes save by themselves | Los cambios se guardan solos | settings-menu |
| `componente.ajustes.sonido` | Sound | Sonido | settings-menu |
| `componente.ajustes.jugar` | Play | Jugar | settings-menu |
| `componente.ajustes.adultos` | Grown-ups | Adultos | settings-menu |
| `componente.ajustes.musica` | Music | Música | settings-menu |
| `componente.ajustes.voces` | Voices | Voces | settings-menu |
| `componente.ajustes.efectos` | Sounds | Efectos | settings-menu |
| `componente.ajustes.volumen` | {label} volume | Volumen de {label} | hud-stepper |
| `componente.ajustes.bajar` | {label} quieter | Bajar {label} | hud-stepper |
| `componente.ajustes.subir` | {label} louder | Subir {label} | hud-stepper |
| `componente.ajustes.nivel` | {value} of 4 | {value} de 4 | hud-stepper |
| `componente.ajustes.apagado` | Off | Apagado | hud-stepper |
| `componente.ajustes.apagado.voz` | {label} is off. | {label}: apagado. | hud-stepper |
| `componente.ajustes.idioma` | Language | Idioma | settings-menu (nuevo, B1) |
| `componente.ajustes.reto` | Challenge | Reto | settings-menu |
| `componente.ajustes.facil` | Easy | Fácil | settings-menu |
| `componente.ajustes.facil.voz` | Easy: no clock, no numbers. | Fácil: sin reloj ni números. | settings-menu |
| `componente.ajustes.media` | Medium | Medio | settings-menu |
| `componente.ajustes.media.voz` | Medium: numbers appear. | Medio: aparecen los números. | settings-menu |
| `componente.ajustes.dificil` | Hard | Difícil | settings-menu |
| `componente.ajustes.dificil.voz` | Hard: the clock runs. | Difícil: corre el reloj. | settings-menu |
| `componente.ajustes.textoGrande` | Big text | Texto grande | settings-menu |
| `componente.ajustes.joystick` | Joystick side | Lado del joystick | settings-menu |
| `componente.ajustes.izquierda` | Left | Izquierda | settings-menu |
| `componente.ajustes.derecha` | Right | Derecha | settings-menu |
| `componente.ajustes.no` | Off | No | settings-menu |
| `componente.ajustes.si` | On | Sí | settings-menu |
| `componente.ajustes.hardcore` | Hardcore mode | Modo extremo | settings-menu |
| `componente.ajustes.mantener` | Hold for 3 seconds | Mantén 3 segundos | hud-hold-gate |
| `componente.ajustes.mantener.progreso` | Hold progress | Progreso al mantener | hud-hold-gate |
| `componente.ajustes.reiniciar` | Reset progress | Borrar avance | settings-menu |
| `componente.ajustes.reiniciar.pregunta` | Erase your saved progress? | ¿Borrar tu avance guardado? | settings-menu |
| `componente.ajustes.conservar` | Keep my game | Conservar mi juego | settings-menu |
| `componente.ajustes.borrar` | Erase everything | Borrar todo | settings-menu |
| `componente.ajustes.creditos` | Credits | Créditos | settings-menu |
| `componente.ajustes.creditos.volver` | Back to Grown-ups | Volver a Adultos | settings-menu |
| `componente.ajustes.creditos.autor` | {title} by {author} | {title}, de {author} | settings-menu |
| `componente.ajustes.volver` | Back | Volver | settings-menu |
| `componente.carga.cargando` | Loading | Cargando | pantalla de carga (en curso) |
| `componente.carga.guardado` | Your game is saved | Tu juego está guardado | pantalla de carga (en curso) |
