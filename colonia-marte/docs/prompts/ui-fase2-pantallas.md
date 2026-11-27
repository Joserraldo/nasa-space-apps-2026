# UI phase 2: every screen still missing, with motion and options

Folder `colonia-marte-visual-ui`, branch `ui-kids`, port 5192. No commits. All rules in `codex-ui-ajustes.md` (section 4), `codex-ui-completa.md` and `ui-auditoria-b1-b5-b4.md` still apply. In particular:
- compose from the kit;
- tokens only;
- 64 and 48 px targets;
- at most 3 options per screen (R6);
- every piece of text carries a voice line;
- **text arrives as a parameter** with keys from Santiago's contract (`docs/CLAVES-UI-santiago.md`, `componente.*` prefix; new keys are listed in `docs/ui-i18n-contrato.md` for Santiago to add);
- **`tools/audit-ui.mjs` covers every new screen and stays at 100% PASS**, in English and Spanish, with and without Big text.

**Containers and views stay separate:** every screen is presentational, with typed state and callbacks. **Santiago wires the logic** (engine, saving, account) in `src/game/`. If his logic already exists, read how the old UI used it so the state matches.

María Paula: «the UI is missing many more things, plus more movement and more options». This brief lists what the old React UI has (`ui/src/componentes` and `ui/src/pantallas` in the team repo, branch `develop`) and what Santiago's game needs.

## 1. Priority 1: what the first version needs (intro, C1 and C2)

| Screen | ID | What it does | Old UI to read |
|---|---|---|---|
| **Access: guest or account** | `UI-ORGANISM-ACCESS` | Two big buttons: **Play as guest** and **Log in**, plus a link to create an account. The account form takes a username (3 to 20 letters, digits or `_`) and a password (8 to 72): **no email, no personal data from children**. Errors in one short sentence, with an icon: name taken (409), invalid details (400), too many attempts (429). Guest: before leaving, a clear notice «If you leave, your progress will be lost». `autocomplete` on the fields; never ask anything except username and password | `Acceso.tsx`, `acceso.css`, issue #109, API in `infra/worker/README.md` |
| **Intro player (2D)** | `UI-ORGANISM-STORY-PLAYER` | Shows the intro illustrations (Codex is making them in `ws-cover`): an illustration, its text bar with voice (the approved dialogue bar or a narration variant), progress dots, **Skip intro** and **Continue**. Gentle parallax between layers and a slow Ken Burns, both off under reduced motion. Until the illustrations exist, use placeholders the same size | `Intro.tsx`, `Transicion.tsx` |
| **Crew radio** | `UI-ORGANISM-CREW-RADIO` | Crew radio messages during play (storm warnings, advice): a compact strip in a corner with the speaker's portrait, a short line with voice and a small signal indicator. It queues messages and never covers the center. Tapping it opens the full dialogue | PR #414 (crew radio), `DialogoExperto.tsx` |
| **Radiation dose meter** | `UI-MOLECULE-DOSIMETER` | Shows the crew's accumulated dose **as an object** (R2): a meter that fills, with safe, careful and danger zones. No numbers in Easy; numbers in mSv from Medium up. **C1 teaches shielding, so this is the key piece** | `Dosimetro.tsx`, `DosisEstimada.tsx` |
| **Solar storm alert** | `UI-ORGANISM-STORM-ALERT` | Full-screen alert when the storm arrives, with amber light and the decision (what to sacrifice, from C1), at most 3 cards with a drawing | `PantallaTormenta.tsx` |
| **Decision recorded** | `UI-MOLECULE-DECISION-TOAST` | Immediate, cheerful feedback after deciding (R5): what you chose and what it caused, in one sentence with an icon. Failing doesn't punish | `DecisionRegistrada.tsx` |
| **NASA source card** | `UI-MOLECULE-SOURCE-CARD` | «This really happened»: the real event or data with its short source (NASA, Curiosity RAD...), with a «See source» button for adults | `TarjetaFuente.tsx`, `DatosUsados.tsx` |
| **Landing site selection** | `UI-ORGANISM-SITE-PICKER` | C2: choose where to land, with 2 or 3 sites on a map of Jezero; each has an icon card (pros and cons as objects, not numbers in Easy) | `PantallaSitio.tsx`, `PantallaOrbita.tsx` |
| **Module building** | `UI-ORGANISM-MODULE-BUILDER` | C2: choose and place the first 2 modules. Cards with the module, what it consumes and what it produces (energy, air, food as objects) | `PantallaModulos.tsx` |
| **Iris hints and low-resource warnings** | `UI-MOLECULE-HUD-TOAST` | As described in `codex-ui-completa.md` §3.2 | `PreguntaDeIris.tsx` |
| **Touch controls** | `UI-ORGANISM-TOUCH-CONTROLS` | The joystick and action button redesigned in the kit (the joystick works today but has the old look). Side follows `joystickSide` | `ControlesTactiles.tsx` |

## 2. Priority 2: the rest of the campaign

| Screen | ID | Old UI |
|---|---|---|
| Colony map with teleport plus an accessible list | `UI-ORGANISM-COLONY-MAP` (`codex-ui-completa.md` §3.1) | `Mapa.tsx` |
| Explained word (R10) | `UI-MOLECULE-TERM` (§3.3) | `Glosario.tsx` |
| «What if...?»: explore the consequence of the option not taken | `UI-ORGANISM-WHAT-IF` | `QueSi.tsx` |
| Final screen with the chain of causes | `UI-ORGANISM-FINALE` (§3.4) | `PantallaFinal.tsx` |
| Optional written chat | `UI-ORGANISM-CREW-CHAT` (§3.5) | `Dialogos.tsx` |
| Dust overlay (C4) | `UI-ATOM-DUST` | `Polvo.tsx` |

## 3. Motion across the whole UI

María Paula asks for **more movement**. Before animating, read the `animate` skill and the `animate-element-entry-exit` and `animate-to-from-top-layer` guides in modern-web-guidance. Rules:

- **Every motion has a reason:** it explains where something comes from, confirms an action, or draws attention to what changed. Nothing moves just to decorate.
- **Entries and exits** for every panel and card: 180 to 280 ms, entry with ease-out and exit faster than entry. Panels come in from where they live (the HUD from its edge, the dialogue from below, alerts with a slight scale-up).
- **Feedback on every press:** the button sinks a little (scale 0.97, 100 ms) and the selection changes with a transition.
- **Meters** animate their changes (0.4 s) and **pulse** when they drop into danger.
- **Screen transitions** (menu to intro to chapter card to play): a short dissolve or diagonal sweep that echoes the slab, 300 to 450 ms.
- **Idle elements:** Iris blinks now and then, the radio indicator pulses gently, the active cyan light breathes slowly. Very subtle, so it doesn't distract.
- Animate only `transform`, `opacity` and `filter` (no layout).
- **`prefers-reduced-motion`:** everything becomes an instant change or a brief fade, and pulses become a static outline.
- Measure it: `tools/audit-ui.mjs` adds a check that no animation runs longer than 600 ms except loops, and that reduced motion turns them off.

## 4. More options in Settings

Without breaking R6 (3 rows per tab):
- **Sound tab:** add «Mute all» as a quick toggle in the header, not as a row.
- **Play tab:** Language (from B1), Challenge and Big text.
- **Grown-ups tab:** Joystick side, Hardcore, Reset progress, Credits, plus **Account** (who is signed in, Log out, or «Playing as guest», with a «Create account» button). Grown-ups is behind the gate and may have more rows: group them into two blocks with a subheading («Game» and «Account») so they still read clearly.

## 5. Order and delivery

1. Priority 1 in the table's order. Each screen gets a capture at desktop and mobile size, in English and Spanish, with its PASS in `audit-ui.mjs`.
2. Motion (section 3) across the whole UI, including the screens already approved, **without changing how they look at rest**.
3. Settings options (section 4).
4. Priority 2.

Pause for María Paula's review **after the access screen, the intro player and the crew radio**: those three set the tone for the rest. Report in `docs/capturas/ui-fase2-informe.md` with VERIFIED, NOT VERIFIED and Decisions. No commits.

## 6. Portraits in WebP (María Paula, 2026-11-26)

Codex made the new 2D portraits (the approved sheet): `tess`, `nia`, `vera`, `teo`, `iris`, `player` and `control`, each as **PNG 512x512 and WebP 256x256**, in `public/ui/portraits/` of branch `ws-cover`. The reviewer merges them into `ui-kids`. **Components and samples use the `.webp`** (about 11 KB versus about 45 KB, and identical at display size: the dialogue shows 112 CSS px, 224 on a dense screen). Change `CREW_SPEAKERS`, `TESS_DISPENSER_DIALOGUE` and any `portraits/*.png` to `.webp`, and add the samples `iris`, `player` and `control` (Mission Control, role «Mission Control», neutral cyan accent) for the dialogue matrix. Keep the PNGs only as a fallback source; don't load them.

## 7. Base CSS in its own file (comes first, before section 1)

UI phase 1 moved `src/style.css` to an async import and, along the way, deleted the base rules (`* { box-sizing }`, `html, body { margin:0; height:100%; overflow:hidden }`, `#app { height:100dvh; display:grid; grid-template-rows:auto minmax(0,1fr) }`). Body kept its default 8 px margin and NW-16 had a 128 px empty strip (Santiago reported it). The reviewer put them **inline in `index.html`** as an emergency patch on the `integration` branch. **That isn't the practice we want:** it leaves styles outside the `.css` files and creates two places to look for base rules.

Do it right:
- Create `src/ui/foundation/base.css` with those base rules (and any other element-level reset the app needs), using tokens where they apply.
- Import it **synchronously as the first line of `src/main.ts`** (`import "./ui/foundation/base.css";`), before the async import of `style.css` and the loader. Vite extracts it into a `<link>` in the build's `<head>`.
- `index.html` keeps **no** `<style>` blocks. If `ui-kids` has one, remove it, and say in the report that the reviewer will drop the inline patch from `integration` when merging.
- Check in the browser with an existing script (not a new window per check):
  - `body` margin 0;
  - the canvas reaching the bottom edge (or the metrics bar on review pages);
  - no regression in CLS or in the loader's first-paint time (phase 1: under 100 ms, CLS ≤ 0.01).
- From now on **only the UI session (OpenCode) edits the UI**. The reviewer doesn't touch UI files; it only measures and reviews.
