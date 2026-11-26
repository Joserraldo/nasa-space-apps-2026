import {
  createButton,
  createNavbar,
  createTag,
  createToggle,
  type UINavItem,
} from "../ui";

export function shellNavItems(activePath: string): UINavItem[] {
  return [
    { label: "Base scene", href: "/", current: activePath === "" || activePath === "/" },
    { label: "Catalog", href: "/catalog", current: activePath === "/catalog" },
    { label: "Materials", href: "/materials", current: activePath === "/materials" },
    { label: "Vertex AO", href: "/ao", current: activePath === "/ao" },
    { label: "Environment", href: "/environment", current: activePath === "/environment" },
    { label: "Crew", href: "/crew", current: activePath === "/crew" },
    { label: "Canteen", href: "/room/canteen", current: activePath === "/room/canteen" },
    { label: "Exterior", href: "/exterior-pilot", current: activePath === "/exterior-pilot" },
    { label: "UI Kit", href: "/ui", current: activePath === "/ui" },
  ];
}

export function createShell(catalog: boolean) {
  const app = document.getElementById("app")!;
  app.replaceChildren();

  const activePath = location.pathname.replace(/\/$/, "") || "/";
  const title = catalog ? "Kit catalog" : "Kit foundation";
  const description = catalog
    ? "Every registered variant and seven primitives, framed individually at their real scale."
    : "Typed fixtures and shared rendering. One unit equals one meter.";

  const skip = document.createElement("a");
  skip.href = "#viewport";
  skip.className = "visually-hidden ui-skip-link";
  skip.textContent = "Skip to 3D viewport";

  const header = createNavbar({
    eyebrow: "MARS COLONY / VISUAL SYSTEMS",
    title,
    ariaLabel: "Preview pages",
    items: shellNavItems(activePath),
  });

  const main = document.createElement("main");
  const aside = document.createElement("aside");

  const sideEyebrow = document.createElement("p");
  sideEyebrow.className = "eyebrow";
  sideEyebrow.textContent = "WS0 / WS1 ENGINEERING PREVIEW";

  const sideHeading = document.createElement("h2");
  sideHeading.textContent = catalog ? "Primitives & fixtures" : "A shared starting point";

  const sideDesc = document.createElement("p");
  sideDesc.textContent = description;

  const badgeRow = document.createElement("div");
  badgeRow.className = "shell-badges";
  badgeRow.append(
    createTag({ label: catalog ? "Catalog HUD" : "Scene HUD", type: "Primary", shape: "Cut Edge" }),
    createTag({ label: "1 unit = 1 m", type: "Information", shape: "Cut Edge" }),
  );

  const rule = document.createElement("div");
  rule.className = "rule";

  const sectionHeading = document.createElement("h2");
  sectionHeading.textContent = catalog ? "Asset index" : "Navigation";

  const controls = document.createElement("div");
  controls.id = "controls";
  controls.hidden = catalog;

  const modes = document.createElement("div");
  modes.className = "modes";
  const orbit = createButton({
    id: "orbit",
    label: "Orbit",
    style: "Secondary",
    size: "Medium",
    ariaPressed: true,
  });
  const walk = createButton({
    id: "walk",
    label: "Walk",
    style: "Secondary",
    size: "Medium",
    ariaPressed: false,
  });
  modes.append(orbit, walk);

  const tour = createButton({
    id: "tour",
    label: "Play camera demo",
    style: "Primary",
    size: "Medium",
    prefixIcon: "arrow-right-04",
    hidden: true,
  });

  const reset = createButton({
    id: "reset-view",
    label: "Reset view",
    style: "Single Stroke",
    size: "Medium",
    prefixIcon: "scan-frame-01",
  });

  const navHelp = document.createElement("p");
  navHelp.id = "navigation-help";
  navHelp.textContent =
    "Orbit: drag to rotate; scroll to zoom. Walk: WASD or arrows, drag to look, or use the joystick. " +
    "Eye height: 1.3 m above the slab. Tab leaves the canvas.";

  const balancedToggle = createToggle({
    id: "balanced",
    label: "Balanced resolution",
    className: "quality",
  });
  const balanced = balancedToggle.querySelector("input") as HTMLInputElement;

  controls.append(modes, tour, reset, navHelp, balancedToggle);

  const list = document.createElement("ul");
  list.id = "asset-index";
  list.setAttribute("role", "list");
  list.hidden = !catalog;

  const palettePreview = document.createElement("div");
  palettePreview.id = "palette-preview";

  const scopeNote = document.createElement("p");
  scopeNote.className = "scope-note";
  scopeNote.textContent = "Technical fixtures. Production geometry and environments await their own gates.";

  aside.append(
    sideEyebrow,
    sideHeading,
    sideDesc,
    badgeRow,
    rule,
    sectionHeading,
    controls,
    list,
    palettePreview,
    scopeNote,
  );

  const previewColumn = document.createElement("div");
  previewColumn.className = "preview-column";

  const viewport = document.createElement("div");
  viewport.id = "viewport";
  const fade = document.createElement("div");
  fade.id = "fade";
  fade.setAttribute("aria-hidden", "true");

  const joystick = document.createElement("div");
  joystick.id = "joystick";
  joystick.hidden = true;
  joystick.setAttribute("aria-label", "Walking joystick");
  joystick.setAttribute("role", "group");
  joystick.setAttribute("aria-describedby", "navigation-help");
  const knob = document.createElement("span");
  knob.className = "joystick-knob";
  joystick.append(knob);
  viewport.append(fade, joystick);

  const footer = document.createElement("footer");
  const metrics = document.createElement("div");
  metrics.id = "metrics";
  metrics.textContent = "Preparing renderer...";
  const status = document.createElement("span");
  status.id = "mode-status";
  status.textContent = catalog ? "CATALOG" : "ORBIT";
  footer.append(metrics, status);

  previewColumn.append(viewport, footer);
  main.append(aside, previewColumn);
  app.append(skip, header, main);

  return {
    viewport,
    metrics,
    list,
    joystick,
    status,
    fade,
    orbit,
    walk,
    tour,
    reset,
    balanced,
  };
}
