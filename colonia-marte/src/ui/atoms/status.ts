import { createIcon } from "../foundation/icons";
import type { UIRegistry } from "../registry";
import { asRecord, pickBoolean, pickEnum, pickString } from "../types";

export const TAG_TYPES = ["Primary", "Neutral", "Error", "Warning", "Information", "Success"] as const;
export const TAG_SIZES = ["Medium", "Large"] as const;
export const TAG_SHAPES = ["Cut Edge", "Rectangle", "Rounded"] as const;

export type UITagType = (typeof TAG_TYPES)[number];
export type UITagSize = (typeof TAG_SIZES)[number];
export type UITagShape = (typeof TAG_SHAPES)[number];

export interface UITagParams {
  label: string;
  type: UITagType;
  size: UITagSize;
  shape: UITagShape;
  stroke: boolean;
  dismissible: boolean;
}

export function parseTagParams(input: unknown): UITagParams {
  const rec = asRecord(input);
  return {
    label: pickString(rec.label, "Nominal", "label"),
    type: pickEnum(rec.type, TAG_TYPES, "Primary", "type"),
    size: pickEnum(rec.size, TAG_SIZES, "Medium", "size"),
    shape: pickEnum(rec.shape, TAG_SHAPES, "Cut Edge", "shape"),
    stroke: pickBoolean(rec.stroke, true, "stroke"),
    dismissible: pickBoolean(rec.dismissible, false, "dismissible"),
  };
}

export function createTag(params: Partial<UITagParams> = {}): HTMLElement {
  const parsed = parseTagParams(params);
  const tag = document.createElement("span");
  const classes = ["ui-tag", `ui-tag--${parsed.type.toLowerCase()}`];
  if (parsed.size === "Large") classes.push("ui-tag--lg");
  if (parsed.stroke) classes.push("ui-tag--stroke");
  if (parsed.shape === "Cut Edge") classes.push("ui-tag--cut");
  if (parsed.shape === "Rounded") classes.push("ui-tag--rounded");
  tag.className = classes.join(" ");

  const dot = document.createElement("span");
  dot.className = "ui-tag__dot";
  dot.setAttribute("aria-hidden", "true");

  const text = document.createElement("span");
  text.textContent = parsed.label;
  tag.append(dot, text);

  if (parsed.dismissible) {
    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.className = "ui-tag__dismiss ui-focusable";
    closeBtn.setAttribute("aria-label", `Remove ${parsed.label} tag`);
    closeBtn.append(createIcon("close", { size: 12 }));
    closeBtn.addEventListener("click", () => tag.remove());
    tag.append(closeBtn);
  }
  return tag;
}

export interface UILinkParams {
  label: string;
  href: string;
  style: "Default" | "onTheme";
  disabled: boolean;
}

export function parseLinkParams(input: unknown): UILinkParams {
  const rec = asRecord(input);
  return {
    label: pickString(rec.label, "Telemetry log", "label"),
    href: pickString(rec.href, "#telemetry", "href"),
    style: pickEnum(rec.style, ["Default", "onTheme"] as const, "Default", "style"),
    disabled: pickBoolean(rec.disabled, false, "disabled"),
  };
}

export function createLink(params: Partial<UILinkParams> = {}): HTMLAnchorElement {
  const parsed = parseLinkParams(params);
  const anchor = document.createElement("a");
  anchor.className = `ui-link ${parsed.style === "onTheme" ? "ui-link--theme" : ""}`.trim();
  anchor.textContent = parsed.label;
  if (parsed.disabled) {
    anchor.setAttribute("role", "link");
    anchor.setAttribute("aria-disabled", "true");
    anchor.addEventListener("click", event => event.preventDefault());
  } else {
    anchor.href = parsed.href;
  }
  return anchor;
}

export interface UILoaderParams {
  kind: "icon" | "text";
  size: "XSmall" | "Small" | "Medium" | "Large" | "XLarge" | "2XLarge";
  label: string;
}

const LOADER_PX: Record<UILoaderParams["size"], number> = {
  XSmall: 10, Small: 14, Medium: 20, Large: 26, XLarge: 32, "2XLarge": 40,
};

export function parseLoaderParams(input: unknown): UILoaderParams {
  const rec = asRecord(input);
  return {
    kind: pickEnum(rec.kind, ["icon", "text"] as const, "icon", "kind"),
    size: pickEnum(rec.size, ["XSmall", "Small", "Medium", "Large", "XLarge", "2XLarge"] as const, "Medium", "size"),
    label: pickString(rec.label, "Loading...", "label"),
  };
}

export function createLoader(params: Partial<UILoaderParams> = {}): HTMLElement {
  const parsed = parseLoaderParams(params);
  if (parsed.kind === "text") {
    const wrap = document.createElement("div");
    wrap.className = `ui-loader-text ${parsed.size === "Large" ? "ui-loader-text--lg" : ""}`.trim();
    wrap.setAttribute("role", "status");
    const left = document.createElement("span");
    left.className = "ui-loader-bracket ui-loader-bracket--left";
    left.setAttribute("aria-hidden", "true");
    left.append(document.createElement("span"), document.createElement("span"));
    const text = document.createElement("span");
    text.textContent = parsed.label;
    const right = document.createElement("span");
    right.className = "ui-loader-bracket ui-loader-bracket--right";
    right.setAttribute("aria-hidden", "true");
    right.append(document.createElement("span"), document.createElement("span"));
    wrap.append(left, text, right);
    return wrap;
  }

  const wrap = document.createElement("span");
  wrap.className = "ui-loader-icon";
  wrap.setAttribute("role", "status");
  wrap.setAttribute("aria-label", parsed.label);
  const px = LOADER_PX[parsed.size];
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(px));
  svg.setAttribute("height", String(px));
  svg.setAttribute("aria-hidden", "true");
  for (let index = 0; index < 8; index++) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.setAttribute("x", "11");
    rect.setAttribute("y", "1.5");
    rect.setAttribute("width", "2");
    rect.setAttribute("height", "5.5");
    rect.setAttribute("fill", "currentColor");
    rect.setAttribute("opacity", (0.18 + (index / 8) * 0.82).toFixed(2));
    rect.setAttribute("transform", `rotate(${index * 45} 12 12)`);
    svg.append(rect);
  }
  wrap.append(svg);
  return wrap;
}

export function registerStatusAtoms(registry: UIRegistry): void {
  registry.register<UITagParams>("UI-ATOM-TAG", {
    metadata: {
      layer: "atom",
      name: "Status Tag",
      figmaNodeId: "4037:747",
      description: "Cut-edge, rectangular, or rounded semantic badge across six HUD states.",
    },
    variants: {
      primaryCut: parseTagParams({ label: "P1 Kit", type: "Primary", shape: "Cut Edge" }),
      infoCut: parseTagParams({ label: "Pressurized", type: "Information", shape: "Cut Edge" }),
      successRect: parseTagParams({ label: "Validated", type: "Success", shape: "Rectangle" }),
      warningRounded: parseTagParams({ label: "Dust Advisory", type: "Warning", shape: "Rounded" }),
      errorDismissible: parseTagParams({ label: "Airlock Seal", type: "Error", dismissible: true }),
    },
    parse: parseTagParams,
    render: createTag,
  });

  registry.register<UILinkParams>("UI-ATOM-LINK", {
    metadata: {
      layer: "atom",
      name: "HUD Link",
      figmaNodeId: "131:1383",
      description: "Inline navigation link with neutral, theme, visited, and disabled states.",
    },
    variants: {
      default: parseLinkParams({ label: "Inspect Materials Atlas", href: "/materials" }),
      onTheme: parseLinkParams({ label: "Open Piece Catalog", href: "/catalog", style: "onTheme" }),
      disabled: parseLinkParams({ label: "Locked Sector", disabled: true }),
    },
    parse: parseLinkParams,
    render: createLink,
  });

  registry.register<UILoaderParams>("UI-ATOM-LOADER", {
    metadata: {
      layer: "atom",
      name: "Sci-fi Loader",
      figmaNodeId: "78:882",
      description: "Radial 8-spoke IconLoader and corner-bracketed Nippo TextLoader.",
    },
    variants: {
      iconMedium: parseLoaderParams({ kind: "icon", size: "Medium" }),
      iconXLarge: parseLoaderParams({ kind: "icon", size: "XLarge" }),
      textMedium: parseLoaderParams({ kind: "text", size: "Medium", label: "Loading..." }),
      textLarge: parseLoaderParams({ kind: "text", size: "Large", label: "Syncing HUD..." }),
    },
    parse: parseLoaderParams,
    render: createLoader,
  });
}
