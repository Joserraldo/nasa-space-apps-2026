import type { CrewDialogueState, CrewSpeaker } from "./crew-dialogue";
import { TESS_DISPENSER_DIALOGUE } from "./crew-dialogue";

/**
 * Crew speakers with their role accents. Tess and Nia use the accents measured on the v1 frames
 * (palette.json); Vera and Teo use lighter tints of their measured accents (#7E312F, #566EA5), which are
 * too dark to read as text on the dark panel (WCAG AA 4.5:1 is checked in tests/unit/ui-hud.test.ts).
 */
export const CREW_SPEAKERS: Record<"tess" | "nia" | "vera" | "teo", CrewSpeaker> = {
  tess: { id: "tess", name: "Tess", role: "Engineer", portrait: "/ui/portraits/tess.png", accent: "#D9A04E" },
  nia: { id: "nia", name: "Nia", role: "Doctor", portrait: "/ui/portraits/nia.png", accent: "#75CEBA" },
  vera: { id: "vera", name: "Vera", role: "Solar expert", portrait: "/ui/portraits/vera.png", accent: "#CC5E58" },
  teo: { id: "teo", name: "Teo", role: "Mathematician", portrait: "/ui/portraits/teo.png", accent: "#6F8BC7" },
};

/**
 * Layout test matrix for the dialogue: short and long lines, paged lines, two or three replies,
 * long labels and every speaker. Used by /hud-preview?dialogue=<key> and tools/capture-hud.mjs.
 */
export const DIALOGUE_SAMPLES: Record<string, CrewDialogueState> = {
  medium: TESS_DISPENSER_DIALOGUE,
  short: {
    speaker: CREW_SPEAKERS.teo,
    line: "Five fuses left. Enough!",
    voiceLine: "Five fuses left. Enough!",
    replies: [
      { id: "yes", label: "Great", glyph: "objective", voiceLine: "Great." },
      { id: "count", label: "Count again", glyph: "battery", voiceLine: "Count again." },
    ],
  },
  long: {
    speaker: CREW_SPEAKERS.vera,
    line: "A solar flare is coming in two sols. It is a big one, I call it Sparky! The radiation will be strong outside. We need a safe place before it arrives.",
    voiceLine: "A solar flare is coming in two sols. It is a big one, I call it Sparky! The radiation will be strong outside. We need a safe place before it arrives.",
    replies: [
      { id: "shelter", label: "Go to the shelter", glyph: "shield", voiceLine: "Go to the radiation shelter." },
      { id: "measure", label: "Measure the radiation first", glyph: "objective", voiceLine: "Measure the radiation first." },
      { id: "iris", label: "Ask Iris", glyph: "robot", voiceLine: "Ask Iris what to do." },
    ],
  },
  labels: {
    speaker: CREW_SPEAKERS.nia,
    line: "Your suit has a small scratch. Let me check it.",
    voiceLine: "Your suit has a small scratch. Let me check it.",
    replies: [
      { id: "ok", label: "Okay, check my suit please", glyph: "shield", voiceLine: "Okay, check my suit please." },
      { id: "later", label: "Later, after lunch with the crew", glyph: "soup", voiceLine: "Later, after lunch with the crew." },
      { id: "plaster", label: "Put a plaster on Iris too", glyph: "robot", voiceLine: "Put a plaster on Iris too." },
    ],
  },
  sentence: {
    speaker: CREW_SPEAKERS.teo,
    line: "If the dome loses one percent of its air every hour and we have twenty hours of air left then we can wait for nineteen hours safely.",
    voiceLine: "If the dome loses one percent of its air every hour and we have twenty hours of air left then we can wait for nineteen hours safely.",
    replies: [{ id: "ok", label: "Got it", glyph: "objective", voiceLine: "Got it." }],
  },
};
