import type { UIRegistry } from "../registry";
import { asRecord, pickEnum } from "../types";
import { createIcon, UI_ICON_NAMES } from "./icons";

export const uiColors = {
  primary: {
    50: "#faebeb", 100: "#efc0c0", 200: "#e7a2a2", 300: "#db7878", 400: "#d55d5d",
    500: "#ca3535", 600: "#b83030", 700: "#8f2626", 800: "#6f1d1d", 900: "#551616",
  },
  neutral: {
    50: "#fafafa", 100: "#f5f5f5", 200: "#e5e5e5", 300: "#d4d4d4", 400: "#a3a3a3",
    500: "#737373", 600: "#525252", 700: "#404040", 800: "#262626", 900: "#171717",
  },
  warning: { 100: "#fff4cc", 300: "#ffd966", 500: "#ffb800", 700: "#b85c00", 900: "#332100" },
  error: { 100: "#ffd6e6", 300: "#ff4d80", 500: "#e6004c", 700: "#7d0036", 900: "#330014" },
  success: { 100: "#e0ffd9", 300: "#8cff66", 500: "#30dd10", 700: "#1e6600", 900: "#0d2600" },
  info: { 100: "#d6ffff", 300: "#66ffff", 500: "#00c3c3", 700: "#004666", 900: "#002433" },
  neonViolet: { 100: "#f2e0ff", 300: "#d580ff", 500: "#a020f0", 700: "#4d0080", 900: "#1a0026" },
} as const;

export const uiTypography = [
  { id: "h1", label: "Heading 1", family: "display", sizePx: 96, linePx: 110, weight: 700, tracking: "0.04em" },
  { id: "h2", label: "Heading 2", family: "display", sizePx: 60, linePx: 67.5, weight: 700, tracking: "0em" },
  { id: "h3", label: "Heading 3", family: "display", sizePx: 48, linePx: 54, weight: 500, tracking: "0em" },
  { id: "h4", label: "Heading 4", family: "display", sizePx: 34, linePx: 38.25, weight: 500, tracking: "0em" },
  { id: "h5", label: "Heading 5", family: "display", sizePx: 24, linePx: 27, weight: 500, tracking: "0em" },
  { id: "h6", label: "Heading 6", family: "display", sizePx: 20, linePx: 30, weight: 500, tracking: "0em" },
  { id: "subtitle-1", label: "Subtitle 1", family: "display", sizePx: 16, linePx: 24, weight: 500, tracking: "0em" },
  { id: "subtitle-2", label: "Subtitle 2", family: "display", sizePx: 14, linePx: 20, weight: 500, tracking: "0.02em" },
  { id: "body-1", label: "Body 1", family: "body", sizePx: 16, linePx: 24, weight: 400, tracking: "0em" },
  { id: "body-2", label: "Body 2", family: "body", sizePx: 14, linePx: 20, weight: 400, tracking: "0em" },
  { id: "button-1", label: "Button 1", family: "body", sizePx: 16, linePx: 24, weight: 500, tracking: "0.0125em" },
  { id: "button-2", label: "Button 2", family: "body", sizePx: 14, linePx: 20, weight: 500, tracking: "0.0125em" },
  { id: "caption", label: "Caption", family: "body", sizePx: 12, linePx: 16, weight: 500, tracking: "0.04em" },
] as const;

export const uiSpacing = [
  { token: "spacing-0", px: 0 }, { token: "spacing-1 [xxs]", px: 2 },
  { token: "spacing-2 [xs]", px: 4 }, { token: "spacing-3 [sm]", px: 8 },
  { token: "spacing-4 [md]", px: 12 }, { token: "spacing-5 [lg]", px: 16 },
  { token: "spacing-6 [xl]", px: 24 }, { token: "spacing-7 [2xl]", px: 32 },
  { token: "spacing-8 [3xl]", px: 40 }, { token: "spacing-9 [4xl]", px: 48 },
  { token: "spacing-10 [5xl]", px: 64 }, { token: "spacing-11 [6xl]", px: 80 },
  { token: "spacing-12 [7xl]", px: 96 }, { token: "spacing-13 [8xl]", px: 160 },
] as const;

type PaletteGroup = keyof typeof uiColors | "all";
interface ColorParams { group: PaletteGroup }
interface IconGroupParams { category: "all" | "arrows" | "media" | "utility" }
interface EmptyParams { compact?: boolean }

export function registerFoundationComponents(registry: UIRegistry): void {
  registry.register<ColorParams>("UI-FOUNDATION-COLORS", {
    metadata: {
      layer: "foundation",
      name: "Color System",
      figmaNodeId: "45:2067",
      description: "Primary Mars Crimson, Neutral scale, and five semantic HUD scales.",
    },
    variants: {
      all: { group: "all" },
      primary: { group: "primary" },
      semantic: { group: "info" },
    },
    parse(input) {
      const rec = asRecord(input);
      return {
        group: pickEnum(
          rec.group,
          ["all", "primary", "neutral", "warning", "error", "success", "info", "neonViolet"] as const,
          "all",
          "group",
        ),
      };
    },
    render({ group }) {
      const wrap = document.createElement("div");
      wrap.className = "ui-foundation-grid";
      const groups = group === "all"
        ? (Object.keys(uiColors) as (keyof typeof uiColors)[])
        : [group];
      for (const scaleName of groups) {
        for (const [step, hex] of Object.entries(uiColors[scaleName])) {
          const card = document.createElement("div");
          card.className = "ui-swatch-card";
          const chip = document.createElement("div");
          chip.className = "ui-swatch-chip";
          chip.style.background = hex;
          const meta = document.createElement("div");
          meta.className = "ui-swatch-meta";
          meta.textContent = `${scaleName}-${step} · ${hex.toUpperCase()}`;
          card.append(chip, meta);
          wrap.append(card);
        }
      }
      return wrap;
    },
  });

  registry.register<EmptyParams>("UI-FOUNDATION-TYPOGRAPHY", {
    metadata: {
      layer: "foundation",
      name: "Typography Scale",
      figmaNodeId: "1:11",
      description: "Nippo geometric display titles paired with Exo 2 functional UI copy.",
    },
    variants: { compact: { compact: true }, full: { compact: false } },
    parse(input) {
      const rec = asRecord(input);
      return { compact: Boolean(rec.compact ?? true) };
    },
    render({ compact }) {
      const stack = document.createElement("div");
      stack.className = "ui-type-stack";
      const list = compact ? uiTypography.slice(3) : uiTypography;
      for (const spec of list) {
        const row = document.createElement("div");
        row.className = "ui-type-row";
        const sample = document.createElement("span");
        sample.textContent = `${spec.label} — Mars Colony HUD`;
        sample.style.fontFamily = spec.family === "display" ? "var(--ui-font-display)" : "var(--ui-font-body)";
        sample.style.fontSize = `${Math.min(spec.sizePx, compact ? 34 : 56)}px`;
        sample.style.fontWeight = String(spec.weight);
        sample.style.letterSpacing = spec.tracking;
        if (spec.id.startsWith("button") || spec.id === "caption") sample.style.textTransform = "uppercase";
        const meta = document.createElement("span");
        meta.className = "ui-swatch-meta";
        meta.textContent = `${spec.sizePx}/${spec.linePx}px · w${spec.weight}`;
        row.append(sample, meta);
        stack.append(row);
      }
      return stack;
    },
  });

  registry.register<EmptyParams>("UI-FOUNDATION-SPACING", {
    metadata: {
      layer: "foundation",
      name: "Spacing Tokens",
      figmaNodeId: "1:13",
      description: "14-step spacing scale from 0px to 160px plus semantic layout/inline gaps.",
    },
    variants: { scale: { compact: false } },
    parse() { return { compact: false }; },
    render() {
      const stack = document.createElement("div");
      stack.className = "ui-space-stack";
      for (const step of uiSpacing) {
        const row = document.createElement("div");
        row.className = "ui-space-row";
        const name = document.createElement("span");
        name.textContent = step.token;
        const val = document.createElement("span");
        val.textContent = `${step.px}px`;
        const bar = document.createElement("div");
        bar.className = "ui-space-bar";
        bar.style.width = `${Math.max(step.px, 2)}px`;
        row.append(name, val, bar);
        stack.append(row);
      }
      return stack;
    },
  });

  registry.register<IconGroupParams>("UI-FOUNDATION-ICONS", {
    metadata: {
      layer: "foundation",
      name: "Icon System (39 Symbols)",
      figmaNodeId: "1:12",
      description: "24x24 geometric sci-fi symbols across Arrows, Media/Search, and Utility.",
    },
    variants: {
      all: { category: "all" },
      arrows: { category: "arrows" },
      utility: { category: "utility" },
    },
    parse(input) {
      const rec = asRecord(input);
      return {
        category: pickEnum(rec.category, ["all", "arrows", "media", "utility"] as const, "all", "category"),
      };
    },
    render({ category }) {
      const grid = document.createElement("div");
      grid.className = "ui-icon-grid";
      const filtered = UI_ICON_NAMES.filter(name => {
        if (category === "arrows") return name.startsWith("arrow-");
        if (category === "media") {
          return name.includes("volume") || name === "microphone" || name.startsWith("search") || name.startsWith("eye");
        }
        if (category === "utility") {
          return !name.startsWith("arrow-") && !name.includes("volume")
            && name !== "microphone" && !name.startsWith("search") && !name.startsWith("eye");
        }
        return true;
      });
      for (const iconName of filtered) {
        const cell = document.createElement("div");
        cell.className = "ui-icon-cell";
        const label = document.createElement("span");
        label.textContent = iconName;
        cell.append(createIcon(iconName, { size: 24 }), label);
        grid.append(cell);
      }
      return grid;
    },
  });
}
