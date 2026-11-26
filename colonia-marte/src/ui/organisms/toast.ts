import { createIcon, type UIIconInput } from "../foundation/icons";
import { announcePolite } from "../foundation/validation";
import type { UIRegistry } from "../registry";
import { asRecord, pickBoolean, pickEnum, pickNumber, pickString } from "../types";

export const TOAST_TYPES = ["Primary", "Neutral", "Warning", "Error", "Information", "Success"] as const;
export type UIToastType = (typeof TOAST_TYPES)[number];

const TOAST_ICON: Record<UIToastType, UIIconInput> = {
  Primary: "warning",
  Error: "warning",
  Warning: "warning-filled",
  Neutral: "settings",
  Information: "clock-02",
  Success: "check",
};

export interface UIToastParams {
  title: string;
  description: string;
  type: UIToastType;
  durationMs: number;
  inlinePreview: boolean;
  triggerElement?: HTMLElement | null;
}

export function parseToastParams(input: unknown): UIToastParams {
  const rec = asRecord(input);
  return {
    title: pickString(rec.title, "Atmospheric Seal Verified", "title"),
    description: pickString(
      rec.description,
      "Airlock NW-02 pressure equalized to 101.3 kPa across all habitat bulkheads.",
      "description",
    ),
    type: pickEnum(rec.type, TOAST_TYPES, "Primary", "type"),
    durationMs: pickNumber(rec.durationMs, 6000, "durationMs", 0, 120000),
    inlinePreview: pickBoolean(rec.inlinePreview, true, "inlinePreview"),
    triggerElement: rec.triggerElement instanceof HTMLElement ? rec.triggerElement : null,
  };
}

export function ensureToastRegion(root: HTMLElement = document.body): HTMLElement {
  const existing = root.querySelector<HTMLElement>("#ui-toast-region");
  if (existing) return existing;
  const region = document.createElement("div");
  region.id = "ui-toast-region";
  region.className = "ui-toast-region";
  region.setAttribute("role", "region");
  region.setAttribute("aria-label", "Notifications");
  root.append(region);
  return region;
}

function restackOpenToasts(region: HTMLElement): void {
  const openToasts = [...region.querySelectorAll<HTMLElement>(".ui-toast")];
  let offset = 20;
  for (const item of openToasts) {
    item.style.setProperty("--ui-toast-offset", `${offset}px`);
    offset += (item.offsetHeight || 118) + 12;
  }
}

export function createToastElement(
  params: Partial<UIToastParams> = {},
  onDismiss?: (manual: boolean) => void,
): HTMLElement {
  const parsed = parseToastParams(params);
  const toast = document.createElement("div");
  toast.className = `ui-toast ui-toast--${parsed.type.toLowerCase()}`;
  if (!parsed.inlinePreview) {
    /* Persistent manual popover per modern-web-guidance: persistent-toast-notifications */
    toast.setAttribute("popover", "manual");
  }

  const header = document.createElement("div");
  header.className = "ui-toast__header";
  const heading = document.createElement("p");
  heading.className = "ui-toast__title";
  heading.textContent = parsed.title;

  const closeBtn = document.createElement("button");
  closeBtn.type = "button";
  closeBtn.className = "ui-toast__close ui-focusable";
  closeBtn.setAttribute("aria-label", `Dismiss ${parsed.title} notification`);
  closeBtn.append(createIcon("close", { size: 16 }));
  closeBtn.addEventListener("click", () => {
    if (onDismiss) onDismiss(true);
    else toast.remove();
  });
  header.append(heading, closeBtn);

  const rule = document.createElement("div");
  rule.className = "ui-toast__rule";
  rule.setAttribute("aria-hidden", "true");

  const body = document.createElement("div");
  body.className = "ui-toast__body";
  const iconWrap = document.createElement("span");
  iconWrap.className = "ui-toast__icon";
  iconWrap.append(createIcon(TOAST_ICON[parsed.type], { size: 22 }));
  const desc = document.createElement("span");
  desc.textContent = parsed.description;
  body.append(iconWrap, desc);

  toast.append(header, rule, body);
  return toast;
}

export function showToast(params: Partial<UIToastParams> = {}): HTMLElement {
  const parsed = parseToastParams({ ...params, inlinePreview: false });
  const region = ensureToastRegion();
  let timerId: ReturnType<typeof setTimeout> | null = null;
  let closed = false;

  const clearTimer = () => {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  const dismiss = (manual: boolean) => {
    if (closed) return;
    closed = true;
    clearTimer();
    const hadFocusInside = toast.contains(document.activeElement);
    const hidePopover = (toast as HTMLElement & { hidePopover?: () => void }).hidePopover;
    if (typeof hidePopover === "function") {
      try { hidePopover.call(toast); } catch { /* ignore unsupported JSDOM */ }
    }
    toast.remove();
    restackOpenToasts(region);
    if (manual && hadFocusInside && parsed.triggerElement) {
      parsed.triggerElement.focus();
    }
  };

  const startTimer = () => {
    clearTimer();
    if (parsed.durationMs > 0) {
      timerId = setTimeout(() => dismiss(false), parsed.durationMs);
    }
  };

  const toast = createToastElement(parsed, dismiss);
  toast.addEventListener("focusin", clearTimer);
  toast.addEventListener("mouseenter", clearTimer);
  toast.addEventListener("focusout", event => {
    const next = event.relatedTarget as Node | null;
    if (!next || !toast.contains(next)) startTimer();
  });
  toast.addEventListener("mouseleave", () => {
    if (!toast.contains(document.activeElement)) startTimer();
  });

  region.append(toast);
  const openPopover = (toast as HTMLElement & { showPopover?: () => void }).showPopover;
  if (typeof openPopover === "function") {
    try { openPopover.call(toast); } catch { /* ignore unsupported JSDOM */ }
  }
  restackOpenToasts(region);
  announcePolite(`${parsed.title}. ${parsed.description}`);
  startTimer();
  return toast;
}

export function registerToastOrganism(registry: UIRegistry): void {
  registry.register<UIToastParams>("UI-ORGANISM-TOAST", {
    metadata: {
      layer: "organism",
      name: "HUD Toast Notification",
      figmaNodeId: "4009:2927",
      description: "Glassmorphic popover=\"manual\" notification with HUD corner brackets and six semantic themes.",
    },
    variants: {
      primary: parseToastParams({
        type: "Primary", title: "Sector Telemetry Synced",
        description: "All 30 P1 station and Mars pieces verified against budget.",
      }),
      information: parseToastParams({
        type: "Information", title: "Scheduled Solar Conjunction",
        description: "High-gain orbital relay switching to buffered packet mode in 14 minutes.",
      }),
      warning: parseToastParams({
        type: "Warning", title: "Dust Opacity Rising",
        description: "Regional tau index reached 1.8 near Jezero perimeter.",
      }),
      error: parseToastParams({
        type: "Error", title: "Airlock Interlock Fault",
        description: "Outer hatch seal sensor NW-02-D01 requires manual inspection.",
      }),
      success: parseToastParams({
        type: "Success", title: "Hydroponic Tray Harvest Ready",
        description: "Rack NW-05-P01 stage 4 biomass target achieved.",
      }),
      neutral: parseToastParams({
        type: "Neutral", title: "Renderer Profile Updated",
        description: "Balanced resolution governor active at 60 FPS target.",
      }),
    },
    parse: parseToastParams,
    render: params => createToastElement(params),
  });
}
