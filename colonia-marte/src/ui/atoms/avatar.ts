import { createIcon, type UIIconInput } from "../foundation/icons";
import type { UIRegistry } from "../registry";
import { asRecord, pickBoolean, pickEnum, pickString } from "../types";

const SVG_NS = "http://www.w3.org/2000/svg";
export const AVATAR_SIZES = ["Small", "Medium", "Large", "XLarge"] as const;
export const AVATAR_CONTENTS = ["Image", "Initial", "Icon"] as const;
export const AVATAR_STYLES = ["Strokes", "Fill"] as const;

export type UIAvatarSize = (typeof AVATAR_SIZES)[number];
export type UIAvatarContent = (typeof AVATAR_CONTENTS)[number];
export type UIAvatarStyle = (typeof AVATAR_STYLES)[number];

export interface UIAvatarParams {
  size: UIAvatarSize;
  content: UIAvatarContent;
  style: UIAvatarStyle;
  text: string;
  alt: string;
  icon: UIIconInput;
  imageUrl?: string;
}

export interface UIAvatarGroupParams {
  size: UIAvatarSize;
  hugging: boolean;
  overflowText: string;
}

const SIZE_CLASS: Record<UIAvatarSize, string> = {
  Small: "ui-avatar--sm",
  Medium: "ui-avatar--md",
  Large: "ui-avatar--lg",
  XLarge: "ui-avatar--xl",
};

const CREW_PORTRAIT_DATA_URI = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" fill="#18222d"/>
    <polygon points="32,8 52,20 52,44 32,56 12,44 12,20" fill="#ca3535" opacity="0.35"/>
    <circle cx="32" cy="25" r="10" fill="#f5f5f5"/>
    <path d="M15 56L22 40H42L49 56Z" fill="#66ffff"/>
  </svg>`,
)}`;

function buildAvatarFrame(style: UIAvatarStyle): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 64 64");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("class", "ui-avatar__frame");
  if (style === "Strokes") {
    const ring = document.createElementNS(SVG_NS, "circle");
    ring.setAttribute("cx", "32");
    ring.setAttribute("cy", "32");
    ring.setAttribute("r", "29");
    ring.setAttribute("fill", "none");
    ring.setAttribute("stroke", "currentColor");
    ring.setAttribute("stroke-width", "1.4");
    ring.setAttribute("stroke-dasharray", "36 8 44 8");
    const ticks = document.createElementNS(SVG_NS, "path");
    ticks.setAttribute("d", "M6 6L13 13M58 6L51 13M6 58L13 51M58 58L51 51");
    ticks.setAttribute("stroke", "currentColor");
    ticks.setAttribute("stroke-width", "1.4");
    svg.append(ring, ticks);
  } else {
    const badge = document.createElementNS(SVG_NS, "path");
    badge.setAttribute("d", "M32 3H56V15L61 20V32A29 29 0 0 1 24 60L10 55L18 52L8 47L15 45A29 29 0 0 1 32 3Z");
    badge.setAttribute("fill", "var(--ui-primary-600)");
    badge.setAttribute("opacity", "0.9");
    svg.append(badge);
  }
  return svg;
}

export function parseAvatarParams(input: unknown): UIAvatarParams {
  const rec = asRecord(input);
  return {
    size: pickEnum(rec.size, AVATAR_SIZES, "Medium", "size"),
    content: pickEnum(rec.content, AVATAR_CONTENTS, "Initial", "content"),
    style: pickEnum(rec.style, AVATAR_STYLES, "Strokes", "style"),
    text: pickString(rec.text, "A", "text"),
    alt: pickString(rec.alt, "Crew member", "alt"),
    icon: typeof rec.icon === "string" ? (rec.icon as UIIconInput) : "warning",
    imageUrl: typeof rec.imageUrl === "string" ? rec.imageUrl : undefined,
  };
}

export function createAvatar(params: Partial<UIAvatarParams> = {}): HTMLElement {
  const parsed = parseAvatarParams(params);
  const root = document.createElement("div");
  root.className = `ui-avatar ${SIZE_CLASS[parsed.size]} ${parsed.style === "Fill" ? "ui-avatar--fill" : ""}`.trim();
  root.append(buildAvatarFrame(parsed.style));

  const core = document.createElement("div");
  core.className = "ui-avatar__core";
  if (parsed.content === "Image") {
    const img = document.createElement("img");
    img.className = "ui-avatar__img";
    img.src = parsed.imageUrl ?? CREW_PORTRAIT_DATA_URI;
    img.alt = parsed.alt;
    core.append(img);
  } else if (parsed.content === "Icon") {
    const iconPx = parsed.size === "XLarge" ? 28 : parsed.size === "Large" ? 22 : parsed.size === "Medium" ? 16 : 13;
    core.append(createIcon(parsed.icon, { size: iconPx, label: parsed.alt }));
  } else {
    const span = document.createElement("span");
    span.textContent = parsed.text.slice(0, 3);
    root.setAttribute("role", "img");
    root.setAttribute("aria-label", `${parsed.alt}: ${parsed.text}`);
    core.append(span);
  }
  root.append(core);
  return root;
}

export function parseAvatarGroupParams(input: unknown): UIAvatarGroupParams {
  const rec = asRecord(input);
  return {
    size: pickEnum(rec.size, AVATAR_SIZES, "Medium", "size"),
    hugging: pickBoolean(rec.hugging, true, "hugging"),
    overflowText: pickString(rec.overflowText, "+9", "overflowText"),
  };
}

export function createAvatarGroup(params: Partial<UIAvatarGroupParams> = {}): HTMLElement {
  const parsed = parseAvatarGroupParams(params);
  const group = document.createElement("div");
  group.className = `ui-avatar-group ${parsed.hugging ? "ui-avatar-group--hugging" : ""}`.trim();
  group.setAttribute("role", "group");
  group.setAttribute("aria-label", "Assigned crew roster");
  group.append(
    createAvatar({ size: parsed.size, content: "Initial", style: "Strokes", text: "M", alt: "Commander M" }),
    createAvatar({ size: parsed.size, content: "Image", style: "Strokes", alt: "Engineer Vega" }),
    createAvatar({ size: parsed.size, content: "Icon", style: "Fill", icon: "settings", alt: "Systems bot" }),
    createAvatar({ size: parsed.size, content: "Initial", style: "Strokes", text: parsed.overflowText, alt: "More crew" }),
  );
  return group;
}

export function registerAvatarAtoms(registry: UIRegistry): void {
  registry.register<UIAvatarParams>("UI-ATOM-AVATAR", {
    metadata: {
      layer: "atom",
      name: "Crew Avatar",
      figmaNodeId: "4009:1301",
      description: "Circular HUD crew badge with reticle strokes or asymmetric sci-fi fill.",
    },
    variants: {
      strokesInitial: parseAvatarParams({ size: "Large", content: "Initial", style: "Strokes", text: "A" }),
      strokesImage: parseAvatarParams({ size: "Large", content: "Image", style: "Strokes" }),
      fillInitial: parseAvatarParams({ size: "Large", content: "Initial", style: "Fill", text: "M" }),
      fillIcon: parseAvatarParams({ size: "Medium", content: "Icon", style: "Fill", icon: "warning" }),
    },
    parse: parseAvatarParams,
    render: createAvatar,
  });

  registry.register<UIAvatarGroupParams>("UI-ATOM-AVATAR-GROUP", {
    metadata: {
      layer: "atom",
      name: "Avatar Group",
      figmaNodeId: "4009:1382",
      description: "Overlapping (hugging) or spaced crew avatar roster with overflow counter.",
    },
    variants: {
      huggingMedium: parseAvatarGroupParams({ size: "Medium", hugging: true, overflowText: "+9" }),
      spacedLarge: parseAvatarGroupParams({ size: "Large", hugging: false, overflowText: "+4" }),
    },
    parse: parseAvatarGroupParams,
    render: createAvatarGroup,
  });
}
