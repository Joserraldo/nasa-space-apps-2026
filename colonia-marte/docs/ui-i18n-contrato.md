# Contrato de idioma de la UI para Santiago

Los siete organismos de juego (HUD, pausa, diálogo, ajustes, menú, carga y tarjeta de capítulo) aceptan un `strings: Record<string, string>` opcional como último argumento. En el juego, pasa el resultado de `textosDeComponentes(settings.language)` desde `src/game/i18n.ts`. Si se omite, se usa inglés.

```ts
const strings = textosDeComponentes(settings.language);
const hud = createGameHud(state, onUse, onPause, strings);
const settingsMenu = createSettingsMenu(settings, options, strings);
```

- `SettingsState.language` vale `"en"` o `"es"`. Una partida anterior sin este campo sigue en inglés. La preferencia se guarda en `colonia.settings.v1` y las vistas previas la aplican a `<html lang>`.
- `src/ui/i18n/strings.en.ts` y `strings.es.ts` reproducen las 57 entradas de [CLAVES-UI-santiago.md](CLAVES-UI-santiago.md). La prueba de contrato cubre valores, claves faltantes y claves sobrantes.
- Las claves que terminan en `.voz` alimentan `data-voice-line`. Los componentes sustituyen `{name}`, `{label}`, `{value}`, `{title}` y `{author}` al mostrar el texto. Los nombres propios, hechos de Marte y el contenido de cada diálogo siguen llegando como datos.

## Claves nuevas para sumar a los JSON

| Prefijo | Claves nuevas |
| --- | --- |
| `componente.ajustes.` | `adultos.explicacion`, `idioma.en`, `idioma.es` |
| `componente.menu.` | `titulo`, `continuar`, `nuevo` |
| `componente.carga.` | `progreso` |
| `componente.capitulo.` | `tarjeta`, `completo`, `empezar`, `siguiente`, `mapa`, `pendiente`, `logrado.voz`, `pendiente.voz`, `total.voz` |
| `componente.capitulo.{C1,C2,C3,C4,C5,Final}.` | `numero`, `titulo`, `leccion` |
| `componente.capitulo.objetivo.` | `shield`, `power`, `air`, `food`, `rescue`, `signal` |

Los valores para integrar están en [`strings.extra.ts`](../src/ui/i18n/strings.extra.ts). Las lecciones y los objetivos ingleses ya existen en [`chapters.ts`](../src/ui/content/chapters.ts). No se agregan claves de la vista de prueba al catálogo oficial sin listarlas aquí.
