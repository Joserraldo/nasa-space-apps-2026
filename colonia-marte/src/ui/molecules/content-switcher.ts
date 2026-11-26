import type { UIRegistry } from "../registry";
import { asRecord, pickString } from "../types";

let switcherSeq = 0;

export interface UIContentSwitcherItem {
  id: string;
  label: string;
  panelText?: string;
}

export interface UIContentSwitcherParams {
  ariaLabel: string;
  items: readonly UIContentSwitcherItem[];
  selectedId: string;
  onSelect?: (id: string) => void;
}

export function parseContentSwitcherParams(input: unknown): UIContentSwitcherParams {
  const rec = asRecord(input);
  const rawItems = Array.isArray(rec.items) && rec.items.length >= 2
    ? rec.items
    : [
        { id: "all", label: "All", panelText: "Showing all registered colony modules." },
        { id: "station", label: "Station", panelText: "Pressurized interior walls, floors, and doors." },
        { id: "mars", label: "Mars", panelText: "Basalt boulders, layered pillars, and mesas." },
        { id: "props", label: "Props", panelText: "Dispensers, racks, airlock panels, and crops." },
      ];
  const items = rawItems.map((entry, idx) => {
    const obj = asRecord(entry);
    return {
      id: pickString(obj.id, `tab-${idx}`, "items.id"),
      label: pickString(obj.label, `Tab ${idx + 1}`, "items.label"),
      panelText: typeof obj.panelText === "string" ? obj.panelText : undefined,
    };
  });
  return {
    ariaLabel: pickString(rec.ariaLabel, "Content category", "ariaLabel"),
    items,
    selectedId: pickString(rec.selectedId, items[0].id, "selectedId"),
    onSelect: typeof rec.onSelect === "function" ? (rec.onSelect as (id: string) => void) : undefined,
  };
}

export function createContentSwitcher(params: Partial<UIContentSwitcherParams> = {}): HTMLElement {
  const parsed = parseContentSwitcherParams(params);
  switcherSeq += 1;
  const baseId = `ui-cs-${switcherSeq}`;

  const wrap = document.createElement("div");
  wrap.className = "ui-switcher-wrap";

  const tablist = document.createElement("div");
  tablist.className = "ui-switcher";
  tablist.setAttribute("role", "tablist");
  tablist.setAttribute("aria-label", parsed.ariaLabel);

  const hasPanels = parsed.items.some(item => item.panelText !== undefined);
  const tabs: HTMLButtonElement[] = [];
  const panels: HTMLElement[] = [];

  const activate = (targetId: string, moveFocus = false) => {
    parsed.items.forEach((item, index) => {
      const active = item.id === targetId;
      const tab = tabs[index];
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && moveFocus) tab.focus();
      const panel = panels[index];
      if (panel) {
        if (active) panel.removeAttribute("hidden");
        else panel.setAttribute("hidden", "until-found");
      }
    });
    parsed.onSelect?.(targetId);
  };

  parsed.items.forEach((item, index) => {
    const tabId = `${baseId}-tab-${item.id}`;
    const panelId = `${baseId}-panel-${item.id}`;
    const active = item.id === parsed.selectedId;

    const button = document.createElement("button");
    button.type = "button";
    button.id = tabId;
    button.className = "ui-tab";
    button.setAttribute("role", "tab");
    button.setAttribute("aria-selected", String(active));
    button.tabIndex = active ? 0 : -1;
    button.textContent = item.label;

    button.addEventListener("click", () => activate(item.id, false));
    button.addEventListener("keydown", event => {
      let nextIndex = -1;
      if (event.key === "ArrowRight") nextIndex = (index + 1) % parsed.items.length;
      else if (event.key === "ArrowLeft") nextIndex = (index - 1 + parsed.items.length) % parsed.items.length;
      else if (event.key === "Home") nextIndex = 0;
      else if (event.key === "End") nextIndex = parsed.items.length - 1;
      if (nextIndex >= 0) {
        event.preventDefault();
        activate(parsed.items[nextIndex].id, true);
      }
    });

    tabs.push(button);
    tablist.append(button);

    if (hasPanels) {
      const panel = document.createElement("div");
      panel.id = panelId;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", tabId);
      if (!active) panel.setAttribute("hidden", "until-found");
      /* Sync tab state when browser Find-in-Page reveals a hidden="until-found" panel (modern-web-guidance: tabs) */
      panel.addEventListener("beforematch", () => activate(item.id, false));

      const inner = document.createElement("div");
      inner.className = "ui-tab-panel__inner";
      inner.textContent = item.panelText ?? "";
      panel.append(inner);
      panels.push(panel);
    }
  });

  wrap.append(tablist, ...panels);
  return wrap;
}

export function registerContentSwitcherMolecule(registry: UIRegistry): void {
  registry.register<UIContentSwitcherParams>("UI-MOLECULE-CONTENT-SWITCHER", {
    metadata: {
      layer: "molecule",
      name: "Segmented Content Switcher",
      figmaNodeId: "4042:548",
      description: "Chamfered segmented tab bar with roving keyboard focus, underline indicator, and until-found panels.",
    },
    variants: {
      twoWay: parseContentSwitcherParams({
        items: [
          { id: "first", label: "First", panelText: "Primary habitat diagnostics." },
          { id: "last", label: "Last", panelText: "Secondary life-support diagnostics." },
        ],
        selectedId: "first",
      }),
      fourWay: parseContentSwitcherParams({ selectedId: "station" }),
      fivePlus: parseContentSwitcherParams({
        items: [
          { id: "all", label: "All" }, { id: "arch", label: "Arch" },
          { id: "mars", label: "Mars" }, { id: "furn", label: "Furn" },
          { id: "props", label: "Props" }, { id: "sets", label: "Sets" },
        ],
        selectedId: "all",
      }),
    },
    parse: parseContentSwitcherParams,
    render: createContentSwitcher,
  });
}
