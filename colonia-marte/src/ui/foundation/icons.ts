const SVG_NS = "http://www.w3.org/2000/svg";

export const UI_ICON_NAMES = [
  "arrow-right-01", "arrow-left-01", "arrow-up-01", "arrow-down-01",
  "arrow-right-02", "arrow-left-02", "arrow-up-02", "arrow-down-02",
  "arrow-right-03", "arrow-left-03", "arrow-up-03", "arrow-down-03",
  "arrow-right-04", "arrow-left-04", "arrow-up-04", "arrow-down-04",
  "volume-01", "volume-2", "full-volume", "mute-volume", "microphone",
  "search-01", "search-02", "eye-open", "eye-closed", "eye-hide",
  "check", "close", "add", "minus", "warning", "warning-filled",
  "clock-01", "clock-02", "settings", "cell-tower-1", "cell-tower-2",
  "scan-frame-01", "scan-frame-02",
] as const;

export type UIIconName = (typeof UI_ICON_NAMES)[number];
export type UIIconInput = UIIconName | "warninig";

interface IconSpec {
  paths: readonly { d: string; fill?: boolean }[];
  rotate?: number;
}

const ARROW_01 = [{ d: "M9 5L16 12L9 19" }];
const ARROW_02 = [{ d: "M5 12H10" }, { d: "M10 5L17 12L10 19" }];
const ARROW_03 = [{ d: "M6 5L13 12L6 19" }, { d: "M12 5L19 12L12 19" }];
const ARROW_04 = [{ d: "M8 5L18 12L8 19Z", fill: true }];

const ICON_SPECS: Readonly<Record<UIIconName, IconSpec>> = {
  "arrow-right-01": { paths: ARROW_01 },
  "arrow-down-01": { paths: ARROW_01, rotate: 90 },
  "arrow-left-01": { paths: ARROW_01, rotate: 180 },
  "arrow-up-01": { paths: ARROW_01, rotate: -90 },
  "arrow-right-02": { paths: ARROW_02 },
  "arrow-down-02": { paths: ARROW_02, rotate: 90 },
  "arrow-left-02": { paths: ARROW_02, rotate: 180 },
  "arrow-up-02": { paths: ARROW_02, rotate: -90 },
  "arrow-right-03": { paths: ARROW_03 },
  "arrow-down-03": { paths: ARROW_03, rotate: 90 },
  "arrow-left-03": { paths: ARROW_03, rotate: 180 },
  "arrow-up-03": { paths: ARROW_03, rotate: -90 },
  "arrow-right-04": { paths: ARROW_04 },
  "arrow-down-04": { paths: ARROW_04, rotate: 90 },
  "arrow-left-04": { paths: ARROW_04, rotate: 180 },
  "arrow-up-04": { paths: ARROW_04, rotate: -90 },
  "volume-01": { paths: [{ d: "M6 9H10L16 4V20L10 15H6Z", fill: true }] },
  "volume-2": {
    paths: [{ d: "M5 9H9L15 4V20L9 15H5Z", fill: true }, { d: "M18 9.5L19.5 12L18 14.5" }],
  },
  "full-volume": {
    paths: [
      { d: "M3 9H7L13 4V20L7 15H3Z", fill: true },
      { d: "M16 9.5L17.5 12L16 14.5" },
      { d: "M19.5 6.5L21.5 12L19.5 17.5" },
    ],
  },
  "mute-volume": {
    paths: [{ d: "M5 9H9L15 4V20L9 15H5Z", fill: true }, { d: "M7 4L19 20" }],
  },
  "microphone": {
    paths: [
      { d: "M10 4H14L15.5 6V12L14 14H10L8.5 12V6Z", fill: true },
      { d: "M5 11V16.5L7 18H17L19 16.5V11" },
      { d: "M12 18V21.5" },
    ],
  },
  "search-01": {
    paths: [{ d: "M11 3.5L17.5 7.2V14.8L11 18.5L4.5 14.8V7.2Z" }, { d: "M15.2 16.2L19.5 21" }],
  },
  "search-02": {
    paths: [{ d: "M12.5 3.5L19 7.2V14.8L12.5 18.5L6 14.8V7.2Z" }, { d: "M8.3 16.2L4.5 21" }],
  },
  "eye-open": {
    paths: [{ d: "M2.5 12L12 6.2L21.5 12L12 17.8Z" }, { d: "M11 9H13V15H11Z", fill: true }],
  },
  "eye-closed": {
    paths: [
      { d: "M2.5 12L12 6.5L21.5 12L12 17.5Z" },
      { d: "M12 17.5V20.5" }, { d: "M7 15.2L5.5 17.8" }, { d: "M17 15.2L18.5 17.8" },
    ],
  },
  "eye-hide": {
    paths: [
      { d: "M2.5 12L12 6.2L21.5 12L12 17.8Z" },
      { d: "M11 9H13V15H11Z", fill: true },
      { d: "M6.5 3.5L17.5 20.5" },
    ],
  },
  "check": { paths: [{ d: "M4.5 12.5L9.5 17.5L19.5 6.5" }] },
  "close": { paths: [{ d: "M6 6L18 18" }, { d: "M18 6L6 18" }] },
  "add": { paths: [{ d: "M12 5V19" }, { d: "M5 12H19" }] },
  "minus": { paths: [{ d: "M5 12H19" }] },
  "warning": {
    paths: [{ d: "M12 4L21 19.5H3Z" }, { d: "M12 9.5V14" }, { d: "M12 16.5V17.2" }],
  },
  "warning-filled": {
    paths: [
      { d: "M12 3.5L21.5 20H2.5ZM11.1 9.5V14.2H12.9V9.5ZM11.1 16V17.8H12.9V16Z", fill: true },
    ],
  },
  "clock-01": {
    paths: [
      { d: "M8.5 3.5H15.5L20.5 8.5V15.5L15.5 20.5H8.5L3.5 15.5V8.5Z" },
      { d: "M12 7.5V12.5H16" }, { d: "M12 17.5V20.5" }, { d: "M3.5 12H6.5" },
    ],
  },
  "clock-02": {
    paths: [
      { d: "M12 3.5L18 6L20.5 12L18 18L12 20.5L6 18L3.5 12L6 6Z" },
      { d: "M12 7.5V12.5L15.5 14.5" },
    ],
  },
  "settings": {
    paths: [
      {
        d: "M10.5 3H13.5L14.3 5.3L16.5 6.2L18.7 5.1L20.8 7.2L19.7 9.4L20.6 11.6L22.5 12.5L20.6 13.5L19.7 15.6L20.8 17.8L18.7 19.9L16.5 18.8L14.3 19.7L13.5 22H10.5L9.7 19.7L7.5 18.8L5.3 19.9L3.2 17.8L4.3 15.6L3.4 13.5L1.5 12.5L3.4 11.6L4.3 9.4L3.2 7.2L5.3 5.1L7.5 6.2L9.7 5.3Z",
      },
      { d: "M12 9L14.6 10.5V13.5L12 15L9.4 13.5V10.5Z" },
    ],
  },
  "cell-tower-1": {
    paths: [
      { d: "M3 19H5V21H3ZM7 16H9V21H7ZM11 13H13V21H11ZM15 10H17V21H15ZM19 4H21V21H19Z", fill: true },
    ],
  },
  "cell-tower-2": {
    paths: [{ d: "M3 19H5V21H3ZM8 16H10V21H8ZM13 10H15V21H13ZM18 4H20V21H18Z", fill: true }],
  },
  "scan-frame-01": {
    paths: [
      { d: "M3 9V3H9" }, { d: "M15 3H21V9" }, { d: "M21 15V21H15" }, { d: "M9 21H3V15" },
    ],
  },
  "scan-frame-02": {
    paths: [
      { d: "M3 8.5V3H8.5L7 4.8H4.8V7Z", fill: true },
      { d: "M15.5 3H21V8.5L19.2 7V4.8H17Z", fill: true },
      { d: "M21 15.5V21H15.5L17 19.2H19.2V17Z", fill: true },
      { d: "M8.5 21H3V15.5L4.8 17V19.2H7Z", fill: true },
    ],
  },
};

export interface CreateIconOptions {
  size?: number;
  label?: string;
  className?: string;
}

export function normalizeIconName(name: UIIconInput): UIIconName {
  return name === "warninig" ? "warning" : name;
}

export function createIcon(name: UIIconInput, options: CreateIconOptions = {}): SVGSVGElement {
  const canonical = normalizeIconName(name);
  const spec = ICON_SPECS[canonical];
  if (!spec) throw new Error(`Unknown UI icon: ${String(name)}`);

  const size = options.size ?? 24;
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("fill", "none");
  if (options.className) svg.setAttribute("class", options.className);
  if (options.label) {
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", options.label);
  } else {
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
  }

  const group = document.createElementNS(SVG_NS, "g");
  if (spec.rotate) group.setAttribute("transform", `rotate(${spec.rotate} 12 12)`);
  for (const part of spec.paths) {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", part.d);
    if (part.fill) {
      path.setAttribute("fill", "currentColor");
      path.setAttribute("fill-rule", "evenodd");
    } else {
      path.setAttribute("stroke", "currentColor");
      path.setAttribute("stroke-width", "1.8");
      path.setAttribute("stroke-linecap", "square");
      path.setAttribute("stroke-linejoin", "miter");
    }
    group.append(path);
  }
  svg.append(group);
  return svg;
}
