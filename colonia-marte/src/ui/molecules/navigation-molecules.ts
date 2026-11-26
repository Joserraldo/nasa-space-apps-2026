import { createLink } from "../atoms/status";
import { createIcon } from "../foundation/icons";
import type { UIRegistry } from "../registry";
import { asRecord, pickBoolean, pickEnum, pickNumber, pickString } from "../types";

export interface UIBreadcrumbItem {
  label: string;
  href?: string;
}

export interface UIBreadcrumbsParams {
  items: readonly UIBreadcrumbItem[];
  collapseAfter: number;
}

export function parseBreadcrumbsParams(input: unknown): UIBreadcrumbsParams {
  const rec = asRecord(input);
  const rawItems = Array.isArray(rec.items) && rec.items.length >= 2
    ? rec.items
    : [
        { label: "Home", href: "/" },
        { label: "Catalog", href: "/catalog" },
        { label: "Station Architecture", href: "/catalog" },
        { label: "ST-W02 Window" },
      ];
  const items = rawItems.map((entry, idx) => {
    const obj = asRecord(entry);
    return {
      label: pickString(obj.label, `Level ${idx + 1}`, "items.label"),
      href: typeof obj.href === "string" ? obj.href : undefined,
    };
  });
  return {
    items,
    collapseAfter: pickNumber(rec.collapseAfter, 5, "collapseAfter", 3, 20),
  };
}

export function createBreadcrumbs(params: Partial<UIBreadcrumbsParams> = {}): HTMLElement {
  const parsed = parseBreadcrumbsParams(params);
  const nav = document.createElement("nav");
  nav.className = "ui-breadcrumbs";
  nav.setAttribute("aria-label", "Breadcrumb");

  const list = document.createElement("ol");
  list.className = "ui-breadcrumbs__list";

  let expanded = parsed.items.length <= parsed.collapseAfter;

  const renderItems = () => {
    list.replaceChildren();
    const total = parsed.items.length;
    const visible: (UIBreadcrumbItem | "ellipsis")[] = expanded
      ? [...parsed.items]
      : [parsed.items[0], "ellipsis", parsed.items[total - 2], parsed.items[total - 1]];

    visible.forEach((entry, idx) => {
      const li = document.createElement("li");
      li.className = "ui-breadcrumbs__item";
      const isLast = idx === visible.length - 1;

      if (entry === "ellipsis") {
        const expandBtn = document.createElement("button");
        expandBtn.type = "button";
        expandBtn.className = "ui-breadcrumbs__ellipsis ui-focusable";
        expandBtn.setAttribute("aria-label", "Show hidden breadcrumb levels");
        expandBtn.textContent = "...";
        expandBtn.addEventListener("click", () => {
          expanded = true;
          renderItems();
        });
        li.append(expandBtn);
      } else if (isLast || !entry.href) {
        const span = document.createElement("span");
        span.className = "ui-breadcrumbs__current";
        if (isLast) span.setAttribute("aria-current", "page");
        span.textContent = entry.label;
        li.append(span);
      } else {
        li.append(createLink({ label: entry.label, href: entry.href }));
      }

      if (!isLast) {
        li.append(createIcon("arrow-right-02", { size: 14 }));
      }
      list.append(li);
    });
  };

  renderItems();
  nav.append(list);
  return nav;
}

export interface UIPaginationParams {
  currentPage: number;
  totalPages: number;
  mode: "finite pages" | "Limited Pages";
  showDropdown: boolean;
  showTotalPages: boolean;
  onPageChange?: (page: number) => void;
}

export function parsePaginationParams(input: unknown): UIPaginationParams {
  const rec = asRecord(input);
  const totalPages = Math.max(1, Math.floor(pickNumber(rec.totalPages, 7, "totalPages", 1, 10000)));
  const currentPage = Math.min(
    totalPages,
    Math.max(1, Math.floor(pickNumber(rec.currentPage, 1, "currentPage", 1, 10000))),
  );
  return {
    currentPage,
    totalPages,
    mode: pickEnum(rec.mode, ["finite pages", "Limited Pages"] as const, "finite pages", "mode"),
    showDropdown: pickBoolean(rec.showDropdown, true, "showDropdown"),
    showTotalPages: pickBoolean(rec.showTotalPages, true, "showTotalPages"),
    onPageChange: typeof rec.onPageChange === "function" ? (rec.onPageChange as (page: number) => void) : undefined,
  };
}

function computePageWindow(current: number, total: number, mode: UIPaginationParams["mode"]): (number | "...")[] {
  if (total <= 5 || mode === "Limited Pages") {
    const count = Math.min(total, 5);
    const start = Math.max(1, Math.min(current - 2, total - count + 1));
    return Array.from({ length: count }, (_, idx) => start + idx);
  }
  const pages = new Set<number>([1, total, current, Math.max(1, current - 1), Math.min(total, current + 1)]);
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "...")[] = [];
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) out.push("...");
    out.push(sorted[i]);
  }
  return out;
}

let paginationSeq = 0;

export function createPagination(params: Partial<UIPaginationParams> = {}): HTMLElement {
  const parsed = parsePaginationParams(params);
  paginationSeq += 1;
  const selectId = `ui-page-jump-${paginationSeq}`;

  let current = parsed.currentPage;
  let total = parsed.totalPages;

  const nav = document.createElement("nav");
  nav.className = "ui-pagination";
  nav.setAttribute("aria-label", "Pagination");

  const bar = document.createElement("div");
  bar.className = "ui-pagination__bar";

  const status = document.createElement("p");
  status.className = "ui-pagination__status";

  const goTo = (next: number) => {
    const clamped = Math.max(1, Math.min(total, next));
    if (clamped === current) return;
    current = clamped;
    renderBar();
    parsed.onPageChange?.(current);
  };

  const renderBar = () => {
    bar.replaceChildren();

    const prev = document.createElement("button");
    prev.type = "button";
    prev.className = "ui-page-btn";
    prev.textContent = "Prev";
    prev.disabled = current <= 1;
    prev.addEventListener("click", () => goTo(current - 1));
    bar.append(prev);

    for (const slot of computePageWindow(current, total, parsed.mode)) {
      if (slot === "...") {
        const dots = document.createElement("span");
        dots.className = "ui-pagination__ellipsis";
        dots.setAttribute("aria-hidden", "true");
        dots.textContent = "...";
        bar.append(dots);
      } else {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "ui-page-btn";
        btn.textContent = String(slot);
        btn.setAttribute("aria-label", `Page ${slot}`);
        if (slot === current) btn.setAttribute("aria-current", "page");
        btn.addEventListener("click", () => goTo(slot));
        bar.append(btn);
      }
    }

    if (parsed.showDropdown && total > 1) {
      const label = document.createElement("label");
      label.htmlFor = selectId;
      label.className = "visually-hidden";
      label.textContent = "Jump to page";

      const select = document.createElement("select");
      select.id = selectId;
      select.className = "ui-pagination__jump ui-focusable";
      const cap = Math.min(total, 50);
      for (let p = 1; p <= cap; p++) {
        const opt = document.createElement("option");
        opt.value = String(p);
        opt.textContent = String(p);
        opt.selected = p === current;
        select.append(opt);
      }
      select.addEventListener("change", () => goTo(Number(select.value)));
      bar.append(label, select);
    }

    const next = document.createElement("button");
    next.type = "button";
    next.className = "ui-page-btn";
    next.textContent = "Next";
    next.disabled = current >= total;
    next.addEventListener("click", () => goTo(current + 1));
    bar.append(next);

    status.textContent = `Page ${current} of ${total}`;
    status.hidden = !parsed.showTotalPages;
  };

  renderBar();
  nav.append(bar, status);
  (nav as HTMLElement & { setPagination?: (page: number, pages: number) => void }).setPagination = (page, pages) => {
    total = Math.max(1, pages);
    current = Math.max(1, Math.min(total, page));
    renderBar();
  };
  return nav;
}

export function registerNavigationMolecules(registry: UIRegistry): void {
  registry.register<UIBreadcrumbsParams>("UI-MOLECULE-BREADCRUMBS", {
    metadata: {
      layer: "molecule",
      name: "HUD Breadcrumbs",
      figmaNodeId: "133:965",
      description: "Ordered breadcrumb trail with arrow-right-02 separators and 6+ level ellipsis collapse.",
    },
    variants: {
      fourLevels: parseBreadcrumbsParams({}),
      sixCollapsed: parseBreadcrumbsParams({
        items: [
          { label: "Colony", href: "/" },
          { label: "Ring A", href: "/catalog" },
          { label: "Sector 04", href: "/catalog" },
          { label: "Hydroponics", href: "/catalog" },
          { label: "Rack NW-05", href: "/catalog" },
          { label: "Harvest Stage" },
        ],
        collapseAfter: 5,
      }),
    },
    parse: parseBreadcrumbsParams,
    render: createBreadcrumbs,
  });

  registry.register<UIPaginationParams>("UI-MOLECULE-PAGINATION", {
    metadata: {
      layer: "molecule",
      name: "HUD Pagination",
      figmaNodeId: "134:540",
      description: "Prev/Next controls, Mars Crimson active page, ellipsis windowing, and page-jump select.",
    },
    variants: {
      limitedPages: parsePaginationParams({ currentPage: 3, totalPages: 5, mode: "Limited Pages" }),
      finitePages: parsePaginationParams({ currentPage: 1, totalPages: 12, mode: "finite pages" }),
    },
    parse: parsePaginationParams,
    render: createPagination,
  });
}
