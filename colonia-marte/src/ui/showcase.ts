import "./showcase.css";
import {
  createBreadcrumbs,
  createButton,
  createContentSwitcher,
  createNavbar,
  createSearchBar,
  createTag,
  createUIRegistry,
  DEFAULT_APP_NAV_ITEMS,
  ensureToastRegion,
  showToast,
  TOAST_TYPES,
  type RegisteredUIComponent,
  type UILayer,
  type UIRegistry,
  type UITagType,
} from "./index";

const LAYER_TAG_TYPE: Record<UILayer, UITagType> = {
  foundation: "Neutral",
  atom: "Information",
  molecule: "Warning",
  organism: "Primary",
};

function buildComponentCard(registry: UIRegistry, entry: RegisteredUIComponent): HTMLElement {
  const card = document.createElement("section");
  card.id = `entry-${entry.id.toLowerCase()}`;
  card.className = "ui-component-card";
  card.dataset.layer = entry.metadata.layer;
  card.dataset.searchText = `${entry.id} ${entry.metadata.name} ${entry.metadata.figmaNodeId} ${entry.metadata.description}`
    .toLowerCase();

  const head = document.createElement("div");
  head.className = "ui-component-card__head";

  const titleGroup = document.createElement("div");
  const title = document.createElement("h3");
  title.className = "ui-component-card__title";
  title.textContent = `${entry.metadata.name} (${entry.id})`;
  const desc = document.createElement("p");
  desc.className = "ui-component-card__desc";
  desc.textContent = entry.metadata.description;
  titleGroup.append(title, desc);

  const meta = document.createElement("div");
  meta.className = "ui-component-card__meta";
  meta.append(
    createTag({ label: entry.metadata.layer, type: LAYER_TAG_TYPE[entry.metadata.layer], shape: "Cut Edge" }),
    createTag({ label: `Figma ${entry.metadata.figmaNodeId}`, type: "Neutral", shape: "Rectangle" }),
  );
  head.append(titleGroup, meta);

  const grid = document.createElement("div");
  grid.className = "ui-variants-grid";
  const isWide = entry.metadata.layer === "foundation" || entry.metadata.layer === "organism";

  for (const [variantName, variantParams] of Object.entries(entry.variants)) {
    const box = document.createElement("div");
    box.className = `ui-variant-box ${isWide ? "ui-variant-box--wide" : ""}`.trim();
    const name = document.createElement("span");
    name.className = "ui-variant-name";
    name.textContent = `Variant · ${variantName}`;
    box.append(name, registry.render(entry.id, variantParams));
    grid.append(box);
  }

  card.append(head, grid);
  return card;
}

export function mountUIShowcase(): void {
  document.title = "Sci-fi UI Kit | Mars Colony";
  const app = document.getElementById("app")!;
  app.replaceChildren();

  const registry = createUIRegistry();
  const entries = registry.entries();

  const skip = document.createElement("a");
  skip.href = "#ui-showcase-main";
  skip.className = "visually-hidden ui-skip-link";
  skip.textContent = "Skip to main content";

  const navbar = createNavbar({
    eyebrow: "SCI-FI UI KIT / ATOMIC REGISTRY",
    title: "Design System & HUD Kit",
    items: DEFAULT_APP_NAV_ITEMS("/ui"),
  });

  const layout = document.createElement("div");
  layout.className = "ui-showcase-layout";

  const sidebar = document.createElement("aside");
  sidebar.className = "ui-showcase-sidebar";
  sidebar.setAttribute("aria-label", "Design system navigation and filters");

  const breadcrumbs = createBreadcrumbs({
    items: [
      { label: "Home", href: "/" },
      { label: "Catalog", href: "/catalog" },
      { label: "UI Kit" },
    ],
  });

  const badges = document.createElement("div");
  badges.className = "ui-showcase-badges";
  badges.append(
    createTag({ label: `${entries.length} Modules`, type: "Primary", shape: "Cut Edge" }),
    createTag({ label: "39 Icons", type: "Information", shape: "Cut Edge" }),
    createTag({ label: "WCAG AA", type: "Success", shape: "Rectangle" }),
  );

  let activeLayer: "all" | UILayer = "all";
  let activeQuery = "";
  const cards: HTMLElement[] = [];
  const indexLinks = new Map<string, HTMLLIElement>();

  const applyFilters = () => {
    for (const card of cards) {
      const matchesLayer = activeLayer === "all" || card.dataset.layer === activeLayer;
      const matchesQuery = !activeQuery || (card.dataset.searchText ?? "").includes(activeQuery);
      const visible = matchesLayer && matchesQuery;
      card.hidden = !visible;
      const li = indexLinks.get(card.id);
      if (li) li.hidden = !visible;
    }
  };

  const switcher = createContentSwitcher({
    ariaLabel: "Filter by Atomic Design layer",
    items: [
      { id: "all", label: "All" },
      { id: "foundation", label: "Base" },
      { id: "atom", label: "Atoms" },
      { id: "molecule", label: "Mols" },
      { id: "organism", label: "Orgs" },
    ],
    selectedId: "all",
    onSelect(id) {
      activeLayer = id as "all" | UILayer;
      applyFilters();
    },
  });

  const search = createSearchBar({
    mode: "Expanded",
    label: "Filter UI components",
    placeholder: "Search ID or name...",
    buttonLabel: "Find",
    onSearch(query) {
      activeQuery = query.toLowerCase();
      applyFilters();
    },
  });

  const toastHeading = document.createElement("h2");
  toastHeading.textContent = "Live Toast Stack";
  const toastGrid = document.createElement("div");
  toastGrid.className = "ui-toast-triggers";
  for (const toastType of TOAST_TYPES) {
    const btn = createButton({
      label: toastType,
      style: "Secondary",
      size: "Medium",
      onClick() {
        showToast({
          type: toastType,
          title: `${toastType} Telemetry Alert`,
          description: `Dispatched live ${toastType.toLowerCase()} HUD notification from /ui showcase.`,
          durationMs: 5500,
          triggerElement: btn,
        });
      },
    });
    toastGrid.append(btn);
  }

  const indexHeading = document.createElement("h2");
  indexHeading.textContent = "Registered Index";
  const indexList = document.createElement("ul");
  indexList.className = "ui-showcase-index";
  indexList.setAttribute("role", "list");

  const main = document.createElement("main");
  main.id = "ui-showcase-main";
  main.className = "ui-showcase-main";
  main.tabIndex = -1;

  const hero = document.createElement("header");
  hero.className = "ui-showcase-hero";
  const heroCopy = document.createElement("div");
  const heroEyebrow = document.createElement("p");
  heroEyebrow.className = "eyebrow";
  heroEyebrow.textContent = "FIGMA FH0MXUSpEi0wd9PBO0Oc63 · ATOMIC DESIGN";
  const heroTitle = document.createElement("h2");
  heroTitle.textContent = "Mars Colony Sci-fi UI Registry";
  const heroDesc = document.createElement("p");
  heroDesc.textContent =
    "Modular vanilla TypeScript and CSS custom-property components built from the Sci-fi UI Kit, " +
    "validated on registration and wired with progressive web accessibility patterns.";
  heroCopy.append(heroEyebrow, heroTitle, heroDesc);
  hero.append(heroCopy);
  main.append(hero);

  for (const entry of entries) {
    const card = buildComponentCard(registry, entry);
    cards.push(card);
    main.append(card);

    const li = document.createElement("li");
    const link = document.createElement("a");
    link.href = `#${card.id}`;
    const nameSpan = document.createElement("span");
    nameSpan.textContent = entry.metadata.name;
    const layerSpan = document.createElement("span");
    layerSpan.textContent = entry.metadata.layer.slice(0, 4).toUpperCase();
    link.append(nameSpan, layerSpan);
    li.append(link);
    indexList.append(li);
    indexLinks.set(card.id, li);
  }

  sidebar.append(breadcrumbs, badges, switcher, search, toastHeading, toastGrid, indexHeading, indexList);
  layout.append(sidebar, main);
  app.append(skip, navbar, layout);
  ensureToastRegion();

  window.__uiKit = { registry, count: entries.length };
}

declare global {
  interface Window {
    __uiKit?: {
      registry: UIRegistry;
      count: number;
    };
  }
}
