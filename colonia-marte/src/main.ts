import "./ui/foundation/tokens.css";
import "./ui/atoms/hud-atoms.css";
import "./ui/organisms/loading.css";
import { MARS_FACTS } from "./ui/content/mars-facts";
import { createLoading } from "./ui/organisms/loading";
import { DEFAULT_SETTINGS, loadSettings } from "./ui/state/settings";

function waitForLoaderPaint(): Promise<void> {
  if (!globalThis.PerformanceObserver?.supportedEntryTypes.includes("paint") || document.hidden) {
    return new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  }
  return new Promise(resolve => {
    function finish() {
      clearTimeout(fallback);
      observer.disconnect();
      resolve();
    }
    const observer = new PerformanceObserver(entries => {
      if (entries.getEntriesByName("first-contentful-paint").length > 0) finish();
    });
    // Paint reporting can be throttled when a browser window loses visibility.
    const fallback = setTimeout(finish, 1000);
    observer.observe({ type: "paint", buffered: true });
  });
}

const path = location.pathname.replace(/\/$/, "");
let menu;
if (path === "/menu") {
  performance.mark("menu-load-start");
  let storage: Storage | undefined;
  try { storage = localStorage; } catch { /* Storage may be unavailable. */ }
  const settings = storage ? loadSettings(storage) : DEFAULT_SETTINGS;
  document.documentElement.classList.toggle("ui-big-text", settings.bigText);
  const fact = MARS_FACTS[Math.floor(Math.random() * MARS_FACTS.length)];
  const loading = createLoading(fact).root;
  document.body.append(loading);
  menu = { loading, settings, storage };
  performance.mark("menu-loader-mounted");
  await waitForLoaderPaint();
  performance.mark("menu-content-request");
}

await Promise.all([import("./ui/index"), import("./style.css")]);

if (path === "/ui") {
  const { mountUIShowcase } = await import("./ui/showcase");
  mountUIShowcase();
} else if (path === "/hud-preview") {
  const { mountHudPreview } = await import("./scenes/hud-preview");
  mountHudPreview();
} else if (menu) {
  const { mountMenuPreview } = await import("./scenes/menu-preview");
  await mountMenuPreview(menu);
} else if (path === "/room/canteen") {
  const { mountCanteenRoom } = await import("./scenes/canteen-room");
  mountCanteenRoom();
} else if (path === "/room/nw-05") {
  const { mountAirlockRoom } = await import("./scenes/nw05-room");
  mountAirlockRoom();
} else if (path === "/room/nw-01") {
  const { mountServerRoom } = await import("./scenes/nw01-room");
  mountServerRoom();
} else if (path === "/room/nw-02") {
  const { mountGreenhouseRoom } = await import("./scenes/nw02-room");
  mountGreenhouseRoom();
} else if (path === "/room/nw-13") {
  const { mountCommsRoom } = await import("./scenes/nw13-room");
  mountCommsRoom();
} else if (path === "/room/nw-14") {
  const { mountShelterRoom } = await import("./scenes/nw14-room");
  mountShelterRoom();
} else if (path === "/room/nw-15") {
  const { mountBridgeRoom } = await import("./scenes/nw15-room");
  mountBridgeRoom();
} else if (path === "/room/nw-16") {
  const { mountShipCommonRoom } = await import("./scenes/nw16-room");
  mountShipCommonRoom();
} else if (path === "/room/nw-17") {
  const { mountShipShelterRoom } = await import("./scenes/nw17-room");
  mountShipShelterRoom();
} else if (path === "/exterior-pilot") {
  const { mountExteriorPilot } = await import("./scenes/exterior-pilot");
  await mountExteriorPilot();
} else if (path === "/space") {
  const { mountSpace } = await import("./scenes/space");
  mountSpace();
} else if (path === "/diagnostics/k1") {
  const { mountK1Review } = await import("./scenes/k1-review");
  mountK1Review();
} else if (path === "/diagnostics/palette") {
  const { mountPaletteProbe } = await import("./scenes/palette-probe");
  mountPaletteProbe();
} else if (path === "/crew") {
  const { mountCrewReview } = await import("./scenes/crew-review");
  await mountCrewReview();
} else if (path === "/environment") {
  const { mountEnvironmentReview } = await import("./environment/review");
  await mountEnvironmentReview();
} else if (path === "/ao") {
  const { mountAOReview } = await import("./scenes/ao-review");
  mountAOReview();
} else if (path === "/materials") {
  const { mountMaterialsReview } = await import("./materials/review");
  mountMaterialsReview();
} else {
  const { mountFoundation } = await import("./core/foundation");
  mountFoundation(path === "/catalog");
}
