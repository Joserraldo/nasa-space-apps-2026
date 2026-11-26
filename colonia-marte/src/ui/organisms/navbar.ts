import { createButton } from "../atoms/button";
import type { UIRegistry } from "../registry";
import { asRecord, pickString } from "../types";

let navSeq = 0;

export interface UINavItem {
  label: string;
  href: string;
  current?: boolean;
}

export interface UINavbarParams {
  eyebrow: string;
  title: string;
  ariaLabel: string;
  items: readonly UINavItem[];
}

export const DEFAULT_APP_NAV_ITEMS = (activePath: string): UINavItem[] => [
  { label: "Base scene", href: "/", current: activePath === "" || activePath === "/" },
  { label: "Catalog", href: "/catalog", current: activePath === "/catalog" },
  { label: "Materials", href: "/materials", current: activePath === "/materials" },
  { label: "UI Kit", href: "/ui", current: activePath === "/ui" },
];

export function parseNavbarParams(input: unknown): UINavbarParams {
  const rec = asRecord(input);
  const rawItems = Array.isArray(rec.items) && rec.items.length
    ? rec.items
    : DEFAULT_APP_NAV_ITEMS("/ui");
  const items = rawItems.map((entry, idx) => {
    const obj = asRecord(entry);
    return {
      label: pickString(obj.label, `Route ${idx + 1}`, "items.label"),
      href: pickString(obj.href, "/", "items.href"),
      current: Boolean(obj.current),
    };
  });
  return {
    eyebrow: pickString(rec.eyebrow, "MARS COLONY / VISUAL SYSTEMS", "eyebrow"),
    title: pickString(rec.title, "Sci-fi UI Kit", "title"),
    ariaLabel: pickString(rec.ariaLabel, "Primary", "ariaLabel"),
    items,
  };
}

export function createNavbar(params: Partial<UINavbarParams> = {}): HTMLElement {
  const parsed = parseNavbarParams(params);
  navSeq += 1;
  const menuId = `ui-nav-menu-${navSeq}`;

  const header = document.createElement("header");
  header.className = "ui-navbar";

  const brand = document.createElement("div");
  brand.className = "ui-navbar__brand";
  const brandText = document.createElement("div");
  const eyebrow = document.createElement("p");
  eyebrow.className = "ui-navbar__eyebrow eyebrow";
  eyebrow.textContent = parsed.eyebrow;
  const heading = document.createElement("h1");
  heading.className = "ui-navbar__title";
  heading.textContent = parsed.title;
  brandText.append(eyebrow, heading);
  brand.append(brandText);

  const nav = document.createElement("nav");
  nav.className = "ui-navbar__nav is-wide";
  nav.setAttribute("aria-label", parsed.ariaLabel);

  const toggle = createButton({
    label: "Menu",
    style: "Secondary",
    size: "Medium",
    prefixIcon: "scan-frame-01",
  });
  toggle.classList.add("ui-navbar__toggle");
  toggle.setAttribute("popovertarget", menuId);

  const list = document.createElement("ul");
  list.id = menuId;
  list.className = "ui-navbar__list";

  for (const item of parsed.items) {
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.className = "ui-nav-link";
    link.href = item.href;
    link.textContent = item.label;
    if (item.current) link.setAttribute("aria-current", "page");
    li.append(link);
    list.append(li);
  }

  /* Responsive measurement per modern-web-guidance: navbar (setAttribute/removeAttribute("popover")) */
  const syncLayout = () => {
    if (!nav.isConnected) return;
    nav.classList.add("is-wide");
    list.removeAttribute("popover");
    const fitsInline = nav.clientWidth === 0 || list.scrollWidth <= nav.clientWidth;
    if (!fitsInline) {
      nav.classList.remove("is-wide");
      list.setAttribute("popover", "auto");
    }
  };

  if (typeof ResizeObserver !== "undefined") {
    const observer = new ResizeObserver(() => syncLayout());
    observer.observe(nav);
  }
  queueMicrotask(syncLayout);

  nav.append(toggle, list);
  header.append(brand, nav);
  return header;
}

export function registerNavbarOrganism(registry: UIRegistry): void {
  registry.register<UINavbarParams>("UI-ORGANISM-NAVBAR", {
    metadata: {
      layer: "organism",
      name: "HUD Navigation Bar",
      figmaNodeId: "4009:1777",
      description: "Primary header landmark with circuit brand frame, active underline, and popover overflow.",
    },
    variants: {
      colonyPrimary: parseNavbarParams({
        eyebrow: "MARS COLONY / VISUAL SYSTEMS",
        title: "Kit catalog",
        items: DEFAULT_APP_NAV_ITEMS("/catalog"),
      }),
      opsHud: parseNavbarParams({
        eyebrow: "RING A / TELEMETRY",
        title: "Habitat Command",
        items: [
          { label: "Overview", href: "#overview", current: true },
          { label: "Life Support", href: "#life" },
          { label: "Airlocks", href: "#airlocks" },
          { label: "Diagnostics", href: "#diag" },
        ],
      }),
    },
    parse: parseNavbarParams,
    render: createNavbar,
  });
}
